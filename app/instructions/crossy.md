# CROSSY

## PURPOSE

The purpose of the Crossy application is to mimic vehicle crossings at the United States Border Patrol Interior Checkpoints. 

## View Modes

- Users must be able to view this generated data in either a Form (with editable fields) or a raw JSON viewer
- The raw JSON should also be editable
- There should be a toggle button to switch seamlessly between Form and JSON viewer modes.

## Data Generation

There must be a single button labeled "Generate" that, when pressed, generates all fields of Vehicle Details, Crossing Event data, and Cargo Information using randomized (but realistic) data. If the generate record is pressed the second account, then the data is reset to new values.  

## Submission

- There should be a button labeled "SUBMIT" that saves the currently displayed data to both:
  - The local filesystem (as a JSON file). 
   - <collection>_<datetime>.json 
  - A MongoDB Atlas collection within a database named crossy
- After the form is submitted, clear the form and provide an indication that the submission was successful.
- No requirement to view submission history

## Data

A single crossing record will consist of vehicle details, crossing event data, and optionally cargo information. Cargo information is included if the crossing event purpose is shipping.

- Vehicle Details
 - License plate number - the format is a two letter state abbreviation, three letters, and three numbers
 - vehicle type - sedan, truck, motorcycle, tractor trailer, van
 - owner name
 - registration details - this should include the registration state and expiration date
 - passenger count
- Crossing Event Data 
 - Timestamp - use ISO 8601 date timestamps
 - Interior checkpoints: use the names provided in the interior checkpoint data below  
 - Direction: inbound or outbound 
 - Lane assignment - number between 1 and 10 
 - Crossing Purpose - personal, business, shipping
 - secondary inspection flag.
- Cargo Information
 - Manifest ID - the manifest format is the following
   - Carrier Code: 4 letters (Standard Carrier Alpha Code, or SCAC)
   - Year: last 2 digits representing the year
   - Sequence Number: 6 to 10 numerical digits, unique for each manifest issued by that carrier in a given year
 - Cargo Type: Choose One: [General Merchandise, Machinery and Equipment, Electronics, Automotive Parts, Textiles and Apparel, Food and Beverages, Agricultural Products, Chemicals (non-hazardous), Hazardous Materials (Hazmat), Pharmaceuticals,Medical Supplies, Livestock and Animals, Furniture, Metal and Steel Products, Wood and Lumber, Plastics and Rubber Goods, Household Goods/Personal Effects, Paper Products, Building Materials, Containers , Petroleum Products, Minerals and Ores, Toys and Games]
 - hazardous material flag - true or false
 - container ID - a 10 alphanumeric identifier

### JSON Examples

#### Vehicle Details

Mongodb collection name: vehicle

```
{
  "license_plate_number": "TX-ABC-123",
  "vehicle_type": "truck",
  "owner_name": "John Doe",
  "registration_details": {
    "state": "TX",
    "expiration_date": "2026-03-15"
  },
  "passenger_count": 2
}

```

Mongodb collection name: crossing

```
{
  "timestamp": "2025-10-30T13:10:00Z",
  "interior_checkpoints": "Falfurrias",
  "direction": "Inbound",
  "lane_assignment": 4,
  "crossing_purpose": "personal",
  "secondary_inspection_flag": true
}

```

Mongodb collection name: cargo_manifest

```
{
  "manifest_id": "ABCD2500123456",
  "cargo_type": "Electronics",
  "hazardous_material": false,
  "container_id": "CONT33445X"
}
```

## Additional Requirements

- All generated or edited data must always be consistent between both view modes.
- Include form validation where relevant (e.g., license plate format, non-negative passenger counts).
- Show a notification for success/failure after submission to filesystem and database.
- Include a green circle indicator that the connection to MongoDB is successful.  If it is not successful, the indicator should be a red circle.  

# Reference Data

## United States Border Patrol Interior Checkpoints

### Texas

- East El Paso: US 62 east / US 180 east –– 33 miles east of El Paso – 31°49′35″N 105°55′05″W
- Sierra Blanca: I-10 east – Between El Paso and Van Horn, five miles west of Sierra Blanca – 31°11′30″N 105°25′47″W
- Marfa: US 67 north (Marfa) – 4.5 miles south of Marfa – 30°15′06″N 104°02′58″W
- Alpine: SH 118 north (Alpine) – Ten miles south of Alpine – 30°11′54″N 103°34′46″W
- Marathon: US 385 north (Marathon) – 4.5 miles south of Marathon – 30°08′16″N 103°14′18″W
- Eagle Pass: US 277 north (Eagle Pass/Carrizo Springs) – 30 miles east-southeast of Eagle Pass – 28°37′33″N 100°03′33″W
- Del Rio: US 377 north (Del Rio) – 25 miles north of Del Rio on U.S. Route 377 – 29°42′48″N 100°49′46″W
- Brackettville: US 90 east (Brackettville/Uvalde) – 60 miles east of Del Rio – 29°12′58″N 99°56′33″W
- East Eagle Pass: US 57 north – 11 miles east of Eagle Pass on U.S. Route 57 – 28°47′50″N 100°22′05″W
- Laredo-83: US 83 north – 35 miles north of Laredo – 27°59′13″N 99°31′39″W
- Laredo-35: I-35 north – 29 miles north of Laredo – 27°54′18″N 99°23′38″W
- Freer: US 59 east (Freer) – 16 miles west of Freer[a] – 27°46′27″N 98°50′44″W
- Oilton: SH 359 east (Oilton) – Six miles east of Oilton – 27°26′36″N 98°53′15″W
- Hebbronville: SH 16 north (Hebbronville) – One mile south of Hebbronville – 27°16′59″N 98°41′36″W
- Hebbronville_2: FM 1017 north (Hebbronville #2) – 50 yards south on FM 1017 at "T" intersection of State Highway 285. – 27°17′48″N 98°39′47″W
- Falfurrias: US 281 north (Falfurrias) – 14 miles south of Falfurrias[b] – 27°01′30″N 98°08′18″W (See Brooks County, Texas.)
- Sarita: US 77 north (Sarita) – 14 miles south of Sarita[c] – 27°00′58″N 97°47′39″W
- Brownsville: SH 4 west (Brownsville) – On Boca Chica Highway (SH 4) leading away from Boca Chica Beach – 25°55′25″N 97°22′19″W

# Architecture

- No authentication for the Crossy Application is required.  This is a demo app not to be used in production.  

## Filesystem

- Persist the JSON documents under ./crossy/data

## Backend

- Use the FastAPI backend pattern
- Data will be persisted to the filesystem and MongoDB
- The credentials for mongodb will be found under crossy/.env
- The database name is Crossy
