/**
* Meadow Endpoint - Undelete a Record
*/
const doAPIEndpointUndelete = function(pRequest, pResponse, fNext)
{
	let tmpRequestState = initializeRequestState(pRequest, 'Delete');

		var tmpIDRecord = 0;
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
	// Although the undelete request does allow multiple undeletes, we require an identifier.
	// TODO: Decide if we want to keep this pattern similar to Delete, or, if we want to change it to allow bulk undeletes.
	if (tmpIDRecord < 1)
	{
		return fStageComplete(this.ErrorHandler.getError('Record undelete failure - a valid record ID is required in the passed-in record.', 500));
	}

	var tmpRecordCount = {};
	var tmpRequestState.Query;

	this.waterfall(
		[
			(fStageComplete) =>
			{
				tmpRequestState.Query = this.DAL.query;

				// INJECT: Query configuration and population
				var tmpSchema = this.DAL.schema;
				var tmpHasDeletedBit = false;
				for (let i = 0; i < tmpSchema.length; i++)
				{
					if (tmpSchema[i].Type == 'Deleted')
					{
						// There is a deleted bit on the record!
						tmpHasDeletedBit = true;
					}
				}

				if (!tmpHasDeletedBit)
				{
					return fStageComplete("NO_DELETED_BIT");
				}


				return fStageComplete();
			},
			(fStageComplete) =>
			{
				// Now see if the record, with this identifier, for this user, has the deleted bit set to 1
				tmpRequestState.Query.addFilter(this.DAL.defaultIdentifier, tmpIDRecord);
				tmpRequestState.Query.addFilter('Deleted', 1);
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
							tmpRecordCount = {Count:0};
							return fStageComplete();
						}

						tmpRequestState.Record = pRecord;
						return fStageComplete();
					});
			},
			(fStageComplete) =>
			{
				return pRequest.BehaviorModifications.runBehavior('Undelete-PreOperation', pRequest, fStageComplete);
			},
			(fStageComplete) =>
			{
				// Do the undelete
				this.DAL.doUndelete(tmpRequestState.Query,
					(pError, pQuery, pCount) =>
					{
						// MySQL returns the number of rows deleted
						tmpRecordCount = {Count:pCount};

						return fStageComplete(pError);
					});
			},
			(fStageComplete) =>
			{
				return pRequest.BehaviorModifications.runBehavior('Undelete-PostOperation', pRequest, fStageComplete);
			}
		], (pError) =>
		{
			if (pError &&
				pError !== "NO_RECORD_FOUND")
			{
				return this.ErrorHandler.sendError(pRequest, tmpRequestState, pResponse, pError, fNext);
			}

							this.log.requestCompletedSuccessfully(pRequest, tmpRequestState, 'Undeleted '+tmpRecordCount.Count+' records with ID '+tmpIDRecord+'.');
			pResponse.send(tmpRecordCount);

			return fNext();
		}
	);
};

module.exports = doAPIEndpointUndelete;