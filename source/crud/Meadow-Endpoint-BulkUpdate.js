/**
* Meadow Endpoint - Update a set of Records
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
/**
* Update a set of records using the Meadow DAL object
*/

var libAsync = require('async');

// TODO: This should be shared with the CREATE endpoint as well.
var doUpdate = function(pRecordToModify, pRequest, pResponse, fCallback)
{
		if (pRecordToModify[pRequest.DAL.defaultIdentifier] < 1)
		{
			return fCallback('Record update failure - a valid record ID is required in the passed-in record.');
		}

	libAsync.waterfall(
		[
			function(fStageComplete)
			{
				pRequest.Record = pRecordToModify;

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
			},
			function(pOriginalRecord, fStageComplete)
			{
				//send the original record to the Authorizer so it can verify ownership/etc
				// TODO: Because the authorizer looks in the request for the record, we need to fix this somehow to work asynchronously.
				pRequest.UpdatingRecord = pRecordToModify;
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
				return fStageComplete({Code:405,Message:'UNAUTHORIZED ACCESS IS NOT ALLOWED'});
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

				tmpQuery.setIDUser(pRequest.UserSession.UserID)
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
							return fStageComplete('Error updating a record.');
						}

						pRequest.UpdatedRecords.push(pRecord);

						pRequest.CommonServices.log.info('Updated a record with ID '+pRecord[pRequest.DAL.defaultIdentifier]+'.', {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-UpdateBulk'}, pRequest);

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
				pRecordToModify.Error = 'Error during bulk updating single record:'+pError;
				pRequest.UpdatedRecords.push(pRecordToModify);
				pRequest.CommonServices.log.error('Error during bulk updating single record:'+pError, {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-UpdateBulk'}, pRequest);
			}

			return fCallback();
		});
};

var doAPIUpdateEndpoint = function(pRequest, pResponse, fNext)
{
	// This state is the requirement for the UserRoleIndex value in the UserSession object... processed by default as >=
	// The default here is that any authenticated user can use this endpoint.
	pRequest.EndpointAuthorizationRequirement = pRequest.EndpointAuthorizationLevels.Update;
	
	// INJECT: Pre authorization (for instance to change the authorization level)
	
	if (pRequest.CommonServices.authorizeEndpoint(pRequest, pResponse, fNext) === false)
	{
		// If this endpoint fails, it's sent an error automatically.
		return;
	}

	libAsync.waterfall(
		[
			function(fStageComplete)
			{
				//1. Validate request body to ensure it is a valid record
				if (typeof(pRequest.body) !== 'object')
				{
					return pRequest.CommonServices.sendError('Record update failure - a valid record is required.', pRequest, pResponse, fNext);
				}

				pRequest.Records = pRequest.body;

				return fStageComplete(null);
			},
			function(fStageComplete)
			{
				pRequest.UpdatedRecords = [];
				
				libAsync.eachSeries(pRequest.Records,
					function (pRecord, fCallback)
					{
						doUpdate(pRecord, pRequest, pResponse, fCallback);
					}, fStageComplete);
			},
			function(fStageComplete)
			{
				//5. Respond with the new record
				pResponse.send(pRequest.UpdatedRecords);
				return fStageComplete(null);
			}
		], function(pError)
		{
			if (pError)
			{
				return pRequest.CommonServices.sendCodedError('Error bulk updating records.', pError, pRequest, pResponse, fNext);
			}

			return fNext();
		});
};

module.exports = doAPIUpdateEndpoint;