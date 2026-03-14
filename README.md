# AI-Based Bell's Palsy Rehabilitation Progress Tracker

A real-time computer vision application using MediaPipe and OpenCV to track and quantify facial symmetry during rehabilitation exercises for Bell's Palsy patients.

## Overview

Bell's Palsy is a condition that causes temporary weakness or paralysis of the facial muscles on one side of the face. This application helps rehabilitation specialists and patients monitor recovery progress by analyzing facial landmarks during five standardized clinical exercises.

The system:
- Captures the patient's face via webcam
- Extracts 468 facial landmarks using MediaPipe Face Mesh
- Measures facial symmetry during 5 exercises
- Calculates a "Symmetry Score" (0-100%) for each exercise
- Provides an overall recovery progress score

## Features

- **Real-time facial landmark tracking** using MediaPipe's pre-trained face detection
- **5 clinical exercises** with automatic 80-frame recording windows
- **State machine-driven UI** with keyboard-controlled progression
- **High-precision landmark clustering** for stable measurement centers
- **Eye Aspect Ratio (EAR) calculation** for eye squeeze assessment
- **Automatic baseline calibration** to establish resting facial measurements
- **Clean recovery report** with individual and overall symmetry scores
- **Input validation**: Graceful handling of missing faces during recording

## Requirements

- Python 3.11 or 3.12
- Webcam (built-in or external)
- Windows/macOS/Linux with ~100MB available disk space

### Python Packages

- `opencv-python` (cv2) – for video capture and rendering
- `mediapipe` – for facial landmark detection
- `numpy` – for numerical computations

The script automatically installs missing packages on first run.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   cd "term paper 2"
   ```

2. Ensure Python 3.11 or 3.12 is installed:
   ```powershell
   py -3.11 --version
   ```

3. Run the application:
   ```bash
   python main.py
   ```
   Or explicitly use Python 3.11:
   ```powershell
   py -3.11 main.py
   ```

## Usage

### Workflow

1. **INTRO Phase**: Relax your face and press `ENTER` to begin calibration
2. **CALIBRATING Phase**: Keep your face centered in the frame (resting baseline is auto-captured)
3. **Exercise 1 – Smile**: Press `ENTER` to start, then perform a big smile for 80 frames (~3 seconds)
4. **Exercise 2 – Eyebrow Raise**: Press `ENTER`, then raise both eyebrows for 80 frames
5. **Exercise 3 – Eye Squeeze**: Press `ENTER`, then squeeze eyes shut for 80 frames
6. **Exercise 4 – Pucker**: Press `ENTER`, then pucker lips into an "O" shape for 80 frames
7. **Exercise 5 – Frown**: Press `ENTER`, then scowl/frown for 80 frames
8. **RESULTS**: Displays your Symmetry Scores and Overall Session Score

### Keyboard Controls

| Key     | Action                              |
|---------|-------------------------------------|
| `ENTER` | Progress to next stage              |
| `q`     | Quit application at any time        |

### On-Screen Display

- **During Recording**: Instruction text, frame countdown, visual markers on facial features
- **Results Screen**: Black background with centered white text showing all 5 symmetry scores and overall score in cyan

## Algorithm & Metrics

### Facial Landmark Clusters

The application tracks 9 landmark clusters:

| Cluster             | Landmarks                | Purpose                          |
|---------------------|--------------------------|----------------------------------|
| Nose Bridge (Center)| 168, 1, 4               | Establish vertical center line   |
| Right Mouth Corner  | 61, 146, 91             | Measure smile width asymmetry    |
| Left Mouth Corner   | 291, 375, 321          | Measure smile width asymmetry    |
| Right Eyebrow       | 105, 107, 70            | Track eyebrow elevation          |
| Left Eyebrow        | 334, 336, 300          | Track eyebrow elevation          |
| Right Inner Eyebrow | 107                     | Measure frown/scowl depth        |
| Left Inner Eyebrow  | 336                     | Measure frown/scowl depth        |
| Right Eye           | 33, 160, 158, 133, 153, 144 | Calculate Eye Aspect Ratio (EAR) |
| Left Eye            | 362, 385, 387, 263, 373, 380 | Calculate Eye Aspect Ratio (EAR) |

### Symmetry Score Formula

For each exercise:
1. Capture maximum/minimum change from baseline for **left** and **right** sides
2. Calculate absolute deltas: `delta_left = |active_value - baseline_value|` and `delta_right = |active_value - baseline_value|`
3. Compute symmetry: `Score = (min_delta / max_delta) × 100%`
4. Handle edge case: If `max_delta = 0`, return 100% (perfect symmetry); if `max_delta > 0` and `min_delta = 0`, return 0% (complete asymmetry)

### Eye Aspect Ratio (EAR)

For eye squeeze detection:
```
EAR = (||p2-p6|| + ||p3-p5||) / (2 × ||p1-p4||)
```
where p1–p6 are the 6 eye landmark points. Closed eyes have low EAR; open eyes have high EAR.

### Overall Session Score

Average of all 5 exercise symmetry scores:
```
Overall = (Smile + Eyebrow + Eye + Pucker + Frown) / 5
```

## Output

### Console Output
- Package installation status (if needed on first run)
- Face detection errors or missing model notifications

### Window Display
- Live video feed with flipped (mirrored) view
- Colored markers on tracked facial clusters
- Instruction prompts with frame countdown
- Final recovery report with individual and overall scores

### Score Interpretation

| Score Range | Interpretation                                       |
|-------------|------------------------------------------------------|
| 90–100%    | Excellent symmetry; strong recovery                 |
| 70–89%     | Good symmetry; continued improvement expected       |
| 50–69%     | Moderate asymmetry; regular exercise recommended    |
| Below 50%  | Significant asymmetry; consult specialist           |

## Technical Implementation

### State Machine

The application uses a state-driven architecture with 13 states:

```
INTRO → CALIBRATING → SMILE_PROMPT → SMILE_RECORD → BROW_PROMPT → BROW_RECORD 
→ EYE_PROMPT → EYE_RECORD → PUCKER_PROMPT → PUCKER_RECORD → FROWN_PROMPT 
→ FROWN_RECORD → RESULTS
```

Each `_PROMPT` state waits for `ENTER` key; `_RECORD` states run exactly 80 frames then auto-transition.

### Framework Stack

- **cv2 (OpenCV)**: Video capture, frame rendering, text/shape drawing
- **MediaPipe**: Pre-trained 468-point face mesh detection model
- **NumPy**: Cluster center calculation, array operations, statistical functions
- **Python Standard Library**: Math (distance), file I/O, module loading, subprocess

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'cv2'"
**Solution**: Script auto-installs on first run. If it fails, manually run:
```bash
pip install opencv-python mediapipe numpy
```

### Issue: "Error: Could not open webcam"
**Solution**: 
- Check webcam permissions (Windows Security may need approval)
- Ensure no other application is using the webcam
- Try restarting the application

### Issue: "No face detected" during calibration
**Solution**:
- Ensure adequate lighting (natural or bright indoor light)
- Center face fully in frame
- Move closer to camera (face should fill ~1/3 of video window)
- Remove glasses if they obscure facial landmarks

### Issue: Inconsistent symmetry scores
**Solution**:
- Stay as still as possible during baseline calibration
- Perform exercises with full range of motion
- Maintain consistent lighting throughout session
- Avoid tilting or turning head during recording

## Medical Disclaimer

This tool is designed for **rehabilitation monitoring and progress tracking only**. It is not a diagnostic tool and does not replace professional medical evaluation. Consult a licensed healthcare provider for Bell's Palsy diagnosis, treatment decisions, and clinical assessment.

## Future Enhancements

- Session history export to CSV/PDF
- Multi-session trend analysis and graphs
- Therapist dashboard for patient management
- Mobile app version
- Voice-guided exercise prompts
- Automatic exercise quality feedback

## Author

Developed as a computer vision-based rehabilitation progress tracker.

## License

MIT License – Feel free to use, modify, and distribute.

## Contact & Support

For issues, questions, or feature requests, open an issue on GitHub or contact the project maintainer.

---

**Version**: 1.0  
**Last Updated**: March 2026  
**Status**: Production Ready
