import json
import os
from typing import Dict, Any
from langchain_mcp_adapters.client import MultiServerMCPClient
import logging
import asyncio

logger = logging.getLogger(__name__)

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "..", "config", "mcp_config.json")


class MCPService:
    """
    Service to manage MCP tool configurations and client
    """

    def __init__(self):
        self.configs: Dict[str, Any] = self._load_configs()
        self.client: MultiServerMCPClient = None
        self.initialized = False
        self._lock = asyncio.Lock()
        self._create_client()

    def _load_configs(self) -> Dict[str, Any]:
        if not os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, "w", encoding="utf-8") as f:
                json.dump({}, f, indent=2)
            return {}
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            raw = json.load(f)
        if (
            isinstance(raw, dict)
            and "mcpServers" in raw
            and isinstance(raw["mcpServers"], dict)
        ):
            flat = raw["mcpServers"]
            with open(CONFIG_PATH, "w", encoding="utf-8") as fw:
                json.dump(flat, fw, indent=2)
            raw = flat
        updated = False
        for name, conf in raw.items():
            if isinstance(conf, dict) and "transport" not in conf:
                conf["transport"] = "sse" if "url" in conf else "stdio"
                updated = True
        if updated:
            with open(CONFIG_PATH, "w", encoding="utf-8") as fw:
                json.dump(raw, fw, indent=2)
            logger.info(f"Applied default transport to MCP configs: {raw}")
        return raw

    def _save_configs(self) -> None:
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(self.configs, f, indent=2)

    def _create_client(self) -> None:
        """Create a new MCP client with current configs"""
        logger.info(f"Creating MCP client object with configs: {self.configs}")

        # Clean the configs to remove unsupported parameters
        cleaned_configs = self._clean_configs_for_client(self.configs)
        logger.info(f"Cleaned configs for client: {cleaned_configs}")

        self.client = MultiServerMCPClient(cleaned_configs)
        self.initialized = False

    async def initialize_client(self) -> bool:
        async with self._lock:
            if self.initialized:
                return True
            if not self.client:
                logger.error("MCP Client object not created before initialization.")
                return False
            try:
                logger.info("Initializing MCP client...")
                # Add timeout to prevent hanging
                tools = await asyncio.wait_for(
                    self.client.get_tools(), timeout=30.0  # 30 second timeout
                )
                logger.info(
                    f"MCP client initialized successfully, {len(tools)} tools available."
                )

                # Log tool details for debugging
                for tool in tools:
                    logger.info(f"  - Tool: {tool.name} - {tool.description}")

                self.initialized = True
                return True
            except asyncio.TimeoutError:
                logger.error("MCP client initialization timed out after 30 seconds")
                self.initialized = False
                return False
            except Exception as e:
                error_msg = str(e)

                # Provide more specific error messages for common issues
                if "Connection closed" in error_msg:
                    logger.error(
                        "MCP server connection closed unexpectedly. This often indicates:"
                    )

                    # Check if any configs use stdio transport (local servers)
                    has_stdio = any(
                        config.get("transport") == "stdio"
                        for config in self.configs.values()
                    )
                    # Check if any configs use sse transport (remote servers)
                    has_sse = any(
                        config.get("transport") == "sse"
                        for config in self.configs.values()
                    )

                    if has_stdio:
                        logger.error("  For local MCP servers (stdio transport):")
                        logger.error(
                            "    - Check if the command/executable exists and is accessible"
                        )
                        logger.error(
                            "    - Verify environment variables are set correctly"
                        )
                        logger.error(
                            "    - Ensure the MCP server starts without errors"
                        )

                    if has_sse:
                        logger.error("  For remote MCP servers (sse transport):")
                        logger.error("    - Check if the server URL is accessible")
                        logger.error(
                            "    - Verify the server is running and responding"
                        )
                        logger.error(
                            "    - Check network connectivity and firewall settings"
                        )
                        logger.error("    - Ensure API keys/credentials are valid")

                elif "not found" in error_msg or "No such file" in error_msg:
                    logger.error("Command/file not found error:")
                    logger.error("  - Check if the specified command exists in PATH")
                    logger.error(
                        "  - For npm packages, ensure they're installed globally or use npx"
                    )
                    logger.error("  - Verify file paths and permissions")
                elif "Permission denied" in error_msg:
                    logger.error("Permission error detected:")
                    logger.error("  - Check file/command permissions")
                    logger.error("  - Ensure the user has necessary access rights")

                logger.error(
                    f"Error during MCP client initialization: {e}", exc_info=True
                )
                self.initialized = False
                return False

    async def aclose(self):
        """Gracefully close the MCP client."""
        async with self._lock:
            if self.client and self.initialized:
                logger.info("Closing MCP client...")
                try:
                    # With langchain-mcp-adapters 0.1.0, we don't need to call __aexit__
                    # The client will be cleaned up automatically
                    logger.info("MCP client closed successfully.")
                except Exception as e:
                    logger.error(f"Error during MCP client close: {e}", exc_info=True)
                finally:
                    self.initialized = False
            elif self.client and not self.initialized:
                logger.info(
                    "MCP client was created but not initialized, no cleanup needed."
                )
            else:
                logger.info("No MCP client to close.")

    def list_configs(self) -> Dict[str, Any]:
        return self.configs

    async def add_config(self, name: str, config: Dict[str, Any]) -> None:
        if "transport" not in config:
            config["transport"] = "sse" if "url" in config else "stdio"
        self.configs[name] = config
        self._save_configs()
        await self._refresh_client()

    async def delete_config(self, name: str) -> None:
        if name in self.configs:
            del self.configs[name]
            self._save_configs()
            await self._refresh_client()

    async def get_tools(self) -> Any:
        if not self.initialized:
            logger.info(
                "MCP client not initialized. Attempting to initialize in get_tools..."
            )
            success = await self.initialize_client()
            if not success:
                logger.warning("Failed to initialize MCP client in get_tools")
                return []

        if not self.initialized:
            logger.warning("MCP client failed to initialize when requesting tools.")
            return []

        try:
            # Add timeout to prevent hanging
            tools = await asyncio.wait_for(
                self.client.get_tools() if self.client else [],
                timeout=10.0,  # 10 second timeout for getting tools
            )
            return tools
        except asyncio.TimeoutError:
            logger.error("Getting MCP tools timed out after 10 seconds")
            return []
        except Exception as e:
            logger.error(f"Error retrieving tools from MCP client: {e}", exc_info=True)
            return []

    async def _refresh_client(self) -> None:
        logger.info("Refreshing MCP client...")

        # First, ensure any existing client session is properly closed.
        # aclose() handles its own locking and sets self.initialized = False.
        logger.info("Attempting to close existing MCP client session (if active)...")
        await self.aclose()

        # Create a new client instance with the potentially updated configurations.
        # This is a synchronous operation.
        self._create_client()

        # Initialize the newly created client.
        # initialize_client() handles its own locking for the __aenter__ call.
        logger.info("Attempting to initialize new MCP client after refresh...")
        await self.initialize_client()
        logger.info("MCP client refresh process completed.")

    def _clean_configs_for_client(self, configs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Clean MCP configurations by removing parameters not supported by langchain-mcp-adapters.

        Supported parameters for stdio transport:
        - command (required)
        - args
        - env
        - transport

        Supported parameters for sse transport:
        - url (required)
        - transport
        """
        cleaned = {}

        for name, config in configs.items():
            if not isinstance(config, dict):
                continue

            # Skip disabled configurations
            if config.get("disabled", False):
                logger.info(f"Skipping disabled MCP server: {name}")
                continue

            cleaned_config = {}
            transport = config.get("transport", "stdio")

            if transport == "stdio":
                # For stdio transport, only keep supported parameters
                supported_params = ["command", "args", "env", "transport"]
                for param in supported_params:
                    if param in config:
                        cleaned_config[param] = config[param]

                # Ensure command is present (required for stdio)
                if "command" not in cleaned_config:
                    logger.warning(
                        f"Skipping MCP server {name}: missing required 'command' parameter"
                    )
                    continue

            elif transport == "sse":
                # For sse transport, only keep supported parameters
                supported_params = ["url", "transport"]
                for param in supported_params:
                    if param in config:
                        cleaned_config[param] = config[param]

                # Ensure url is present (required for sse)
                if "url" not in cleaned_config:
                    logger.warning(
                        f"Skipping MCP server {name}: missing required 'url' parameter"
                    )
                    continue
            else:
                logger.warning(
                    f"Skipping MCP server {name}: unsupported transport '{transport}'"
                )
                continue

            cleaned[name] = cleaned_config

        return cleaned


detach_mcp_service = MCPService()
