/**
* Meadow Operation - Create a record function
*/
const doCreate = function(pRecord, pRequest, pResponse, fCallback)
{
	let tmpRequestState = initializeRequestState(pRequest, 'Create');

		this.waterfall(
		[
			(fStageComplete) =>
			{
				// Do this for compatibility with injected behaviors
				tmpRequestState.Record = pRecord;

				//Make sure record gets created with a customerID
				if (!tmpRequestState.Record.hasOwnProperty('IDCustomer') &&
					this.DAL.jsonSchema.properties.hasOwnProperty('IDCustomer'))
				{
					tmpRequestState.Record.IDCustomer = pRequest.UserSession.CustomerID || 0;
				}

				pRequest.BehaviorModifications.runBehavior('Create-PreOperation', pRequest, fStageComplete);
			},
			(fStageComplete) =>
			{
				pRequest.Authorizers.authorizeRequest('Create', pRequest, fStageComplete);
			},
			(fStageComplete) =>
			{
				if (pRequest.MeadowAuthorization)
				{
					return fStageComplete();
				}

				// It looks like this record was not authorized.  Send an error.
				return fStageComplete({Code:405,Message:'UNAUTHORIZED ACCESS IS NOT ALLOWED'});
			},
			(fStageComplete) =>
			{
				//3. Prepare create query
				var tmpRequestState.Query = this.DAL.query;

				tmpRequestState.Query.setIDUser(pRequest.UserSession.UserID);
				tmpRequestState.Query.addRecord(pRecord);

				return fStageComplete(null, tmpRequestState.Query);
			},
			// 3. INJECT: Query configuration
			(tmpRequestState.Query, fStageComplete) =>
			{
				tmpRequestState.Query = tmpRequestState.Query;
				pRequest.BehaviorModifications.runBehavior('Create-QueryConfiguration', pRequest, fStageComplete);
			},
			(fStageComplete) =>
			{
				//4. Do the create operation
				this.DAL.doCreate(tmpRequestState.Query,
					(pError, pQuery, pReadQuery, pNewRecord) =>
					{
						if (!pNewRecord)
						{
							return fStageComplete('Error in DAL create: '+pError);
						}

						tmpRequestState.Record = pNewRecord;

						pRequest.CreatedRecords.push(pNewRecord);

						this.log.requestCompletedSuccessfully(pRequest, tmpRequestState, 'Created a record with ID '+pNewRecord[this.DAL.defaultIdentifier]+'.');

						return fStageComplete(null);
					});
			},
			(fStageComplete) =>
			{
				return pRequest.BehaviorModifications.runBehavior('Create-PostOperation', pRequest, fStageComplete);
			}
		], (pError) =>
		{
			if (pError)
			{
				pRecord.Error = 'Error creating record:'+pError;
				// Added for singleton operations
				tmpRequestState.RecordCreateError = true;
				tmpRequestState.RecordCreateErrorMessage = pError;
				// Also push the record to the created record stack with an error message
				pRequest.CreatedRecords.push(pRecord);
				pRequest.CommonServices.log.error('Error creating record:'+pError, {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:this.DAL.scope+'-'+pRequest.MeadowOperation, Stack: pError.stack }, pRequest);
			}

			return fCallback();
		});
};

module.exports = doCreate;