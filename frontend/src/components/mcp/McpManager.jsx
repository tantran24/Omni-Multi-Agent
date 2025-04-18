import React, { useState, useEffect } from "react";
import {
  listMcpConfigs,
  listMcpTools,
  addMcpConfig,
  deleteMcpConfig,
} from "../../services/api";

const McpManager = ({ onClose }) => {
  const [configs, setConfigs] = useState({});
  const [tools, setTools] = useState([]);
  const [jsonText, setJsonText] = useState("{}");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchConfigs = async () => {
    try {
      const data = await listMcpConfigs();
      setConfigs(data);
      const available = await listMcpTools();
      setTools(available);
    } catch (err) {
      console.error("Failed to fetch MCP configs", err);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleAdd = async () => {
    setError(null);
    try {
      const parsed = JSON.parse(jsonText.trim());
      if (
        typeof parsed !== "object" ||
        Array.isArray(parsed) ||
        Object.keys(parsed).length === 0
      ) {
        throw new Error("JSON must be an object mapping toolName to config");
      }
      // Unwrap legacy wrapper if present
      const mapping =
        parsed.mcpServers && typeof parsed.mcpServers === "object"
          ? parsed.mcpServers
          : parsed;
      // Validate mapping keys
      if (Object.keys(mapping).length === 0) {
        throw new Error("No valid tool configurations found");
      }
      await addMcpConfig(mapping);
      setJsonText("{}");
      fetchConfigs();
    } catch (err) {
      setError(err.message || "Invalid JSON");
    }
  };

  const handleDelete = async (configName) => {
    if (!window.confirm(`Delete config '${configName}'?`)) return;
    try {
      await deleteMcpConfig(configName);
      fetchConfigs();
    } catch (err) {
      console.error("Failed to delete MCP config", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-11/12 max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Manage MCP Tools</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            ✕
          </button>
        </div>
        <div className="mb-4">
          {" "}
          {/* Existing Configs block */}
          <h3 className="font-medium mb-2">Existing Configs</h3>
          {Object.keys(configs).length === 0 ? (
            <p className="text-sm text-gray-500">No configs defined.</p>
          ) : (
            <ul className="space-y-2 max-h-40 overflow-auto">
              {Object.entries(configs).map(([key, val]) => (
                <li
                  key={key}
                  className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded"
                >
                  <span className="font-mono text-sm">{key}</span>
                  <button
                    onClick={() => handleDelete(key)}
                    className="text-red-500 hover:underline text-sm"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mb-4">
          {" "}
          {/* Available Tools block */}
          <h3 className="font-medium mb-2">Available Tools</h3>
          {tools.length === 0 ? (
            <p className="text-sm text-gray-500">No tools available.</p>
          ) : (
            <ul className="space-y-2 max-h-40 overflow-auto">
              {tools.map((t) => (
                <li
                  key={t.name}
                  className="p-2 bg-gray-100 dark:bg-gray-700 rounded"
                >
                  <span className="font-mono text-sm font-semibold">
                    {t.name}
                  </span>
                  : <span className="text-sm">{t.description}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mb-4">
          <h3 className="font-medium mb-2">Add New Config</h3>
          <textarea
            rows={8}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={`Paste JSON mapping { "toolName": { /* config */ } }`}
            className="w-full p-2 border rounded font-mono text-sm bg-white dark:bg-gray-800 dark:border-gray-600"
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          <button
            onClick={handleAdd}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Config
          </button>
        </div>
      </div>
    </div>
  );
};

export default McpManager;
