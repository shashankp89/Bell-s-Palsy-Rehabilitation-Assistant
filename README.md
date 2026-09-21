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
   git clone https://github.com/shashankp89/Bell-s-Palsy-Rehabilitation-Assistant/tree/main
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

The React Dashboard controls the entire workflow natively,from running the live excercise mode to storing and diplaying the data.

1. **Start the Frontend Server:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **Open the Dashboard:**
   Visit **[http://localhost:5173](http://localhost:5173)** in your browser.

3. **Log in to the app:**
   - Use Google sign-in with a valid Google account.
   - Or log in with email/password using a configured Firebase account.
   - Or use the Admin login with the configured admin email/password.
   - Or use Visitor Preview to view the preloaded data without login.

4. **Log a Clinical Session:**
   - Click the **"Start Live Exercise"** button in the dashboard header.
   - The Python AI Tracker will automatically pop up in a new desktop window.
   - Follow the on-screen prompts: 
     - Relax your face and press `ENTER` to calibrate resting baseline.
     - Perform the 5 clinical exercises (Smile, Eyebrow Raise, Eye Squeeze, Pucker, Frown) for 80-frames per exercise, pressing `ENTER` to begin each one.
   - Once the RESULTS screen appears, close the Python window (press `q`).
   - Back in the browser, click **"Finish Session & View Results"**. The dashboard's interactive charts will instantly ingest the new data!

## Authentication & Hosting Setup

This app supports Firebase Auth for real Google and email/password login, plus a local admin mode and visitor preview.

1. Copy the env file:
   ```bash
   cd frontend
   copy .env.example .env
   ```

2. Fill in your Firebase credentials in the `.env` file.

3. For host deployment, set the same environment variables in Vercel, Netlify, or Firebase Hosting.

4. The app is configured for static hosting and will run easily on Vercel or Netlify.

5. For local dev, you can keep the default guest/admin preview mode or switch to Firebase by setting:
   ```bash
   VITE_USE_DEMO_MODE=false
   ```

## Technical Architecture

- **Backend:** `main.py` utilizes `cv2` for rendering, `mediapipe` for 3D landmark abstraction, and pure mathematical Euclidean distance computations (e.g., Eye Aspect Ratios) to score kinematic symmetry. It exports the output to `frontend/public/recovery_history.json`.
- **Frontend Integration:** The Vite build configuration (`vite.config.js`) includes a custom Node.js `child_process.spawn` middleware plugin that listens on `/api/start-exercise` to bridge the gap between the React Web UI and the native Python OS process.# SymmeTrack: Facial Symmetry Analytics & Rehab Tracker

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
- Features a "Start Live Exercise" integration that securely launches the local Python AI Tracker directly from the browser interface.
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
   The Python script will automatically install missing dependencies (opencv-python, mediapipe, 
umpy) on its first run.
   
3. **Frontend Setup:**
   Navigate into the rontend directory and install the Node modules.
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
     - Relax your face and press ENTER to calibrate resting baseline.
     - Perform the 5 clinical exercises (Smile, Eyebrow Raise, Eye Squeeze, Pucker, Frown) for 80-frames per exercise, pressing ENTER to begin each one.
   - Once the RESULTS screen appears, close the Python window (press q).
   - Back in the browser, click **"Finish Session & View Results"**. The dashboard's interactive charts will instantly ingest the new data!

## Technical Architecture

- **Backend:** main.py utilizes cv2 for rendering, mediapipe for 3D landmark abstraction, and pure mathematical Euclidean distance computations (e.g., Eye Aspect Ratios) to score kinematic symmetry. It exports the output to rontend/public/recovery_history.json.
- **Frontend Integration:** The Vite build configuration (ite.config.js) includes a custom Node.js child_process.spawn middleware plugin that listens on /api/start-exercise to bridge the gap between the React Web UI and the native Python OS process.
