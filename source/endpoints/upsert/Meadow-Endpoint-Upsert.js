/**
* Meadow Endpoint - Upsert (Insert OR Update) a Record
*/
var doUpsert = require('./Meadow-Operation-Upsert.js');

var doAPIEndpointUpsert = function(pRequest, pResponse, fNext)
{
	let tmpRequestState = initializeRequestState(pRequest, 'Upsert');

	// Configure the request for the generic create & update operations
	pRequest.CreatedRecords = [];
	pRequest.UpdatedRecords = [];
	pRequest.UpsertedRecords = [];

	this.waterfall(
		[
			(fStageComplete) =>
			{
				//1. Validate request body to ensure it is a valid record
				if (typeof(pRequest.body) !== 'object')
				{
					return fStageComplete(this.ErrorHandler.getError('Record upsert failure - a valid record is required.', 500));
				}

				tmpRequestState.Record = pRequest.body;

				return fStageComplete(null);
			},
			(fStageComplete) =>
			{
				//4. Do the upsert operation
				doUpsert(pRequest.body, pRequest, pResponse, fStageComplete);
			},
			(fStageComplete) =>
			{
				//5. Respond with the new record

				// If there was an error, respond with that instead
				if (tmpRequestState.RecordUpsertError)
				{
					return fStageComplete(tmpRequestState.RecordUpsertErrorMessage);
				}

				pResponse.send(tmpRequestState.Record);
				return fStageComplete(null);
			}
		], (pError) =>
		{
			if (pError)
			{
				return this.ErrorHandler.sendError(pRequest, tmpRequestState, pResponse, pError, fNext);
			}

			return fNext();
		});
};

module.exports = doAPIEndpointUpsert;