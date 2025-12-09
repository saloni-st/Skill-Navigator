# SkillNavigator

**AI-Powered Career Guidance Expert System**

SkillNavigator is a sophisticated career guidance platform that combines rule-based inference engines with Large Language Models (LLM) to provide personalized, actionable learning roadmaps for aspiring professionals in Web Development, Data Science, and Cybersecurity.

## 🚀 Project Overview

SkillNavigator bridges the gap between generic career advice and personalized mentorship. By analyzing a user's current skills, learning style, and time availability, it generates tailored curriculum paths using a hybrid AI approach:
1.  **Rule-Based Engine**: Determines the core path based on proven pedagogical patterns.
2.  **LLM Refinement (Groq)**: Enhances the path with specific resources, project ideas, and soft skill advice.

## 🏗️ Architecture

The project is built as a modern full-stack application:

*   **Frontend**: Next.js 14 (React), TypeScript, Tailwind CSS
*   **Backend**: Node.js, Express.js
*   **Database**: MongoDB (Atlas/Local)
*   **AI/ML**: Groq API (LLM), Custom Inference Engine
*   **Authentication**: JWT-based Auth

## ✨ Key Features

### Frontend
*   **Modern UI**: Professional dark-themed interface built with Tailwind CSS.
*   **Interactive Questionnaires**: Dynamic forms to capture user profile data.
*   **Real-time Results**: Instant visualization of career paths and confidence scores.
*   **Dashboard**: User session management and history.
*   **Admin Panel**: Tools for managing domain rules and viewing system analytics.

### Backend
*   **Hybrid AI Engine**: Combines deterministic rules with probabilistic LLM insights.
*   **Confidence Scoring**: Quantitative measure (0.0-1.0) of recommendation reliability.
*   **Secure API**: JWT authentication, rate limiting, and input validation.
*   **Scalable Architecture**: Modular service design (Controller-Service-Model pattern).

## 🛠️ Getting Started

### Prerequisites
*   Node.js 18+
*   MongoDB
*   Groq API Key (for AI features)

### 1. Clone the Repository
```bash
git clone https://github.com/saloni-st/Skill-Navigator.git
cd Skill-Navigator
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Update .env with your MONGODB_URI and GROQ_API_KEY

npm run dev
# Server runs on http://localhost:3001
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Create .env.local file
# Add: NEXT_PUBLIC_API_URL=http://localhost:3001

npm run dev
# Client runs on http://localhost:3000
```

## 📂 Project Structure

```
SKILL NAVIGATOR/
├── backend/                 # Express.js API & Inference Engine
│   ├── src/
│   │   ├── services/       # AI & Business Logic
│   │   ├── models/         # MongoDB Schemas
│   │   └── routes/         # API Endpoints
│   └── tests/              # Jest Test Suites
│
├── frontend/                # Next.js Client Application
│   ├── src/
│   │   ├── app/            # App Router Pages
│   │   ├── components/     # React Components
│   │   └── lib/            # API Clients & Utils
│   └── public/             # Static Assets
│
└── README.md               # This file
```

## 🔐 Environment Variables

**Backend (.env)**
```
MONGODB_URI=...
JWT_SECRET=...
GROQ_API_KEY=...
PORT=3001
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🤝 Contributing

1.  Fork the repository
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License.

---
*Built with ❤️ by the SkillNavigator Team*
