"""
FastAPI routes for the Crossy application.
"""
import json
import logging
import os
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
from .models import (
    CrossingRecord, SubmitRequest, SubmitResponse, 
    HealthResponse, VehicleDetails, CrossingEvent, CargoManifest
)
from .database import MongoDB, get_database
from . import data_generator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["api"])


@router.get("/health", response_model=HealthResponse)
async def health_check(db: MongoDB = Depends(get_database)):
    """
    Check MongoDB connection status.
    Returns connection status indicator for frontend.
    """
    is_connected = await db.is_connected()
    
    return HealthResponse(
        mongodb_connected=is_connected,
        message="Connected" if is_connected else "Not connected"
    )


@router.post("/generate", response_model=CrossingRecord)
async def generate_record():
    """
    Generate a random crossing record with realistic data.
    Includes cargo only if crossing purpose is 'shipping'.
    """
    try:
        record_data = data_generator.generate_crossing_record()
        
        # Convert to Pydantic models for validation
        vehicle = VehicleDetails(**record_data["vehicle"])
        crossing = CrossingEvent(**record_data["crossing"])
        cargo = CargoManifest(**record_data["cargo"]) if record_data["cargo"] else None
        
        return CrossingRecord(
            vehicle=vehicle,
            crossing=crossing,
            cargo=cargo
        )
    except Exception as e:
        logger.error(f"Error generating record: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating record: {str(e)}")


@router.post("/submit", response_model=SubmitResponse)
async def submit_record(request: SubmitRequest, db: MongoDB = Depends(get_database)):
    """
    Submit crossing record to both filesystem and MongoDB.
    Creates separate JSON files for vehicle, crossing, and cargo (if present).
    """
    files_created = []
    mongodb_saved = False
    errors = []
    
    # Ensure data directory exists
    data_dir = Path("data")
    data_dir.mkdir(exist_ok=True)
    
    # Generate timestamp for filenames
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save to filesystem
    try:
        # Save vehicle data
        vehicle_filename = f"vehicle_{timestamp_str}.json"
        vehicle_path = data_dir / vehicle_filename
        with open(vehicle_path, 'w') as f:
            json.dump(request.vehicle.model_dump(), f, indent=2)
        files_created.append(vehicle_filename)
        logger.info(f"Saved vehicle data to {vehicle_path}")
        
        # Save crossing data
        crossing_filename = f"crossing_{timestamp_str}.json"
        crossing_path = data_dir / crossing_filename
        with open(crossing_path, 'w') as f:
            json.dump(request.crossing.model_dump(), f, indent=2)
        files_created.append(crossing_filename)
        logger.info(f"Saved crossing data to {crossing_path}")
        
        # Save cargo data if present
        if request.cargo:
            cargo_filename = f"cargo_manifest_{timestamp_str}.json"
            cargo_path = data_dir / cargo_filename
            with open(cargo_path, 'w') as f:
                json.dump(request.cargo.model_dump(), f, indent=2)
            files_created.append(cargo_filename)
            logger.info(f"Saved cargo data to {cargo_path}")
            
    except Exception as e:
        error_msg = f"Filesystem save error: {str(e)}"
        logger.error(error_msg)
        errors.append(error_msg)
    
    # Save to MongoDB
    try:
        if await db.is_connected():
            # Insert vehicle
            vehicle_id = await db.insert_vehicle(request.vehicle.model_dump())
            logger.info(f"Inserted vehicle with ID: {vehicle_id}")
            
            # Insert crossing
            crossing_id = await db.insert_crossing(request.crossing.model_dump())
            logger.info(f"Inserted crossing with ID: {crossing_id}")
            
            # Insert cargo if present
            if request.cargo:
                cargo_id = await db.insert_cargo(request.cargo.model_dump())
                logger.info(f"Inserted cargo with ID: {cargo_id}")
            
            mongodb_saved = True
        else:
            error_msg = "MongoDB not connected"
            logger.warning(error_msg)
            errors.append(error_msg)
            
    except Exception as e:
        error_msg = f"MongoDB save error: {str(e)}"
        logger.error(error_msg)
        errors.append(error_msg)
    
    # Determine success status
    success = len(files_created) > 0 or mongodb_saved
    
    # Build response message
    if success:
        messages = []
        if files_created:
            messages.append(f"Saved to filesystem: {', '.join(files_created)}")
        if mongodb_saved:
            messages.append("Saved to MongoDB")
        if errors:
            messages.append(f"Warnings: {'; '.join(errors)}")
        message = " | ".join(messages)
    else:
        message = f"Failed to save: {'; '.join(errors)}"
    
    return SubmitResponse(
        success=success,
        message=message,
        files_created=files_created,
        mongodb_saved=mongodb_saved
    )


@router.get("/checkpoints")
async def get_checkpoints():
    """Return list of available Texas interior checkpoints."""
    return {"checkpoints": data_generator.get_checkpoints()}


@router.get("/cargo-types")
async def get_cargo_types():
    """Return list of available cargo types."""
    return {"cargo_types": data_generator.get_cargo_types()}


@router.get("/vehicle-types")
async def get_vehicle_types():
    """Return list of vehicle types."""
    return {"vehicle_types": data_generator.get_vehicle_types()}


@router.get("/states")
async def get_states():
    """Return list of US state abbreviations."""
    return {"states": data_generator.get_us_states()}


@router.get("/collections/{collection_name}")
async def list_collection_documents(
    collection_name: str,
    skip: int = 0,
    limit: int = 20,
    db: MongoDB = Depends(get_database)
):
    """
    List documents from a collection with pagination support.
    Returns paginated list of documents with _id and display_label fields.
    """
    # Validate collection name
    valid_collections = ["vehicle", "crossing", "cargo_manifest"]
    if collection_name not in valid_collections:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid collection name. Must be one of: {', '.join(valid_collections)}"
        )
    
    # Validate pagination parameters
    if skip < 0:
        raise HTTPException(status_code=400, detail="skip must be >= 0")
    if limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 100")
    
    try:
        if not await db.is_connected():
            raise HTTPException(
                status_code=503,
                detail="MongoDB is not connected"
            )
        
        # Get total count and paginated documents
        total_count = await db.count_documents(collection_name)
        documents = await db.list_documents(collection_name, skip=skip, limit=limit)
        
        return {
            "collection": collection_name,
            "total_count": total_count,
            "skip": skip,
            "limit": limit,
            "count": len(documents),
            "documents": documents
        }
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Error listing documents from {collection_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving documents: {str(e)}")


@router.get("/collections/{collection_name}/{document_id}")
async def get_collection_document(
    collection_name: str,
    document_id: str,
    db: MongoDB = Depends(get_database)
):
    """
    Retrieve a specific document by ID from a collection.
    Returns the full document as JSON.
    """
    # Validate collection name
    valid_collections = ["vehicle", "crossing", "cargo_manifest"]
    if collection_name not in valid_collections:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid collection name. Must be one of: {', '.join(valid_collections)}"
        )
    
    try:
        if not await db.is_connected():
            raise HTTPException(
                status_code=503,
                detail="MongoDB is not connected"
            )
        
        document = await db.get_document(collection_name, document_id)
        
        if document is None:
            raise HTTPException(
                status_code=404,
                detail=f"Document with ID {document_id} not found in collection {collection_name}"
            )
        
        return document
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Error retrieving document {document_id} from {collection_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving document: {str(e)}")


@router.put("/collections/{collection_name}/{document_id}")
async def update_collection_document(
    collection_name: str,
    document_id: str,
    document_data: dict,
    db: MongoDB = Depends(get_database)
):
    """
    Update an existing document in a collection.
    Accepts the updated document data as JSON and overwrites the existing document.
    """
    # Validate collection name
    valid_collections = ["vehicle", "crossing", "cargo_manifest"]
    if collection_name not in valid_collections:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid collection name. Must be one of: {', '.join(valid_collections)}"
        )
    
    try:
        if not await db.is_connected():
            raise HTTPException(
                status_code=503,
                detail="MongoDB is not connected"
            )
        
        # Update the document
        updated = await db.update_document(collection_name, document_id, document_data)
        
        if not updated:
            raise HTTPException(
                status_code=404,
                detail=f"Document with ID {document_id} not found in collection {collection_name}"
            )
        
        # Return the updated document
        updated_document = await db.get_document(collection_name, document_id)
        return {
            "success": True,
            "message": f"Document {document_id} updated successfully",
            "document": updated_document
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating document {document_id} in {collection_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating document: {str(e)}")


@router.delete("/collections/{collection_name}/{document_id}")
async def delete_collection_document(
    collection_name: str,
    document_id: str,
    db: MongoDB = Depends(get_database)
):
    """
    Delete a document from a collection by ID.
    """
    # Validate collection name
    valid_collections = ["vehicle", "crossing", "cargo_manifest"]
    if collection_name not in valid_collections:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid collection name. Must be one of: {', '.join(valid_collections)}"
        )
    
    try:
        if not await db.is_connected():
            raise HTTPException(
                status_code=503,
                detail="MongoDB is not connected"
            )
        
        # Delete the document
        deleted = await db.delete_document(collection_name, document_id)
        
        if not deleted:
            raise HTTPException(
                status_code=404,
                detail=f"Document with ID {document_id} not found in collection {collection_name}"
            )
        
        return {
            "success": True,
            "message": f"Document {document_id} deleted successfully"
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting document {document_id} from {collection_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")


@router.post("/reset")
async def reset_collections(db: MongoDB = Depends(get_database)):
    """
    Reset all collections by deleting all documents from vehicle, crossing, and cargo_manifest collections.
    This is a destructive operation that cannot be undone.
    """
    try:
        if not await db.is_connected():
            raise HTTPException(
                status_code=503,
                detail="MongoDB is not connected"
            )
        
        # Delete all documents from each collection
        vehicle_count = await db.delete_all_documents("vehicle")
        crossing_count = await db.delete_all_documents("crossing")
        cargo_count = await db.delete_all_documents("cargo_manifest")
        
        total_deleted = vehicle_count + crossing_count + cargo_count
        
        logger.info(f"Reset collections: deleted {vehicle_count} vehicles, {crossing_count} crossings, {cargo_count} cargo manifests")
        
        return {
            "success": True,
            "message": "All collections have been reset successfully",
            "deleted_counts": {
                "vehicle": vehicle_count,
                "crossing": crossing_count,
                "cargo_manifest": cargo_count
            },
            "total_deleted": total_deleted
        }
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Error resetting collections: {e}")
        raise HTTPException(status_code=500, detail=f"Error resetting collections: {str(e)}")

