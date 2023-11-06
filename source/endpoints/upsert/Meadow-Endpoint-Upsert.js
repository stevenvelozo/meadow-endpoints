/**
* Meadow Endpoint - Upsert (Insert OR Update) a Record
*/
var doUpsert = require('./Meadow-Operation-Upsert.js');

var doAPIEndpointUpsert = function(pRequest, pResponse, fNext)
{
	let tmpRequestState = this.initializeRequestState(pRequest, 'Upsert');
	let fBehaviorInjector = (pBehaviorHash) => { return (fStageComplete) => { this.BehaviorInjection.runBehavior(pBehaviorHash, this, pRequest, tmpRequestState, fStageComplete); }; };

	// Configure the request for the generic create & update operations
	tmpRequestState.CreatedRecords = [];
	tmpRequestState.UpdatedRecords = [];
	tmpRequestState.UpsertedRecords = [];
	tmpRequestState.ErrorRecords = [];

	this.waterfall(
		[
			(fStageComplete) =>
			{
				//1. Validate request body to ensure it is a valid record
				if (typeof(pRequest.body) !== 'object')
				{
					return fStageComplete(this.ErrorHandler.getError('Record upsert failure - a valid record is required.', 500));
				}

				tmpRequestState.RecordToUpsert = pRequest.body;

				return fStageComplete();
			},
			(fStageComplete) =>
			{
				doUpsert.call(this, tmpRequestState.RecordToUpsert, pRequest, tmpRequestState, pResponse, fStageComplete);
			},
			(fStageComplete) =>
			{
				if (tmpRequestState.RecordUpsertError)
				{
					return fStageComplete(tmpRequestState.RecordUpsertErrorMessage);
				}
				if (tmpRequestState.UpsertedRecords.length < 1)
				{
					return fStageComplete(this.ErrorHandler.getError('Record upsert unknown failure - no record back from Upsert operation.', 500));
				}

				tmpRequestState.Record = tmpRequestState.UpsertedRecords[0];

				pResponse.send(tmpRequestState.Record);

				return fStageComplete();
			}
		], (pError) =>
		{
			return this.ErrorHandler.handleErrorIfSet(pRequest, tmpRequestState, pResponse, pError, fNext);
		});
};

module.exports = doAPIEndpointUpsert;