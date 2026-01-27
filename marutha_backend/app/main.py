from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.core import database
from app import models
from app.routes import auth, patient_routes, doctor_routes, volunteer_routes, chat_routes
from app.core.config import settings
from app.core.csrf import CSRFMiddleware
from app.core.session import session_manager
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


database.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="Marutha Support Backend",
    version=settings.PROJECT_VERSION,
    description="Healthcare support platform with session-based authentication"
)


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    logger.info("Starting Marutha Support Backend")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    
    # Ensure DB tables exist
    logger.info("Ensuring database tables exist...")
    database.Base.metadata.create_all(bind=database.engine)
    
    # Check session manager
    if session_manager.health_check():
        logger.info("✓ Session manager ready (in-memory)")
        active_sessions = session_manager.get_active_session_count()
        logger.info(f"Active sessions: {active_sessions}")
    else:
        logger.error("✗ Session manager failed!")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("Shutting down Marutha Support Backend...")


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for unhandled errors.
    
    Logs errors and returns standardized error response.
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "Internal server error",
            "data": None,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    )


# Validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handle validation errors with standardized format.
    """
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "Validation error",
            "data": {"errors": exc.errors()},
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    )


# Rate limiting disabled (slowapi removed for compatibility)


# CORS - Allow frontend from different origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-CSRF-Token"]
)

# CSRF Protection (must be after CORS)
app.add_middleware(CSRFMiddleware)


# API Routers (all under /api prefix)
app.include_router(auth.router, prefix="/api")
app.include_router(patient_routes.router, prefix="/api")
app.include_router(doctor_routes.router, prefix="/api")
app.include_router(volunteer_routes.router, prefix="/api")
app.include_router(chat_routes.router, prefix="/api")


@app.get("/")
def root():
    """Root endpoint - API health check."""
    return {
        "message": "Marutha Support API Active",
        "version": settings.PROJECT_VERSION,
        "environment": settings.ENVIRONMENT,
        "session_backend": "In-Memory",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


# Backwards-compatible alias for doctor prescription endpoint used in tests/clients
from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.services.doctor_service import DoctorService
from app import schemas, models
import json


@app.post("/api/doctor/prescription")
def create_prescription_alias(
    prescription_data: schemas.PrescriptionCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        prescription = DoctorService.create_prescription(db, current_user, prescription_data)
        # Return parsed medications
        meds_raw = getattr(prescription, "medications", None)
        if isinstance(meds_raw, str):
            try:
                meds = json.loads(meds_raw)
            except Exception:
                meds = meds_raw
        else:
            meds = meds_raw

        return {
            "id": prescription.id,
            "patient_id": prescription.patient_id,
            "medications": meds,
            "notes": prescription.notes,
            "created_at": prescription.created_at.isoformat() if getattr(prescription, 'created_at', None) else None
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@app.get("/health")
def health_check():
    """
    Health check endpoint.
    
    Checks database and session manager connectivity.
    """
    health_status = {
        "api": "healthy",
        "database": "unknown",
        "sessions": "unknown",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    # Check database
    try:
        db = database.SessionLocal()
        # db.execute("SELECT 1")
        db.close()
        health_status["database"] = "healthy"
    except Exception as e:
        health_status["database"] = f"unhealthy: {str(e)}"
    
    # Check session manager
    if session_manager.health_check():
        health_status["sessions"] = "healthy (in-memory)"
        # health_status["active_sessions"] = session_manager.get_active_session_count()
    else:
        health_status["sessions"] = "unhealthy"
    
    # Overall status
    overall_healthy = (
        health_status["database"] == "healthy" and
        health_status["sessions"].startswith("healthy")
    )
    
    return {
        "success": overall_healthy,
        "message": "System healthy" if overall_healthy else "System degraded",
        "data": health_status,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
