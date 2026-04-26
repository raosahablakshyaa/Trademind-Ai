from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.db.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from pydantic import BaseModel, EmailStr

router = APIRouter()

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

@router.post("/register")
async def register(body: RegisterRequest):
    db = get_db()
    existing = await db.users.find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = {"name": body.name, "email": body.email, "password": hash_password(body.password)}
    result = await db.users.insert_one(user)
    token = create_access_token({"sub": str(result.inserted_id)})
    return {"access_token": token, "token_type": "bearer", "name": body.name}

@router.post("/login")
async def login(form: OAuth2PasswordRequestForm = Depends()):
    db = get_db()
    user = await db.users.find_one({"email": form.username})
    if not user or not verify_password(form.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user["_id"])})
    return {"access_token": token, "token_type": "bearer", "name": user["name"]}
