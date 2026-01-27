# FastAPI utilities for building routes, handling file uploads, and forms
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
# SQLAlchemy Session for database interaction
from sqlalchemy.orm import Session
# Standard library for typing
from typing import List
# shutil for file saving and os for directory management
import shutil
import os

# Import local database, models, and schemas
from backend import database, models, schemas

# Initialize the router with a prefix '/reports' and tags for documentation
router = APIRouter(
    prefix="/reports",
    tags=["reports"]
)

# Define the folder where uploaded medical reports will be stored on the server
UPLOAD_DIR = "uploaded_reports"
os.makedirs(UPLOAD_DIR, exist_ok=True) # Ensure the directory exists

# Endpoint to handle the uploading of a medical report file
@router.post("/upload")
def upload_new_report(
    patient_id: int = Form(...),      # From current_user.id or selected patient
    title: str = Form(...),           # Human-readable title
    file: UploadFile = File(...),     # The attachment itself
    database_session: Session = Depends(database.get_database_session)
):
    # Construct the path where the file will be saved
    file_storage_path = f"{UPLOAD_DIR}/{file.filename}"
    # Open a local file and copy the uploaded stream into it
    with open(file_storage_path, "wb") as storage_buffer:
        shutil.copyfileobj(file.file, storage_buffer)

    # Create a database record to track this report (MedicalReport)
    fresh_report_record = models.MedicalReport(
        patient_id=patient_id,
        title=title,
        file_path=file_storage_path     # Store the path so we can locate it later
    )
    database_session.add(fresh_report_record)
    database_session.commit()      # Save to database
    database_session.refresh(fresh_report_record)
    
    return {"info": "saved", "id": fresh_report_record.id}

# Endpoint to fetch all reports belonging to a specific patient
@router.get("/patient/{patient_id}", response_model=List[schemas.MedicalReportDetails])
def fetch_patient_reports(patient_id: int, database_session: Session = Depends(database.get_database_session)):
    # Filter reports by the patient_id
    patient_records = database_session.query(models.MedicalReport).filter(models.MedicalReport.patient_id == patient_id).all()
    return patient_records
