import os
from fastapi import FastAPI, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.config import settings
from backend.database import engine, Base
from backend.auth import verify_csrf
from backend.routers import auth, users, doctors, patients, volunteers, family, caregivers, timeline, care_plans, clinical, services, directory, admin

app = FastAPI(
    title="Ashwasa Healthcare API",
    version="1.0.0",
    dependencies=[Depends(verify_csrf)]  # Global CSRF check for mutations
)

# Startup DB Check & Create
@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# CORS
origins = [
    settings.APP_URL,
    "http://localhost:3000",
    "http://localhost:4000",
    "http://localhost:8000"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(doctors.router, prefix="/api/v1")
app.include_router(patients.router, prefix="/api/v1")
app.include_router(volunteers.router, prefix="/api/v1")
app.include_router(family.router, prefix="/api/v1")
app.include_router(caregivers.router)
app.include_router(timeline.router)
app.include_router(care_plans.router)
app.include_router(clinical.router)
app.include_router(services.router)
app.include_router(directory.router)
app.include_router(admin.router)

# Mount static folder
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Clean URL HTML routing
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")

@app.get("/")
async def root():
    return FileResponse(os.path.join(frontend_dir, "index.html"))

@app.get("/login")
async def login_page():
    return FileResponse(os.path.join(frontend_dir, "login.html"))

@app.get("/register")
async def register_page():
    return FileResponse(os.path.join(frontend_dir, "register.html"))

@app.get("/dashboard")
async def dashboard_page():
    return FileResponse(os.path.join(frontend_dir, "dashboard.html"))

@app.get("/profile")
async def profile_page():
    return FileResponse(os.path.join(frontend_dir, "profile.html"))

@app.get("/profile/edit")
async def edit_profile_page():
    return FileResponse(os.path.join(frontend_dir, "edit-profile.html"))

@app.get("/verify-email")
async def verify_email_page():
    return FileResponse(os.path.join(frontend_dir, "verify-email.html"))

@app.get("/forgot-password")
async def forgot_password_page():
    return FileResponse(os.path.join(frontend_dir, "forgot-password.html"))

@app.get("/reset-password")
async def reset_password_page():
    return FileResponse(os.path.join(frontend_dir, "reset-password.html"))

@app.get("/directory")
async def directory_page():
    return FileResponse(os.path.join(frontend_dir, "directory.html"))
