/**
* Meadow Endpoint - Update a Record
*/
const doUpdate = require('./Meadow-Operation-Update.js');

const doAPIEndpointUpdate = function(pRequest, pResponse, fNext)
{
	// Configure the request for the generic update operation
	pRequest.UpdatedRecords = [];
	let tmpRequestState = initializeRequestState(pRequest, 'Update');

	this.waterfall(
		[
			(fStageComplete) =>
			{
				//1. Validate request body to ensure it is a valid record
				if (typeof(pRequest.body) !== 'object')
				{
					return fStageComplete(this.ErrorHandler.getError('Record update failure - a valid record is required.', 400));
				}
				if (pRequest.body[this.DAL.defaultIdentifier] < 1)
				{
					return fStageComplete(this.ErrorHandler.getError('Record update failure - a valid record ID is required in the passed-in record.', 400));
				}

				tmpRequestState.Record = pRequest.body;

				return fStageComplete(null);
			},
			(fStageComplete) =>
			{
				//4. Do the update operation
				doUpdate(pRequest.body, pRequest, pResponse, fStageComplete);
			},
			(fStageComplete) =>
			{
				//5. Respond with the new record

				// If there was an error, respond with that instead
				if (tmpRequestState.RecordUpdateError)
					return fStageComplete(tmpRequestState.RecordUpdateErrorMessage);

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

module.exports = doAPIEndpointUpdate;
