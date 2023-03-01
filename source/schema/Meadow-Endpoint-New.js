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
	// INJECT: Pre endpoint operation

	var tmpEmptyObject = pRequest.DAL.schemaFull.defaultObject;

	// INJECT: After the empty object is grabbed, let the user alter it

	pRequest.CommonServices.log.info('Delivered new '+pRequest.DAL.scope, {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-New'}, pRequest);
	pResponse.send(tmpEmptyObject);
	return fNext();
};

module.exports = doAPINewEndpoint;