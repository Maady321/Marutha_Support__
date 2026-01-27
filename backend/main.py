# Import system libraries for path management
import sys
import os

# Add the project's parent directory to the system path so imports work correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import FastAPI framework and its core utilities
from fastapi import FastAPI

from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# Import local backend modules (database connection, models, and auth logic)
from backend import models, database, auth

# Import specialized API routers for different features
from backend.routers import patients, doctors, volunteers, chats, reports, consultations, vitals

# initialize the core FastAPI application
# this 'app' variable is the heart of our backend
app = FastAPI(
    title="Marutha Support API",
    description="A human-friendly backend for health coordination",
    version="1.1.0"
)

# configure 'CORS' so our frontend (website) can safely talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # allow all websites for now (good for development)
    allow_credentials=True,
    allow_methods=["*"],           # allow all types of requests (GET, POST, etc.)
    allow_headers=["*"],           # allow all custom headers
)

# mount the folder where medical reports are saved so they can be viewed online
app.mount("/uploaded_reports", StaticFiles(directory="uploaded_reports"), name="uploaded_reports")


# register all our feature-specific routes (patients, doctors, etc.)
app.include_router(auth.router) # default prefix or no prefix as per original
app.include_router(patients.router)
app.include_router(doctors.router)
app.include_router(chats.router)
app.include_router(volunteers.router)
app.include_router(reports.router)
app.include_router(consultations.router)
app.include_router(vitals.router)


# basic welcome message when someone visits the home URL
@app.get("/")
def welcome_message():
    return {
        "message": "Welcome to the Marutha Support Platform!",
        "status": "Online and Ready"
    }
