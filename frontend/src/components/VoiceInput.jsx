import { useRef, useState, useEffect } from "react";
import { IconButton } from "../utils/customizeButton";
import { Mic, Check, X, Timer } from "lucide-react";
import { Popover } from 'react-tiny-popover'

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

    // Dọn dẹp resources khi component unmount
    useEffect(() => {
        return () => cleanupResources();
    }, []);

    // Effect để vẽ canvas khi recording bắt đầu
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
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
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
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
                setRecordingTime(prevTime => prevTime + 1);
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

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
            streamRef.current?.getTracks().forEach(track => track.stop());
            clearInterval(timerIntervalRef.current);
            setIsRecording(false);
        }
    };

    const handleConfirm = async () => {
        if (isRecording) {
            stopRecording();
        }

        if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

            try {
                setIsProcessing(true);

                const formData = new FormData();
                formData.append("audio", audioBlob, "recording.webm");

                const response = await fetch("/api/transcribe", {
                    method: "POST",
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`API returned status ${response.status}`);
                }

                const data = await response.json();

                if (data.text) {
                    onResult(data.text);
                } else {
                    console.error("API response missing text field:", data);
                }
            } catch (error) {
                console.error("Error processing audio:", error);
                // Fallback để demo - xóa dòng này khi có API thật
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
            <Popover
                isOpen={showPopover}
                positions={['top']}
                onClickOutside={handleCancel}
                content={
                    <div className="bg-white p-4 rounded-lg shadow-lg">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center text-sm bg-black bg-opacity-70 text-white px-3 py-1 rounded-full">
                                <Timer className="h-4 w-4 mr-1 text-red-500" />
                                <span>{formatTime(recordingTime)}</span>
                            </div>
                            {isRecording && (
                                <div className="text-sm text-red-500">
                                    <span className="animate-pulse">● Recording</span>
                                </div>
                            )}
                            {isProcessing && (
                                <div className="text-sm text-blue-500">
                                    <span className="animate-pulse">Processing...</span>
                                </div>
                            )}
                        </div>
                        <canvas
                            ref={canvasRef}
                            width={300}
                            height={100}
                            className="rounded bg-gray-100 mb-3"
                        />
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={handleConfirm}
                                disabled={isProcessing}
                                className={`flex items-center ${isProcessing ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} px-4 py-2 rounded-lg`}
                            >
                                <Check size={16} className="mr-1" />
                                {isProcessing ? 'Đang xử lý...' : 'Đồng ý'}
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={isProcessing}
                                className={`flex items-center ${isProcessing ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'} px-4 py-2 rounded-lg`}
                            >
                                <X size={16} className="mr-1" />
                                Hủy bỏ
                            </button>
                        </div>
                    </div>
                }
            >
                <IconButton onClick={toggleRecording} disabled={isProcessing}>
                    <Mic color={isRecording ? "red" : "white"} size={20} />
                </IconButton>
            </Popover>
        </div>
    );
};

export default VoiceRecorder;