# HR Resume Comparator - FastAPI Backend

AgenticAI-powered resume matching system for HR recruitment.

## 🚀 Features

- **Resume Management**: Upload, parse, and store resumes from multiple sources
- **10-Resume Free Plan**: Free users can upload up to 10 resumes (premium unlimited)
- **Job Description Management**: Create and manage job descriptions with custom IDs
- **AI-Powered Matching**: Compare resumes against job descriptions using AI agents
- **Multi-Platform Support**: Fetch resumes from LinkedIn, Indeed, and Naukri.com
- **Analytics & Reporting**: Get insights on candidate matches and statistics
- **User Authentication**: Secure JWT-based authentication with role-based access
- **GridFS File Storage**: Files stored in MongoDB (no external storage needed!)
- **Audit Logging**: Track all sensitive operations for compliance

## 📋 Database Schema

### Collections
1. **resume** - Stores uploaded resume files and parsed text
2. **JobDescription** - Stores job descriptions with custom IDs
3. **resume_result** - Stores AI-generated matching results
4. **users** - User authentication and authorization
5. **audit_logs** - Security audit trail
6. **files** - File metadata and storage references

## 🛠️ Tech Stack

- **Framework**: FastAPI 0.104+
- **Database**: MongoDB 4.6+ with GridFS
- **Storage**: MongoDB GridFS (built-in, no external storage!)
- **Authentication**: JWT with bcrypt
- **AI/NLP**: OpenAI API (optional)
- **File Parsing**: PyPDF2, pdfplumber, python-docx

## 💡 Why GridFS Instead of Azure Storage?

With the **10-resume limit** for free users:
- **Max storage**: 10 resumes × 5MB = 50MB
- **GridFS is perfect** for files under 100MB
- **No external dependencies** - everything in MongoDB
- **Simpler deployment** - one database, no cloud storage setup
- **Cost effective** - no storage service fees
- **Easier development** - no Azure configuration needed

## 📦 Installation

### Prerequisites
- Python 3.10+
- MongoDB (local or Atlas) - **That's it!**
- No Azure Storage needed! (Files stored in MongoDB GridFS)

### Setup

1. **Clone the repository**
```bash
cd HR_Backend_FastAPI
```

2. **Create virtual environment**
```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**
```bash
cp env_template.txt .env
# Edit .env - only MongoDB URL and JWT secret needed!
```

Minimal `.env` configuration:
```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=hr_resume_comparator
JWT_SECRET_KEY=your-secret-key-change-this
```

5. **Start MongoDB** (if running locally)
```bash
mongod --dbpath /path/to/data
```

6. **Run the application**
```bash
python main.py
```

Or use uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 🔧 Configuration

### MongoDB Configuration (Only requirement!)
```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=hr_resume_comparator
```

For MongoDB Atlas (Cloud):
```env
MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
```

### JWT Authentication
```env
JWT_SECRET_KEY=your-super-secret-key-change-this
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### File Storage
**No configuration needed!** Files are stored in MongoDB GridFS automatically.

With the 10-resume limit:
- Free users: 10 resumes × 5MB = 50MB max
- Premium users: Unlimited
- All files stored in MongoDB (no external storage)

## 📚 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user info

### Resumes
- `POST /resumes/` - Upload resume
- `GET /resumes/` - List all resumes
- `GET /resumes/{resume_id}` - Get resume by ID
- `PUT /resumes/{resume_id}` - Update resume
- `DELETE /resumes/{resume_id}` - Delete resume
- `GET /resumes/search` - Search resumes

### Job Descriptions
- `POST /job-descriptions/` - Create job description
- `GET /job-descriptions/` - List all JDs
- `GET /job-descriptions/{jd_id}` - Get JD by ID
- `PUT /job-descriptions/{jd_id}` - Update JD
- `DELETE /job-descriptions/{jd_id}` - Delete JD

### Matching
- `POST /matching/match` - Match single resume with JD
- `POST /matching/batch` - Batch match multiple resumes
- `GET /matching/results/{jd_id}` - Get all matches for JD
- `GET /matching/top-matches/{jd_id}` - Get top candidate matches

### Files
- `POST /files/upload-resume` - Upload resume file
- `POST /files/upload-jd` - Upload JD file
- `GET /files/download/{file_id}` - Download file

### Analytics
- `GET /analytics/stats` - Get overall statistics
- `GET /analytics/jd-stats/{jd_id}` - Get JD-specific stats

## 🧪 Testing

```bash
# Install testing dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html
```

## 📊 Database Initialization

The database will be automatically initialized on first run with:
- Collections created
- Indexes established
- Validation rules applied

To manually initialize:
```python
from database import init_db
init_db()
```

## 🔐 Security Features

1. **Password Hashing**: bcrypt with cost factor 12
2. **JWT Tokens**: Secure token-based authentication
3. **Role-Based Access**: Admin, HR Manager, Recruiter roles
4. **Audit Logging**: All sensitive operations logged
5. **File Validation**: File type and size validation
6. **Rate Limiting**: Protection against abuse (TODO)
7. **CORS**: Configurable CORS policies

## 🤖 AI Agent Integration

The system uses 4 AI agents for resume matching:

1. **JD & Resume Extractor Agent** - Parses documents
2. **JD Reader Agent** - Extracts job requirements
3. **Resume Reader Agent** - Extracts candidate information
4. **HR Comparator Agent** - Matches candidates with weighted scoring

To enable AI features, set:
```env
OPENAI_API_KEY=sk-...
```

## 📝 Development

### Project Structure
```
HR_Backend_FastAPI/
├── main.py                 # FastAPI app entry point
├── database.py             # MongoDB connection
├── models.py               # Pydantic models
├── schemas.py              # API schemas
├── crud.py                 # Database operations
├── azure_storage.py        # File storage
├── requirements.txt        # Python dependencies
├── .env.example            # Environment template
├── routers/                # API route handlers
│   ├── auth.py
│   ├── resumes.py
│   ├── job_descriptions.py
│   ├── matching.py
│   ├── files.py
│   └── analytics.py
└── utils/                  # Utility functions
    ├── auth_utils.py
    └── file_utils.py
```

### Adding New Endpoints
1. Create router in `routers/`
2. Add CRUD operations in `crud.py`
3. Define schemas in `schemas.py`
4. Include router in `main.py`

## 🚢 Deployment

### Docker Deployment
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Cloud Deployment
- **Azure App Service**: Supported
- **AWS Lambda**: Use Mangum adapter
- **Google Cloud Run**: Supported
- **Heroku**: Supported

## 📖 API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Contact: hr-support@example.com

## 🔗 Related Documentation

- [Database Schema Documentation](../DATABASE_SCHEMA_README.md)
- [Frontend Repository](../src/)
- [API Postman Collection](./postman_collection.json)

