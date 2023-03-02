class MeadowEndpointsControllerLogBase
{
    constructor(pController)
	{
        this._Controller = pController;
    }

    // This is called whenever an endpoint is completed successfully
	requestCompletedSuccessfully(pRequest, pRequestState, pActionSummary)
	{
		this._Controller.log.info(pActionSummary,
			{
				SessionID: pRequest.SessionData.SessionID,
				RequestID: pRequest.RequestUUID,
				RequestURL: pRequest.url,
				Scope: this._Controller.DAL.scope,
				Action: `${this._Controller.DAL.scope}-${pRequest.Verb}`,
				Verb: pRequest.Verb
			});
	}

    // This is called whenever an endpoint is completed successfully
	logRequestError(pRequest, pError)
	{
		this._Controller.log.error(pError.message,
			{
				SessionID: pRequest.SessionData.SessionID,
				RequestID: pRequest.RequestUUID,
				RequestURL: pRequest.url,
				Scope: this._Controller.DAL.scope,
				Action: `${this._Controller.DAL.scope}-${pRequest.Verb}`,
				Verb: pRequest.Verb,
                Error: pError.message,
                StatusCode: pError.StatusCode,
                Stack: pError.stack
			});
	}

    trace(pLogText, pLogObject)
	{
		this._Controller.DAL.log.trace(pLogText, pLogObject);
	}

	debug(pLogText, pLogObject)
	{
		this._Controller.DAL.log.debug(pLogText, pLogObject);
	}

	info(pLogText, pLogObject)
	{
		this._Controller.DAL.log.info(pLogText, pLogObject);
	}

	warn(pLogText, pLogObject)
	{
		this._Controller.DAL.log.warn(pLogText, pLogObject);
	}

	error(pLogText, pLogObject)
	{
		this._Controller.DAL.log.error(pLogText, pLogObject);
	}

	fatal(pLogText, pLogObject)
	{
		this._Controller.DAL.log.fatal(pLogText, pLogObject);
	}
}

module.exports = MeadowEndpointsControllerLogBase;