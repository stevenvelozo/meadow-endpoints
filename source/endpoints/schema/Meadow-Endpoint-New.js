/**
* Meadow Endpoint - Get a New, empty Record
*/
const doAPIEndpointNew = function(pRequest, pResponse, fNext)
{
	let tmpRequestState = this.initializeRequestState(pRequest, 'New');
	let fBehaviorInjector = (pBehaviorHash) => { return (fStageComplete) => { this.BehaviorInjection.runBehavior(pBehaviorHash, this, pRequest, tmpRequestState, fStageComplete); }; };

	this.waterfall(
		[
			fBehaviorInjector(`New-PreOperation`),
			(fStageComplete) =>
			{
				// If during the PreOperation this was set, we can
				if (!tmpRequestState.EmptyEntityRecord)
				{
					tmpRequestState.EmptyEntityRecord = this.extend({}, this.DAL.schemaFull.defaultObject);
				}
				return fStageComplete();
			},
			fBehaviorInjector(`New-PostOperation`),
			(fStageComplete) =>
			{
				pResponse.send(tmpRequestState.EmptyEntityRecord);
				this.log.requestCompletedSuccessfully(pRequest, tmpRequestState, `Delivered New ${this.DAL.scope} Record`);
				return fStageComplete();
			}
		],
		(pError) =>
		{
			return this.ErrorHandler.handleErrorIfSet(pRequest, tmpRequestState, pResponse, pError, fNext);
		}
	);
};

module.exports = doAPIEndpointNew;