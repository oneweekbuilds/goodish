# AlgorithmLens Backend

This is the Python backend for AlgorithmLens, built with FastAPI. It handles video uploads, frame extraction, OCR analysis, and insight generation.

## Prerequisites

1. **Python 3.8+**
2. **Tesseract OCR**:
   - Windows: Download and install from [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki).
   - Ensure `tesseract` is in your system PATH, or update `video_processor.py` to point to the executable.

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running Locally

Start the server with uvicorn:

```bash
uvicorn app:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.
Interactive docs are at `http://localhost:8000/docs`.

## API Endpoints

### POST /api/scan/upload

Uploads a video file for analysis.

- **Method**: POST
- **Body**: `multipart/form-data`
  - `file`: The video file.
  - `userId` (optional): User ID string.
  - `platform` (optional): Platform string (e.g., "tiktok").
- **Response**: JSON object containing insights (see `models.py` for schema).

### GET /api/health

Health check endpoint.

- **Response**: `{"status": "ok"}`
