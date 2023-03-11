/**
* Meadow Endpoint - Create a set of Record in Bulk
*/

const doCreate = require('./Meadow-Operation-Create.js');

const doAPIEndpointBulkCreate = function(pRequest, pResponse, fNext)
{
	let tmpRequestState = this.initializeRequestState(pRequest, 'CreateBulk');
	let fBehaviorInjector = (pBehaviorHash) => { return (fStageComplete) => { this.BehaviorInjection.runBehavior(pBehaviorHash, this, pRequest, tmpRequestState, fStageComplete); }; };

	tmpRequestState.CreatedRecords = [];

	this.waterfall(
	[
		(fStageComplete) =>
		{
			if (!Array.isArray(pRequest.body))
			{
				return fStageComplete(this.ErrorHandler.getError('Bulk record create failure - a valid array of records to create is required.', 500));
			}
			pRequest.RecordsToBulkCreate = pRequest.body;

			return fStageComplete();
		},
		fBehaviorInjector(`CreateBulk-PreOperation`),
		(fStageComplete) =>
		{
			// TODO: Research parallelism opportunities from custom routes
			this.eachLimit(pRequest.RecordsToBulkCreate, 1,
				(pRecord, fCallback) =>
				{
					doCreate.call(this, pRecord, pRequest, tmpRequestState, pResponse, fCallback);
				}, fStageComplete);
		},
		fBehaviorInjector(`CreateBulk-PostOperation`),
		(fStageComplete) =>
		{
			return this.doStreamRecordArray(pResponse, tmpRequestState.CreatedRecords, fStageComplete);
		},
		(fStageComplete) =>
		{
			this.log.requestCompletedSuccessfully(pRequest, tmpRequestState, `Bulk created ${tmpRequestState.CreatedRecords.length} records`);
			return fStageComplete();
		}
	],
	(pError) =>
	{
		return this.ErrorHandler.handleErrorIfSet(pRequest, tmpRequestState, pResponse, pError, fNext);
	});
};

module.exports = doAPIEndpointBulkCreate;