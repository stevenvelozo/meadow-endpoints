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


		var tmpErrorMessage = 'Error creating a record.';
				if (typeof(pError) === 'object')
					tmpErrorMessage = pError.Message;

		/**
		 * Send an Error Code and Error Message to the client, and log it as an error in the log files.
		 *
		 * @method sendCodedError
		 */
		var sendCodedError = function(pDefaultMessage, pError, pRequest, pResponse, fNext)
		{
			var tmpErrorMessage = pDefaultMessage;
			var tmpErrorCode = 1;
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

			_Log.warn('API Error: '+tmpErrorMessage, {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:'APIError'});
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
			_Log.warn('API Error: '+pMessage, {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:'APIError'});
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
				pRequest.CommonServices.log.warn('Unauthenticated user attempting to get a secured resource.', {RequestID:pRequest.RequestUUID});
				pRequest.CommonServices.sendError('You must be authenticated to access this resource.', pRequest, pResponse, fNext);
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
				_Log.warn('Invalid session when attempting to get a secured resource - IDUser is not valid.', {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:'APISecurity'});
				sendNotAuthorized('You must be authenticated to access this resource.', pRequest, pResponse, fNext);
				return false;
			}

			// Check that the authentication level is valid.
			if (pRequest.UserSession.UserRoleIndex < pRequest.EndpointAuthorizationRequirement)
			{
				_Log.warn('Invalid permission level when attempting to get a secured resource.', {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:'APISecurity', RequiredUserLevel:pRequest.EndpointAuthorizationRequirement, ActualUserLevel:pRequest.UserSession.UserRoleIndex});
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
			_Log.trace('API Unauthorized Attempt: '+pMessage, {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:'APIUnauthorized'});
			pResponse.send({Error:pMessage});

			return fNext();
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
