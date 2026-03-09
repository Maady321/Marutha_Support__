# users.py - User Management API Endpoints
# Handles patient, doctor, and volunteer profiles, assignments, tasks, reports, and time tracking

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import database, models, schemas
from auth import fetch_logged_in_user
import logging
import traceback

logger = logging.getLogger("uvicorn.error")

# Create routers for each user type
patients_router = APIRouter(prefix="/patients", tags=["Patients"])
doctors_router = APIRouter(prefix="/doctors", tags=["Doctors"])
volunteers_router = APIRouter(prefix="/volunteers", tags=["Volunteers"])


# =============================================
# PATIENT ENDPOINTS
# =============================================

@patients_router.post("/", response_model=schemas.PatientDetails)
def create_patient(
    profile_data: schemas.PatientProfileSetup,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user),
):
    """Create a new patient profile."""

    # Check if profile already exists
    existing = db.query(models.PatientProfile).filter_by(user_id=user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists.")

    new_patient = models.PatientProfile(
        user_id=user.id,
        name=profile_data.name,
        age=profile_data.age,
        stage=profile_data.stage,
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return new_patient


@patients_router.get("/", response_model=List[schemas.PatientDetails])
def get_all_patients(db: Session = Depends(database.get_database_session)):
    """Get a list of all patients."""
    return db.query(models.PatientProfile).all()


@patients_router.get("/me", response_model=schemas.PatientDetails)
def get_my_profile(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user),
):
    """Get the current patient's profile."""
    profile = db.query(models.PatientProfile).filter_by(user_id=user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return profile


@patients_router.put("/me", response_model=schemas.PatientDetails)
def update_my_profile(
    profile_data: schemas.PatientProfileSetup,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user),
):
    """Update the current patient's profile."""
    profile = db.query(models.PatientProfile).filter_by(user_id=user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    profile.name = profile_data.name
    profile.age = profile_data.age
    profile.stage = profile_data.stage
    db.commit()
    db.refresh(profile)
    return profile


@patients_router.get("/online/doctors", response_model=List[schemas.DoctorDetails])
def get_online_doctors(db: Session = Depends(database.get_database_session)):
    """Get all doctors who are currently online."""
    return db.query(models.DoctorProfile).filter_by(is_online=True).all()


@patients_router.post("/request_doctor/{doctor_id}")
def request_doctor(
    doctor_id: int,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user),
):
    """Patient sends a consultation request to a doctor."""

    # Find the patient profile
    patient = db.query(models.PatientProfile).filter_by(user_id=user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found.")

    # Check if there's already a pending request to this doctor
    existing_request = db.query(models.DoctorRequest).filter_by(
        patient_id=patient.id,
        doctor_id=doctor_id,
        status="pending"
    ).first()

    if existing_request:
        raise HTTPException(status_code=400, detail="You already have a pending request with this doctor.")

    # Create the request
    try:
        new_request = models.DoctorRequest(
            patient_id=patient.id,
            doctor_id=doctor_id,
            status="pending",
            notes="Help requested via app",
        )
        db.add(new_request)
        db.commit()
        return {"message": "Request sent!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@patients_router.get("/me/volunteer")
def get_my_volunteer(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Patient gets info about their assigned volunteer."""

    patient = db.query(models.PatientProfile).filter_by(user_id=user.id).first()

    if not patient:
        return None
    if not patient.volunteer_id:
        return None

    vol = db.query(models.VolunteerProfile).filter_by(id=patient.volunteer_id).first()
    if not vol:
        return None

    return {"id": vol.id, "user_id": vol.user_id, "name": vol.name}


@patients_router.get("/{patient_id}", response_model=schemas.PatientDetails)
def get_patient(
    patient_id: int,
    db: Session = Depends(database.get_database_session)
):
    """Get a specific patient's details by ID."""
    patient = db.query(models.PatientProfile).filter_by(id=patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")
    return patient


# =============================================
# DOCTOR ENDPOINTS
# =============================================

@doctors_router.get("/", response_model=List[schemas.DoctorDetails])
def list_all_doctors(db: Session = Depends(database.get_database_session)):
    """Get a list of all doctors."""
    return db.query(models.DoctorProfile).all()


@doctors_router.get("/me", response_model=schemas.DoctorDetails)
def get_doctor_me(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Get the current doctor's profile."""
    doctor = db.query(models.DoctorProfile).filter_by(user_id=user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")
    return doctor


@doctors_router.put("/me", response_model=schemas.DoctorDetails)
def update_doctor_me(
    profile_data: schemas.DoctorDetails,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Update the current doctor's profile."""

    doctor = db.query(models.DoctorProfile).filter_by(user_id=user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")

    # Update each field only if a new value was provided
    if profile_data.name is not None:
        doctor.name = profile_data.name
    if profile_data.specialty is not None:
        doctor.specialty = profile_data.specialty
    if profile_data.experience is not None:
        doctor.experience = profile_data.experience
    if profile_data.qualification is not None:
        doctor.qualification = profile_data.qualification
    if profile_data.bio is not None:
        doctor.bio = profile_data.bio
    if profile_data.phone is not None:
        doctor.phone = profile_data.phone
    if profile_data.license_id is not None:
        doctor.license_id = profile_data.license_id

    db.commit()
    db.refresh(doctor)
    return doctor


@doctors_router.post("/me/status")
def set_online_status(
    status: bool,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Doctor sets their online/offline status."""

    doctor = db.query(models.DoctorProfile).filter_by(user_id=user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")

    doctor.is_online = status
    db.commit()
    return {"status": "Updated", "is_online": status}


@doctors_router.get("/requests/pending")
def get_pending_requests(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Doctor gets all pending consultation requests."""

    doctor = db.query(models.DoctorProfile).filter_by(user_id=user.id).first()
    if not doctor:
        return []

    requests = db.query(models.DoctorRequest).filter_by(
        doctor_id=doctor.id,
        status="pending"
    ).all()

    # Build response with patient and doctor names
    results = []
    for req in requests:
        details = schemas.DoctorRequestDetails.model_validate(req)
        if req.patient:
            details.patient_name = req.patient.name
            details.patient_stage = req.patient.stage
            details.patient_user_id = req.patient.user_id
        if req.doctor:
            details.doctor_name = req.doctor.name
            details.doctor_user_id = req.doctor.user_id
        results.append(details)

    return results


@doctors_router.get("/appointments")
def get_accepted_appointments(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Doctor gets all accepted (scheduled) appointments."""

    doctor = db.query(models.DoctorProfile).filter_by(user_id=user.id).first()
    if not doctor:
        return []

    requests = db.query(models.DoctorRequest).filter_by(
        doctor_id=doctor.id,
        status="accepted"
    ).all()

    results = []
    for req in requests:
        details = schemas.DoctorRequestDetails.model_validate(req)
        if req.patient:
            details.patient_name = req.patient.name
            details.patient_stage = req.patient.stage
            details.patient_user_id = req.patient.user_id
        if req.doctor:
            details.doctor_name = req.doctor.name
            details.doctor_user_id = req.doctor.user_id
        results.append(details)

    return results


@doctors_router.post("/requests/{request_id}/accept")
def accept_request(
    request_id: int,
    payload: schemas.AcceptRequestPayload,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Doctor accepts a consultation request and sets the appointment time."""

    request = db.get(models.DoctorRequest, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found.")

    request.status = "accepted"
    request.appointment_time = payload.appointment_time
    db.commit()
    return {"status": "Accepted"}


@doctors_router.post("/requests/{request_id}/decline")
def decline_request(
    request_id: int,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Doctor declines a consultation request."""

    request = db.get(models.DoctorRequest, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found.")

    request.status = "declined"
    db.commit()
    return {"status": "Declined"}


# ---- Volunteer Management (by Doctor) ----

@doctors_router.get("/volunteers", response_model=List[schemas.VolunteerDetails])
def get_all_volunteers(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Get list of all volunteers."""
    return db.query(models.VolunteerProfile).all()


@doctors_router.get("/volunteers-summary")
def get_volunteers_summary(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Get volunteer list with patient assignment counts."""

    volunteers = db.query(models.VolunteerProfile).all()

    result = []
    for vol in volunteers:
        assigned_patients = db.query(models.PatientProfile).filter_by(volunteer_id=vol.id).all()
        patient_count = len(assigned_patients)

        # Build patient list for this volunteer
        patient_list = []
        for p in assigned_patients:
            patient_list.append({
                "id": p.id,
                "name": p.name,
                "age": p.age,
                "stage": p.stage,
                "user_id": p.user_id
            })

        result.append({
            "id": vol.id,
            "user_id": vol.user_id,
            "name": vol.name,
            "patient_count": patient_count,
            "max_patients": 3,
            "is_available": patient_count < 3,
            "patients": patient_list
        })

    return result


@doctors_router.get("/volunteers-full-details")
def get_volunteers_full_details(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Get detailed information about all volunteers (for doctor dashboard)."""

    volunteers = db.query(models.VolunteerProfile).all()
    result = []

    for vol in volunteers:
        # Get volunteer's email
        vol_user = db.query(models.UserAccount).filter_by(id=vol.user_id).first()
        if vol_user:
            email = vol_user.email
        else:
            email = "N/A"

        # Get assigned patients
        assigned_patients = db.query(models.PatientProfile).filter_by(volunteer_id=vol.id).all()

        # Get tasks and count completed ones
        tasks = db.query(models.VolunteerTask).filter_by(volunteer_id=vol.id).all()
        tasks_completed = 0
        for t in tasks:
            if t.is_completed:
                tasks_completed = tasks_completed + 1

        # Get reports (newest first)
        reports = db.query(models.VolunteerReport).filter_by(
            volunteer_id=vol.id
        ).order_by(
            models.VolunteerReport.created_at.desc()
        ).all()

        # Calculate total hours worked
        time_logs = db.query(models.VolunteerTimeLog).filter_by(volunteer_id=vol.id).all()
        total_seconds = 0
        now_utc = datetime.utcnow()

        for log in time_logs:
            if log.end_time and log.start_time:
                # Completed shift - calculate duration
                delta = log.end_time - log.start_time
                if delta.total_seconds() > 0:
                    total_seconds = total_seconds + delta.total_seconds()
            elif not log.end_time and log.start_time:
                # Still active shift - calculate time so far
                delta = now_utc - log.start_time
                if delta.total_seconds() > 0:
                    total_seconds = total_seconds + delta.total_seconds()

        hours = total_seconds / 3600.0

        # Build recent reports list (max 3)
        recent_reports_list = []
        for r in reports[:3]:
            recent_reports_list.append({
                "activity_type": r.activity_type,
                "patient_name": r.patient_name,
                "notes": r.notes,
                "date": r.created_at.isoformat()
            })

        # Build patient names list
        patient_names = []
        for p in assigned_patients:
            patient_names.append({"name": p.name})

        result.append({
            "id": vol.id,
            "user_id": vol.user_id,
            "name": vol.name,
            "email": email,
            "patient_count": len(assigned_patients),
            "patients": patient_names,
            "tasks_total": len(tasks),
            "tasks_completed": tasks_completed,
            "reports_total": len(reports),
            "recent_reports": recent_reports_list,
            "total_hours": round(hours, 2)
        })

    return result


@doctors_router.post("/patients/{patient_id}/assign/{volunteer_id}")
def assign_patient_volunteer(
    patient_id: int,
    volunteer_id: int,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Assign a volunteer to a patient (max 3 patients per volunteer)."""

    patient = db.query(models.PatientProfile).filter_by(id=patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    volunteer = db.query(models.VolunteerProfile).filter_by(id=volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found.")

    # Check the 3-patient limit
    current_count = db.query(models.PatientProfile).filter_by(volunteer_id=volunteer_id).count()
    if current_count >= 3 and patient.volunteer_id != volunteer_id:
        raise HTTPException(
            status_code=400,
            detail="This volunteer already has 3 patients assigned (maximum limit)."
        )

    patient.volunteer_id = volunteer.id
    db.commit()

    return {"message": "Patient " + patient.name + " assigned to volunteer " + volunteer.name}


@doctors_router.post("/patients/{patient_id}/unassign")
def unassign_patient_volunteer(
    patient_id: int,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Remove a volunteer assignment from a patient."""

    patient = db.query(models.PatientProfile).filter_by(id=patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    patient.volunteer_id = None
    db.commit()
    return {"message": "Volunteer unassigned from " + patient.name}


@doctors_router.post("/volunteers/{volunteer_id}/tasks", response_model=schemas.VolunteerTaskDetails)
def assign_volunteer_task(
    volunteer_id: int,
    task_data: schemas.VolunteerTaskCreate,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Doctor assigns a task to a volunteer."""

    if user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can assign tasks.")

    new_task = models.VolunteerTask(
        volunteer_id=volunteer_id,
        task_name=task_data.task_name,
        patient_name=task_data.patient_name
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


# =============================================
# VOLUNTEER ENDPOINTS
# =============================================

@volunteers_router.get("/me", response_model=schemas.VolunteerDetails)
def get_volunteer_me(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Get the current volunteer's profile."""

    volunteer = db.query(models.VolunteerProfile).filter_by(user_id=user.id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer profile not found.")
    return volunteer


@volunteers_router.put("/me", response_model=schemas.VolunteerDetails)
def update_volunteer_me(
    profile_data: schemas.VolunteerDetails,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Update the current volunteer's profile."""

    volunteer = db.query(models.VolunteerProfile).filter_by(user_id=user.id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer profile not found.")

    if profile_data.name is not None:
        volunteer.name = profile_data.name

    db.commit()
    db.refresh(volunteer)
    return volunteer


@volunteers_router.get("/my-patients/full")
def get_my_patients_full(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Volunteer gets detailed info about all their assigned patients."""

    volunteer = db.query(models.VolunteerProfile).filter_by(user_id=user.id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer profile not found.")

    patients = db.query(models.PatientProfile).filter_by(volunteer_id=volunteer.id).all()

    result = []
    for p in patients:
        # Get doctor info
        doctor = None
        if p.doctor_id:
            doctor = db.query(models.DoctorProfile).filter_by(id=p.doctor_id).first()

        # Get latest 5 health logs
        vitals = db.query(models.HealthLog).filter_by(
            patient_id=p.id
        ).order_by(
            models.HealthLog.timestamp.desc()
        ).limit(5).all()

        # Get prescriptions
        prescriptions = db.query(models.Prescription).filter_by(
            patient_id=p.id
        ).order_by(
            models.Prescription.created_at.desc()
        ).all()

        # Get doctor notes
        notes = db.query(models.MedicalNote).filter_by(
            patient_id=p.id
        ).order_by(
            models.MedicalNote.created_at.desc()
        ).all()

        # Get reports
        reports = db.query(models.MedicalReport).filter_by(
            patient_id=p.id
        ).order_by(
            models.MedicalReport.created_at.desc()
        ).all()

        # Build doctor info
        doctor_info = None
        if doctor:
            doctor_info = {
                "id": doctor.id,
                "name": doctor.name,
                "specialty": doctor.specialty,
                "user_id": doctor.user_id
            }

        # Build vitals list
        vitals_list = []
        for v in vitals:
            vitals_list.append({
                "id": v.id,
                "pain_level": v.pain_level,
                "mood": v.mood,
                "notes": v.notes,
                "timestamp": v.timestamp.isoformat()
            })

        # Build prescriptions list
        prescriptions_list = []
        for pr in prescriptions:
            prescriptions_list.append({
                "id": pr.id,
                "medication": pr.medication,
                "dosage": pr.dosage,
                "instructions": pr.instructions,
                "created_at": pr.created_at.isoformat()
            })

        # Build notes list
        notes_list = []
        for n in notes:
            notes_list.append({
                "id": n.id,
                "note_content": n.note_content,
                "created_at": n.created_at.isoformat()
            })

        # Build reports list
        reports_list = []
        for r in reports:
            reports_list.append({
                "id": r.id,
                "title": r.title,
                "file_path": r.file_path,
                "created_at": r.created_at.isoformat()
            })

        result.append({
            "id": p.id,
            "user_id": p.user_id,
            "name": p.name,
            "age": p.age,
            "stage": p.stage,
            "doctor": doctor_info,
            "vitals": vitals_list,
            "prescriptions": prescriptions_list,
            "doctor_notes": notes_list,
            "reports": reports_list,
        })

    return result


# ---- Volunteer Tasks ----

@volunteers_router.get("/tasks", response_model=List[schemas.VolunteerTaskDetails])
def get_volunteer_tasks(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Get all tasks for the current volunteer."""

    if user.role != "volunteer":
        raise HTTPException(status_code=403, detail="Only volunteers can view their tasks.")

    volunteer = db.query(models.VolunteerProfile).filter_by(user_id=user.id).first()
    tasks = db.query(models.VolunteerTask).filter_by(
        volunteer_id=volunteer.id
    ).order_by(
        models.VolunteerTask.created_at.desc()
    ).all()

    return tasks


@volunteers_router.post("/tasks", response_model=schemas.VolunteerTaskDetails)
def create_volunteer_task(
    task_data: schemas.VolunteerTaskCreate,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Volunteer creates a new task for themselves."""

    if user.role != "volunteer":
        raise HTTPException(status_code=403, detail="Only volunteers can create their own tasks.")

    volunteer = db.query(models.VolunteerProfile).filter_by(user_id=user.id).first()

    new_task = models.VolunteerTask(
        volunteer_id=volunteer.id,
        task_name=task_data.task_name,
        patient_name=task_data.patient_name
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


@volunteers_router.put("/tasks/{task_id}/complete")
def complete_volunteer_task(
    task_id: int,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Mark a volunteer task as completed."""

    if user.role != "volunteer":
        raise HTTPException(status_code=403, detail="Only volunteers can update tasks.")

    volunteer = db.query(models.VolunteerProfile).filter_by(user_id=user.id).first()
    task = db.query(models.VolunteerTask).filter_by(
        id=task_id,
        volunteer_id=volunteer.id
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    task.is_completed = True
    db.commit()
    return {"message": "Task marked as complete"}


# ---- Volunteer Reports ----

@volunteers_router.get("/reports", response_model=List[schemas.VolunteerReportDetails])
def get_volunteer_reports(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Get all reports for the current volunteer."""

    if user.role != "volunteer":
        raise HTTPException(status_code=403, detail="Only volunteers can view their reports.")

    volunteer = db.query(models.VolunteerProfile).filter_by(user_id=user.id).first()
    reports = db.query(models.VolunteerReport).filter_by(
        volunteer_id=volunteer.id
    ).order_by(
        models.VolunteerReport.created_at.desc()
    ).all()

    return reports


@volunteers_router.post("/reports", response_model=schemas.VolunteerReportDetails)
def create_volunteer_report(
    report_data: schemas.VolunteerReportCreate,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Volunteer submits an activity report."""

    if user.role != "volunteer":
        raise HTTPException(status_code=403, detail="Only volunteers can submit reports.")

    volunteer = db.query(models.VolunteerProfile).filter_by(user_id=user.id).first()

    new_report = models.VolunteerReport(
        volunteer_id=volunteer.id,
        patient_name=report_data.patient_name,
        activity_type=report_data.activity_type,
        notes=report_data.notes
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report


# ---- Volunteer Time Tracking ----

@volunteers_router.get("/time-logs/active", response_model=Optional[schemas.VolunteerTimeLogDetails])
def get_active_time_log(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Check if the volunteer has an active (running) timer."""

    volunteer = db.query(models.VolunteerProfile).filter_by(user_id=user.id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    # Find a log that hasn't been stopped yet (end_time is None)
    active_log = db.query(models.VolunteerTimeLog).filter_by(
        volunteer_id=volunteer.id,
        end_time=None
    ).first()

    return active_log


@volunteers_router.post("/time-logs/start", response_model=schemas.VolunteerTimeLogDetails)
def start_time_log(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Start a new shift timer."""

    volunteer = db.query(models.VolunteerProfile).filter_by(user_id=user.id).first()

    # Check if there's already an active timer
    active_log = db.query(models.VolunteerTimeLog).filter_by(
        volunteer_id=volunteer.id,
        end_time=None
    ).first()

    if active_log:
        raise HTTPException(status_code=400, detail="Timer already running")

    new_log = models.VolunteerTimeLog(volunteer_id=volunteer.id)
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log


@volunteers_router.post("/time-logs/stop", response_model=schemas.VolunteerTimeLogDetails)
def stop_time_log(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Stop the current shift timer."""

    volunteer = db.query(models.VolunteerProfile).filter_by(user_id=user.id).first()

    active_log = db.query(models.VolunteerTimeLog).filter_by(
        volunteer_id=volunteer.id,
        end_time=None
    ).first()

    if not active_log:
        raise HTTPException(status_code=400, detail="No active timer found")

    # Calculate duration
    now_utc = datetime.utcnow()
    active_log.end_time = now_utc
    delta = now_utc - active_log.start_time

    seconds = delta.total_seconds()
    if seconds < 0:
        active_log.duration_minutes = 0
    else:
        active_log.duration_minutes = int(seconds / 60)

    db.commit()
    db.refresh(active_log)
    return active_log


@volunteers_router.get("/time-logs/total", response_model=float)
def get_total_hours(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(fetch_logged_in_user)
):
    """Get total hours worked by the volunteer."""

    volunteer = db.query(models.VolunteerProfile).filter_by(user_id=user.id).first()
    logs = db.query(models.VolunteerTimeLog).filter_by(volunteer_id=volunteer.id).all()

    total_seconds = 0
    now_utc = datetime.utcnow()

    for log in logs:
        if log.end_time and log.start_time:
            # Completed shift
            delta = log.end_time - log.start_time
            if delta.total_seconds() > 0:
                total_seconds = total_seconds + delta.total_seconds()
        elif not log.end_time and log.start_time:
            # Active shift (still running)
            delta = now_utc - log.start_time
            if delta.total_seconds() > 0:
                total_seconds = total_seconds + delta.total_seconds()

    return total_seconds / 3600.0


# ---- IMPORTANT: This catch-all route MUST be at the end ----
# It matches any /doctors/<something> path, so it must come AFTER
# all more specific routes like /appointments, /requests/pending, etc.
@doctors_router.get("/{doctor_id}", response_model=schemas.DoctorDetails)
def get_doctor_by_id(
    doctor_id: int,
    db: Session = Depends(database.get_database_session)
):
    """Get a doctor's profile by their ID (public endpoint)."""
    doctor = db.query(models.DoctorProfile).filter_by(id=doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")
    return doctor
