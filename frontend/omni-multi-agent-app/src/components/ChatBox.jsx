import React, { useState } from "react";
import { chatWithLLM } from "../services/api";

const ChatBox = () => {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleSubmit = async () => {
    const data = await chatWithLLM(input);
    setResponse(data.response);
    if (data.image) {
      setImageUrl(data.image);
    }
  };

  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={handleSubmit}>Send</button>
      <p>Response: {response}</p>
      {imageUrl && (
        <img src={imageUrl} alt="Generated" style={{ maxWidth: "100%" }} />
      )}
    </div>
  );
};

export default ChatBox;
