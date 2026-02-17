from fastapi import FastAPI  # Import FastAPI framework to create the API
from fastapi.staticfiles import StaticFiles  # Import StaticFiles for serving static files
from fastapi.middleware.cors import CORSMiddleware  # Import CORSMiddleware for handling Cross-Origin Resource Sharing
from backend import auth, database, models  # Import application modules: auth, database, and models
from backend.routers import users, clinical, chats  # Import router modules from the backend.routers package
from backend.socket_io import sio_app  # Import Socket.io application

# Create all database tables defined in models using the database engine
models.Base.metadata.create_all(bind=database.engine)

# Initialize the FastAPI application with a custom title
app = FastAPI(title="Marutha Support API")

# Mount Socket.io app
app.mount("/socket.io", sio_app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5505",
        "http://localhost:5505",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import Request
from fastapi.responses import JSONResponse
import traceback

@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        with open("crash_log.txt", "a") as f:
            f.write(f"\nCRASH at {request.url}\n")
            f.write(traceback.format_exc())
        return JSONResponse(status_code=500, content={"detail": str(e)})

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"GLOBAL CRASH: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)},
    )

# Mount the 'uploaded_reports' directory to serve report files under the '/uploaded_reports' path
app.mount("/uploaded_reports", StaticFiles(directory="uploaded_reports"), name="reports")

# Include the authentication router
app.include_router(auth.router)
# Include the patients router
app.include_router(users.patients_router)
# Include the doctors router
app.include_router(users.doctors_router)
# Include the volunteers router
app.include_router(users.volunteers_router)
# Include the consultations router
app.include_router(clinical.consult_router)
# Include the vitals router
app.include_router(clinical.vitals_router)
# Include the reports router
app.include_router(clinical.reports_router)
# Include the chat router
app.include_router(chats.chat_router)

# Define the root endpoint for the API
@app.get("/")
def home():
    # Return a JSON response confirming the API is running
    return {"message": "Marutha Support API is running!"}
