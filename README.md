# Human-in-the-Loop AI Helpdesk

## 🚀 Project Overview

Human-in-the-Loop is an digital helpdesk system that automates customer query handling. It instantly answers known questions using a dynamic knowledge base and escalates unknown queries to a human supervisor. The system learns over time by updating its knowledge base with supervisor-provided answers, improving its accuracy and responsiveness with each interaction.


### 🏗 Tech Stack

## Tech Stack
- **Backend**: Node.js, Express.js
- **Frontend**: React.js
- **Database**: Firebase Firestore
- **AI Simulation**: LiveKit 

  
### Features

- **AI agent can answer known questions immediately.

- **If the AI doesn’t know the answer, it escalates to a human supervisor.

- **Supervisor resolves the query via a simple web UI.

- **AI updates its knowledge base automatically after a supervisor response.

- **Firestore (Firebase) stores all questions, help requests, and learned answers.

---

## 🧩 Architecture
```
Caller (POST /api/ask)
        │
        ▼
     AI Agent
        │
        ├─ Known question → Responds directly
        │
        └─ Unknown question → Creates helpRequest → Firebase Firestore
                                │
                                ▼
                    Supervisor UI (Pending Requests)
                                │
                                └─ Resolves → Updates knowledgeBase
                                            │
                                            ▼
                                     AI responds to caller

                                     
```

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/your-username/FrontDesk-Ph1.git
cd FrontDesk
```

### 2. Install backend dependencies
```
cd backend
npm install
```

### 3. Install frontend dependencies
```
cd ../frontend
npm install
```
### 4. Configure Firebase
```
Create a Firebase project.

Add a Firestore database with two collections:

knowledgeBase → stores learned Q&A

helpRequests → stores pending/resolved requests

```
### 5. Run backend
```
cd ../backend
node server.js
```
###6. Run frontend
```
cd ../frontend
npm start
```



