import React, { useState } from "react";
import { chatWithLLM } from "../services/api";

const ChatBox = () => {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  const handleSubmit = async () => {
    const data = await chatWithLLM(input);
    setResponse(data.response);
  };

  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={handleSubmit}>Send</button>
      <p>Response: {response}</p>
    </div>
  );
};

export default ChatBox;
