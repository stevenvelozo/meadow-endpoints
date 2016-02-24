/**
* Meadow Endpoint - Update a Record
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
/**
* Update a record using the Meadow DAL object
*/

var libAsync = require('async');

var doAPIUpdateEndpoint = function(pRequest, pResponse, fNext)
{
	// This state is the requirement for the UserRoleIndex value in the SessionData object... processed by default as >=
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
				if (pRequest.body[pRequest.DAL.defaultIdentifier] < 1)
				{
					return pRequest.CommonServices.sendError('Record update failure - a valid record ID is required in the passed-in record.', pRequest, pResponse, fNext);
				}

				pRequest.Record = pRequest.body;

				return fStageComplete(null);
			},
			function(fStageComplete)
			{
				var tmpQuery = pRequest.DAL.query;

				// This is not overloadable.
				tmpQuery.addFilter(pRequest.DAL.defaultIdentifier, pRequest.Record[pRequest.DAL.defaultIdentifier]);

				// Load the record so we can do security checks on it
				pRequest.DAL.doRead(tmpQuery,
					function(pError, pQuery, pRecord)
					{
						return fStageComplete(pError, pRecord);
					});
			},
			function(pOriginalRecord, fStageComplete)
			{
				//send the original record to the Authorizer so it can verify ownership/etc
				pRequest.UpdatingRecord = pRequest.Record;
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
			function(fStageComplete)
			{
				//3. Prepare update query
				var tmpQuery = pRequest.DAL.query;

				tmpQuery.addRecord(pRequest.Record);

				return fStageComplete(null, tmpQuery);
			},
			function(pPreparedQuery, fStageComplete)
			{
				//4. Do the update operation
				pRequest.DAL.setIDUser(pRequest.SessionData.UserID).doUpdate(pPreparedQuery,
					function(pError, pQuery, pReadQuery, pRecord)
					{
						if (!pRecord)
						{
							return fStageComplete('Error updating a record.');
						}

						pRequest.Record = pRecord;

						pRequest.CommonServices.log.info('Updated a record with ID '+pRecord[pRequest.DAL.defaultIdentifier]+'.', {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-Update'});

						return fStageComplete(null);
					});
			},
			function(fStageComplete)
			{
				// INJECT: Post modification with record
				return pRequest.BehaviorModifications.runBehavior('Update-PostOperation', pRequest, fStageComplete);
			},
			function(fStageComplete)
			{
				//5. Respond with the new record
				pResponse.send(pRequest.Record);
				return fStageComplete(null);
			}
		], function(pError)
		{
			if (pError)
			{
				return pRequest.CommonServices.sendCodedError('Error updating a record.', pError, pRequest, pResponse, fNext);
			}

			return fNext();
		});
};

module.exports = doAPIUpdateEndpoint;