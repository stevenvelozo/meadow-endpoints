/**
* Meadow Endpoints Service Data Broker Library
*
* @license MIT
* @author Steven Velozo <steven@velozo.com>
*/

const libMeadowEndpointsControllerBase = require('./Controller/Meadow-Endpoints-Controller-Base.js');

class MeadowEndpoints
{
	constructor(pMeadow, pControllerOptions)
	{
		this._Meadow = pMeadow;
		// This is for backwards compatibility
		this.DAL = this._Meadow;

		this._Controller = false;
		this._ControllerOptions = pControllerOptions;

		if (typeof(pMeadow) != 'object')
		{
			throw new Error('Meadow endpoints requires a valid Meadow DAL object as the first parameter of the constructor.');
		}

		if ((typeof(pControllerOptions) == 'object') && pControllerOptions.hasOwnProperty('ControllerInstance'))
		{
			// Passed in already instantiated controller instance
			this._Controller = pControllerOptions.ControllerInstance;
		}
		else if ((typeof(pControllerOptions) == 'object') && pControllerOptions.hasOwnProperty('ControllerClass'))
		{
			// Passed in controller class, ready to initialize
			this._Controller = new pControllerOptions.ControllerClass(this, pControllerOptions);
		}
		else
		{
			this._Controller = new libMeadowEndpointsControllerBase(this, pControllerOptions);
		}

		// Pull version from the settings; default to 1.0
		this.EndpointVersion = this._Controller.settings.MeadowEndpointVersion || '1.0';
		// Pull endpoint name from settings if the user to override the endpoint "name" eventually.
		this.EndpointName = this.DAL.scope;
		// This allows a wily developer to change what this prefix is....
		this.EndpointPrefix = `/${this.EndpointVersion}/${this.EndpointName}`;

		// The default behavior sets available.
		// Turning these off before wiring the endpoints up will result in their counterpart endpoints not being available.
		this._EnabledBehaviorSets = (
		{
			Create: true,
			Read: true,
			Reads: true,
			Update: true,
			Delete: true,
			Count: true,
			Schema: true,
			Validate: true,
			New: true
		});

		// The default endpoints
		this._Endpoints = (
		{
			Create: require('./crud/Meadow-Endpoint-Create.js'),
			Creates: require('./crud/Meadow-Endpoint-BulkCreate.js'),

			Read: require('./crud/Meadow-Endpoint-Read.js'),
			ReadMax: require('./crud/Meadow-Endpoint-ReadMax.js'),

			Reads: require('./crud/Meadow-Endpoint-Reads.js'),
			ReadsBy: require('./crud/Meadow-Endpoint-ReadsBy.js'),

			ReadSelectList: require('./crud/Meadow-Endpoint-ReadSelectList.js'),
			ReadLiteList: require('./crud/Meadow-Endpoint-ReadLiteList.js'),
			ReadDistinctList: require('./crud/Meadow-Endpoint-ReadDistinctList.js'),

			Update: require('./crud/Meadow-Endpoint-Update.js'),
			Updates: require('./crud/Meadow-Endpoint-BulkUpdate.js'),

			Upsert: require('./crud/Meadow-Endpoint-Upsert.js'),
			Upserts: require('./crud/Meadow-Endpoint-BulkUpsert.js'),

			Delete: require('./crud/Meadow-Endpoint-Delete.js'),
			Undelete: require('./crud/Meadow-Endpoint-Undelete.js'),

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
	}

	/**
	* Customize a default endpoint (or create more)
	*
	* @method setEndpoint
	*/
	setBehaviorEndpoint(pEndpointHash, fEndpoint)
	{
		if (typeof(fEndpoint) === 'function')
		{
			this._Endpoints[pEndpointHash] = fEndpoint;
		}

		return this;
	}

	connectRoute(pServiceServer, pRequestMethod, pRoutePartial, pEndpointProcessor, pBehaviorName)
	{
		let tmpRoute = `${this.EndpointPrefix}${pRoutePartial}`;
		let tmpBehaviorName = (typeof(pBehaviorName) == 'string') ? pBehaviorName : 'an unnamed custom behavior'

		this._Controller.log.trace(`...meadow-endpoints mapping a ${pRequestMethod} endpoint for scope ${this.DAL.scope} on route [${tmpRoute}] which runs ${tmpBehaviorName}.`);

		try
		{
			(pServiceServer[pRequestMethod])(tmpRoute, pEndpointProcessor.bind(this._Controller));
		}
		catch (pServiceServerRouteConnectError)
		{
			this._Controller.log.error(`...error mapping ${pBehaviorName} to method ${pRequestMethod} for scope ${this.DAL.scope} to route [${tmpRoute}]: ${pServiceServerRouteConnectError}`, pServiceServerRouteConnectError);
		}
		return true;
	}

	connectRoutes(pServiceServer)
	{
		this._Controller.log.trace(`Creating automatic meadow endpoints at prefix [${this.EndpointPrefix}] for scope ${this.DAL.scope}...`);

		// These special schema services must come in the route table before the READ because they
		// technically block out the routes for the IDRecord 'Schema' (e.g. GET[/1.0/EntityName/Schema] ==NEEDS=> GET[/1.0/EntityName/100])
		if (this._EnabledBehaviorSets.Schema)
		{
			this.connectRoute(pServiceServer, 'get', `/Schema`, this._Endpoints.Schema, `the internal behavior _Endpoints.Schema`);
		}
		if (this._EnabledBehaviorSets.New)
		{
			this.connectRoute(pServiceServer, 'get', `/Schema/New`, this._Endpoints.New, `the internal behavior _Endpoints.New`);
		}
		if (this._EnabledBehaviorSets.Validate)
		{
			this.connectRoute(pServiceServer, 'post', `/Schema/Validate`, this._Endpoints.Validate, `the internal behavior _Endpoints.Validate`);
		}

		// Standard CRUD and Count endpoints
		if (this._EnabledBehaviorSets.Create)
		{
			this.connectRoute(pServiceServer, 'post', ``, this._Endpoints.Create, `the internal behavior _Endpoints.Create`);
			this.connectRoute(pServiceServer, 'post', `s`, this._Endpoints.Creates, `the internal behavior _Endpoints.Creates`);
		}
		if (this._EnabledBehaviorSets.Read)
		{
			this.connectRoute(pServiceServer, 'get', `/Max/:ColumnName`, this._Endpoints.ReadMax, `the internal behavior _Endpoints.ReadMax`);
			this.connectRoute(pServiceServer, 'get', `/:IDRecord`, this._Endpoints.Read, `the internal behavior _Endpoints.Read`);
		}
		if (this._EnabledBehaviorSets.Reads)
		{
			this.connectRoute(pServiceServer, 'get', `s`, this._Endpoints.Reads, `the internal behavior _Endpoints.Reads`);
			this.connectRoute(pServiceServer, 'get', `s/By/:ByField/:ByValue`, this._Endpoints.ReadsBy, `the internal behavior _Endpoints.ReadsBy`);
			this.connectRoute(pServiceServer, 'get', `s/By/:ByField/:ByValue/:Begin/:Cap`, this._Endpoints.ReadsBy, `the internal behavior _Endpoints.ReadsBy`);
			this.connectRoute(pServiceServer, 'get', `s/FilteredTo/:Filter`, this._Endpoints.Reads, `the internal behavior _Endpoints.Reads`);
			this.connectRoute(pServiceServer, 'get', `s/FilteredTo/:Filter/:Begin/:Cap`, this._Endpoints.Reads, `the internal behavior _Endpoints.Reads`);
			this.connectRoute(pServiceServer, 'get', `Select`, this._Endpoints.ReadSelectList, `the internal behavior _Endpoints.ReadSelectList`);
			this.connectRoute(pServiceServer, 'get', `Select/FilteredTo/:Filter`, this._Endpoints.ReadSelectList, `the internal behavior _Endpoints.ReadSelectList`);
			this.connectRoute(pServiceServer, 'get', `Select/FilteredTo/:Filter/:Begin/:Cap`, this._Endpoints.ReadSelectList, `the internal behavior _Endpoints.ReadSelectList`);
			this.connectRoute(pServiceServer, 'get', `Select/:Begin/:Cap`, this._Endpoints.ReadSelectList, `the internal behavior _Endpoints.ReadSelectList`);
			this.connectRoute(pServiceServer, 'get', `s/Lite`, this._Endpoints.ReadLiteList, `the internal behavior _Endpoints.ReadLiteList`);
			this.connectRoute(pServiceServer, 'get', `s/Lite/FilteredTo/:Filter`, this._Endpoints.ReadLiteList, `the internal behavior _Endpoints.ReadLiteList`);
			this.connectRoute(pServiceServer, 'get', `s/Lite/FilteredTo/:Filter/:Begin/:Cap`, this._Endpoints.ReadLiteList, `the internal behavior _Endpoints.ReadLiteList`);
			this.connectRoute(pServiceServer, 'get', `s/Lite/:Begin/:Cap`, this._Endpoints.ReadLiteList, `the internal behavior _Endpoints.ReadLiteList`);
			this.connectRoute(pServiceServer, 'get', `s/LiteExtended/:ExtraColumns`, this._Endpoints.ReadLiteList, `the internal behavior _Endpoints.ReadLiteList`);
			this.connectRoute(pServiceServer, 'get', `s/LiteExtended/:ExtraColumns/FilteredTo/:Filter`, this._Endpoints.ReadLiteList, `the internal behavior _Endpoints.ReadLiteList`);
			this.connectRoute(pServiceServer, 'get', `s/LiteExtended/:ExtraColumns/FilteredTo/:Filter/:Begin/:Cap`, this._Endpoints.ReadLiteList, `the internal behavior _Endpoints.ReadLiteList`);
			this.connectRoute(pServiceServer, 'get', `s/LiteExtended/:ExtraColumns/:Begin/:Cap`, this._Endpoints.ReadLiteList, `the internal behavior _Endpoints.ReadLiteList`);
			this.connectRoute(pServiceServer, 'get', `s/Distinct/:Columns`, this._Endpoints.ReadDistinctList, `the internal behavior _Endpoints.ReadDistinctList`);
			this.connectRoute(pServiceServer, 'get', `s/Distinct/:Columns/FilteredTo/:Filter`, this._Endpoints.ReadDistinctList, `the internal behavior _Endpoints.ReadDistinctList`);
			this.connectRoute(pServiceServer, 'get', `s/Distinct/:Columns/FilteredTo/:Filter/:Begin/:Cap`, this._Endpoints.ReadDistinctList, `the internal behavior _Endpoints.ReadDistinctList`);
			this.connectRoute(pServiceServer, 'get', `s/Distinct/:Columns/:Begin/:Cap`, this._Endpoints.ReadDistinctList, `the internal behavior _Endpoints.ReadDistinctList`);
			this.connectRoute(pServiceServer, 'get', `s/:Begin/:Cap`, this._Endpoints.Reads, `the internal behavior _Endpoints.Reads`);
		}
		if (this._EnabledBehaviorSets.Update)
		{
			this.connectRoute(pServiceServer, 'put', ``, this._Endpoints.Update, `the internal behavior _Endpoints.Update`);
			this.connectRoute(pServiceServer, 'put', `s`, this._Endpoints.Updates, `the internal behavior _Endpoints.Updates`);
			this.connectRoute(pServiceServer, 'put', `/Upsert`, this._Endpoints.Upsert, `the internal behavior _Endpoints.Upsert`);
			this.connectRoute(pServiceServer, 'put', `/Upserts`, this._Endpoints.Upserts, `the internal behavior _Endpoints.Upserts`);
		}
		if (this._EnabledBehaviorSets.Delete)
		{
			this.connectRoute(pServiceServer, 'del', ``, this._Endpoints.Delete, `the internal behavior _Endpoints.Delete`);
			this.connectRoute(pServiceServer, 'del', `/:IDRecord`, this._Endpoints.Delete, `the internal behavior _Endpoints.Delete`);
			this.connectRoute(pServiceServer, 'get', `/Undelete/:IDRecord`, this._Endpoints.Undelete, `the internal behavior _Endpoints.Undelete`);
		}
		if (this._EnabledBehaviorSets.Count)
		{
			this.connectRoute(pServiceServer, 'get', `s/Count`, this._Endpoints.Count, `the internal behavior _Endpoints.Count`);
			this.connectRoute(pServiceServer, 'get', `s/Count/By/:ByField/:ByValue`, this._Endpoints.CountBy, `the internal behavior _Endpoints.CountBy`);
			this.connectRoute(pServiceServer, 'get', `s/Count/FilteredTo/:Filter`, this._Endpoints.Count, `the internal behavior _Endpoints.Count`);
		}
	}
}


// This is for backwards compatibility
function autoConstruct(pMeadow, pControllerOptions)
{
	return new MeadowEndpoints(pMeadow, pControllerOptions);
}

module.exports = MeadowEndpoints;
module.exports.new = autoConstruct;

module.exports.ControllerBase = libMeadowEndpointsControllerBase;