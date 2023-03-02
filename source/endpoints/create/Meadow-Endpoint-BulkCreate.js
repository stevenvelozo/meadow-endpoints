/**
* Meadow Endpoint - Create a set of Record in Bulk
*/

const doCreate = require('./Meadow-Operation-Create.js');

const doAPIEndpointBulkCreate = function(pRequest, pResponse, fNext)
{
	let tmpRequestState = initializeRequestState(pRequest, 'CreateBulk');

		// Configure the request for the generic create operation
	pRequest.CreatedRecords = [];

	this.waterfall(
		[
			(fStageComplete) =>
			{
				if (!Array.isArray(pRequest.body))
				{
					return fStageComplete(this.ErrorHandler.getError('Bulk record create failure - a valid array of records is required.', 500));
				}

				pRequest.BulkRecords = pRequest.body;

				return fStageComplete(null);
			},
			(fStageComplete) =>
			{
				pRequest.BehaviorModifications.runBehavior('Create-PreRequest', pRequest, fStageComplete);
			},
			(fStageComplete) =>
			{
				libAsync.eachSeries(pRequest.BulkRecords,
					(pRecord, fCallback) =>
					{
						doCreate.call(this, pRecord, pRequest, pResponse, fCallback);
					}, fStageComplete);
			},
			(fStageComplete) =>
			{
				return this.streamRecordsToResponse(pResponse, pRequest.CreatedRecords, fStageComplete);
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

module.exports = doAPIEndpointBulkCreate;