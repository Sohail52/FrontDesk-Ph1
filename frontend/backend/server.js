import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config({ path: "../livekit-ai-agent/.env" });

import db from "./utils/firebase.js";
import { HelpRequest } from "./models/helpRequest.js";

import WebSocket from "ws";
import wrtc from "wrtc";
import { AccessToken } from "livekit-server-sdk";
import { Room } from "livekit-client";
import fetch from "node-fetch";

// Polyfills so LiveKit works in Node (normally browser APIs)
globalThis.WebSocket = WebSocket;
globalThis.RTCPeerConnection = wrtc.RTCPeerConnection;
globalThis.RTCSessionDescription = wrtc.RTCSessionDescription;
globalThis.RTCIceCandidate = wrtc.RTCIceCandidate;
globalThis.MediaStream = wrtc.MediaStream;
globalThis.navigator = { userAgent: "node" };
globalThis.window = globalThis;

const app = express();
app.use(cors());
app.use(express.json());

// Initialize default knowledge base in Firestore if not present
const initializeKnowledgeBase = async () => {
  const kbRef = db.collection("knowledgeBase").doc("default");
  const kbDoc = await kbRef.get();
  if (!kbDoc.exists) {
    await kbRef.set({
      "what are your timings": "We’re open from 9 AM to 7 PM, Monday to Saturday.",
      "where are you located": "We’re located at MG Road, Bangalore.",
    });
  }
};
await initializeKnowledgeBase();

// Handles incoming user questions and returns AI or supervisor response
app.post("/api/ask", async (req, res) => {
  const { question, callerId } = req.body;
  if (!question) return res.status(400).json({ error: "Missing question" });

  const normalized = question.toLowerCase().trim();
  console.log(`📞 Incoming question from ${callerId}: ${question}`);

  // Try finding answer in knowledge base
  const kbDoc = await db.collection("knowledgeBase").doc(normalized).get();
  if (kbDoc.exists) {
    const answer = kbDoc.data().answer;
    console.log("🤖 AI Response:", answer);
    return res.json({ status: "answered", answer });
  }

  // Create a help request for supervisor if answer not found
  const id = Date.now().toString();
  const reqObj = {
    id,
    question,
    normalizedQuestion: normalized,
    callerId: callerId || "anonymous",
    status: "pending",
    timestamp: new Date().toISOString(),
    timeoutMinutes: 2,
  };

  try {
    await db.collection("helpRequests").doc(id).set(reqObj);
    console.log(`📩 Supervisor needed for: "${question}" (id: ${id})`);
    return res.json({
      status: "needs_help",
      message: "Let me check with my supervisor and get back to you.",
      requestId: id,
    });
  } catch (err) {
    console.error("Error saving help request:", err);
    return res.status(500).json({ error: "Failed to create help request" });
  }
});

// Allows supervisor to resolve pending requests and update the knowledge base
app.post("/api/supervisor/resolve", async (req, res) => {
  const { requestId, answer } = req.body;
  if (!requestId || !answer) return res.status(400).json({ error: "requestId and answer required" });

  const reqRef = db.collection("helpRequests").doc(requestId);
  const doc = await reqRef.get();
  if (!doc.exists) return res.status(404).json({ message: "Request not found" });

  const request = doc.data();

  await reqRef.update({
    status: "resolved",
    answer,
    resolvedAt: new Date().toISOString(),
  });

  // Save resolved answer to knowledge base for future use
  const normalized = (request.normalizedQuestion || request.question).toLowerCase().trim();
  await db.collection("knowledgeBase").doc(normalized).set({
    question: normalized,
    answer,
    createdAt: new Date().toISOString(),
  });

  console.log(`📞 AI to ${request.callerId}: My supervisor says "${answer}"`);
  return res.json({
    message: "Request resolved and knowledge base updated",
    request: { ...request, status: "resolved", answer },
  });
});

// Returns all help requests sorted by latest first
app.get("/api/supervisor/requests", async (req, res) => {
  try {
    const snap = await db.collection("helpRequests").orderBy("timestamp", "desc").get();
    const helpRequests = snap.docs.map((d) => d.data());
    res.json(helpRequests);
  } catch (err) {
    console.error("Error fetching help requests:", err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// Returns the entire knowledge base as a simple question-answer map
app.get("/api/knowledgebase", async (req, res) => {
  try {
    const snap = await db.collection("knowledgeBase").get();
    const kb = {};
    snap.docs.forEach((d) => {
      const data = d.data();
      kb[data.question] = data.answer;
    });
    res.json(kb);
  } catch (err) {
    console.error("Error fetching knowledge base:", err);
    res.status(500).json({ error: "Failed to fetch KB" });
  }
});

// Checks every 30 seconds for pending help requests and marks them unresolved after timeout
setInterval(async () => {
  const now = Date.now();
  try {
    const snap = await db.collection("helpRequests").where("status", "==", "pending").get();
    for (const d of snap.docs) {
      const r = d.data();
      const expireAt = new Date(r.timestamp).getTime() + (r.timeoutMinutes || 5) * 60 * 1000;
      if (expireAt < now) {
        await d.ref.update({ status: "unresolved", resolvedAt: new Date().toISOString() });
        console.log(`⚠️ Request "${r.question}" from ${r.callerId} timed out and marked unresolved.`);
      }
    }
  } catch (error) {
    console.error("Error during periodic timeout check:", error);
  }
}, 30 * 1000);

// Generates a LiveKit access token for joining a specific room
app.get("/token", async (req, res) => {
  const { room, name } = req.query;
  if (!room || !name) return res.status(400).json({ error: "Room and name are required" });

  try {
    const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, { identity: name });
    at.addGrant({ roomJoin: true, room });

    const raw = await at.toJwt();
    const token = raw instanceof Buffer || raw instanceof Uint8Array ? Buffer.from(raw).toString("utf8") : String(raw);
    res.json({ token, roomName: room });
  } catch (error) {
    console.error("Error generating token:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// Starts the Express server and automatically connects AI agent to the LiveKit room
app.listen(5000, async () => {
  console.log("🚀 AI Agent running on port 5000");

  const joinRoomAsAgent = async () => {
    const room = new Room();
    try {
      // Fetch token for AI agent
      const res = await fetch("http://localhost:5000/token?room=SalonSupportRoom&name=AI_Agent");
      const { token } = await res.json();

      if (!token) {
        console.error("Failed to get token for AI_Agent:", { token });
        return;
      }

      // Connect AI agent to LiveKit
      const livekitUrl = process.env.LIVEKIT_URL || "ws://127.0.0.1:7880";
      await room.connect(livekitUrl, token);
      console.log("🤖 AI Agent joined the LiveKit room");

      // Log when participants join or media tracks are subscribed
      room.on("participantConnected", (p) => console.log(`👤 Caller joined: ${p.identity}`));
      room.on("trackSubscribed", (track, publication, participant) => console.log(`🎵 Subscribed to ${participant.identity}`));
    } catch (err) {
      console.error("AI agent failed to join room:", err);
    }
  };

  await joinRoomAsAgent();
});
