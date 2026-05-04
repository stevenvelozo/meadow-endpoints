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
			if (typeof(pRequest.body) !== 'object' || pRequest.body === null)
			{
				return fStageComplete(this.ErrorHandler.getError('Record update failure - a valid record is required.', 400));
			}

			// PUT|PATCH /Entity/:IDRecord puts the primary key in the URL path
			// (REST-idiomatic, parallels GET/:IDRecord and DELETE/:IDRecord).
			// When present, the URL ID is authoritative and overrides anything
			// in the body. This is what lets clients update-in-place without
			// the GET → DELETE → INSERT churn that loses the primary key.
			if (pRequest.params && pRequest.params.IDRecord)
			{
				let tmpURLID = pRequest.params.IDRecord;
				if (typeof(tmpURLID) === 'string' && /^-?\d+$/.test(tmpURLID))
				{
					tmpURLID = Number(tmpURLID);
				}
				pRequest.body[this.DAL.defaultIdentifier] = tmpURLID;
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
