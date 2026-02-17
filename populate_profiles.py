from backend.database import SessionLocal
from backend import models

def populate_profiles():
    db = SessionLocal()
    users = db.query(models.UserAccount).all()
    for user in users:
        if user.role == 'doctor':
            if not db.query(models.DoctorProfile).filter_by(user_id=user.id).first():
                print(f"Creating doctor profile for {user.email}")
                db.add(models.DoctorProfile(user_id=user.id, name=user.email.split('@')[0], specialty="General", is_online=False))
        elif user.role == 'patient':
            if not db.query(models.PatientProfile).filter_by(user_id=user.id).first():
                print(f"Creating patient profile for {user.email}")
                db.add(models.PatientProfile(user_id=user.id, name=user.email.split('@')[0], age=30, stage="Early"))
        elif user.role == 'volunteer':
            if not db.query(models.VolunteerProfile).filter_by(user_id=user.id).first():
                print(f"Creating volunteer profile for {user.email}")
                db.add(models.VolunteerProfile(user_id=user.id, name=user.email.split('@')[0]))
    db.commit()
    db.close()
    print("Profile population done.")

if __name__ == "__main__":
    populate_profiles()
