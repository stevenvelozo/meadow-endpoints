const libAsyncWaterfall = require('async/waterfall');

const libBaseLogController = require('./components/Meadow-Endpoints-Controller-Log.js')

const libBaseErrorController = require('./components/Meadow-Endpoints-Controller-Error.js');
const libBaseBehaviorInjectionController = require('./components/Meadow-Endpoints-Controller-BehaviorInjection.js');

const libMeadowEndpointsFilterParser = require('./utility/Meadow-Endpoints-Filter-Parser.js');
const libMeadowEndpointsSessionMarshaler = require('./utility/Meadow-Endpoints-Session-Marshaler.js');
const libMeadowEndpointsStreamRecordArray = require('./utility/Meadow-Endpoints-Stream-RecordArray.js');

class MeadowEndpointControllerBase
{
	constructor(pMeadowEndpoints)
	{
		this.DAL = pMeadowEndpoints.DAL;
		this.ControllerOptions = pMeadowEndpoints._ControllerOptions

		// Application Services
		this._Settings = false;
		this._LogController = false;

		// Logic and Behavior
		this._BehaviorInjectionController = false;
		this._ErrorController = false;

		// Internal async utility functions
		this.waterfall = this.DAL.fable.Utility.waterfall;
		this.extend = this.DAL.fable.Utility.extend;

		if ((typeof(pControllerOptions) != 'object') || pControllerOptions.hasOwnProperty('ControllerClass'))
		{
			this.initializeDefaultUnsetControllers(this);
		}

		// Behavior functions
		this._FilterParser = new libMeadowEndpointsFilterParser(this);
		this._SessionMarshaler = new libMeadowEndpointsSessionMarshaler(this);
		this._StreamRecordArray = new libMeadowEndpointsStreamRecordArray(this);
	}

	initializeDefaultUnsetControllers(pController)
	{
		// Application Services
		if (!this._Settings)
		{
			this._Settings = pController.DAL.fable.settings;
		}
		if (!this._Settings.hasOwnProperty('MeadowEndpointsDefaultSessionObject'))
		{
			this._Settings.MeadowEndpointsDefaultSessionObject = (
				{
					CustomerID: 0,
					SessionID: '',
					DeviceID: '',
					UserID: 0,
					UserRole: '',
					UserRoleIndex: 0,
					LoggedIn: false
				});
		}
		if (!this._LogController)
		{
			this._LogController = new libBaseLogController(pController);
		}
		if (!this._BehaviorInjectionController)
		{
			this._BehaviorInjectionController = new libBaseBehaviorInjectionController(pController);
		}
		if (!this._ErrorController)
		{
			this._ErrorController = new libBaseErrorController(pController);
		}
	}

	initializeRequestState(pRequest, pVerb)
	{
		let tmpRequestState = {};

		tmpRequestState.Verb = (typeof(pVerb) == 'string') ? pVerb : 'Unnamed_Custom_Behavior';
		tmpRequestState.SessionData = this.getSessionData(pRequest);

		return tmpRequestState;
	}

	// Override this to provide an alternate ending function that is run with every endpoint.
	_BeginDataRequestFunction(pRequest, pResponse, fNext)
	{
		return fNext();
	}

	beginMeadowRequest(pRequest, pResponse, fNext)
	{
		this._BeginDataRequestFunction(pRequest, pResponse, fNext);
	}

	// Override this to provide an alternate ending function that is run with every endpoint.
	_EndDataRequestFunction(pRequest, pResponse, fNext)
	{
		return fNext();
	}

	endMeadowRequest(pRequest, pResponse, fNext)
	{
		this._EndDataRequestFunction(pRequest, pResponse, fNext);
	}

	// Application Services
	get settings() {return this._Settings; }
	set settings(pSettings) { this._Settings = pSettings; }

	get log() {return this._LogController; }
	set log(pLogController) { this._LogController = pLogController; }

	// Logic and Behavior
	get BehaviorInjection() {return this._BehaviorInjectionController; }
	set BehaviorInjection(pBehaviorInjectionController) { this._BehaviorInjectionController = pBehaviorInjectionController; }

	get ErrorHandler() {return this._ErrorController; }
	set ErrorHandler(pErrorController) { this._ErrorController = pErrorController; }

	parseFilter(pFilterString, pQuery)
	{
		return this._FilterParser.parseFilter(pFilterString, pQuery);
	}

	doStreamRecordArray(pResponse, pRecords, fCallback)
	{
		return this._StreamRecordArray.streamRecordArray(pResponse, pRecords, fCallback);
	}

	getSessionData(pRequest)
	{
		return this._SessionMarshaler.getSessionData(pRequest);
	}
}

module.exports = MeadowEndpointControllerBase;

// Export the base classes for the controller components, for inheritance
module.exports.BaseErrorController = libBaseErrorController;
module.exports.BaseBehaviorInjectionController = libBaseBehaviorInjectionController;

module.exports.BaseFilterParser = libMeadowEndpointsFilterParser;
module.exports.BaseSessionMarshaler = libMeadowEndpointsSessionMarshaler;
module.exports.BaseStreamRecordArray = libMeadowEndpointsStreamRecordArray;
