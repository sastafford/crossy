"""
MongoDB database connection and operations using Motor (async driver).
"""
import logging
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional, List, Dict
from .config import settings

logger = logging.getLogger(__name__)


class MongoDB:
    """MongoDB connection manager."""
    
    client: Optional[AsyncIOMotorClient] = None
    database: Optional[AsyncIOMotorDatabase] = None
    
    async def connect(self):
        """Establish connection to MongoDB."""
        try:
            self.client = AsyncIOMotorClient(settings.mongodb_uri)
            self.database = self.client[settings.database_name]
            
            # Test the connection
            await self.client.admin.command('ping')
            logger.info(f"Connected to MongoDB database: {settings.database_name}")
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            self.client = None
            self.database = None
    
    async def disconnect(self):
        """Close MongoDB connection."""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    async def is_connected(self) -> bool:
        """Check if MongoDB is connected."""
        if self.client is None or self.database is None:
            return False
        
        try:
            await self.client.admin.command('ping')
            return True
        except Exception as e:
            logger.error(f"MongoDB connection check failed: {e}")
            return False
    
    def get_collection(self, collection_name: str):
        """Get a MongoDB collection."""
        if self.database is None:
            raise RuntimeError("Database not connected")
        return self.database[collection_name]
    
    async def insert_vehicle(self, vehicle_data: dict) -> str:
        """Insert vehicle details into vehicle collection."""
        collection = self.get_collection("vehicle")
        result = await collection.insert_one(vehicle_data)
        return str(result.inserted_id)
    
    async def insert_crossing(self, crossing_data: dict) -> str:
        """Insert crossing event into crossing collection."""
        collection = self.get_collection("crossing")
        result = await collection.insert_one(crossing_data)
        return str(result.inserted_id)
    
    async def insert_cargo(self, cargo_data: dict) -> str:
        """Insert cargo manifest into cargo_manifest collection."""
        collection = self.get_collection("cargo_manifest")
        result = await collection.insert_one(cargo_data)
        return str(result.inserted_id)
    
    async def count_documents(self, collection_name: str) -> int:
        """
        Count total documents in a collection.
        """
        if not await self.is_connected():
            raise RuntimeError("Database not connected")
        
        collection = self.get_collection(collection_name)
        return await collection.count_documents({})
    
    async def list_documents(self, collection_name: str, skip: int = 0, limit: int = 20) -> List[Dict]:
        """
        List documents from a collection with their IDs and display labels.
        Supports pagination with skip and limit parameters.
        Returns list of dictionaries with _id and display_label fields.
        """
        if not await self.is_connected():
            raise RuntimeError("Database not connected")
        
        collection = self.get_collection(collection_name)
        cursor = collection.find().skip(skip).limit(limit).sort("_id", -1)  # Sort by newest first
        
        documents = []
        async for doc in cursor:
            # Convert ObjectId to string
            doc_dict = {**doc, "_id": str(doc["_id"])}
            
            # Generate display label based on collection type
            display_label = self._generate_display_label(collection_name, doc_dict)
            doc_dict["display_label"] = display_label
            
            documents.append(doc_dict)
        
        return documents
    
    async def get_document(self, collection_name: str, document_id: str) -> Optional[Dict]:
        """
        Retrieve a specific document by ID from a collection.
        Returns the document as a dictionary with _id converted to string, or None if not found.
        """
        if not await self.is_connected():
            raise RuntimeError("Database not connected")
        
        try:
            # Convert string ID to ObjectId
            obj_id = ObjectId(document_id)
        except Exception as e:
            logger.error(f"Invalid document ID format: {e}")
            return None
        
        collection = self.get_collection(collection_name)
        doc = await collection.find_one({"_id": obj_id})
        
        if doc:
            # Convert ObjectId to string
            doc_dict = {**doc, "_id": str(doc["_id"])}
            return doc_dict
        
        return None
    
    async def update_document(self, collection_name: str, document_id: str, document_data: dict) -> bool:
        """
        Update an existing document in a collection.
        Removes _id from document_data before updating to avoid conflicts.
        Returns True if document was updated, False if not found.
        """
        if not await self.is_connected():
            raise RuntimeError("Database not connected")
        
        try:
            # Convert string ID to ObjectId
            obj_id = ObjectId(document_id)
        except Exception as e:
            logger.error(f"Invalid document ID format: {e}")
            raise ValueError(f"Invalid document ID format: {e}")
        
        # Remove _id from update data if present (we don't want to change it)
        update_data = {k: v for k, v in document_data.items() if k != "_id"}
        
        collection = self.get_collection(collection_name)
        result = await collection.update_one(
            {"_id": obj_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            logger.warning(f"Document {document_id} not found in collection {collection_name}")
            return False
        
        logger.info(f"Updated document {document_id} in collection {collection_name}")
        return True
    
    async def delete_document(self, collection_name: str, document_id: str) -> bool:
        """
        Delete a document from a collection by ID.
        Returns True if document was deleted, False if not found.
        """
        if not await self.is_connected():
            raise RuntimeError("Database not connected")
        
        try:
            # Convert string ID to ObjectId
            obj_id = ObjectId(document_id)
        except Exception as e:
            logger.error(f"Invalid document ID format: {e}")
            raise ValueError(f"Invalid document ID format: {e}")
        
        collection = self.get_collection(collection_name)
        result = await collection.delete_one({"_id": obj_id})
        
        if result.deleted_count == 0:
            logger.warning(f"Document {document_id} not found in collection {collection_name}")
            return False
        
        logger.info(f"Deleted document {document_id} from collection {collection_name}")
        return True
    
    async def delete_all_documents(self, collection_name: str) -> int:
        """
        Delete all documents from a collection.
        Returns the number of documents deleted.
        """
        if not await self.is_connected():
            raise RuntimeError("Database not connected")
        
        collection = self.get_collection(collection_name)
        result = await collection.delete_many({})
        
        deleted_count = result.deleted_count
        logger.info(f"Deleted {deleted_count} documents from collection {collection_name}")
        return deleted_count
    
    def _generate_display_label(self, collection_name: str, doc: Dict) -> str:
        """Generate a display label for a document based on its collection type."""
        if collection_name == "vehicle":
            license_plate = doc.get("license_plate_number", "Unknown")
            owner = doc.get("owner_name", "Unknown")
            return f"{license_plate} - {owner}"
        elif collection_name == "crossing":
            timestamp = doc.get("timestamp", "Unknown")
            checkpoint = doc.get("interior_checkpoints", "Unknown")
            return f"{timestamp} - {checkpoint}"
        elif collection_name == "cargo_manifest":
            manifest_id = doc.get("manifest_id", "Unknown")
            cargo_type = doc.get("cargo_type", "Unknown")
            return f"{manifest_id} - {cargo_type}"
        else:
            # Fallback: use _id
            return str(doc.get("_id", "Unknown"))


# Global MongoDB instance
mongodb = MongoDB()


async def get_database() -> MongoDB:
    """Dependency to get database instance."""
    return mongodb

