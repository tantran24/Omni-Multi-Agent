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
          <div className="bg-[var(--background)] rounded-lg max-w-4xl w-full mx-4 flex flex-col max-h-[90vh] min-h-[60vh]">
            {/* Fixed header */}
            <div className="flex justify-between items-center p-6 border-b border-[var(--border)] flex-shrink-0">
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

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
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
                  {/* MCP Servers list Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      MCP Servers list
                    </h3>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-1 gap-4 pr-2">
                        {Object.entries(configs).length === 0 ? (
                          <div className="p-4 text-center text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-lg">
                            No MCP servers configured
                          </div>
                        ) : (
                          Object.entries(configs).map(([name, config]) => (
                            <div
                              key={name}
                              className="p-4 border border-[var(--border)] rounded-lg flex justify-between items-start"
                            >
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium truncate">{name}</h4>
                                <p className="text-sm text-[var(--muted-foreground)] break-words">
                                  {config.url
                                    ? `URL: ${config.url}`
                                    : "Local tool"}
                                </p>
                                {config.command && (
                                  <p className="text-xs text-[var(--muted-foreground)] mt-1 font-mono break-all">
                                    {config.command} {config.args?.join(" ")}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => handleDeleteConfig(name)}
                                className="p-2 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors ml-2 flex-shrink-0"
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
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Available Tools Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Available Tools ({tools.length})
                    </h3>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-1 gap-4 pr-2">
                        {tools.length === 0 ? (
                          <div className="p-4 text-center text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-lg">
                            No tools available. Add MCP server configurations to
                            see tools.
                          </div>
                        ) : (
                          tools.map((tool) => (
                            <div
                              key={tool.name}
                              className="p-4 border border-[var(--border)] rounded-lg"
                            >
                              <h4 className="font-medium">{tool.name}</h4>
                              <p className="text-sm text-[var(--muted-foreground)] break-words">
                                {tool.description}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Add Configuration Form */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Add MCP Configuration
                    </h3>
                    <form onSubmit={handleAddConfig} className="space-y-4">
                      <div>
                        <textarea
                          placeholder='Paste your MCP configuration JSON here&#10;&#10;Local MCP Server (stdio):&#10;{&#10;  "toolName": {&#10;    "command": "npx",&#10;    "args": ["-y", "tool-name"],&#10;    "env": {"API_KEY": "your-key"},&#10;    "transport": "stdio"&#10;  }&#10;}&#10;&#10;Remote MCP Server (sse):&#10;{&#10;  "brave-search": {&#10;    "url": "https://mcp.so/brave-search",&#10;    "env": {"BRAVE_API_KEY": "your-key"},&#10;    "transport": "sse"&#10;  }&#10;}'
                          value={configJson}
                          onChange={(e) => setConfigJson(e.target.value)}
                          className="w-full h-32 p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] font-mono text-sm resize-y min-h-[8rem] max-h-48"
                          required
                        />
                        <div className="text-xs text-[var(--muted-foreground)] mt-1">
                          Tip: You can resize this textarea vertically if needed
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-lg hover:bg-[var(--foreground)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? "Adding..." : "Add Configuration"}
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
