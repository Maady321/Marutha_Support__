# backend/main.py - Application Entry Point
# This is the main file that starts the FastAPI server and configures the app.

# 1. WHAT: Imports FastAPI core classes.
# EXPLAIN: FastAPI is our web framework; Request is used to read incoming data.
# QUESTION: Why do we use FastAPI?
# ANSWER: It is very fast, easy to use, and automatically generates API documentation.
from fastapi import FastAPI, Request

# 2. WHAT: Imports StaticFiles.
# EXPLAIN: Allows serving images, CSS, and HTML files directly.
from fastapi.staticfiles import StaticFiles

# 3. WHAT: Imports CORS Middleware.
# EXPLAIN: CORS (Cross-Origin Resource Sharing) allows the frontend to talk to the backend.
# QUESTION: What happens without CORS?
# ANSWER: The browser would block the frontend from calling the backend for security reasons.
from fastapi.middleware.cors import CORSMiddleware

# 4. WHAT: Imports JSONResponse for standard error messages.
from fastapi.responses import JSONResponse

# 5. WHAT: Imports standard Python modules.
# EXPLAIN: os for path management; traceback for detailed error logging.
import os
import traceback

# 6. WHAT: Imports socketio for real-time chat.
import socketio

# 7. WHAT: Imports project modules.
# EXPLAIN: auth handles login; database handles DB connection; models defines tables.
import auth, database, models
from routers import users, clinical, chats
from socket_io import sio

# 8. WHAT: Creates database tables.
# EXPLAIN: This line checks the "models.py" file and creates any missing tables in the Neon DB.
# QUESTION: Does this delete existing data?
# ANSWER: No, "create_all" only adds tables that don't exist yet; it doesn't touch existing data.
models.Base.metadata.create_all(bind=database.engine)

# 9. WHAT: Initializes the FastAPI application.
app = FastAPI(title="Marutha Support API")

# ---- Error Handling ----

# 10. WHAT: Middleware to catch server crashes.
# EXPLAIN: This "wraps" every request to ensure that if the code fails, the server doesn't die.
# QUESTION: Where does the error go?
# ANSWER: It gets written to "crash_log.txt" so the developer can fix it later.
@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        with open("crash_log.txt", "a") as f:
            f.write("\nCRASH at " + str(request.url) + "\n")
            f.write(traceback.format_exc())
        return JSONResponse(status_code=500, content={"detail": str(e)})

# ---- CORS Setup ----

# 11. WHAT: Configures which websites can talk to this API.
# EXPLAIN: In production (Vercel), we allow all origins ("*").
if os.getenv("VERCEL"):
    ALLOWED_ORIGINS = ["*"]
    allow_creds = False
else:
    ALLOWED_ORIGINS = ["*"]
    allow_creds = False 

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=allow_creds,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 12. WHAT: Global exception handler.
# EXPLAIN: Catches any errors that the middleware might have missed.
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print("GLOBAL CRASH:", exc)
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)},
    )

# ---- File Upload Directory ----

# 13. WHAT: Sets up the folder for patient reports.
# EXPLAIN: Vercel requires "/tmp/" for temporary file storage.
if os.getenv("VERCEL"):
    UPLOAD_DIR = "/tmp/uploaded_reports"
else:
    UPLOAD_DIR = "uploaded_reports"

os.makedirs(UPLOAD_DIR, exist_ok=True)

# 14. WHAT: Mounts the reports folder to a URL path.
# EXPLAIN: Allows users to visit "/uploaded_reports/file.pdf" to view a report.
app.mount("/uploaded_reports", StaticFiles(directory=UPLOAD_DIR), name="reports")

# ---- Static & Template Serving ----

# 15. WHAT: Calculates project paths.
# EXPLAIN: This ensures the backend knows exactly where the "frontend" folder is located.
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_DIR = os.path.dirname(_BACKEND_DIR)
FRONTEND_DIR = os.path.join(_PROJECT_DIR, "frontend")
STATIC_DIR = os.path.join(FRONTEND_DIR, "static")
TEMPLATES_DIR = os.path.join(FRONTEND_DIR, "templates")

# 16. WHAT: Mounts the static assets folder.
# EXPLAIN: Serves CSS, JS, and Images for the frontend.
if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static_assets")

# 17. WHAT: Mounts the templates folder.
# EXPLAIN: Serves the HTML pages.
if os.path.isdir(TEMPLATES_DIR):
    app.mount("/templates", StaticFiles(directory=TEMPLATES_DIR, html=True), name="templates")

# ---- Register All Routers ----

# 18. WHAT: Connects different API modules.
# EXPLAIN: Instead of one giant file, we split logic into "users", "clinical", etc.
# QUESTION: Why use routers?
# ANSWER: It makes the code organized and easier for multiple developers to work on simultaneously.
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

# 19. WHAT: Home endpoint.
# EXPLAIN: Provides a simple status check for the API.
@app.get("/")
def home():
    return {"message": "Marutha Support API is running!"}

# 20. WHAT: Socket.io Integration.
# EXPLAIN: Wraps the FastAPI app to allow real-time notifications and chat.
# QUESTION: What is an ASGIApp?
# ANSWER: It is the standard interface for modern Python web servers (like Uvicorn) to run your app.
app = socketio.ASGIApp(sio, other_asgi_app=app, socketio_path='/socket.io')
