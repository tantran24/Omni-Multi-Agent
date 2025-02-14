import React, { useState } from "react";
import { chatWithLLM, speakText, listenAudio, generateImage } from "./services/api";

const App = () => {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [image, setImage] = useState("");

  const handleChatSubmit = async () => {
    const result = await chatWithLLM(input);
    setResponse(result.response);
  };

  const handleSpeak = async () => {
    await speakText(input);
  };

  const handleListen = async () => {
    const result = await listenAudio();
    setResponse(result.text);
  };

  const handleImageGen = async () => {
    const result = await generateImage(input);
    setImage(result.file);
  };

  return (
    <div>
      <h1>Omni Multi Agent</h1>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter your prompt"
      />
      <button onClick={handleChatSubmit}>Chat with LLM</button>
      <button onClick={handleSpeak}>Speak</button>
      <button onClick={handleListen}>Listen</button>
      <button onClick={handleImageGen}>Generate Image</button>
      <p>Response: {response}</p>
      {image && <img src={image} alt="Generated" />}
    </div>
  );
};

export default App;

