# crud.py - Database CRUD Operations
from pymongo.database import Database
from pymongo import ASCENDING, DESCENDING
from bson import ObjectId
from typing import List, Optional, Dict, Any
from datetime import datetime
import models
from database import (
    RESUME_COLLECTION,
    JOB_DESCRIPTION_COLLECTION,
    RESUME_RESULT_COLLECTION,
    USER_COLLECTION,
    AUDIT_LOG_COLLECTION,
    FILE_METADATA_COLLECTION,
    WORKFLOW_EXECUTION_COLLECTION
)

# ---------------------- HELPER FUNCTIONS ----------------------

def object_id(id_str: str) -> ObjectId:
    """Convert string to ObjectId"""
    return ObjectId(id_str) if ObjectId.is_valid(id_str) else None

def to_dict(doc: dict) -> dict:
    """Convert MongoDB document to dict with _id as string"""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

# ---------------------- RESUME OPERATIONS ----------------------

def create_resume(db: Database, resume_data: dict) -> str:
    """Create a new resume document"""
    resume_data["createdAt"] = datetime.utcnow()
    resume_data["updatedAt"] = datetime.utcnow()
    result = db[RESUME_COLLECTION].insert_one(resume_data)
    return str(result.inserted_id)

def get_resume_by_id(db: Database, resume_id: str) -> Optional[dict]:
    """Get resume by ID"""
    oid = object_id(resume_id)
    if not oid:
        return None
    resume = db[RESUME_COLLECTION].find_one({"_id": oid})
    return to_dict(resume) if resume else None

def get_all_resumes(db: Database, skip: int = 0, limit: int = 100, 
                    source: Optional[str] = None) -> List[dict]:
    """Get all resumes with pagination"""
    query = {}
    if source:
        query["source"] = source
    
    resumes = db[RESUME_COLLECTION].find(query) \
        .sort("uploadedAt", DESCENDING) \
        .skip(skip) \
        .limit(limit)
    
    return [to_dict(resume) for resume in resumes]

def count_resumes(db: Database, source: Optional[str] = None) -> int:
    """Count total resumes"""
    query = {}
    if source:
        query["source"] = source
    return db[RESUME_COLLECTION].count_documents(query)

def update_resume(db: Database, resume_id: str, update_data: dict) -> bool:
    """Update resume"""
    oid = object_id(resume_id)
    if not oid:
        return False
    
    update_data["updatedAt"] = datetime.utcnow()
    result = db[RESUME_COLLECTION].update_one(
        {"_id": oid},
        {"$set": update_data}
    )
    return result.modified_count > 0

def delete_resume(db: Database, resume_id: str) -> bool:
    """Delete resume"""
    oid = object_id(resume_id)
    if not oid:
        return False
    
    result = db[RESUME_COLLECTION].delete_one({"_id": oid})
    return result.deleted_count > 0

def search_resumes(db: Database, search_text: str, limit: int = 20) -> List[dict]:
    """Full-text search in resumes"""
    results = db[RESUME_COLLECTION].find(
        {"$text": {"$search": search_text}}
    ).limit(limit)
    return [to_dict(resume) for resume in results]

# ---------------------- JOB DESCRIPTION OPERATIONS ----------------------

def create_job_description(db: Database, jd_data: dict) -> str:
    """Create a new job description"""
    jd_data["createdAt"] = datetime.utcnow()
    jd_data["updatedAt"] = datetime.utcnow()
    result = db[JOB_DESCRIPTION_COLLECTION].insert_one(jd_data)
    return jd_data["_id"]  # Custom string ID

def get_jd_by_id(db: Database, jd_id: str) -> Optional[dict]:
    """Get job description by ID"""
    jd = db[JOB_DESCRIPTION_COLLECTION].find_one({"_id": jd_id})
    return to_dict(jd) if jd else None

def get_all_jds(db: Database, skip: int = 0, limit: int = 100,
                status: Optional[str] = None) -> List[dict]:
    """Get all job descriptions"""
    query = {}
    if status:
        query["status"] = status
    
    jds = db[JOB_DESCRIPTION_COLLECTION].find(query) \
        .sort("createdAt", DESCENDING) \
        .skip(skip) \
        .limit(limit)
    
    return [to_dict(jd) for jd in jds]

def count_jds(db: Database, status: Optional[str] = None) -> int:
    """Count total job descriptions"""
    query = {}
    if status:
        query["status"] = status
    return db[JOB_DESCRIPTION_COLLECTION].count_documents(query)

def update_jd(db: Database, jd_id: str, update_data: dict) -> bool:
    """Update job description"""
    update_data["updatedAt"] = datetime.utcnow()
    result = db[JOB_DESCRIPTION_COLLECTION].update_one(
        {"_id": jd_id},
        {"$set": update_data}
    )
    return result.modified_count > 0

def delete_jd(db: Database, jd_id: str) -> bool:
    """Delete job description"""
    result = db[JOB_DESCRIPTION_COLLECTION].delete_one({"_id": jd_id})
    return result.deleted_count > 0

def search_jds(db: Database, search_text: str, limit: int = 20) -> List[dict]:
    """Full-text search in job descriptions"""
    results = db[JOB_DESCRIPTION_COLLECTION].find(
        {"$text": {"$search": search_text}}
    ).limit(limit)
    return [to_dict(jd) for jd in results]

# ---------------------- RESUME RESULT OPERATIONS ----------------------

def create_resume_result(db: Database, result_data: dict) -> str:
    """Create a new resume result"""
    result_data["timestamp"] = datetime.utcnow()
    result = db[RESUME_RESULT_COLLECTION].insert_one(result_data)
    return str(result.inserted_id)

def get_result_by_id(db: Database, result_id: str) -> Optional[dict]:
    """Get result by ID"""
    oid = object_id(result_id)
    if not oid:
        return None
    result = db[RESUME_RESULT_COLLECTION].find_one({"_id": oid})
    return to_dict(result) if result else None

def get_result_by_resume_jd(db: Database, resume_id: str, jd_id: str) -> Optional[dict]:
    """Get result by resume and JD IDs"""
    oid = object_id(resume_id)
    if not oid:
        return None
    
    result = db[RESUME_RESULT_COLLECTION].find_one({
        "resume_id": oid,
        "jd_id": jd_id
    })
    return to_dict(result) if result else None

def get_results_by_jd(db: Database, jd_id: str, skip: int = 0, 
                     limit: int = 100, min_score: Optional[float] = None) -> List[dict]:
    """Get all results for a job description"""
    query = {"jd_id": jd_id}
    if min_score is not None:
        query["match_score"] = {"$gte": min_score}
    
    results = db[RESUME_RESULT_COLLECTION].find(query) \
        .sort("match_score", DESCENDING) \
        .skip(skip) \
        .limit(limit)
    
    return [to_dict(result) for result in results]

def get_top_matches(db: Database, jd_id: str, limit: int = 10) -> List[dict]:
    """Get top matching candidates for a JD"""
    results = db[RESUME_RESULT_COLLECTION].find({"jd_id": jd_id}) \
        .sort("match_score", DESCENDING) \
        .limit(limit)
    
    return [to_dict(result) for result in results]

def get_results_by_fit_category(db: Database, jd_id: str, 
                                fit_category: str) -> List[dict]:
    """Get results by fit category"""
    results = db[RESUME_RESULT_COLLECTION].find({
        "jd_id": jd_id,
        "fit_category": fit_category
    }).sort("match_score", DESCENDING)
    
    return [to_dict(result) for result in results]

def delete_result(db: Database, result_id: str) -> bool:
    """Delete result"""
    oid = object_id(result_id)
    if not oid:
        return False
    
    result = db[RESUME_RESULT_COLLECTION].delete_one({"_id": oid})
    return result.deleted_count > 0

# ---------------------- USER OPERATIONS ----------------------

def create_user(db: Database, user_data: dict) -> str:
    """Create a new user"""
    user_data["createdAt"] = datetime.utcnow()
    user_data["updatedAt"] = datetime.utcnow()
    result = db[USER_COLLECTION].insert_one(user_data)
    return str(result.inserted_id)

def get_user_by_id(db: Database, user_id: str) -> Optional[dict]:
    """Get user by ID"""
    oid = object_id(user_id)
    if not oid:
        return None
    user = db[USER_COLLECTION].find_one({"_id": oid})
    return to_dict(user) if user else None

def get_user_by_email(db: Database, email: str) -> Optional[dict]:
    """Get user by email"""
    user = db[USER_COLLECTION].find_one({"email": email})
    return to_dict(user) if user else None

def update_user(db: Database, user_id: str, update_data: dict) -> bool:
    """Update user"""
    oid = object_id(user_id)
    if not oid:
        return False
    
    update_data["updatedAt"] = datetime.utcnow()
    result = db[USER_COLLECTION].update_one(
        {"_id": oid},
        {"$set": update_data}
    )
    return result.modified_count > 0

def update_failed_login_attempts(db: Database, user_id: str, attempts: int) -> bool:
    """Update failed login attempts"""
    oid = object_id(user_id)
    if not oid:
        return False
    
    result = db[USER_COLLECTION].update_one(
        {"_id": oid},
        {"$set": {"security.failedLoginAttempts": attempts}}
    )
    return result.modified_count > 0

# ---------------------- AUDIT LOG OPERATIONS ----------------------

def create_audit_log(db: Database, log_data: dict) -> str:
    """Create audit log entry"""
    log_data["timestamp"] = datetime.utcnow()
    result = db[AUDIT_LOG_COLLECTION].insert_one(log_data)
    return str(result.inserted_id)

def get_audit_logs(db: Database, user_id: Optional[str] = None, 
                   action: Optional[str] = None, skip: int = 0, 
                   limit: int = 100) -> List[dict]:
    """Get audit logs with filters"""
    query = {}
    if user_id:
        oid = object_id(user_id)
        if oid:
            query["userId"] = oid
    if action:
        query["action"] = action
    
    logs = db[AUDIT_LOG_COLLECTION].find(query) \
        .sort("timestamp", DESCENDING) \
        .skip(skip) \
        .limit(limit)
    
    return [to_dict(log) for log in logs]

# ---------------------- FILE METADATA OPERATIONS ----------------------

def create_file_metadata(db: Database, file_data: dict) -> str:
    """Create file metadata entry"""
    file_data["uploadedAt"] = datetime.utcnow()
    result = db[FILE_METADATA_COLLECTION].insert_one(file_data)
    return str(result.inserted_id)

def get_file_by_resume_id(db: Database, resume_id: str) -> Optional[dict]:
    """Get file metadata by resume ID"""
    oid = object_id(resume_id)
    if not oid:
        return None
    
    file_meta = db[FILE_METADATA_COLLECTION].find_one({"resumeId": oid})
    return to_dict(file_meta) if file_meta else None

# ---------------------- ANALYTICS OPERATIONS ----------------------

def get_matching_stats(db: Database) -> dict:
    """Get overall matching statistics"""
    total_resumes = db[RESUME_COLLECTION].count_documents({})
    total_jds = db[JOB_DESCRIPTION_COLLECTION].count_documents({})
    total_matches = db[RESUME_RESULT_COLLECTION].count_documents({})
    
    # Average match score
    pipeline = [
        {"$group": {"_id": None, "avg_score": {"$avg": "$match_score"}}}
    ]
    avg_result = list(db[RESUME_RESULT_COLLECTION].aggregate(pipeline))
    avg_match_score = avg_result[0]["avg_score"] if avg_result else 0
    
    # Matches by category
    excellent_matches = db[RESUME_RESULT_COLLECTION].count_documents(
        {"fit_category": "Excellent Match"}
    )
    good_matches = db[RESUME_RESULT_COLLECTION].count_documents(
        {"fit_category": "Good Match"}
    )
    average_matches = db[RESUME_RESULT_COLLECTION].count_documents(
        {"fit_category": "Average Match"}
    )
    poor_matches = db[RESUME_RESULT_COLLECTION].count_documents(
        {"fit_category": "Poor Match"}
    )
    
    return {
        "total_resumes": total_resumes,
        "total_jds": total_jds,
        "total_matches": total_matches,
        "avg_match_score": round(avg_match_score, 2),
        "excellent_matches": excellent_matches,
        "good_matches": good_matches,
        "average_matches": average_matches,
        "poor_matches": poor_matches
    }

def get_jd_stats(db: Database, jd_id: str) -> dict:
    """Get statistics for a specific JD"""
    total_candidates = db[RESUME_RESULT_COLLECTION].count_documents({"jd_id": jd_id})
    
    # Average and best match score
    pipeline = [
        {"$match": {"jd_id": jd_id}},
        {"$group": {
            "_id": None,
            "avg_score": {"$avg": "$match_score"},
            "max_score": {"$max": "$match_score"}
        }}
    ]
    stats = list(db[RESUME_RESULT_COLLECTION].aggregate(pipeline))
    avg_score = stats[0]["avg_score"] if stats else 0
    best_score = stats[0]["max_score"] if stats else 0
    
    # Candidates by category
    categories = {}
    for category in ["Excellent Match", "Good Match", "Average Match", "Poor Match"]:
        count = db[RESUME_RESULT_COLLECTION].count_documents({
            "jd_id": jd_id,
            "fit_category": category
        })
        categories[category] = count
    
    return {
        "total_candidates": total_candidates,
        "avg_match_score": round(avg_score, 2),
        "best_match_score": round(best_score, 2),
        "candidates_by_category": categories
    }

# ---------------------- WORKFLOW EXECUTION OPERATIONS ----------------------

def create_workflow_execution(db: Database, workflow_data: dict) -> str:
    """Create a new workflow execution record"""
    workflow_data["createdAt"] = datetime.utcnow()
    workflow_data["updatedAt"] = datetime.utcnow()
    result = db[WORKFLOW_EXECUTION_COLLECTION].insert_one(workflow_data)
    return str(result.inserted_id)

def get_workflow_by_id(db: Database, workflow_id: str) -> Optional[dict]:
    """Get workflow by workflow_id (custom string ID)"""
    workflow = db[WORKFLOW_EXECUTION_COLLECTION].find_one({"workflow_id": workflow_id})
    return to_dict(workflow) if workflow else None

def get_workflow_by_mongo_id(db: Database, mongo_id: str) -> Optional[dict]:
    """Get workflow by MongoDB _id"""
    oid = object_id(mongo_id)
    if not oid:
        return None
    workflow = db[WORKFLOW_EXECUTION_COLLECTION].find_one({"_id": oid})
    return to_dict(workflow) if workflow else None

def update_workflow_status(db: Database, workflow_id: str, update_data: dict) -> bool:
    """Update workflow execution status"""
    update_data["updatedAt"] = datetime.utcnow()
    result = db[WORKFLOW_EXECUTION_COLLECTION].update_one(
        {"workflow_id": workflow_id},
        {"$set": update_data}
    )
    return result.modified_count > 0

def get_user_workflows(db: Database, user_id: str, skip: int = 0, limit: int = 10) -> List[dict]:
    """Get workflows started by a user"""
    oid = object_id(user_id)
    if not oid:
        return []
    
    workflows = db[WORKFLOW_EXECUTION_COLLECTION].find(
        {"started_by": oid}
    ).sort("started_at", DESCENDING).skip(skip).limit(limit)
    
    return [to_dict(w) for w in workflows]

def get_all_workflows(db: Database, skip: int = 0, limit: int = 50, status: Optional[str] = None) -> List[dict]:
    """Get all workflow executions with optional status filter"""
    query = {}
    if status:
        query["status"] = status
    
    workflows = db[WORKFLOW_EXECUTION_COLLECTION].find(query) \
        .sort("started_at", DESCENDING) \
        .skip(skip) \
        .limit(limit)
    
    return [to_dict(w) for w in workflows]

def count_workflows(db: Database, status: Optional[str] = None) -> int:
    """Count total workflows"""
    query = {}
    if status:
        query["status"] = status
    return db[WORKFLOW_EXECUTION_COLLECTION].count_documents(query)

def delete_workflow(db: Database, workflow_id: str) -> bool:
    """Delete workflow execution"""
    result = db[WORKFLOW_EXECUTION_COLLECTION].delete_one({"workflow_id": workflow_id})
    return result.deleted_count > 0

