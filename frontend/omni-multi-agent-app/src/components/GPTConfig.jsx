import React, { useState } from "react";
import { configureGPT } from "../services/api";
import styled from "styled-components";

const ConfigForm = styled.form`
  display: flex;
  gap: 10px;
  margin: 10px 0;
`;

const Input = styled.input`
  padding: 8px;
  width: 300px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const Button = styled.button`
  padding: 8px 16px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #45a049;
  }
`;

const Status = styled.div`
  margin-top: 10px;
  color: ${(props) => (props.error ? "red" : "green")};
`;

const GPTConfig = ({ onConfigured }) => {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setStatus("Configuring...");
      console.log("Attempting to configure API key..."); // Debug log
      const response = await configureGPT(apiKey);
      console.log("Configuration response:", response); // Debug log

      if (response.status === "success") {
        setStatus("API key configured successfully!");
        if (onConfigured) onConfigured();
      }
    } catch (error) {
      console.error("Configuration error:", error);
      setStatus(`Failed to configure API key: ${error.message}`);
    }
  };

  return (
    <ConfigForm onSubmit={handleSubmit}>
      <Input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Enter your OpenAI API key"
        required
      />
      <Button type="submit">Save API Key</Button>
      {status && <Status error={status.includes("Failed")}>{status}</Status>}
    </ConfigForm>
  );
};

export default GPTConfig;
