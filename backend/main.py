import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from backend import models, database, auth
from backend.routers import patients, doctors, volunteers, chats, reports, consultations, vitals

app = FastAPI()

app.mount("/uploaded_reports", StaticFiles(directory="uploaded_reports"), name="uploaded_reports")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:5501",
        "http://localhost:5501",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(doctors.router)
app.include_router(volunteers.router)
app.include_router(chats.router)
app.include_router(reports.router)
app.include_router(consultations.router)
app.include_router(vitals.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Marutha Support API"}
