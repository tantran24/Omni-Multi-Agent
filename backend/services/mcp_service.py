import json
import os
from typing import Dict, Any
from langchain_mcp_adapters.client import MultiServerMCPClient
import logging
import asyncio

logger = logging.getLogger(__name__)

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "..", "mcp_config.json")


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
        self.client = MultiServerMCPClient(self.configs)
        self.initialized = False

    async def initialize_client(self) -> bool:
        async with self._lock:
            if self.initialized:
                return True
            if not self.client:
                logger.error("MCP Client object not created before initialization.")
                return False
            try:
                logger.info("Entering MCP client context (__aenter__)...")
                await self.client.__aenter__()
                tools = self.client.get_tools()
                logger.info(f"MCP client __aenter__ successful, tools available.")
                self.initialized = True
                logger.info("MCP client initialized successfully.")
                return True
            except Exception as e:
                logger.error(f"Error during MCP client __aenter__: {e}", exc_info=True)
                self.initialized = False
                return False

    async def aclose(self):
        """Gracefully close the MCP client."""
        async with self._lock:
            if self.client and self.initialized:
                logger.info("Exiting MCP client context (__aexit__)...")
                try:
                    await self.client.__aexit__(None, None, None)
                    logger.info("MCP client exited successfully.")
                except Exception as e:
                    logger.error(
                        f"Error during MCP client __aexit__: {e}", exc_info=True
                    )
                finally:
                    self.initialized = False
            elif self.client and not self.initialized:
                logger.info(
                    "MCP client was created but not initialized, no __aexit__ needed."
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
            await self.initialize_client()

        if not self.initialized:
            logger.warning("MCP client failed to initialize when requesting tools.")
            return []

        try:
            return self.client.get_tools() if self.client else []
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


detach_mcp_service = MCPService()
