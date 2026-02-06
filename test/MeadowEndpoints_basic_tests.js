/**
* Unit tests for Meadow Endpoints
*
* Uses SQLite (better-sqlite3) as the provider so no external database server
* is required.
*
* @license     MIT
*
* @author      Steven Velozo <steven@velozo.com>
*/

var Chai = require("chai");
var Expect = Chai.expect;
var Assert = Chai.assert;

const libFable = require('fable');
const libOrator = require('orator');
const libOratorServiceServerRestify = require('orator-serviceserver-restify');
const libMeadow = require('meadow');
const libMeadowEndpoints = require('../source/Meadow-Endpoints.js');
const libMeadowConnectionSQLite = require('meadow-connection-sqlite');
const libSuperTest = require('supertest');

const _BookSchema = require('../test_support/model/meadow_schema/BookStore-MeadowSchema-Book.json');

// -- Shared state for the test suite --
let _Fable = false;
let _Orator = false;
let _Meadow = false;
let _MeadowEndpoints = false;
let _SuperTest = false;

// Keep track of the API server port
const _APIServerPort = 9876;
const _BaseURL = `http://localhost:${_APIServerPort}/`;

suite
(
	'Meadow-Endpoints',
	() =>
	{
		// Set up Fable + Orator + SQLite + Meadow + Endpoints before all tests
		suiteSetup
		(
			function (fDone)
			{
				this.timeout(30000);

				let tmpSettings = {
					Product: 'MeadowEndpointsTest',
					ProductVersion: '1.0.0',
					APIServerPort: _APIServerPort,
					SQLite:
					{
						SQLiteFilePath: ':memory:'
					},
					LogStreams:
					[
						{
							streamtype: 'console',
							level: 'fatal'
						}
					],
					MeadowEndpointsSessionDataSource: 'None'
				};

				_Fable = new libFable(tmpSettings);

				// Register the Restify service server so Orator uses it
				_Fable.serviceManager.addServiceType('OratorServiceServer', libOratorServiceServerRestify);

				// Register and instantiate the SQLite connection provider
				_Fable.serviceManager.addServiceType('MeadowSQLiteProvider', libMeadowConnectionSQLite);
				_Fable.serviceManager.instantiateServiceProvider('MeadowSQLiteProvider');

				_Fable.MeadowSQLiteProvider.connectAsync(
					(pError) =>
					{
						if (pError)
						{
							return fDone(pError);
						}

						let tmpDB = _Fable.MeadowSQLiteProvider.db;

						// Create the Book table
						tmpDB.exec(
							`CREATE TABLE IF NOT EXISTS Book (
								IDBook INTEGER PRIMARY KEY AUTOINCREMENT,
								GUIDBook TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
								CreateDate TEXT,
								CreatingIDUser INTEGER NOT NULL DEFAULT 0,
								UpdateDate TEXT,
								UpdatingIDUser INTEGER NOT NULL DEFAULT 0,
								Deleted INTEGER NOT NULL DEFAULT 0,
								DeleteDate TEXT,
								DeletingIDUser INTEGER NOT NULL DEFAULT 0,
								Title TEXT NOT NULL DEFAULT '',
								Type TEXT NOT NULL DEFAULT '',
								Genre TEXT NOT NULL DEFAULT '',
								ISBN TEXT NOT NULL DEFAULT '',
								Language TEXT NOT NULL DEFAULT '',
								ImageURL TEXT NOT NULL DEFAULT '',
								PublicationYear INTEGER NOT NULL DEFAULT 0
							);`
						);

						// Seed some test data
						let tmpInsert = tmpDB.prepare(
							`INSERT INTO Book (Title, Type, Genre, ISBN, Language, PublicationYear)
							 VALUES (?, ?, ?, ?, ?, ?)`
						);
						tmpInsert.run('Angels & Demons', 'Novel', 'Thriller', '978-0671027360', 'English', 2000);
						tmpInsert.run('Dune', 'Novel', 'Science Fiction', '978-0441013593', 'English', 1965);
						tmpInsert.run('Neuromancer', 'Novel', 'Science Fiction', '978-0441569595', 'English', 1984);
						tmpInsert.run('Snow Crash', 'Novel', 'Science Fiction', '978-0553380958', 'English', 1992);
						tmpInsert.run('The Da Vinci Code', 'Novel', 'Thriller', '978-0307474278', 'English', 2003);

						// Create the Meadow DAL and endpoints
						_Meadow = libMeadow.new(_Fable, 'Book')
							.setProvider('SQLite')
							.setSchema(_BookSchema.Schema)
							.setJsonSchema(_BookSchema.JsonSchema)
							.setDefaultIdentifier(_BookSchema.DefaultIdentifier)
							.setDefault(_BookSchema.DefaultObject);

						// Initialize Orator (creates and registers the Restify service server)
						_Orator = new libOrator(_Fable, {});
						_Orator.initialize(
							() =>
							{
								// Wire up the Meadow Endpoints
								_MeadowEndpoints = libMeadowEndpoints.new(_Meadow);
								_MeadowEndpoints.connectRoutes(_Orator.serviceServer);

								// Start listening for requests
								_Orator.startService(
									(pStartError) =>
									{
										if (pStartError)
										{
											return fDone(pStartError);
										}
										_SuperTest = libSuperTest(_BaseURL);
										return fDone();
									});
							});
					});
			}
		);

		suiteTeardown
		(
			function (fDone)
			{
				this.timeout(10000);
				if (_Fable && _Fable.MeadowSQLiteProvider && _Fable.MeadowSQLiteProvider.db)
				{
					try { _Fable.MeadowSQLiteProvider.db.close(); } catch (pIgnore) { /* ignore */ }
				}
				if (_Orator && _Orator.serviceServer && _Orator.serviceServer.Active && _Orator.serviceServer.server)
				{
					// Directly close the restify server to avoid hanging on keep-alive connections
					_Orator.serviceServer.server.close(() =>
					{
						_Orator.serviceServer.Active = false;
						fDone();
					});
				}
				else
				{
					fDone();
				}
			}
		);

		// ======================================================================
		// Object Sanity
		// ======================================================================
		suite
		(
			'Object Sanity',
			() =>
			{
				test
				(
					'The class should initialize itself into a happy little object.',
					function (fDone)
					{
						Expect(_MeadowEndpoints).to.be.an('object');
						Expect(_MeadowEndpoints.DAL).to.be.an('object');
						Expect(_MeadowEndpoints.DAL.scope).to.equal('Book');
						Expect(_MeadowEndpoints.controller).to.be.an('object');
						fDone();
					}
				);
				test
				(
					'The constructor should throw without a valid Meadow DAL.',
					function (fDone)
					{
						Expect(() => { new libMeadowEndpoints(); }).to.throw();
						fDone();
					}
				);
				test
				(
					'The MeadowEndpoints class should expose Meadow and BaseController.',
					function (fDone)
					{
						Expect(libMeadowEndpoints.Meadow).to.be.an('object');
						Expect(libMeadowEndpoints.Meadow.new).to.be.a('function');
						Expect(libMeadowEndpoints.BaseController).to.be.a('function');
						Expect(libMeadowEndpoints.new).to.be.a('function');
						fDone();
					}
				);
				test
				(
					'The endpoint version and prefix should be configured.',
					function (fDone)
					{
						Expect(_MeadowEndpoints.EndpointVersion).to.equal('1.0');
						Expect(_MeadowEndpoints.EndpointName).to.equal('Book');
						Expect(_MeadowEndpoints.EndpointPrefix).to.equal('/1.0/Book');
						fDone();
					}
				);
				test
				(
					'Behavior sets should all be enabled by default.',
					function (fDone)
					{
						Expect(_MeadowEndpoints._EnabledBehaviorSets.Create).to.equal(true);
						Expect(_MeadowEndpoints._EnabledBehaviorSets.Read).to.equal(true);
						Expect(_MeadowEndpoints._EnabledBehaviorSets.Reads).to.equal(true);
						Expect(_MeadowEndpoints._EnabledBehaviorSets.Update).to.equal(true);
						Expect(_MeadowEndpoints._EnabledBehaviorSets.Delete).to.equal(true);
						Expect(_MeadowEndpoints._EnabledBehaviorSets.Count).to.equal(true);
						Expect(_MeadowEndpoints._EnabledBehaviorSets.Schema).to.equal(true);
						fDone();
					}
				);
			}
		);

		// ======================================================================
		// Create Endpoints
		// ======================================================================
		suite
		(
			'Create',
			() =>
			{
				test
				(
					'create: create a single record',
					function (fDone)
					{
						_SuperTest
							.post('1.0/Book')
							.send({ Title: 'Batman is Batman', Genre: 'Comic', PublicationYear: 1939 })
							.end(
								(pError, pResponse) =>
								{
									Expect(pError).to.not.exist;
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Title).to.equal('Batman is Batman');
									Expect(tmpResult.Genre).to.equal('Comic');
									Expect(tmpResult.PublicationYear).to.equal(1939);
									Expect(tmpResult.IDBook).to.be.above(0);
									Expect(tmpResult.GUIDBook).to.be.a('string');
									Expect(tmpResult.Deleted).to.equal(0);
									fDone();
								}
							);
					}
				);
				test
				(
					'create: create a record with minimal fields',
					function (fDone)
					{
						_SuperTest
							.post('1.0/Book')
							.send({ Title: 'Minimal Book' })
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Title).to.equal('Minimal Book');
									Expect(tmpResult.IDBook).to.be.above(0);
									fDone();
								}
							);
					}
				);
				test
				(
					'create: should handle an empty body gracefully',
					function (fDone)
					{
						_SuperTest
							.post('1.0/Book')
							.send({})
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									// An empty body should still create a record with defaults
									Expect(tmpResult.IDBook).to.be.above(0);
									Expect(tmpResult.Title).to.equal('');
									fDone();
								}
							);
					}
				);
				test
				(
					'create bulk: create multiple records',
					function (fDone)
					{
						_SuperTest
							.post('1.0/Books')
							.send([
								{ Title: 'Bulk Book A', Genre: 'Fantasy' },
								{ Title: 'Bulk Book B', Genre: 'Romance' },
								{ Title: 'Bulk Book C', Genre: 'Horror' }
							])
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.be.an('array');
									Expect(tmpResult.length).to.equal(3);
									Expect(tmpResult[0].Title).to.equal('Bulk Book A');
									Expect(tmpResult[1].Title).to.equal('Bulk Book B');
									Expect(tmpResult[2].Title).to.equal('Bulk Book C');
									fDone();
								}
							);
					}
				);
			}
		);

		// ======================================================================
		// Read Endpoints
		// ======================================================================
		suite
		(
			'Read',
			() =>
			{
				test
				(
					'read: get a specific record by ID',
					function (fDone)
					{
						_SuperTest
							.get('1.0/Book/1')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.IDBook).to.equal(1);
									Expect(tmpResult.Title).to.equal('Angels & Demons');
									fDone();
								}
							);
					}
				);
				test
				(
					'read: get a second record by ID',
					function (fDone)
					{
						_SuperTest
							.get('1.0/Book/2')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.IDBook).to.equal(2);
									Expect(tmpResult.Title).to.equal('Dune');
									fDone();
								}
							);
					}
				);
				test
				(
					'read: get a record that does not exist',
					function (fDone)
					{
						_SuperTest
							.get('1.0/Book/99999')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									// Should return an error
									Expect(tmpResult).to.have.property('Error');
									fDone();
								}
							);
					}
				);
				test
				(
					'reads: get all records with default pagination',
					function (fDone)
					{
						_SuperTest
							.get('1.0/Books')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.be.an('array');
									// We seeded 5 + created ~4 in prior tests
									Expect(tmpResult.length).to.be.at.least(5);
									fDone();
								}
							);
					}
				);
				test
				(
					'reads: get records with pagination',
					function (fDone)
					{
						_SuperTest
							.get('1.0/Books/0/2')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.be.an('array');
									Expect(tmpResult.length).to.equal(2);
									Expect(tmpResult[0].IDBook).to.equal(1);
									fDone();
								}
							);
					}
				);
				test
				(
					'reads: get records with offset pagination',
					function (fDone)
					{
						_SuperTest
							.get('1.0/Books/2/2')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.be.an('array');
									Expect(tmpResult.length).to.equal(2);
									Expect(tmpResult[0].IDBook).to.equal(3);
									fDone();
								}
							);
					}
				);
				test
				(
					'reads: get records with filter (contains)',
					function (fDone)
					{
						_SuperTest
							.get('1.0/Books/FilteredTo/FBV~Genre~LK~%25Science%25')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.be.an('array');
									Expect(tmpResult.length).to.be.at.least(3);
									tmpResult.forEach((pRecord) =>
									{
										Expect(pRecord.Genre).to.contain('Science');
									});
									fDone();
								}
							);
					}
				);
				test
				(
					'reads: get records with filter and pagination',
					function (fDone)
					{
						_SuperTest
							.get('1.0/Books/FilteredTo/FBV~Genre~LK~%25Science%25/0/1')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.be.an('array');
									Expect(tmpResult.length).to.equal(1);
									Expect(tmpResult[0].Genre).to.contain('Science');
									fDone();
								}
							);
					}
				);
				test
				(
					'reads by: get records filtered by a field value',
					function (fDone)
					{
						_SuperTest
							.get('1.0/Books/By/Genre/Thriller')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.be.an('array');
									Expect(tmpResult.length).to.be.at.least(2);
									tmpResult.forEach((pRecord) =>
									{
										Expect(pRecord.Genre).to.equal('Thriller');
									});
									fDone();
								}
							);
					}
				);
				test
				(
					'reads by: with pagination',
					function (fDone)
					{
						_SuperTest
							.get('1.0/Books/By/Genre/Thriller/0/1')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.be.an('array');
									Expect(tmpResult.length).to.equal(1);
									Expect(tmpResult[0].Genre).to.equal('Thriller');
									fDone();
								}
							);
					}
				);
			}
		);

		// ======================================================================
		// Specialized Read Endpoints
		// ======================================================================
		suite
		(
			'Specialized Read',
			() =>
			{
				test
				(
					'select list: get Hash/Value pairs',
					function (fDone)
					{
						_SuperTest
							.get('1.0/BookSelect')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.be.an('array');
									Expect(tmpResult.length).to.be.at.least(5);
									Expect(tmpResult[0]).to.have.property('Hash');
									Expect(tmpResult[0]).to.have.property('Value');
									fDone();
								}
							);
					}
				);
				test
				(
					'select list: with pagination',
					function (fDone)
					{
						_SuperTest
							.get('1.0/BookSelect/0/2')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.be.an('array');
									Expect(tmpResult.length).to.equal(2);
									fDone();
								}
							);
					}
				);
				test
				(
					'select list: with filter',
					function (fDone)
					{
						_SuperTest
							.get('1.0/BookSelect/FilteredTo/FBV~Genre~EQ~Thriller')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.be.an('array');
									Expect(tmpResult.length).to.be.at.least(2);
									tmpResult.forEach((pRecord) =>
									{
										Expect(pRecord).to.have.property('Hash');
										Expect(pRecord).to.have.property('Value');
									});
									fDone();
								}
							);
					}
				);
				test
				(
					'lite list: get minimal columns',
					function (fDone)
					{
						_SuperTest
							.get('1.0/Books/Lite')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.be.an('array');
									Expect(tmpResult.length).to.be.at.least(5);
									fDone();
								}
							);
					}
				);
				test
				(
					'lite list: with pagination',
					function (fDone)
					{
						_SuperTest
							.get('1.0/Books/Lite/0/3')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.be.an('array');
									Expect(tmpResult.length).to.equal(3);
									fDone();
								}
							);
					}
				);
				test
				(
					'max: get the maximum value for a column',
					function (fDone)
					{
						_SuperTest
							.get('1.0/Book/Max/PublicationYear')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									// ReadMax returns a single record (not an array)
									Expect(tmpResult).to.be.an('object');
									Expect(tmpResult).to.have.property('PublicationYear');
									// The max publication year in our seed data is 2003
									Expect(tmpResult.PublicationYear).to.be.at.least(2003);
									fDone();
								}
							);
					}
				);
			}
		);

		// ======================================================================
		// Update Endpoints
		// ======================================================================
		suite
		(
			'Update',
			() =>
			{
				test
				(
					'update: update a single record',
					function (fDone)
					{
						_SuperTest
							.put('1.0/Book')
							.send({ IDBook: 1, Title: 'Angels & Demons (Updated)' })
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.IDBook).to.equal(1);
									Expect(tmpResult.Title).to.equal('Angels & Demons (Updated)');
									fDone();
								}
							);
					}
				);
				test
				(
					'update: verify the update persisted',
					function (fDone)
					{
						_SuperTest
							.get('1.0/Book/1')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Title).to.equal('Angels & Demons (Updated)');
									fDone();
								}
							);
					}
				);
				test
				(
					'update: fail without a valid record ID',
					function (fDone)
					{
						_SuperTest
							.put('1.0/Book')
							.send({ Title: 'No ID Provided' })
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.have.property('Error');
									fDone();
								}
							);
					}
				);
				test
				(
					'update: fail for a non-existent record',
					function (fDone)
					{
						_SuperTest
							.put('1.0/Book')
							.send({ IDBook: 99999, Title: 'Ghost Record' })
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.have.property('Error');
									fDone();
								}
							);
					}
				);
				test
				(
					'bulk update: update multiple records',
					function (fDone)
					{
						_SuperTest
							.put('1.0/Books')
							.send([
								{ IDBook: 2, Title: 'Dune (Updated)' },
								{ IDBook: 3, Title: 'Neuromancer (Updated)' }
							])
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.be.an('array');
									Expect(tmpResult.length).to.equal(2);
									Expect(tmpResult[0].Title).to.equal('Dune (Updated)');
									Expect(tmpResult[1].Title).to.equal('Neuromancer (Updated)');
									fDone();
								}
							);
					}
				);
				test
				(
					'upsert: update an existing record via upsert',
					function (fDone)
					{
						_SuperTest
							.put('1.0/Book/Upsert')
							.send({ IDBook: 4, Title: 'Snow Crash (Upserted)' })
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.IDBook).to.equal(4);
									Expect(tmpResult.Title).to.equal('Snow Crash (Upserted)');
									fDone();
								}
							);
					}
				);
				test
				(
					'upsert: create a new record via upsert',
					function (fDone)
					{
						_SuperTest
							.put('1.0/Book/Upsert')
							.send({ IDBook: 0, Title: 'Upserted New Book', Genre: 'Upsert' })
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Title).to.equal('Upserted New Book');
									Expect(tmpResult.IDBook).to.be.above(0);
									fDone();
								}
							);
					}
				);
			}
		);

		// ======================================================================
		// Delete Endpoints
		// ======================================================================
		suite
		(
			'Delete',
			() =>
			{
				let _DeletedRecordID = 0;

				test
				(
					'delete: create a record to delete',
					function (fDone)
					{
						_SuperTest
							.post('1.0/Book')
							.send({ Title: 'To Be Deleted', Genre: 'Temp' })
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									_DeletedRecordID = tmpResult.IDBook;
									Expect(_DeletedRecordID).to.be.above(0);
									fDone();
								}
							);
					}
				);
				test
				(
					'delete: delete a record by URL parameter',
					function (fDone)
					{
						_SuperTest
							.delete(`1.0/Book/${_DeletedRecordID}`)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.have.property('Count');
									Expect(tmpResult.Count).to.equal(1);
									fDone();
								}
							);
					}
				);
				test
				(
					'delete: the deleted record should not be readable',
					function (fDone)
					{
						_SuperTest
							.get(`1.0/Book/${_DeletedRecordID}`)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									// Record should not be found (soft-deleted)
									Expect(tmpResult).to.have.property('Error');
									fDone();
								}
							);
					}
				);
				test
				(
					'undelete: restore a soft-deleted record',
					function (fDone)
					{
						_SuperTest
							.get(`1.0/Book/Undelete/${_DeletedRecordID}`)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.have.property('Count');
									Expect(tmpResult.Count).to.equal(1);
									fDone();
								}
							);
					}
				);
				test
				(
					'undelete: the restored record should be readable again',
					function (fDone)
					{
						_SuperTest
							.get(`1.0/Book/${_DeletedRecordID}`)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.IDBook).to.equal(_DeletedRecordID);
									Expect(tmpResult.Title).to.equal('To Be Deleted');
									fDone();
								}
							);
					}
				);
				test
				(
					'delete: delete and verify zero count for non-existent ID',
					function (fDone)
					{
						_SuperTest
							.delete('1.0/Book/99999')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									// Non-existent record should error
									Expect(tmpResult).to.have.property('Error');
									fDone();
								}
							);
					}
				);
			}
		);

		// ======================================================================
		// Count Endpoints
		// ======================================================================
		suite
		(
			'Count',
			() =>
			{
				test
				(
					'count: get total record count',
					function (fDone)
					{
						_SuperTest
							.get('1.0/Books/Count')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.have.property('Count');
									Expect(tmpResult.Count).to.be.at.least(5);
									fDone();
								}
							);
					}
				);
				test
				(
					'count by: count by a field value',
					function (fDone)
					{
						_SuperTest
							.get('1.0/Books/Count/By/Genre/Thriller')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.have.property('Count');
									Expect(tmpResult.Count).to.be.at.least(2);
									fDone();
								}
							);
					}
				);
				test
				(
					'count: count with filter',
					function (fDone)
					{
						_SuperTest
							.get('1.0/Books/Count/FilteredTo/FBV~Genre~LK~%25Science%25')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.have.property('Count');
									Expect(tmpResult.Count).to.be.at.least(3);
									fDone();
								}
							);
					}
				);
			}
		);

		// ======================================================================
		// Schema Endpoints
		// ======================================================================
		suite
		(
			'Schema',
			() =>
			{
				test
				(
					'schema: get the JSON schema',
					function (fDone)
					{
						_SuperTest
							.get('1.0/Book/Schema')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.have.property('title');
									Expect(tmpResult.title).to.equal('Book');
									Expect(tmpResult).to.have.property('properties');
									Expect(tmpResult.properties).to.have.property('IDBook');
									Expect(tmpResult.properties).to.have.property('Title');
									Expect(tmpResult.properties).to.have.property('Genre');
									fDone();
								}
							);
					}
				);
				test
				(
					'new: get a default empty record',
					function (fDone)
					{
						_SuperTest
							.get('1.0/Book/Schema/New')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.have.property('IDBook');
									Expect(tmpResult.IDBook).to.equal(0);
									Expect(tmpResult).to.have.property('Title');
									Expect(tmpResult.Title).to.equal('');
									Expect(tmpResult).to.have.property('PublicationYear');
									Expect(tmpResult.PublicationYear).to.equal(0);
									fDone();
								}
							);
					}
				);
				test
				(
					'validate: validate a valid record',
					function (fDone)
					{
						_SuperTest
							.post('1.0/Book/Schema/Validate')
							.send({
								IDBook: 1,
								Title: 'Test Book',
								Genre: 'Test'
							})
							.end(
								(pError, pResponse) =>
								{
									// Validation should succeed
									Expect(pResponse.status).to.equal(200);
									fDone();
								}
							);
					}
				);
			}
		);

		// ======================================================================
		// Behavior Injection
		// ======================================================================
		suite
		(
			'Behavior Injection',
			() =>
			{
				test
				(
					'setBehavior: register and trigger a Read-PostOperation hook',
					function (fDone)
					{
						// Register a post-read hook that adds a custom field
						_MeadowEndpoints.controller.BehaviorInjection.setBehavior('Read-PostOperation',
							(pRequest, pRequestState, fCallback) =>
							{
								pRequestState.Record.CustomField = 'injected';
								return fCallback();
							});

						_SuperTest
							.get('1.0/Book/1')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.CustomField).to.equal('injected');

									// Clean up the behavior
									delete _MeadowEndpoints.controller.BehaviorInjection._BehaviorFunctions['Read-PostOperation'];
									fDone();
								}
							);
					}
				);
				test
				(
					'setBehavior: register and trigger a Reads-QueryConfiguration hook',
					function (fDone)
					{
						// Register a query config hook that limits to Genre=Thriller
						_MeadowEndpoints.controller.BehaviorInjection.setBehavior('Reads-QueryConfiguration',
							(pRequest, pRequestState, fCallback) =>
							{
								pRequestState.Query.addFilter('Genre', 'Thriller');
								return fCallback();
							});

						_SuperTest
							.get('1.0/Books')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.be.an('array');
									tmpResult.forEach((pRecord) =>
									{
										Expect(pRecord.Genre).to.equal('Thriller');
									});

									// Clean up the behavior
									delete _MeadowEndpoints.controller.BehaviorInjection._BehaviorFunctions['Reads-QueryConfiguration'];
									fDone();
								}
							);
					}
				);
				test
				(
					'setBehavior: Create-PreOperation hook can modify the record',
					function (fDone)
					{
						// Register a pre-create hook that sets a default genre
						_MeadowEndpoints.controller.BehaviorInjection.setBehavior('Create-PreOperation',
							(pRequest, pRequestState, fCallback) =>
							{
								if (!pRequestState.RecordToCreate.Genre || pRequestState.RecordToCreate.Genre === '')
								{
									pRequestState.RecordToCreate.Genre = 'DefaultGenre';
								}
								return fCallback();
							});

						_SuperTest
							.post('1.0/Book')
							.send({ Title: 'Hook Default Genre' })
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Genre).to.equal('DefaultGenre');

									// Clean up
									delete _MeadowEndpoints.controller.BehaviorInjection._BehaviorFunctions['Create-PreOperation'];
									fDone();
								}
							);
					}
				);
				test
				(
					'setBehavior: Create-PreOperation hook can reject a request',
					function (fDone)
					{
						// Register a pre-create hook that rejects records without a title
						_MeadowEndpoints.controller.BehaviorInjection.setBehavior('Create-PreOperation',
							(pRequest, pRequestState, fCallback) =>
							{
								if (!pRequestState.RecordToCreate.Title || pRequestState.RecordToCreate.Title === '')
								{
									let tmpError = new Error('Title is required');
									tmpError.StatusCode = 400;
									return fCallback(tmpError);
								}
								return fCallback();
							});

						_SuperTest
							.post('1.0/Book')
							.send({ Genre: 'No Title Provided' })
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.have.property('Error');

									// Clean up
									delete _MeadowEndpoints.controller.BehaviorInjection._BehaviorFunctions['Create-PreOperation'];
									fDone();
								}
							);
					}
				);
				test
				(
					'setBehavior: Delete-PreOperation hook can prevent deletion',
					function (fDone)
					{
						// Register a pre-delete hook that blocks deletion
						_MeadowEndpoints.controller.BehaviorInjection.setBehavior('Delete-PreOperation',
							(pRequest, pRequestState, fCallback) =>
							{
								let tmpError = new Error('Deletion is blocked');
								tmpError.StatusCode = 403;
								return fCallback(tmpError);
							});

						_SuperTest
							.delete('1.0/Book/1')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.have.property('Error');

									// Clean up
									delete _MeadowEndpoints.controller.BehaviorInjection._BehaviorFunctions['Delete-PreOperation'];
									fDone();
								}
							);
					}
				);
				test
				(
					'setBehavior: Count-QueryConfiguration hook modifies count query',
					function (fDone)
					{
						// Register a hook that adds a filter to the count query
						_MeadowEndpoints.controller.BehaviorInjection.setBehavior('Count-QueryConfiguration',
							(pRequest, pRequestState, fCallback) =>
							{
								pRequestState.Query.addFilter('Genre', 'Thriller');
								return fCallback();
							});

						_SuperTest
							.get('1.0/Books/Count')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.be.at.least(1);
									// The count should be less than total records
									Expect(tmpResult.Count).to.be.below(20);

									// Clean up
									delete _MeadowEndpoints.controller.BehaviorInjection._BehaviorFunctions['Count-QueryConfiguration'];
									fDone();
								}
							);
					}
				);
				test
				(
					'setBehavior: Schema-PostOperation hook can modify schema',
					function (fDone)
					{
						_MeadowEndpoints.controller.BehaviorInjection.setBehavior('Schema-PostOperation',
							(pRequest, pRequestState, fCallback) =>
							{
								if (pRequestState.JSONSchema && pRequestState.JSONSchema.properties)
								{
									pRequestState.JSONSchema.customMeta = 'injected-metadata';
								}
								return fCallback();
							});

						_SuperTest
							.get('1.0/Book/Schema')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.customMeta).to.equal('injected-metadata');

									// Clean up
									delete _MeadowEndpoints.controller.BehaviorInjection._BehaviorFunctions['Schema-PostOperation'];
									fDone();
								}
							);
					}
				);
				test
				(
					'setBehavior: New-PostOperation hook can modify defaults',
					function (fDone)
					{
						_MeadowEndpoints.controller.BehaviorInjection.setBehavior('New-PostOperation',
							(pRequest, pRequestState, fCallback) =>
							{
								pRequestState.EmptyEntityRecord.Genre = 'DefaultFromHook';
								pRequestState.EmptyEntityRecord.Language = 'English';
								return fCallback();
							});

						_SuperTest
							.get('1.0/Book/Schema/New')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Genre).to.equal('DefaultFromHook');
									Expect(tmpResult.Language).to.equal('English');

									// Clean up
									delete _MeadowEndpoints.controller.BehaviorInjection._BehaviorFunctions['New-PostOperation'];
									fDone();
								}
							);
					}
				);
				test
				(
					'setBehavior: Update-PostOperation hook runs after update',
					function (fDone)
					{
						let _HookCalled = false;
						_MeadowEndpoints.controller.BehaviorInjection.setBehavior('Update-PostOperation',
							(pRequest, pRequestState, fCallback) =>
							{
								_HookCalled = true;
								pRequestState.Record.HookWasHere = true;
								return fCallback();
							});

						_SuperTest
							.put('1.0/Book')
							.send({ IDBook: 5, Title: 'The Da Vinci Code (Hooked)' })
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(_HookCalled).to.equal(true);
									Expect(tmpResult.Title).to.equal('The Da Vinci Code (Hooked)');

									// Clean up
									delete _MeadowEndpoints.controller.BehaviorInjection._BehaviorFunctions['Update-PostOperation'];
									fDone();
								}
							);
					}
				);
			}
		);

		// ======================================================================
		// Session Management
		// ======================================================================
		suite
		(
			'Session Management',
			() =>
			{
				test
				(
					'header session: use x-trusted-session header',
					function (fDone)
					{
						// Temporarily switch session source
						let tmpOriginalSource = _MeadowEndpoints.controller.settings.MeadowEndpointsSessionDataSource;
						_MeadowEndpoints.controller.settings.MeadowEndpointsSessionDataSource = 'Header';

						let tmpHookTriggered = false;
						_MeadowEndpoints.controller.BehaviorInjection.setBehavior('Read-PreOperation',
							(pRequest, pRequestState, fCallback) =>
							{
								tmpHookTriggered = true;
								Expect(pRequestState.SessionData.UserID).to.equal(42);
								Expect(pRequestState.SessionData.CustomerID).to.equal(100);
								return fCallback();
							});

						_SuperTest
							.get('1.0/Book/1')
							.set('x-trusted-session', JSON.stringify({ UserID: 42, CustomerID: 100 }))
							.end(
								(pError, pResponse) =>
								{
									Expect(tmpHookTriggered).to.equal(true);

									// Clean up
									_MeadowEndpoints.controller.settings.MeadowEndpointsSessionDataSource = tmpOriginalSource;
									delete _MeadowEndpoints.controller.BehaviorInjection._BehaviorFunctions['Read-PreOperation'];
									fDone();
								}
							);
					}
				);
			}
		);

		// ======================================================================
		// Endpoint Configuration
		// ======================================================================
		suite
		(
			'Endpoint Configuration',
			() =>
			{
				test
				(
					'setBehaviorEndpoint: should accept custom endpoint functions',
					function (fDone)
					{
						// setBehaviorEndpoint should be a function and accept a custom function
						Expect(_MeadowEndpoints.setBehaviorEndpoint).to.be.a('function');
						let tmpResult = _MeadowEndpoints.setBehaviorEndpoint('CustomEndpoint', function () {});
						Expect(tmpResult).to.equal(_MeadowEndpoints); // Should return this for chaining
						fDone();
					}
				);
				test
				(
					'setBehaviorEndpoint: should ignore non-function endpoints',
					function (fDone)
					{
						let tmpResult = _MeadowEndpoints.setBehaviorEndpoint('BadEndpoint', 'not a function');
						Expect(tmpResult).to.equal(_MeadowEndpoints);
						fDone();
					}
				);
			}
		);

		// ======================================================================
		// Full CRUD Lifecycle
		// ======================================================================
		suite
		(
			'Full CRUD Lifecycle',
			() =>
			{
				let _LifecycleRecordID = 0;

				test
				(
					'lifecycle: create a record',
					function (fDone)
					{
						_SuperTest
							.post('1.0/Book')
							.send({ Title: 'Lifecycle Test', Genre: 'Test', ISBN: '000-0000000000', PublicationYear: 2024 })
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									_LifecycleRecordID = tmpResult.IDBook;
									Expect(tmpResult.Title).to.equal('Lifecycle Test');
									Expect(_LifecycleRecordID).to.be.above(0);
									fDone();
								}
							);
					}
				);
				test
				(
					'lifecycle: read the created record',
					function (fDone)
					{
						_SuperTest
							.get(`1.0/Book/${_LifecycleRecordID}`)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.IDBook).to.equal(_LifecycleRecordID);
									Expect(tmpResult.Title).to.equal('Lifecycle Test');
									Expect(tmpResult.Genre).to.equal('Test');
									Expect(tmpResult.ISBN).to.equal('000-0000000000');
									Expect(tmpResult.PublicationYear).to.equal(2024);
									fDone();
								}
							);
					}
				);
				test
				(
					'lifecycle: update the record',
					function (fDone)
					{
						_SuperTest
							.put('1.0/Book')
							.send({ IDBook: _LifecycleRecordID, Title: 'Lifecycle Test (Updated)', PublicationYear: 2025 })
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.IDBook).to.equal(_LifecycleRecordID);
									Expect(tmpResult.Title).to.equal('Lifecycle Test (Updated)');
									Expect(tmpResult.PublicationYear).to.equal(2025);
									fDone();
								}
							);
					}
				);
				test
				(
					'lifecycle: verify update via read',
					function (fDone)
					{
						_SuperTest
							.get(`1.0/Book/${_LifecycleRecordID}`)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Title).to.equal('Lifecycle Test (Updated)');
									Expect(tmpResult.PublicationYear).to.equal(2025);
									fDone();
								}
							);
					}
				);
				test
				(
					'lifecycle: count should include the record',
					function (fDone)
					{
						_SuperTest
							.get('1.0/Books/Count/By/Genre/Test')
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.be.at.least(1);
									fDone();
								}
							);
					}
				);
				test
				(
					'lifecycle: delete the record',
					function (fDone)
					{
						_SuperTest
							.delete(`1.0/Book/${_LifecycleRecordID}`)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.equal(1);
									fDone();
								}
							);
					}
				);
				test
				(
					'lifecycle: verify record is gone',
					function (fDone)
					{
						_SuperTest
							.get(`1.0/Book/${_LifecycleRecordID}`)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult).to.have.property('Error');
									fDone();
								}
							);
					}
				);
				test
				(
					'lifecycle: undelete the record',
					function (fDone)
					{
						_SuperTest
							.get(`1.0/Book/Undelete/${_LifecycleRecordID}`)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.equal(1);
									fDone();
								}
							);
					}
				);
				test
				(
					'lifecycle: verify record is back',
					function (fDone)
					{
						_SuperTest
							.get(`1.0/Book/${_LifecycleRecordID}`)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.IDBook).to.equal(_LifecycleRecordID);
									Expect(tmpResult.Title).to.equal('Lifecycle Test (Updated)');
									fDone();
								}
							);
					}
				);
			}
		);
	}
);
