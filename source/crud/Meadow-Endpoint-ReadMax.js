/**
* Meadow Endpoint - Read the Max Value of a Column in a Set
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

	if (pRequest.CommonServices.authorizeEndpoint(pRequest, pResponse, fNext) === false)
	{
		// If this endpoint fails, it's sent an error automatically.
		return;
	}

	libAsync.waterfall(
		[
			// 1. Create the query
			function (fStageComplete)
			{
				pRequest.Query = pRequest.DAL.query;
				fStageComplete(false);
			},
			// 2. Set the query up with the Column Name
			function (fStageComplete)
			{
				var tmpColumnName =  pRequest.params.ColumnName;
				// We use a custon name for this (RequestDefaultIdentifier) in case there is a query with a dot in the default identifier.
				pRequest.Query.setSort({Column:tmpColumnName, Direction:'Descending'});
				pRequest.Query.setCap(1);

				fStageComplete(false);
			},
			// 3. INJECT: Query configuration
			function (fStageComplete)
			{
				pRequest.BehaviorModifications.runBehavior('ReadMax-QueryConfiguration', pRequest, fStageComplete);
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
					pRequest.CommonServices.log.info('Record not found', {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-ReadMax'});
					return pResponse.send({});
				}
				pRequest.Record = pRecord;
				fStageComplete(false);
			},
			// 6. INJECT: Post process the record, tacking on or altering anything we want to.
			function (fStageComplete)
			{
				// This will also complete the waterfall operation
				pRequest.BehaviorModifications.runBehavior('ReadMax-PostOperation', pRequest, fStageComplete);
			}
		],
		// 3. Return the results to the user
		function(pError)
		{
			if (pError)
			{
				return pRequest.CommonServices.sendError('Error retreiving a record.', pRequest, pResponse, fNext);
			}

			pRequest.CommonServices.log.info('Read top record of '+pRequest.params.IDRecord+'.', {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-ReadMax'});
			pResponse.send(pRequest.Record);
			return fNext();
		}
	);
};

module.exports = doAPIReadEndpoint;