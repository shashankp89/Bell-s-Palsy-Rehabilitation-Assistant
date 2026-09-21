import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const EXERCISES = [
  { key: 'smile', label: 'Smile', instruction: 'Smile naturally' },
  { key: 'brow', label: 'Eyebrow Raise', instruction: 'Raise both eyebrows' },
  { key: 'eye', label: 'Eye Squeeze', instruction: 'Squeeze both eyes shut' },
  { key: 'pucker', label: 'Pucker', instruction: 'Pucker your lips into an O shape' },
  { key: 'frown', label: 'Frown', instruction: 'Frown or scowl' },
];

const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm';

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function average(points) {
  return points.reduce((result, point) => ({ x: result.x + point.x, y: result.y + point.y }), { x: 0, y: 0 });
}

function metrics(landmarks) {
  const point = (index) => landmarks[index];
  const mouthRight = point(61);
  const mouthLeft = point(291);
  const browRight = point(105);
  const browLeft = point(334);
  const innerRight = point(107);
  const innerLeft = point(336);
  const nose = average([point(168), point(1), point(4)]);
  const eyeRight = [33, 160, 158, 133, 153, 144].map(point);
  const eyeLeft = [362, 385, 387, 263, 373, 380].map(point);
  const ear = (eye) => {
    const denominator = 2 * distance(eye[0], eye[3]);
    return denominator ? (distance(eye[1], eye[5]) + distance(eye[2], eye[4])) / denominator : 0;
  };

  return {
    mouthRight: distance(mouthRight, nose),
    mouthLeft: distance(mouthLeft, nose),
    browRight: browRight.y,
    browLeft: browLeft.y,
    innerRight: distance(innerRight, nose),
    innerLeft: distance(innerLeft, nose),
    earRight: ear(eyeRight),
    earLeft: ear(eyeLeft),
  };
}

function symmetry(left, right) {
  const high = Math.max(Math.abs(left), Math.abs(right));
  return high === 0 ? 100 : Math.min(100, (Math.min(Math.abs(left), Math.abs(right)) / high) * 100);
}

function averageMetrics(samples) {
  const keys = Object.keys(samples[0]);
  return keys.reduce((result, key) => {
    result[key] = samples.reduce((sum, sample) => sum + sample[key], 0) / samples.length;
    return result;
  }, {});
}

export default function BrowserExercise({ onComplete, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const animationRef = useRef(null);
  const baselineRef = useRef(null);
  const samplesRef = useRef([]);
  const recordingRef = useRef(null);
  const statusRef = useRef('idle');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('Allow camera access to begin.');
  const [currentExercise, setCurrentExercise] = useState(0);
  const [progress, setProgress] = useState(0);
  const [scores, setScores] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => () => {
    cancelAnimationFrame(animationRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    landmarkerRef.current?.close();
  }, []);

  const processFrame = () => {
    if (!videoRef.current || !landmarkerRef.current || videoRef.current.readyState < 2) {
      animationRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const result = landmarkerRef.current.detectForVideo(videoRef.current, videoRef.current.currentTime * 1000);
    const landmarks = result.faceLandmarks?.[0];
    if (landmarks) {
      const nextMetrics = metrics(landmarks);
      if (statusRef.current === 'calibrating') samplesRef.current.push(nextMetrics);
      if (statusRef.current === 'recording' && recordingRef.current) recordingRef.current.push(nextMetrics);
      setMessage(statusRef.current === 'recording' ? EXERCISES[currentExercise].instruction : 'Face detected.');
    } else if (statusRef.current !== 'idle') {
      setMessage('No face detected. Keep your face centered.');
    }
    animationRef.current = requestAnimationFrame(processFrame);
  };

  const startCamera = async () => {
    try {
      setError('');
      setStatus('loading');
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 }, audio: false });
      videoRef.current.srcObject = streamRef.current;
      await videoRef.current.play();
      setStatus('calibration-ready');
      setMessage('Relax your face, then calibrate your baseline.');
      animationRef.current = requestAnimationFrame(processFrame);
    } catch (cameraError) {
      setStatus('idle');
      setError(cameraError.name === 'NotAllowedError' ? 'Camera permission was denied. Allow camera access and try again.' : `Could not start camera: ${cameraError.message}`);
    }
  };

  const calibrate = () => {
    samplesRef.current = [];
    setStatus('calibrating');
    setMessage('Hold a relaxed face for three seconds...');
    setTimeout(() => {
      if (samplesRef.current.length === 0) {
        setError('No face samples were captured. Center your face and try calibration again.');
        setStatus('calibration-ready');
        return;
      }
      baselineRef.current = averageMetrics(samplesRef.current);
      setStatus('ready');
      setMessage('Calibration complete. Start the first exercise.');
    }, 3000);
  };

  const recordExercise = () => {
    recordingRef.current = [];
    setProgress(0);
    setStatus('recording');
    setMessage(EXERCISES[currentExercise].instruction);
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setProgress(Math.min(100, (elapsed / 5000) * 100));
      if (elapsed >= 5000) {
        clearInterval(timer);
        const exerciseSamples = recordingRef.current;
        if (!exerciseSamples.length) {
          setError('No face samples were captured. Please repeat this exercise.');
          setStatus('ready');
          return;
        }
        const peak = averageMetrics(exerciseSamples);
        const base = baselineRef.current;
        const exercise = EXERCISES[currentExercise].key;
        let score;
        if (exercise === 'brow') score = symmetry(base.browRight - peak.browRight, base.browLeft - peak.browLeft);
        else if (exercise === 'eye') score = symmetry(base.earRight - peak.earRight, base.earLeft - peak.earLeft);
        else if (exercise === 'frown') score = symmetry(peak.innerRight - base.innerRight, peak.innerLeft - base.innerLeft);
        else if (exercise === 'pucker') score = symmetry(peak.mouthRight - base.mouthRight, peak.mouthLeft - base.mouthLeft);
        else score = symmetry(peak.mouthRight - base.mouthRight, peak.mouthLeft - base.mouthLeft);

        const nextScores = { ...scores, [exercise]: score };
        setScores(nextScores);
        if (currentExercise === EXERCISES.length - 1) {
          const finalScores = {
            'Smile Symmetry': nextScores.smile,
            'Eyebrow Raise Symmetry': nextScores.brow,
            'Eye Squeeze Symmetry': nextScores.eye,
            'Pucker Symmetry': nextScores.pucker,
            'Frown Symmetry': nextScores.frown,
          };
          finalScores['Overall Session Score'] = Object.values(finalScores).reduce((sum, value) => sum + value, 0) / 5;
          setStatus('complete');
          onComplete(finalScores);
        } else {
          setCurrentExercise((value) => value + 1);
          setStatus('ready');
          setMessage(`Great. Ready for ${EXERCISES[currentExercise + 1].label}.`);
        }
      }
    }, 100);
  };

  return (
    <div className="max-w-5xl mx-auto bg-white p-6 md:p-8 rounded-2xl shadow border border-gray-100 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Browser Exercise Session</h2>
          <p className="text-gray-500 mt-2">Your camera is processed in this browser. No video is uploaded.</p>
        </div>
        <button onClick={onCancel} className="h-fit px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid md:grid-cols-[1.3fr_1fr] gap-6">
        <div className="bg-gray-950 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
          <video ref={videoRef} className="w-full h-full object-cover -scale-x-100" playsInline muted />
          {status === 'idle' && <button onClick={startCamera} className="absolute bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold">Enable Camera</button>}
        </div>

        <div className="border border-gray-200 rounded-xl p-5">
          <p className="text-sm uppercase tracking-widest text-gray-400 font-bold">Step {Math.min(currentExercise + 1, 5)} of 5</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">{status === 'complete' ? 'Session Complete' : EXERCISES[currentExercise].label}</h3>
          <p className="text-gray-600 mt-3 min-h-12">{message}</p>
          <div className="h-2 bg-gray-100 rounded-full mt-5 overflow-hidden"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} /></div>
          <div className="mt-6 space-y-3">
            {status === 'calibration-ready' && <button onClick={calibrate} className="w-full bg-sky-600 hover:bg-sky-700 text-white px-4 py-3 rounded-lg font-bold">Calibrate Relaxed Face</button>}
            {status === 'ready' && <button onClick={recordExercise} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-lg font-bold">Start {EXERCISES[currentExercise].label}</button>}
            {status === 'loading' && <p className="text-sm text-gray-500">Loading the face model and camera...</p>}
            {status === 'recording' && <p className="text-sm text-emerald-600 font-semibold">Recording for five seconds...</p>}
          </div>
          <div className="mt-6 space-y-2">
            {EXERCISES.map((exercise, index) => <div key={exercise.key} className="flex justify-between text-sm"><span className={index < currentExercise || status === 'complete' ? 'text-gray-700' : 'text-gray-400'}>{exercise.label}</span><span className="font-semibold text-emerald-600">{scores[exercise.key] ? `${scores[exercise.key].toFixed(1)}%` : '--'}</span></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}
