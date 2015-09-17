/**
* Meadow Endpoint - Create a Record
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
/**
* Create a record using the Meadow DAL object
*/

var libAsync = require('async');

var doAPICreateEndpoint = function(pRequest, pResponse, fNext)
{
	// This state is the requirement for the UserRoleIndex value in the SessionData object... processed by default as >=
	// The default here is that any authenticated user can use this endpoint.
	pRequest.EndpointAuthorizationRequirement = pRequest.EndpointAuthorizationLevels.Create;
	
	// INJECT: Pre authorization (for instance to change the authorization level)

	if (pRequest.CommonServices.authorizeEndpoint(pRequest, pResponse, fNext) === false)
	{
		// If this endpoint fails, it's sent an error automatically.
		return;
	}

	// INJECT: Pre endpoint operation

	libAsync.waterfall(
		[
			function(fStageComplete)
			{
				//1. Validate request body to ensure it is a valid record
				if (typeof(pRequest.body) !== 'object')
				{
					return pRequest.CommonServices.sendError('Record create failure - a valid record is required.', pRequest, pResponse, fNext);
				}

				pRequest.Record = pRequest.body;

				return fStageComplete(null);
			},
			function(fStageComplete)
			{
				//2. INJECT: Record modification before insert
				pRequest.BehaviorModifications.runBehavior('Create-PreOperation', pRequest, fStageComplete);
			},
			function(fStageComplete)
			{
				//3. Prepare create query
				var tmpQuery = pRequest.DAL.query;

				// INJECT: Query configuration and population

				tmpQuery.addRecord(pRequest.Record);

				return fStageComplete(null, tmpQuery);
			},
			function(pPreparedQuery, fStageComplete)
			{
				//4. Do the create operation
				pRequest.DAL.setIDUser(pRequest.SessionData.UserID).doCreate(pPreparedQuery,
					function(pError, pQuery, pReadQuery, pRecord)
					{
						if (!pRecord)
						{
							return pRequest.CommonServices.sendError('Error creating a record.', pRequest, pResponse, fStageComplete);
						}

						pRequest.Record = pRecord;

						pRequest.CommonServices.log.info('Created a record with ID '+pRecord[pRequest.DAL.defaultIdentifier]+'.', {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-Create'});

						return fStageComplete(null);
					});
			},
			function(fStageComplete)
			{
				// INJECT: Post insert record modifications
				return pRequest.BehaviorModifications.runBehavior('Create-PostOperation', pRequest, fStageComplete);
			},
			function(fStageComplete)
			{
				//5. Respond with the new record
				pResponse.send(pRequest.Record);
				return fStageComplete(null);
			}
		], fNext);
};

module.exports = doAPICreateEndpoint;