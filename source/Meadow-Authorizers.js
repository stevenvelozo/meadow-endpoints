/**
* The Meadow Security Authorizor Collection
*
* Provide a set of security authorizers, and give the API consumer the ability to add to or modify them.
*
* @class MeadowAuthorizers
* @constructor
*/
var libUnderscore = require('underscore');

var MeadowAuthorizers = function()
{
	function createNew(pMeadow)
	{
		// If a valid fable object isn't passed in, return a constructor
		if ((typeof(pMeadow) !== 'object') || (!pMeadow.hasOwnProperty('fable')))
		{
			return {new: createNew};
		}

		// An object to hold modifications to specific authorizers.
		var _AuthorizerFunctions = {};


		/**
		* Set a specific authorizer.
		*
		* The anatomy of a authorizer function is as follows:
		*
		* var someAuthorizer = function(pRequest, fComplete)
		* {
		*      // Do some stuff with pRequest...
		*      if (pRequest.SessionData.UserRoleIndex < 5)
		*          pRequest.MeadowAuthorization = pRequest.MeadowAuthorization && false;
		*      
		*      return fComplete(false);
		* }
		*
		* It is important to note that the fComplete function expects false if no error, or a string message if there is one.
		*/
		var setAuthorizer = function(pAuthorizerHash, fAuthorizer)
		{
			_AuthorizerFunctions[pAuthorizerHash] = fAuthorizer;
		};


		/**
		* This method runs a authorizer at a specific hash, and returns true.
		* Or it returns false if there was no authorizer there.
		* Authorizers should expect their state to be in the pRequest object, per the example in setAuthorizer
		*/
		var authorize = function(pAuthorizerHash, pRequest, fComplete)
		{
			// Run an injected authorizer (if it exists)
			if (_AuthorizerFunctions.hasOwnProperty(pAuthorizerHash))
			{
				return _AuthorizerFunctions[pAuthorizerHash](pRequest, fComplete);
			}
			else
			{
				return fComplete(false);
			}
		};


		/**
		* Container Object for our Factory Pattern
		*/
		var tmpNewMeadowAuthorizer = (
		{
			setAuthorizer: setAuthorizer,
			authorize: authorize,

			new: createNew
		});

		return tmpNewMeadowAuthorizer;
	}

	return createNew();
};

module.exports = new MeadowAuthorizers();
