/**
* Meadow Data Broker Library
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/

/**
* Meadow Data Broker Library
*
* @class MeadowEndpoints
* @constructor
*/
var MeadowEndpoints = function()
{
	function createNew(pMeadow)
	{
		// If a valid Fable object isn't passed in, return a constructor
		if ((typeof(pMeadow) !== 'object') || (!pMeadow.hasOwnProperty('fable')))
		{
			return {new: createNew};
		}
		var _Meadow = pMeadow;
		var _Fable = pMeadow.fable;

		var libAsync = require('async');
		var libRestRouteParse = require('./Restify-RouteParser.js');

		var _CommonServices = require('./Meadow-CommonServices.js').new(pMeadow);

		// This holds any changed behaviors.
		var _BehaviorModifications = require('./Meadow-BehaviorModifications.js').new(pMeadow);

		// This holds the authorizers.
		var _Authorizers = require('./Meadow-Authorizers.js').new(pMeadow);

		// This checks that the user is authenticated.  In the future, it will be overloadable.
		var _Authenticator = require('./Meadow-Authenticator.js');

		// The default endpoints
		var _Endpoints = (
		{
			Create: require('./crud/Meadow-Endpoint-Create.js'),

			Read: require('./crud/Meadow-Endpoint-Read.js'),
			ReadMax: require('./crud/Meadow-Endpoint-ReadMax.js'),

			Reads: require('./crud/Meadow-Endpoint-Reads.js'),
			ReadsBy: require('./crud/Meadow-Endpoint-ReadsBy.js'),

			ReadSelectList: require('./crud/Meadow-Endpoint-ReadSelectList'),

			Update: require('./crud/Meadow-Endpoint-Update.js'),

			Delete: require('./crud/Meadow-Endpoint-Delete.js'),

			Count: require('./crud/Meadow-Endpoint-Count.js'),
			CountBy: require('./crud/Meadow-Endpoint-CountBy.js'),

		// Get the JSONSchema spec schema
		/* http://json-schema.org/examples.html
		 * http://json-schema.org/latest/json-schema-core.html
		 */
			Schema: require('./schema/Meadow-Endpoint-Schema.js'),
			// Validate a passed-in JSON object for if it matches the schema
			Validate: require('./schema/Meadow-Endpoint-Validate.js'),
			// Get an empty initialized JSON object for this.
			New: require('./schema/Meadow-Endpoint-New.js')
		});

		/**
		* Customize a default endpoint (or create more)
		*
		* @method setEndpoint
		*/
		var setEndpoint = function(pEndpointHash, fEndpoint)
		{
			if (typeof(fEndpoint) === 'function')
			{
				_Endpoints[pEndpointHash] = fEndpoint;
			}

			return this;
		};


		// The default authenticators
		var _EndpointAuthenticators = (
		{
			Create: _Authenticator,
			Read: _Authenticator,
			Reads: _Authenticator,
			Update: _Authenticator,
			Delete: _Authenticator,
			Count: _Authenticator,

			Schema: _Authenticator,
			Validate: _Authenticator,
			New: _Authenticator
		});

		/**
		* Customize an endpoint Authenticator
		*
		* @method setEndpointAuthenticator
		*/
		var setEndpointAuthenticator = function(pEndpointHash, fAuthenticator)
		{
			if (typeof(fAuthenticator) === 'function')
			{
				_EndpointAuthenticators[pEndpointHash] = fAuthenticator;
			}

			return this;
		};


		// The default endpoint authorization levels
		var _EndpointAuthorizationLevels = (
		{
			Create: 1,
			Read: 1,
			Reads: 1,
			Update: 1,
			Delete: 1,
			Count: 1,

			Schema: 1,
			Validate: 1,
			New: 1
		});

		/**
		* Customize an endpoint Authorization Level
		*
		* @method setEndpointAuthorization
		*/
		var setEndpointAuthorization = function(pEndpointHash, pAuthorizationLevel)
		{
			_EndpointAuthorizationLevels[pEndpointHash] = pAuthorizationLevel;
			return true;
		};


		/**
		* Add the common services object to the request early in the route chain
		*/
		var wireCommonServices = function (pRequest, pResponse, fNext)
		{
			// TODO: There is a shared state issue with using this as the source for the authorization levels.  Fix it.
			pRequest.CommonServices = _CommonServices;
			fNext();
		};


		/**
		* Add the explicit state to the request that is coming through this endpoint
		*/
		var wireState = function (pRequest, pResponse, fNext)
		{
			// TODO: There is a shared state issue with using this as the source for the authorization levels.  Fix it.
			pRequest.EndpointAuthorizationLevels = _EndpointAuthorizationLevels;
			pRequest.DAL = _Meadow;
			pRequest.BehaviorModifications = _BehaviorModifications;
			pRequest.Authorizers = _Authorizers;

			//maximum number of records to return by default on Read queries. Override via "MeadowDefaultMaxCap" fable setting.
			pRequest.DEFAULT_MAX_CAP = (_Fable.settings['MeadowDefaultMaxCap']) || 250;

			fNext();
		};

		/**
		* Reparse route parameters, attach 'formattedParams' to Request obj
		*/
		var formatRouteParams = function(pRequest, pResponse, fNext)
		{
			if (pRequest.method === 'GET')
			{
				var tmpParams = libRestRouteParse(
					pRequest.route.path,
					pRequest.url
				);

				for(var key in tmpParams)
				{
					var tmpArray = tmpParams[key].split(',');
					if (tmpArray.length > 1)
					{
						for(var i=0; i<tmpArray.length; i++)
						{
							tmpArray[i] = decodeURIComponent(tmpArray[i]);
						}

						tmpParams[key] = tmpArray;
					}
					else
					{
						tmpParams[key] = decodeURIComponent(tmpParams[key]);
					}
				}

				pRequest.formattedParams = tmpParams;
			}

			//libRestRouteParse
			return fNext();
		}


		/**
		* Wire up routes for the API
		*
		* @method connectRoutes
		* @param {Object} pRestServer The Restify server object to add routes to
		*/
		var connectRoutes = function(pRestServer)
		{
			// TODO: Pull version from the config file.
			var tmpEndpointVersion = '1.0';
			// TODO: Allow the user to override the endpoint "name" eventually.
			var tmpEndpointName = _Meadow.scope;

			_Fable.log.trace('Creating endpoint', {Version:tmpEndpointVersion, Name:tmpEndpointName});

			// Connect the common services to the route
			pRestServer.use(wireCommonServices);

			// Build formattedParams route parameters
			pRestServer.use(formatRouteParams);

			// These special schema services must come in the route table before the READ because they
			// technically block out the routes for the IDRecord 'Schema' (e.g. /1.0/EntityName/Schema)
			pRestServer.get('/1.0/'+tmpEndpointName+'/Schema', _EndpointAuthenticators.Schema, wireState, _Endpoints.Schema);
			pRestServer.get('/1.0/'+tmpEndpointName+'/Schema/New', _EndpointAuthenticators.New, wireState, _Endpoints.New);
			pRestServer.post('/1.0/'+tmpEndpointName+'/Schema/Validate', _CommonServices.bodyParser(), _EndpointAuthenticators.Validate, wireState, _Endpoints.Validate);

			// Custom single record endpoints

			// Standard CRUD and Count endpoints
			pRestServer.post('/1.0/'+tmpEndpointName, _CommonServices.bodyParser(), _EndpointAuthenticators.Create, wireState, _Endpoints.Create);
			pRestServer.get('/1.0/'+tmpEndpointName+'/Max/:ColumnName', _EndpointAuthenticators.Read, wireState, _Endpoints.ReadMax);
			pRestServer.get('/1.0/'+tmpEndpointName+'/:IDRecord', _EndpointAuthenticators.Read, wireState, _Endpoints.Read);
			pRestServer.get('/1.0/'+tmpEndpointName+'s', _EndpointAuthenticators.Reads, wireState, _Endpoints.Reads);
			pRestServer.get('/1.0/'+tmpEndpointName+'s/By/:ByField/:ByValue', _EndpointAuthenticators.Reads, wireState, _Endpoints.ReadsBy);
			pRestServer.get('/1.0/'+tmpEndpointName+'s/By/:ByField/:ByValue/:Begin/:Cap', _EndpointAuthenticators.Reads, wireState, _Endpoints.ReadsBy);
			pRestServer.get('/1.0/'+tmpEndpointName+'s/FilteredTo/:Filter', _EndpointAuthenticators.Reads, wireState, _Endpoints.Reads);
			pRestServer.get('/1.0/'+tmpEndpointName+'s/FilteredTo/:Filter/:Begin/:Cap', _EndpointAuthenticators.Reads, wireState, _Endpoints.Reads);
			pRestServer.get('/1.0/'+tmpEndpointName+'Select', _EndpointAuthenticators.Reads, wireState, _Endpoints.ReadSelectList);
			pRestServer.get('/1.0/'+tmpEndpointName+'Select/:Begin/:Cap', _EndpointAuthenticators.Reads, wireState, _Endpoints.ReadSelectList);
			pRestServer.get('/1.0/'+tmpEndpointName+'Select/FilteredTo/:Filter', _EndpointAuthenticators.Reads, wireState, _Endpoints.ReadSelectList);
			pRestServer.get('/1.0/'+tmpEndpointName+'Select/FilteredTo/:Filter/:Begin/:Cap', _EndpointAuthenticators.Reads, wireState, _Endpoints.ReadSelectList);
			pRestServer.get('/1.0/'+tmpEndpointName+'s/:Begin/:Cap', _EndpointAuthenticators.Reads, wireState, _Endpoints.Reads);
			pRestServer.put('/1.0/'+tmpEndpointName, _CommonServices.bodyParser(), _EndpointAuthenticators.Update, wireState, _Endpoints.Update);
			pRestServer.del('/1.0/'+tmpEndpointName, _CommonServices.bodyParser(), _EndpointAuthenticators.Delete, wireState, _Endpoints.Delete);
			pRestServer.del('/1.0/'+tmpEndpointName+'/:IDRecord', _EndpointAuthenticators.Delete, wireState, _Endpoints.Delete);
			pRestServer.get('/1.0/'+tmpEndpointName+'s/Count', _EndpointAuthenticators.Count, wireState, _Endpoints.Count);
			pRestServer.get('/1.0/'+tmpEndpointName+'s/Count/By/:ByField/:ByValue', _EndpointAuthenticators.Count, wireState, _Endpoints.CountBy);
			pRestServer.get('/1.0/'+tmpEndpointName+'s/Count/FilteredTo/:Filter', _EndpointAuthenticators.Count, wireState, _Endpoints.Count);
		};

		
		/**
		* Emulate a response object
		*/
		var wireResponse = function(pResponse, fCallback)
		{
			pResponse.send = function(data)
			{
				this.body = data;

				if (!data.Error)
				{
					if (data.constructor === Array)
					{
						this.Records = data;
					}
					else
					{
						this.Record = data;
					}
				}
			}

			Object.defineProperty(pResponse, 'text',
			{
				get: function() { return JSON.stringify(pResponse.body); },
				enumerable: true
			});

			return fCallback();
		}

		/**
		* Invoke a meadow endpoint programmatically
		*
		* @method invokeEndpoint
		*/
		var invokeEndpoint = function(pMethod, pData, pOptions, fCallback)
		{
			var tmpCallback = (typeof(pOptions) === 'function') ? pOptions : fCallback;

			if (!_Endpoints[pMethod])
			{
				_CommonServices.log.error('Endpoint \'' + pMethod + '\' does not exist!')
				return tmpCallback('Endpoint \'' + pMethod + '\' does not exist!'); //might be better as an exception
			}

			//TODO: should switch depending on type
			var pRequest = {params: pData, formattedParams: pData, body: pData};
			var pResponse = {};

			libAsync.waterfall([
				function(fStageComplete)
				{
					return wireResponse(pResponse, fStageComplete);
				},
				function(fStageComplete)
				{
					//allow consumer to specify user session data
					if (pOptions.SessionData)
					{
						pRequest.SessionData = pOptions.SessionData;
					}
					else
					{
						//else fill in default user session data
						pRequest.EndpointInvoked = true; //bypass session auth check
						pRequest.SessionData = { UserID: 0, UserRoleIndex: 0 };
					}
					
					pRequest.EndpointAuthenticated = true;
					
					return fStageComplete();
				},
				function(fStageComplete)
				{
					return wireCommonServices(pRequest, pResponse, fStageComplete);
				},
				function(fStageComplete)
				{
					return wireState(pRequest, pResponse, fStageComplete);
				},
				function(fStageComplete)
				{
					//Invoke the endpoint method
					_Endpoints[pMethod](pRequest, pResponse, function(err)
						{
							return fStageComplete(err, pResponse);
						});
				}
			],
			function complete(err)
			{
				return tmpCallback(err, pResponse);
			});
		}


		/**
		* Container Object for our Factory Pattern
		*/
		var tmpNewMeadowEndpointObject = (
		{
			setEndpoint: setEndpoint,
			setEndpointAuthenticator: setEndpointAuthenticator,
			setEndpointAuthorization: setEndpointAuthorization,

			wireState: wireState,

			connectRoutes: connectRoutes,

			// Expose the DAL
			DAL: _Meadow,

			invokeEndpoint: invokeEndpoint,

			// Factory
			new: createNew
		});

		/**
		 * Endpoint Authorization Levels
		 *
		 * @property endpointAuthorizationLevels
		 * @type object
		 */
		Object.defineProperty(tmpNewMeadowEndpointObject, 'endpointAuthorizationLevels',
			{
				get: function() { return _EndpointAuthorizationLevels; },
				enumerable: true
			});

		/**
		 * Behavior Modifications
		 *
		 * @property behaviorModifications
		 * @type object
		 */
		Object.defineProperty(tmpNewMeadowEndpointObject, 'behaviorModifications',
			{
				get: function() { return _BehaviorModifications; },
				enumerable: true
			});

		return tmpNewMeadowEndpointObject;
	}

	return createNew();
};

module.exports = new MeadowEndpoints();
