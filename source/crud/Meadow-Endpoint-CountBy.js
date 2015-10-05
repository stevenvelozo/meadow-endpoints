/**
* Meadow Endpoint - Count a Record filtered by a single value
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
/**
* Count a record using the Meadow DAL object
*/
var doAPICountByEndpoint = function(pRequest, pResponse, fNext)
{
	// This state is the requirement for the UserRoleIndex value in the SessionData object... processed by default as >=
	// The default here is that any authenticated user can use this endpoint.
	pRequest.EndpointAuthorizationRequirement = pRequest.EndpointAuthorizationLevels.Count;
	
	// INJECT: Pre authorization (for instance to change the authorization level)
	
	if (pRequest.CommonServices.authorizeEndpoint(pRequest, pResponse, fNext) === false)
	{
		// If this endpoint fails, it's sent an error automatically.
		return;
	}

	pRequest.Query = pRequest.DAL.query;

	var tmpByField =  pRequest.params.ByField;
	var tmpByValue =  pRequest.formattedParams.ByValue;
	// TODO: Validate theat the ByField exists in the current database

	if (tmpByValue.constructor === Array)
	{
		pRequest.Query.addFilter(tmpByField, tmpByValue, 'IN', 'AND', 'RequestByField');
	}
	else
	{
		// The count tries to match the Reads, since they are called together.
		pRequest.Query.addFilter(tmpByField, tmpByValue, '=', 'AND', 'RequestByField');
	}

	// Do the count
	pRequest.DAL.doCount(pRequest.Query,
		function(pError, pQuery, pCount)
		{
			pRequest.Result = {Count:pCount};


			pRequest.CommonServices.log.info('Delivered recordset count of '+pRequest.Result.Count+'.', {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-CountBy'});
			pResponse.send(pRequest.Result);
			return fNext();
		});
};

module.exports = doAPICountByEndpoint;