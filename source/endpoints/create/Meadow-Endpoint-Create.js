/**
* Meadow Endpoint - Create a Record
*/
const doCreate = require('./Meadow-Operation-Create.js');

const doAPIEndpointCreate = function(pRequest, pResponse, fNext)
{
	let tmpRequestState = initializeRequestState(pRequest, 'Create');

		this.waterfall(
		[
			(fStageComplete) =>
			{
				if (typeof(pRequest.body) !== 'object')
				{
					return fStageComplete(this.ErrorHandler.getError('Record create failure - a valid record is required.', 500));
				}

				return fStageComplete();
			},
			(fStageComplete) =>
			{
				doCreate(pRequest.body, pRequest, pResponse, fStageComplete);
			},
			(fStageComplete) =>
			{
				// If there was an error, respond with that instead
				if (tmpRequestState.RecordCreateError)
				{
					return fStageComplete(tmpRequestState.RecordCreateErrorMessage);
				}

				pResponse.send(tmpRequestState.Record);

				return fStageComplete();
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

module.exports = doAPIEndpointCreate;