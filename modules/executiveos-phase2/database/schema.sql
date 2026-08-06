CREATE TABLE IF NOT EXISTS eos_entities (
  id text PRIMARY KEY,
  collection text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS eos_entities_collection_created_idx ON eos_entities(collection, created_at DESC);
CREATE INDEX IF NOT EXISTS eos_entities_payload_gin_idx ON eos_entities USING gin(payload);
