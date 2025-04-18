from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from utils.api.endpoints import router
from core.config import Config
import os
import logging
import asyncio
from services.mcp_service import detach_mcp_service
from core.mcp_initializer import apply_mcp_fixes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Omni Multi-Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Initializing MCP service...")
    try:
        apply_mcp_fixes()

        await detach_mcp_service.initialize_client()
        tools = detach_mcp_service.get_tools()
        logger.info(f"MCP service initialized with {len(tools)} tools")
    except Exception as e:
        logger.error(f"Error initializing MCP service: {e}")


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


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {str(exc)}")
    return JSONResponse(status_code=500, content={"detail": str(exc)})


app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=Config.HOST, port=Config.PORT)
