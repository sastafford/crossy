"""
Main FastAPI application for Crossy.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import mongodb
from .routes import router

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    await mongodb.connect()
    yield
    # Shutdown
    logger.info("Shutting down application")
    await mongodb.disconnect()


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Border Patrol Interior Checkpoint Crossing Simulator",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)

# Mount static files (frontend)
app.mount("/static", StaticFiles(directory="frontend"), name="static")


@app.get("/")
async def root():
    """Serve the frontend application."""
    return FileResponse("frontend/index.html")


@app.get("/health")
async def health():
    """Basic health check endpoint."""
    return {"status": "healthy", "app": settings.app_name, "version": settings.app_version}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.environment == "development"
    )

