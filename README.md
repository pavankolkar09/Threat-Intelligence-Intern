# Sentinel Intelligence - AI Threat Analysis System

## Project Overview
Sentinel Intelligence is a comprehensive Cyber Threat Intelligence (CTI) platform designed for the role of a **Threat Intelligence Intern**. It provides tools for analyzing Indicators of Compromise (IOCs), tracking threat actors, and monitoring global security trends using advanced AI analysis.

## Core Modules
1. **Threat Actor Research**: A database of known APT groups and cybercriminals with their TTPs (Tactics, Techniques, and Procedures).
2. **IOC Analysis Engine**: AI-powered analysis of IPs, Domains, and File Hashes to determine maliciousness and provide mitigation steps.
3. **Phishing Detection**: A specialized tool for verifying suspicious URLs and email domains.
4. **Threat Trend Monitoring**: Visualization of emerging cybersecurity trends and their impact levels.
5. **Intelligence Dashboard**: Real-time overview of system activity and global threat stats.

## System Architecture
- **Frontend**: React 19 with Tailwind CSS 4.0 for a modern, high-density technical dashboard.
- **Backend**: Express.js server managing API routes and Vite middleware.
- **Database**: SQLite (via `better-sqlite3`) for persistent storage of actors, trends, and analysis history.
- **AI Engine**: Google Gemini 3.1 Flash for deep contextual analysis of threats and report generation.

## Features for Interns
- **Automated Triage**: Quickly identify if an IOC found in logs is a known threat.
- **Actor Attribution**: Map attack techniques to known threat groups.
- **Report Generation**: Create professional Markdown reports for incident response or intelligence sharing.
- **Trend Analysis**: Monitor emerging attack vectors like Ransomware 2.0 and Supply Chain attacks.

## Workflow Diagram
```mermaid
graph TD
    A[User Input: IOC/URL] --> B{Analysis Engine}
    B --> C[SQLite History Check]
    B --> D[Gemini AI Analysis]
    D --> E[Threat Level Assessment]
    E --> F[Mitigation Recommendations]
    F --> G[Dashboard Visualization]
    G --> H[Export PDF/Markdown Report]
```

## Setup & Local Execution
1. **Environment Variables**: To enable AI features, set `GEMINI_API_KEY` in your `.env` file.
2. **Mock Mode**: If no API key is provided, the system automatically switches to **Mock Mode**. This allows you to demonstrate the entire workflow with simulated data and pre-formatted reports without needing an active internet connection or API credits.
3. **Installation**: Run `npm install` to install dependencies.
4. **Development**: Run `npm run dev` to start the Express server and Vite frontend.
5. **Database**: The system automatically initializes `threat_intel.db` on first run and seeds it with sample data.

## Sample Dataset
The system comes pre-seeded with:
- **Actors**: Lazarus Group, Fancy Bear (APT28), Wizard Spider.
- **Trends**: Ransomware 2.0, Supply Chain Attacks, AI-Enhanced Phishing.
- **History**: Pre-analyzed IOCs to populate the dashboard immediately.
