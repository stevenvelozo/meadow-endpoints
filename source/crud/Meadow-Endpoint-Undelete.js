/**
* Meadow Endpoint - Undelete a Record
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
/**
* Undelete a record using the Meadow DAL object
*/

var libAsync = require('async');


var doAPIUndeleteEndpoint = function(pRequest, pResponse, fNext)
{
	// This state is the requirement for the UserRoleIndex value in the UserSession object... processed by default as >=
	// The default here is that any authenticated user can use this endpoint.
	pRequest.EndpointAuthorizationRequirement = pRequest.EndpointAuthorizationLevels.Undelete;

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
	// Although the undelete request does allow multiple undeletes, we require an identifier.
	// TODO: Decide if we want to keep this pattern similar to Delete, or, if we want to change it to allow bulk undeletes.
	if (tmpIDRecord < 1)
	{
		return pRequest.CommonServices.sendError('Record undelete failure - a valid record ID is required in the passed-in record.', pRequest, pResponse, fNext);
	}

	var tmpRecordCount = {};
	var tmpQuery;

	libAsync.waterfall(
		[
			function(fStageComplete)
			{
				tmpQuery = pRequest.DAL.query;

				// INJECT: Query configuration and population
				var tmpSchema = pRequest.DAL.schema;
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
			function(fStageComplete)
			{
				// Now see if the record, with this identifier, for this user, has the deleted bit set to 1
				tmpQuery.addFilter(pRequest.DAL.defaultIdentifier, tmpIDRecord);
				tmpQuery.addFilter('Deleted', 1);
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
							return fStageComplete("NO_UNDELETABLE_RECORD_FOUND");
						}

						pRequest.Record = pRecord;

						return fStageComplete();
					});
			},
			function(fStageComplete)
			{
				pRequest.Authorizers.authorizeRequest('Undelete', pRequest, fStageComplete);
			},
			function(fStageComplete)
			{
				// INJECT: Once we've check the authorizer and are ready to Undelete, invoke an injected behavior before we execute the actuall delete operation
				return pRequest.BehaviorModifications.runBehavior('Undelete-PreOperation', pRequest, fStageComplete);
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
				pRequest.DAL.doUndelete(tmpQuery,
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
				return pRequest.BehaviorModifications.runBehavior('Undelete-PostOperation', pRequest, fStageComplete);
			}
		], function(pError)
		{
			if (pError &&
				pError !== "NO_RECORD_FOUND")
			{
				return pRequest.CommonServices.sendCodedError('Error undeleting a record.', pError, pRequest, pResponse, fNext);
			}

			pRequest.CommonServices.log.info('Undeleted '+tmpRecordCount.Count+' records with ID '+tmpIDRecord+'.', {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-Undelete'}, pRequest);
			pResponse.send(tmpRecordCount);

			return fNext();
		}
	);
};

module.exports = doAPIUndeleteEndpoint;
