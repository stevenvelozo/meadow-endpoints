-- Meadow Endpoints Test Database Initialization for Cloud9
-- steven velozo <steven@velozo.com>
-- MIT License

CREATE DATABASE IF NOT EXISTS FableTest;

-- Use the database for fable tests
USE FableTest;

-- Create the table if it isn't there
CREATE TABLE IF NOT EXISTS TestRequest 
(
    IDTestRequest INT UNSIGNED NOT NULL AUTO_INCREMENT, 
    GUIDTestRequest CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000', 
    CreateDate DATETIME, 
    CreatingIDUser INT NOT NULL DEFAULT '0', 
    UpdateDate DATETIME, 
    UpdatingIDUser INT NOT NULL DEFAULT '0', 
    Deleted TINYINT NOT NULL DEFAULT '0', 
    DeleteDate DATETIME, 
    DeletingIDUser INT NOT NULL DEFAULT '0', 
    Name CHAR(128) NOT NULL DEFAULT '', 
    UserID CHAR(128) NOT NULL DEFAULT '', 

    PRIMARY KEY (IDTestRequest)
);

-- Clear out results from a previous test
TRUNCATE TABLE TestRequest;