"""
Random data generation for border crossing records.
"""
import random
import string
from datetime import datetime, timedelta
from typing import Optional


# Reference data
TEXAS_CHECKPOINTS = [
    "East El Paso",
    "Sierra Blanca",
    "Marfa",
    "Alpine",
    "Marathon",
    "Eagle Pass",
    "Del Rio",
    "Brackettville",
    "East Eagle Pass",
    "Laredo-83",
    "Laredo-35",
    "Freer",
    "Oilton",
    "Hebbronville",
    "Hebbronville_2",
    "Falfurrias",
    "Sarita",
    "Brownsville"
]

VEHICLE_TYPES = ["sedan", "truck", "motorcycle", "tractor trailer", "van"]

US_STATES = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
]

FIRST_NAMES = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
    "William", "Barbara", "David", "Elizabeth", "Richard", "Susan", "Joseph", "Jessica",
    "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
    "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
    "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
    "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores"
]

DIRECTIONS = ["Inbound", "Outbound"]

CROSSING_PURPOSES = ["personal", "business", "shipping"]

CARGO_TYPES = [
    "General Merchandise",
    "Machinery and Equipment",
    "Electronics",
    "Automotive Parts",
    "Textiles and Apparel",
    "Food and Beverages",
    "Agricultural Products",
    "Chemicals (non-hazardous)",
    "Hazardous Materials (Hazmat)",
    "Pharmaceuticals",
    "Medical Supplies",
    "Livestock and Animals",
    "Furniture",
    "Metal and Steel Products",
    "Wood and Lumber",
    "Plastics and Rubber Goods",
    "Household Goods/Personal Effects",
    "Paper Products",
    "Building Materials",
    "Containers",
    "Petroleum Products",
    "Minerals and Ores",
    "Toys and Games"
]

# Standard Carrier Alpha Codes (SCAC) - sample codes
SCAC_CODES = [
    "ABCD", "EFGH", "IJKL", "MNOP", "QRST", "UVWX", "YZAB", "CDEF",
    "GHIJ", "KLMN", "OPQR", "STUV", "WXYZ", "MAEU", "CMDU", "COSCO"
]


def generate_license_plate() -> str:
    """Generate a random license plate in format XX-YYY-ZZZ."""
    state = random.choice(US_STATES)
    letters = ''.join(random.choices(string.ascii_uppercase, k=3))
    numbers = ''.join(random.choices(string.digits, k=3))
    return f"{state}-{letters}-{numbers}"


def generate_owner_name() -> str:
    """Generate a random owner name."""
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    return f"{first} {last}"


def generate_passenger_count(vehicle_type: str) -> int:
    """Generate appropriate passenger count based on vehicle type."""
    if vehicle_type == "motorcycle":
        return random.randint(0, 2)
    elif vehicle_type == "tractor trailer":
        return random.randint(1, 2)
    else:
        return random.randint(0, 8)


def generate_expiration_date() -> str:
    """Generate a random future expiration date."""
    days_ahead = random.randint(30, 730)  # 30 days to 2 years
    future_date = datetime.now() + timedelta(days=days_ahead)
    return future_date.strftime("%Y-%m-%d")


def generate_vehicle_details() -> dict:
    """Generate random vehicle details."""
    vehicle_type = random.choice(VEHICLE_TYPES)
    state = random.choice(US_STATES)
    
    return {
        "license_plate_number": generate_license_plate(),
        "vehicle_type": vehicle_type,
        "owner_name": generate_owner_name(),
        "registration_details": {
            "state": state,
            "expiration_date": generate_expiration_date()
        },
        "passenger_count": generate_passenger_count(vehicle_type)
    }


def generate_timestamp() -> str:
    """Generate ISO 8601 timestamp (current time or recent past)."""
    # Generate timestamp within the last 24 hours
    hours_ago = random.randint(0, 24)
    minutes_ago = random.randint(0, 59)
    timestamp = datetime.now() - timedelta(hours=hours_ago, minutes=minutes_ago)
    return timestamp.strftime("%Y-%m-%dT%H:%M:%SZ")


def generate_crossing_event() -> dict:
    """Generate random crossing event data."""
    checkpoint = random.choice(TEXAS_CHECKPOINTS)
    direction = random.choice(DIRECTIONS)
    lane = random.randint(1, 10)
    purpose = random.choice(CROSSING_PURPOSES)
    # ~20% probability of secondary inspection
    secondary_inspection = random.random() < 0.20
    
    return {
        "timestamp": generate_timestamp(),
        "interior_checkpoints": checkpoint,
        "direction": direction,
        "lane_assignment": lane,
        "crossing_purpose": purpose,
        "secondary_inspection_flag": secondary_inspection
    }


def generate_manifest_id() -> str:
    """Generate manifest ID in SCAC format: AAAA + YY + NNNNNNNN."""
    scac = random.choice(SCAC_CODES)
    year = datetime.now().strftime("%y")
    # Sequence number: 6 to 10 digits
    seq_length = random.randint(6, 10)
    sequence = ''.join(random.choices(string.digits, k=seq_length))
    return f"{scac}{year}{sequence}"


def generate_container_id() -> str:
    """Generate 10 alphanumeric container ID."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))


def generate_cargo_manifest() -> dict:
    """Generate random cargo manifest data."""
    cargo_type = random.choice(CARGO_TYPES)
    # If cargo type is explicitly hazmat, set flag to true, otherwise random
    hazmat = cargo_type == "Hazardous Materials (Hazmat)" or random.random() < 0.10
    
    return {
        "manifest_id": generate_manifest_id(),
        "cargo_type": cargo_type,
        "hazardous_material": hazmat,
        "container_id": generate_container_id()
    }


def generate_crossing_record() -> dict:
    """
    Generate a complete crossing record.
    Includes cargo only if crossing purpose is 'shipping'.
    """
    vehicle = generate_vehicle_details()
    crossing = generate_crossing_event()
    
    # Only include cargo if purpose is shipping
    cargo = None
    if crossing["crossing_purpose"] == "shipping":
        cargo = generate_cargo_manifest()
    
    return {
        "vehicle": vehicle,
        "crossing": crossing,
        "cargo": cargo
    }


def get_checkpoints() -> list[str]:
    """Return list of available checkpoints."""
    return TEXAS_CHECKPOINTS.copy()


def get_cargo_types() -> list[str]:
    """Return list of cargo types."""
    return CARGO_TYPES.copy()


def get_vehicle_types() -> list[str]:
    """Return list of vehicle types."""
    return VEHICLE_TYPES.copy()


def get_us_states() -> list[str]:
    """Return list of US state abbreviations."""
    return US_STATES.copy()

