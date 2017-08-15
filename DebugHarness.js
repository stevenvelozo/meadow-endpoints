/**
* Test Harness
*
* @license     MIT
*
* @author      Steven Velozo <steven@velozo.com>
*/

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
	_MockSessionValidUser.UserRoleIndex = 2;
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

};

var tmpFableSettings = 	(
{
	Product: 'MockOratorAlternate',
	ProductVersion: '0.0.0',

	"UnauthorizedRequestDelay": 1000,

	APIServerPort: 8080,

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

var libFable = require('fable').new(tmpFableSettings);
tmpFableSettings = libFable.settings;

var _MockSessionValidUser = (
	{
		SessionID: '0000-VALID',
		UserID: 37,
		UserRole: 'User',
		UserRoleIndex: 1,
		LoggedIn: true,
		DeviceID: 'TEST-HARNESS'
	});
var ValidAuthentication = function(pRequest, pResponse, fNext)
{
	pRequest.UserSession = _MockSessionValidUser;
	fNext();
}

var _Meadow;
var _MeadowEndpoints;

var _AnimalSchema = require('./test/Animal.json');

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
_MeadowEndpoints = require('./source/Meadow-Endpoints.js').new(_Meadow);
var _Orator = require('orator').new(tmpFableSettings);
_Orator.enabledModules.CORS = true;
_Orator.enabledModules.FullResponse = true;
_Orator.enabledModules.Body = false;

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

// Start the web server
// Wire up an "always logged in" user in the request chain, so session is set right.
_Orator.webServer.use(ValidAuthentication);
// Wire the endpoints up
_MeadowEndpoints.connectRoutes(_Orator.webServer);

_Orator.startWebServer(_HarnessBehavior);
