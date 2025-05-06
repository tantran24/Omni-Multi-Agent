import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMicVAD } from '@ricky0123/vad-react';
import { useConversationWebSocket, ReadyState } from '../../services/api';
import { playAudio } from '../../utils/playAudio';
import { Mic, MicOff, PhoneOff, AlertCircle, UserCircle2 } from 'lucide-react';

const Conversation = ({ handleCloseWindow }) => {
    const { sendMessage, lastMessage, readyState, connectionStatus } = useConversationWebSocket({});
    const [onMic, setOnMic] = useState(false);
    const [displayedTurn, setDisplayedTurn] = useState('Turn on Mic');
    const [isPausedForPlaybackUI, setIsPausedForPlaybackUI] = useState(false);
    const playedMessageRef = useRef(null);

    const vad = useMicVAD({
        startOnLoad: false,
        onSpeechEnd: (audio) => {
            if (onMic && audio.length > 0) {
                setOnMic(false);
                setIsPausedForPlaybackUI(true);
                vad.pause();
                console.log("Sending audio data...");
                sendMessage(audio.buffer);
            } else {
                console.log("VAD stopped: No audio data captured.");
            }
        },
    });

    const handlePlaybackEnd = useCallback(() => {
        setIsPausedForPlaybackUI(false);
        setOnMic(true);
        vad.start();
    }, [vad]);

    useEffect(() => {
        if (lastMessage !== null && lastMessage !== playedMessageRef.current && lastMessage.data instanceof Blob) {
            if (lastMessage.data.size === 0) {
                console.warn("Received empty Blob, skipping playback.");
                return;
            }
            console.log("Received Blob message, preparing to play.");
            playAudio(lastMessage.data, {
                onEnd: handlePlaybackEnd
            });
            playedMessageRef.current = lastMessage;

        } else if (lastMessage !== null && lastMessage.data && !(lastMessage.data instanceof Blob)) {
            console.warn("Received message data is not a playable Blob:", lastMessage.data);
        }
    }, [lastMessage, handlePlaybackEnd]);

    const toggleMic = () => {
        const turningOn = !onMic;
        setOnMic(turningOn);
        setDisplayedTurn(turningOn ? "Turn off Mic" : "Turn on Mic");

        if (turningOn) {
            vad.start();
        } else {
            vad.pause();
        }
    };

    const endCall = () => {
        console.log("Ending call...");
        vad.pause();
        setOnMic(false);
        handleCloseWindow();
    };

    const isConnected = readyState === ReadyState.OPEN;
    const iconSize = 24;
    const [showDebug, setShowDebug] = useState(false);

    return (
        <div className="relative w-full h-screen bg-white overflow-hidden flex flex-col items-center justify-center text-white font-sans p-4" style={{ background: 'linear-gradient(135deg, #2b3247 0%, #1c202d 100%)' }}> {/* Example gradient */}

            {/* Status */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-black/40 px-4 py-1.5 rounded-full text-sm z-10 text-center backdrop-blur-sm shadow-lg">
                <p>Trạng thái: {connectionStatus}</p>
                {/* Sử dụng state UI để hiển thị */}
                {isPausedForPlaybackUI && <p className="text-blue-300 animate-pulse">Đang phát âm thanh...</p>}
                {vad.errored && (
                    <p className="text-red-400 flex items-center justify-center gap-1 font-medium">
                        <AlertCircle size={16} /> Lỗi Mic: {vad.errored.message}
                    </p>
                )}
            </div>

            {/* Caller Info */}
            <div className="flex flex-col items-center justify-center flex-grow text-center">
                <div className={`
                        mb-4 rounded-full p-2 transition-all duration-300 ease-in-out
                        ${vad.userSpeaking ? 'bg-green-500/30 ring-4 ring-green-500/50' : 'bg-zinc-700/50'}
                     `}>
                    {/* Thay thế UserCircle2 bằng ảnh nếu có */}
                    <img src="src/assets/avabot.webp" alt="Avatar" className="w-32 h-32 rounded-full object-cover text-zinc-400" /> {/* Adjusted size and added alt */}
                </div>
                <h2 className="text-2xl font-semibold mb-1 text-gray-100">Bot Tương Tác</h2> {/* Example Name */}
                <p className="text-sm text-zinc-400">Đang trong cuộc gọi...</p> {/* Example Status */}
            </div>

            {/* Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-5 sm:gap-6 bg-zinc-800/70 backdrop-blur-md p-3 sm:p-4 rounded-full z-30 shadow-xl">
                <button
                    title={onMic ? "Tắt tiếng" : "Bật tiếng"}
                    className={`
                            group relative rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center cursor-pointer
                            transition-all duration-200 ease-in-out transform active:scale-90
                            disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-blue-500
                            ${onMic
                            ? 'bg-zinc-600/80 text-white hover:bg-zinc-500/90'
                            : 'bg-gray-300 text-zinc-800 hover:bg-gray-400'
                        }
                        `}
                    onClick={toggleMic}
                    disabled={!isConnected || isPausedForPlaybackUI}
                    aria-label={onMic ? "Tắt tiếng micro" : "Bật tiếng micro"}
                >
                    {onMic ? <Mic size={iconSize} /> : <MicOff size={iconSize} />}
                </button>

                <button
                    title="Kết thúc cuộc gọi"
                    className="
                            group relative bg-red-600 text-white rounded-full w-14 h-14 sm:w-16 sm:h-16
                            flex items-center justify-center cursor-pointer
                            transition-all duration-200 ease-in-out hover:bg-red-700 transform active:scale-90
                            disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-red-500
                        "
                    onClick={endCall} // Gọi hàm endCall thay vì handleCloseWindow trực tiếp
                    aria-label="Kết thúc cuộc gọi"
                >
                    <PhoneOff size={iconSize} />
                </button>
            </div>

            {/* Debug Info */}
            <div className="absolute top-2 left-2 z-40 flex flex-col gap-1">
                <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 text-xs rounded shadow"
                >
                    {showDebug ? 'Ẩn Debug' : 'Hiện Debug'}
                </button>
            </div>
            {showDebug && (
                <div className="absolute top-10 left-2 bg-black/70 text-white p-2 text-xs z-40 rounded max-w-xs shadow-lg">
                    <p>WS: {connectionStatus} (State: {readyState})</p>
                    <p>Mic Intent: {onMic ? "On" : "Off"}</p>
                    <p>VAD: {isPausedForPlaybackUI ? "Paused (Playback UI)" : vad.listening ? "Listening" : "Idle/Paused"}</p>
                    <p>Speaking: {vad.userSpeaking ? "Yes" : "No"}</p>
                    <p>Mic Error: {vad.errored ? vad.errored.message : 'None'}</p>
                </div>
            )}
        </div>
    );
};

export default Conversation;