# models.py - Pydantic Models for MongoDB Documents
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
from bson import ObjectId

# Custom PyObjectId for MongoDB _id field (Pydantic v2 compatible)
class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type, _handler):
        from pydantic_core import core_schema
        
        def validate(value):
            if isinstance(value, ObjectId):
                return str(value)
            if isinstance(value, str):
                if ObjectId.is_valid(value):
                    return value
                raise ValueError("Invalid ObjectId")
            raise ValueError("Invalid ObjectId type")
        
        return core_schema.no_info_plain_validator_function(validate)
    
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)

# ---------------------- ENUMS ----------------------

class FitCategory(str, Enum):
    best_fit = "Best Fit"
    partial_fit = "Partial Fit"
    not_fit = "Not Fit"
    # Legacy values for backward compatibility
    excellent_match = "Excellent Match"
    good_match = "Good Match"
    average_match = "Average Match"
    poor_match = "Poor Match"

class ResumeSource(str, Enum):
    direct = "direct"
    linkedin = "LinkedIn"
    indeed = "Indeed"
    naukri = "Naukri.com"

class JDStatus(str, Enum):
    active = "active"
    closed = "closed"
    draft = "draft"

class UserRole(str, Enum):
    admin = "admin"
    hr_manager = "hr_manager"
    recruiter = "recruiter"

class AuditAction(str, Enum):
    login = "login"
    view_resume = "view_resume"
    export_data = "export_data"
    delete_resume = "delete_resume"
    create_jd = "create_jd"
    run_matching = "run_matching"
    upload_resume = "upload_resume"
    update_jd = "update_jd"
    start_workflow = "start_workflow"
    complete_workflow = "complete_workflow"

class WorkflowStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    failed = "failed"

class AgentStatus(str, Enum):
    idle = "idle"
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    failed = "failed"

class VirusScanStatus(str, Enum):
    pending = "pending"
    clean = "clean"
    infected = "infected"
    error = "error"

# ---------------------- RESUME MODEL ----------------------

class ResumeModel(BaseModel):
    """MongoDB Document Model for Resume Collection"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    filename: str
    text: str  # Full parsed resume text
    uploadedAt: datetime = Field(default_factory=datetime.utcnow)
    fileSize: Optional[int] = None
    source: ResumeSource = ResumeSource.direct
    uploadedBy: Optional[PyObjectId] = None  # FK to User
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# ---------------------- JOB DESCRIPTION MODEL ----------------------

class JobDescriptionModel(BaseModel):
    """MongoDB Document Model for JobDescription Collection"""
    id: str = Field(alias="_id")  # Custom string ID like "AZ-12334"
    designation: str
    description: str  # Full job description text
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    status: JDStatus = JDStatus.active
    company: Optional[str] = None
    location: Optional[str] = None
    createdBy: Optional[PyObjectId] = None  # FK to User
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# ---------------------- RESUME RESULT MODEL ----------------------

class ExperienceRequired(BaseModel):
    min_years: int
    max_years: Optional[int] = None
    type: str

class JDExtracted(BaseModel):
    position: str
    experience_required: ExperienceRequired
    required_skills: List[str]
    preferred_skills: List[str]
    education: str
    location: str
    job_type: Optional[str] = None
    responsibilities: List[str]

class Education(BaseModel):
    degree: str
    institution: str
    year: int
    grade: Optional[str] = None

class WorkHistory(BaseModel):
    title: str
    company: str
    duration: str
    technologies: List[str]

class ResumeExtracted(BaseModel):
    candidate_name: str
    email: str
    phone: str
    location: str
    current_position: str
    total_experience: float
    relevant_experience: float
    skills_matched: List[str]
    skills_missing: List[str]
    education: Education
    certifications: List[str]
    work_history: List[WorkHistory]
    key_achievements: List[str]

class MatchBreakdown(BaseModel):
    skills_match: float
    experience_match: float
    education_match: float
    location_match: float
    cultural_fit: float
    overall_compatibility: float

class ResumeResultModel(BaseModel):
    """MongoDB Document Model for resume_result Collection"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    resume_id: PyObjectId  # FK to Resume
    jd_id: str  # FK to JobDescription
    match_score: float  # 0-100
    fit_category: FitCategory
    jd_extracted: JDExtracted
    resume_extracted: ResumeExtracted
    match_breakdown: MatchBreakdown
    selection_reason: str  # AI-generated recommendation text
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    agent_version: Optional[str] = None
    processing_duration_ms: Optional[int] = None
    confidence_score: Optional[float] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# ---------------------- USER MODEL ----------------------

class SecuritySettings(BaseModel):
    emailVerified: bool = False
    lastLogin: Optional[datetime] = None
    failedLoginAttempts: int = 0
    accountLockedUntil: Optional[datetime] = None

class UserModel(BaseModel):
    """MongoDB Document Model for User Collection"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    email: EmailStr
    passwordHash: str  # bcrypt hashed
    role: UserRole = UserRole.recruiter
    firstName: str
    lastName: str
    company: Optional[str] = None
    security: SecuritySettings = Field(default_factory=SecuritySettings)
    isActive: bool = True
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# ---------------------- AUDIT LOG MODEL ----------------------

class AuditLogModel(BaseModel):
    """MongoDB Document Model for Audit Logs"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    userId: PyObjectId
    action: AuditAction
    resourceType: str  # "resume", "job_description", "resume_result"
    resourceId: Optional[str] = None
    ipAddress: str
    userAgent: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    success: bool = True
    errorMessage: Optional[str] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# ---------------------- FILE METADATA MODEL ----------------------

class FileSecurity(BaseModel):
    virusScanStatus: VirusScanStatus = VirusScanStatus.pending
    virusScanDate: Optional[datetime] = None
    encrypted: bool = False

class FileMetadataModel(BaseModel):
    """MongoDB Document Model for File Metadata"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    resumeId: Optional[PyObjectId] = None
    jdId: Optional[str] = None
    originalName: str
    storagePath: str  # S3/Azure blob path
    fileSize: int
    mimeType: str
    checksum: str  # SHA-256 hash
    security: FileSecurity = Field(default_factory=FileSecurity)
    uploadedBy: PyObjectId
    uploadedAt: datetime = Field(default_factory=datetime.utcnow)
    expiresAt: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# ---------------------- WORKFLOW EXECUTION MODEL ----------------------

class AgentExecution(BaseModel):
    agent_id: str
    name: str
    status: AgentStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    error: Optional[str] = None

class WorkflowExecutionModel(BaseModel):
    """MongoDB Document Model for Workflow Execution"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    workflow_id: str  # Custom ID like "WF-1731427200000"
    jd_id: str  # FK to JobDescription
    jd_title: str
    status: WorkflowStatus = WorkflowStatus.pending
    started_by: PyObjectId  # FK to User
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    resume_ids: List[PyObjectId] = []
    total_resumes: int = 0
    processed_resumes: int = 0
    agents: List[AgentExecution] = []
    progress: Dict[str, Any] = {}
    metrics: Dict[str, Any] = {}
    results: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    error_details: Optional[Dict[str, Any]] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

