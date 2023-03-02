class MeadowEndpointsControllerErrorBase
{
    constructor(pController)
	{
        this._Controller = pController;
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
	sendError(pRequest, pRequestState, pResponse, pError, fCallback)
	{
		this._Controller.log.logRequestError(pRequest, pError);

		// TODO: Detect if we've already sent headers?
		if (!this._Controller.ControllerOptions.SendErrorStatusCodes)
		{
			pResponse.status(pError.StatusCode);
		}
		pResponse.send({Error:pError.message, Code:pError.code , StatusCode:pError.StatusCode, Stack:pError.stack});

		fCallback(pError);
	}
}

module.exports = MeadowEndpointsControllerErrorBase;