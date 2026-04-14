# SymmeTrack: Facial Symmetry Analytics & Rehab Tracker

A real-time computer vision application and clinical dashboard using MediaPipe, OpenCV, and React to track and quantify facial symmetry during rehabilitation exercises for Bell's Palsy patients.

## Overview

Bell's Palsy is a condition that causes temporary weakness or paralysis of the facial muscles on one side of the face. This full-stack application helps rehabilitation specialists and patients monitor recovery progress by analyzing facial landmarks during five standardized clinical exercises and visualizing the patient's recovery trajectory over time.

### Phase 1: AI Facial Tracking (Python Backend)
- Captures the patient's face via webcam.
- Extracts 468 facial landmarks using **MediaPipe Face Mesh**.
- Measures facial kinematic symmetry during 5 unique exercises.
- Calculates a "Symmetry Score" (0-100%) for each exercise and an overall recovery progress score.
- Automatically exports the session scores to a local JSON file.

### Phase 2: Clinical Dashboard (React Frontend SPA)
- A modern Single Page Application built with **React, Vite, Tailwind CSS, and Recharts**.
- Visualizes the exported session data, charting both macro (overall score) and micro (individual muscle metric) trends over 7-Day, 30-Day, or All-Time periods.
- Features a **"Start Live Exercise"** integration that securely launches the local Python AI Tracker directly from the browser interface.
- Dynamically updates with newly generated data as soon as the live tracking session is finished.

## Requirements

- **Python 3.11+** (for the AI Tracker)
- **Node.js 18+ & npm** (for the Web Dashboard)
- Webcam (built-in or external)

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   cd "term paper 2"
   ```

2. **Backend Setup:**
   The Python script will automatically install missing dependencies (`opencv-python`, `mediapipe`, `numpy`) on its first run.
   
3. **Frontend Setup:**
   Navigate into the `frontend` directory and install the Node modules.
   ```bash
   cd frontend
   npm install
   ```

## Usage

You no longer need to run the Python script manually! The React Dashboard controls the entire workflow natively.

1. **Start the Frontend Server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open the Dashboard:**
   Visit **[http://localhost:5173](http://localhost:5173)** in your browser.

3. **Log a Clinical Session:**
   - Click the **"Start Live Exercise"** button in the dashboard header.
   - The Python AI Tracker will automatically pop up in a new desktop window.
   - Follow the on-screen prompts: 
     - Relax your face and press `ENTER` to calibrate resting baseline.
     - Perform the 5 clinical exercises (Smile, Eyebrow Raise, Eye Squeeze, Pucker, Frown) for 80-frames per exercise, pressing `ENTER` to begin each one.
   - Once the RESULTS screen appears, close the Python window (press `q`).
   - Back in the browser, click **"Finish Session & View Results"**. The dashboard's interactive charts will instantly ingest the new data!

## Technical Architecture

- **Backend:** `main.py` utilizes `cv2` for rendering, `mediapipe` for 3D landmark abstraction, and pure mathematical Euclidean distance computations (e.g., Eye Aspect Ratios) to score kinematic symmetry. It exports the output to `frontend/public/recovery_history.json`.
- **Frontend Integration:** The Vite build configuration (`vite.config.js`) includes a custom Node.js `child_process.spawn` middleware plugin that listens on `/api/start-exercise` to bridge the gap between the React Web UI and the native Python OS process.# SymmeTrack: Facial Symmetry Analytics & Rehab Tracker

A real-time computer vision application and clinical dashboard using MediaPipe, OpenCV, and React to track and quantify facial symmetry during rehabilitation exercises for Bell's Palsy patients.

 
