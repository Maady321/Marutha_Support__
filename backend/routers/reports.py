from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List
import shutil
import os

from backend import database, models, schemas

router = APIRouter(
    prefix="/reports",
    tags=["reports"]
)

UPLOAD_DIR = "uploaded_reports"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
def upload_report(
    patient_id: int = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db)
):
    file_location = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    new_report = models.Report(
        patient_id=patient_id,
        title=title,
        file_path=file_location
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return {"info": "saved", "id": new_report.id}

@router.get("/patient/{patient_id}", response_model=List[schemas.ReportResponse])
def get_patient_reports(patient_id: int, db: Session = Depends(database.get_db)):
    reports = db.query(models.Report).filter(models.Report.patient_id == patient_id).all()
    return reports
