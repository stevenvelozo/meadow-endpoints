/**
* Meadow Endpoint - Upsert a set of Records
*/
const doUpsert = require('./Meadow-Operation-Upsert.js');

const marshalLiteList = require('../read/Meadow-Marshal-LiteList.js');

const doAPIEndpointUpserts = function(pRequest, pResponse, fNext)
{
	// Configure the request for the generic upsert operation
	pRequest.CreatedRecords = [];
	pRequest.UpdatedRecords = [];
	pRequest.UpsertedRecords = [];
	let tmpRequestState = initializeRequestState(pRequest, 'UpsertBulk');

	this.waterfall(
		[
			(fStageComplete) =>
			{
				//1. Validate request body to ensure it is a valid record
				if (!Array.isArray(pRequest.body))
				{
					return fStageComplete(this.ErrorHandler.getError('Record upsert failure - a valid record is required.', 500));
				}

				pRequest.BulkRecords = pRequest.body;

				return fStageComplete(null);
			},
			(fStageComplete) =>
			{
				libAsync.eachSeries(pRequest.BulkRecords,
					(pRecord, fCallback) =>
					{
						doUpsert(pRecord, pRequest, pResponse, fCallback);
					}, fStageComplete);
			},
			(fStageComplete) =>
			{
				//5. Respond with the new records
				return this.streamRecordsToResponse(pResponse, marshalLiteList(pRequest.UpsertedRecords, pRequest), fStageComplete);
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
module.exports = doAPIEndpointUpserts;