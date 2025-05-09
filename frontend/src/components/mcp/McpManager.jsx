import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  listMcpTools,
  listMcpConfigs,
  deleteMcpConfig,
  addMcpConfig,
} from "../../services/api";
import { LoadingSpinner } from "../ui/Loading";

const McpManager = ({ isOpen, onClose }) => {
  const [tools, setTools] = useState([]);
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [configJson, setConfigJson] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [toolsResponse, configsResponse] = await Promise.all([
        listMcpTools(),
        listMcpConfigs(),
      ]);
      setTools(toolsResponse);
      setConfigs(configsResponse);
    } catch (err) {
      setError(err.message || "Failed to fetch MCP data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfig = async (name) => {
    try {
      setLoading(true);
      await deleteMcpConfig(name);
      await fetchData();
    } catch (err) {
      setError(err.message || "Failed to delete configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleAddConfig = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const config = JSON.parse(configJson);
      await addMcpConfig(config);
      setConfigJson(""); // Reset form
      await fetchData();
    } catch (err) {
      setError(
        err.message ||
          "Failed to add configuration. Make sure the JSON is valid."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--background)] rounded-lg p-6 max-w-2xl w-full mx-4 flex flex-col max-h-[80vh]">
            {/* Make this header sticky */}
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-[var(--background)] z-10 py-4">
              <h2 className="text-xl font-semibold">MCP Tools Manager</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[var(--accent)] rounded-full transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
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
              </button>
            </div>

            <div className="overflow-y-auto space-y-6">
              {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* MCP Servers list Section (Formerly Tool Configurations) */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      MCP Servers list
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {Object.entries(configs).map(([name, config]) => (
                        <div
                          key={name}
                          className="p-4 border border-[var(--border)] rounded-lg flex justify-between items-start"
                        >
                          <div>
                            <h4 className="font-medium">{name}</h4>
                            <p className="text-sm text-[var(--muted-foreground)]">
                              {config.url ? `URL: ${config.url}` : "Local tool"}
                            </p>
                            <p className="text-sm text-[var(--muted-foreground)]">
                              Transport: {config.transport || "stdio"}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteConfig(name)}
                            className="p-2 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors"
                          >
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
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Available Tools Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Available Tools
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {tools.map((tool) => (
                        <div
                          key={tool.name}
                          className="p-4 border border-[var(--border)] rounded-lg"
                        >
                          <h4 className="font-medium">{tool.name}</h4>
                          <p className="text-sm text-[var(--muted-foreground)]">
                            {tool.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add Configuration Form */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Add MCP Configuration
                    </h3>
                    <form onSubmit={handleAddConfig} className="space-y-4">
                      <textarea
                        placeholder='Paste your MCP configuration JSON here&#10;Example:&#10;{&#10;  "toolName": {&#10;    "url": "http://localhost:3000",&#10;    "transport": "sse"&#10;  }&#10;}'
                        value={configJson}
                        onChange={(e) => setConfigJson(e.target.value)}
                        className="w-full h-40 p-2 rounded-lg border border-[var(--border)] bg-[var(--background)] font-mono text-sm"
                        required
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-claude-purple text-white rounded-lg hover:bg-claude-purple/90 transition-colors"
                        >
                          Add Configuration
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

McpManager.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default McpManager;
