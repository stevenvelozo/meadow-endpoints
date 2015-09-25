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
var doAPIReadsByEndpoint = function(pRequest, pResponse, fNext)
{
	// This state is the requirement for the UserRoleIndex value in the SessionData object... processed by default as >=
	// The default here is that any authenticated user can use this endpoint.
	pRequest.EndpointAuthorizationRequirement = pRequest.EndpointAuthorizationLevels.Reads;
	
	// INJECT: Pre authorization (for instance to change the authorization level)
	
	if (pRequest.CommonServices.authorizeEndpoint(pRequest, pResponse, fNext) === false)
	{
		// If this endpoint fails, it's sent an error automatically.
		return;
	}

	// INJECT: Pre endpoint operation

	libAsync.waterfall(
		[
			// 1. Construct the Query
			function (fStageComplete)
			{
				pRequest.Query = pRequest.DAL.query;

				var tmpCap = false;
				var tmpBegin = false;
				if (typeof(pRequest.params.Begin) === 'string' ||
					typeof(pRequest.params.Begin) === 'number')
				{
					tmpBegin = parseInt(pRequest.params.Begin);
				}
				if (typeof(pRequest.params.Cap) === 'string' ||
					typeof(pRequest.params.Cap) === 'number')
				{
					tmpCap = parseInt(pRequest.params.Cap);
				}
				pRequest.Query.setCap(tmpCap).setBegin(tmpBegin);

				fStageComplete(false);
			},
			// 2. Set the query up with the By Value/Field combo
			function (fStageComplete)
			{
				var tmpByField =  pRequest.params.ByField;
				var tmpByValue =  pRequest.params.ByValue;
				// TODO: Validate theat the ByField exists in the current database

				// We use a custon name for this (RequestDefaultIdentifier) in case there is a query with a dot in the default identifier.
				pRequest.Query.addFilter(tmpByField, tmpByValue, '=', 'AND', 'RequestByField');
				fStageComplete(false);
			},
			// 3. INJECT: Query configuration
			function (fStageComplete)
			{
				pRequest.BehaviorModifications.runBehavior('Reads-QueryConfiguration', pRequest, fStageComplete);
			},
			// 4. Execute the query
			function (fStageComplete)
			{
				pRequest.DAL.doReads(pRequest.Query, fStageComplete);
			},
			// 5. Post processing of the records
			function (pQuery, pRecords, fStageComplete)
			{
				if (!pRecords)
				{
					pRequest.CommonServices.log.info('Records not found', {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-ReadsBy'});
					return pResponse.send([]);
				}
				pRequest.Records = pRecords;
				fStageComplete(false);
			},
			// 6. INJECT: Post process the record, tacking on or altering anything we want to.
			function (fStageComplete)
			{
				// This will also complete the waterfall operation
				pRequest.BehaviorModifications.runBehavior('Reads-PostOperation', pRequest, fStageComplete);
			}
		],
		// 7. Return the results to the user
		function(pError)
		{
			if (pError)
			{
				return pRequest.CommonServices.sendError('Error retreiving records by value.', pRequest, pResponse, fNext);
			}

			pRequest.CommonServices.log.info('Read a list of records by '+pRequest.params.ByField+' = '+pRequest.params.ByValue+'.', {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-ReadsBy'});
			pResponse.send(pRequest.Records);
			return fNext();
		}
	);
};

module.exports = doAPIReadsByEndpoint;