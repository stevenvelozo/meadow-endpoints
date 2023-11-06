/**
* Meadow Endpoint - Upsert a set of Records
*/
const doUpsert = require('./Meadow-Operation-Upsert.js');

const marshalLiteList = require('../read/Meadow-Marshal-LiteList.js');

const doAPIEndpointUpserts = function(pRequest, pResponse, fNext)
{
	let tmpRequestState = this.initializeRequestState(pRequest, 'UpsertBulk');
	let fBehaviorInjector = (pBehaviorHash) => { return (fStageComplete) => { this.BehaviorInjection.runBehavior(pBehaviorHash, this, pRequest, tmpRequestState, fStageComplete); }; };

	tmpRequestState.CreatedRecords = [];
	tmpRequestState.UpdatedRecords = [];
	tmpRequestState.UpsertedRecords = [];
	tmpRequestState.ErrorRecords = [];

	this.waterfall(
		[
			(fStageComplete) =>
			{
				if (!Array.isArray(pRequest.body))
				{
					return fStageComplete(this.ErrorHandler.getError(`Record bulk upsert failure - a valid array of records is required.`, 500));
				}

				tmpRequestState.BulkRecords = pRequest.body;

				return fStageComplete();
			},
			(fStageComplete) =>
			{
				this.eachLimit(tmpRequestState.BulkRecords, 1,
					(pRecord, fCallback) =>
					{
						doUpsert.call(this, pRecord, pRequest, tmpRequestState, pResponse, fCallback);
					}, fStageComplete);
			},
			(fStageComplete) =>
			{
				return this.doStreamRecordArray(pResponse, marshalLiteList.call(this, tmpRequestState.UpsertedRecords, pRequest), fStageComplete);
			},
			(fStageComplete) =>
			{
				this.log.requestCompletedSuccessfully(pRequest, tmpRequestState, `Bulk upsert complete -- ${tmpRequestState.UpsertedRecords} records processed`);
				return fStageComplete();
			}
		], (pError) =>
		{
			return this.ErrorHandler.handleErrorIfSet(pRequest, tmpRequestState, pResponse, pError, fNext);
		});
};
module.exports = doAPIEndpointUpserts;