/**
* Meadow Endpoint - Create a set of Record in Bulk
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
/**
* Bulk Create records using the Meadow DAL object
*/

var libAsync = require('async');

// TODO: This should be shared with the CREATE endpoint as well.
var doCreate = function(pRecord, pRequest, pResponse, fCallback)
{
	libAsync.waterfall(
		[
			function(fStageComplete)
			{
				// Do this for compatibility with injected behaviors
				pRequest.Record = pRecord;
				pRequest.BehaviorModifications.runBehavior('Create-PreOperation', pRequest, fStageComplete);
			},
			function(fStageComplete)
			{
				//3. Prepare create query
				var tmpQuery = pRequest.DAL.query;

				tmpQuery.setIDUser(pRequest.UserSession.UserID);
				tmpQuery.addRecord(pRecord);

				return fStageComplete(null, tmpQuery);
			},
			function(pPreparedQuery, fStageComplete)
			{
				//4. Do the create operation
				pRequest.DAL.doCreate(pPreparedQuery,
					function(pError, pQuery, pReadQuery, pNewRecord)
					{
						if (!pNewRecord)
						{
							return fStageComplete('Error in DAL create: '+pError);
						}

						pRequest.CreatedRecords.push(pNewRecord);

						//pRequest.CommonServices.log.info('Created a record with ID '+pNewRecord[pRequest.DAL.defaultIdentifier]+'.', {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-CreateBulk'}, pRequest);

						return fStageComplete(null);
					});
			},
			function(fStageComplete)
			{
				return pRequest.BehaviorModifications.runBehavior('Create-PostOperation', pRequest, fStageComplete);
			}
		], function(pError)
		{
			if (pError)
			{
				pRecord.Error = 'Error during bulk creating single record:'+pError;
				pRequest.CreatedRecords.push(pRecord);
				pRequest.CommonServices.log.error('Error during bulk creating single record:'+pError, {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-CreateBulk'}, pRequest);
			}

			return fCallback();
		});
};

var doAPIBulkCreateEndpoint = function(pRequest, pResponse, fNext)
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
					return pRequest.CommonServices.sendError('Bulk record create failure - a valid array of records is required.', pRequest, pResponse, fNext);
				}

				pRequest.BulkRecords = pRequest.body;

				return fStageComplete(null);
			},
			function(fStageComplete)
			{
				// Only authorize once.
				pRequest.Authorizers.authorizeRequest('Create', pRequest, fStageComplete);
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
				pRequest.CreatedRecords = [];
				
				libAsync.eachSeries(pRequest.BulkRecords,
					function (pRecord, fCallback)
					{
						doCreate(pRecord, pRequest, pResponse, fCallback);
					}, fStageComplete);
			},
			function(fStageComplete)
			{
				//5. Respond with the new records
				pResponse.send(pRequest.CreatedRecords);
				return fStageComplete(null);
			}
		], function(pError)
		{
			if (pError)
			{
				return pRequest.CommonServices.sendCodedError('Error bulk creating a record.', pError, pRequest, pResponse, fNext);
			}

			return fNext();
		});
};

module.exports = doAPIBulkCreateEndpoint;