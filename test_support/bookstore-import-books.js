/*
    Import Books directly from CSV to SQL.

    An example of how to use the Meadow DALs directly.
*/
/**
* @license MIT
* @author <steven@velozo.com>
*/

// Server Settings
const _Settings = require('./bookstore-configuration.json');
// Fable is logging and settings
const libFable = require('fable');
// Official MySQL Client
const libMySQL = require('mysql2');
// Meadow is the DAL
const libMeadow = require('meadow');

const libAsync = require('async');

let _Fable = libFable.new(_Settings);
let _Meadow = libMeadow.new(_Fable);

_Fable.log.info("Application is starting up...");

_Fable.log.info("...Creating SQL Connection pools at "+_Fable.settings.MySQL.Server+"...");
// Setup SQL Connection Pool
_Fable.MeadowMySQLConnectionPool = libMySQL.createPool
	(
		{
			connectionLimit: _Fable.settings.MySQL.ConnectionPoolLimit,
			host: _Fable.settings.MySQL.Server,
			port: _Fable.settings.MySQL.Port,
			user: _Fable.settings.MySQL.User,
			password: _Fable.settings.MySQL.Password,
			database: _Fable.settings.MySQL.Database,
			namedPlaceholders: true
		}
	);

// Create DAL objects
let _DAL = {};
const _BookStoreModel = require (__dirname+'/model/json_schema/BookStore-Extended.json');
const _BookStoreTableList = Object.keys(_BookStoreModel.Tables);
_Fable.log.info(`...Creating ${_BookStoreTableList.length} DAL entries...`);
for (let i = 0; i < _BookStoreTableList.length; i++)
{
	let tmpDALEntityName = _BookStoreTableList[i];
	_Fable.log.info(`   -> Creating the ${tmpDALEntityName} DAL...`);
	_DAL[tmpDALEntityName] = _Meadow.loadFromPackage(__dirname+'/model/meadow_schema/BookStore-MeadowSchema-'+tmpDALEntityName+'.json');
	_DAL[tmpDALEntityName].setProvider('MySQL');
	_DAL[tmpDALEntityName].setIDUser(99999);
}

const libPapa = require('papaparse');
const libFS = require('fs');

const _BookData = libFS.readFileSync(`${__dirname}/data/books.csv`, 'utf8');

let tmpBookMap = {};
let tmpAuthorMap = {};

let fImportBooks = (fCallback) =>
{
    console.log('Import operation executing...');
    let tmpCallback = (typeof(fCallback) == 'function') ? fCallback : ()=>{};

    libPapa.parse(_BookData,
        {
            delimiter: ",",
            header: true,
            complete:
                (pResults) =>
                {
                    libAsync.waterfall([
                        (fStageComplete) =>
                        {
                            // Enumerate and insert each book
                            libAsync.eachLimit(pResults.data, 10,
                                (pBookDataRow, fCallback) =>
                                {
                                    let tmpRecordToCreate = (
                                        {
                                            Title: pBookDataRow.original_title,
                                            PublicationYear: isNaN(parseInt(pBookDataRow.original_publication_year, 10)) ? 0 : parseInt(pBookDataRow.original_publication_year, 10),
                                            ISBN: pBookDataRow.isbn,
                                            Type: 'Paper',
                                            Genre: 'UNKNOWN',
                                            Language: pBookDataRow.language_code,
                                            ImageURL: pBookDataRow.image_url
                                        });
                                    let tmpQuery = _DAL.Book.query;
                                    //tmpQuery.setLogLevel(5);
                                    tmpQuery.addRecord(tmpRecordToCreate);
                                    _DAL.Book.doCreate(tmpQuery,
                                        (pError, pQuery, pQueryRead, pRecord)=>
                                        {
                                            // Add it to the book map
                                            if (!pError)
                                            {
                                                tmpBookMap[pBookDataRow.id] = pRecord.IDBook;
                                                //_Fable.log.info('Imported book ID '+pRecord.IDBook+' title ['+pRecord.Title+']');
                                            }
                                            fCallback(pError);
                                        });

                                },
                                (pError)=>
                                {
                                    _Fable.log.info('...Book Import operation complete!');
                                    fStageComplete()
                                });
                        },
                        (fStageComplete) =>
                        {
                            // Enumerate and insert each author
                            libAsync.eachLimit(pResults.data, 10,
                                (pBookDataRow, fCallback) =>
                                {
                                    if (!pBookDataRow.hasOwnProperty('authors'))
                                        return fCallback();

                                    let tmpAuthorsToCreate = pBookDataRow.authors.split(',');

                                    libAsync.eachLimit(tmpAuthorsToCreate, 1,
                                        (pAuthor, fAuthorInsertCallback)=>
                                        {
                                            if (tmpAuthorMap.hasOwnProperty(pAuthor))
                                            {
                                                return fAuthorInsertCallback();
                                            }
                                            else
                                            {
                                                tmpAuthorMap[pAuthor] = false;
                                            }
                                            let tmpRecordToCreate = (
                                                {
                                                    Name: pAuthor
                                                });
                                            let tmpQuery = _DAL.Author.query.addRecord(tmpRecordToCreate);
                                            _DAL.Author.doCreate(tmpQuery,
                                                (pError, pQuery, pQueryRead, pRecord)=>
                                                {
                                                    if (!pError)
                                                    {
                                                        tmpAuthorMap[pRecord.Name] = pRecord.IDAuthor;
                                                        //_Fable.log.info('Imported Author ID '+pRecord.IDAuthor+' named ['+pRecord.Name+']');
                                                    }
                                                    return fAuthorInsertCallback(pError);
                                                });
                                        },
                                        (pError)=>
                                        {
                                            return fCallback(pError);
                                        });
                                },
                                (pError)=>
                                {
                                    _Fable.log.info('...Author Import operation complete!');
                                    fStageComplete();
                                });
                        },
                        (fStageComplete) =>
                        {
                            // Create Book->Author joins
                            libAsync.eachLimit(pResults.data, 10,
                                (pBookDataRow, fCallback) =>
                                {
                                    if (!pBookDataRow.hasOwnProperty('authors'))
                                        return fCallback();

                                    let tmpAuthorJoinsToCreate = pBookDataRow.authors.split(',');

                                    libAsync.eachLimit(tmpAuthorJoinsToCreate, 1,
                                        (pAuthor, fAuthorJoinInsertCallback)=>
                                        {
                                            let tmpRecordToCreate = (
                                                {
                                                    IDBook: tmpBookMap[pBookDataRow.id],
                                                    IDAuthor: tmpAuthorMap[pAuthor]
                                                });
                                            let tmpQuery = _DAL.BookAuthorJoin.query.addRecord(tmpRecordToCreate);
                                            _DAL.BookAuthorJoin.doCreate(tmpQuery,
                                                (pError, pQuery, pQueryRead, pRecord)=>
                                                {
                                                    if (!pError)
                                                    {
                                                        //_Fable.log.info(`Joined author ${pAuthor} ID ${pRecord.IDAuthor} to book ID ${pRecord.IDBook}`);
                                                    }
                                                    return fAuthorJoinInsertCallback(pError);
                                                });
                                        },
                                        (pError)=>
                                        {
                                            return fCallback(pError);
                                        });
                                },
                                (pError)=>
                                {
                                    _Fable.log.info('...Join Import operation complete!');
                                    return fStageComplete(pError);
                                });
                        }
                    ],
                    (pError)=>
                    {
                        _Fable.log.info('Full import operation has completed!')
                        tmpCallback(pError);
                    });
                }
        });
}

module.exports = fImportBooks;