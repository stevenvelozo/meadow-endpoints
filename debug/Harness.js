/**
* Test Harness
*
* @license     MIT
*
* @author      Steven Velozo <steven@velozo.com>
*/

var libFable = require('fable');

var libOrator = require('orator');
const libOratorServiceServerRestify = require('orator-serviceserver-restify');

var libMeadow = require('meadow');
var libMeadowEndpoints = require('../source/Meadow-Endpoints.js');

var libSuperTest = require('supertest');
var libMySQL = require('mysql2');

////////// Code can go here for easy debugging //////////
var _HarnessBehavior = () =>
{
	var tmpRecords = [
		{GUIDAnimal:'0xHAXXXX', Name:'Jason', Type:'Triceratops'},
		{Name:'Rover',Type:'Car'},
		{GUIDAnimal:'0xDavison', Type:'Frog'}
	];

	/*
	libSuperTest('http://localhost:8080/')
		.put('1.0/FableTest/Upserts')
		.send(tmpRecords)
		.end(
			function(pError, pResponse)
			{
				// Expect response to be the record we just created.
				var tmpResult = JSON.parse(pResponse.text);
				console.log(JSON.stringify(tmpResult,null,4));
			}
		);
		*/
};

var tmpFableSettings = 	(
{
	Product: 'MockOratorAlternate',
	ProductVersion: '0.0.0',

	"UnauthorizedRequestDelay": 100,

	APIServerPort: 8086,

	MySQL:
		{
			// This is queued up for Travis defaults.
			Server: "localhost",
			Port: 3306,
			User: "root",
			Password: "",
			Database: "FableTest",
			ConnectionPoolLimit: 20
		}
});

var libFable = require('fable')
const _Fable = new libFable(tmpFableSettings);
tmpFableSettings = _Fable.settings;

var _MockSessionValidUser = (
	{
		SessionID: '0000-VALID',
		UserID: 37,
		UserRole: 'User',
		UserRoleIndex: 1,
		LoggedIn: true,
		DeviceID: 'TEST-HARNESS'
	});

var _AnimalSchema = require('../test/Animal.json');

// Load up a Meadow (pointing at the Animal database)
let _Meadow = libMeadow.new(_Fable, 'FableTest')
				.setProvider('MySQL')
				.setSchema(_AnimalSchema.Schema)
				.setJsonSchema(_AnimalSchema.JsonSchema)
				.setDefaultIdentifier(_AnimalSchema.DefaultIdentifier)
				.setDefault(_AnimalSchema.DefaultObject)
				.setAuthorizer(_AnimalSchema.Authorization);
// Instantiate the meadow endpoints
let _MeadowEndpoints = require('../source/Meadow-Endpoints.js').new(_Meadow);

// Instantiate the service server
var _Orator = new libOrator(_Fable, libOratorServiceServerRestify);
_Orator.initializeServiceServer();

var _SQLConnectionPool = libMySQL.createPool
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

// Wire the endpoints up
_MeadowEndpoints.connectRoutes(_Orator.serviceServer);

// Now start the web server.
_Orator.startWebServer(_HarnessBehavior);
