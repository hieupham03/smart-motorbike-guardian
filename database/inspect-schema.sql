-- Read-only inspection after Flyway migration; no credentials or user records.
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

SELECT version, description, type, success
FROM flyway_schema_history
ORDER BY installed_rank;
