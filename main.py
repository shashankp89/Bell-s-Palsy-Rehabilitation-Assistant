import math
import os
import sys
import subprocess
import importlib
import json
import datetime
from typing import Any


def ensure_runtime_dependencies() -> dict:
    mod_to_pkg = {
        "cv2": "opencv-python",
        "mediapipe": "mediapipe",
        "numpy": "numpy",
    }
    loaded = {}
    for mod, pkg in mod_to_pkg.items():
        try:
            loaded[mod] = importlib.import_module(mod)
        except ModuleNotFoundError:
            print(f"Installing missing package: {pkg}")
            subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])
            loaded[mod] = importlib.import_module(mod)
    return loaded


_modules = ensure_runtime_dependencies()
cv2 = _modules["cv2"]
mp = _modules["mediapipe"]
np = _modules["numpy"]


IDX = {
    "nose": [168, 1, 4],
    "mouth_r": [61, 146, 91],
    "mouth_l": [291, 375, 321],
    "brow_r": [105, 107, 70],
    "brow_l": [334, 336, 300],
    "inner_r": [107],
    "inner_l": [336],
    "eye_r": [33, 160, 158, 133, 153, 144],
    "eye_l": [362, 385, 387, 263, 373, 380],
}

EX = {
    "SMILE": "Big Smile!",
    "BROW": "Raise Eyebrows!",
    "EYE": "Squeeze Eyes Shut!",
    "PUCKER": "Pucker Lips (O shape)!",
    "FROWN": "Frown / Scowl!",
}


def ccenter(pts: Any, indices: list[int]) -> Any:
    return np.mean(pts[indices], axis=0)


def dist(p1: Any, p2: Any) -> float:
    return float(math.dist((float(p1[0]), float(p1[1])), (float(p2[0]), float(p2[1]))))


def ear(pts: Any, eye_idx: list[int]) -> float:
    p1, p2, p3, p4, p5, p6 = [pts[i] for i in eye_idx]
    den = 2.0 * dist(p1, p4)
    return 0.0 if den == 0 else (dist(p2, p6) + dist(p3, p5)) / den


def sym_score(delta_l: float, delta_r: float) -> float:
    lo, hi = min(delta_l, delta_r), max(delta_l, delta_r)
    if hi == 0:
        return 100.0 if lo == 0 else 0.0
    return (lo / hi) * 100.0


def draw_text_box(frame: Any, lines: list[str], x: int = 10, y: int = 12) -> None:
    if not lines:
        return
    font, scale, thick, gap, pad = cv2.FONT_HERSHEY_SIMPLEX, 0.62, 2, 8, 10
    sizes = [cv2.getTextSize(line, font, scale, thick)[0] for line in lines]
    bw = max(w for w, _ in sizes) + 2 * pad
    lh = max(h for _, h in sizes)
    bh = (lh * len(lines)) + (gap * (len(lines) - 1)) + 2 * pad
    x2, y2 = min(frame.shape[1] - 1, x + bw), min(frame.shape[0] - 1, y + bh)
    cv2.rectangle(frame, (x, y), (x2, y2), (15, 15, 15), -1)
    cv2.rectangle(frame, (x, y), (x2, y2), (60, 60, 60), 1)
    ty = y + pad + lh
    for line in lines:
        cv2.putText(frame, line, (x + pad, ty), font, scale, (235, 235, 235), thick, cv2.LINE_AA)
        ty += lh + gap


def put_centered(frame: Any, text: str, center_y: int, scale: float = 0.8, thick: int = 2, color=(245, 245, 245)) -> None:
    font = cv2.FONT_HERSHEY_SIMPLEX
    (tw, th), _ = cv2.getTextSize(text, font, scale, thick)
    x, y = max(10, (frame.shape[1] - tw) // 2), center_y + th // 2
    cv2.putText(frame, text, (x, y), font, scale, color, thick, cv2.LINE_AA)


def create_detector() -> tuple[str, Any]:
    if hasattr(mp, "solutions") and hasattr(mp.solutions, "face_mesh"):
        fm = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        return "mesh", fm

    if not hasattr(mp, "tasks"):
        raise RuntimeError("Mediapipe has no solutions/tasks API.")

    model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "face_landmarker.task")
    if not os.path.exists(model_path):
        raise FileNotFoundError("face_landmarker.task not found next to main.py")

    BaseOptions = mp.tasks.BaseOptions
    FaceLandmarker = mp.tasks.vision.FaceLandmarker
    FaceLandmarkerOptions = mp.tasks.vision.FaceLandmarkerOptions
    RunningMode = mp.tasks.vision.RunningMode
    options = FaceLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=model_path),
        running_mode=RunningMode.IMAGE,
        num_faces=1,
    )
    return "tasks", FaceLandmarker.create_from_options(options)


def detect_landmarks(detector_mode: str, detector: Any, rgb: Any) -> Any:
    if detector_mode == "mesh":
        r = detector.process(rgb)
        return r.multi_face_landmarks[0] if r.multi_face_landmarks else None

    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    r = detector.detect(mp_image)
    return r.face_landmarks[0] if r.face_landmarks else None


def to_xy(face_landmarks: Any, w: int, h: int) -> Any:
    pts = np.zeros((468, 2), dtype=np.float32)
    src = face_landmarks.landmark[:468] if hasattr(face_landmarks, "landmark") else face_landmarks[:468]
    for i, lm in enumerate(src):
        pts[i, 0], pts[i, 1] = lm.x * w, lm.y * h
    return pts


def measures(pts: Any) -> dict:
    nose = ccenter(pts, IDX["nose"])
    cx = float(nose[0])
    mouth_r, mouth_l = ccenter(pts, IDX["mouth_r"]), ccenter(pts, IDX["mouth_l"])
    brow_r, brow_l = ccenter(pts, IDX["brow_r"]), ccenter(pts, IDX["brow_l"])
    inner_r, inner_l = ccenter(pts, IDX["inner_r"]), ccenter(pts, IDX["inner_l"])
    return {
        "nose": nose,
        "center_x": cx,
        "mouth_r": mouth_r,
        "mouth_l": mouth_l,
        "brow_r": brow_r,
        "brow_l": brow_l,
        "inner_r": inner_r,
        "inner_l": inner_l,
        "mouth_r_to_center": abs(float(mouth_r[0]) - cx),
        "mouth_l_to_center": abs(float(mouth_l[0]) - cx),
        "brow_r_y": float(brow_r[1]),
        "brow_l_y": float(brow_l[1]),
        "ear_r": ear(pts, IDX["eye_r"]),
        "ear_l": ear(pts, IDX["eye_l"]),
        "mouth_width": abs(float(mouth_l[0]) - float(mouth_r[0])),
        "inner_width": abs(float(inner_l[0]) - float(inner_r[0])),
        "inner_r_to_center": abs(float(inner_r[0]) - cx),
        "inner_l_to_center": abs(float(inner_l[0]) - cx),
    }


def draw_markers(frame: Any, m: dict) -> None:
    for key, color in [
        ("mouth_r", (0, 220, 255)),
        ("mouth_l", (0, 220, 255)),
        ("brow_r", (0, 255, 0)),
        ("brow_l", (0, 255, 0)),
        ("inner_r", (0, 100, 255)),
        ("inner_l", (0, 100, 255)),
    ]:
        pt = m[key]
        cv2.circle(frame, (int(pt[0]), int(pt[1])), 3, color, -1)
    cx = int(m["center_x"])
    cv2.line(frame, (cx, 0), (cx, frame.shape[0] - 1), (80, 80, 80), 1)


def render_results(frame: Any, report: dict) -> None:
    h = frame.shape[0]
    frame[:] = (18, 18, 18)
    title_y = max(60, h // 5)
    put_centered(frame, "Recovery Progress Report", title_y, scale=1.0, thick=2)
    rows = [
        f"1) Smile Symmetry: {report['Smile Symmetry']:.1f}%",
        f"2) Eyebrow Raise Symmetry: {report['Eyebrow Raise Symmetry']:.1f}%",
        f"3) Eye Squeeze Symmetry: {report['Eye Squeeze Symmetry']:.1f}%",
        f"4) Pucker Symmetry: {report['Pucker Symmetry']:.1f}%",
        f"5) Frown Symmetry: {report['Frown Symmetry']:.1f}%",
    ]
    y0 = title_y + 60
    for i, row in enumerate(rows):
        put_centered(frame, row, y0 + i * 42, scale=0.72, thick=2)
    put_centered(
        frame,
        f"Overall Session Score: {report['Overall Session Score']:.1f}%",
        y0 + len(rows) * 50,
        scale=0.98,
        thick=3,
        color=(0, 255, 200),
    )
    put_centered(frame, "Press q to quit.", y0 + len(rows) * 50 + 48, scale=0.65, thick=2)


def main() -> None:
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return

    try:
        detector_mode, detector = create_detector()
    except Exception as ex:
        print(f"Error creating face detector: {ex}")
        cap.release()
        return

    state = "INTRO"
    n_frames, count = 80, 0
    baseline, records, report = {}, {}, {}
    report_ready = False

    next_prompt = {
        "SMILE": "BROW_PROMPT",
        "BROW": "EYE_PROMPT",
        "EYE": "PUCKER_PROMPT",
        "PUCKER": "FROWN_PROMPT",
        "FROWN": "RESULTS",
    }

    def start_record(ex_name: str) -> None:
        nonlocal state, count
        if ex_name == "SMILE":
            records["smile_right_move_max"] = 0.0
            records["smile_left_move_max"] = 0.0
        elif ex_name == "BROW":
            records["brow_right_elev_max"] = 0.0
            records["brow_left_elev_max"] = 0.0
        elif ex_name == "EYE":
            records["eye_right_ear_min"] = float("inf")
            records["eye_left_ear_min"] = float("inf")
        elif ex_name == "PUCKER":
            records["pucker_right_move_max"] = 0.0
            records["pucker_left_move_max"] = 0.0
        elif ex_name == "FROWN":
            records["frown_right_move_max"] = 0.0
            records["frown_left_move_max"] = 0.0
        count = 0
        state = f"{ex_name}_RECORD"

    def motion_corrected(point: Any, m: dict) -> Any:
        dx = float(m["nose"][0]) - baseline["nose_x"]
        dy = float(m["nose"][1]) - baseline["nose_y"]
        return np.array([float(point[0]) - dx, float(point[1]) - dy], dtype=np.float32)

    def update_record(ex_name: str, m: dict) -> None:
        if ex_name == "SMILE":
            mr = motion_corrected(m["mouth_r"], m)
            ml = motion_corrected(m["mouth_l"], m)
            records["smile_right_move_max"] = max(records["smile_right_move_max"], dist(mr, baseline["mouth_r_pt"]))
            records["smile_left_move_max"] = max(records["smile_left_move_max"], dist(ml, baseline["mouth_l_pt"]))
        elif ex_name == "BROW":
            records["brow_right_elev_max"] = max(records["brow_right_elev_max"], baseline["brow_r_y"] - m["brow_r_y"])
            records["brow_left_elev_max"] = max(records["brow_left_elev_max"], baseline["brow_l_y"] - m["brow_l_y"])
        elif ex_name == "EYE":
            records["eye_right_ear_min"] = min(records["eye_right_ear_min"], m["ear_r"])
            records["eye_left_ear_min"] = min(records["eye_left_ear_min"], m["ear_l"])
        elif ex_name == "PUCKER":
            mr = motion_corrected(m["mouth_r"], m)
            ml = motion_corrected(m["mouth_l"], m)
            records["pucker_right_move_max"] = max(records["pucker_right_move_max"], dist(mr, baseline["mouth_r_pt"]))
            records["pucker_left_move_max"] = max(records["pucker_left_move_max"], dist(ml, baseline["mouth_l_pt"]))
        elif ex_name == "FROWN":
            ir = motion_corrected(m["inner_r"], m)
            il = motion_corrected(m["inner_l"], m)
            records["frown_right_move_max"] = max(records["frown_right_move_max"], dist(ir, baseline["inner_r_pt"]))
            records["frown_left_move_max"] = max(records["frown_left_move_max"], dist(il, baseline["inner_l_pt"]))

    def build_report() -> dict:
        smile = sym_score(records["smile_left_move_max"], records["smile_right_move_max"])
        brow = sym_score(abs(records["brow_left_elev_max"] - 0.0), abs(records["brow_right_elev_max"] - 0.0))
        eye = sym_score(
            abs(records["eye_left_ear_min"] - baseline["ear_l"]),
            abs(records["eye_right_ear_min"] - baseline["ear_r"]),
        )
        pucker = sym_score(records["pucker_left_move_max"], records["pucker_right_move_max"])
        frown = sym_score(records["frown_left_move_max"], records["frown_right_move_max"])
        overall = float(np.mean([smile, brow, eye, pucker, frown]))
        return {
            "Smile Symmetry": smile,
            "Eyebrow Raise Symmetry": brow,
            "Eye Squeeze Symmetry": eye,
            "Pucker Symmetry": pucker,
            "Frown Symmetry": frown,
            "Overall Session Score": overall,
        }

    while cap.isOpened():
        ok, frame = cap.read()
        if not ok:
            break

        frame = cv2.flip(frame, 1)
        h, w = frame.shape[:2]
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        lm = detect_landmarks(detector_mode, detector, rgb)
        has_face = lm is not None
        m = measures(to_xy(lm, w, h)) if has_face else None

        if state != "RESULTS" and m is not None:
            draw_markers(frame, m)

        lines = []

        if state == "INTRO":
            lines = ["Relax face. Press ENTER to Calibrate.", "Press q to quit."]

        elif state == "CALIBRATING":
            if m is None:
                lines = ["Calibrating... Keep face in frame."]
            else:
                baseline = {
                    "nose_x": float(m["nose"][0]),
                    "nose_y": float(m["nose"][1]),
                    "mouth_r_pt": np.array([float(m["mouth_r"][0]), float(m["mouth_r"][1])], dtype=np.float32),
                    "mouth_l_pt": np.array([float(m["mouth_l"][0]), float(m["mouth_l"][1])], dtype=np.float32),
                    "inner_r_pt": np.array([float(m["inner_r"][0]), float(m["inner_r"][1])], dtype=np.float32),
                    "inner_l_pt": np.array([float(m["inner_l"][0]), float(m["inner_l"][1])], dtype=np.float32),
                    "mouth_r_to_center": m["mouth_r_to_center"],
                    "mouth_l_to_center": m["mouth_l_to_center"],
                    "brow_r_y": m["brow_r_y"],
                    "brow_l_y": m["brow_l_y"],
                    "ear_r": m["ear_r"],
                    "ear_l": m["ear_l"],
                    "mouth_width": m["mouth_width"],
                    "inner_width": m["inner_width"],
                    "inner_r_to_center": m["inner_r_to_center"],
                    "inner_l_to_center": m["inner_l_to_center"],
                }
                state = "SMILE_PROMPT"
                lines = ["Calibration complete."]

        elif state.endswith("_PROMPT"):
            ex_name = state.replace("_PROMPT", "")
            ex_num = ["SMILE", "BROW", "EYE", "PUCKER", "FROWN"].index(ex_name) + 1
            tail = " to start" if ex_name == "SMILE" else ""
            lines = [f"Ex {ex_num}: {EX[ex_name]} Press ENTER{tail}", "Press q to quit."]

        elif state.endswith("_RECORD"):
            ex_name = state.replace("_RECORD", "")
            ex_num = ["SMILE", "BROW", "EYE", "PUCKER", "FROWN"].index(ex_name) + 1
            lines = [f"Ex {ex_num} Recording... Frames left: {n_frames - count}"]
            if m is not None:
                update_record(ex_name, m)
                count += 1
                if count >= n_frames:
                    state = next_prompt[ex_name]

        elif state == "RESULTS":
            if not report_ready:
                report = build_report()
                report_ready = True
                
                # Save the report to the frontend so it dynamically updates
                BASE_DIR = os.path.dirname(os.path.abspath(__file__))
                save_path = os.path.join(BASE_DIR, "frontend", "public", "recovery_history.json")
                history = []
                if os.path.exists(save_path):
                    try:
                        with open(save_path, "r") as f:
                            data = f.read().strip()
                            if data:
                                history = json.loads(data)
                    except json.JSONDecodeError:
                        pass
                
                history.append({
                    "date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "scores": report
                })
                
                os.makedirs(os.path.dirname(save_path), exist_ok=True)
                with open(save_path, "w") as f:
                    json.dump(history, f, indent=4)
                    
            render_results(frame, report)

        if state != "RESULTS":
            if not has_face and state != "INTRO":
                lines.append("No face detected. Keep face centered.")
            draw_text_box(frame, lines)

        cv2.imshow("AI-Based Bell's Palsy Rehabilitation Progress Tracker", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            break
        if key == 13:
            if state == "INTRO":
                state = "CALIBRATING"
            elif state.endswith("_PROMPT"):
                start_record(state.replace("_PROMPT", ""))

    cap.release()
    if detector is not None and hasattr(detector, "close"):
        detector.close()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
