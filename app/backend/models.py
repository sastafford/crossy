"""
Pydantic models for Crossy application data structures.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class RegistrationDetails(BaseModel):
    """Vehicle registration details."""
    state: str = Field(..., description="Two-letter state abbreviation")
    expiration_date: str = Field(..., description="Registration expiration date (YYYY-MM-DD)")


class VehicleDetails(BaseModel):
    """Vehicle information for border crossing."""
    license_plate_number: str = Field(..., description="License plate in format XX-YYY-123")
    vehicle_type: str = Field(..., description="Type of vehicle: sedan, truck, motorcycle, tractor trailer, van")
    owner_name: str = Field(..., description="Name of vehicle owner")
    registration_details: RegistrationDetails
    passenger_count: int = Field(..., ge=0, description="Number of passengers (non-negative)")

    class Config:
        json_schema_extra = {
            "example": {
                "license_plate_number": "TX-ABC-123",
                "vehicle_type": "truck",
                "owner_name": "John Doe",
                "registration_details": {
                    "state": "TX",
                    "expiration_date": "2026-03-15"
                },
                "passenger_count": 2
            }
        }


class CrossingEvent(BaseModel):
    """Border crossing event information."""
    timestamp: str = Field(..., description="ISO 8601 timestamp")
    interior_checkpoints: str = Field(..., description="Name of interior checkpoint")
    direction: str = Field(..., description="Direction: Inbound or Outbound")
    lane_assignment: int = Field(..., ge=1, le=10, description="Lane number between 1 and 10")
    crossing_purpose: str = Field(..., description="Purpose: personal, business, or shipping")
    secondary_inspection_flag: bool = Field(..., description="Whether secondary inspection is required")

    class Config:
        json_schema_extra = {
            "example": {
                "timestamp": "2025-10-30T13:10:00Z",
                "interior_checkpoints": "Falfurrias",
                "direction": "Inbound",
                "lane_assignment": 4,
                "crossing_purpose": "personal",
                "secondary_inspection_flag": True
            }
        }


class CargoManifest(BaseModel):
    """Cargo manifest information (only for shipping crossings)."""
    manifest_id: str = Field(..., description="Manifest ID in SCAC format")
    cargo_type: str = Field(..., description="Type of cargo from predefined list")
    hazardous_material: bool = Field(..., description="Whether cargo contains hazardous materials")
    container_id: str = Field(..., description="10 alphanumeric container identifier")

    class Config:
        json_schema_extra = {
            "example": {
                "manifest_id": "ABCD2500123456",
                "cargo_type": "Electronics",
                "hazardous_material": False,
                "container_id": "CONT33445X"
            }
        }


class CrossingRecord(BaseModel):
    """Complete crossing record with vehicle, event, and optional cargo data."""
    vehicle: VehicleDetails
    crossing: CrossingEvent
    cargo: Optional[CargoManifest] = None

    class Config:
        json_schema_extra = {
            "example": {
                "vehicle": {
                    "license_plate_number": "TX-ABC-123",
                    "vehicle_type": "truck",
                    "owner_name": "John Doe",
                    "registration_details": {
                        "state": "TX",
                        "expiration_date": "2026-03-15"
                    },
                    "passenger_count": 2
                },
                "crossing": {
                    "timestamp": "2025-10-30T13:10:00Z",
                    "interior_checkpoints": "Falfurrias",
                    "direction": "Inbound",
                    "lane_assignment": 4,
                    "crossing_purpose": "personal",
                    "secondary_inspection_flag": True
                },
                "cargo": None
            }
        }


class SubmitRequest(BaseModel):
    """Request model for submitting crossing data."""
    vehicle: VehicleDetails
    crossing: CrossingEvent
    cargo: Optional[CargoManifest] = None


class SubmitResponse(BaseModel):
    """Response model for submit endpoint."""
    success: bool
    message: str
    files_created: list[str] = []
    mongodb_saved: bool = False


class HealthResponse(BaseModel):
    """Response model for health check endpoint."""
    mongodb_connected: bool
    message: str

