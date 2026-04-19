/**
* Meadow Endpoint - Create a Record
*/
const doCreate = require('./Meadow-Operation-Create.js');

const doAPIEndpointCreate = function(pRequest, pResponse, fNext)
{
	let tmpRequestState = this.initializeRequestState(pRequest, 'Create');
	let fBehaviorInjector = (pBehaviorHash) => { return (fStageComplete) => { this.BehaviorInjection.runBehavior(pBehaviorHash, this, pRequest, tmpRequestState, fStageComplete); }; };

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
		// Endpoint-level pre-request hook. Runs after the body-type check
		// but before any operation work, mirroring ME 2.x's
		// Create-PreRequest stage. Use cases include idempotency
		// suppression (e.g. look up by primary GUID and short-circuit
		// if the row already exists). Handlers can abort the operation
		// by calling fStageComplete with a truthy error or by fully
		// writing pResponse and returning a sentinel.
		fBehaviorInjector(`Create-PreRequest`),
		(fStageComplete) =>
		{
			doCreate.call(this, pRequest.body, pRequest, tmpRequestState, pResponse, fStageComplete);
		},
		(fStageComplete) =>
		{
			if (tmpRequestState.RecordCreateError)
			{
				return fStageComplete(tmpRequestState.RecordCreateErrorObject);
			}
			if (tmpRequestState.CreatedRecords.length < 1)
			{
				return fStageComplete(this.ErrorHandler.getError('Unknown record create failure - no created records returned.', 500));
			}

			tmpRequestState.Record = tmpRequestState.CreatedRecords[0];

			return fStageComplete();
		},
		(fStageComplete) =>
		{
			pResponse.send(tmpRequestState.Record);
			return fStageComplete();
		},
		(fStageComplete) =>
		{
			this.log.requestCompletedSuccessfully(pRequest, tmpRequestState, `Created a ${this.DAL.scope} record ID ${tmpRequestState.Record[this.DAL.defaultIdentifier]}`);
			return fStageComplete();
		}
	],
	(pError) =>
	{
		return this.ErrorHandler.handleErrorIfSet(pRequest, tmpRequestState, pResponse, pError, fNext);
	});
};

module.exports = doAPIEndpointCreate;