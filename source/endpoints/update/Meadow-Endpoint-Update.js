/**
* Meadow Endpoint - Update a Record
*/
const doUpdate = require('./Meadow-Operation-Update.js');

const doAPIEndpointUpdate = function(pRequest, pResponse, fNext)
{
	let tmpRequestState = this.initializeRequestState(pRequest, 'Update');
	let fBehaviorInjector = (pBehaviorHash) => { return (fStageComplete) => { this.BehaviorInjection.runBehavior(pBehaviorHash, this, pRequest, tmpRequestState, fStageComplete); }; };

	this.waterfall(
	[
		(fStageComplete) =>
		{
			if (typeof(pRequest.body) !== 'object')
			{
				return fStageComplete(this.ErrorHandler.getError('Record update failure - a valid record is required.', 400));
			}
			if (pRequest.body[this.DAL.defaultIdentifier] < 1)
			{
				return fStageComplete(this.ErrorHandler.getError('Record update failure - a valid record ID is required in the passed-in record.', 400));
			}

			tmpRequestState.Record = pRequest.body;
			return fStageComplete();
		},
		(fStageComplete) =>
		{
			doUpdate.call(this, pRequest.body, pRequest, tmpRequestState, pResponse, fStageComplete);
		},
		(fStageComplete) =>
		{
			if (tmpRequestState.RecordUpdateError)
			{
				return fStageComplete(tmpRequestState.RecordUpdateErrorObject);
			}
			if (tmpRequestState.UpdatedRecords.length < 1)
			{
				return fStageComplete(this.ErrorHandler.getError('Unknown record update failure - no updated records returned.', 500));
			}

			tmpRequestState.Record = tmpRequestState.UpdatedRecords[0];

			return fStageComplete();
		},
		(fStageComplete) =>
		{
			pResponse.send(tmpRequestState.Record);
			return fStageComplete();
		}
	],
	(pError) =>
	{
		return this.ErrorHandler.handleErrorIfSet(pRequest, tmpRequestState, pResponse, pError, fNext);
	});
};

module.exports = doAPIEndpointUpdate;
