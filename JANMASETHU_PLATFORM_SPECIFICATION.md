# 🏥 JanmaSethu Clinical OS: Platform Specification

This document provides a comprehensive technical audit of the **JanmaSethu AI-Powered Digital Front Office (DFO)** system.

---

## 🏛️ 1. ARCHITECTURAL OVERVIEW
The system is built on a **Modular Micro-Kernel Architecture** within a NestJS framework, integrating clinical logic, real-time alerting, and automated risk scoring.

### **Tech Stack**
- **Backend Core**: NestJS 11 + BullMQ (Task Queueing).
- **Communication**: WhatsApp (via Dispatch Service) + Web.
- **Database**: Supabase (Postgres) with strict Relation Integrity.
- **Frontend**: Vite 8 + React 19 + Tailwind CSS + Lucide Icons.
- **Real-Time**: Server-Sent Events (SSE) for zero-latency clinical alerts.

---

## 📱 2. FEATURE MODULE: OMNICHANNEL KERNEL
| Feature | Technical Highlight |
| :--- | :--- |
| **Unified Patient Identity** | Auto-resolution of WhatsApp/Web IDs into a persistent `patient_id`. |
| **Atomic Thread Management** | Thread states (GREEN/YELLOW/RED) with `version`-based optimistic locking. |
| **AI Suppression Mode** | "Human-in-the-loop" switch that overrides AI logic upon manual takeover. |
| **Channel Dispatcher** | Bi-directional message routing across WhatsApp and Web interfaces. |

---

## 🩺 3. FEATURE MODULE: CLINICAL RISK ENGINE
1. **Keyword Signal**: Real-time detection of high-risk medical physiological markers.
2. **BERT Signal**: Contextual intent inference using a local deep learning fallback.
3. **Sentiment Signal**: Emotion-weighted scoring for Panic/Anxiety detection.
4. **Context Extractor**: Deep conversational history analysis for recurring medical distress.
5. **Medical Guardrails**: Safety policy layer to block AI-generated clinical prescriptions.

---

## 🏥 4. FEATURE MODULE: DIGITAL FRONT OFFICE (DFO)
- **Workforce Registry**: Multi-profile support for specialized clinicians (Doctor/IVF/Nurse).
- **Consultation Core**: Full session lifecycle management (Start → Notes → Rx → Close).
- **Journey Funnel**: Automated care stages for TTC, Pregnancy, and Postpartum tracking.
- **Workload Balancer**: Real-time triage logic based on clinician active sessions.

---

## ⏳ 5. FEATURE MODULE: RELIABILITY & SLA
- **BullMQ Watcher**: 5-minute hard deadline for RED-alert clinical response.
- **Auto-Recovery**: Instant thread re-routing to shared pools upon SLA breach.
- **Real-time SSE Gateway**: Instant push notifications for all emergency infrastructure events.
- **Healthcare Filter**: Consistent clinical API error mapping (UUID/FK violations).

---

## 🖥️ 6. FEATURE MODULE: CLINICAL WORKSPACE (FRONTEND)
### **📊 Mission Control Dashboard**
- Real-time KPI visualization (Risk dist, Workforce capacity, SLA health).
### **🚑 Live Monitoring Console**
- Priority-ranked medical queues with integrated patient context and clinical timelines.
### **📅 Registry & Compliance Portals**
- Immutable Audit Ledger for clinician activity and HIPAA-readiness.

---

### **System Health Status: 🟢 OPERATIONAL**
- **Core APIs**: Fully Connected.
- **SLA Workers**: Active.
- **Intelligence Bus**: Online.
