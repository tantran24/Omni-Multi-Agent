import json
import os
from typing import Dict, Any
from langchain_mcp_adapters.client import MultiServerMCPClient
import logging

logger = logging.getLogger(__name__)

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "..", "mcp_config.json")


class MCPService:
    """
    Service to manage MCP tool configurations and client
    """

    def __init__(self):
        self.configs: Dict[str, Any] = self._load_configs()
        self.client: MultiServerMCPClient = None  # type: ignore
        self.initialized = False
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
        logger.info(f"Creating MCP client with configs: {self.configs}")
        self.client = MultiServerMCPClient(self.configs)
        self.initialized = False

    async def initialize_client(self) -> bool:
        """Initialize the MCP client asynchronously"""
        if self.initialized:
            return True

        try:
            if self.client:
                await self.client.__aenter__()
                tools = self.client.get_tools()
                logger.info(
                    f"MCP client loaded {len(tools)} tools: {[t.name for t in tools]}"
                )
                self.initialized = True
                return True
        except Exception as e:
            logger.error(f"Error initializing MCP client: {e}")
            return False
        return False

    def list_configs(self) -> Dict[str, Any]:
        return self.configs

    def add_config(self, name: str, config: Dict[str, Any]) -> None:
        if "transport" not in config:
            config["transport"] = "sse" if "url" in config else "stdio"
        self.configs[name] = config
        self._save_configs()
        self._refresh_client()

    def delete_config(self, name: str) -> None:
        if name in self.configs:
            del self.configs[name]
            self._save_configs()
            self._refresh_client()

    def get_tools(self) -> Any:
        """Return list of langchain Tool instances for each MCP config"""
        try:
            if not self.initialized:
                import asyncio

                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.create_task(self.initialize_client())
                else:
                    loop.run_until_complete(self.initialize_client())

            if not self.initialized:
                logger.warning("MCP client not initialized when requesting tools")

            return self.client.get_tools() if self.client else []
        except Exception as e:
            logger.error(f"Error retrieving tools from MCP client: {e}")
            return []

    def _refresh_client(self) -> None:
        """Refresh the MCP client with updated configurations"""
        try:
            if self.client and self.initialized:
                import asyncio

                loop = asyncio.get_event_loop()
                try:
                    if loop.is_running():
                        asyncio.create_task(self.client.__aexit__(None, None, None))
                    else:
                        loop.run_until_complete(self.client.__aexit__(None, None, None))
                except Exception as e:
                    logger.warning(f"Error closing MCP client: {e}")

            self._create_client()

            import asyncio

            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(self.initialize_client())
            else:
                try:
                    loop.run_until_complete(self.initialize_client())
                except Exception as e:
                    logger.error(f"Error initializing new MCP client: {e}")
        except Exception as e:
            logger.error(f"Error refreshing MCP client: {e}")


detach_mcp_service = MCPService()
