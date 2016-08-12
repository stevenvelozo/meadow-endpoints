/**
* Test Server for Meadow Load Tests
*
* @license     MIT
*
* @author      Steven Velozo <steven@velozo.com>
*/

var libFable = require('fable').new(
{
	Product: 'Meadow-Load-Test',
	ProductVersion: '1.0.0',
	
	UserIDMinimum: 1,
	UserIDMaximum: 1000,

	APIServerPort: 8080,

    LogStreams:
		[
		    {
		    	level: 'trace',
		    	path: './server_test.log'
		    }
		],

	MySQL:
		{
			// This is queued up for Travis/cloud9 defaults.
			Server: "localhost",
			Port: 3306,
			User: "root",
			Password: "",
			Database: "FableTest",
			ConnectionPoolLimit: 20
		},

	ConfigFile: __dirname + "/MeadowLoadTest-Settings.json"
});

// Jimmy up an authorizer that creates sessions:
//    * Random user IDs between UserIDMinimum and UserIDMaximum
//    * Session IDs sequentially growing; wrapping at 4 bajillion or something silly
var _SessionIndex = 0;
var getSession = function()
{
	var tmpUserID = Math.floor(Math.random() * (libFable.settings.UserIDMaximum - libFable.settings.UserIDMinimum)) + libFable.settings.UserIDMinimum;
    return (
	{
		SessionID: '0000-VALID-'+tmpUserID+'-'+_SessionIndex++,
		UserID: tmpUserID,
		UserRole: 'User',
		UserRoleIndex: 1,
		LoggedIn: true,
		DeviceID: 'TEST-HARNESS'
	});
};
var mockAuthentication = function(pRequest, pResponse, fNext)
{
	pRequest.UserSession = getSession();
	fNext();
};

// Load the schema for our test
var _TestSchema = require('./test-schema.json');

// Load up a Meadow (pointing at the Animal database)
var _Meadow = require('meadow')
				.new(libFable, 'TestRequest')
				.setProvider('MySQL')
				.setSchema(_TestSchema.Schema)
				.setJsonSchema(_TestSchema.JsonSchema)
				.setDefaultIdentifier(_TestSchema.DefaultIdentifier)
				.setDefault(_TestSchema.DefaultObject)
				.setAuthorizer(_TestSchema.Authorization);

// Instantiate the endpoints
var _MeadowEndpoints = require('../../source/Meadow-Endpoints.js').new(_Meadow);


// Setup the web server
var _Orator = require('orator').new(libFable.settings);
_Orator.enabledModules.CORS = true;
_Orator.enabledModules.FullResponse = true;
_Orator.enabledModules.Body = false;
// Map in the custom authorizer
_Orator.webServer.use(mockAuthentication);

// Wire the endpoints up
_MeadowEndpoints.connectRoutes(_Orator.webServer);

var libChancePrototype = require('chance');
var libChance = new libChancePrototype();

var _IDTestRequest_Max = 0;
// Magically create a record, and stuff the user ID in (to track the magic Meadow does)
_Orator.webServer.get
(
    '/Magic/:Index',
    function(pRequest, pResponse, fNext)
    {
        _MeadowEndpoints.invokeEndpoint('Create', 
            {   // This is the constructed record for our load test
                Name: libChance.sentence({words: 4})+'  ['+pRequest.params.Index+']',
                UserID: pRequest.UserSession.UserID
            },
            pRequest,
			function(pError, pEndpointResponse)
			{
				// Expect response to be the record we just created.
				// Set the testrequest max to be this, which isn't always accurate but is safe.
				_IDTestRequest_Max = pEndpointResponse.body.IDTestRequest;
                pResponse.send(pEndpointResponse.body);
				return fNext();
			}
	    );
    }
);

// Magically return a record, based on the current max id.  If the max ID is 0, return an empty javascript object.
_Orator.webServer.get
(
    '/Magic',
    function(pRequest, pResponse, fNext)
    {
    	if (_IDTestRequest_Max < 0)
    	{
    		// If there have been no records created return an empty object
                pResponse.send({});
				return fNext();
    	}
    	else
    	{
    		// IDRequestMax is not set
    		var tmpIDTestRequest = libChance.integer({min: 0, max: _IDTestRequest_Max});
	        _MeadowEndpoints.invokeEndpoint('Read', 
	            {
	                IDTestRequest: tmpIDTestRequest
	            },
	            pRequest,
				function(pError, pEndpointResponse)
				{
					// Expect response to be the record we just created.
	                pResponse.send(pEndpointResponse.body);
					return fNext();
				}
	    	);
    	}
    }
);

// Start the Web Server
_Orator.startWebServer (
    function()
    { 
        libFable.log.trace('--> Test server is up and running');
    });