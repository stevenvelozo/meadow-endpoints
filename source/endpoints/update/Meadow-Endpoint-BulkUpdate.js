/**
* Meadow Endpoint - Update a set of Records
*/
const doUpdate = require('./Meadow-Operation-Update.js');

const doAPIEndpointUpdate = function(pRequest, pResponse, fNext)
{
	// Configure the request for the generic update operation
	pRequest.UpdatedRecords = [];
	let tmpRequestState = initializeRequestState(pRequest, 'UpdateBulk');

	this.waterfall(
		[
			(fStageComplete) =>
			{
				//1. Validate request body to ensure it is a valid record
				if (!Array.isArray(pRequest.body))
				{
					return fStageComplete(this.ErrorHandler.getError('Record update failure - a valid record is required.', 500));
				}

				pRequest.BulkRecords = pRequest.body;

				return fStageComplete(null);
			},
			(fStageComplete) =>
			{
				libAsync.eachSeries(pRequest.BulkRecords,
					(pRecord, fCallback) =>
					{
						doUpdate(pRecord, pRequest, pResponse, fCallback);
					}, fStageComplete);
			},
			(fStageComplete) =>
			{
				//5. Respond with the new record
				return this.streamRecordsToResponse(pResponse, pRequest.UpdatedRecords, fStageComplete);
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

module.exports = doAPIEndpointUpdate;
