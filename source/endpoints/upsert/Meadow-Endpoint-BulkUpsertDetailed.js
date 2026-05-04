/**
* Meadow Endpoint - Upsert a set of Records, with detailed envelope response.
*
* Same upsert pipeline as Meadow-Endpoint-BulkUpsert.js, but the
* response body is an envelope:
*
*   {
*     "Counts":          { "Total": N, "Succeeded": K, "Errored": M },
*     "UpsertedRecords": [ ... lite-marshaled successes ... ],
*     "ErrorRecords":    [ { "Record": {...}, "Operation": "...", "Error": "..." }, ... ]
*   }
*
* The vanilla `/Upserts` endpoint streams a bare array of successes for
* back-compat; this `/Upserts/Detailed` variant trades that compatibility
* for full per-row error visibility. Same X-Meadow-Upsert-* response
* headers are set on both.
*/
const doUpsert = require('./Meadow-Operation-Upsert.js');

const marshalLiteList = require('../read/Meadow-Marshal-LiteList.js');

const doAPIEndpointUpsertsDetailed = function(pRequest, pResponse, fNext)
{
	let tmpRequestState = this.initializeRequestState(pRequest, 'UpsertBulkDetailed');
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
					return fStageComplete(this.ErrorHandler.getError(`Record bulk upsert (detailed) failure - a valid array of records is required.`, 500));
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
				let tmpInputCount = (tmpRequestState.BulkRecords && tmpRequestState.BulkRecords.length) || 0;
				let tmpErrorCount = (tmpRequestState.ErrorRecords && tmpRequestState.ErrorRecords.length) || 0;
				let tmpUpsertedCount = (tmpRequestState.UpsertedRecords && tmpRequestState.UpsertedRecords.length) || 0;

				// Mirror the X-Meadow-Upsert-* headers from /Upserts so a
				// caller can dispatch to either endpoint and read the same
				// summary surface. The body envelope adds the per-row
				// detail; the headers stay the structured summary.
				try
				{
					pResponse.header('X-Meadow-Upsert-Total', String(tmpInputCount));
					pResponse.header('X-Meadow-Upsert-Succeeded', String(tmpUpsertedCount));
					pResponse.header('X-Meadow-Upsert-Errored', String(tmpErrorCount));
				}
				catch (pHdrErr) { /* response.header may not exist on all servers; degrade silently */ }

				let tmpEnvelope = {
					Counts: { Total: tmpInputCount, Succeeded: tmpUpsertedCount, Errored: tmpErrorCount },
					UpsertedRecords: marshalLiteList.call(this, tmpRequestState.UpsertedRecords, pRequest),
					ErrorRecords: tmpRequestState.ErrorRecords || []
				};
				pResponse.send(tmpEnvelope);
				return fStageComplete();
			},
			(fStageComplete) =>
			{
				let tmpUpsertedCount = (tmpRequestState.UpsertedRecords && tmpRequestState.UpsertedRecords.length) || 0;
				let tmpErrorCount = (tmpRequestState.ErrorRecords && tmpRequestState.ErrorRecords.length) || 0;
				let tmpMessage = (tmpErrorCount > 0)
					? `Bulk upsert (detailed) complete -- ${tmpUpsertedCount} records succeeded, ${tmpErrorCount} errored`
					: `Bulk upsert (detailed) complete -- ${tmpUpsertedCount} records processed`;
				this.log.requestCompletedSuccessfully(pRequest, tmpRequestState, tmpMessage);
				return fStageComplete();
			}
		], (pError) =>
		{
			return this.ErrorHandler.handleErrorIfSet(pRequest, tmpRequestState, pResponse, pError, fNext);
		});
};
module.exports = doAPIEndpointUpsertsDetailed;
