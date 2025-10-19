// backend/services/kbService.js
// Firestore knowledge base helper functions

import { db } from "../firebase.js";

// normalize question for consistent storage/lookup
function normalize(q) {
  return q.toLowerCase().trim();
}

// get answer for a question from KB
export async function getAnswerFromKnowledgeBase(question) {
  const key = normalize(question);
  try {
    const docRef = db.collection("knowledgeBase").doc(key);
    const docSnap = await docRef.get();
    if (docSnap.exists) return docSnap.data().answer;
    return null;
  } catch (err) {
    console.error("KB lookup error:", err);
    return null;
  }
}

// save or update a question-answer pair in KB
export async function saveAnswerToKnowledgeBase(question, answer) {
  const key = normalize(question);
  await db.collection("knowledgeBase").doc(key).set({
    question: key,
    answer,
    updatedAt: new Date().toISOString(),
  });
}
