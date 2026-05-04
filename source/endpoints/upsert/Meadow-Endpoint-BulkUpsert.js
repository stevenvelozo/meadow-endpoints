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
			fBehaviorInjector(`UpsertBulk-PreOperation`),
			(fStageComplete) =>
			{
				this.eachLimit(tmpRequestState.BulkRecords, 1,
					(pRecord, fCallback) =>
					{
						doUpsert.call(this, pRecord, pRequest, tmpRequestState, pResponse, fCallback);
					}, fStageComplete);
			},
			fBehaviorInjector(`UpsertBulk-PostOperation`),
			(fStageComplete) =>
			{
				// Surface per-row error counts to the caller via response
				// headers BEFORE streaming the success array. Without these,
				// callers can only see "N records came back" and have no
				// signal that other records were silently dropped (e.g.
				// from a NOT NULL constraint or a column-too-long error).
				// We keep the response body shape stable (bare array of
				// upserted records) for back-compat — the headers are the
				// non-breaking surface for the failure count + total.
				let tmpInputCount = (tmpRequestState.BulkRecords && tmpRequestState.BulkRecords.length) || 0;
				let tmpErrorCount = (tmpRequestState.ErrorRecords && tmpRequestState.ErrorRecords.length) || 0;
				let tmpUpsertedCount = (tmpRequestState.UpsertedRecords && tmpRequestState.UpsertedRecords.length) || 0;
				try
				{
					pResponse.header('X-Meadow-Upsert-Total', String(tmpInputCount));
					pResponse.header('X-Meadow-Upsert-Succeeded', String(tmpUpsertedCount));
					pResponse.header('X-Meadow-Upsert-Errored', String(tmpErrorCount));
				}
				catch (pHdrErr) { /* response.header may not exist on all servers; degrade silently */ }

				return this.doStreamRecordArray(pResponse, marshalLiteList.call(this, tmpRequestState.UpsertedRecords, pRequest), fStageComplete);
			},
			(fStageComplete) =>
			{
				let tmpUpsertedCount = (tmpRequestState.UpsertedRecords && tmpRequestState.UpsertedRecords.length) || 0;
				let tmpErrorCount = (tmpRequestState.ErrorRecords && tmpRequestState.ErrorRecords.length) || 0;
				let tmpMessage = (tmpErrorCount > 0)
					? `Bulk upsert complete -- ${tmpUpsertedCount} records succeeded, ${tmpErrorCount} errored`
					: `Bulk upsert complete -- ${tmpUpsertedCount} records processed`;
				this.log.requestCompletedSuccessfully(pRequest, tmpRequestState, tmpMessage);
				return fStageComplete();
			}
		], (pError) =>
		{
			return this.ErrorHandler.handleErrorIfSet(pRequest, tmpRequestState, pResponse, pError, fNext);
		});
};
module.exports = doAPIEndpointUpserts;