# 🏥 Marutha Support

A healthcare support platform connecting **patients**, **doctors**, and **volunteers** for better care coordination.

## 📁 Project Structure

```
Marutha_support/
├── backend/                  # FastAPI backend server
│   ├── main.py               # Application entry point
│   ├── auth.py               # Authentication (register, login, token management)
│   ├── database.py           # Database engine & session setup (SQLite/PostgreSQL)
│   ├── models.py             # SQLAlchemy ORM models
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── socket_io.py          # Socket.IO real-time chat server
│   ├── requirements.txt      # Python dependencies
│   ├── uploaded_reports/     # Uploaded medical reports (gitignored)
│   └── routers/              # API route modules
│       ├── users.py          # Patient, Doctor & Volunteer endpoints
│       ├── clinical.py       # Consultations, vitals, reports, notes, prescriptions
│       └── chats.py          # Chat messaging endpoints
│
└── frontend/                 # Static frontend (HTML/CSS/JS)
    ├── static/
    │   ├── css/              # Stylesheets (auth, base, chat, components, dashboard, landing)
    │   ├── images/           # Static images (logo, etc.)
    │   └── js/               # JavaScript modules
    └── templates/            # HTML page templates
```

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- pip

### Setup & Run

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create a virtual environment
python -m venv venv

# 3. Activate the virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Run the server
uvicorn main:app --reload --port 8009
```

### Environment Variables

Create a `.env` file in the project root (or `backend/` directory):

```env
DATABASE_URL=sqlite:///./test.db
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=300
DEBUG=True
PORT=8009
```

## 🧩 Key Features

- **Multi-role system**: Patients, Doctors, Volunteers
- **Consultations**: Doctors manage patient consultations
- **Health tracking**: Vitals, medical reports, notes, prescriptions
- **Real-time chat**: Socket.IO powered messaging between users
- **Volunteer coordination**: Doctors can assign volunteers to patients
- **Profile management**: Tabbed view/edit profiles for all roles

## 🛠 Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Backend  | FastAPI, SQLAlchemy, Socket.IO      |
| Frontend | HTML, CSS, JavaScript               |
| Database | SQLite (dev) / PostgreSQL (prod)    |
| Auth     | Token-based (bcrypt + simple token) |
