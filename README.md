# Capstone_Project_CSC
CyberSafeCheck (CSC) is a multi-platform educational tool designed to promote digital safety through awareness and analysis: Chrome Extension: analyzes social media profiles (Instagram, Facebook, X). Web App: centralizes scans, scores, and generates reports. Mobile App: allows users to check their scores and personalized tips anywhere.


# Fullstack Project + Browser Extension

This project contains three main parts:

- **Frontend (React + Chart.js)**: Dashboard with interactive charts
- **Backend (FastAPI)**: API providing data to the frontend
- **Browser Extension (Svelte)**: Extension interface built with Svelte

The entire setup is fully dockerized for easy development and deployment.

---

## Project Structure

```
project/
 ├── docker-compose.yml
 ├── backend/
 │    ├── main.py
 │    ├── requirements.txt
 │    └── Dockerfile
 ├── webapp/
 │    ├── src/
 │    ├── package.json
 │    └── Dockerfile
 └── svelte/svelte-app/
      ├── src/
      ├── package.json
      └── Dockerfile
```

---

## Prerequisites

- Docker and Docker Compose installed
- (Optional) Node.js for local frontend/extension development
- (Optional) Python 3.11+ for local backend development

---

## Running the Project with Docker

To build and start all services:
```
docker compose up --build
```

Access services at:
- Frontend: http://localhost:5173  
- Backend: http://localhost:8000  
- Extension: build output in the `dist/` folder (load in your browser manually)

---

## Local Development

### Frontend
```
cd webapp
npm install
npm run dev
```

### Backend
```
cd backend
python -m venv venv
# Linux/macOS
source venv/bin/activate
# Windows
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Extension
```
cd svelte/svelte-app
npm install
npm run build
# Load the dist/ folder into Chrome or Firefox manually
```

---

## Notes

- The frontend communicates with the backend at http://localhost:8000  
- Extension build files are static and can be loaded directly into your browser  
- Docker ensures each service runs in an isolated container  

---