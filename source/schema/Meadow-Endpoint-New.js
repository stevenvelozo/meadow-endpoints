/**
* Meadow Endpoint - New Record
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
/**
* Create a new record using the Meadow DAL object
*/
var doAPINewEndpoint = function(pRequest, pResponse, fNext)
{
	// This state is the requirement for the UserRoleIndex value in the SessionData object... processed by default as >=
	// The default here is that any authenticated user can use this endpoint.
	pRequest.EndpointAuthorizationRequirement = pRequest.EndpointAuthorizationLevels.New;
	
	// INJECT: Pre authorization (for instance to change the authorization level)

	if (pRequest.CommonServices.authorizeEndpoint(pRequest, pResponse, fNext) === false)
	{
		// If this endpoint fails, it's sent an error automatically.
		return;
	}

	// INJECT: Pre endpoint operation

	var tmpEmptyObject = pRequest.DAL.schemaFull.defaultObject;

	// INJECT: After the empty object is grabbed, let the user alter it

	pRequest.CommonServices.log.info('Delivered new '+pRequest.DAL.scope, {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-New'});
	pResponse.send(tmpEmptyObject);
	return fNext();
};

module.exports = doAPINewEndpoint;