class MeadowEndpointsControllerErrorBase
{
    /**
     * @param {import('../Meadow-Endpoints-Controller-Base.js')} pController
     */
    constructor(pController)
	{
        this._Controller = pController;
    }

    // Get the error object
    getError(pMessage, pStatusCode, pSuppressSoftwareTrace)
    {
		let tmpError = new Error(pMessage);

    	// Default the error status code to 400 if none is passed
		tmpError.StatusCode = (typeof(pStatusCode) == 'number') ? pStatusCode : 400;
		// This suppresses the stack trace from being sent back or logged.
		// And by default it does not send a stack trace, as we expect errors created this way to be protocol, schema or data related.
		tmpError.SuppressSoftwareTrace = (typeof(pSuppressSoftwareTrace) != 'undefined') ? pSuppressSoftwareTrace : true;

        return tmpError;
    }

    // Handle an error if set -- some errors don't send the response back because they aren't fully errory errors.
	handleErrorIfSet(pRequest, pRequestState, pResponse, pError, fCallback)
	{
		if (pError)
		{
			return this.sendError(pRequest, pRequestState, pResponse, pError, fCallback);
		}

		return fCallback();
	}

    // Send an error object
	sendError(pRequest, pRequestState, pResponse, pError, fCallback)
	{
		this._Controller.log.logRequestError(pRequest, pRequestState, pError);

		// TODO: Detect if we've already sent headers?
		if (!this._Controller.ControllerOptions.SendErrorStatusCodes)
		{
			let tmpStatusCode = (pError.hasOwnProperty('StatusCode')) ? pError.StatusCode : 500;
			pResponse.status(tmpStatusCode);
		}

		let tmpResponseObject = (
			{
				Error:pError.message,
				StatusCode:pError.StatusCode
			});

		tmpResponseObject = this._Controller.ErrorHandler.prepareRequestContextOutputObject(tmpResponseObject, pRequest, pRequestState, pError);

		pResponse.send(tmpResponseObject);

		fCallback(pError);
	}

	// This looks for some generic markers in the request state and puts them into a log or send object
	prepareRequestContextOutputObject(pObjectToPopulate, pRequest, pRequestState, pError)
	{
		// Internally created errors supress stack traces
		if (pError)
		{
			pObjectToPopulate.Error = pError.message;
			pObjectToPopulate.Code = pError.code;
			pObjectToPopulate.StatusCode = pError.StatusCode;

			if (!pError.SuppressSoftwareTrace)
			{
				pObjectToPopulate.Stack = pError.stack;
			}

			if (pRequestState.hasOwnProperty('Record'))
			{
				pObjectToPopulate.Record = pRequestState.Record;
			}

			if (pRequestState.hasOwnProperty('Query') && (typeof(pRequestState.Query) == 'object'))
			{
				if (pRequestState.Query.query)
				{
					if (typeof(pRequestState.Query.query.body) == 'string')
					{
						pObjectToPopulate.Query = pRequestState.Query.query.body;
					}

					if ((typeof(pRequestState.Query.query.parameters) == 'object'))
					{
						pObjectToPopulate.QueryParameters = pRequestState.Query.query.parameters;

						pObjectToPopulate.RebuiltQueryString = (typeof(pObjectToPopulate.Query) == 'string') ? pObjectToPopulate.Query : '';

						// This gnarly bit of code attempts to reconstruct a non prepared string version of the query, to help.
						let tmpQueryParameterSet = Object.keys(pObjectToPopulate.QueryParameters);
						for (let i = 0; i < tmpQueryParameterSet.length; i++)
						{
							switch(typeof(tmpQueryParameterSet[i]))
							{
								case 'number':
									pObjectToPopulate.RebuiltQueryString  = pObjectToPopulate.RebuiltQueryString.replace(new RegExp(`:${tmpQueryParameterSet[i]}\\b`, 'g'), `'${pObjectToPopulate.QueryParameters[tmpQueryParameterSet[i]]}'`);
									break;
								case 'string':
									// TODO: This may need more ... nuance...
									default:
									pObjectToPopulate.RebuiltQueryString  = pObjectToPopulate.RebuiltQueryString.replace(new RegExp(`:${tmpQueryParameterSet[i]}\\b`,'g'), pObjectToPopulate.QueryParameters[tmpQueryParameterSet[i]]);
									break;
							}
						}
					}
				}
			}
		}

		return pObjectToPopulate;
	}
}

module.exports = MeadowEndpointsControllerErrorBase;
