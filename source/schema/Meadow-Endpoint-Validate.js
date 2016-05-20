/**
* Meadow Endpoint - Validate a Record
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
/**
* Validate a record using the Meadow DAL object
*/
var doAPIValidateEndpoint = function(pRequest, pResponse, fNext)
{
	// This state is the requirement for the UserRoleIndex value in the UserSession object... processed by default as >=
	// The default here is that any authenticated user can use this endpoint.
	pRequest.EndpointAuthorizationRequirement = pRequest.EndpointAuthorizationLevels.New;
	
	// INJECT: Pre authorization (for instance to change the authorization level)
	
	if (pRequest.CommonServices.authorizeEndpoint(pRequest, pResponse, fNext) === false)
	{
		// If this endpoint fails, it's sent an error automatically.
		return;
	}

	if (typeof(pRequest.body) !== 'object')
	{
		return pRequest.CommonServices.sendError('Record validate failure - a valid JSON object is required.', pRequest, pResponse, fNext);
	}
	var tmpRecord = pRequest.body;

	// INJECT: Pre endpoint operation

	var tmpValid = pRequest.DAL.schemaFull.validateObject(tmpRecord);

	// INJECT: After the record is validated, let the API user alter the resultant

	pRequest.CommonServices.log.info('Delivered validation for '+pRequest.DAL.scope+': '+tmpValid, {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-Validate'});
	pResponse.send(tmpValid);
	return fNext();
};

module.exports = doAPIValidateEndpoint;