/**
* Meadow Endpoint - Read a Record
*/
const doAPIEndpointRead = function(pRequest, pResponse, fNext)
{
	// The hash for the endpoint (used for authorization and authentication)
	let tmpRequestState = initializeRequestState(pRequest, 'Read');

	this.waterfall(
		[
			(fStageComplete) =>
			{
				tmpRequestState.Query = this.DAL.query;
				fStageComplete();
			},
			(fStageComplete) =>
			{
				this.BehaviorInjection.runBehaviorWithContext(`Read-PreOperation`, pRequest, tmpRequestState, this, fStageComplete);
			},
			(fStageComplete) =>
			{
				if (!pRequest.params.IDRecord && pRequest.params.GUIDRecord)
				{
					// We use a custom name for this (RequestDefaultIdentifier) in case there is a query with a dot in the default identifier.
					tmpRequestState.RecordSearchCriteria = `${this.DAL.defaultGUIdentifier} = ${pRequest.params.GUIDRecord}`;
					tmpRequestState.Query.addFilter(this.DAL.defaultGUIdentifier, pRequest.params.GUIDRecord, '=', 'AND', 'RequestDefaultIdentifier');
				}
				else if (pRequest.params.IDRecord)
				{
					// We use a custon name for this (RequestDefaultIdentifier) in case there is a query with a dot in the default identifier.
					tmpRequestState.RecordSearchCriteria = `${this.DAL.defaultIdentifier} = ${pRequest.params.IDRecord}`;
					tmpRequestState.Query.addFilter(this.DAL.defaultIdentifier, pRequest.params.IDRecord, '=', 'AND', 'RequestDefaultIdentifier');
				}
				else
				{
					return fStageComplete(this.ErrorHandler.getError('No ID Provided', 400));
				}
				return fStageComplete();
			},
			(fStageComplete) =>
			{
				this.BehaviorInjection.runBehaviorWithContext(`Read-QueryConfiguration`, pRequest, tmpRequestState, this, fStageComplete);
			},
			(fStageComplete) =>
			{
				try
				{
					this.DAL.doRead(tmpRequestState.Query, fStageComplete);
				}
				catch
				{
					return fStageComplete(this.ErrorHandler.getError('Query error', 500));
				}
			},
			(pQuery, pRecord, fStageComplete) =>
			{
				if (!pRecord)
				{
					return fStageComplete(this.ErrorHandler.getError('Record not Found', 404));
				}
				tmpRequestState.Record = pRecord;
				return fStageComplete();
			},
			(fStageComplete) =>
			{
				this.BehaviorInjection.runBehaviorWithContext(`Read-PostOperation`, pRequest, tmpRequestState, this, fStageComplete);
			},
			(fStageComplete) =>
			{
				this.log.requestCompletedSuccessfully(pRequest, `Read Record Where ${tmpRequestState.RecordSearchCriteria}`);
				pResponse.send(tmpRequestState.Record);
				fStageComplete();
			}
		],
		(pError) =>
		{
			if (pError)
			{
				return this.ErrorHandler.sendError(pRequest, tmpRequestState, pResponse, pError, fNext);
			}

			return fNext();
		}
	);
};

module.exports = doAPIEndpointRead;