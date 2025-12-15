 CREATE TEMPORARY VIEW vehicle_backfill_view AS
  SELECT 
    cast(doc:_id as string) as _id,
    cast(doc:license_plate_number as string) as license_plate_number,
    cast(doc:owner_name as string) as owner_name,
    cast(doc:passenger_count as int) as passenger_count,
    cast(doc:registration_details.expiration_date as date) as expiration_date,
    cast(doc:registration_details.state as string) as registration_state,
    cast(doc:vehicle_type as string) as vehicle_type,
    "insert" as operationType,
    timestamp("2025-01-01T12:00:00") as wallTime,
    doc
  FROM STREAM(bronze_vehicle)
  WHERE schema_spec = "vehicle_raw";

CREATE TEMPORARY VIEW vehicle_incremental_view AS
  SELECT 
    cast(doc:documentKey._id as string) as _id,
    cast(doc:operationType as string) as operationType,
    cast(doc:wallTime as timestamp) as wallTime,
    cast(doc:fullDocument.license_plate_number as string) as license_plate_number,
    cast(doc:fullDocument.owner_name as string) as owner_name,
    cast(doc:fullDocument.passenger_count as int) as passenger_count,
    cast(doc:fullDocument.registration_details.expiration_date as date) as expiration_date,
    cast(doc:fullDocument.registration_details.state as string) as registration_state,
    cast(doc:fullDocument.vehicle_type as string) as vehicle_type,
    doc
  FROM STREAM(bronze_vehicle)
  WHERE schema_spec = "mongodb_cdc";

CREATE OR REFRESH STREAMING TABLE silver_vehicle
TBLPROPERTIES ('delta.feature.variantType-preview' = 'supported');

CREATE FLOW vehicle_incremental_flow AS
AUTO CDC INTO silver_vehicle
FROM STREAM(vehicle_incremental_view)
KEYS (_id)
APPLY AS DELETE WHEN operationType = "delete"
SEQUENCE BY wallTime
STORED AS SCD TYPE 1;

CREATE FLOW vehicle_backfill_flow AS
AUTO CDC INTO silver_vehicle
FROM STREAM(vehicle_backfill_view)
KEYS (_id)
APPLY AS DELETE WHEN operationType = "delete"
SEQUENCE BY wallTime;