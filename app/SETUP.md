# Crossy Application - Setup and Usage Guide

## Overview

The Crossy application has been successfully implemented and is ready for use. This document provides setup instructions and usage guidelines.

## Project Status

✅ **Complete and Ready to Use**

All components have been implemented and tested:
- ✅ Backend (FastAPI + Python + Motor)
- ✅ Frontend (HTML + Vanilla JavaScript + Bootstrap)
- ✅ Data Generation System
- ✅ MongoDB Integration
- ✅ Filesystem Persistence
- ✅ Dual View Modes (Form & JSON)
- ✅ Validation and Error Handling

## Quick Start

### 1. Configure MongoDB

Edit the `.env` file and add your MongoDB Atlas credentials:

```bash
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/
DATABASE_NAME=crossy
```

**Note:** The application will still work without MongoDB (with reduced functionality). It will save data to the filesystem but show MongoDB as disconnected.

### 2. Start the Application

```bash
cd crossy
source .venv/bin/activate
python -m backend.main
```

Or using uvicorn directly:

```bash
cd crossy
source .venv/bin/activate
uvicorn backend.main:app --reload --port 8000
```

### 3. Access the Application

Open your browser to: **http://localhost:8000**

## Features

### Data Generation
- Click **"Generate"** to create randomized crossing records
- All fields populated with realistic data
- Cargo information only included for "shipping" crossings
- Each generation creates fresh data

### Dual View Modes

**Form View:**
- User-friendly form with dropdowns and inputs
- Real-time validation
- Conditional cargo section (shows only for shipping)
- Clear field labels and format hints

**JSON View:**
- Raw JSON editors for each data section
- Editable with validation
- Syntax highlighting (dark theme)
- Direct JSON manipulation

### Data Submission
- Saves to **both** filesystem and MongoDB
- Filesystem: Creates separate JSON files in `./data/` directory
  - `vehicle_YYYYMMDD_HHMMSS.json`
  - `crossing_YYYYMMDD_HHMMSS.json`
  - `cargo_manifest_YYYYMMDD_HHMMSS.json` (if applicable)
- MongoDB: Saves to three collections:
  - `vehicle`
  - `crossing`
  - `cargo_manifest`

### Validation
- License plate format: `XX-YYY-123`
- Passenger count: Non-negative integers
- Lane assignment: 1-10
- Required fields enforcement
- JSON syntax validation in JSON view

### MongoDB Connection
- Real-time status indicator (green/red circle)
- Application continues to work if MongoDB is unavailable
- Saves to filesystem only when MongoDB is down

## File Structure

```
crossy/
├── backend/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── models.py            # Pydantic data models
│   ├── database.py          # MongoDB connection
│   ├── routes.py            # API endpoints
│   ├── data_generator.py    # Random data generation
│   └── config.py            # Configuration
├── frontend/
│   ├── index.html           # Main UI
│   ├── css/
│   │   └── styles.css       # Styling
│   └── js/
│       ├── app.js           # Main application logic
│       ├── formView.js      # Form view handler
│       └── jsonView.js      # JSON view handler
├── data/                    # Generated JSON files saved here
├── .env                     # Environment configuration
├── env.example              # Environment template
├── .gitignore
├── pyproject.toml
└── README.md
```

## API Endpoints

- `GET /` - Serves frontend application
- `GET /health` - Basic health check
- `GET /api/health` - MongoDB connection status
- `POST /api/generate` - Generate random crossing record
- `POST /api/submit` - Submit record to filesystem and MongoDB
- `GET /api/checkpoints` - List of Texas checkpoints
- `GET /api/cargo-types` - List of cargo types
- `GET /api/vehicle-types` - List of vehicle types
- `GET /api/states` - List of US states

## Reference Data

### Texas Interior Checkpoints (18 locations)
- East El Paso
- Sierra Blanca
- Marfa
- Alpine
- Marathon
- Eagle Pass
- Del Rio
- Brackettville
- East Eagle Pass
- Laredo-83
- Laredo-35
- Freer
- Oilton
- Hebbronville
- Hebbronville_2
- Falfurrias
- Sarita
- Brownsville

### Vehicle Types
- sedan
- truck
- motorcycle
- tractor trailer
- van

### Crossing Purposes
- personal
- business
- shipping (triggers cargo information)

### Cargo Types (23 categories)
General Merchandise, Machinery and Equipment, Electronics, Automotive Parts, Textiles and Apparel, Food and Beverages, Agricultural Products, Chemicals (non-hazardous), Hazardous Materials (Hazmat), Pharmaceuticals, Medical Supplies, Livestock and Animals, Furniture, Metal and Steel Products, Wood and Lumber, Plastics and Rubber Goods, Household Goods/Personal Effects, Paper Products, Building Materials, Containers, Petroleum Products, Minerals and Ores, Toys and Games

## Design

### Color Scheme
- **Primary:** #FF3621 (buttons, accents)
- **Dark:** #0B2026 (header, JSON editor)
- **Light Gray:** #EEEDE9 (section backgrounds)
- **Off-White:** #F9F7F4 (page background)
- **Font:** DM Sans

### Responsive Design
- Desktop: Two-column layout
- Mobile/Tablet: Single column
- All buttons and controls adapt to screen size

## Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB URI in `.env` file
- Check network connectivity
- Ensure MongoDB Atlas cluster is running
- Whitelist your IP address in MongoDB Atlas

### Application Won't Start
- Ensure virtual environment is activated
- Check Python version (3.11+)
- Verify all dependencies installed: `uv pip list`

### Port Already in Use
- Change API_PORT in `.env` file
- Or kill existing process on port 8000

## Development

### Running in Development Mode
The application runs in development mode by default with auto-reload enabled.

### Adding Features
- Backend: Add routes in `routes.py`
- Frontend: Modify JS modules in `frontend/js/`
- Styling: Update `frontend/css/styles.css`

### Testing
- Manual testing via browser
- API testing via curl or Postman
- Check `./data/` for saved files
- Verify MongoDB collections

## Security Note

⚠️ **This is a demo application without authentication.** 
- Not intended for production use
- No user authentication
- No authorization checks
- MongoDB credentials in environment variables

## Next Steps

1. Configure MongoDB Atlas connection
2. Start the application
3. Generate and submit test records
4. Verify files created in `./data/` directory
5. Check MongoDB collections

## Support

For issues or questions, refer to:
- `README.md` - General information
- `env.example` - Configuration template
- API documentation at http://localhost:8000/docs (FastAPI Swagger UI)

