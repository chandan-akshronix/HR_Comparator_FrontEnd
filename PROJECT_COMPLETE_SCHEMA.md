# 📐 HR Resume Comparator - Complete Project Schema

## 🏗️ Project Architecture Overview

```
HR_Comparator_FrontEnd/
├── Frontend (React + Vite + TypeScript)
├── Backend (FastAPI + Python)
└── Database (MongoDB + GridFS)
```

---

## 📂 Project Structure

```
D:\resume_files_11-11-25\HR_Comparator_FrontEnd\
│
├── 📁 src/ (Frontend)
│   ├── 📁 components/
│   │   ├── AIWorkflow.tsx           # AI agent workflow visualization
│   │   ├── CandidateList.tsx        # Candidate results list
│   │   ├── Dashboard.tsx            # Main dashboard
│   │   ├── DashboardOverview.tsx    # Dashboard overview
│   │   ├── HomePage.tsx             # Landing page
│   │   ├── JobDescriptionUpload.tsx # JD upload component
│   │   ├── LoginPage.tsx            # Authentication page
│   │   ├── ResumeFetcher.tsx        # Resume upload & management
│   │   ├── mockData.ts              # Mock data for testing
│   │   └── 📁 ui/                   # Shadcn UI components
│   │       ├── accordion.tsx
│   │       ├── alert.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── progress.tsx
│   │       ├── select.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       └── ... (30+ UI components)
│   │
│   ├── 📁 services/
│   │   └── api.ts                   # API service layer
│   │
│   ├── 📁 styles/
│   │   └── globals.css              # Global styles
│   │
│   ├── App.tsx                      # Main app component
│   ├── main.tsx                     # Entry point
│   ├── index.css                    # Base styles
│   └── config.ts                    # Configuration
│
├── 📁 HR_Backend_FastAPI/ (Backend)
│   ├── 📁 routers/
│   │   ├── __init__.py
│   │   ├── analytics.py             # Analytics endpoints
│   │   ├── audit.py                 # Audit log endpoints
│   │   ├── auth.py                  # Authentication endpoints
│   │   ├── files.py                 # File upload/download
│   │   ├── job_descriptions.py      # JD management
│   │   ├── matching.py              # Resume-JD matching
│   │   ├── resumes.py               # Resume management
│   │   └── workflow.py              # AI workflow status
│   │
│   ├── main.py                      # FastAPI app entry
│   ├── database.py                  # MongoDB connection
│   ├── models.py                    # Pydantic models
│   ├── schemas.py                   # API schemas
│   ├── crud.py                      # Database operations
│   ├── gridfs_storage.py            # File storage (GridFS)
│   ├── azure_storage.py             # Azure storage (optional)
│   ├── requirements.txt             # Python dependencies
│   │
│   └── 📁 Documentation/
│       ├── README.md
│       ├── COMPLETE_BACKEND_GUIDE.md
│       ├── AI_AGENT_INTEGRATION.md
│       └── QUICK_COMMANDS.txt
│
├── 📁 Public/
│   └── index.html
│
├── 📁 Node_modules/
├── package.json                     # Frontend dependencies
├── package-lock.json
├── vite.config.ts                   # Vite configuration
├── tsconfig.json                    # TypeScript config
├── .gitignore
└── README.md

```

---

## 🗄️ Database Schema (MongoDB)

### **Database:** `hr_resume_comparator`

### **Collections Overview:**

```
hr_resume_comparator (Database)
│
├── 📊 resume                    # Resume documents (Max: 10)
├── 📊 JobDescription            # Job description documents (Unlimited)
├── 📊 resume_result             # Matching results (Unlimited)
├── 📊 users                     # User accounts (Unlimited)
├── 📊 audit_logs                # Activity logs (Unlimited)
├── 📊 files                     # File metadata (Unlimited)
└── 📊 fs.files / fs.chunks      # GridFS file storage (Max: 50MB)
```

---

## 📐 Complete Database Schema Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     hr_resume_comparator Database                    │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│       users          │
├──────────────────────┤
│ _id: ObjectId PK     │───┐
│ email: String (U)    │   │
│ passwordHash: String │   │
│ role: String         │   │
│ firstName: String    │   │
│ lastName: String     │   │
│ company: String?     │   │
│ security: Object     │   │
│ isActive: Boolean    │   │
│ createdAt: Date      │   │
│ updatedAt: Date      │   │
└──────────────────────┘   │
                            │
        ┌───────────────────┼───────────────────┬────────────────────┐
        ↓                   ↓                   ↓                    ↓
┌──────────────────────┐ ┌──────────────────┐ ┌─────────────────┐ ┌──────────────┐
│      resume          │ │  JobDescription  │ │  audit_logs     │ │    files     │
├──────────────────────┤ ├──────────────────┤ ├─────────────────┤ ├──────────────┤
│ _id: ObjectId PK     │ │ _id: String PK   │ │ _id: ObjectId PK│ │_id: ObjId PK │
│ filename: String     │ │ designation: Str │ │ userId: ObjId FK│─┘uploadedBy FK│
│ text: String (FT)    │ │ description: Str │ │ action: String  │ │resumeId: FK? │
│ uploadedAt: Date     │ │ createdAt: Date  │ │ resourceType: S │ │jdId: FK?     │
│ fileSize: Number     │ │ updatedAt: Date  │ │ resourceId: Str │ │originalName  │
│ source: String       │ │ status: String   │ │ ipAddress: Str  │ │storagePath   │
│ uploadedBy: ObjId FK │─┘company: String? │ │ userAgent: Str  │ │fileSize: Num │
│ createdAt: Date      │ │ location: String?│ │ timestamp: Date │ │mimeType: Str │
│ updatedAt: Date      │ │ createdBy: FK    │─┘success: Bool   │ │checksum: Str │
│ gridFsFileId: ObjId  │─┐gridFsFileId: Obj│─┐errorMessage: S?│ │security: Obj │
└──────────────────────┘ │└──────────────────┘ │└─────────────────┘ │uploadedBy FK │
        │                │                     │                    │uploadedAt:Dt │
        │                │                     │                    │expiresAt:Dt? │
        ↓                ↓                     │                    └──────────────┘
┌──────────────────────────────┐              │
│      resume_result           │              │
├──────────────────────────────┤              │
│ _id: ObjectId PK             │              │
│ resume_id: ObjectId FK       │──────────────┘
│ jd_id: String FK             │──────────────┐
│ match_score: Float           │              │
│ fit_category: String         │              │
│ jd_extracted: Object         │              │
│   ├─ position                │              │
│   ├─ experience_required     │              │
│   ├─ required_skills         │              │
│   ├─ preferred_skills        │              │
│   ├─ education               │              │
│   └─ responsibilities        │              │
│ resume_extracted: Object     │              │
│   ├─ candidate_name          │              │
│   ├─ email                   │              │
│   ├─ phone                   │              │
│   ├─ current_position        │              │
│   ├─ total_experience        │              │
│   ├─ skills_matched          │              │
│   ├─ education               │              │
│   └─ work_history            │              │
│ match_breakdown: Object      │              │
│   ├─ skills_match            │              │
│   ├─ experience_match        │              │
│   ├─ education_match         │              │
│   ├─ location_match          │              │
│   └─ overall_compatibility   │              │
│ selection_reason: String     │              │
│ timestamp: Date              │              │
│ agent_version: String?       │              │
│ processing_duration_ms: Num? │              │
│ confidence_score: Float?     │              │
└──────────────────────────────┘              │
        ↑                                     │
        └─────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    GridFS Collections                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐      ┌────────────────────────┐  │
│  │     fs.files         │      │      fs.chunks         │  │
│  ├──────────────────────┤      ├────────────────────────┤  │
│  │ _id: ObjectId PK     │──┐   │ _id: ObjectId PK       │  │
│  │ length: Number       │  │   │ files_id: ObjectId FK  │──┘
│  │ chunkSize: Number    │  │   │ n: Number (chunk #)    │
│  │ uploadDate: Date     │  │   │ data: Binary           │
│  │ filename: String     │  │   └────────────────────────┘
│  │ metadata: Object     │  │
│  │   ├─ uploaded_by     │  │
│  │   ├─ original_name   │  │
│  │   ├─ checksum        │  │
│  │   └─ source          │  │
│  └──────────────────────┘  │
│                            │
└────────────────────────────┘

Legend:
PK  = Primary Key
FK  = Foreign Key
U   = Unique Index
FT  = Full-Text Search Index
?   = Optional/Nullable
Str = String
Obj = Object
ObjId = ObjectId
Num = Number
Dt  = Date
Bool = Boolean
```

---

## 📋 Detailed Collection Schemas

### **1. resume Collection**

**Purpose:** Store resume documents with extracted text and metadata  
**Limit:** 10 maximum documents  
**Storage:** Text + GridFS reference

```javascript
{
  _id: ObjectId("..."),              // MongoDB ID
  filename: "john_doe_resume.pdf",   // Original filename
  text: "Full resume text...",       // Extracted text
  uploadedAt: ISODate("2025-11-12"), // Upload timestamp
  fileSize: 1048576,                 // File size in bytes
  source: "direct",                  // Source (direct/LinkedIn/Indeed)
  uploadedBy: ObjectId("..."),       // User ID reference
  createdAt: ISODate("2025-11-12"),
  updatedAt: ISODate("2025-11-12"),
  gridFsFileId: ObjectId("...")      // GridFS file reference
}
```

**Indexes:**
```javascript
db.resume.createIndex({ filename: 1 })
db.resume.createIndex({ uploadedAt: -1 })
db.resume.createIndex({ text: "text" })  // Full-text search
```

**Constraints:**
- Maximum 10 documents allowed (enforced in API)
- `uploadedBy` must reference valid user

**Sample Query:**
```javascript
// Find all resumes uploaded by a user
db.resume.find({ uploadedBy: ObjectId("...") })

// Full-text search in resumes
db.resume.find({ $text: { $search: "Python developer" } })

// Get recent resumes
db.resume.find().sort({ uploadedAt: -1 }).limit(10)
```

---

### **2. JobDescription Collection**

**Purpose:** Store job description documents  
**Limit:** Unlimited  
**Storage:** Text + GridFS reference

```javascript
{
  _id: "JD-1731427200000",           // Custom string ID
  designation: "Senior Software Engineer", // Job title
  description: "Full JD text...",    // Job description
  createdAt: ISODate("2025-11-12"),
  updatedAt: ISODate("2025-11-12"),
  status: "active",                  // active/closed/draft
  company: "Tech Corp",              // Optional
  location: "Remote",                // Optional
  createdBy: ObjectId("..."),        // User ID reference
  gridFsFileId: ObjectId("...")      // GridFS file reference
}
```

**Indexes:**
```javascript
db.JobDescription.createIndex({ designation: 1 })
db.JobDescription.createIndex({ status: 1 })
db.JobDescription.createIndex({ description: "text" })  // Full-text search
```

**Constraints:**
- `_id` is custom string (not ObjectId)
- `createdBy` must reference valid user

**Sample Query:**
```javascript
// Find active job descriptions
db.JobDescription.find({ status: "active" })

// Search job descriptions
db.JobDescription.find({ $text: { $search: "software engineer" } })

// Get JD by custom ID
db.JobDescription.findOne({ _id: "JD-1731427200000" })
```

---

### **3. resume_result Collection**

**Purpose:** Store matching results between resumes and job descriptions  
**Limit:** Unlimited  
**Relationships:** Links resume and JobDescription

```javascript
{
  _id: ObjectId("..."),
  resume_id: ObjectId("..."),        // Resume reference
  jd_id: "JD-1731427200000",        // JD reference
  match_score: 85.5,                 // 0-100 score
  fit_category: "Excellent Match",   // Category
  
  jd_extracted: {                    // Extracted JD data
    position: "Software Engineer",
    experience_required: {
      min_years: 3,
      max_years: 5,
      type: "Software Development"
    },
    required_skills: ["Python", "FastAPI"],
    preferred_skills: ["AWS", "Docker"],
    education: "Bachelor's in CS",
    location: "Remote",
    job_type: "Full-time",
    responsibilities: ["Develop APIs", "Write tests"]
  },
  
  resume_extracted: {                // Extracted resume data
    candidate_name: "John Doe",
    email: "john@example.com",
    phone: "+1-234-567-8900",
    location: "San Francisco, CA",
    current_position: "Senior Developer",
    total_experience: 5.0,
    relevant_experience: 4.5,
    skills_matched: ["Python", "FastAPI"],
    skills_missing: [],
    education: {
      degree: "B.S. Computer Science",
      institution: "Stanford",
      year: 2018,
      grade: "3.8/4.0"
    },
    certifications: ["AWS Certified"],
    work_history: [...],
    key_achievements: [...]
  },
  
  match_breakdown: {                 // Detailed scoring
    skills_match: 95.0,
    experience_match: 90.0,
    education_match: 100.0,
    location_match: 85.0,
    cultural_fit: 80.0,
    overall_compatibility: 85.5
  },
  
  selection_reason: "HIGHLY RECOMMENDED...", // AI recommendation
  timestamp: ISODate("2025-11-12"),
  agent_version: "v1.0.0",
  processing_duration_ms: 2500,
  confidence_score: 92.0
}
```

**Indexes:**
```javascript
db.resume_result.createIndex({ resume_id: 1, jd_id: 1 }, { unique: true })
db.resume_result.createIndex({ match_score: -1 })
db.resume_result.createIndex({ fit_category: 1 })
db.resume_result.createIndex({ timestamp: -1 })
db.resume_result.createIndex({ jd_id: 1, match_score: -1 })
```

**Constraints:**
- `resume_id` must reference valid resume
- `jd_id` must reference valid JobDescription
- `match_score` must be 0-100
- One result per resume-JD pair (unique compound index)

**Sample Query:**
```javascript
// Get all matches for a JD, sorted by score
db.resume_result.find({ jd_id: "JD-123" }).sort({ match_score: -1 })

// Get top 10 matches for a JD
db.resume_result.find({ jd_id: "JD-123" })
  .sort({ match_score: -1 })
  .limit(10)

// Find excellent matches
db.resume_result.find({ 
  jd_id: "JD-123", 
  fit_category: "Excellent Match" 
})

// Check if match exists
db.resume_result.findOne({ 
  resume_id: ObjectId("..."), 
  jd_id: "JD-123" 
})
```

---

### **4. users Collection**

**Purpose:** Store user account information and authentication  
**Limit:** Unlimited  
**Security:** Passwords are bcrypt hashed

```javascript
{
  _id: ObjectId("..."),
  email: "hr@company.com",
  passwordHash: "$2b$12$...",        // Bcrypt hash
  role: "hr_manager",                // admin/hr_manager/recruiter
  firstName: "HR",
  lastName: "Manager",
  company: "Tech Corp",              // Optional
  security: {
    emailVerified: false,
    lastLogin: ISODate("2025-11-12"),
    failedLoginAttempts: 0,
    accountLockedUntil: null
  },
  isActive: true,
  createdAt: ISODate("2025-11-12"),
  updatedAt: ISODate("2025-11-12")
}
```

**Indexes:**
```javascript
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ role: 1 })
```

**Constraints:**
- `email` must be unique
- `passwordHash` must be bcrypt hashed
- `role` must be one of: admin, hr_manager, recruiter

**Sample Query:**
```javascript
// Find user by email
db.users.findOne({ email: "hr@company.com" })

// Get all active HR managers
db.users.find({ role: "hr_manager", isActive: true })

// Find locked accounts
db.users.find({ "security.accountLockedUntil": { $gt: new Date() } })
```

---

### **5. audit_logs Collection**

**Purpose:** Track all user actions and system events  
**Limit:** Unlimited  
**Retention:** Keep indefinitely (can add TTL index)

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),           // User reference
  action: "upload_resume",           // Action type
  resourceType: "resume",            // Resource type
  resourceId: "...",                 // Resource ID
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
  timestamp: ISODate("2025-11-12"),
  success: true,
  errorMessage: null                 // If failed
}
```

**Indexes:**
```javascript
db.audit_logs.createIndex({ userId: 1, timestamp: -1 })
db.audit_logs.createIndex({ action: 1, timestamp: -1 })
db.audit_logs.createIndex({ resourceId: 1 })
```

**Constraints:**
- `userId` must reference valid user
- `action` should be one of predefined actions

**Sample Query:**
```javascript
// Get user activity logs
db.audit_logs.find({ userId: ObjectId("...") })
  .sort({ timestamp: -1 })
  .limit(50)

// Get all resume uploads
db.audit_logs.find({ action: "upload_resume" })

// Get failed actions
db.audit_logs.find({ success: false })

// Get logs for specific resource
db.audit_logs.find({ resourceId: "resume_id_123" })
```

**Optional: Add TTL Index for Auto-Cleanup**
```javascript
// Delete logs older than 90 days
db.audit_logs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 })
```

---

### **6. files Collection (File Metadata)**

**Purpose:** Store metadata about uploaded files  
**Limit:** Unlimited  
**References:** Links to GridFS and resume/JD collections

```javascript
{
  _id: ObjectId("..."),
  resumeId: ObjectId("..."),         // Resume reference (if resume)
  jdId: "JD-123",                    // JD reference (if JD)
  originalName: "resume.pdf",
  storagePath: "gridfs://...",       // Storage location
  fileSize: 1048576,
  mimeType: "application/pdf",
  checksum: "abc123...",             // SHA-256 hash
  security: {
    virusScanStatus: "clean",        // pending/clean/infected/error
    virusScanDate: ISODate("..."),
    encrypted: false
  },
  uploadedBy: ObjectId("..."),
  uploadedAt: ISODate("2025-11-12"),
  expiresAt: null,                   // Optional expiry
  storageType: "gridfs"
}
```

**Indexes:**
```javascript
db.files.createIndex({ resumeId: 1 })
db.files.createIndex({ checksum: 1 })
db.files.createIndex({ "security.virusScanStatus": 1 })
```

**Constraints:**
- Either `resumeId` OR `jdId` must be set (not both)
- `uploadedBy` must reference valid user

**Sample Query:**
```javascript
// Get file metadata for a resume
db.files.findOne({ resumeId: ObjectId("...") })

// Find files pending virus scan
db.files.find({ "security.virusScanStatus": "pending" })

// Find duplicate files by checksum
db.files.find({ checksum: "abc123..." })

// Find files uploaded by user
db.files.find({ uploadedBy: ObjectId("...") })
```

---

### **7. fs.files / fs.chunks (GridFS)**

**Purpose:** Store actual file content in chunks  
**Limit:** 50 MB total (10 resumes × 5MB each)  
**Chunk Size:** 255 KB per chunk

**fs.files:**
```javascript
{
  _id: ObjectId("..."),
  length: 1048576,                   // File size
  chunkSize: 261120,                 // Chunk size (255KB)
  uploadDate: ISODate("2025-11-12"),
  filename: "resume.pdf",
  metadata: {                        // Custom metadata
    uploaded_by: "user_id",
    original_name: "resume.pdf",
    checksum: "abc123...",
    source: "direct"
  }
}
```

**fs.chunks:**
```javascript
{
  _id: ObjectId("..."),
  files_id: ObjectId("..."),         // Reference to fs.files
  n: 0,                              // Chunk number (0, 1, 2, ...)
  data: Binary("...")                // Actual file data (255KB max)
}
```

**Indexes:**
```javascript
// Automatically created by GridFS
db.fs.files.createIndex({ filename: 1, uploadDate: 1 })
db.fs.chunks.createIndex({ files_id: 1, n: 1 }, { unique: true })
```

**Sample Query:**
```javascript
// Find file by ID
db.fs.files.findOne({ _id: ObjectId("...") })

// Get all chunks for a file (ordered)
db.fs.chunks.find({ files_id: ObjectId("...") }).sort({ n: 1 })

// Calculate total storage used
db.fs.files.aggregate([
  { $group: { _id: null, total: { $sum: "$length" } } }
])

// Find large files (>2MB)
db.fs.files.find({ length: { $gt: 2097152 } })
```

**GridFS Usage:**
```javascript
// Upload file
const fs = GridFS(db);
const uploadStream = fs.openUploadStream("resume.pdf", {
  metadata: { uploaded_by: "user_id", checksum: "abc123" }
});

// Download file
const downloadStream = fs.openDownloadStream(ObjectId("..."));
```

---

## 📊 Database Relationships & Foreign Keys

```
users._id (PK)
  ↓
  ├─→ resume.uploadedBy (FK)
  ├─→ JobDescription.createdBy (FK)
  ├─→ audit_logs.userId (FK)
  └─→ files.uploadedBy (FK)

resume._id (PK)
  ↓
  ├─→ resume_result.resume_id (FK)
  ├─→ files.resumeId (FK)
  └─→ resume.gridFsFileId → fs.files._id (FK)

JobDescription._id (PK - String)
  ↓
  ├─→ resume_result.jd_id (FK)
  ├─→ files.jdId (FK)
  └─→ JobDescription.gridFsFileId → fs.files._id (FK)

fs.files._id (PK)
  ↓
  ├─→ fs.chunks.files_id (FK)
  ├─→ resume.gridFsFileId (FK)
  └─→ JobDescription.gridFsFileId (FK)
```

---

## 🔐 Database Constraints & Validation

### **Application-Level Constraints:**

```yaml
resume:
  - Max 10 documents (enforced in API)
  - fileSize <= 5242880 bytes (5MB)
  - source: enum ['direct', 'LinkedIn', 'Indeed', 'Naukri.com']
  - uploadedBy: must exist in users collection

JobDescription:
  - _id: must start with 'JD-'
  - status: enum ['active', 'closed', 'draft']
  - createdBy: must exist in users collection

resume_result:
  - match_score: 0 <= score <= 100
  - fit_category: enum ['Excellent Match', 'Good Match', 'Average Match', 'Poor Match']
  - resume_id: must exist in resume collection
  - jd_id: must exist in JobDescription collection
  - Unique pair: (resume_id, jd_id)

users:
  - email: valid email format, unique
  - passwordHash: bcrypt format ($2b$...)
  - role: enum ['admin', 'hr_manager', 'recruiter']
  - security.failedLoginAttempts: 0 <= attempts <= max

audit_logs:
  - action: enum [predefined actions]
  - success: boolean
  - userId: must exist in users collection

files:
  - Either resumeId OR jdId (not both)
  - security.virusScanStatus: enum ['pending', 'clean', 'infected', 'error']
  - uploadedBy: must exist in users collection
```

---

## 📈 Database Statistics & Sizes

### **Typical Collection Sizes:**

```yaml
Collection Sizes (Example with 10 resumes, 5 JDs):

resume:
  Documents: 10
  Size: ~50 KB (text + metadata)
  Index Size: ~15 KB

JobDescription:
  Documents: 5
  Size: ~25 KB (text + metadata)
  Index Size: ~10 KB

resume_result:
  Documents: 50 (10 resumes × 5 JDs)
  Size: ~250 KB (detailed JSON objects)
  Index Size: ~30 KB

users:
  Documents: 1-100
  Size: ~2 KB per user
  Index Size: ~5 KB

audit_logs:
  Documents: 100-10000+
  Size: ~500 bytes per log
  Index Size: ~50 KB

files:
  Documents: 15 (10 resumes + 5 JDs)
  Size: ~15 KB (metadata only)
  Index Size: ~10 KB

fs.files:
  Documents: 15
  Size: ~15 KB (file metadata)
  Index Size: ~5 KB

fs.chunks:
  Documents: ~200 (depends on file sizes)
  Size: ~50 MB (actual file data)
  Index Size: ~20 KB

Total Database Size: ~50-100 MB
```

---

## 🔧 Database Maintenance Scripts

### **Check Database Size:**
```javascript
// Get size of each collection
db.getCollectionNames().forEach(function(collection) {
    var stats = db[collection].stats();
    print(collection + ": " + (stats.size / 1024 / 1024).toFixed(2) + " MB");
});
```

### **Count Documents:**
```javascript
print("Resumes: " + db.resume.countDocuments());
print("JDs: " + db.JobDescription.countDocuments());
print("Matches: " + db.resume_result.countDocuments());
print("Users: " + db.users.countDocuments());
print("Audit Logs: " + db.audit_logs.countDocuments());
```

### **Check Storage Usage:**
```javascript
// Total GridFS storage
db.fs.files.aggregate([
    { $group: { _id: null, 
        totalSize: { $sum: "$length" },
        count: { $sum: 1 }
    }}
]);
```

### **Find Orphaned Records:**
```javascript
// Find resume_results with invalid resume_id
db.resume_result.find({
    resume_id: { 
        $nin: db.resume.distinct("_id") 
    }
});

// Find files without corresponding resume/JD
db.files.find({
    $and: [
        { resumeId: { $exists: false } },
        { jdId: { $exists: false } }
    ]
});
```

### **Clean Up Old Audit Logs:**
```javascript
// Delete logs older than 90 days
db.audit_logs.deleteMany({
    timestamp: { 
        $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) 
    }
});
```

---

## 🔌 API Endpoints Schema

### **Base URL:** `http://localhost:8000`

---

### **Authentication Endpoints** (`/auth`)

```
POST   /auth/register          Register new user
POST   /auth/login             Login user
POST   /auth/logout            Logout user
GET    /auth/me                Get current user
```

---

### **Resume Endpoints** (`/resumes`)

```
POST   /resumes/               Create resume (manual)
GET    /resumes/               List all resumes (paginated)
GET    /resumes/{id}           Get resume by ID
PUT    /resumes/{id}           Update resume
DELETE /resumes/{id}           Delete resume
GET    /resumes/search/text    Search resumes (full-text)
GET    /resumes/stats/count    Get resume count
```

---

### **Job Description Endpoints** (`/job-descriptions`)

```
POST   /job-descriptions/              Create JD
GET    /job-descriptions/              List all JDs
GET    /job-descriptions/{id}          Get JD by ID
PUT    /job-descriptions/{id}          Update JD
DELETE /job-descriptions/{id}          Delete JD
GET    /job-descriptions/search/text   Search JDs
GET    /job-descriptions/stats/count   Get JD count
```

---

### **File Upload Endpoints** (`/files`)

```
POST   /files/upload-resume         Upload resume file
POST   /files/upload-jd             Upload JD file
PUT    /files/update-jd/{id}        Update JD file
GET    /files/download-resume/{id}  Download resume
GET    /files/download-jd/{id}      Download JD
GET    /files/user-stats            Get usage statistics
GET    /files/storage-stats         Get storage stats (admin)
```

---

### **Matching Endpoints** (`/matching`)

```
POST   /matching/match              Match single resume with JD
POST   /matching/batch              Batch match resumes
GET    /matching/results/{jd_id}    Get results for JD
GET    /matching/top-matches/{jd_id} Get top matches
GET    /matching/result/{id}        Get specific result
DELETE /matching/result/{id}        Delete result
```

---

### **Workflow Endpoints** (`/workflow`)

```
GET    /workflow/status             Get AI workflow status
```

---

### **Analytics Endpoints** (`/analytics`)

```
GET    /analytics/overview          Get analytics overview
GET    /analytics/jd-stats/{id}     Get JD statistics
GET    /analytics/top-skills        Get top skills analysis
```

---

### **Audit Endpoints** (`/audit`)

```
GET    /audit/logs                  Get audit logs
GET    /audit/user-activity/{id}    Get user activity
GET    /audit/export                Export audit logs
```

---

## 🧩 Component Architecture (Frontend)

```
App.tsx
├── LoginPage.tsx (Authentication)
│   └── API: POST /auth/login
│
└── Dashboard.tsx (Main Container)
    ├── Tab: Dashboard
    │   └── DashboardOverview.tsx
    │       ├── Stats Cards
    │       ├── Recent Activity
    │       └── Quick Actions
    │
    ├── Tab: Fetch Resumes
    │   └── ResumeFetcher.tsx
    │       ├── Job Description Upload
    │       │   ├── Manual Input
    │       │   └── File Upload
    │       │       └── API: POST /files/upload-jd
    │       │
    │       ├── Resume Upload
    │       │   ├── File Upload
    │       │   │   └── API: POST /files/upload-resume
    │       │   └── Resume List
    │       │       └── API: GET /resumes/
    │       │
    │       └── Start AI Workflow
    │           └── API: POST /matching/batch
    │
    ├── Tab: AI Workflow
    │   └── AIWorkflow.tsx
    │       ├── Workflow History Dropdown
    │       │   └── LocalStorage: workflowHistory
    │       │
    │       ├── AI Agent Execution Pipeline
    │       │   ├── Progress Bar
    │       │   ├── Metrics
    │       │   └── Controls
    │       │
    │       ├── Agent Flow Visualization
    │       │   ├── Agent 1: JD & Resume Extractor
    │       │   ├── Agent 2: JD Reader
    │       │   ├── Agent 3: Resume Reader
    │       │   └── Agent 4: HR Comparator
    │       │
    │       └── Detailed Agent Information
    │           └── API: GET /workflow/status
    │
    └── Tab: Candidates
        └── CandidateList.tsx
            ├── Candidate Cards
            ├── Match Scores
            ├── Filtering
            └── API: GET /matching/results/{jd_id}
```

---

## 🔄 Data Flow

### **1. User Registration & Login**

```
User Input → LoginPage.tsx
    ↓
API Call: POST /auth/login
    ↓
Backend: auth.py → validate credentials
    ↓
Database: users collection
    ↓
Response: JWT Token
    ↓
Frontend: Store token in localStorage
    ↓
Redirect to Dashboard
```

---

### **2. Upload Resume**

```
User selects file → ResumeFetcher.tsx
    ↓
API Call: POST /files/upload-resume
    ↓
Backend: files.py → validate file
    ↓
Extract text (PyPDF2/docx)
    ↓
Store in GridFS: fs.files + fs.chunks
    ↓
Create document in: resume collection
    ↓
Create metadata in: files collection
    ↓
Create audit log: audit_logs collection
    ↓
Response: resume_id
    ↓
Frontend: Update UI with new resume
```

---

### **3. Upload Job Description**

```
User selects file → ResumeFetcher.tsx
    ↓
API Call: POST /files/upload-jd
    ↓
Backend: files.py → validate file
    ↓
Extract text (PyPDF2/docx)
    ↓
Store in GridFS: fs.files + fs.chunks
    ↓
Create document in: JobDescription collection
    ↓
Create metadata in: files collection
    ↓
Response: jd_id
    ↓
Frontend: Update UI with new JD
```

---

### **4. Start AI Workflow & Matching**

```
User clicks "Start AI Workflow" → ResumeFetcher.tsx
    ↓
API Call: POST /matching/batch
    ↓
Backend: matching.py → get resume & JD
    ↓
For each resume:
    ├── Run AI matching (mock or real)
    ├── Extract JD requirements
    ├── Extract resume details
    ├── Calculate match score
    ├── Generate recommendation
    └── Save to resume_result collection
    ↓
Create audit log
    ↓
Response: Matching started
    ↓
Frontend: Navigate to AI Workflow tab
    ↓
Poll: GET /workflow/status (every 5s)
    ↓
Update agent status in real-time
```

---

### **5. View Workflow Status**

```
AI Workflow tab loads → AIWorkflow.tsx
    ↓
API Call: GET /workflow/status
    ↓
Backend: workflow.py → query database
    ├── Count resumes
    ├── Count JDs
    ├── Count matches
    ├── Get audit logs
    └── Calculate agent status
    ↓
Response: agents, metrics, progress
    ↓
Frontend: Display agent cards
    ├── Update progress bar
    ├── Show metrics
    └── Save to workflow history (localStorage)
```

---

### **6. View Candidates/Results**

```
Candidates tab loads → CandidateList.tsx
    ↓
API Call: GET /matching/results/{jd_id}
    ↓
Backend: matching.py → query resume_result
    ↓
Database: resume_result collection
    ↓
Response: List of matches with scores
    ↓
Frontend: Display candidate cards
    ├── Show match scores
    ├── Display recommendations
    └── Enable filtering/sorting
```

---

## 🛠️ Technology Stack

### **Frontend**

```yaml
Framework: React 18
Build Tool: Vite
Language: TypeScript
Styling: Tailwind CSS
UI Components: Shadcn UI
Icons: Lucide React
State Management: React Hooks
Routing: React Router (implied)
HTTP Client: Fetch API
```

### **Backend**

```yaml
Framework: FastAPI
Language: Python 3.9+
Database: MongoDB
ODM: PyMongo
File Storage: GridFS
Authentication: JWT (python-jose)
Password Hashing: bcrypt
PDF Processing: PyPDF2
DOCX Processing: python-docx
CORS: fastapi-cors
Validation: Pydantic
```

### **Database**

```yaml
Database: MongoDB
Storage: GridFS (embedded)
Connection: MongoClient (sync) + AsyncIOMotorClient (async)
```

### **Infrastructure**

```yaml
Development Server (Frontend): Vite Dev Server (Port 5173)
Development Server (Backend): Uvicorn (Port 8000)
```

---

## 📊 Data Relationships

```
users (1) ──────┬──────> (N) resumes
                │           └─> (1) files (GridFS)
                │
                ├──────> (N) JobDescription
                │           └─> (1) files (GridFS)
                │
                └──────> (N) audit_logs


resumes (N) ────┬──────> (N) resume_result
                │
JobDescription (N) ──────┘


resume_result
    ├── resume_id ──> resumes._id
    └── jd_id ──────> JobDescription._id
```

---

## 🔐 Security Features

```yaml
Authentication:
  - JWT tokens
  - Bcrypt password hashing
  - Role-based access control (admin/hr_manager/recruiter)

Authorization:
  - Token verification on protected routes
  - Role-based permissions

File Security:
  - File type validation
  - File size limits (5MB)
  - Virus scan status tracking
  - Checksum validation (SHA-256)

API Security:
  - CORS configuration
  - Request validation (Pydantic)
  - Error handling
  - Audit logging

Storage Security:
  - GridFS for secure file storage
  - Optional encryption flag
```

---

## 📏 System Limits

```yaml
Resumes:
  Max Count: 10
  Max File Size: 5 MB
  Total Storage: 50 MB
  Allowed Types: PDF, DOC, DOCX, TXT

Job Descriptions:
  Max Count: Unlimited
  Max File Size: 5 MB
  Allowed Types: PDF, DOC, DOCX, TXT

Workflow History:
  Max Stored: 10 recent workflows
  Storage: Browser localStorage

Matching Results:
  Max Count: Unlimited
  Auto-cleanup: None (manual deletion)
```

---

## 🔄 Workflow States

```yaml
Agent Statuses:
  - idle: Waiting for data
  - pending: Ready but not started
  - in-progress: Currently processing
  - completed: Finished successfully

Workflow Progress:
  - 0%: Pending (no agents started)
  - 25%: 1 of 4 agents completed
  - 50%: 2 of 4 agents completed
  - 75%: 3 of 4 agents completed
  - 100%: All agents completed

Completion Status:
  - Pending: No processing started
  - In Progress: 1-99% complete
  - Completed: 100% complete
```

---

## 📈 Performance Metrics

```yaml
Database Operations:
  - Indexed queries for fast search
  - Compound indexes for complex queries
  - Full-text search enabled

File Operations:
  - GridFS chunking (255KB chunks)
  - Streaming uploads/downloads
  - Checksum validation

API Response Times:
  - Simple queries: < 100ms
  - File uploads: Depends on size
  - Batch matching: Depends on resume count
  - Full-text search: < 500ms

Frontend:
  - Initial load: < 2s
  - Route navigation: < 100ms
  - Component rendering: < 50ms
```

---

## 🎯 Key Features Summary

```yaml
Core Features:
  ✅ User authentication & authorization
  ✅ Resume upload & parsing (PDF, DOCX, TXT)
  ✅ Job description upload & parsing
  ✅ AI-powered resume-JD matching
  ✅ Match scoring & recommendations
  ✅ Workflow visualization
  ✅ Workflow history tracking
  ✅ Candidate results viewing
  ✅ Analytics & statistics
  ✅ Audit logging
  ✅ File storage (GridFS)

Advanced Features:
  ✅ Real-time workflow status
  ✅ Progress tracking
  ✅ Full-text search
  ✅ Batch processing
  ✅ Status indicators
  ✅ Historical workflow viewing
  ✅ Role-based access control
  ✅ File metadata tracking
  ✅ Checksum validation
```

---

## 🎨 UI/UX Components

```yaml
Pages:
  - Login Page
  - Dashboard (4 tabs)
  - Not Found (404)

Layouts:
  - Full-width layout
  - Card-based layout
  - Tab navigation

Components:
  - Form inputs
  - File uploads
  - Progress bars
  - Status badges
  - Data tables
  - Cards
  - Dropdowns
  - Modals/Dialogs
  - Alerts/Toasts
  - Charts (implied)
  - Loading states
  - Error states

Interactions:
  - Drag & drop (file upload)
  - Click to expand
  - Hover effects
  - Animations
  - Real-time updates
```

---

This is the complete schema of your HR Resume Comparator project! 🎯

