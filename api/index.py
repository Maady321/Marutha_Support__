import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add the backend directory to the Python path so local modules resolve correctly
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Import the original app from main.py
from main import app as backend_app

# Create a parent app that mounts the main app under /api
# This correctly matches Vercel's routing behavior where all /api requests hit this function
app = FastAPI(title="Marutha Support API Vercel Wrapper")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Open CORS for production Vercel apps, or restrict as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/api", backend_app)

# This wrapper allows the backend to transparently handle routes regardless 
# of Vercel prepending /api/ to the requested URLs.
