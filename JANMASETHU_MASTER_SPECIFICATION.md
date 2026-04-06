# 🏥 JanmaSethu Clinical OS: The Master Platform Specification

This is the fully consolidated, comprehensive blueprint and feature census for the **JanmaSethu Healthcare Ecosystem**. It merges the AI Cognition Engine (Sakhi), the Omnichannel Gateway, the Clinical Control Tower, and the Digital Front Office (DFO) into a single authoritative document.

---

## 🏛️ 1. ARCHITECTURAL TOPOGRAPHY
The JanmaSethu platform is a distributed, clinical-grade ecosystem consisting of five primary operational zones:
1.  **AI Cognition Hub (Sakhi)**: The specialized, multilingual medical brain.
2.  **Multichannel Gateways**: Communication interfaces via WhatsApp (Twilio) and Web.
3.  **The Control Tower Core**: The central nervous system for risk-scoring, triage, and routing.
4.  **DFO Clinical Workspace**: The mission control dashboard for doctors, nurses, and CROs.
5.  **Data & Intelligence Fabric**: Unified Supabase persistence, BERT Transformers, and SLM model Serving.

---

## 🧠 2. MODULE: SAKHI AI BACKEND (COGNITION)
*Located in: `/Sakhi_Webapp_Backend`*
- **Model Orchestration**: Dual-engine routing: **Together AI (Llama 3.3 70B)** and **Fine-tuned SLM (LoRA)**.
- **Hierarchical RAG**: Semantic searches using `pgvector` against medical FAQs and documentation.
- **Sentiment & Intent Engine**: Real-time classification of patient emotional and medical states.
- **Journey Sync**: Week-by-week tracking of pregnancy and care stages (`TTC`, `PREGNANT`, `POSTPARTUM`).
- **Multimedia Injection**: Auto-discovery and attachment of **YouTube health guides** and **Infographics**.

---

## 📲 3. MODULE: OMNICHANNEL GATEWAY (COMMUNICATION)
*Located in: `/Whatsapp_backend`, `/whatsapp_chatbot`*
- **Unified Identity**: Mapping WhatsApp phone numbers and Web UUIDs to a single `patient_id`.
- **WhatsApp Media Hub**: Processing medical images/PDFs directly into the medical records repository.
- **Auto-Onboarding**: New patient detection and "Welcome to Sakhi" flow trigger.

---

## 🗼 4. MODULE: CONTROL TOWER CORE (THE BRAIN)
*Located in: `/framework/control-tower-core`*
- **Triple-Signal Risk Engine**: BERT, Keyword, and Sentiment markers for triage.
- **Clinical Policy Engine**: Rules-based status transitions (`GREEN` → `YELLOW` → `RED`).
- **SLA Reliability Bureau**: **BullMQ**-driven 5-minute hard deadline for RED alerts.
- **Atomic Persistence**: **Version-based optimistic locking** for data integrity.

---

## 👩‍⚕️ 5. MODULE: DFO CLINICAL WORKSPACE (MISSION CONTROL)
*Located in: `/framework/janmasethu-dfo-dashboard`*
- **Workforce Balancer**: Live workload monitoring for specialized clinicians (Dr. Divya, Sarah, Rahul).
- **3-Pane Clinical Console**:
  1. **Triage Queue**: Instant alerts via **SSE (Server-Sent Events)**.
  2. **Thread Hub**: Hybrid human-AI chat workspace.
  3. **Patient Context**: Longitudinal history, risk trend graphs, and medical document history.
- **Consultation Suite**: Clinical notes, diagnostic tagging, and prescription management.

---

## 🛠️ 6. INFRASTRUCTURE & SAFETY LAYER
- **Unified Store**: **Supabase (Postgres)** with clinical-grade namespaces.
- **Real-Time Distribution**: **SSE** for dashboard updates and **BullMQ** for async task tracking.
- **Medical Guardrails**: **AI Guardrails Service** to block unapproved medical advice and prescriptions.
- **RBAC Security**: Role-based permissions (Doctor, Nurse, CRO) with segmented data visibility.

---

## ✅ 7. UNIVERSAL FEATURE CENSUS (THE "EVERYTHING" CHECKLIST)
- [x] Multilingual AI Chat (Sakhi)
- [x] LoRA-tuned Medical Empathy Model
- [x] Hierarchical RAG (Knowledge Hub)
- [x] Triple-Signal Risk Scoring (BERT/Keyword/Sentiment)
- [x] 5-Minute Emergency SLA Enforcement
- [x] Real-Time SSE Dashboard Alerts
- [x] WhatsApp Media Processing
- [x] Multi-clinician Workload Balancing
- [x] Optimistic Locking for Data Integrity
- [x] Patient Journey Funnel Management
- [x] Clinical Consultation & Rx Lifecycle
- [x] Immutable Compliance Audit Logs
- [x] Medical Guardrails & AI Suppression
- [x] Cross-platform Patient ID Sync

---

### **System Health Status: 🟢 FULLY DEPLOYED & CONSOLIDATED**
This specification is the authoritative source of truth for the entire JanmaSethu Healthcare and AI Platform.
