-- Data Model -- Generated 2022-03-29T11:36:36.684Z

-- This script creates the following tables:
-- Table ----------------------------------------- Column Count ----------------
--   Book                                                   16
--   BookAuthorJoin                                          4
--   Author                                                 10
--   BookPrice                                              15
--   Review                                                 12



--   [ Book ]
CREATE TABLE IF NOT EXISTS
    Book
    (
        IDBook INT UNSIGNED NOT NULL AUTO_INCREMENT,
        GUIDBook CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
        CreateDate DATETIME,
        CreatingIDUser INT NOT NULL DEFAULT '0',
        UpdateDate DATETIME,
        UpdatingIDUser INT NOT NULL DEFAULT '0',
        Deleted TINYINT NOT NULL DEFAULT '0',
        DeleteDate DATETIME,
        DeletingIDUser INT NOT NULL DEFAULT '0',
        Title CHAR(200) NOT NULL DEFAULT '',
        Type CHAR(32) NOT NULL DEFAULT '',
        Genre CHAR(128) NOT NULL DEFAULT '',
        ISBN CHAR(64) NOT NULL DEFAULT '',
        Language CHAR(12) NOT NULL DEFAULT '',
        ImageURL CHAR(254) NOT NULL DEFAULT '',
        PublicationYear INT NOT NULL DEFAULT '0',

        PRIMARY KEY (IDBook)
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



--   [ BookAuthorJoin ]
CREATE TABLE IF NOT EXISTS
    BookAuthorJoin
    (
        IDBookAuthorJoin INT UNSIGNED NOT NULL AUTO_INCREMENT,
        GUIDBookAuthorJoin CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
        IDBook INT NOT NULL DEFAULT '0',
        IDAuthor INT NOT NULL DEFAULT '0',

        PRIMARY KEY (IDBookAuthorJoin)
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



--   [ Author ]
CREATE TABLE IF NOT EXISTS
    Author
    (
        IDAuthor INT UNSIGNED NOT NULL AUTO_INCREMENT,
        GUIDAuthor CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
        CreateDate DATETIME,
        CreatingIDUser INT NOT NULL DEFAULT '0',
        UpdateDate DATETIME,
        UpdatingIDUser INT NOT NULL DEFAULT '0',
        Deleted TINYINT NOT NULL DEFAULT '0',
        DeleteDate DATETIME,
        DeletingIDUser INT NOT NULL DEFAULT '0',
        Name CHAR(200) NOT NULL DEFAULT '',

        PRIMARY KEY (IDAuthor)
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



--   [ BookPrice ]
CREATE TABLE IF NOT EXISTS
    BookPrice
    (
        IDBookPrice INT UNSIGNED NOT NULL AUTO_INCREMENT,
        GUIDBookPrice CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
        CreateDate DATETIME,
        CreatingIDUser INT NOT NULL DEFAULT '0',
        UpdateDate DATETIME,
        UpdatingIDUser INT NOT NULL DEFAULT '0',
        Deleted TINYINT NOT NULL DEFAULT '0',
        DeleteDate DATETIME,
        DeletingIDUser INT NOT NULL DEFAULT '0',
        Price DECIMAL(8,2),
        StartDate DATETIME,
        EndDate DATETIME,
        Discountable TINYINT NOT NULL DEFAULT '0',
        CouponCode CHAR(16) NOT NULL DEFAULT '',
        IDBook INT NOT NULL DEFAULT '0',

        PRIMARY KEY (IDBookPrice)
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



--   [ Review ]
CREATE TABLE IF NOT EXISTS
    Review
    (
        IDReviews INT UNSIGNED NOT NULL AUTO_INCREMENT,
        GUIDReviews CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
        CreateDate DATETIME,
        CreatingIDUser INT NOT NULL DEFAULT '0',
        UpdateDate DATETIME,
        UpdatingIDUser INT NOT NULL DEFAULT '0',
        Deleted TINYINT NOT NULL DEFAULT '0',
        DeleteDate DATETIME,
        DeletingIDUser INT NOT NULL DEFAULT '0',
        Text TEXT,
        Rating INT NOT NULL DEFAULT '0',
        IDBook INT NOT NULL DEFAULT '0',

        PRIMARY KEY (IDReviews)
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
