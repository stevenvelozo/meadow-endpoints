/**
* Meadow Operation - Update a record
*/

const doUpdate = function(pRecordToModify, pRequest, pResponse, fCallback, pOptionalCachedUpdatingRecord)
{
	// pOptionalCachedUpdatingRecord allows the caller to pass in a record, so the initial read doesn't need to happen.
	let tmpRequestState = initializeRequestState(pRequest, 'Update');

	// If there is not a default identifier or cached record, fail
	if ((pRecordToModify[this.DAL.defaultIdentifier] < 1) && (typeof(pOptionalCachedUpdatingRecord) === 'undefined'))
	{
		return fCallback('Record update failure - a valid record ID is required in the passed-in record.');
	}

	this.waterfall(
		[
			(fStageComplete) =>
			{
				tmpRequestState.Record = pRecordToModify;

				if (typeof(pOptionalCachedUpdatingRecord) !== 'undefined')
				{
					// Use the cached updating record instead of reading a record.
					return fStageComplete(false, pOptionalCachedUpdatingRecord);
				}
				else
				{
					var tmpRequestState.Query = this.DAL.query;

					// This is not overloadable.
					tmpRequestState.Query.addFilter(this.DAL.defaultIdentifier, pRecordToModify[this.DAL.defaultIdentifier]);

					// Load the record so we can do security checks on it
					this.DAL.doRead(tmpRequestState.Query,
						(pError, pQuery, pRecord) =>
						{
							if (!pError && !pRecord)
							{
								//short-circuit: Can't update a record that doesn't exist!
								pError = 'Record not found.';
							}

							return fStageComplete(pError, pRecord);
						});
				}
			},
			(pOriginalRecord, fStageComplete) =>
			{
				//send the original record to the Authorizer so it can verify ownership/etc
				// TODO: Because the authorizer looks in the request for the record, we need to fix this somehow to work asynchronously.
				pRequest.UpdatingRecord = pRecordToModify;
				tmpRequestState.Record = pOriginalRecord;

				pRequest.Authorizers.authorizeRequest('Update', pRequest, function(err)
					{
						tmpRequestState.Record = pRequest.UpdatingRecord;
						return fStageComplete(err);
					});
			},
			(fStageComplete) =>
			{
				//2. INJECT: Record modification before update
				pRequest.BehaviorModifications.runBehavior('Update-PreOperation', pRequest, fStageComplete);
			},
			(fStageComplete) =>
			{
				if (pRequest.MeadowAuthorization)
				{
					return fStageComplete();
				}

				// It looks like this record was not authorized.  Send an error.
				var tmpError = {Code:405,Message:'UNAUTHORIZED ACCESS IS NOT ALLOWED'};
				tmpError.Scope = this.DAL.scope;
				tmpError[this.DAL.defaultIdentifier] = tmpRequestState.Record[this.DAL.defaultIdentifier];
				return fStageComplete(tmpError);
			},
			// 3a. INJECT: Query configuration
			(fStageComplete) =>
			{
				tmpRequestState.Query = this.DAL.query;
				pRequest.BehaviorModifications.runBehavior('Update-QueryConfiguration', pRequest, fStageComplete);
			},
			(fStageComplete) =>
			{
				//3b. Prepare update query
				var tmpRequestState.Query = tmpRequestState.Query;

				tmpRequestState.Query.setIDUser(pRequest.UserSession.UserID);
				tmpRequestState.Query.addRecord(tmpRequestState.Record);

				return fStageComplete(null, tmpRequestState.Query);
			},
			(pPreparedQuery, fStageComplete) =>
			{
				//4. Do the update operation
				this.DAL.doUpdate(pPreparedQuery,
					(pError, pQuery, pReadQuery, pRecord) =>
					{
						if (!pRecord)
						{
							return fStageComplete('Error updating a record.');
						}

						tmpRequestState.Record = pRecord;

						pRequest.UpdatedRecords.push(pRecord);

						this.log.requestCompletedSuccessfully(pRequest, tmpRequestState, 'Updated a record with ID '+pRecord[this.DAL.defaultIdentifier]+'.');

						return fStageComplete(null);
					});
			},
			(fStageComplete) =>
			{
				return pRequest.BehaviorModifications.runBehavior('Update-PostOperation', pRequest, fStageComplete);
			}
		], (pError) =>
		{
			if (pError)
			{
				pRecordToModify.Error = 'Error updating record:'+pError;
				tmpRequestState.RecordUpdateError = true;
				tmpRequestState.RecordUpdateErrorMessage = pError;
				pRequest.UpdatedRecords.push(pRecordToModify);
				pRequest.CommonServices.log.error('Error updating record:'+pError, {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:this.DAL.scope+'-'+pRequest.MeadowOperation, Stack: pError.stack }, pRequest);
			}

			return fCallback();
		});
};

module.exports = doUpdate;