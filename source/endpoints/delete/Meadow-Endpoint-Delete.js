/**
* Meadow Endpoint - Delete a Record
*/
const doAPIEndpointDelete = function(pRequest, pResponse, fNext)
{
	let tmpRequestState = initializeRequestState(pRequest, 'Delete');

	let tmpIDRecord = 0;

	if (typeof(pRequest.params.IDRecord) === 'string')
	{
		tmpIDRecord = pRequest.params.IDRecord;
	}
	else if (typeof(pRequest.body[this.DAL.defaultIdentifier]) === 'number')
	{
		tmpIDRecord = pRequest.body[this.DAL.defaultIdentifier];
	}
	else if (typeof(pRequest.body[this.DAL.defaultIdentifier]) === 'string')
	{
		tmpIDRecord = pRequest.body[this.DAL.defaultIdentifier];
	}
	// Although the Meadow delete behavior does allow multiple deletes, we require an identifier.
	// If a developer wants bulk delete, it will require a custom endpoint.
	if (tmpIDRecord < 1)
	{
		return fStageComplete(this.ErrorHandler.getError('Record delete failure - a valid record ID is required in the passed-in record.', 500));
	}

	let tmpRecordCount = {Count:0};

	this.waterfall(
		[
			(fStageComplete) =>
			{
				tmpRequestState.Query = this.DAL.query;

				// This is not overloadable.`
				tmpRequestState.Query.addFilter(this.DAL.defaultIdentifier, tmpIDRecord);
				tmpRequestState.Query.setIDUser(pRequest.UserSession.UserID);

				return fStageComplete();
			},
			(fStageComplete) =>
			{
				// Load the record so we can do security checks on it
				this.DAL.doRead(tmpRequestState.Query,
					(pError, pQuery, pRecord) =>
					{
						if (!pRecord)
						{
							// No record was found.
						}

						tmpRequestState.Record = pRecord;

						return fStageComplete();
					});
			},
			(fStageComplete) =>
			{
				return pRequest.BehaviorModifications.runBehavior('Delete-PreOperation', pRequest, fStageComplete);
			},
			(fStageComplete) =>
			{
				// Do the delete
				this.DAL.doDelete(tmpRequestState.Query,
					(pError, pQuery, pCount) =>
					{
						// MySQL returns the number of rows deleted
						tmpRecordCount.Count = pCount;
						return fStageComplete(pError);
					});
			},
			(fStageComplete) =>
			{
				return pRequest.BehaviorModifications.runBehavior('Delete-PostOperation', pRequest, fStageComplete);
			},
			(fStageComplete) =>
			{
				pResponse.send(tmpRecordCount);
				this.log.requestCompletedSuccessfully(pRequest, tmpRequestState, 'Deleted '+tmpRecordCount.Count+' records with ID '+tmpIDRecord+'.');
				return fStageComplete();
			}
		], (pError) =>
		{
			if (pError)
			{
				return this.ErrorHandler.sendError(pRequest, tmpRequestState, pResponse, pError, fNext);
			}

			return fNext();
		}
	);
};

module.exports = doAPIEndpointDelete;