from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from utils.api.endpoints import router
from config.config import Config
import os
import logging
from services.mcp_service import detach_mcp_service
from mcp_core.mcp_initializer import apply_mcp_fixes
from database.connection import init_database, close_database
from contextlib import asynccontextmanager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing application...")

    # Initialize database
    try:
        await init_database()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")

    # Initialize MCP service
    try:
        apply_mcp_fixes()
        await detach_mcp_service.initialize_client()
        tools = await detach_mcp_service.get_tools()
        logger.info(f"MCP service initialized with {len(tools)} tools")
    except Exception as e:
        logger.error(f"Error initializing MCP service: {e}")

    yield

    logger.info("Shutting down application...")

    # Close database connections
    try:
        await close_database()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Error closing database: {e}")

    # Close MCP service
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

# Ensure necessary directories exist
os.makedirs(Config.GENERATED_IMAGES_DIR, exist_ok=True)
os.makedirs(Config.UPLOADED_FILES_DIR, exist_ok=True)
os.makedirs("utils/stt", exist_ok=True)
os.makedirs(Config.AUDIO_UPLOAD_DIR, exist_ok=True)

# Mount static directories
app.mount(
    "/generated_images",
    StaticFiles(directory=Config.GENERATED_IMAGES_DIR),
    name="generated_images",
)
app.mount(
    "/uploaded_files",
    StaticFiles(directory=Config.UPLOADED_FILES_DIR),
    name="uploaded_files",
)
app.mount(
    "/stt",
    StaticFiles(directory="utils/stt"),
    name="stt",
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {str(exc)}")
    return JSONResponse(status_code=500, content={"detail": str(exc)})


@app.get("/health")
async def health_check():
    """Health check endpoint for Docker and monitoring."""
    return {
        "status": "healthy",
        "service": "omni-multi-agent-backend",
        "version": "1.0.0"
    }


app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=Config.HOST, port=Config.PORT)
