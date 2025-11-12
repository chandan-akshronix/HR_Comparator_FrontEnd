# schemas.py - Pydantic Schemas for API Request/Response
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from models import (
    FitCategory, ResumeSource, JDStatus, UserRole,
    ExperienceRequired, JDExtracted, Education, WorkHistory,
    ResumeExtracted, MatchBreakdown, WorkflowStatus, AgentStatus
)

# ---------------------- AUTHENTICATION SCHEMAS ----------------------

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)  # Changed from 8 to 6
    firstName: str
    lastName: str
    company: Optional[str] = None
    role: UserRole = UserRole.recruiter
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "hr@company.com",
                "password": "password123",
                "firstName": "HR",
                "lastName": "Manager",
                "role": "hr_manager"
            }
        }

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    firstName: str
    lastName: str
    role: UserRole
    company: Optional[str] = None
    isActive: bool
    createdAt: datetime
    
    class Config:
        from_attributes = True

# ---------------------- RESUME SCHEMAS ----------------------

class ResumeCreate(BaseModel):
    filename: str
    text: str
    fileSize: Optional[int] = None
    source: ResumeSource = ResumeSource.direct

class ResumeUpdate(BaseModel):
    filename: Optional[str] = None
    text: Optional[str] = None
    source: Optional[ResumeSource] = None

class ResumeResponse(BaseModel):
    id: str
    filename: str
    text: str
    uploadedAt: datetime
    fileSize: Optional[int] = None
    source: ResumeSource
    uploadedBy: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        from_attributes = True

class ResumeListResponse(BaseModel):
    id: str
    filename: str
    uploadedAt: datetime
    fileSize: Optional[int] = None
    source: ResumeSource
    text_preview: str  # First 200 chars
    
    class Config:
        from_attributes = True

# ---------------------- JOB DESCRIPTION SCHEMAS ----------------------

class JobDescriptionCreate(BaseModel):
    id: str = Field(..., description="Custom JD ID like 'AZ-12334'")
    designation: str
    description: str
    company: Optional[str] = None
    location: Optional[str] = None
    status: JDStatus = JDStatus.active

class JobDescriptionUpdate(BaseModel):
    designation: Optional[str] = None
    description: Optional[str] = None
    status: Optional[JDStatus] = None
    company: Optional[str] = None
    location: Optional[str] = None

class JobDescriptionResponse(BaseModel):
    id: str
    designation: str
    description: str
    createdAt: datetime
    updatedAt: datetime
    status: JDStatus
    company: Optional[str] = None
    location: Optional[str] = None
    createdBy: Optional[str] = None
    
    class Config:
        from_attributes = True

class JobDescriptionListResponse(BaseModel):
    id: str
    designation: str
    description_preview: str  # First 200 chars
    status: JDStatus
    company: Optional[str] = None
    location: Optional[str] = None
    createdAt: datetime
    
    class Config:
        from_attributes = True

# ---------------------- MATCHING SCHEMAS ----------------------

class MatchingRequest(BaseModel):
    """Request to match a resume against a job description"""
    resume_id: str
    jd_id: str
    force_reprocess: bool = False  # Force reprocessing even if result exists

class MatchingBatchRequest(BaseModel):
    """Request to match multiple resumes against a job description"""
    jd_id: str
    resume_ids: Optional[List[str]] = None  # If None, match all resumes
    force_reprocess: bool = False

class ResumeResultResponse(BaseModel):
    """Response for matching results"""
    id: str
    resume_id: str
    jd_id: str
    match_score: float
    fit_category: FitCategory
    jd_extracted: JDExtracted
    resume_extracted: ResumeExtracted
    match_breakdown: MatchBreakdown
    selection_reason: str
    timestamp: datetime
    agent_version: Optional[str] = None
    processing_duration_ms: Optional[int] = None
    confidence_score: Optional[float] = None
    
    class Config:
        from_attributes = True

class ResumeResultListResponse(BaseModel):
    """Simplified response for listing match results"""
    id: str
    resume_id: str
    jd_id: str
    workflow_id: Optional[str] = None
    candidate_name: str
    current_position: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    total_experience: Optional[float] = None
    skills_matched: Optional[List[str]] = None
    match_score: float
    fit_category: FitCategory
    match_breakdown: Optional[Dict[str, Any]] = None
    timestamp: datetime
    
    class Config:
        from_attributes = True

class TopMatchesResponse(BaseModel):
    """Response for top candidate matches"""
    jd_id: str
    jd_designation: str
    total_candidates: int
    top_matches: List[ResumeResultListResponse]

# ---------------------- FILE UPLOAD SCHEMAS ----------------------

class FileUploadResponse(BaseModel):
    success: bool
    message: str
    file_id: Optional[str] = None
    file_url: Optional[str] = None
    resume_id: Optional[str] = None

# ---------------------- ANALYTICS SCHEMAS ----------------------

class SkillAnalysis(BaseModel):
    skill_name: str
    count: int
    avg_match_score: float

class MatchingStatsResponse(BaseModel):
    total_resumes: int
    total_jds: int
    total_matches: int
    avg_match_score: float
    excellent_matches: int
    good_matches: int
    average_matches: int
    poor_matches: int
    top_skills: List[SkillAnalysis]

class JDStatsResponse(BaseModel):
    jd_id: str
    designation: str
    total_candidates: int
    avg_match_score: float
    best_match_score: float
    candidates_by_category: dict

# ---------------------- AUDIT LOG SCHEMAS ----------------------

class AuditLogResponse(BaseModel):
    id: str
    userId: str
    action: str
    resourceType: str
    resourceId: Optional[str] = None
    timestamp: datetime
    success: bool
    ipAddress: str
    
    class Config:
        from_attributes = True

# ---------------------- COMMON RESPONSE SCHEMAS ----------------------

class MessageResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    data: List[dict]

# ---------------------- WORKFLOW EXECUTION SCHEMAS ----------------------

class AgentExecutionSchema(BaseModel):
    agent_id: str
    name: str
    status: AgentStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    error: Optional[str] = None

class WorkflowExecutionCreate(BaseModel):
    jd_id: str
    resume_ids: List[str]
    
class WorkflowExecutionResponse(BaseModel):
    id: str
    workflow_id: str
    jd_id: str
    jd_title: str
    status: WorkflowStatus
    started_by: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    total_resumes: int
    processed_resumes: int
    agents: List[AgentExecutionSchema]
    progress: Dict[str, Any]
    metrics: Dict[str, Any]
    results: Optional[Dict[str, Any]] = None
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        from_attributes = True

class WorkflowExecutionListResponse(BaseModel):
    id: str
    workflow_id: str
    jd_id: str
    jd_title: str
    status: WorkflowStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    total_resumes: int
    processed_resumes: int
    agents: List[AgentExecutionSchema]  # Added agents field!
    progress: Dict[str, Any]
    metrics: Dict[str, Any]  # Added metrics field!
    
    class Config:
        from_attributes = True

class WorkflowStatusUpdate(BaseModel):
    status: Optional[WorkflowStatus] = None
    processed_resumes: Optional[int] = None
    agents: Optional[List[AgentExecutionSchema]] = None
    progress: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None
    results: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

