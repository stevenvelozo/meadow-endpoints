class MeadowEndpointsControllerErrorBase
{
	constructor(pMeadowEndpoints, pControllerOptions)
	{
		// Application Services
		this._Settings = false;
		this._LogController = false;

        this._MeadowEndpoints = pMeadowEndpoints;
    }

    // Get the error object
    getError(pMessage, pStatusCode)
    {
    	let tmpError = new Error(pMessage);

    	// Default the error status code to 400 if none is passed
    	tmpError.StatusCode = (typeof(pStatusCode) == 'number') ? pStatusCode : 400;

        return tmpError;
    }

    // Send an error object
	sendError(pError, pRequest, pResponse, fNext)
	{
		// TODO: Detect if we've already sent headers?
		pResponse.status(pError.StatusCode);
		pResponse.send({Error:pError.message});
	}
}

module.exports = MeadowEndpointsControllerErrorBase;