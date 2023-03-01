class MeadowEndpointsControllerAuthorizationBase
{
	constructor(pMeadowEndpoints, pControllerOptions)
	{
		// Application Services
		this._Settings = false;
		this._LogController = false;

        this._MeadowEndpoints = pMeadowEndpoints;
    }

    authorizeEndpoint(pScope, pOperation, pState)
    {
        return true;
    }
}

module.exports = MeadowEndpointsControllerAuthorizationBase;