# 📊 Database Storage Limits & Current Usage

## 🚨 Current Storage Limits

### **System Limits (Free Plan)**

```
┌─────────────────────────────────────────────┐
│  STORAGE LIMITS (Free Plan)                │
├─────────────────────────────────────────────┤
│  📄 Max Resumes:        10 resumes          │
│  📏 Max File Size:      5 MB per file       │
│  💾 Total Storage:      50 MB maximum       │
│  📋 Job Descriptions:   UNLIMITED           │
│  🔄 Workflow History:   10 runs (frontend)  │
└─────────────────────────────────────────────┘
```

---

## 📂 What's Limited vs Unlimited

### ✅ **LIMITED:**

| Item | Limit | Details |
|------|-------|---------|
| **Resumes** | 10 maximum | System-wide limit for all users |
| **File Size** | 5 MB per file | Applies to both resumes and JDs |
| **Total Resume Storage** | 50 MB | 10 resumes × 5MB each |
| **Workflow History (Frontend)** | 10 runs | Stored in browser localStorage |

### ♾️ **UNLIMITED:**

| Item | Limit | Details |
|------|-------|---------|
| **Job Descriptions** | No limit | Upload as many JDs as needed |
| **Matching Results** | No limit | One result per resume-JD pair |
| **Users** | No limit | Create as many accounts as needed |
| **Workflow Executions** | No limit | Run matching as many times as needed |

---

## 🔍 How to Check Current Database Usage

### **Method 1: API Endpoint (Recommended)**

**GET** `/files/user-stats`

Returns:
```json
{
  "resume_count": 7,           // Current resumes in DB
  "limit": 10,                 // Maximum allowed
  "remaining": 3,              // Uploads remaining
  "storage_used_mb": 25.5,     // MB currently used
  "storage_limit_mb": 50,      // Maximum MB allowed
  "message": "You have 3 resume uploads remaining"
}
```

**Example Request:**
```bash
curl -X GET "http://localhost:8000/files/user-stats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **Method 2: MongoDB Direct Query**

**Check Resume Count:**
```javascript
db.resume.countDocuments({})
// Returns: 7 (example)
```

**Check Job Descriptions Count:**
```javascript
db.JobDescription.countDocuments({})
// Returns: 5 (example)
```

**Check Matching Results Count:**
```javascript
db.resume_result.countDocuments({})
// Returns: 35 (7 resumes × 5 JDs)
```

**Check Total Storage Used:**
```javascript
db.fs.files.aggregate([
  { $group: { _id: null, total: { $sum: "$length" } } }
])
// Returns total bytes used
```

---

### **Method 3: Backend Python Script**

Create a file `check_usage.py`:

```python
from database import db, FREE_PLAN_RESUME_LIMIT, MAX_FILE_SIZE_MB
from crud import count_resumes, count_jds
from gridfs_storage import get_storage_stats

# Count resumes
resume_count = count_resumes(db)
remaining = FREE_PLAN_RESUME_LIMIT - resume_count

# Count JDs
jd_count = count_jds(db)

# Get storage stats
storage = get_storage_stats()

print("=" * 50)
print("DATABASE USAGE REPORT")
print("=" * 50)
print(f"Resumes: {resume_count}/{FREE_PLAN_RESUME_LIMIT} ({remaining} remaining)")
print(f"Job Descriptions: {jd_count} (unlimited)")
print(f"Storage Used: {storage['total_size_mb']:.2f} MB / 50 MB")
print(f"Files Stored: {storage['file_count']}")
print("=" * 50)
```

Run it:
```bash
python check_usage.py
```

---

## 📈 Current Collections in Database

### **1. resume (RESUMES)**
- **Limit:** 10 maximum
- **Stores:** Resume text, metadata, GridFS file ID
- **Size per document:** ~5 MB max (file) + text + metadata

### **2. JobDescription (JOB DESCRIPTIONS)**
- **Limit:** Unlimited
- **Stores:** JD text, designation, status, GridFS file ID
- **Size per document:** ~5 MB max (file) + text + metadata

### **3. resume_result (MATCHING RESULTS)**
- **Limit:** Unlimited
- **Stores:** Match scores, extracted data, analysis
- **Size per document:** ~50-200 KB (JSON data only)

### **4. users (USER ACCOUNTS)**
- **Limit:** Unlimited
- **Stores:** User credentials, roles, security settings
- **Size per document:** ~1-2 KB

### **5. audit_logs (ACTIVITY LOGS)**
- **Limit:** Unlimited
- **Stores:** All user actions, timestamps
- **Size per document:** ~500 bytes

### **6. files (FILE METADATA)**
- **Limit:** Unlimited
- **Stores:** Checksums, virus scan status, metadata
- **Size per document:** ~1-2 KB

### **7. fs.files & fs.chunks (GRIDFS)**
- **Limit:** 50 MB total (10 resumes × 5MB)
- **Stores:** Actual file content (PDFs, DOCX, etc.)
- **Size:** Actual file sizes

---

## 💾 Storage Breakdown

### **Typical Database Size:**

```
With 10 resumes + 5 JDs:

┌──────────────────────────────────────────┐
│  COLLECTION           SIZE      COUNT    │
├──────────────────────────────────────────┤
│  resume              50 KB      10       │
│  JobDescription      25 KB       5       │
│  resume_result      250 KB      50       │ (10 × 5)
│  users                2 KB       1       │
│  audit_logs           5 KB      10       │
│  files               15 KB      15       │
│  fs.files            50 MB      15       │ (actual files)
│  fs.chunks           50 MB    ~200       │ (file chunks)
├──────────────────────────────────────────┤
│  TOTAL              ~100 MB              │
└──────────────────────────────────────────┘
```

---

## ⚠️ What Happens When Limit Reached?

### **When You Reach 10 Resumes:**

```python
# Trying to upload 11th resume:
{
  "detail": "Maximum 10 resumes allowed. Please delete old resumes to upload new ones."
}
```

**Status Code:** `403 Forbidden`

### **When File Exceeds 5MB:**

```python
{
  "detail": "File too large. Maximum size: 5MB"
}
```

**Status Code:** `400 Bad Request`

---

## 🔧 How to Free Up Space

### **Option 1: Delete Old Resumes**

**API Endpoint:**
```bash
DELETE /resumes/{resume_id}
```

**Example:**
```bash
curl -X DELETE "http://localhost:8000/resumes/6543210abc123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Option 2: Clear All Data (Fresh Start)**

**MongoDB Commands:**
```javascript
// Delete all resumes
db.resume.deleteMany({})

// Delete all JDs
db.JobDescription.deleteMany({})

// Delete all results
db.resume_result.deleteMany({})

// Delete all files
db.fs.files.deleteMany({})
db.fs.chunks.deleteMany({})
```

⚠️ **Warning:** This deletes ALL data!

---

## 📊 View Current Usage in Frontend

### **Endpoint Already Available:**

The system provides a `/files/user-stats` endpoint that shows:

```javascript
{
  "resume_count": 7,
  "limit": 10,
  "remaining": 3,
  "storage_used_mb": 25.5,
  "storage_limit_mb": 50,
  "message": "You have 3 resume uploads remaining"
}
```

### **You Can Display This in Your UI:**

Example code to add to frontend:

```typescript
// Fetch usage stats
const stats = await fetch('/files/user-stats', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// Display:
console.log(`Resumes: ${stats.resume_count}/${stats.limit}`);
console.log(`Storage: ${stats.storage_used_mb} MB / ${stats.storage_limit_mb} MB`);
console.log(`Remaining: ${stats.remaining} uploads`);
```

---

## 🎯 Quick Commands

### **Check Resume Count:**
```bash
# Via API
curl http://localhost:8000/resumes/stats/count \
  -H "Authorization: Bearer TOKEN"

# Via MongoDB
mongosh
> use hr_resume_comparator
> db.resume.countDocuments()
```

### **Check JD Count:**
```bash
# Via API
curl http://localhost:8000/job-descriptions/stats/count \
  -H "Authorization: Bearer TOKEN"

# Via MongoDB
> db.JobDescription.countDocuments()
```

### **Check Total Storage:**
```bash
# Via MongoDB
> db.fs.files.aggregate([
    { $group: { _id: null, total: { $sum: "$length" } } }
  ])
```

---

## 📋 Summary Table

| Category | Current State | Limit | How to Check |
|----------|---------------|-------|--------------|
| **Resumes** | Variable | 10 max | `GET /files/user-stats` |
| **Job Descriptions** | Variable | Unlimited | `GET /job-descriptions/stats/count` |
| **File Size** | Per file | 5 MB max | Enforced on upload |
| **Total Storage** | Variable | 50 MB | `GET /files/user-stats` |
| **Matching Results** | Variable | Unlimited | `db.resume_result.countDocuments()` |
| **Workflow History** | Frontend | 10 runs | Browser localStorage |

---

## 🚀 Upgrade Path (Future)

If you need more storage:

1. **Increase FREE_PLAN_RESUME_LIMIT:**
   ```python
   # In database.py
   FREE_PLAN_RESUME_LIMIT = 50  # Increase to 50
   ```

2. **Increase MAX_FILE_SIZE_MB:**
   ```python
   MAX_FILE_SIZE_MB = 10  # Increase to 10MB
   ```

3. **Add Premium Plans:**
   - Free: 10 resumes, 5MB per file
   - Basic: 50 resumes, 10MB per file
   - Premium: Unlimited

4. **Use External Storage:**
   - Azure Blob Storage
   - AWS S3
   - Google Cloud Storage

---

## 💡 Current Status Check

Run this to see your current usage:

```bash
# Terminal command
curl -X GET "http://localhost:8000/files/user-stats" \
  -H "Authorization: Bearer YOUR_TOKEN" | json_pp
```

**Output Example:**
```json
{
  "resume_count": 7,
  "limit": 10,
  "remaining": 3,
  "storage_used_mb": 25.5,
  "storage_limit_mb": 50,
  "message": "You have 3 resume uploads remaining"
}
```

---

**Bottom Line:**
- ✅ **Max 10 resumes** in database (system-wide)
- ✅ **Max 5MB per file**
- ✅ **50MB total storage** for resume files
- ✅ **Unlimited** Job Descriptions
- ✅ **Check usage:** `GET /files/user-stats` API endpoint

Use the API endpoint to see exactly how many files are currently stored! 📊

