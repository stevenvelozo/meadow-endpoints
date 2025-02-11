/**
* Meadow Operation - Update a record
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
/**
* Update a record using the Meadow DAL object.
*/

var libAsync = require('async');

var doUpdate = function(pRecordToModify, pRequest, pResponse, fCallback, pOptionalCachedUpdatingRecord)
{
	// pOptionalCachedUpdatingRecord allows the caller to pass in a record, so the initial read doesn't need to happen.
	pRequest.MeadowOperation = (typeof(pRequest.MeadowOperation) === 'string') ? pRequest.MeadowOperation : 'Update';

	// If there is not a default identifier or cached record, fail
	if ((!parseInt(pRecordToModify[pRequest.DAL.defaultIdentifier]) || pRecordToModify[pRequest.DAL.defaultIdentifier] < 1) && (typeof(pOptionalCachedUpdatingRecord) === 'undefined'))
	{
		return fCallback('Record update failure - a valid record ID is required in the passed-in record.');
	}

	libAsync.waterfall(
		[
			function(fStageComplete)
			{
				pRequest.Record = pRecordToModify;

				if (typeof(pOptionalCachedUpdatingRecord) !== 'undefined')
				{
					// Use the cached updating record instead of reading a record.
					return fStageComplete(false, pOptionalCachedUpdatingRecord);
				}
				else
				{
					var tmpQuery = pRequest.DAL.query;

					// This is not overloadable.
					tmpQuery.addFilter(pRequest.DAL.defaultIdentifier, pRecordToModify[pRequest.DAL.defaultIdentifier]);

					// Load the record so we can do security checks on it
					pRequest.DAL.doRead(tmpQuery,
						function(pError, pQuery, pRecord)
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
			function(pOriginalRecord, fStageComplete)
			{
				//send the original record to the Authorizer so it can verify ownership/etc
				// TODO: Because the authorizer looks in the request for the record, we need to fix this somehow to work asynchronously.
				pRequest.UpdatingRecord = pRecordToModify;
				pRequest.OriginalRecord = pOriginalRecord;
				pRequest.Record = pOriginalRecord;

				pRequest.Authorizers.authorizeRequest('Update', pRequest, function(err)
					{
						pRequest.Record = pRequest.UpdatingRecord;
						return fStageComplete(err);
					});
			},
			function(fStageComplete)
			{
				//2. INJECT: Record modification before update
				pRequest.BehaviorModifications.runBehavior('Update-PreOperation', pRequest, fStageComplete);
			},
			function (fStageComplete)
			{
				if (pRequest.MeadowAuthorization)
				{
					return fStageComplete(false);
				}

				// It looks like this record was not authorized.  Send an error.
				var tmpError = {Code:405,Message:'UNAUTHORIZED ACCESS IS NOT ALLOWED'};
				tmpError.Scope = pRequest.DAL.scope;
				tmpError[pRequest.DAL.defaultIdentifier] = pRequest.Record[pRequest.DAL.defaultIdentifier];
				return fStageComplete(tmpError);
			},
			// 3a. INJECT: Query configuration
			function (fStageComplete)
			{
				pRequest.Query = pRequest.DAL.query;
				pRequest.BehaviorModifications.runBehavior('Update-QueryConfiguration', pRequest, fStageComplete);
			},
			function(fStageComplete)
			{
				//3b. Prepare update query
				var tmpQuery = pRequest.Query;

				tmpQuery.setIDUser(pRequest.UserSession.UserID);
				tmpQuery.addRecord(pRequest.Record);

				return fStageComplete(null, tmpQuery);
			},
			function(pPreparedQuery, fStageComplete)
			{
				//4. Do the update operation
				pRequest.DAL.doUpdate(pPreparedQuery,
					function(pError, pQuery, pReadQuery, pRecord)
					{
						if (!pRecord)
						{
							return fStageComplete(pError || 'Error updating a record.');
						}

						pRequest.Record = pRecord;

						pRequest.UpdatedRecords.push(pRecord);

						//pRequest.CommonServices.log.info('Updated a record with ID '+pRecord[pRequest.DAL.defaultIdentifier]+'.', {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-UpdateBulk'}, pRequest);

						return fStageComplete(null);
					});
			},
			function(fStageComplete)
			{
				// INJECT: Post modification with record
				return pRequest.BehaviorModifications.runBehavior('Update-PostOperation', pRequest, fStageComplete);
			}
		], function(pError)
		{
			if (pError)
			{
				pRecordToModify.Error = 'Error updating record:'+pError;
				pRequest.RecordUpdateError = true;
				pRequest.RecordUpdateErrorMessage = pError;
				pRequest.UpdatedRecords.push(pRecordToModify);
				pRequest.CommonServices.log.error('Error updating record:'+pError, {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-'+pRequest.MeadowOperation, Stack: pError.stack }, pRequest);
			}

			return fCallback();
		});
};

module.exports = doUpdate;
