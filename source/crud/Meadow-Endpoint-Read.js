/**
* Meadow Endpoint - Read a Record
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
var libAsync = require('async');
/**
* Get a specific record from a DAL.
*/
var doAPIReadEndpoint = function(pRequest, pResponse, fNext)
{
	// This state is the requirement for the UserRoleIndex value in the SessionData object... processed by default as >=
	// The default here is that any authenticated user can use this endpoint.
	pRequest.EndpointAuthorizationRequirement = pRequest.EndpointAuthorizationLevels.Read;
	
	// INJECT: Pre authorization (for instance to change the authorization level)
	console.log('Read');
	
	// OVERLOAD: Endpoint authorization (for instance if it is a complex authorization requirement)
	if (pRequest.CommonServices.authorizeEndpoint(pRequest, pResponse, fNext) === false)
	{
		// If this endpoint fails, it's sent an error automatically.
		return;
	}

	// INJECT: Pre endpoint operation

	libAsync.waterfall(
		[
			// 1. Get the records
			function (fStageComplete)
			{
				// OVERLOAD: Query instantiation
				var tmpQuery = pRequest.DAL.query;

				// INJECT: Query configuration and population

				// OVERRIDE: Query autopopulation
				if (!pRequest.params.hasOwnProperty('IDRecord'))
				{
					return pRequest.CommonServices.sendError('Record request failure - a valid default identifier ('+pRequest.DAL.defaultIdentifier+') is required at the end of the GET string.', pRequest, pResponse, tmpNext);
				}
				var tmpIDRecord =  pRequest.params.IDRecord;
				// We use a custon name for this (RequestDefaultIdentifier) in case there is a query with a dot in the default identifier.
				tmpQuery.addFilter(pRequest.DAL.defaultIdentifier, tmpIDRecord, '=', 'AND', 'RequestDefaultIdentifier');
				pRequest.DAL.doRead(tmpQuery, fStageComplete);
			},
			// 2. Post processing of the records
			function (pQuery, pRecord, fStageComplete)
			{
				// INJECT: Results validation, pass in pRecords

				if (!pRecord)
				{
					pRequest.CommonServices.log.info('Record not found', {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-Read'});
					return pResponse.send({});
				}

				// INJECT: Post process the records, tacking on or altering anything we want to do.

				// Complete the waterfall operation
				fStageComplete(false, pQuery, pRecord);
			}
		],
		// 3. Return the results to the user
		function(pError, pQuery, pRecord)
		{
			if (pError)
			{
				return pRequest.CommonServices.sendError('Error retreiving a record.', pRequest, pResponse, fNext);
			}

			pRequest.CommonServices.log.info('Read a record with ID '+pRequest.params.IDRecord+'.', {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-Read'});
			pResponse.send(pRecord);
			return fNext();
		}
	);
};

module.exports = doAPIReadEndpoint;