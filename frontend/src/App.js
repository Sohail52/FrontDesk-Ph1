import React, { useState, useEffect } from "react";

// Shared styles
const containerStyle = {
  maxWidth: 900,
  margin: "2rem auto",
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  borderRadius: 8,
  backgroundColor: "#fff",
  padding: "1.5rem",
};

const navStyle = { display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "1.5rem" };
const buttonStyle = (active) => ({
  padding: "0.5rem 1rem",
  fontSize: "1rem",
  fontWeight: active ? "bold" : "normal",
  cursor: "pointer",
  backgroundColor: active ? "#004aad" : "#e3e3e3",
  color: active ? "white" : "#333",
  border: "none",
  borderRadius: 4,
  transition: "background-color 0.3s",
});

const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { backgroundColor: "#004aad", color: "white", padding: "0.8rem", textAlign: "left" };
const tdStyle = { padding: "0.7rem", borderBottom: "1px solid #ddd" };
const actionButtonStyle = { padding: "0.3rem 0.7rem", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: "bold" };

function App() {
  const [tab, setTab] = useState("kb");
  return (
    <div style={containerStyle}>
      <nav style={navStyle}>
        <button style={buttonStyle(tab === "kb")} onClick={() => setTab("kb")}>Learned Answers</button>
        <button style={buttonStyle(tab === "pending")} onClick={() => setTab("pending")}>Pending Requests</button>
        <button style={buttonStyle(tab === "unresolved")} onClick={() => setTab("unresolved")}>Unresolved Requests</button>
      </nav>

      {tab === "kb" && <LearnedAnswers />}
      {tab === "pending" && <PendingRequests status="pending" />}
      {tab === "unresolved" && <PendingRequests status="unresolved" />}
    </div>
  );
}

// Shows the knowledge base
function LearnedAnswers() {
  const [kb, setKb] = useState({});

  useEffect(() => {
    fetch("http://localhost:5000/api/knowledgebase")
      .then((res) => res.json())
      .then(setKb)
      .catch(console.error);
  }, []);

  return (
    <section>
      <h1 style={{ color: "#004aad", marginBottom: "1rem" }}>Learned Answers</h1>
      <table style={tableStyle}>
        <thead>
          <tr><th style={thStyle}>Question</th><th style={thStyle}>Answer</th></tr>
        </thead>
        <tbody>
          {Object.entries(kb).map(([q, a], idx) => (
            <tr key={idx}><td style={tdStyle}>{q}</td><td style={tdStyle}>{a}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// Shows pending or unresolved requests
function PendingRequests({ status }) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/supervisor/requests")
      .then((res) => res.json())
      .then(setRequests)
      .catch(console.error);
  }, []);

  const filtered = requests.filter((r) => r.status === status);

  const resolveRequest = (id) => {
    const answer = prompt("Provide answer to resolve the request");
    if (!answer) return;
    fetch("http://localhost:5000/api/supervisor/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id, answer }),
    })
      .then(() => setRequests(requests.filter((r) => r.id !== id)))
      .catch(console.error);
  };

  return (
    <section>
      <h1 style={{ color: "#004aad", marginBottom: "1rem" }}>
        {status === "pending" ? "Pending Requests" : "Unresolved Requests"}
      </h1>
      <table style={tableStyle}>
        <thead>
          <tr><th style={thStyle}>Question</th><th style={thStyle}>Caller ID</th><th style={thStyle}>Status</th><th style={thStyle}>Actions</th></tr>
        </thead>
        <tbody>
          {filtered.map((req, idx) => (
            <tr key={idx}>
              <td style={tdStyle}>{req.question}</td>
              <td style={tdStyle}>{req.callerId}</td>
              <td style={tdStyle}>{req.status}</td>
              <td style={tdStyle}>
                {status === "pending" && <button style={actionButtonStyle} onClick={() => resolveRequest(req.id)}>Resolve</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default App;
