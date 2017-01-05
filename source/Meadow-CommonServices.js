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
		var libSleep = require('sleep-async')();

		/**
		 * Send an Error Code and Error Message to the client, and log it as an error in the log files.
		 *
		 * @method sendCodedError
		 */
		var sendCodedError = function(pDefaultMessage, pError, pRequest, pResponse, fNext)
		{
			var tmpErrorMessage = pDefaultMessage;
			var tmpErrorCode = 1;
			var tmpScope = null;
			var tmpParams = null;
			var tmpSessionID = null;

			if (typeof(pError) === 'object')
			{
				tmpErrorMessage = pError.Message;
				if (pError.Code)
					tmpErrorCode = pError.Code;
			}
			else if (typeof(pError) === 'string')
			{
				tmpErrorMessage += ' ' + pError;
			}
			if (pRequest.DAL)
			{
				tmpScope = pRequest.DAL.scope;
			}
			if (pRequest.params)
			{
				tmpParams = pRequest.params;
			}
			if (pRequest.UserSession)
			{
				tmpSessionID = pRequest.UserSession.SessionID;
			}

			_Log.warn('API Error: '+tmpErrorMessage, {SessionID: tmpSessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Scope: tmpScope, Parameters: tmpParams, Action:'APIError'}, pRequest);
			pResponse.send({Error:tmpErrorMessage, ErrorCode: tmpErrorCode});

			return fNext();
		};


		/**
		 * Send an Error to the client, and log it as an error in the log files.
		 *
		 * @method sendError
		 */
		var sendError = function(pMessage, pRequest, pResponse, fNext)
		{
			var tmpSessionID = null;
			if (pRequest.UserSession)
			{
				tmpSessionID = pRequest.UserSession.SessionID;
			}

			_Log.warn('API Error: '+pMessage, {SessionID: tmpSessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:'APIError'}, pRequest);
			pResponse.send({Error:pMessage});

			return fNext();
		};


		/**
		 * Check that the user has an appropriate user level to use the current endpoint
		 *
		 * @method authorizeEndpoint
		 */
		var authorizeEndpoint = function(pRequest, pResponse, fNext)
		{
			if (!pRequest.EndpointAuthenticated)
			{
				pRequest.CommonServices.log.warn('Unauthenticated user attempting to get a secured resource.', {RequestID:pRequest.RequestUUID}, pRequest);
				sendNotAuthorized('You must be authenticated to access this resource.', pRequest, pResponse, fNext);
				return false;
			}

			//Check if endpoint is being invoked programmatically, in which case
			// we bypass session authentication checks
			if (pRequest.EndpointInvoked)
			{
				return true;
			}

			// Check that the user has a valid ID.
			var tmpIDUser = pRequest.UserSession.UserID;
			if (tmpIDUser < 1)
			{
				_Log.warn('Invalid session when attempting to get a secured resource - IDUser is not valid.', {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:'APISecurity'}, pRequest);
				sendNotAuthorized('You must be authenticated to access this resource.', pRequest, pResponse, fNext);
				return false;
			}

			// Check that the authentication level is valid.
			if (pRequest.UserSession.UserRoleIndex < pRequest.EndpointAuthorizationRequirement)
			{
				_Log.warn('Invalid permission level when attempting to get a secured resource.', {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:'APISecurity', RequiredUserLevel:pRequest.EndpointAuthorizationRequirement, 				ActualUserLevel:pRequest.UserSession.UserRoleIndex}, pRequest);
				// TODO: Send the proper http status code
				sendNotAuthorized('You must be appropriately authenticated to access this resource.', pRequest, pResponse, fNext);
				return false;				
			}

			return true;
		};


		/**
		 * Send a not authorized response to the client, and log it in the log files.
		 *
		 * @method sendNotAuthorized
		 */
		var sendNotAuthorized = function(pMessage, pRequest, pResponse, fNext)
		{
			// TODO: Use the proper http code
			_Log.trace('API Unauthorized Attempt: '+pMessage, {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:'APIUnauthorized'}, pRequest);

			//cause a delay to mitigate DoS type attacks against endpoints
			libSleep.sleep((_Meadow.fable.settings.UnauthorizedRequestDelay ? _Meadow.fable.settings.UnauthorizedRequestDelay : 15000), function()
			{
				pResponse.send({Error:pMessage});

				return fNext();
			});
		};


		/**
		* Container Object for our Factory Pattern
		*/
		var tmpNewMeadowCommonServices = (
		{
			authorizeEndpoint: authorizeEndpoint,

			sendCodedError: sendCodedError,
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
