# HR Resume Comparator - Complete Backend Documentation

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Database Schema](#database-schema)
3. [CRUD Operations vs UI](#crud-operations-vs-ui)
4. [API Endpoints](#api-endpoints)
5. [Frontend Integration](#frontend-integration)
6. [MongoDB GridFS Storage](#mongodb-gridfs-storage)

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- MongoDB Atlas account (already configured!)

### Setup (3 commands)
```bash
cd HR_Backend_FastAPI
pip install -r requirements.txt
python main.py
```

**API Docs**: http://localhost:8000/docs

### Your MongoDB Credentials (Already Configured)
```
Connection: mongodb+srv://nikhilarjuneakshronix:12345@cluster0.wewuhac.mongodb.net/
Database: hr_resume_comparator
Status: ✅ Ready to use
```

---

## 🗄️ Database Schema

### 3 Core Collections

#### 1. **resume** Collection
```javascript
{
  _id: ObjectId("..."),
  filename: "priya_sharma_resume.pdf",
  text: "Full parsed resume text...",
  uploadedAt: ISODate("2025-11-11T10:30:00Z"),
  fileSize: 245000,
  source: "direct",
  uploadedBy: ObjectId("user_id"),
  gridFsFileId: "gridfs_file_id",
  createdAt: ISODate("2025-11-11T10:30:00Z"),
  updatedAt: ISODate("2025-11-11T10:30:00Z")
}
```

#### 2. **JobDescription** Collection
```javascript
{
  _id: "AZ-12334",  // Custom string ID
  designation: "Senior Software Engineer",
  description: "Full job description text...",
  status: "active",
  company: "TechCorp",
  location: "Bangalore",
  createdBy: ObjectId("user_id"),
  gridFsFileId: "optional_gridfs_id",
  createdAt: ISODate("2025-11-11T10:30:00Z"),
  updatedAt: ISODate("2025-11-11T10:30:00Z")
}
```

#### 3. **resume_result** Collection
```javascript
{
  _id: ObjectId("..."),
  resume_id: ObjectId("resume_id"),
  jd_id: "AZ-12334",
  match_score: 87.5,
  fit_category: "Excellent Match",
  jd_extracted: {
    position: "...",
    required_skills: ["Python", "FastAPI"],
    experience_required: {min_years: 3, max_years: 5}
  },
  resume_extracted: {
    candidate_name: "...",
    email: "...",
    skills_matched: ["Python", "FastAPI"],
    total_experience: 6.5
  },
  match_breakdown: {
    skills_match: 95,
    experience_match: 90,
    education_match: 100
  },
  selection_reason: "AI-generated recommendation...",
  timestamp: ISODate("2025-11-11T10:30:00Z"),
  confidence_score: 93.5
}
```

### 3 Supporting Collections

#### 4. **users** Collection
```javascript
{
  _id: ObjectId("..."),
  email: "hr@company.com",
  passwordHash: "$2b$12$...",
  role: "hr_manager",
  firstName: "John",
  lastName: "Doe",
  security: {
    emailVerified: false,
    lastLogin: ISODate("..."),
    failedLoginAttempts: 0
  },
  isActive: true,
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

#### 5. **audit_logs** - Security tracking
#### 6. **files** - File metadata

---

## 🔄 CRUD Operations vs UI Flow

### Frontend Flow → Backend Mapping

| UI Action | Frontend Component | Backend Endpoint | CRUD Operation | Collection |
|-----------|-------------------|------------------|----------------|------------|
| **Register** | LoginPage | `POST /auth/register` | `create_user()` | users |
| **Login** | LoginPage | `POST /auth/login` | `get_user_by_email()` | users |
| **Add JD (Manual)** | ResumeFetcher | `POST /job-descriptions/` | `create_job_description()` | JobDescription |
| **Upload JD File** | ResumeFetcher | `POST /files/upload-jd` | `create_job_description()` + GridFS | JobDescription + fs.files |
| **Select JD** | ResumeFetcher | - | - | Local state |
| **Upload Resumes** | ResumeFetcher | - | - | Local File objects |
| **Process All Resumes** | ResumeFetcher (btn) | `POST /files/upload-resume` (×N) | `create_resume()` + GridFS | resume + fs.files |
| **Start AI Process** | ResumeFetcher (btn) | `POST /matching/batch` | `create_resume_result()` | resume_result |
| **View Candidates** | CandidateList | `GET /matching/top-matches/{jd_id}` | `get_top_matches()` | resume_result |
| **View Details** | CandidateList | `GET /matching/result/{id}` | `get_result_by_id()` | resume_result |
| **Delete Resume** | ResumeFetcher | `DELETE /resumes/{id}` | `delete_resume()` | resume |
| **Delete JD** | ResumeFetcher | `DELETE /job-descriptions/{id}` | `delete_jd()` | JobDescription |
| **Analytics** | Dashboard | `GET /analytics/stats` | `get_matching_stats()` | All collections |

### Detailed CRUD Verification

#### ✅ Resume CRUD (Complete)
- **Create**: `create_resume(db, resume_data)` - Called by `/files/upload-resume`
- **Read**: `get_resume_by_id(db, id)` - Get single resume
- **Read All**: `get_all_resumes(db, skip, limit)` - List with pagination
- **Update**: `update_resume(db, id, data)` - Update resume
- **Delete**: `delete_resume(db, id)` - Delete resume
- **Search**: `search_resumes(db, query)` - Full-text search
- **Count**: `count_resumes(db)` - Total count (for 10-limit check)

#### ✅ Job Description CRUD (Complete)
- **Create**: `create_job_description(db, jd_data)` - Create JD
- **Read**: `get_jd_by_id(db, id)` - Get single JD
- **Read All**: `get_all_jds(db, skip, limit)` - List with pagination
- **Update**: `update_jd(db, id, data)` - Update JD
- **Delete**: `delete_jd(db, id)` - Delete JD
- **Search**: `search_jds(db, query)` - Full-text search
- **Count**: `count_jds(db)` - Total count

#### ✅ Resume Result CRUD (Complete)
- **Create**: `create_resume_result(db, data)` - Save match result
- **Read**: `get_result_by_id(db, id)` - Get single result
- **Read**: `get_result_by_resume_jd(db, resume_id, jd_id)` - Get specific match
- **Read All**: `get_results_by_jd(db, jd_id)` - All results for JD
- **Top Matches**: `get_top_matches(db, jd_id, limit)` - Top N matches
- **Delete**: `delete_result(db, id)` - Delete result

#### ✅ User CRUD (Complete)
- **Create**: `create_user(db, data)` - Register user
- **Read**: `get_user_by_id(db, id)` - Get by ID
- **Read**: `get_user_by_email(db, email)` - Get by email (for login)
- **Update**: `update_user(db, id, data)` - Update user
- **Update**: `update_failed_login_attempts(db, id, count)` - Security

#### ✅ Audit Log CRUD (Complete)
- **Create**: `create_audit_log(db, data)` - Log action
- **Read**: `get_audit_logs(db, filters)` - Query logs

#### ✅ File Metadata CRUD (Complete)
- **Create**: `create_file_metadata(db, data)` - Save metadata
- **Read**: `get_file_by_resume_id(db, id)` - Get file info

---

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - Register user ✅
- `POST /auth/login` - Login, get JWT token ✅
- `GET /auth/me` - Get current user ✅
- `POST /auth/logout` - Logout ✅

### Resumes
- `POST /resumes/` - Create resume (internal) ✅
- `GET /resumes/` - List resumes ✅
- `GET /resumes/{id}` - Get resume ✅
- `PUT /resumes/{id}` - Update resume ✅
- `DELETE /resumes/{id}` - Delete resume ✅
- `GET /resumes/search/text?q=query` - Search resumes ✅
- `GET /resumes/stats/count` - Count resumes ✅

### Job Descriptions
- `POST /job-descriptions/` - Create JD ✅
- `GET /job-descriptions/` - List JDs ✅
- `GET /job-descriptions/{id}` - Get JD ✅
- `PUT /job-descriptions/{id}` - Update JD ✅
- `DELETE /job-descriptions/{id}` - Delete JD ✅
- `GET /job-descriptions/search/text?q=query` - Search JDs ✅

### Files (Process Resumes)
- `POST /files/upload-resume` - Upload & parse resume (10 max) ✅
- `POST /files/upload-jd` - Upload & parse JD ✅
- `GET /files/download-resume/{id}` - Download resume from GridFS ✅
- `GET /files/download-jd/{id}` - Download JD from GridFS ✅
- `GET /files/user-stats` - Get upload stats (remaining uploads) ✅

### Matching (Start AI Process)
- `POST /matching/match` - Match single resume with JD ✅
- `POST /matching/batch` - Batch match (for "Start AI Process" button) ✅
- `GET /matching/results/{jd_id}` - Get all results for JD ✅
- `GET /matching/top-matches/{jd_id}` - Get top candidates ✅
- `GET /matching/result/{id}` - Get detailed result ✅
- `DELETE /matching/result/{id}` - Delete result ✅

### Analytics
- `GET /analytics/stats` - Overall statistics ✅
- `GET /analytics/jd-stats/{jd_id}` - JD-specific stats ✅
- `GET /analytics/dashboard` - Dashboard data ✅
- `GET /analytics/audit-logs` - Audit logs (admin) ✅

**Total: 30+ endpoints** - All CRUD operations covered!

---

## 🔗 Frontend Integration

### Step 1: Use API Service

File created: `src/services/api.ts`

```typescript
import { processResumes, login, createJobDescription } from '../services/api';
```

### Step 2: Update ResumeFetcher.tsx

Replace `handleProcessResumes` (line 211):

```typescript
const handleProcessResumes = async () => {
  setIsProcessing(true);
  
  try {
    // Get files to process
    const files = uploadedResumes
      .filter(r => r.status === 'pending')
      .map(r => r.file);
    
    // Upload to backend - it will parse and store in MongoDB
    const results = await processResumes(files);
    
    // Update UI status
    results.forEach(result => {
      if (result.success) {
        setUploadedResumes(prev => prev.map(r => 
          r.file.name === result.filename 
            ? { ...r, status: 'completed', extractedData: { name: result.filename, skills: [], experience: '' }}
            : r
        ));
      }
    });
    
    toast.success('All resumes processed and stored in MongoDB!');
  } catch (err) {
    toast.error('Error processing resumes: ' + err.message);
  } finally {
    setIsProcessing(false);
  }
};
```

### Step 3: Update LoginPage.tsx

Replace `handleSubmit` (line 17):

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const data = await login(email, password);
    onLogin();  // Success - navigate to dashboard
  } catch (err) {
    alert('Login failed: ' + err.message);
  }
};
```

### That's All!

Your UI already handles the rest. The backend will:
- Parse PDFs/DOCX when "Process All Resumes" is clicked
- Store text in MongoDB
- Store files in GridFS
- Enforce 10-resume limit

---

## 📦 MongoDB GridFS Storage

### Why GridFS?
- **10 resumes × 5MB = 50MB** total
- GridFS perfect for files < 100MB
- No external storage needed
- Free with MongoDB Atlas

### How It Works

```
User Uploads File
     ↓
Frontend sends File to Backend
     ↓
Backend extracts text (PyPDF2/python-docx)
     ↓
Store file in GridFS (fs.files + fs.chunks)
     ↓
Save resume document with:
  - text (parsed)
  - gridFsFileId (reference)
     ↓
Return resume_id to frontend
```

### GridFS Collections (Automatic)

1. **fs.files** - Metadata (filename, size, content-type)
2. **fs.chunks** - Actual file data (255KB chunks)

---

## ✅ CRUD Operations Verification

### Resume Operations

| Operation | CRUD Function | UI Trigger | HTTP Method | Endpoint |
|-----------|--------------|------------|-------------|----------|
| Upload & Parse | `create_resume()` | "Process All Resumes" btn | POST | `/files/upload-resume` |
| List All | `get_all_resumes()` | Dashboard load | GET | `/resumes/` |
| Get One | `get_resume_by_id()` | View resume details | GET | `/resumes/{id}` |
| Update | `update_resume()` | Edit resume (future) | PUT | `/resumes/{id}` |
| Delete | `delete_resume()` | Delete button | DELETE | `/resumes/{id}` |
| Search | `search_resumes()` | Search bar | GET | `/resumes/search/text` |
| Count | `count_resumes()` | Check 10-limit | - | Internal |

**Status**: ✅ All operations implemented and tested

### Job Description Operations

| Operation | CRUD Function | UI Trigger | HTTP Method | Endpoint |
|-----------|--------------|------------|-------------|----------|
| Create Manual | `create_job_description()` | "Add Job Description" btn | POST | `/job-descriptions/` |
| Upload File | `create_job_description()` | File upload → Parse | POST | `/files/upload-jd` |
| List All | `get_all_jds()` | JD list display | GET | `/job-descriptions/` |
| Get One | `get_jd_by_id()` | Select JD | GET | `/job-descriptions/{id}` |
| Update | `update_jd()` | Edit JD (future) | PUT | `/job-descriptions/{id}` |
| Delete | `delete_jd()` | Delete button | DELETE | `/job-descriptions/{id}` |
| Search | `search_jds()` | Search bar | GET | `/job-descriptions/search/text` |

**Status**: ✅ All operations implemented and tested

### Matching Operations

| Operation | CRUD Function | UI Trigger | HTTP Method | Endpoint |
|-----------|--------------|------------|-------------|----------|
| Match Single | `create_resume_result()` | Individual match | POST | `/matching/match` |
| Match Batch | `create_resume_result()` (×N) | "Start AI Process" btn | POST | `/matching/batch` |
| Get Results | `get_results_by_jd()` | View matches | GET | `/matching/results/{jd_id}` |
| Get Top | `get_top_matches()` | Candidates tab | GET | `/matching/top-matches/{jd_id}` |
| Get Detail | `get_result_by_id()` | View details | GET | `/matching/result/{id}` |
| Delete | `delete_result()` | Remove match | DELETE | `/matching/result/{id}` |

**Status**: ✅ All operations implemented and tested

### User Operations

| Operation | CRUD Function | UI Trigger | HTTP Method | Endpoint |
|-----------|--------------|------------|-------------|----------|
| Register | `create_user()` | Register form | POST | `/auth/register` |
| Login | `get_user_by_email()` + verify | Login form | POST | `/auth/login` |
| Get Current | `get_user_by_id()` | Auth check | GET | `/auth/me` |
| Update | `update_user()` | Profile edit (future) | PUT | - |

**Status**: ✅ All operations implemented

---

## 🎯 UI to Database Flow

### Flow 1: Upload & Process Resumes

```
┌─────────────────────────────────────────────────────────────┐
│                    RESUME PROCESSING FLOW                   │
└─────────────────────────────────────────────────────────────┘

1. User selects PDF files (UI)
   → Files stored in React state as File objects
   
2. User clicks "Process All Resumes" button
   → Frontend calls: processResumes(files)
   → For each file:
       POST /files/upload-resume
       ├── Backend receives file
       ├── Extracts text (PyPDF2)
       ├── Stores in GridFS (fs.put)
       ├── Saves to MongoDB resume collection
       │   {
       │     filename: "resume.pdf",
       │     text: "extracted text...",
       │     gridFsFileId: "...",
       │     uploadedBy: user_id
       │   }
       └── Returns resume_id
   
3. UI updates status to "completed"
   
4. MongoDB now has:
   ✅ resume collection (10 documents max)
   ✅ fs.files (10 file metadata)
   ✅ fs.chunks (file data)
   ✅ files collection (metadata tracking)
```

### Flow 2: Start AI Process

```
┌─────────────────────────────────────────────────────────────┐
│                    AI MATCHING FLOW                         │
└─────────────────────────────────────────────────────────────┘

1. User clicks "Start AI Process" button
   → Frontend calls: startAIMatching(resumeIds, jdId)
   → POST /matching/batch
   
2. Backend for each resume:
   ├── Get resume from MongoDB
   ├── Get JD from MongoDB
   ├── Call AI Agents (mock for now):
   │   ├── JD Reader Agent → Extract requirements
   │   ├── Resume Reader Agent → Extract candidate info
   │   └── HR Comparator Agent → Calculate scores
   ├── Save to resume_result collection
   │   {
   │     resume_id: ObjectId,
   │     jd_id: "AZ-12334",
   │     match_score: 87.5,
   │     fit_category: "Excellent Match",
   │     jd_extracted: {...},
   │     resume_extracted: {...},
   │     selection_reason: "AI recommendation..."
   │   }
   └── Returns batch status
   
3. UI navigates to "AI Workflow" tab
   
4. User views results in "Candidates" tab
   → GET /matching/top-matches/{jd_id}
   → Shows top 10 candidates sorted by match_score
```

---

## 🔐 Security & Limits

### Enforced Limits

| Limit | Value | Where Enforced | Error Message |
|-------|-------|----------------|---------------|
| Max Resumes | 10 | `/files/upload-resume` | "Maximum 10 resumes allowed" |
| File Size | 5MB | `/files/upload-resume` | "File too large. Maximum size: 5MB" |
| File Types | PDF, DOC, DOCX, TXT | `/files/upload-resume` | "File type not allowed" |
| Auth Required | All endpoints | JWT middleware | "Could not validate credentials" |

### Security Features

- ✅ JWT tokens (24hr expiry)
- ✅ bcrypt password hashing (cost 12)
- ✅ Role-based access control
- ✅ Audit logging (all sensitive ops)
- ✅ File validation (type, size)
- ✅ SHA-256 checksums
- ✅ Failed login tracking

---

## 🧪 Testing

### 1. Test MongoDB Connection
```bash
python test_connection.py
```

Expected output:
```
✅ MongoDB connection successful!
✅ GridFS storage initialized successfully!
✅ Database initialized successfully!
```

### 2. Start API Server
```bash
python main.py
```

Output:
```
🚀 Starting HR Resume Comparator API...
✅ MongoDB connection successful!
Database initialization complete!
INFO: Uvicorn running on http://0.0.0.0:8000
```

### 3. Test with Swagger UI

Open: http://localhost:8000/docs

**Test Flow:**
1. Register user: POST `/auth/register`
2. Login: POST `/auth/login` → Get JWT token
3. Click "Authorize" → Enter `Bearer YOUR_TOKEN`
4. Upload resume: POST `/files/upload-resume`
5. Create JD: POST `/job-descriptions/`
6. Match: POST `/matching/match`
7. View results: GET `/matching/top-matches/{jd_id}`

### 4. Test 10-Resume Limit

```bash
# Upload 10 resumes - should work
# Try 11th - should fail with:
{
  "detail": "Maximum 10 resumes allowed. Please delete old resumes to upload new ones."
}
```

---

## 📊 Database Verification Queries

### Check Data After Upload

```javascript
// Connect to MongoDB
use hr_resume_comparator

// 1. Check resumes
db.resume.find().count()  // Should be ≤ 10
db.resume.find().pretty()

// 2. Check GridFS files
db.fs.files.find().count()  // Should match resume count
db.fs.files.find().pretty()

// 3. Check job descriptions
db.JobDescription.find().pretty()

// 4. Check match results
db.resume_result.find().pretty()

// 5. Check users
db.users.find({}, {passwordHash: 0}).pretty()  // Hide password

// 6. Get top matches for a JD
db.resume_result.find({jd_id: "AZ-12334"})
  .sort({match_score: -1})
  .limit(10)
```

---

## 🚨 Important Notes

### Your MongoDB Atlas Setup
- ✅ Connection string configured in `.env`
- ✅ Database: `hr_resume_comparator`
- ✅ Collections will be auto-created on first use
- ✅ Indexes created automatically via `init_db()`

### File Storage
- Files stored in **MongoDB GridFS** (not Azure!)
- Max 10 resumes per user
- Max 5MB per file
- Total: 50MB storage per user
- Works with MongoDB Atlas FREE tier (512MB)

### No React Changes Needed (Except 2 Functions)
Your UI already has everything:
- ✅ 10-resume limit UI
- ✅ Upload buttons
- ✅ Process buttons  
- ✅ Status tracking
- ✅ Toast notifications

Just import `api.ts` and call backend in 2 places!

---

## 📁 Complete File List

### Backend (HR_Backend_FastAPI/)
```
├── main.py                    # FastAPI app entry
├── database.py                # MongoDB + GridFS connection
├── models.py                  # Pydantic models
├── schemas.py                 # API schemas
├── crud.py                    # All CRUD operations ✅
├── gridfs_storage.py          # GridFS utilities
├── azure_storage.py           # Placeholder (not used)
├── requirements.txt           # Dependencies
├── .env                       # Your MongoDB credentials ✅
├── test_connection.py         # Connection tester
├── README.md                  # Basic readme
└── routers/
    ├── auth.py                # Authentication endpoints
    ├── resumes.py             # Resume CRUD
    ├── job_descriptions.py    # JD CRUD
    ├── matching.py            # AI matching
    ├── files.py               # File upload/download
    └── analytics.py           # Statistics
```

### Frontend Integration (src/)
```
└── services/
    ├── api.ts                 # Backend API service ✅
    └── INTEGRATION_GUIDE.txt  # How to integrate
```

### Documentation
```
├── DATABASE_SCHEMA_README.md  # Complete schema (updated)
├── WHAT_WAS_DONE.txt         # Summary
└── START_HERE.txt            # Setup instructions
```

---

## 🎉 Summary

### ✅ What's Complete

**Backend:**
- MongoDB connection with your credentials
- GridFS file storage (no Azure!)
- 30+ API endpoints
- All CRUD operations matching UI flow
- JWT authentication
- 10-resume limit enforcement
- File parsing (PDF, DOCX, TXT)
- AI matching endpoints (mock, ready for OpenAI)

**Frontend:**
- API service created (`api.ts`)
- Integration guide provided
- Only 2 functions need updating

**Database:**
- 6 collections designed
- Indexes created automatically
- GridFS configured
- Sample queries provided

### 🚀 Next Steps

1. **Start Backend**: `python main.py`
2. **Test**: http://localhost:8000/docs
3. **Integrate**: Update 2 functions in React
4. **Test End-to-End**: Upload → Process → Match → View

---

## 📞 Quick Reference

| Task | Command |
|------|---------|
| Test connection | `python test_connection.py` |
| Start backend | `python main.py` |
| API docs | http://localhost:8000/docs |
| Health check | http://localhost:8000/health |
| MongoDB URL | mongodb+srv://...@cluster0.wewuhac.mongodb.net/ |

---

**Document Version**: Final  
**Date**: November 11, 2025  
**MongoDB**: ✅ Connected  
**Storage**: GridFS (no Azure)  
**Status**: ✅ Ready to Use

