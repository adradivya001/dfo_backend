# 🌍 JanmaSethu: The Complete Healthcare Ecosystem Audit

This document is the definitive technical specification and feature census for the entire JanmaSethu platform, covering all repositories, modules, and integrated services.

---

## 🏛️ 1. ARCHITECTURAL TOPOGRAPHY
The JanmaSethu platform is a distributed, high-availability ecosystem consisting of five primary operational zones:
1.  **AI Cognition Hub (Sakhi)**: The specialized medical brain.
2.  **Multichannel Gateways**: Communication interfaces (WhatsApp & Web).
3.  **The Control Tower Core**: The central nervous system for risk and routing.
4.  **DFO Clinical Workspace**: The mission control for doctors and nurses.
5.  **Data & Intelligence Fabric**: Unified Supabase persistence and BERT/LLM intelligence.

---

## 🧠 2. MODULE: SAKHI AI BACKEND (COGNITION)
*Primary Workspace: `/Sakhi_Webapp_Backend`*
- **Model Orchestration**: Dual-engine routing: **Together AI (Llama 3.3 70B)** for general reasoning, and **Fine-tuned SLM (LoRA)** for medical empathy.
- **Hierarchical RAG**: Semantic searches using `pgvector` against medical FAQs and documentation.
- **Sentiment Engine**: Real-time anxiety and urgency classification.
- **Journey Sync**: Tracking of patient stages: `TTC`, `PREGNANT`, and `PARENT`.
- **Multimedia Injection**: Auto-attaching **YouTube health guides** and **Infographics** to AI responses.
- **Mirroring Client**: Real-time event propagation to the Control Tower.

---

## 📲 3. MODULE: OMNICHANNEL GATEWAYS (COMMUNICATION)
*Primary Workspace: `/Whatsapp_backend`, `/whatsapp_chatbot`*
- **Twilio/WhatsApp Cloud API**: Processing of text and medical media (images/PDFs).
- **Auto-Onboarding**: New number detection and "Welcome to Sakhi" flow trigger.
- **Bi-directional Routing**: Transparent delivery of Doctor/AI responses to patient devices.

---

## 🗼 4. MODULE: CONTROL TOWER CORE (THE BRAIN)
*Primary Workspace: `/framework/control-tower-core`*
- **Triple-Signal Risk Engine**: BERT, Keyword, and Sentiment signals for medical triage.
- **Clinical Policy Engine**: Status transitions (`GREEN` → `YELLOW` → `RED`).
- **SLA Reliability Bureau**: **BullMQ** enforcement of 5-minute response windows for RED alerts.
- **Atomic Persistence**: Version-based locking for data integrity.

---

## 👩‍⚕️ 5. MODULE: DFO CLINICAL WORKSPACE (MISSION CONTROL)
*Primary Workspace: `/framework/janmasethu-dfo-dashboard`*
- **Mission Control Analytics**: Clinic-wide KPIs (Critical threads, breaching SLAs).
- **Workforce Balancer**: Doctor workload monitoring (Dr. Divya, Sarah, Rahul).
- **3-Pane Clinical Console**:
  1. **Triage Queue**: SSE-powered instant alerts.
  2. **Thread View**: Hybrid human-AI chat workspace.
  3. **Patient Context**: Longitudinal history and medical records.
- **Consultation Suite**: Clinical notes, diagnostic tagging, and prescription hub.

---

## 🤰 6. MODULE: PATIENT PORTAL & JOURNEY
*Primary Workspace: `/JS_Clinics_Frontend`*
- **IVF & Care Modules**: Specialized care journeys for fertility and post-pregnancy.
- **Success Story Hub**: Community hope-building via anonymized stories.
- **Patient Health Portal**: Self-service access to medical history and prescriptions.

---

## 🛠️ 7. INFRASTRUCTURE & SAFETY LAYER
- **Supabase Store**: Unified persistence for all services.
- **Real-Time Gateway**: SSE and BullMQ for low-latency notifications.
- **Safety Bureau**: **AI Guardrails Service** to block unapproved medical advice.
- **Audit Ledger**: Non-repudiable logs of every action, message, and clinician assignment.

---

### **Universal Feature Census (The "Everything" List)**
✅ Multilingual AI Chat (Sakhi)  
✅ LoRA-tuned Medical Empathy Model  
✅ Hierarchical RAG (Knowledge Hub)  
✅ Triple-Signal Risk Scoring (BERT/Keyword/Sentiment)  
✅ 5-Minute Emergency SLA Enforcement  
✅ Real-Time SSE Dashboard Alerts  
✅ WhatsApp Media Processing  
✅ Doctor/Nurse Workload Balancing  
✅ Optimized Patient Journey Stages  
✅ Clinical Consultation & Rx Lifecycle  
✅ Immutable Compliance Audit Logs  
✅ Optimized Atomic Thread Versioning  
✅ AI Guardrails & Suppression Logic  
✅ Cross-platform Web/WhatsApp Sync  

---

### **System Health: 🟢 FULLY DEPLOYED & INTEGRATED**
This specification covers the entire JanmaSethu Healthcare and AI Platform.
