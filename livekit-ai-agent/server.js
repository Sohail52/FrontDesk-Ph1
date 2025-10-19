import express from "express";
import dotenv from "dotenv";
import { AccessToken } from "livekit-server-sdk";

dotenv.config();
const app = express();
app.use(express.json());

const salonKnowledge = {
  "timing": "We are open from 9 AM to 7 PM.",
  "services": "We offer haircuts, facials, and spa services.",
  "location": "We are located at MG Road, Bangalore.",
};

// Generate LiveKit room token
app.get("/token", async (req, res) => {
  const roomName = req.query.room || "SalonSupportRoom";
  const participantName = req.query.name || "Customer";

  try {
    const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
      identity: participantName,
    });

    at.addGrant({
      roomJoin: true, // Grant permission to join a room
      room: roomName, // Specify which room the participant is allowed to join
    });

    // await the Promise returned by toJwt()
    const raw = await at.toJwt();
    const token = (raw instanceof Buffer || raw instanceof Uint8Array) ? Buffer.from(raw).toString('utf8') : String(raw);

    if (!token) {
      console.log('Token generation failed.');
      return res.status(500).json({ error: 'Token generation failed' });
    }

    console.log('Generated Token:', token);
    res.json({ token, roomName });

  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Error generating token' });
  }
});

// Handle AI agent query
app.post("/ask", (req, res) => {
  const question = req.body.question?.toLowerCase();

  if (!question) return res.status(400).json({ error: "Missing question" });

  let foundKey = Object.keys(salonKnowledge).find((key) => question.includes(key));

  if (foundKey) {
    res.json({ answer: salonKnowledge[foundKey], helpNeeded: false });
  } else {
    // Trigger help request
    console.log("🚨 Requesting human help for:", question);
    res.json({
      message: "Let me check with my supervisor and get back to you.",
      helpNeeded: true,
      question,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ LiveKit AI agent running on port ${PORT}`);
});
