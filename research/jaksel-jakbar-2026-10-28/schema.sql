PRAGMA foreign_keys = ON;
CREATE TABLE places (
  id TEXT PRIMARY KEY, name TEXT, city TEXT NOT NULL CHECK(city IN ('Jakarta Selatan','Jakarta Barat')),
  district TEXT NOT NULL, category TEXT NOT NULL,
  latitude REAL NOT NULL CHECK(latitude BETWEEN -90 AND 90),
  longitude REAL NOT NULL CHECK(longitude BETWEEN -180 AND 180),
  coordinate_method TEXT NOT NULL, address TEXT, cuisine TEXT, opening_hours TEXT,
  address_source_url TEXT, name_source_url TEXT,
  google_rating REAL CHECK(google_rating BETWEEN 1 AND 5),
  google_review_count INTEGER CHECK(google_review_count >= 0), google_maps_url TEXT, photo_url TEXT,
  google_hours_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(google_hours_json)), google_cid TEXT,
  primary_source_url TEXT NOT NULL, operating_status TEXT NOT NULL, verification_status TEXT NOT NULL,
  possible_duplicate_group TEXT, observed_at TEXT NOT NULL
);
CREATE INDEX places_region ON places(city,district);
CREATE INDEX places_coordinates ON places(latitude,longitude);
CREATE TABLE place_sources (
  place_id TEXT NOT NULL REFERENCES places(id), provider TEXT NOT NULL, source_id TEXT NOT NULL,
  source_url TEXT NOT NULL, observed_at TEXT NOT NULL, source_updated_at TEXT, license TEXT NOT NULL,
  payload_json TEXT NOT NULL CHECK(json_valid(payload_json)), PRIMARY KEY(provider,source_id)
);
CREATE TABLE google_reviews (
  place_id TEXT NOT NULL REFERENCES places(id), author TEXT NOT NULL, author_url TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5), excerpt TEXT NOT NULL,
  source_url TEXT NOT NULL, observed_at TEXT NOT NULL, PRIMARY KEY(place_id,author_url)
);
CREATE TABLE research_candidates (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL, address TEXT NOT NULL,
  food_mentioned TEXT NOT NULL, source_url TEXT NOT NULL, observed_at TEXT NOT NULL,
  google_match_status TEXT NOT NULL, place_id TEXT REFERENCES places(id)
);
CREATE TABLE collection_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL CHECK(json_valid(value)));
CREATE TABLE enrichment_attempts (
  place_id TEXT PRIMARY KEY REFERENCES places(id), status TEXT NOT NULL,
  last_attempt_at TEXT, capture_count INTEGER NOT NULL CHECK(capture_count >= 0),
  limited_public_view INTEGER NOT NULL CHECK(limited_public_view IN (0,1)),
  evidence_json TEXT NOT NULL CHECK(json_valid(evidence_json))
);
CREATE TABLE discovery_places (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL CHECK(city IN ('Jakarta Selatan','Jakarta Barat')),
  district TEXT NOT NULL, category TEXT NOT NULL, latitude REAL NOT NULL, longitude REAL NOT NULL,
  address TEXT, confidence REAL CHECK(confidence BETWEEN 0 AND 1), operating_status TEXT,
  source_url TEXT NOT NULL, address_locality_conflict INTEGER NOT NULL CHECK(address_locality_conflict IN (0,1)),
  sources_json TEXT NOT NULL CHECK(json_valid(sources_json))
);
CREATE INDEX discovery_region ON discovery_places(city,district);
CREATE VIEW all_food_places AS
SELECT id,name,city,district,category,latitude,longitude,address,google_rating,google_review_count,
       operating_status,primary_source_url AS source_url,'core' AS data_layer,NULL AS source_confidence,verification_status
FROM places
UNION ALL
SELECT 'overture/' || d.id,d.name,d.city,d.district,d.category,d.latitude,d.longitude,d.address,NULL,NULL,
       d.operating_status,d.source_url,'overture_discovery',d.confidence,'open_data_candidate'
FROM discovery_places d
WHERE NOT EXISTS (SELECT 1 FROM place_sources s WHERE s.provider='overture' AND s.source_id=d.id);
CREATE VIEW enrichment_queue AS
SELECT id,name,city,district,category,primary_source_url,
  CASE WHEN name IS NULL THEN 'missing_name'
       WHEN possible_duplicate_group IS NOT NULL THEN 'possible_duplicate'
       WHEN verification_status='google_branch_matched' THEN 'needs_google_details'
       ELSE 'needs_google_match' END AS reason
FROM places WHERE verification_status IN ('osm_only','open_data_matched','google_branch_matched') OR possible_duplicate_group IS NOT NULL;
