# Agile Project Management System — Backend

## Tech Stack
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy
- **Auth:** JWT (python-jose) + bcrypt (passlib)

## Quick Start

### 1. Prerequisites
- Python 3.11+
- PostgreSQL running locally
- A database named `agile_pm` (or update `.env`)

```bash
# Create the database (if not done)
createdb agile_pm
```

### 2. Install Dependencies
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure Environment
Edit `backend/.env` and set your PostgreSQL credentials:
```
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/agile_pm
```

### 4. Run the Server
```bash
uvicorn app.main:app --reload
```

### 5. Open Swagger UI
Navigate to [http://localhost:8000/docs](http://localhost:8000/docs)

## Project Structure
```
backend/
├── app/
│   ├── main.py           # FastAPI entry point
│   ├── config.py          # Environment-based settings
│   ├── database.py        # SQLAlchemy engine & session
│   ├── dependencies.py    # Auth guards (JWT + RBAC)
│   ├── models/
│   │   └── user.py        # User ORM model
│   ├── schemas/
│   │   └── user.py        # Pydantic request/response schemas
│   ├── routers/
│   │   └── auth.py        # /auth endpoints
│   └── services/
│       └── auth.py        # Password hashing & JWT utils
├── .env                   # Environment variables
└── requirements.txt       # Python dependencies
```

## Available Endpoints
| Method | Path             | Description              | Auth     |
|--------|------------------|--------------------------|----------|
| GET    | `/`              | Health check             | No       |
| POST   | `/auth/register` | Register a new user      | No       |
| POST   | `/auth/login`    | Login → get JWT          | No       |
| GET    | `/auth/me`       | Get current user profile | Required |
