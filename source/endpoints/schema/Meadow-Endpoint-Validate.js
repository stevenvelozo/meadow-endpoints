/**
* Meadow Endpoint - Validate a Record
*/
const doAPIEndpointValidate = function(pRequest, pResponse, fNext)
{
	let tmpRequestState = this.initializeRequestState(pRequest, 'Validate');
	let fBehaviorInjector = (pBehaviorHash) => { return (fStageComplete) => { this.BehaviorInjection.runBehavior(pBehaviorHash, this, pRequest, tmpRequestState, fStageComplete); }; };

	this.waterfall(
		[
			fBehaviorInjector(`Validate-PreOperation`),
			(fStageComplete) =>
			{
				if (typeof(pRequest.body) !== 'object')
				{
					return fStageComplete(this.ErrorHandler.getError('Record validate failure - a valid JSON object is required.', 500));
				}
				tmpRequestState.Record = pRequest.body;
				return fStageComplete();
			},
			(fStageComplete) =>
			{
				tmpRequestState.RecordValidation = this.DAL.schemaFull.validateObject(tmpRequestState.Record);
				return fStageComplete();
			},
			fBehaviorInjector(`Validate-PostOperation`),
			(fStageComplete) =>
			{
				pResponse.send(tmpRequestState.RecordValidation);
				this.log.requestCompletedSuccessfully(pRequest, tmpRequestState, `Validated Record for ${this.DAL.scope} - ${tmpRequestState.RecordValidation}`);
				return fStageComplete();
			}
		],
		(pError) =>
		{
			return this.ErrorHandler.handleErrorIfSet(pRequest, tmpRequestState, pResponse, pError, fNext);
		}
	);
};

module.exports = doAPIEndpointValidate;