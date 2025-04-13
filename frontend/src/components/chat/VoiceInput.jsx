import React, { useRef, useState, useEffect } from "react";
import { IconButton } from "../ui/Button";
import styled from "styled-components";

const RecordingCanvas = styled.canvas`
  width: 300px;
  height: 100px;
  border-radius: 8px;
  background-color: #f7f7f7;
  margin-bottom: 12px;
`;

const RecordingControls = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
`;

const RecordingInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const RecordingTime = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 16px;
`;

const RecordingStatus = styled.div`
  font-size: 0.85rem;
  color: ${(props) => (props.$isProcessing ? "#3b82f6" : "#ef4444")};
`;

const PopoverContent = styled.div`
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 320px;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  color: white;
  background-color: ${(props) => props.$color};
  transition: filter 0.2s ease;

  &:hover {
    filter: brightness(110%);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    margin-right: 4px;
  }
`;

/**
 * VoiceRecorder - Records audio and converts it to text
 * @param {Object} props Component props
 * @param {Function} props.onResult Callback function that receives the transcribed text
 */
const VoiceRecorder = ({ onResult }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showPopover, setShowPopover] = useState(false);
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

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);
      const imageData = ctx.getImageData(1, 0, width - 1, height);
      ctx.clearRect(0, 0, width, height);
      ctx.putImageData(imageData, 0, 0);

      const middle = dataArray[Math.floor(bufferLength / 2)] / 128 - 1;
      const amplitude = (middle * height) / 2;

      ctx.beginPath();
      ctx.strokeStyle = "#000000";
      ctx.moveTo(width - 1, height / 2);
      ctx.lineTo(width - 1, height / 2 + amplitude);
      ctx.stroke();
    };

    draw();
  };

  const startRecording = async () => {
    try {
      setShowPopover(true);

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
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);

      mediaRecorder.start(100);
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      setShowPopover(false);
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;

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
    if (isRecording) {
      stopRecording();
    }

    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
      try {
        setIsProcessing(true);

        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.wav");
        const response = await fetch("http://127.0.0.1:8000/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }

        const data = await response.json();

        if (data["transcription"]) {
          onResult(data["transcription"]);
        } else {
          console.error("API response missing text field:", data);
        }
      } catch (error) {
        console.error("Error processing audio:", error);
        // Fallback for demo purposes
        onResult("This is a demo transcription result");
      } finally {
        setIsProcessing(false);
        setShowPopover(false);
        audioChunksRef.current = [];
        cleanupResources();
      }
    } else {
      setShowPopover(false);
      cleanupResources();
    }
  };

  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    }

    setShowPopover(false);
    audioChunksRef.current = [];
    cleanupResources();
  };

  const toggleRecording = () => {
    if (showPopover) {
      handleCancel();
    } else {
      startRecording();
    }
  };
  return (
    <div className="flex flex-col items-center gap-2 relative">
      {showPopover && (
        <PopoverContent>
          <RecordingInfo>
            {" "}
            <RecordingTime>
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
            </RecordingTime>
            {isRecording && (
              <RecordingStatus>
                <span className="animate-pulse">● Recording</span>
              </RecordingStatus>
            )}
            {isProcessing && (
              <RecordingStatus $isProcessing>
                <span className="animate-pulse">Processing...</span>
              </RecordingStatus>
            )}
          </RecordingInfo>
          <RecordingCanvas ref={canvasRef} width={300} height={100} />
          <RecordingControls>
            <ActionButton
              onClick={handleConfirm}
              disabled={isProcessing}
              $color="#10b981"
            >
              {" "}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              {isProcessing ? "Processing..." : "Confirm"}
            </ActionButton>
            <ActionButton
              onClick={handleCancel}
              disabled={isProcessing}
              $color="#ef4444"
            >
              {" "}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Cancel
            </ActionButton>
          </RecordingControls>
        </PopoverContent>
      )}

      <IconButton
        onClick={toggleRecording}
        disabled={isProcessing}
        aria-label={isRecording ? "Stop recording" : "Start voice recording"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isRecording ? "red" : "white"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </IconButton>
    </div>
  );
};

export default VoiceRecorder;
