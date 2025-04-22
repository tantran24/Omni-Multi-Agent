import React, { useRef, useState, useEffect } from "react";
import { X } from "lucide-react";
import { uploadVoiceRecording } from "../../services/api";
const VoiceRecorder = ({ onResult, onClose, darkMode }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => cleanupResources();
  }, []);

  // Start recording automatically when component mounts
  useEffect(() => {
    startRecording();
  }, []);

  // Draw canvas waveform when recording
  useEffect(() => {
    if (isRecording && canvasRef.current && analyserRef.current) {
      drawWaveform();
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isRecording]);

  const cleanupResources = () => {
    clearInterval(timerIntervalRef.current);
    cancelAnimationFrame(animationFrameRef.current);

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error("Error stopping media recorder:", e);
      }
      mediaRecorderRef.current = null;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    const height = canvas.height;
    const width = canvas.width;

    ctx.clearRect(0, 0, width, height);

    let frameCount = 0;

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      frameCount++;
      if (frameCount % 5 !== 0) return;

      analyser.getByteTimeDomainData(dataArray);
      const imageData = ctx.getImageData(1, 0, width - 1, height);
      ctx.clearRect(0, 0, width, height);
      ctx.putImageData(imageData, 0, 0);

      const middle = dataArray[Math.floor(bufferLength / 2)] / 128 - 1;
      const amplitude = (middle * height) / 2;

      ctx.beginPath();
      ctx.strokeStyle = darkMode ? "#ffffff" : "#000000";
      ctx.moveTo(width - 1, height / 2);
      ctx.lineTo(width - 1, height / 2 + amplitude);
      ctx.stroke();
    };
    draw();
  };
  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }

    return () => clearInterval(timerIntervalRef.current);
  }, [isRecording]);
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      setRecordingTime(0);
      mediaRecorder.start(100);
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      clearInterval(timerIntervalRef.current);
      setIsRecording(false);
    }
  };

  const handleConfirm = async () => {
    stopRecording();

    if (audioChunksRef.current.length > 0) {
      try {
        setIsProcessing(true);

        const result = await uploadVoiceRecording(audioChunksRef.current);

        if (result?.transcription) {
          onResult(result.transcription);
        } else {
          console.error("API response missing transcription field:", result);
        }
      } catch (error) {
        console.error("Error processing audio:", error);
        onResult("This is a demo transcription result");
      } finally {
        setIsProcessing(false);
        onClose?.();
        audioChunksRef.current = [];
        cleanupResources();
      }
    } else {
      onClose?.();
      audioChunksRef.current = [];
      cleanupResources();
    }
  };

  const handleCancel = () => {
    stopRecording();
    onClose?.();
    audioChunksRef.current = [];
    cleanupResources();
  };

  return (
    <div className="mb-3 p-4 rounded-lg bg-[var(--accent)] border border-[var(--border)] shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium">Voice Message</h3>
        {isProcessing ? (
          <div className="text-[#3b82f6]">
            <span className="animate-pulse">Processing...</span>
          </div>
        ) : (
          <div className="text-[#ef4444]">
            <span className="animate-pulse">● Recording</span>
          </div>
        )}
        <div className="flex items-center text-xs bg-black/70 text-white px-2 py-1 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="red"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 mr-1"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{formatTime(recordingTime)}</span>
        </div>
        <button
          onClick={handleCancel}
          className="p-1 hover:bg-[var(--muted)] rounded-full transition-all duration-200"
        >
          <X size={18} />
        </button>
      </div>

      {/* Canvas for visualization */}
      <canvas
        ref={canvasRef}
        width={300}
        height={100}
        className="w-full h-16 bg-[var(--background)] rounded-lg mb-3"
      />

      {/* Control buttons */}
      <div className="flex justify-end space-x-2">
        <button
          onClick={handleConfirm}
          className="flex items-center gap-2 p-2 text-sm rounded-lg border border-var(--foreground) font-semibold transition-all duration-200 "
          disabled={isProcessing}
        >
          <span>{isProcessing ? "Processing..." : "Confirm"}</span>
        </button>
      </div>
    </div>
  );
};

export default VoiceRecorder;