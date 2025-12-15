CREATE OR REFRESH STREAMING TABLE bronze_vehicle 
TBLPROPERTIES ('delta.feature.variantType-preview' = 'supported');

CREATE FLOW
  vehicle_incremental_flow_bronze
AS INSERT INTO
  bronze_vehicle BY NAME
SELECT 
  PARSE_JSON(value) as doc, 
  "mongodb_cdc" as schema_spec
FROM STREAM read_files(
  "/Volumes/stafford_1_classic_catalog/crossy/mongodb_output/incremental/",
  format => "text",
  wholeText => true,
  schema => "value STRING"
);

CREATE FLOW
  bronze_vehicle_backfill_flow
AS INSERT INTO ONCE
  bronze_vehicle BY NAME
SELECT 
  PARSE_JSON(value) as doc,
  "vehicle_raw" as schema_spec
FROM read_files(
  "/Volumes/stafford_1_classic_catalog/crossy/mongodb_output/backfill/",
  format => "text",
  schema => "value STRING"
);
