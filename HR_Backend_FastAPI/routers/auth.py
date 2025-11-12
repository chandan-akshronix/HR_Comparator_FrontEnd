# routers/auth.py - Authentication Endpoints
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo.database import Database
from datetime import datetime, timedelta
import bcrypt
from jose import JWTError, jwt
import os
from dotenv import load_dotenv

import schemas
import crud
from database import get_db, USER_COLLECTION, AUDIT_LOG_COLLECTION

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Security configuration
security = HTTPBearer()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

# ---------------------- HELPER FUNCTIONS ----------------------

def hash_password(password: str) -> str:
    """Hash password using bcrypt directly"""
    # Convert password to bytes
    password_bytes = password.encode('utf-8')
    # Generate salt and hash
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    # Return as string
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    try:
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False

def create_access_token(data: dict) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security),
                     db: Database = Depends(get_db)):
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    user = crud.get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.get("isActive"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user

# ---------------------- ENDPOINTS ----------------------

@router.post("/register", response_model=schemas.MessageResponse)
def register(user_data: schemas.UserRegister, db: Database = Depends(get_db)):
    """
    Register a new user
    
    - **email**: User email (must be unique)
    - **password**: User password (min 8 characters)
    - **firstName**: First name
    - **lastName**: Last name
    - **role**: User role (admin, hr_manager, recruiter)
    """
    # Check if user already exists
    existing_user = crud.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user document
    user_doc = {
        "email": user_data.email,
        "passwordHash": hashed_password,
        "role": user_data.role.value if hasattr(user_data.role, 'value') else user_data.role,
        "firstName": user_data.firstName,
        "lastName": user_data.lastName,
        "company": user_data.company,
        "security": {
            "emailVerified": False,
            "lastLogin": None,
            "failedLoginAttempts": 0,
            "accountLockedUntil": None
        },
        "isActive": True
    }
    
    # Create user
    user_id = crud.create_user(db, user_doc)
    
    return {
        "success": True,
        "message": "User registered successfully",
        "data": {"user_id": user_id}
    }

@router.post("/login", response_model=schemas.Token)
def login(user_data: schemas.UserLogin, db: Database = Depends(get_db)):
    """
    Login with email and password
    
    Returns JWT access token
    """
    # Get user by email
    user = crud.get_user_by_email(db, user_data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(user_data.password, user.get("passwordHash")):
        # Increment failed login attempts
        failed_attempts = user.get("security", {}).get("failedLoginAttempts", 0) + 1
        crud.update_failed_login_attempts(db, user["_id"], failed_attempts)
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if account is active
    if not user.get("isActive"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Reset failed login attempts and update last login
    crud.update_user(db, user["_id"], {
        "security.failedLoginAttempts": 0,
        "security.lastLogin": datetime.utcnow()
    })
    
    # Create access token
    access_token = create_access_token(data={"sub": user["_id"]})
    
    # Log successful login
    crud.create_audit_log(db, {
        "userId": crud.object_id(user["_id"]),
        "action": "login",
        "resourceType": "user",
        "resourceId": user["_id"],
        "ipAddress": "0.0.0.0",  # TODO: Get actual IP
        "userAgent": "Unknown",  # TODO: Get actual user agent
        "success": True
    })
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["_id"],
            "email": user["email"],
            "firstName": user["firstName"],
            "lastName": user["lastName"],
            "role": user["role"]
        }
    }

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return {
        "id": current_user["_id"],
        "email": current_user["email"],
        "firstName": current_user["firstName"],
        "lastName": current_user["lastName"],
        "role": current_user["role"],
        "company": current_user.get("company"),
        "isActive": current_user.get("isActive"),
        "createdAt": current_user.get("createdAt")
    }

@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user),
           db: Database = Depends(get_db)):
    """Logout current user"""
    # Log logout action
    crud.create_audit_log(db, {
        "userId": crud.object_id(current_user["_id"]),
        "action": "logout",
        "resourceType": "user",
        "resourceId": current_user["_id"],
        "ipAddress": "0.0.0.0",
        "userAgent": "Unknown",
        "success": True
    })
    
    return {"message": "Logged out successfully"}

