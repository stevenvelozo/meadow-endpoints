/**
* Meadow Endpoint - Get the Record Schema
*/
const doAPIEndpointSchema = function (pRequest, pResponse, fNext)
{
	// The hash for the endpoint (used for authorization and authentication)
	let tmpRequestState = initializeRequestState(pRequest, 'Schema');

	this.waterfall(
		[
			(fStageComplete) =>
			{
				this.BehaviorInjection.runBehaviorWithContext(`Schema-PreOperation`, pRequest, tmpRequestState, this, fStageComplete);
			},
			(fStageComplete) =>
			{
				// If during the PreOperation this was set, we can
				if (!pRequest.JSONSchema)
				{
					tmpRequestState.JSONSchema = this.DAL.jsonSchema;
				}
				return fStageComplete();
			},
			(fStageComplete) =>
			{
				this.BehaviorInjection.runBehaviorWithContext(`Schema-PostOperation`, pRequest, tmpRequestState, this, fStageComplete);
			},
			(fStageComplete) =>
			{
				pResponse.send(tmpRequestState.JSONSchema);
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
};

module.exports = doAPIEndpointSchema;