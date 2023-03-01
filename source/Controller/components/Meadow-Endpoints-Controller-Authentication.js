class MeadowEndpointsControllerAuthenticationBase
{
	constructor(pMeadowEndpoints, pControllerOptions)
	{
		// Application Services
		this._Settings = false;
		this._LogController = false;

        this._MeadowEndpoints = pMeadowEndpoints;
    }

    authenticateEndpoint(pScope, pState)
    {
        return true;
    }
}

module.exports = MeadowEndpointsControllerAuthenticationBase;