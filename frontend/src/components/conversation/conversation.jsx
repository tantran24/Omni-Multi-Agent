import React, { useState, useEffect, useCallback, useRef } from "react";
import { useMicVAD } from "@ricky0123/vad-react";
import { useConversationWebSocket, ReadyState } from "../../services/api";
import { playAudio } from "../../utils/playAudio";
import { Mic, MicOff, PhoneOff, AlertCircle, UserCircle2 } from "lucide-react";
import { useVADConfiguration } from "../../utils/vadConfig";

const Conversation = ({ handleCloseWindow }) => {
  // Initialize VAD configuration to suppress ONNX warnings
  useVADConfiguration();

  const { sendMessage, lastMessage, readyState, connectionStatus } =
    useConversationWebSocket({});
  const [onMic, setOnMic] = useState(false);
  const [displayedTurn, setDisplayedTurn] = useState("Turn on Mic");
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
    if (
      lastMessage !== null &&
      lastMessage !== playedMessageRef.current &&
      lastMessage.data instanceof Blob
    ) {
      if (lastMessage.data.size === 0) {
        console.warn("Received empty Blob, skipping playback.");
        return;
      }
      console.log("Received Blob message, preparing to play.");
      playAudio(lastMessage.data, {
        onEnd: handlePlaybackEnd,
      });
      playedMessageRef.current = lastMessage;
    } else if (
      lastMessage !== null &&
      lastMessage.data &&
      !(lastMessage.data instanceof Blob)
    ) {
      console.warn(
        "Received message data is not a playable Blob:",
        lastMessage.data
      );
    }
  }, [lastMessage, handlePlaybackEnd]);
  const toggleMic = () => {
    const turningOn = !onMic;
    setOnMic(turningOn);
    setDisplayedTurn(turningOn ? "Mute" : "Unmute");

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
    <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center font-sans p-4 bg-[var(--background)] text-[var(--foreground)]">
      {/* Example gradient */}
      {/* Status */}{" "}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-[var(--background)]/90 border border-[var(--border)] px-4 py-1.5 rounded-full text-sm z-10 text-center backdrop-blur-sm shadow-lg text-[var(--foreground)]">
        <p>Status: {connectionStatus}</p>
        {isPausedForPlaybackUI && (
          <p className="text-blue-500 animate-pulse">Playing audio...</p>
        )}
        {vad.errored && (
          <p className="text-red-500 flex items-center justify-center gap-1 font-medium">
            <AlertCircle size={16} /> Mic Error: {vad.errored.message}
          </p>
        )}
      </div>
      {/* Caller Info */}
      <div className="flex flex-col items-center justify-center flex-grow text-center">
        <div
          className={`
                        mb-4 rounded-full p-2 transition-all duration-300 ease-in-out
                        ${
                          vad.userSpeaking
                            ? "bg-green-500/30 ring-4 ring-green-500/50"
                            : "bg-zinc-700/50"
                        }
                     `}
        >
          {/* Thay thế UserCircle2 bằng ảnh nếu có */}{" "}
          <img
            src="src/assets/avabot.webp"
            alt="Avatar"
            className="w-32 h-32 rounded-full object-cover text-zinc-400"
          />
          {/* Adjusted size and added alt */}
        </div>{" "}
        <h2 className="text-2xl font-semibold mb-1 text-[var(--foreground)]">
          Interactive Bot
        </h2>
        {/* Example Name */}{" "}
        <p className="text-sm text-[var(--muted-foreground)]">In call...</p>
        {/* Example Status */}
      </div>
      {/* Controls */}{" "}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-5 sm:gap-6 bg-[var(--background)] border border-[var(--border)] backdrop-blur-md p-3 sm:p-4 rounded-full z-30 shadow-xl">
        <button
          title={onMic ? "Mute" : "Unmute"}
          className={`
                            group relative rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center cursor-pointer
                            transition-all duration-200 ease-in-out transform active:scale-90
                            disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--background)] focus:ring-blue-500
                            ${
                              onMic
                                ? "bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent)]/90"
                                : "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary)]/90"
                            }
                        `}
          onClick={toggleMic}
          disabled={!isConnected || isPausedForPlaybackUI}
          aria-label={onMic ? "Mute microphone" : "Unmute microphone"}
        >
          {onMic ? <Mic size={iconSize} /> : <MicOff size={iconSize} />}
        </button>

        <button
          title="End call"
          className="
                            group relative bg-red-600 text-white rounded-full w-14 h-14 sm:w-16 sm:h-16
                            flex items-center justify-center cursor-pointer
                            transition-all duration-200 ease-in-out hover:bg-red-700 transform active:scale-90
                            disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--background)] focus:ring-red-500
                        "
          onClick={endCall}
          aria-label="End call"
        >
          <PhoneOff size={iconSize} />
        </button>
      </div>
      {/* Debug Info */}{" "}
      <div className="absolute top-2 left-2 z-40 flex flex-col gap-1">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] px-2 py-1 text-xs rounded shadow"
        >
          {showDebug ? "Hide Debug" : "Show Debug"}
        </button>
      </div>
      {showDebug && (
        <div className="absolute top-10 left-2 bg-[var(--background)]/90 border border-[var(--border)] text-[var(--foreground)] p-2 text-xs z-40 rounded max-w-xs shadow-lg">
          <p>
            WS: {connectionStatus} (State: {readyState})
          </p>{" "}
          <p>Mic Intent: {onMic ? "On" : "Off"}</p>
          <p>
            VAD:
            {isPausedForPlaybackUI
              ? "Paused (Playback UI)"
              : vad.listening
              ? "Listening"
              : "Idle/Paused"}
          </p>
          <p>Speaking: {vad.userSpeaking ? "Yes" : "No"}</p>
          <p>Mic Error: {vad.errored ? vad.errored.message : "None"}</p>
        </div>
      )}
    </div>
  );
};

export default Conversation;
