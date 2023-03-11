/**
* Meadow Endpoint - Update a set of Records
*/
const doUpdate = require('./Meadow-Operation-Update.js');

const doAPIEndpointUpdate = function(pRequest, pResponse, fNext)
{
	let tmpRequestState = this.initializeRequestState(pRequest, 'UpdateBulk');
	let fBehaviorInjector = (pBehaviorHash) => { return (fStageComplete) => { this.BehaviorInjection.runBehavior(pBehaviorHash, this, pRequest, tmpRequestState, fStageComplete); }; };

	tmpRequestState.UpdatedRecords = [];

	this.waterfall(
		[
			(fStageComplete) =>
			{
				if (!Array.isArray(pRequest.body))
				{
					return fStageComplete(this.ErrorHandler.getError('Record update failure - a valid record is required.', 500));
				}

				tmpRequestState.BulkRecords = pRequest.body;

				return fStageComplete();
			},
			(fStageComplete) =>
			{
				this.eachLimit(tmpRequestState.BulkRecords, 1,
					(pRecord, fCallback) =>
					{
						doUpdate.call(this, pRecord, pRequest, tmpRequestState, pResponse, fCallback);
					}, fStageComplete);
			},
			(fStageComplete) =>
			{
				return this.doStreamRecordArray(pResponse, tmpRequestState.UpdatedRecords, fStageComplete);
			},
			(fStageComplete) =>
			{
				this.log.requestCompletedSuccessfully(pRequest, tmpRequestState, `Bulk updated ${tmpRequestState.UpdatedRecords.length} records`);
				return fStageComplete();
			}
		],
		(pError) =>
		{
			return this.ErrorHandler.handleErrorIfSet(pRequest, tmpRequestState, pResponse, pError, fNext);
		});
};

module.exports = doAPIEndpointUpdate;