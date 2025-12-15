# Crossy v1.0.0

Border Patrol Interior Checkpoint Crossing Simulator

## Purpose

The Crossy application simulates vehicle crossings at United States Border Patrol Interior Checkpoints in Texas. It generates randomized, realistic crossing data and provides dual view modes (Form and JSON) for data entry and editing.

## Features

- **Dual View Modes**: Toggle between Form view (with editable fields) and raw JSON editor
- **Data Generation**: Generate realistic random crossing records with a single click
- **Dual Persistence**: Save data to both local filesystem and MongoDB Atlas
- **MongoDB Connection Status**: Real-time connection indicator
- **Conditional Cargo**: Cargo information only shown/saved when crossing purpose is "shipping"
- **Form Validation**: License plate format, passenger counts, and required fields

## Setup Instructions

### Prerequisites

- Python 3.11 or higher
- MongoDB Atlas account and cluster
- `uv` package manager

### Installation

1. Navigate to the crossy directory:
```bash
cd app
```

2. Create a virtual environment and activate it:
```bash
uv venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:
```bash
uv pip install fastapi uvicorn motor pydantic pydantic-settings python-dotenv
```

4. Create `.env` file from template:
```bash
cp .env.example .env
```

5. Edit `.env` with your MongoDB Atlas credentials:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
DATABASE_NAME=crossy
```

### Running the Application

Start the FastAPI server:
```bash
cd app
source .venv/bin/activate
uv run uvicorn backend.main:app --reload --port 8000
```

Open your browser to: http://localhost:8000

## Project Structure

```
crossy/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── models.py            # Pydantic data models
│   ├── database.py          # MongoDB connection
│   ├── routes.py            # API endpoints
│   ├── data_generator.py    # Random data generation
│   └── config.py            # Configuration/environment
├── frontend/
│   ├── index.html           # Main UI
│   ├── css/
│   │   └── styles.css       # Custom styles
│   └── js/
│       ├── app.js           # Main application logic
│       ├── formView.js      # Form view handler
│       └── jsonView.js      # JSON view handler
├── data/                    # Filesystem storage (JSON files)
└── .env                     # Environment variables (not in repo)
```

## API Endpoints

- `GET /` - Serves the frontend application
- `GET /api/health` - MongoDB connection status
- `POST /api/generate` - Generate random crossing record
- `POST /api/submit` - Save record to filesystem + MongoDB
- `GET /api/checkpoints` - List of available checkpoints
- `GET /api/cargo-types` - List of cargo types

## Data Structure

### Vehicle Details
- License plate number (format: XX-YYY-123)
- Vehicle type: sedan, truck, motorcycle, tractor trailer, van
- Owner name
- Registration details (state, expiration date)
- Passenger count

### Crossing Event Data
- Timestamp (ISO 8601)
- Interior checkpoint (18 Texas locations)
- Direction (inbound/outbound)
- Lane assignment (1-10)
- Crossing purpose (personal, business, shipping)
- Secondary inspection flag

### Cargo Information (conditional)
- Manifest ID (SCAC format)
- Cargo type (23 categories)
- Hazardous material flag
- Container ID

## Development

This is a demo application and does not include authentication. Not intended for production use.

## Technology Stack

- **Backend**: Python, FastAPI, Motor (async MongoDB driver)
- **Frontend**: HTML5, Vanilla JavaScript, Bootstrap 5, DM Sans font
- **Database**: MongoDB Atlas
- **Storage**: Local filesystem (./data/)

