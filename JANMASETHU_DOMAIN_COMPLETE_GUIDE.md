# 🏥 JanmaSethu Domain: Complete Feature & Functionality Guide

This document is a deep technical audit of the **JanmaSethu specialized domain** within the `control-tower-core/src/domains/janmasethu` directory.

---

## 🏛️ 1. ARCHITECTURAL LAYERS
The JanmaSethu domain follows a **Layered Domain-Driven Design (DDD)**:
- **Ingress**: `janmasethu.controller.ts` (API Gateway) with global `ValidationPipe` and `HealthcareExceptionFilter`.
- **Core Logic**: `janmasethu.handler.ts` (Message Triage) & `janmasethu.dfo.service.ts` (Clinic Operations).
- **Policy Bureau**: `janmasethu.policy.ts` (Transition Rules) & `JanmasethuScopePolicy.ts` (RBAC visibility).
- **Persistence**: `janmasethu.repository.ts` (Atomic Thread Locking & Soft Deletes).
- **Reliability**: `janmasethu.sla.ts` (BullMQ Alerting) & `janmasethu.rbac.ts` (Permission Matrix).

---

## 🧠 2. CORE FEATURE MODULES

### **A. Inbound Message Handling (`janmasethu.handler.ts`)**
- **Omnichannel Ingestion**: Processing of messages from WhatsApp (Twilio) and Web.
- **Sentiment & Risk Sync**: Real-time triggering of BERT/Keyword risk evaluation.
- **Emergency Transitions**: Automatic status movement: `GREEN` (Safe), `YELLOW` (Nurse), `RED` (Critical).
- **Broadcasting**: Real-time push of `EMERGENCY_ALERT` via SSE to the dashboard.

### **B. Triage & Escalation Policy (`janmasethu.policy.ts`)**
- **Threshold Escalation**: Re-routes threads from AI to Human based on medical risk score (> 80).
- **Specialty Routing**: Logic for transitioning `YELLOW` threads to the `DOCTOR_QUEUE` upon detection of crisis markers.

### **C. Assignment & Ownership (`janmasethu.assignment.ts`, `janmasethu.takeover.ts`)**
- **CRO Manual Assignment**: Manual clinician re-assignment by the Relationships Officer.
- **Auto-Assignment**: Load-balancer logic to find available clinicians with the lowest active session count.
- **Human Takeover & AI Suppression**: Harden protocol to lock thread to a doctor and **silence AI response logic**.

### **D. SLA & Reliability Bureau (`janmasethu.sla.ts`)**
- **BullMQ 5-Min Watcher**: Starts a hard response timer for all `RED` emergency threads.
- **Recovery Automation**: On breach (no reply in 5 mins), thread is reverted to the shared pool with a high-visibility SSE alert.

---

## 🩺 3. CLINICAL RISK & SAFETY (`risk-engine/`)
- **Signal Detection**: Keyword (Physiology) + BERT (Context) + Sentiment (Arousal) engines.
- **Medical Guardrails**: Real-time AI output filtering to block unapproved medical instructions.
- **Longitudinal Trend Analysis**: Daily risk score trend-lines for patient health visibility.

---

## 🏨 4. DFO CLINICAL OPERATIONS (`janmasethu.dfo.service.ts`)
- **Journey Sync**: TTC, Pregnancy (Weeks 1-40), and Postpartum care stage tracking.
- **Consultation Core**: Atomic flow for **Starting**, **Prescribing**, and **Closing** medical consultations.
- **Medical Reports**: Hub for lab results and scan metadata uploaded via WhatsApp.
- **Appointment Hub**: Full lifecycle booking engine with slot discovery and rescheduling.

---

## 🛡️ 5. SECURITY & COMPLIANCE
- **RBAC Matrix**: Strictly segmented access: `DOCTOR` (RED/YELLOW), `NURSE` (YELLOW), `CRO` (ALL).
- **Immutable Ledger**: Persistent logs of every single clinician intervention and patient message.
- **Atomic Concurrency**: **Versioned locking** on thread updates to ensure 1:1 clinician stewardship.

---

### **System Health: 🟢 FULLY OPERATIONAL**
This documentation serves as the master engineering reference for the JanmaSethu Domain.
