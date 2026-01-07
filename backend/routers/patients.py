from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend import database, models, schemas
from backend.auth import get_current_user

router = APIRouter(
    prefix="/patients",
    tags=["patients"]
)

@router.get("/", response_model=list[schemas.PatientResponse])
def read_patients(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    patients = db.query(models.Patient).offset(skip).limit(limit).all()
    return patients

@router.get("/online/doctors", response_model=list[schemas.DoctorResponse])
def get_online_doctors(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    docs = db.query(models.Doctor).filter(models.Doctor.is_online == True).all()
    return docs

@router.post("/request_doctor/{doctor_id}")
def request_doctor(doctor_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    patient_profile = db.query(models.Patient).filter(models.Patient.user_id == current_user.id).first()
    if not patient_profile:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    new_request = models.Consultation(
        patient_id=patient_profile.id,
        doctor_id=doctor_id,
        status=models.ConsultationStatus.PENDING,
        notes="Requested via simplified API"
    )
    db.add(new_request)
    db.commit()
    return {"message": "Request sent successfully"}

@router.get("/{patient_id}", response_model=schemas.PatientResponse)
def read_patient(patient_id: int, db: Session = Depends(database.get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.put("/{patient_id}")
def update_patient_stage(patient_id: int, data: schemas.PatientCreate, db: Session = Depends(database.get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
         raise HTTPException(status_code=404, detail="Patient not found")

    patient.stage = data.stage
    db.commit()
    db.refresh(patient)
    return patient

@router.get("/{patient_id}/stages")
def get_stage_history(patient_id: int, db: Session = Depends(database.get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        return {"current": "Unknown", "history": []}

    return {
        "current": patient.stage,
        "history": [
            {"date": "2023-01-01", "stage": "early"},
            {"date": "2023-06-01", "stage": "mid"}
        ]
    }
