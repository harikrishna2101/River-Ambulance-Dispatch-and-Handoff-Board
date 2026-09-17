# 🚤 River Ambulance Dispatch and Handoff Board

A mission-critical dispatch and fleet management system built for coordinating emergency river ambulances operating in low-bandwidth remote island regions.

![Status: Complete](https://img.shields.io/badge/Status-Complete-success)
![Framework: React](https://img.shields.io/badge/Framework-React%2019-blue)
![Database: Supabase](https://img.shields.io/badge/Database-Supabase-green)
![Styling: Tailwind](https://img.shields.io/badge/Styling-TailwindCSS-06B6D4)

---

## 🌐 Live Demo
The application is deployed live on Vercel:
**[View Live Prototype](https://river-ambulance-dispatch-and-handof.vercel.app/)**

---

## 🎯 Core Features
- **Fleet Status Board**: Real-time overview of 5 active river ambulances (BA-01 to BA-05), displaying fuel levels, oxygen tanks, and current assignments.
- **Urgency Dispatch Queue**: Requests are strictly sorted by `CRITICAL` -> `HIGH` -> `NORMAL` to ensure immediate visibility of emergencies.
- **Concurrent Atomic Claims**: Built with safe PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) to prevent multiple captains from claiming the same emergency request simultaneously.
- **Low-Bandwidth Optimization**: Minimal payload sizes, heavily reliant on discrete canonical string statuses rather than heavy real-time map polling.
- **Seamless Offline Fallback**: Features a robust mock-data fallback layer that allows development and UI interaction to continue even if the Supabase backend drops.

## 🛠️ Technology Stack
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS 4, Radix UI Primitives, Lucide Icons
- **Backend & Realtime**: Supabase (PostgreSQL), Supabase RPCs (Remote Procedure Calls)
- **Deployment**: Vercel

## 🚀 How to Run Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/harikrishna2101/River-Ambulance-Dispatch-and-Handoff-Board.git
   cd River-Ambulance-Dispatch-and-Handoff-Board/river-ambulance
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Rename `.env.example` to `.env` and fill in your Supabase connection strings:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run Database Migrations**
   Execute the provided SQL files in the `supabase/migrations/` folder directly in your Supabase SQL Editor to generate the tables and RPC functions.

5. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

## ⚖️ Trade-Offs & Decisions
- **No Complex Auth**: Bypassed heavy JWT/password flows in favor of a fast `RoleSelector`. **Why:** Low-bandwidth emergency constraint where forgetting a password could cost lives.
- **RPCs over Node.js**: Used Supabase PostgreSQL RPCs for state transitions instead of a middle-tier Node/Express server. **Why:** Eliminates latency, reduces DevOps overhead, and guarantees atomic database locks.
- **Discrete GPS Tracking**: Used canonical text ("Island A", "Island B") instead of Mapbox/live tracking. **Why:** Massive reduction in WebSocket bandwidth consumption for remote 3G environments.