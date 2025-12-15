Crossy Application Implementation Plan
Overview
Build the Crossy application with FastAPI backend and vanilla JavaScript frontend to simulate Border Patrol interior checkpoint crossings with randomized data generation, dual view modes, and dual persistence (filesystem + MongoDB).

Architecture
Backend: FastAPI + Python (uv)

MongoDB Atlas integration
Filesystem persistence to ./crossy/data/
API endpoints for CRUD operations
Frontend: HTML + Vanilla JavaScript + Bootstrap

Toggle between Form view and JSON view
Data generation and validation
Real-time MongoDB connection status
Implementation Steps
1. Project Structure & Dependencies
Create directory structure:

crossy/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── models.py            # Pydantic models
│   ├── database.py          # MongoDB connection
│   ├── routes.py            # API routes
│   ├── data_generator.py    # Random data generation
│   └── config.py            # Configuration/env variables
├── frontend/
│   ├── index.html           # Main UI
│   ├── css/
│   │   └── styles.css       # Custom styles
│   └── js/
│       ├── app.js           # Main application logic
│       ├── formView.js      # Form view handler
│       └── jsonView.js      # JSON view handler
├── data/                    # Filesystem storage
├── .env.example             # Template
├── .env                     # Actual credentials (gitignored)
├── pyproject.toml           # Python dependencies
└── README.md
Dependencies:

Backend: fastapi, uvicorn, motor (async MongoDB), pydantic, pydantic-settings, python-dotenv
Frontend: Bootstrap 5, DM Sans font (Google Fonts)
2. Environment Configuration
Create .env.example with:

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/
DATABASE_NAME=crossy

# Application
APP_NAME=crossy
APP_VERSION=1.0.0
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:8000,http://127.0.0.1:8000
3. Backend - Data Models
Define Pydantic models in models.py for:

VehicleDetails: license_plate_number, vehicle_type, owner_name, registration_details (state, expiration_date), passenger_count
CrossingEvent: timestamp, interior_checkpoints, direction, lane_assignment, crossing_purpose, secondary_inspection_flag
CargoManifest: manifest_id, cargo_type, hazardous_material, container_id
CrossingRecord: Combines all three models
4. Backend - Database Layer
database.py:

MongoDB connection using Motor (async)
Health check endpoint for connection status
Collections: vehicle, crossing, cargo_manifest
CRUD operations for each collection
5. Backend - Data Generator
data_generator.py:

Generate realistic random data for all fields
Vehicle data:
License plates: Format XX-YYY-ZZZ (state + 3 letters + 3 numbers)
Vehicle types: sedan, truck, motorcycle, tractor trailer, van
Random owner names (US names)
Registration state (50 US states)
Expiration dates (random future dates)
Passenger count (0-8, vehicle-type appropriate)
Crossing event:
ISO 8601 timestamps
Random checkpoint from 18 Texas locations
Direction: inbound/outbound
Lane: 1-10
Purpose: personal, business, shipping
Secondary inspection: ~20% probability
Cargo manifest (only if purpose="shipping"):
Manifest ID: SCAC (4 letters) + year (2 digits) + sequence (6-10 digits)
Cargo type from 23 options
Hazmat flag: true/false
Container ID: 10 alphanumeric characters
6. Backend - API Routes
routes.py endpoints:

GET /api/health - MongoDB connection status
POST /api/generate - Generate random crossing record
POST /api/submit - Save record to filesystem + MongoDB
GET /api/checkpoints - Return list of checkpoints
GET /api/cargo-types - Return list of cargo types
7. Backend - Filesystem Persistence
In routes.py submit handler:

Save JSON to ./crossy/data/ directory
Filename format: <collection>_<datetime>.json
Example: vehicle_20251030_131045.json
Create three separate files per submission (vehicle, crossing, cargo_manifest)
Handle errors gracefully
8. Frontend - HTML Structure
index.html:

Header with app title "Crossy v1.0.0" and MongoDB status indicator
View toggle buttons (Form / JSON)
Action buttons (Generate / SUBMIT)
Three collapsible sections:
Vehicle Details
Crossing Event Data  
Cargo Information (conditional)
Toast notifications for success/error messages
Bootstrap 5 framework
DM Sans font from Google Fonts
9. Frontend - Styling
styles.css:

Color scheme:
Primary: #FF3621
Dark: #0B2026
Light gray: #EEEDE9
Off-white: #F9F7F4
Generous spacing between elements
Modern card-based layout
Responsive design (mobile-friendly)
MongoDB indicator styling (green/red circle)
10. Frontend - Form View
formView.js:

Build dynamic form fields for all data
Dropdowns for: vehicle_type, registration_state, checkpoint, direction, crossing_purpose, cargo_type
Number inputs for: passenger_count, lane_assignment
Text inputs for: license_plate, owner_name, timestamps, IDs
Checkbox for: secondary_inspection_flag, hazardous_material
Date picker for expiration_date
Conditional rendering: show/hide cargo section based on crossing_purpose
Form validation:
License plate format: XX-YYY-ZZZ
Passenger count >= 0
Lane assignment 1-10
Required fields
11. Frontend - JSON View
jsonView.js:

Three separate JSON editors (one per collection)
Syntax highlighting using <pre> tags with CSS
Editable textarea elements
JSON validation on edit
Synchronize with form view data
12. Frontend - Application Logic
app.js:

Initialize app and check MongoDB connection
Update connection indicator (green/red circle)
Handle view toggle (Form ↔ JSON)
Generate button: 
Call /api/generate
Populate both views with generated data
If called again, replace all data with new values
SUBMIT button:
Validate data
Call /api/submit
Show success/error notification
Clear form on success
Keep Form and JSON views synchronized
Handle errors gracefully
13. Testing & Validation
Test data generation for all combinations
Verify conditional cargo logic (only for "shipping")
Test form validation rules
Verify MongoDB connection indicator updates
Test view synchronization (Form ↔ JSON)
Verify filesystem persistence (check files created)
Verify MongoDB persistence (check collections)
Test edge cases (disconnected MongoDB, filesystem errors)
14. Documentation
Update README.md with:

Application purpose and features
Setup instructions (uv install, MongoDB Atlas setup)
Environment variables
Running the application
API endpoints documentation
Development workflow
Key Implementation Notes
Checkpoint names: Use the names from reference data (e.g., "Falfurrias", "East El Paso")
Cargo conditional: Only include cargo when crossing_purpose === "shipping"
File naming: <collection>_<YYYYMMDDHHmmss>.json
No authentication: Demo application only
Error handling: Show user-friendly messages, log details server-side
MongoDB connection: Check status on app load and display indicator