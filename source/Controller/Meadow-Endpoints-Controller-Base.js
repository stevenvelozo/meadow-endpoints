const libAsyncWaterfall = require('async/waterfall');

const libBaseErrorController = require('./components/Meadow-Endpoints-Controller-Error.js');
const libBaseBehaviorInjectionController = require('./components/Meadow-Endpoints-Controller-BehaviorInjection.js');

const libBaseAuthenticationController = require('./components/Meadow-Endpoints-Controller-Authentication.js');
const libBaseAuthorizationController = require('./components/Meadow-Endpoints-Controller-Authorization.js');

class MeadowEndpointControllerBase
{
	constructor(pMeadowEndpoints, pControllerOptions)
	{
		// Application Services
		this._Settings = false;
		this._LogController = false;

		// Logic and Behavior
		this._BehaviorInjectionController = false;
		this._ErrorController = false;

		// Security
		this._AuthenticationController = false;
		this._AuthorizationController = false;

		this.DAL = pMeadowEndpoints.DAL;

		this.waterfall = this.DAL.fable.Utility.waterfall;
		this.extend = this.DAL.fable.Utility.extend;

		if ((typeof(pControllerOptions) != 'object') || pControllerOptions.hasOwnProperty('ControllerClass'))
		{
			this.initializeDefaultUnsetControllers(pMeadowEndpoints);
		}
	}

	initializeDefaultUnsetControllers(pMeadowEndpoints, pControllerOptions)
	{
		// Application Services
		if (!this._Settings)
		{
			this._Settings = pMeadowEndpoints.DAL.fable.settings;
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
			this._LogController = pMeadowEndpoints.DAL.fable.log;
		}

		if (!this._BehaviorInjectionController)
		{
			this._BehaviorInjectionController = new libBaseBehaviorInjectionController(pMeadowEndpoints, pControllerOptions);
		}
		if (!this._ErrorController)
		{
			this._ErrorController = new libBaseErrorController(pMeadowEndpoints, pControllerOptions);
		}

		if (!this._AuthenticationController)
		{
			this._AuthenticationController = new libBaseAuthenticationController(pMeadowEndpoints, pControllerOptions);
		}
		if (!this._AuthorizationController)
		{
			this._AuthorizationController = new libBaseAuthorizationController(pMeadowEndpoints, pControllerOptions);
		}
	}

	// Application Services
	get settings() {return this._Settings; }
	set settings(pSettings) { this._Settings = pSettings; }

	get log() {return this._LogController; }
	set log(pLogController) { this._LogController = pLogController; }

	// Logic and Behavior
	get BehaviorInjection() {return this._BehaviorInjectionController; }
	set BehaviorInjection(pBehaviorInjectionController) { this._BehaviorInjectionController = pBehaviorInjectionController; }
	get Error() {return this._ErrorController; }
	set Error(pErrorController) { this._ErrorController = pErrorController; }

	// Security
	get Authentication() {return this._AuthenticationController; }
	set Authentication(pAuthenticationController) { this._AuthenticationController = pAuthenticationController; }
	get Authorization() {return this._AuthorizationController; }
	set Authorization(pAuthorizationController) { this._AuthorizationController = pAuthorizationController; }

	getSessionData(pRequest)
	{
		let tmpSession = Object.assign({}, this._Settings.MeadowEndpointsDefaultSessionObject);

		switch (this._Settings.MeadowEndpointsSessionDataSource || 'Request')
		{
			default:
				this._LogController.warn(`Unknown session source configured: ${_SessionDataSource} - defaulting to Request for backward compatibility`);
			case 'Request':
				// noop - already set by orator-session
				tmpSession = this.extend(tmpSession, pRequest.UserSession);
				break;
			case 'None':
				break;
			case 'Header':
				try
				{
					const tmpHeaderSessionString = pRequest.headers['x-trusted-session'];
					if (!tmpHeaderSessionString)
					{
						break;
					}
					tmpHeaderSession = JSON.parse(tmpHeaderSessionString);
					tmpSession = this.extend(tmpSession, pRequest.tmpHeaderSession);
				}
				catch (pError)
				{
					this._LogController.error(`Meadow Endpoints attempted to process a Header Session String with value [${tmpHeaderSessionString}] and failed -- likely culprit is bad JSON.`)
				}
				break;
		}

		// Do we keep this here for backwards compatibility?
		pRequest.UserSession = tmpSession;

		return tmpSession;
	}
}

module.exports = MeadowEndpointControllerBase;

// Export the base classes for the controller components, for inheritance
module.exports.ErrorControllerBase = libBaseErrorController;
module.exports.BehaviorInjectionControllerBase = libBaseBehaviorInjectionController;

module.exports.AuthenticationControllerBase = libBaseAuthenticationController;
module.exports.AuthorizationControllerBase = libBaseAuthorizationController;
