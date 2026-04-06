# 🏥 JanmaSethu Clinical OS: The Ultimate Master Blueprint

This document is the definitive, exhaustive feature inventory and technical specification for the **JanmaSethu Healthcare Ecosystem**. It captures every operational capability across the AI-brain (Sakhi), the Control Tower, and the Digital Front Office.

---

## 🏛️ 1. ARCHITECTURAL TOPOGRAPHY
The system is built on a **High-Density Clinical Orchestration** model:
- **Backend (NestJS)**: The "Nervous System" for risk, routing, and reliability.
- **AI Core (FastAPI)**: The "Cognitive Brain" (Sakhi) for medical reasoning.
- **Persistence (Supabase)**: The "Data Foundation" with clinical integrity constraints.
- **Real-Time (SSE/BullMQ)**: The "Live Distribution Layer" for clinical situational awareness.

---

## 🧠 2. MODULE: SAKHI AI COGNITION HUB
*Located in: `/Sakhi_Webapp_Backend`*
- **Dual-Model Gateway**: Routes via medical intent using **Together AI (Llama 3.3 70B)** and **Fine-tuned SLM (LoRA)**.
- **Hierarchical RAG**: Semantic search using `pgvector` for medical FAQs and clinical documents.
- **Multilingual Support**: Real-time translation for English, Telugu, Hindi, and Tamil.
- **Emotion & Sentiment Engine**: Detects emotional arousal (Anxiety, Relief, Urgency).
- **Native Onboarding**: Conversational flow to capture identity and relation metadata.
- **Journey Funnel**: Week-by-week tracking of pregnancy states (`TTC`, `PREGNANT`, `POSTPARTUM`).
- **Multimedia Engine**: Discovery and injection of **YouTube health guides** and **Infographics**.
- **Auto-Mirroring**: Every AI-patient interaction mirrored to the Control Tower.

---

## 🩺 3. MODULE: CLINICAL RISK ENGINE (CI)
*Located in: `/framework/control-tower-core/src/domains/janmasethu/risk-engine`*
- **Triple-Signal Scoring**: BERT Marker (Distress) + Keyword Marker (Physiology) + Sentiment Marker (Arousal).
- **Longitudinal Trend Tracking**: Analysis of daily risk score fluctuations.
- **AI Guardrails**: Safety policies for AI segments and medical silence during emergencies.

---

## 📲 4. MODULE: OMNICHANNEL GATEWAY (OG)
*Located in: `/Whatsapp_backend`, `/whatsapp_chatbot`*
- **Twilio/WhatsApp Hub**: Full webhook registry for text, images, and report PDFs.
- **Inbound Trigger Engine**: New patient session routing and onboarding triggers.
- **Identity Resolver**: Merging WhatsApp phone numbers and Web IDs into a single `patient_id`.
- **Media Transcoder**: Direct report routing into medical report buckets.

---

## 🗼 5. MODULE: CENTRALIZED CONTROL TOWER (CT)
*Located in: `/framework/control-tower-core/src/kernel`*
- **Thread State Machine**: Management of statuses (`GREEN`, `YELLOW`, `RED`).
- **Policy Engine**: Rules-based routing to Nurse/Doctor queues.
- **SLA Reliability Bureau**: **BullMQ** enforcement of 5-minute hard response deadlines.
- **Thread Atomic Lock**: **Version-based optimistic concurrency** for data safety.
- **Real-Time Distribution**: **SSE (Server-Sent Events)** hub for instant dashboard alerts.

---

## 👩‍⚕️ 6. MODULE: DFO CLINICAL WORKSPACE (FRONTEND)
*Located in: `/framework/janmasethu-dfo-dashboard`*
- **Mission Control Analytics**: Live KPI visualization (Critical workload, SLA breaches, capacity).
- **Workforce Balancer**: Individual clinician bandwidth cards (Dr. Divya, Sarah, Rahul).
- **Live Monitoring Console**: SSE-powered severity-ranked queue with real-time severity markers.
- **3-Pane Workspace**: Severity-ranked queue, Hybrid human-AI chat hub, and full Patient Context sidebar.
- **Consultation Suite**: Clinical notes, diagnostic tagging, and prescription hub.
- **Appointment Lifecycle**: Discovery → Booking → Rescheduling → Completion flows.

---

## 🔒 7. COMPLIANCE & SECURITY
- **Immutable Audit Ledger**: Log of every clinician and system action in the ecosystem.
- **Role-Based Access Control (RBAC)**: Segmented data visibility (Doctor, Nurse, CRO).
- **Global Exception Filter**: Consistent clinical API error mapping (UUID/FK violations).

---

### **Universal Feature Census (All Modules)**
- [x] Multilingual AI Chat (Sakhi)  
- [x] LoRA-tuned Medical Empathy Model  
- [x] Hierarchical RAG (Knowledge Hub)  
- [x] Triple-Signal Risk Scoring (BERT/Keyword/Sentiment)  
- [x] 5-Minute Emergency SLA Enforcement  
- [x] Real-Time SSE Dashboard Alerts  
- [x] WhatsApp Media Hub (Twilio Integration)  
- [x] Multi-clinician Workload Balancing  
- [x] Consultation Lifecycle (Notes/Rx/Close)  
- [x] Patient Journey Funnel Management  
- [x] Atomic Thread Versioning & Guardrails  
- [x] Immutable Compliance Audit Ledger  
- [x] Role-Based Access Control (RBAC)  

---

### **System Health Status: 🟢 FULLY INTEGRATED & OPERATIONAL**
This specification is the authoritative source of truth for the entire JanmaSethu Healthcare and AI Platform.
