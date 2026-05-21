<div align="center">

<img src="frontend/public/icons.svg" alt="VendorIQ Logo" width="160"/>

# VendorIQ — AI Decision Intelligence

**The AI Boardroom That Never Lets Politics Win Over Evidence.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-View%20Here-E8A930?style=for-the-badge&logo=vercel&logoColor=black)](https://vendor-iq-ten.vercel.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-Latest-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)](https://langchain-ai.github.io/langgraph)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/gemini)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)

*Built for Google DeepMind × AI & Big Data Expo North America Hackathon 2026*

</div>

---

## What Is VendorIQ?

VendorIQ is an enterprise-grade multi-agent AI platform that simulates a live executive boardroom debate to evaluate vendors and deliver evidence-based procurement decisions in minutes, not weeks.

Upload vendor proposals. Watch 13 specialized AI agents — CFO, CTO, Legal, Customer Reps, Devil's Advocate, Governance Auditor — debate across 3 structured rounds with live bias detection. Get a ranked verdict with an audit trail, risk register, and minority dissent.

---

## The Problem

- Enterprise vendor selection takes weeks of meetings and hundreds of hours of document review
- Decisions dominated by whoever talks loudest — not by evidence
- $180B spent annually on procurement talent vs only $10B on software
- 92% of CPOs say AI procurement is top priority — only 4% achieved scale

> *"By 2028, 90% of B2B buying will be AI agent-intermediated"* — Gartner 2026

---

## How It Works

```
Upload Vendor PDFs
        ↓
Phase 0 — 5 Analyst Agents extract intelligence in parallel
        ↓
Round 1 — 13 agents form independent positions
        ↓
Round 2 — Agents cross-examine each other
        ↓
Round 3 — Final defense + customer voices integrated
        ↓
Moderator — Synthesizes all rounds, applies stakeholder weights
        ↓
Ranked Verdict with audit trail, risk register, minority dissent
```

---

## Screenshots

<div align="center">

### Upload Interface
<img src="v1.png" alt="VendorIQ Upload Interface" width="100%"/>

### Live Debate Streaming
<img src="v2.png" alt="VendorIQ Live Debate" width="100%"/>

### Agent Perspectives
<img src="v3.png" alt="VendorIQ Agent Perspectives" width="100%"/>

### Decision Results
<img src="v5.png" alt="VendorIQ Decision Results" width="100%"/>

### Audit Trail & Verdict
<img src="v6.png" alt="VendorIQ Audit Trail" width="100%"/>

</div>

---

## Agent Architecture

**Layer 0 — Intelligence Analysts (5 agents)**
Financial · Technical · Compliance · Market · Customer Sentiment
Extract structured intelligence from PDFs. Never debate.

**Layer 1 — Decision Committee (7 agents)**
CFO (92) · IT Director (87) · Enterprise Architect (80) · Procurement (74) · Legal (71) · Operations (68) · Digital Lead (65)
Each reads only their relevant intelligence. Stakeholder weights applied in final verdict.

**Layer 2 — Customer Panel (3 agents)**
Positive Rep · Negative Rep · Neutral Rep
Debate each other in Round 2. Feed real-world experience into decision agents in Round 3.

**Layer 3 — Adversarial Audit (3 agents)**
Devil's Advocate · Bias Detector · Governance Auditor
Challenge everything. Expose groupthink. Flag compliance violations.

**System Agents**
Bias Checker — scores all agents after every round
Moderator — Round 4 only, synthesizes everything, produces final verdict

---

## Key Features

- **Multi-Round Debate** — 3 structured rounds. Agents evolve positions as debate progresses
- **Live Bias Detection** — Every agent scored 0-100% every round. CFO: 81% → 64% → 49%. Biased agents downweighted automatically
- **Adversarial Layer** — 3 agents whose only job is to attack assumptions and prevent groupthink
- **Role-Based Intelligence** — Agents never see raw PDFs. Each receives only data relevant to their domain
- **Live Streaming UI** — All 13 agents stream simultaneously token by token into their own cards
- **Full Replay System** — Every debate saved to PostgreSQL. Replay without re-running Gemini
- **Board-Ready Verdict** — Vendor scorecards, fit matrix, risk register, minority dissent, conditions before signing

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| LLM | Gemini 2.5 Flash | Agent intelligence, 1M token context for PDF reading |
| Orchestration | LangGraph | Multi-agent state management, round routing, checkpointing |
| Backend | FastAPI + Python | Async API, SSE streaming endpoints |
| Database | PostgreSQL + SQLAlchemy | Session persistence, full replay system |
| Streaming | Server-Sent Events | Live token streaming to frontend |
| Frontend | React 18 + TypeScript | Live debate UI |
| Styling | TailwindCSS + shadcn/ui | Enterprise dark theme |
| Animation | Framer Motion | Agent card animations, streaming effects |

---

## Getting Started

### Prerequisites
```
Python 3.11+
Node.js 18+
PostgreSQL 14+
Gemini API Key — free at aistudio.google.com
```

### Backend
```bash
cd Backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:5173`

---

## Environment Variables

**Backend `.env`**
```
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/vendoriq
ENVIRONMENT=development
```

**Frontend `.env.local`**
```
VITE_API_URL=http://localhost:8000
```

---

## Why VendorIQ Is Different

| Feature | Traditional Procurement | ChatGPT | VendorIQ |
|---|---|---|---|
| Multi-round structured debate | ❌ | ❌ | ✅ |
| Role-based intelligence per agent | ❌ | ❌ | ✅ |
| Live bias detection per round | ❌ | ❌ | ✅ |
| Adversarial audit layer | ❌ | ❌ | ✅ |
| Customer panel simulation | ❌ | ❌ | ✅ |
| Full replay without AI cost | ❌ | ❌ | ✅ |
| Stakeholder-weighted verdict | ❌ | ❌ | ✅ |
| Governance audit trail | ❌ | ❌ | ✅ |

---

## Market Context

- **$39.2B** — AI in Procurement market by 2035 at 28% CAGR
- **Lio (Munich)** — raised $30M Series A from a16z in 2026 for AI procurement
- **SAP** launched Joule Bid Analysis Agent for supplier comparison Q1 2026
- **Gartner** — 1,445% surge in multi-agent system inquiries from Q1 2024 to Q2 2025

VendorIQ addresses the gap nobody else covers — the vendor **selection** decision itself. Not workflow automation. The actual decision.

---

## Roadmap

- [ ] GraphRAG knowledge graph for vendor relationship mapping
- [ ] MCP server exposure for enterprise integrations
- [ ] Custom agent configuration per organization
- [ ] PDF export of full debate audit trail
- [ ] Multi-language support for German, French, Japanese markets
- [ ] Enterprise SSO and RBAC

---

## License

MIT License — see LICENSE for details.

---

<div align="center">

**VendorIQ — AI Decision Intelligence**

*The AI boardroom that never lets politics win over evidence.*

[Live Demo](#) · [Report Bug](https://github.com/YOUR_USERNAME/vendoriq/issues) · [LinkedIn](YOUR_LINKEDIN_URL)

**Built for Google DeepMind × AI & Big Data Expo North America Hackathon 2026**

</div>
