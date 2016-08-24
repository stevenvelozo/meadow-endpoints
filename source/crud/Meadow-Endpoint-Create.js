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
	// This state is the requirement for the UserRoleIndex value in the UserSession object... processed by default as >=
	// The default here is that any authenticated user can use this endpoint.
	pRequest.EndpointAuthorizationRequirement = pRequest.EndpointAuthorizationLevels.Create;
	
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
					return pRequest.CommonServices.sendError('Record create failure - a valid record is required.', pRequest, pResponse, fNext);
				}

				pRequest.Record = pRequest.body;

				return fStageComplete(null);
			},
			function(fStageComplete)
			{
				pRequest.Authorizers.authorizeRequest('Create', pRequest, fStageComplete);
			},
			function(fStageComplete)
			{
				pRequest.BehaviorModifications.runBehavior('Create-PreOperation', pRequest, fStageComplete);
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
				//3. Prepare create query
				var tmpQuery = pRequest.DAL.query;

				tmpQuery.setIDUser(pRequest.UserSession.UserID)
				tmpQuery.addRecord(pRequest.Record);

				return fStageComplete(null, tmpQuery);
			},
			function(pPreparedQuery, fStageComplete)
			{
				//4. Do the create operation
				pRequest.DAL.doCreate(pPreparedQuery,
					function(pError, pQuery, pReadQuery, pRecord)
					{
						if (!pRecord)
						{
							return fStageComplete('Error creating a record.');
						}

						pRequest.Record = pRecord;

						pRequest.CommonServices.log.info('Created a record with ID '+pRecord[pRequest.DAL.defaultIdentifier]+'.', {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-Create'}, pRequest);

						return fStageComplete(null);
					});
			},
			function(fStageComplete)
			{
				return pRequest.BehaviorModifications.runBehavior('Create-PostOperation', pRequest, fStageComplete);
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
				return pRequest.CommonServices.sendCodedError('Error creating a record.', pError, pRequest, pResponse, fNext);
			}

			return fNext();
		});
};

module.exports = doAPICreateEndpoint;