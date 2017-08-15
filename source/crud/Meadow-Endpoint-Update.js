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
	pRequest.MeadowOperation = 'Update';

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
				//4. Do the update operation
				doUpdate(pRequest.body, pRequest, pResponse, fStageComplete);
			},
			function(fStageComplete)
			{
				//5. Respond with the new record

				// If there was an error, respond with that instead
				if (pRequest.RecordUpdateError)
					return fStageComplete(pRequest.RecordUpdateErrorMessage);

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