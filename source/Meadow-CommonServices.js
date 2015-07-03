/**
* The Meadow Common Services Provider
*
* This class aims to provide anything that every request will need.
*
* @class MeadowCommonServices
* @constructor
*/
var MeadowCommonServices = function()
{
	function createNew(pMeadow)
	{
		// If a valid fable object isn't passed in, return a constructor
		if ((typeof(pMeadow) !== 'object') || (!pMeadow.hasOwnProperty('fable')))
		{
			return {new: createNew};
		}

		var _Meadow = pMeadow;
		var _Log = _Meadow.fable.log;

		var libRestify = require('restify');


		/**
		 * Send an Error to the client, and log it as an error in the log files.
		 *
		 * @method sendError
		 */
		var sendError = function(pMessage, pRequest, pResponse, fNext)
		{
			var tmpNext = (typeof(fNext) === 'function') ? fNext : function () {};

			_Log.warn('API Error: '+pMessage, {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:'APIError'});
			pResponse.send({Error:pMessage});

			return tmpNext();
		};


		/**
		 * Check that the user has an appropriate user level to use the current endpoint
		 *
		 * @method authorizeEndpoint
		 */
		var authorizeEndpoint = function(pRequest, pResponse, fNext)
		{
			// Check that the user has a valid ID.
			var tmpIDUser = pRequest.SessionData.UserID;
			if (tmpIDUser < 1)
			{
				_Log.warn('Invalid session when attempting to get a secured resource - IDUser is not valid.', {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:'APISecurity'});
				sendError('You must be authenticated to access this resource.', pRequest, pResponse, fNext);

				return false;
			}

			// Check that the authentication level is valid.
			if (pRequest.SessionData.UserRoleIndex < pRequest.EndpointAuthorizationRequirement)
			{
				_Log.warn('Invalid permission level when attempting to get a secured resource.', {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:'APISecurity', RequiredUserLevel:pRequest.EndpointAuthorizationRequirement, ActualUserLevel:pRequest.SessionData.UserRoleIndex});
				// TODO: Send the proper http status code
				sendError('You must be appropriately authenticated to access this resource.', pRequest, pResponse, fNext);

				return false;				
			}

			return true;
		}


		/**
		 * Send a not authorized response to the client, and log it in the log files.
		 *
		 * @method sendNotAuthorized
		 */
		var sendNotAuthorized = function(pMessage, pRequest, pResponse, fNext)
		{
			var tmpNext = (typeof(fNext) === 'function') ? fNext : function () {};

			// TODO: Use the proper http code
			_Log.trace('API Unauthorized Attempt: '+pMessage, {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:'APIUnauthorized'});
			pResponse.send({Error:pMessage});

			return tmpNext();
		};


		/**
		* Container Object for our Factory Pattern
		*/
		var tmpNewMeadowCommonServices = (
		{
			authorizeEndpoint: authorizeEndpoint,

			sendError: sendError,
			sendNotAuthorized: sendNotAuthorized,

			// Restify body parser passed through, for any POST and PUT requests
			bodyParser: libRestify.bodyParser,

			new: createNew
		});

		// Turn the common services object into a first-class Fable object
		_Meadow.fable.addServices(tmpNewMeadowCommonServices);

		return tmpNewMeadowCommonServices;
	}

	return createNew();
};

module.exports = new MeadowCommonServices();
