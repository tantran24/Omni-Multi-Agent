from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from utils.api.endpoints import router
from core.config import Config
import os
import logging
from services.mcp_service import detach_mcp_service
from core.mcp_initializer import apply_mcp_fixes
from contextlib import asynccontextmanager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing MCP service...")
    try:
        apply_mcp_fixes()
        await detach_mcp_service.initialize_client()
        tools = await detach_mcp_service.get_tools()
        logger.info(f"MCP service initialized with {len(tools)} tools")
    except Exception as e:
        logger.error(f"Error initializing MCP service: {e}")

    yield

    logger.info("Shutting down MCP service...")
    try:
        if hasattr(detach_mcp_service, "aclose"):
            await detach_mcp_service.aclose()
            logger.info("MCP service: detach_mcp_service.aclose() called.")
        else:
            logger.warning("MCP resources might not be cleaned up properly.")
    except Exception as e:
        logger.error(f"Error shutting down MCP service: {e}", exc_info=True)


app = FastAPI(title="Omni Multi-Agent API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {str(exc)}")
    return JSONResponse(status_code=500, content={"detail": str(exc)})


app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=Config.HOST, port=Config.PORT)

os.makedirs("generated_images", exist_ok=True)
app.mount(
    "/generated_images",
    StaticFiles(directory="generated_images"),
    name="generated_images",
)
app.mount(
    "/stt",
    StaticFiles(directory="stt"),
    name="stt",
)
