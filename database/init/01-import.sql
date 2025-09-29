-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Source your original SQL file
SOURCE /docker-entrypoint-initdb.d/studio_db.sql;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;