/**
* Unit tests for the MeadowEndpoints Server in trusted session data mode.
*
* @license     MIT
*
* @author      Alex Decker <alex.decker@headlght.com>
*/

const Chai = require('chai');
const Expect = Chai.expect;
const Assert = Chai.assert;

const libSuperTest = require('supertest');

const libMySQL = require('mysql2');
const libAsync = require('async');

let tmpFableSettings = 	(
{
	Product: 'MockOratorAlternate',
	ProductVersion: '0.0.0',

	UnauthorizedRequestDelay: 10,

	APIServerPort: 9082,

	MySQL:
	{
		// This is queued up for Travis defaults.
		Server: 'localhost',
		Port: 3306,
		User: process.env.DEV_MYSQL_USER || 'root',
		Password: process.env.DEV_MYSQL_PASS || '123456789',
		Database: 'FableTest',
		ConnectionPoolLimit: 20
	},
	ConfigFile: + `${__dirname}/../MeadowTest-Settings.json`,
});

const libFable = require('fable').new(tmpFableSettings);
tmpFableSettings = libFable.settings;

libFable.MeadowMySQLConnectionPool = libMySQL.createPool
	(
		{
			connectionLimit: libFable.settings.MySQL.ConnectionPoolLimit,
			host: libFable.settings.MySQL.Server,
			port: libFable.settings.MySQL.Port,
			user: libFable.settings.MySQL.User,
			password: libFable.settings.MySQL.Password,
			database: libFable.settings.MySQL.Database,
			namedPlaceholders: true
		}
	);

let _Meadow;
let _MeadowEndpoints;

const _AnimalSchema = require('./Animal.json');

// Now that we have some test data, wire up the endpoints!

// Load up a Meadow (pointing at the Animal database)
_Meadow = require('meadow')
				.new(libFable, 'FableTest')
				.setProvider('MySQL')
				.setSchema(_AnimalSchema.Schema)
				.setJsonSchema(_AnimalSchema.JsonSchema)
				.setDefaultIdentifier(_AnimalSchema.DefaultIdentifier)
				.setDefault(_AnimalSchema.DefaultObject)
				.setAuthorizer(_AnimalSchema.Authorization);
// Instantiate the endpoints
_MeadowEndpoints = require('../source/Meadow-Endpoints.js').new(_Meadow);

suite
(
	'Meadow-Endpoints with Disabled Auth',
	function()
	{
		// TODO: Abstract this so it can be run again and again.
		let _SpooledUp = false;
		let _Orator;

		const getAnimalInsert = function(pName, pType)
		{
			return "INSERT INTO `FableTest` (`IDAnimal`, `GUIDAnimal`, `CreateDate`, `CreatingIDUser`, `UpdateDate`, `UpdatingIDUser`, `Deleted`, `DeleteDate`, `DeletingIDUser`, `Name`, `Type`, `IDCustomer`) VALUES (NULL, '00000000-0000-0000-0000-000000000000', NOW(), 1, NOW(), 1, 0, NULL, 0, '"+pName+"', '"+pType+"', 1); ";
		};

		setup
		(
			function(fDone)
			{
				// Only do this for the first test, so we persiste database state across suites
				if (!_SpooledUp)
				{
					_Orator = require('orator').new(tmpFableSettings);
					_Orator.enabledModules.CORS = true;
					_Orator.enabledModules.FullResponse = true;
					_Orator.enabledModules.Body = false;


					const _SQLConnectionPool = libMySQL.createPool
					(
						{
							connectionLimit: tmpFableSettings.MySQL.ConnectionPoolLimit,
							host: tmpFableSettings.MySQL.Server,
							port: tmpFableSettings.MySQL.Port,
							user: tmpFableSettings.MySQL.User,
							password: tmpFableSettings.MySQL.Password,
							database: tmpFableSettings.MySQL.Database
						}
					);

					// Tear down previous test data, rebuild records
					libAsync.waterfall(
					[
						function(fCallBack)
						{
							_SQLConnectionPool.query('DROP TABLE IF EXISTS FableTest',
							function(pErrorUpdate, pResponse) { fCallBack(null); });
						},
						function(fCallBack)
						{
							_SQLConnectionPool.query("CREATE TABLE IF NOT EXISTS FableTest (IDAnimal INT UNSIGNED NOT NULL AUTO_INCREMENT, GUIDAnimal CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000', CreateDate DATETIME, CreatingIDUser INT NOT NULL DEFAULT '0', UpdateDate DATETIME, UpdatingIDUser INT NOT NULL DEFAULT '0', Deleted TINYINT NOT NULL DEFAULT '0', DeleteDate DATETIME, DeletingIDUser INT NOT NULL DEFAULT '0', Name CHAR(128) NOT NULL DEFAULT '', Type CHAR(128) NOT NULL DEFAULT '', IDCustomer INT NOT NULL DEFAULT '0', PRIMARY KEY (IDAnimal) );",
							function(pErrorUpdate, pResponse) { fCallBack(null); });
						},
						function(fCallBack)
						{
							_SQLConnectionPool.query(getAnimalInsert('Foo Foo', 'Bunny'),
							function(pErrorUpdate, pResponse) { fCallBack(null); });
						},
						function(fCallBack)
						{
							_SQLConnectionPool.query(getAnimalInsert('Red Riding Hood', 'Girl'),
							function(pErrorUpdate, pResponse) { fCallBack(null); });
						},
						function(fCallBack)
						{
							_SQLConnectionPool.query(getAnimalInsert('Red', 'Dog'),
							function(pErrorUpdate, pResponse) { fCallBack(null); });
						},
						function(fCallBack)
						{
							_SQLConnectionPool.query(getAnimalInsert('Spot', 'Dog'),
							function(pErrorUpdate, pResponse) { fCallBack(null); });
						},
						function(fCallBack)
						{
							_SQLConnectionPool.query(getAnimalInsert('Gertrude', 'Frog'),
							function(pErrorUpdate, pResponse) { fCallBack(null); });
						},
						function(fCallBack)
						{
							// Start the web server
							_MeadowEndpoints.setEndpointAuthorization
							(
								'Create',
								2
							);
							_MeadowEndpoints.setEndpointAuthenticator ('Reads');
							_MeadowEndpoints.setEndpointAuthenticator
							(
								'Reads',
								function(pRequest, pResponse, fNext)
								{
									pRequest.EndpointAuthenticated = true;
									fNext();
								}
							);
							_MeadowEndpoints.setEndpoint('Randomize');
							_MeadowEndpoints.setEndpoint('Randomize', function() {});

							_MeadowEndpoints.behaviorModifications.setTemplate('ListQuery', '<%= MyData %>');
							//_MeadowEndpoints.behaviorModifications.setTemplate('SelectList', '<%= Name %>|<%= Type %>');

							// Wire the endpoints up
							_MeadowEndpoints.connectRoutes(_Orator.webServer);
							_Orator.startWebServer (function() { fCallBack(null); });
						}
					],
						function(pError, pResult)
						{
							// Now continue the tests.
							_SpooledUp = true;
							fDone();
						}
					);
				}
				else
				{
					fDone();
				}
			}
		);

		setup
		(
			function()
			{
			}
		);

		suite
		(
			'Object Sanity',
			function()
			{
				test
				(
					'initialize should build a happy little object',
					function()
					{
						Expect(_MeadowEndpoints).to.be.an('object', 'MeadowEndpoints should initialize as an object directly from the require statement.');
					}
				);
			}
		);
		suite
		(
			'Behavior Modifications',
			function()
			{
				test
				(
					'exercise the security modification api',
					function()
					{
						const tmpAuthorizers = require('../source/Meadow-Authorizers.js').new(libFable);
						tmpAuthorizers.setAuthorizer('AlwaysAuthorize',
							function(pRequest, fComplete)
							{
								pRequest.MeadowAuthorization = false;
							});
						const tmpMockRequest = { };
						tmpAuthorizers.authorize('BadHash', tmpMockRequest,
							function()
							{
								Expect(tmpMockRequest.MeadowAuthorization).to.equal(true);
							});
						tmpAuthorizers.authorize('AlwaysAuthorize', tmpMockRequest,
							function()
							{
								// doesn't invoke behavior when disabled
								Expect(tmpMockRequest.MeadowAuthorization).to.equal(true);
							});
						tmpAuthorizers.authorize('Allow', tmpMockRequest,
							function()
							{
								Expect(tmpMockRequest.MeadowAuthorization).to.equal(true);
							});
						tmpAuthorizers.authorize('Deny', tmpMockRequest,
							function()
							{
								Expect(tmpMockRequest.MeadowAuthorization).to.equal(true);
							});
					}
				);
				test
				(
					'exercise the security modification api with initial authorization state',
					function()
					{
						const tmpAuthorizers = require('../source/Meadow-Authorizers.js').new(libFable);
						tmpAuthorizers.setAuthorizer('AlwaysAuthorize',
							function(pRequest, fComplete)
							{
								pRequest.MeadowAuthorization = false;
							});
						// disabled doesn't force to true, it just leaves what's there (if anything; if absent, will set true as default)
						const tmpMockRequest = {MeadowAuthorization: 'Green'};
						tmpAuthorizers.authorize('BadHash', tmpMockRequest,
							function()
							{
								Expect(tmpMockRequest.MeadowAuthorization).to.equal('Green');
							});
						tmpAuthorizers.authorize('AlwaysAuthorize', tmpMockRequest,
							function()
							{
								Expect(tmpMockRequest.MeadowAuthorization).to.equal('Green');
							});
						tmpAuthorizers.authorize('Allow', tmpMockRequest,
							function()
							{
								Expect(tmpMockRequest.MeadowAuthorization).to.equal('Green');
							});
						tmpAuthorizers.authorize('Deny', tmpMockRequest,
							function()
							{
								Expect(tmpMockRequest.MeadowAuthorization).to.equal('Green');
							});
					}
				);
				test
				(
					'exercise the security modification authenticators',
					function()
					{
						const tmpAuthorizers = require('../source/Meadow-Authorizers.js').new(libFable);
						const tmpMockFullRequest =
						{
							UserSession:
							{
								CustomerID: 10,
								UserID: 1
							},
							Record:
							{
								IDCustomer: 10,
								CreatingIDUser: 1
							}
						};
						// Mine and MyCustomer should both work
						tmpAuthorizers.authorize('Mine', tmpMockFullRequest,
							function()
							{
								Expect(tmpMockFullRequest.MeadowAuthorization).to.equal(true);
							});
						tmpAuthorizers.authorize('MyCustomer', tmpMockFullRequest,
							function()
							{
								Expect(tmpMockFullRequest.MeadowAuthorization).to.equal(true);
							});
						tmpMockFullRequest.UserSession.CustomerID = 100;
						tmpMockFullRequest.UserSession.UserID = 100;
						// Now they should both fail
						tmpAuthorizers.authorize('Mine', tmpMockFullRequest,
							function()
							{
								// Auth disabled, so this should still be allowed
								Expect(tmpMockFullRequest.MeadowAuthorization).to.equal(true);
							});
						tmpAuthorizers.authorize('MyCustomer', tmpMockFullRequest,
							function()
							{
								// Auth disabled, so this should still be allowed
								Expect(tmpMockFullRequest.MeadowAuthorization).to.equal(true);
							});
					}
				);
			}
		);
		suite
		(
			'Basic Server Routes',
			function()
			{
				test
				(
					'create: create a record',
					function(fDone)
					{
						var tmpRecord = {Name:'BatBrains', Type:'Mammoth'};
						libSuperTest('http://localhost:9082/')
						.post('1.0/FableTest')
						.send(tmpRecord)
						.end(
							function(pError, pResponse)
							{
								// Expect response to be the record we just created.
								var tmpResult = JSON.parse(pResponse.text);
								Expect(tmpResult.Type).to.equal('Mammoth');
								//Expect(tmpResult.CreatingIDUser).to.equal(37);
								fDone();
							}
						);
					}
				);
				test
				(
					'create: create a record',
					function(fDone)
					{
						var tmpRecord = {Name:'BatBrains', Type:'Mammoth'};
						libSuperTest('http://localhost:9082/')
						.post('1.0/FableTest')
						.send(tmpRecord)
						.end(
							function(pError, pResponse)
							{
								// Expect response to be the record we just created.
								var tmpResult = JSON.parse(pResponse.text);
								Expect(tmpResult.Error).to.not.exist;
								Expect(tmpResult.ErrorCode).to.not.exist;
								fDone();
							}
						);
					}
				);
				test
				(
					'create: create a record with a bad record passed in',
					function(fDone)
					{
						var tmpRecord = ' ';
						libSuperTest('http://localhost:9082/')
						.post('1.0/FableTest')
						.send(tmpRecord)
						.end(
							function(pError, pResponse)
							{
								// Expect response to be the record we just created.
								var tmpResult = JSON.parse(pResponse.text);
								Expect(tmpResult.Error).to.not.be.null;
								fDone();
							}
						);
					}
				);
				test
				(
					'read: get a specific record',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTest/2')
						.end(
							function (pError, pResponse)
							{
								var tmpResult = JSON.parse(pResponse.text);
								Expect(tmpResult.Type).to.equal('Girl');
								fDone();
							}
						);
					}
				);
				test
				(
					'read: define a custom route and get a record with it',
					function(fDone)
					{
						_Orator.webServer.get('/CustomHotRodRoute/:IDRecord', _MeadowEndpoints.endpointAuthenticators.Read, _MeadowEndpoints.wireState, _MeadowEndpoints.endpoints.Read);
						libSuperTest('http://localhost:9082/')
						.get('CustomHotRodRoute/2')
						.end(
							function (pError, pResponse)
							{
								var tmpResult = JSON.parse(pResponse.text);
								Expect(tmpResult.Type).to.equal('Girl');
								fDone();
							}
						);
					}
				);
				test
				(
					'read: get a specific record but be denied by security',
					function(fDone)
					{
						_Meadow.schemaFull.authorizer.Manager = {};
						_Meadow.schemaFull.authorizer.Manager.Read = 'Deny';

						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTest/2')
						.end(
							function (pError, pResponse)
							{
								Expect(pError).to.not.exist;
								Expect(pResponse.text).not.to.contain('UNAUTHORIZED ACCESS IS NOT ALLOWED');
								// Reset authorization
								_Meadow.schemaFull.authorizer.Manager.Read = 'Allow';
								fDone();
							}
						);
					}
				);
				test
				(
					'read: get a specific record with a bad parameter',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTest/')
						.end(
							function (pError, pResponse)
							{
								var tmpResult = JSON.parse(pResponse.text);
								Expect(tmpResult.Error).to.equal('Error retreiving a record. Record not found');
								fDone();
							}
						);
					}
				);
				test
				(
					'reads: get all records',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTests')
						.end(
							function (pError, pResponse)
							{
								var tmpResults = JSON.parse(pResponse.text);
								Expect(tmpResults.length).to.equal(7);
								Expect(tmpResults[0].Type).to.equal('Bunny');
								Expect(tmpResults[4].Name).to.equal('Gertrude');
								fDone();
							}
						);
					}
				);
				test
				(
					'readsLiteExtended: get all records',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTests/LiteExtended/Type,Name')
						.end(
							function (pError, pResponse)
							{
								var tmpResults = JSON.parse(pResponse.text);
								Expect(tmpResults.length).to.equal(7);
								Expect(tmpResults[0].IDAnimal).to.equal(1);
								Expect(tmpResults[4].IDAnimal).to.equal(5);
								Expect(tmpResults[4].Type).to.equal('Frog');
								fDone();
							}
						);
					}
				);
				test
				(
					'readsby: get all records by Type',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTests/By/Type/Dog')
						.end(
							function (pError, pResponse)
							{
								var tmpResults = JSON.parse(pResponse.text);
								Expect(tmpResults.length).to.equal(2);
								Expect(tmpResults[0].Type).to.equal('Dog');
								fDone();
							}
						);
					}
				);
				test
				(
					'readsby: get all records by Type IN LIST',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTests/By/Type/Mammoth%2C%20WithComma,Dog')
						.end(
							function (pError, pResponse)
							{
								var tmpResults = JSON.parse(pResponse.text);
								Expect(tmpResults.length).to.equal(2);
								Expect(tmpResults[0].Type).to.equal('Dog');
								fDone();
							}
						);
					}
				);
				test
				(
					'countby: get count of records by Type',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTests/Count/By/Type/Dog')
						.end(
							function (pError, pResponse)
							{
								var tmpResults = JSON.parse(pResponse.text);
								Expect(tmpResults.Count).to.equal(2);
								fDone();
							}
						);
					}
				);
				test
				(
					'countby: get count of records by multiple Types',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTests/Count/By/Type/Dog,Mammoth')
						.end(
							function (pError, pResponse)
							{
								var tmpResults = JSON.parse(pResponse.text);
								Expect(tmpResults.Count).to.equal(4);
								fDone();
							}
						);
					}
				);
				test
				(
					'readsby: get paged records by Type',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTests/By/Type/Dog/1/1')
						.end(
							function (pError, pResponse)
							{
								var tmpResults = JSON.parse(pResponse.text);
								Expect(tmpResults.length).to.equal(1);
								Expect(tmpResults[0].Name).to.equal('Spot');
								fDone();
							}
						);
					}
				);
				test
				(
					'readselect: get a page of filtered records by date',
					function(fDone)
					{
						var today = new Date();
						today = today.toISOString().substring(0, 10);

						libSuperTest('http://localhost:9082/')
						.get(`1.0/FableTestSelect/FilteredTo/FBD~UpdateDate~EQ~${today}/0/1`)
						.end(
							function (pError, pResponse)
							{
								console.log(pResponse.text)
								var tmpResults = JSON.parse(pResponse.text);
								Expect(tmpResults.length).to.equal(1);
								Expect(tmpResults[0].Value).to.equal('FableTest #1');
								fDone();
							}
						);
					}
				);
				test
				(
					'readselect: get all records',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTestSelect')
						.end(
							function (pError, pResponse)
							{
								console.log(pResponse.text)
								var tmpResults = JSON.parse(pResponse.text);
								Expect(tmpResults.length).to.equal(7);
								Expect(tmpResults[4].Value).to.equal('FableTest #5');
								fDone();
							}
						);
					}
				);
				test
				(
					'readselect: get a page of records',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTestSelect/2/2')
						.end(
							function (pError, pResponse)
							{
								console.log(pResponse.text)
								var tmpResults = JSON.parse(pResponse.text);
								Expect(tmpResults.length).to.equal(2);
								Expect(tmpResults[1].Value).to.equal('FableTest #4');
								fDone();
							}
						);
					}
				);
				test
				(
					'readselect: get a page of records',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTestSelect/2/2')
						.end(
							function (pError, pResponse)
							{
								console.log(pResponse.text)
								var tmpResults = JSON.parse(pResponse.text);
								Expect(tmpResults.length).to.equal(2);
								Expect(tmpResults[1].Value).to.equal('FableTest #4');
								fDone();
							}
						);
					}
				);
				test
				(
					'readselect: get filtered records',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTestSelect/FilteredTo/FBV~Type~EQ~Dog')
						.end(
							function (pError, pResponse)
							{
								var tmpResults = JSON.parse(pResponse.text);
								Expect(tmpResults.length).to.equal(2);
								Expect(tmpResults[0].Value).to.equal('FableTest #3');
								fDone();
							}
						);
					}
				);
				test
				(
					'readselect: get a page of filtered records',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTestSelect/FilteredTo/FBV~Type~EQ~Dog/1/1')
						.end(
							function (pError, pResponse)
							{
								console.log(pResponse.text)
								var tmpResults = JSON.parse(pResponse.text);
								Expect(tmpResults.length).to.equal(1);
								Expect(tmpResults[0].Value).to.equal('FableTest #4');
								fDone();
							}
						);
					}
				);
				test
				(
					'readselect: get an empty page of records',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTestSelect/200/200')
						.end(
							function (pError, pResponse)
							{
								console.log(pResponse.text)
								var tmpResults = JSON.parse(pResponse.text);
								Expect(tmpResults.length).to.equal(0);
								fDone();
							}
						);
					}
				);
				test
				(
					'reads: get a page of records',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						// Get page 2, 2 records per page.
						.get('1.0/FableTests/2/2')
						.end(
							function (pError, pResponse)
							{
								var tmpResults = JSON.parse(pResponse.text);
								Expect(tmpResults.length).to.equal(2);
								Expect(tmpResults[0].Type).to.equal('Dog');
								Expect(tmpResults[1].Name).to.equal('Spot');
								fDone();
							}
						);
					}
				);
				test
				(
					'reads: get a filtered set of records',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTests/FilteredTo/FBV~Type~EQ~Frog')
						.end(
							function (pError, pResponse)
							{
								var tmpResults = JSON.parse(pResponse.text);
								Expect(tmpResults.length).to.equal(1);
								Expect(tmpResults[0].Type).to.equal('Frog');
								fDone();
							}
						);
					}
				);
				test
				(
					'reads: get distinct values for a column',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTests/Distinct/Type')
						.end(
							function (pError, pResponse)
							{
								var tmpResults = JSON.parse(pResponse.text);
								Expect(tmpResults.length).to.equal(5);
								const types = tmpResults.map((r) => r.Type);
								Expect(types).to.have.members(['Bunny', 'Girl', 'Dog', 'Frog', 'Mammoth']);
								fDone();
							}
						);
					}
				);
				test
				(
					'reads: get distinct values for a column with filter',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTests/Distinct/Type/FilteredTo/FBV~IDAnimal~LT~3')
						.end(
							function (pError, pResponse)
							{
								var tmpResults = JSON.parse(pResponse.text);
								Expect(tmpResults.length).to.equal(2);
								const types = new Set(tmpResults.map((r) => r.Type));
								Expect(types.size).to.equal(2);
								fDone();
							}
						);
					}
				);
				test
				(
					'reads: get distinct values for a column with filter and pagination',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTests/Distinct/Type/FilteredTo/FBV~IDAnimal~LT~3/0/1')
						.end(
							function (pError, pResponse)
							{
								var tmpResults = JSON.parse(pResponse.text);
								Expect(tmpResults.length).to.equal(1);
								fDone();
							}
						);
					}
				);
				test
				(
					'reads: get distinct values for a column with pagination',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTests/Distinct/Type/2/2')
						.end(
							function (pError, pResponse)
							{
								var tmpResults = JSON.parse(pResponse.text);
								Expect(tmpResults.length).to.equal(2);
								const types = new Set(tmpResults.map((r) => r.Type));
								Expect(types.size).to.equal(2);
								fDone();
							}
						);
					}
				);
				test
				(
					'reads: get a filtered paged set of records',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						// Skip one record, 2 records per page.
						.get('1.0/FableTests/FilteredTo/FBV~Type~EQ~Dog/1/2')
						.end(
							function (pError, pResponse)
							{
								var tmpResults = JSON.parse(pResponse.text);
								Expect(tmpResults.length).to.equal(1);
								Expect(tmpResults[0].Type).to.equal('Dog');
								fDone();
							}
						);
					}
				);
				test
				(
					'update: update a record',
					function(fDone)
					{
						// Change animal 4 ("Spot") to a Corgi
						var tmpRecord = {IDAnimal:4, Type:'Corgi'};
						libSuperTest('http://localhost:9082/')
						.put('1.0/FableTest')
						.send(tmpRecord)
						.end(
							function(pError, pResponse)
							{
								// Expect response to be the record we just created.
								var tmpResult = JSON.parse(pResponse.text);
								Expect(tmpResult.Type).to.equal('Corgi');
								//Expect(tmpResult.CreatingIDUser).to.equal(1);
								//Expect(tmpResult.UpdatingIDUser).to.equal(37);
								fDone();
							}
						);
					}
				);
				test
				(
					'delete: delete a record',
					function(fDone)
					{
						// Delete animal 3 ("Red")
						var tmpRecord = {IDAnimal:3};
						libSuperTest('http://localhost:9082/')
						.del('1.0/FableTest')
						.send(tmpRecord)
						.end(
							function(pError, pResponse)
							{
								// Expect response to be the count of deleted records.
								var tmpResult = JSON.parse(pResponse.text);
								Expect(tmpResult.Count).to.equal(1);
								fDone();
							}
						);
					}
				);
				test
				(
					'delete: delete a record with a bad parameter',
					function(fDone)
					{
						// Delete animal 3 ("Red")
						var tmpRecord = {IDAnimal:{MyStuff:4}};
						libSuperTest('http://localhost:9082/')
						.del('1.0/FableTest')
						.send(tmpRecord)
						.end(
							function(pError, pResponse)
							{
								// Expect response to be the count of deleted records.
								var tmpResult = JSON.parse(pResponse.text);
								Expect(tmpResult.Error).to.contain('a valid record ID is required');
								fDone();
							}
						);
					}
				);
				test
				(
					'count: get the count of records',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTests/Count')
						.end(
							function (pError, pResponse)
							{
								var tmpResults = JSON.parse(pResponse.text);
								Expect(tmpResults.Count).to.equal(6);
								fDone();
							}
						);
					}
				);
				test
				(
					'count: get the count of filtered records',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTests/Count/FilteredTo/FBV~Type~EQ~Girl')
						.end(
							function (pError, pResponse)
							{
								var tmpResults = JSON.parse(pResponse.text);
								Expect(tmpResults.Count).to.equal(1);
								fDone();
							}
						);
					}
				);
				test
				(
					'schema: get the schema of a record',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTest/Schema')
						.end(
							function (pError, pResponse)
							{
								var tmpResults = JSON.parse(pResponse.text);
								//console.log('SCHEMA --> '+JSON.stringify(tmpResults, null, 4))
								Expect(tmpResults.title).to.equal('Animal');
								Expect(tmpResults.description).to.contain('creature that lives in');
								fDone();
							}
						);
					}
				);
				test
				(
					'new: get a new empty record',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTest/Schema/New')
						.end(
							function (pError, pResponse)
							{
								var tmpResults = JSON.parse(pResponse.text);
								//console.log(JSON.stringify(tmpResults, null, 4))
								Expect(tmpResults.IDAnimal).to.equal(null);
								Expect(tmpResults.Name).to.equal('Unknown');
								Expect(tmpResults.Type).to.equal('Unclassified');
								fDone();
							}
						);
					}
				);
				test
				(
					'validate: validate an invalid record',
					function(fDone)
					{
						var tmpRecord = {IDAnimal:4, Type:'Corgi'};
						libSuperTest('http://localhost:9082/')
						.post('1.0/FableTest/Schema/Validate')
						.send(tmpRecord)
						.end(
							function(pError, pResponse)
							{
								// Expect response to be the record we just created.
								var tmpResult = JSON.parse(pResponse.text);
								//console.log(JSON.stringify(tmpResult, null, 4))
								Expect(tmpResult.Valid).to.equal(false);
								Expect(tmpResult.Errors[0].field).to.equal('data.Name');
								Expect(tmpResult.Errors[0].message).to.equal('is required');
								fDone();
							}
						);
					}
				);
				test
				(
					'validate: validate a valid record',
					function(fDone)
					{
						var tmpRecord = {IDAnimal:4, Type:'Corgi', Name:'Doofer', CreatingIDUser:10};
						libSuperTest('http://localhost:9082/')
						.post('1.0/FableTest/Schema/Validate')
						.send(tmpRecord)
						.end(
							function(pError, pResponse)
							{
								// Expect response to be the record we just created.
								var tmpResult = JSON.parse(pResponse.text);
								//console.log(JSON.stringify(tmpResult, null, 4))
								Expect(tmpResult.Valid).to.equal(true);
								fDone();
							}
						);
					}
				);
				test
				(
					'validate: validate bad data',
					function(fDone)
					{
						var tmpRecord = 'IAMBAD';
						libSuperTest('http://localhost:9082/')
						.post('1.0/FableTest/Schema/Validate')
						.send(tmpRecord)
						.end(
							function(pError, pResponse)
							{
								// Expect response to be the record we just created.
								var tmpResult = JSON.parse(pResponse.text);
								//console.log(JSON.stringify(tmpResult, null, 4))
								Expect(tmpResult.Valid).to.be.false;
								fDone();
							}
						);
					}
				);
			}
		);
		suite
		(
			'Basic Server Routes',
			function()
			{
			}
		);
		suite
		(
			'Unauthorized server routes',
			function()
			{
				test
				(
					'read: get a specific record',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTest/2')
						.end(
							function (pError, pResponse)
							{
								const tmpResult = JSON.parse(pResponse.text);
								Expect(tmpResult.Error).to.not.exist;
								Expect(tmpResult.ErrorCode).to.not.exist;
								fDone();
							}
						);
					}
				);
			}
		);
		suite
		(
			'Bad user server routes',
			function()
			{
				test
				(
					'create: create a record',
					function(fDone)
					{
						const tmpRecord = {Name:'BatBrains', Type:'Mammoth'};
						libSuperTest('http://localhost:9082/')
						.post('1.0/FableTest')
						.send(tmpRecord)
						.end(
							function(pError, pResponse)
							{
								const tmpResult = JSON.parse(pResponse.text);
								Expect(tmpResult.Error).to.not.exist;
								Expect(tmpResult.ErrorCode).to.not.exist;
								fDone();
							}
						);
					}
				);
				test
				(
					'read: get a specific record',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTest/2')
						.end(
							function (pError, pResponse)
							{
								const tmpResult = JSON.parse(pResponse.text);
								Expect(tmpResult.Error).to.not.exist;
								Expect(tmpResult.ErrorCode).to.not.exist;
								fDone();
							}
						);
					}
				);
				test
				(
					'readselect: get all records',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTestSelect')
						.end(
							function (pError, pResponse)
							{
								console.log(pResponse.text)
								const tmpResults = JSON.parse(pResponse.text);
								Expect(tmpResults.Error).to.not.exist;
								Expect(tmpResults.ErrorCode).to.not.exist;
								fDone();
							}
						);
					}
				);
				test
				(
					'update: update a record',
					function(fDone)
					{
						// Change animal 4 ("Spot") to a Corgi
						const tmpRecord = {IDAnimal:4, Type:'Corgi'};
						libSuperTest('http://localhost:9082/')
						.put('1.0/FableTest')
						.send(tmpRecord)
						.end(
							function(pError, pResponse)
							{
								// Expect response to be the record we just created.
								const tmpResult = JSON.parse(pResponse.text);
								Expect(tmpResult.Error).to.not.exist;
								Expect(tmpResult.ErrorCode).to.not.exist;
								fDone();
							}
						);
					}
				);
				test
				(
					'schema: get the schema of a record',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTest/Schema')
						.end(
							function (pError, pResponse)
							{
								const tmpResults = JSON.parse(pResponse.text);
								//console.log('SCHEMA --> '+JSON.stringify(tmpResults, null, 4))
								Expect(tmpResults.Error).to.not.exist;
								Expect(tmpResults.ErrorCode).to.not.exist;
								fDone();
							}
						);
					}
				);
				test
				(
					'new: get a new empty record',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTest/Schema/New')
						.end(
							function (pError, pResponse)
							{
								const tmpResults = JSON.parse(pResponse.text);
								//console.log(JSON.stringify(tmpResults, null, 4))
								Expect(tmpResults.Error).to.not.exist;
								Expect(tmpResults.ErrorCode).to.not.exist;
								fDone();
							}
						);
					}
				);
				test
				(
					'validate: validate an invalid record',
					function(fDone)
					{
						const tmpRecord = {IDAnimal:4, Type:'Corgi'};
						libSuperTest('http://localhost:9082/')
						.post('1.0/FableTest/Schema/Validate')
						.send(tmpRecord)
						.end(
							function(pError, pResponse)
							{
								// Expect response to be the record we just created.
								const tmpResult = JSON.parse(pResponse.text);
								console.log(JSON.stringify(tmpResult, null, 4))
								Expect(tmpResult.Error).to.not.exist;
								Expect(tmpResult.ErrorCode).to.not.exist;
								fDone();

							}
						);
					}
				);
				test
				(
					'count: get the count of records',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTests/Count')
						.end(
							function (pError, pResponse)
							{
								const tmpResult = JSON.parse(pResponse.text);
								Expect(tmpResult.Error).to.not.exist;
								Expect(tmpResult.ErrorCode).to.not.exist;
								fDone();
							}
						);
					}
				);
				test
				(
					'delete: delete a record',
					function(fDone)
					{
						// Delete animal 3 ("Red")
						const tmpRecord = {IDAnimal:3};
						libSuperTest('http://localhost:9082/')
						.del('1.0/FableTest')
						.send(tmpRecord)
						.end(
							function(pError, pResponse)
							{
								// Expect response to be the count of deleted records.
								const tmpResult = JSON.parse(pResponse.text);
								Expect(tmpResult.Error).to.not.exist;
								Expect(tmpResult.ErrorCode).to.not.exist;
								fDone();
							}
						);
					}
				);
			}
		);
		suite
		(
			'Not logged in server routes',
			function()
			{
				test
				(
					'read: get a specific record',
					function(fDone)
					{
						libSuperTest('http://localhost:9082/')
						.get('1.0/FableTest/2')
						.end(
							function (pError, pResponse)
							{
								const tmpResult = JSON.parse(pResponse.text);
								Expect(tmpResult.Error).to.not.exist;
								Expect(tmpResult.ErrorCode).to.not.exist;
								fDone();
							}
						);
					}
				);
			}
		);
	}
);
