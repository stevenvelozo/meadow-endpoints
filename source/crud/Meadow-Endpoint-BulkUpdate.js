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

var doUpdate = require('./Meadow-Operation-Update.js');

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

	// Configure the request for the generic update operation
	pRequest.UpdatedRecords = [];
	pRequest.MeadowOperation = 'UpdateBulk';

	libAsync.waterfall(
		[
			function(fStageComplete)
			{
				//1. Validate request body to ensure it is a valid record
				if (!Array.isArray(pRequest.body))
				{
					return pRequest.CommonServices.sendError('Record update failure - a valid record is required.', pRequest, pResponse, fNext);
				}

				pRequest.BulkRecords = pRequest.body;

				return fStageComplete(null);
			},
			function(fStageComplete)
			{
				libAsync.eachSeries(pRequest.BulkRecords,
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