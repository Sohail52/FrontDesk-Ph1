import React, { useEffect, useState } from "react";

// Displays and resolves pending help requests
function PendingRequests() {
  const [requests, setRequests] = useState([]);
  const [answers, setAnswers] = useState({});

  // Fetch all help requests from backend
  const fetchRequests = () => {
    fetch("http://localhost:5000/api/supervisor/requests")
      .then(res => res.json())
      .then(setRequests)
      .catch(console.log);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Update answer input
  const handleChange = (id, value) => {
    setAnswers({ ...answers, [id]: value });
  };

  // Submit answer to resolve request
  const handleSubmit = (id) => {
    const answer = answers[id];
    if (!answer) return alert("Please enter an answer");

    fetch("http://localhost:5000/api/supervisor/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id, answer }),
    })
      .then(() => {
        alert("Request resolved!");
        fetchRequests(); // refresh list
      })
      .catch(console.log);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Pending Help Requests</h1>
      {requests.length === 0 && <p>No pending requests!</p>}
      {requests.map((req) => (
        <div
          key={req.id}
          style={{ border: "1px solid #ccc", padding: "1rem", marginBottom: "1rem" }}
        >
          <p><strong>Caller ID:</strong> {req.callerId}</p>
          <p><strong>Question:</strong> {req.question}</p>
          <input
            type="text"
            placeholder="Enter answer..."
            value={answers[req.id] || ""}
            onChange={(e) => handleChange(req.id, e.target.value)}
            style={{ width: "60%", marginRight: "1rem" }}
          />
          <button onClick={() => handleSubmit(req.id)}>Submit</button>
        </div>
      ))}
    </div>
  );
}

export default PendingRequests;
