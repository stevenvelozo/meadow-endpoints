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
				pRequest.Query = pRequest.DAL.query;
				fStageComplete(false);
			},
			// 2. Set the query up with the ecord ID, execute the query
			function (fStageComplete)
			{
				var tmpIDRecord =  pRequest.params.IDRecord;
				// We use a custon name for this (RequestDefaultIdentifier) in case there is a query with a dot in the default identifier.
				pRequest.Query.addFilter(pRequest.DAL.defaultIdentifier, tmpIDRecord, '=', 'AND', 'RequestDefaultIdentifier');
				fStageComplete(false);
			},
			// 3. INJECT: Query configuration
			function (fStageComplete)
			{
				pRequest.BehaviorModifications.runBehavior('Read-QueryConfiguration', pRequest, fStageComplete);
			},
			// 4. Execute the query
			function (fStageComplete)
			{
				pRequest.DAL.doRead(pRequest.Query, fStageComplete);
			},
			// 5. Post processing of the records
			function (pQuery, pRecord, fStageComplete)
			{
				if (!pRecord)
				{
					pRequest.CommonServices.log.info('Record not found', {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-Read'});
					return pResponse.send({});
				}
				pRequest.Record = pRecord;
				fStageComplete(false);
			},
			// 6. INJECT: Post process the record, tacking on or altering anything we want to.
			function (fStageComplete)
			{
				// This will also complete the waterfall operation
				pRequest.BehaviorModifications.runBehavior('Read-PostOperation', pRequest, fStageComplete);
			}
		],
		// 3. Return the results to the user
		function(pError)
		{
			if (pError)
			{
				return pRequest.CommonServices.sendError('Error retreiving a record.', pRequest, pResponse, fNext);
			}

			pRequest.CommonServices.log.info('Read a record with ID '+pRequest.params.IDRecord+'.', {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-Read'});
			pResponse.send(pRequest.Record);
			return fNext();
		}
	);
};

module.exports = doAPIReadEndpoint;