/**
* Meadow Endpoint - Delete a Record
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
/**
* Delete a record using the Meadow DAL object
*/

var libAsync = require('async');


var doAPIDeleteEndpoint = function(pRequest, pResponse, fNext)
{
	// This state is the requirement for the UserRoleIndex value in the UserSession object... processed by default as >=
	// The default here is that any authenticated user can use this endpoint.
	pRequest.EndpointAuthorizationRequirement = pRequest.EndpointAuthorizationLevels.Delete;

	// INJECT: Pre authorization (for instance to change the authorization level)

	if (pRequest.CommonServices.authorizeEndpoint(pRequest, pResponse, fNext) === false)
	{
		// If this endpoint fails, it's sent an error automatically.
		return;
	}

	// INJECT: Pre endpoint operation

	var tmpIDRecord = 0;
	if (typeof(pRequest.params.IDRecord) === 'string')
	{
		tmpIDRecord = pRequest.params.IDRecord;
	}
	else if (typeof(pRequest.body[pRequest.DAL.defaultIdentifier]) === 'number')
	{
		tmpIDRecord = pRequest.body[pRequest.DAL.defaultIdentifier];
	}
	else if (typeof(pRequest.body[pRequest.DAL.defaultIdentifier]) === 'string')
	{
		tmpIDRecord = pRequest.body[pRequest.DAL.defaultIdentifier];
	}
	// Although the delete request does allow multiple deletes, we require an identifier.
	if (!parseInt(tmpIDRecord) || tmpIDRecord < 1)
	{
		return pRequest.CommonServices.sendError('Record delete failure - a valid record ID is required in the passed-in record.', pRequest, pResponse, fNext);
	}

	var tmpRecordCount = {};
	var tmpQuery;

	libAsync.waterfall(
		[
			function(fStageComplete)
			{
				tmpQuery = pRequest.DAL.query;

				// INJECT: Query configuration and population

				// This is not overloadable.`
				tmpQuery.addFilter(pRequest.DAL.defaultIdentifier, tmpIDRecord);
				tmpQuery.setIDUser(pRequest.UserSession.UserID);

				return fStageComplete();
			},
			function(fStageComplete)
			{
				// Load the record so we can do security checks on it
				pRequest.DAL.doRead(tmpQuery,
					function(pError, pQuery, pRecord)
					{
						if (!pRecord)
						{
							tmpRecordCount = {Count:0};
							return fStageComplete("NO_RECORD_FOUND");
						}

						pRequest.Record = pRecord;

						return fStageComplete();
					});
			},
			function(fStageComplete)
			{
				pRequest.Authorizers.authorizeRequest('Delete', pRequest, fStageComplete);
			},
			function(fStageComplete)
			{
				// INJECT: Once we've check the authorizer and are ready to Delete, invoke an injected behavior before we execute the actuall delete operation
				return pRequest.BehaviorModifications.runBehavior('Delete-PreOperation', pRequest, fStageComplete);
			},
			function(fStageComplete)
			{
				// INJECT: Record modification before delete

				if (pRequest.MeadowAuthorization)
				{
					return fStageComplete(false);
				}

				// It looks like this record was not authorized.  Send an error.
				return fStageComplete({Code:405,Message:'UNAUTHORIZED ACCESS IS NOT ALLOWED'});
			},
			function(fStageComplete)
			{
				// Do the delete
				pRequest.DAL.doDelete(tmpQuery,
					function(pError, pQuery, pCount)
					{
						// It returns the number of rows deleted
						tmpRecordCount = {Count:pCount};

						return fStageComplete(pError);
					});
			},
			function(fStageComplete)
			{
				// INJECT: After the delete count is grabbed, let the user alter the response content
				return pRequest.BehaviorModifications.runBehavior('Delete-PostOperation', pRequest, fStageComplete);
			}
		], function(pError)
		{
			if (pError &&
				pError !== "NO_RECORD_FOUND")
			{
				return pRequest.CommonServices.sendCodedError('Error deleting a record.', pError, pRequest, pResponse, fNext);
			}

			pRequest.CommonServices.log.info('Deleted '+tmpRecordCount.Count+' records with ID '+tmpIDRecord+'.', {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-Delete'}, pRequest);
			pResponse.send(tmpRecordCount);

			return fNext();
		}
	);
};

module.exports = doAPIDeleteEndpoint;
