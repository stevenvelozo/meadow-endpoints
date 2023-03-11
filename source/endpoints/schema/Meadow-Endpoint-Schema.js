/**
* Meadow Endpoint - Get the Record Schema
*/
const doAPIEndpointSchema = function (pRequest, pResponse, fNext)
{
	let tmpRequestState = this.initializeRequestState(pRequest, 'Schema');
	let fBehaviorInjector = (pBehaviorHash) => { return (fStageComplete) => { this.BehaviorInjection.runBehavior(pBehaviorHash, this, pRequest, tmpRequestState, fStageComplete); }; };

	this.waterfall(
		[
			fBehaviorInjector(`Schema-PreOperation`),
			(fStageComplete) =>
			{
				// If during the PreOperation this was set, we won't overwrite
				if (!pRequest.JSONSchema)
				{
					tmpRequestState.JSONSchema = this.extend({}, this.DAL.jsonSchema);
				}
				return fStageComplete();
			},
			fBehaviorInjector(`Schema-PostOperation`),
			(fStageComplete) =>
			{
				pResponse.send(tmpRequestState.JSONSchema);
				this.log.requestCompletedSuccessfully(pRequest, tmpRequestState, `Delivered JSONSchema for ${this.DAL.scope}`);
				return fStageComplete();
			}
		],
		(pError) =>
		{
			return this.ErrorHandler.handleErrorIfSet(pRequest, tmpRequestState, pResponse, pError, fNext);
		}
	);
};

module.exports = doAPIEndpointSchema;