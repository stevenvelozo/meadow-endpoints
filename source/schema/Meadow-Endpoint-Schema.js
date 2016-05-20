/**
* Meadow Endpoint - Get the Record Schema
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
/**
* Get the JSONSchema for a particular scope
*/
var doAPISchemaEndpoint = function(pRequest, pResponse, fNext)
{
	// This state is the requirement for the UserRoleIndex value in the UserSession object... processed by default as >=
	// The default here is that any authenticated user can use this endpoint.
	pRequest.EndpointAuthorizationRequirement = pRequest.EndpointAuthorizationLevels.Schema;
	
	// INJECT: Pre authorization (for instance to change the authorization level)

	if (pRequest.CommonServices.authorizeEndpoint(pRequest, pResponse, fNext) === false)
	{
		// If this endpoint fails, it's sent an error automatically.
		return;
	}

	// INJECT: Pre endpoint operation

	var tmpSchema = pRequest.DAL.jsonSchema;

	// INJECT: After the schema is grabbed, let the user alter it

	pRequest.CommonServices.log.info('Delivered a JSON schema for '+pRequest.DAL.scope, {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-Schema'});
	pResponse.send(tmpSchema);
	return fNext();
};

module.exports = doAPISchemaEndpoint;