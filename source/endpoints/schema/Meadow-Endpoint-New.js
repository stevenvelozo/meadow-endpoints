/**
* Meadow Endpoint - Get a New, empty Record
*/
const doAPIEndpointNew = function(pRequest, pResponse, fNext)
{
	// The hash for the endpoint (used for authorization and authentication)
	let tmpRequestState = initializeRequestState(pRequest, 'New');

	this.waterfall(
		[
			(fStageComplete) =>
			{
				this.BehaviorInjection.runBehaviorWithContext(`Schema-PreOperation`, pRequest, tmpRequestState, this, fStageComplete);
			},
			(fStageComplete) =>
			{
				// If during the PreOperation this was set, we can
				if (!tmpRequestState.EmptyEntityRecord)
				{
					tmpRequestState.EmptyEntityRecord = this.extend({}, this.DAL.schemaFull.defaultObject);
				}
				return fStageComplete();
			},
			(fStageComplete) =>
			{
				this.BehaviorInjection.runBehaviorWithContext(`Schema-PostOperation`, pRequest, tmpRequestState.EmptyEntityRecord, this, fStageComplete);
			},
			(fStageComplete) =>
			{
				pResponse.send(pRequest.JSONSchema);
				this.log.requestCompletedSuccessfully(pRequest, `Delivered JSONSchema for ${this.DAL.scope}`);
				return fStageComplete();
			}
		],
		(pError) =>
		{
			if (pError)
			{
				return this.ErrorHandler.sendError(pRequest, tmpRequestState, pResponse, pError, fNext);
			}

			return fNext();
		}
	);

	let tmp


	// Standard logging -- right now requires pRequest to have a UserSession object on it
	this.logRequestComplete(pRequest, `Delivered an empty new ${this.DAL.scope}`, _Session);

	pResponse.send(tmpEmptyObject);


	return fNext();
};

module.exports = doAPIEndpointNew;