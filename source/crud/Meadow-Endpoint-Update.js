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
var doAPIUpdateEndpoint = function(pRequest, pResponse, fNext)
{
	var tmpNext = (typeof(fNext) === 'function') ? fNext : function() {};

	// This state is the requirement for the UserRoleIndex value in the SessionData object... processed by default as >=
	// The default here is that any authenticated user can use this endpoint.
	pRequest.EndpointAuthorizationRequirement = pRequest.EndpointAuthorizationLevels.Update;
	
	// INJECT: Pre authorization (for instance to change the authorization level)
	
	// OVERLOAD: Endpoint authorization (for instance if it is a complex authorization requirement)
	if (pRequest.CommonServices.authorizeEndpoint(pRequest, pResponse, fNext) === false)
	{
		// If this endpoint fails, it's sent an error automatically.
		return;
	}

	// INJECT: Pre endpoint operation

	// OVERLOAD: Body validation and parsing
	if (typeof(pRequest.body) !== 'object')
	{
		return pRequest.CommonServices.sendError('Record update failure - a valid record is required.', pRequest, pResponse, tmpNext);
	}
	if (pRequest.body[pRequest.DAL.defaultIdentifier] < 1)
	{
		return pRequest.CommonServices.sendError('Record update failure - a valid record ID is required in the passed-in record.', pRequest, pResponse, tmpNext);
	}
	var tmpUpdatedRecord = pRequest.body;

	// INJECT: Record modification before update

	// OVERLOAD: Query instantiation
	var tmpQuery = pRequest.DAL.query;

	// INJECT: Query configuration and population
	tmpQuery.addRecord(tmpUpdatedRecord);
	
	pRequest.DAL.setIDUser(pRequest.SessionData.UserID).doUpdate(tmpQuery,
		function(pError, pQuery, pReadQuery, pRecord)
		{
			if (!pRecord)
			{
				return pRequest.CommonServices.sendError('Error updating a record.', pRequest, pResponse, fNext);
			}

			// INJECT: Post modification with record

			pRequest.CommonServices.log.info('Udated a record with ID '+pRecord[pRequest.DAL.defaultIdentifier]+'.', {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-Update'});
			pResponse.send(pRecord);
			return tmpNext();
		});
};

module.exports = doAPIUpdateEndpoint;