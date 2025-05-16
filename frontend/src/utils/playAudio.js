/**
 * Plays an audio Blob using the Web Audio API.
 *
 * @param {Blob} audioBlob The audio data to play.
 * @param {object} [callbacks] Optional callbacks.
 * @param {function} [callbacks.onEnd] Called when playback finishes or an error occurs.
 */
export const playAudio = async (audioBlob, { onEnd } = {}) => {
    if (!(audioBlob instanceof Blob) || audioBlob.size === 0) {
        console.error("playAudio: Input is not a valid Blob or Blob is empty.", audioBlob);
        if (typeof onEnd === 'function') {
            try {
                onEnd();
            } catch (e) {
                console.error("Error in onEnd callback (validation fail):", e);
            }
        }
        return;
    }
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') {
        await audioContext.resume().catch(err => console.warn("AudioContext resume failed:", err));
    }


    try {
        const arrayBuffer = await audioBlob.arrayBuffer();

        if (audioContext.state === 'closed') {
            if (typeof onEnd === 'function') {
                try {
                    onEnd();
                } catch (e) {
                    console.error("Error in onEnd callback (context closed):", e);
                }
            }
            return;
        }

        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        source.onended = () => {
            console.log("Audio playback finished.");
            if (audioContext.state !== 'closed') {
                audioContext.close().catch(err => console.warn("Error closing AudioContext:", err));
            }
            if (typeof onEnd === 'function') {
                try {
                    onEnd();
                } catch (e) {
                    console.error("Error in onEnd callback (playback ended):", e);
                }
            }
        };

        source.start();
        console.log("Audio playback started via audioPlayer.");

    } catch (error) {
        console.error("Error processing or playing audio in audioPlayer:", error);
        if (audioContext && audioContext.state !== 'closed') {
            audioContext.close().catch(err => console.warn("Error closing AudioContext after error:", err));
        }
        if (typeof onEnd === 'function') {
            try {
                onEnd();
            } catch (e) {
                console.error("Error in onEnd callback (catch block):", e);
            }
        }
    }
};