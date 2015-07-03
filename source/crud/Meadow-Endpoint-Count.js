/**
* Meadow Endpoint - Count a Record
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
/**
* Count a record using the Meadow DAL object
*/
var doAPICountEndpoint = function(pRequest, pResponse, fNext)
{
	var tmpNext = (typeof(fNext) === 'function') ? fNext : function() {};

	// This state is the requirement for the UserRoleIndex value in the SessionData object... processed by default as >=
	// The default here is that any authenticated user can use this endpoint.
	pRequest.EndpointAuthorizationRequirement = pRequest.EndpointAuthorizationLevels.Count;
	
	// INJECT: Pre authorization (for instance to change the authorization level)
	
	// OVERLOAD: Endpoint authorization (for instance if it is a complex authorization requirement)
	if (pRequest.CommonServices.authorizeEndpoint(pRequest, pResponse, fNext) === false)
	{
		// If this endpoint fails, it's sent an error automatically.
		return;
	}

	// INJECT: Pre endpoint operation

	// OVERLOAD: Query instantiation
	var tmpQuery = pRequest.DAL.query;

	// INJECT: Query configuration and population

	// Do the count
	pRequest.DAL.doCount(tmpQuery,
		function(pError, pQuery, pCount)
		{
			var tmpRecordCount = {Count:pCount};

			// INJECT: After the count is grabbed, let the user alter the count

			pRequest.CommonServices.log.info('Delivered recordset count of '+pCount+'.', {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-Count'});
			pResponse.send(tmpRecordCount);
			return tmpNext();
		});
};

module.exports = doAPICountEndpoint;