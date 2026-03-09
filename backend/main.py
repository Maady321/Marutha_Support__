# main.py - Application Entry Point
# This is the main file that starts the FastAPI server

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import traceback
import socketio

import auth, database, models
from routers import users, clinical, chats
from socket_io import sio

# Create all database tables (if they don't exist yet)
models.Base.metadata.create_all(bind=database.engine)

# Create the FastAPI app
app = FastAPI(title="Marutha Support API")

# ---- CORS Setup ----
# CORS allows the frontend (running on a different port) to talk to the backend
if os.getenv("VERCEL"):
    # On Vercel, frontend and API are on the same website
    ALLOWED_ORIGINS = ["*"]
else:
    # Locally, only allow these specific addresses
    ALLOWED_ORIGINS = [
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:5505",
        "http://localhost:5505",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ]

# Decide whether to allow credentials
allow_creds = True
if os.getenv("VERCEL"):
    allow_creds = False  # Can't use credentials with wildcard origin

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=allow_creds,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- Error Handling ----
# These catch any crashes and log them instead of crashing the whole server

@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    """Catch any errors during request processing and log them."""
    try:
        return await call_next(request)
    except Exception as e:
        # Write the error to a log file
        with open("crash_log.txt", "a") as f:
            f.write("\nCRASH at " + str(request.url) + "\n")
            f.write(traceback.format_exc())
        return JSONResponse(status_code=500, content={"detail": str(e)})


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle any unhandled errors globally."""
    print("GLOBAL CRASH:", exc)
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)},
    )


# ---- File Upload Directory ----
# Set up where uploaded medical reports are saved
if os.getenv("VERCEL"):
    UPLOAD_DIR = "/tmp/uploaded_reports"
else:
    UPLOAD_DIR = "uploaded_reports"

os.makedirs(UPLOAD_DIR, exist_ok=True)

# Serve uploaded files so they can be downloaded
app.mount("/uploaded_reports", StaticFiles(directory=UPLOAD_DIR), name="reports")

# Serve frontend static assets (CSS, JS, images)
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_DIR = os.path.dirname(_BACKEND_DIR)
FRONTEND_DIR = os.path.join(_PROJECT_DIR, "frontend")
STATIC_DIR = os.path.join(FRONTEND_DIR, "static")
TEMPLATES_DIR = os.path.join(FRONTEND_DIR, "templates")

print("Frontend static dir:", STATIC_DIR, "exists:", os.path.isdir(STATIC_DIR))
print("Templates dir:", TEMPLATES_DIR, "exists:", os.path.isdir(TEMPLATES_DIR))

if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static_assets")

# Serve frontend HTML templates
if os.path.isdir(TEMPLATES_DIR):
    app.mount("/templates", StaticFiles(directory=TEMPLATES_DIR, html=True), name="templates")


# ---- Register All Routers ----
# Each router handles a group of related API endpoints
app.include_router(auth.router)
app.include_router(users.patients_router)
app.include_router(users.doctors_router)
app.include_router(users.volunteers_router)
app.include_router(clinical.consult_router)
app.include_router(clinical.vitals_router)
app.include_router(clinical.reports_router)
app.include_router(chats.chat_router)
app.include_router(clinical.notes_router)
app.include_router(clinical.prescriptions_router)


# ---- Home Endpoint ----
@app.get("/")
def home():
    """Simple endpoint to check if the API is running."""
    return {"message": "Marutha Support API is running!"}


# ---- Socket.io Setup ----
# Wrap the app with Socket.io for real-time chat
app = socketio.ASGIApp(sio, other_asgi_app=app, socketio_path='/socket.io')
