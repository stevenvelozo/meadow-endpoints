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
			// 2. Set the query up with the record ID
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
					return fStageComplete('Record not found');
				}
				pRequest.Record = pRecord;
				fStageComplete(false);
			},
			// 5.5: Check if there is an authorizer set for this endpoint and user role combination, and authorize based on that
			function (fStageComplete)
			{
				pRequest.Authorizers.authorizeRequest('Read', pRequest, fStageComplete);
			},
			// 6. INJECT: Post process the record, tacking on or altering anything we want to.
			function (fStageComplete)
			{
				// This will also complete the waterfall operation
				pRequest.BehaviorModifications.runBehavior('Read-PostOperation', pRequest, fStageComplete);
			},
			// 6.5: Check if authorization or post processing denied security access to the record
			function (fStageComplete)
			{
				if (pRequest.MeadowAuthorization)
				{
					return fStageComplete(false);
				}

				// It looks like this record was not authorized.  Send an error.
				return fStageComplete({Code:405,Message:'UNAUTHORIZED ACCESS IS NOT ALLOWED'});
			},
		],
		// 3. Return the results to the user
		function(pError)
		{
			if (pError)
			{
				var tmpErrorMessage = 'Error retreiving a record.';
				if (typeof(pError) === 'object')
					tmpErrorMessage = pError.Message;

				return pRequest.CommonServices.sendError(tmpErrorMessage, pRequest, pResponse, fNext);
			}

			pRequest.CommonServices.log.info('Read a record with ID '+pRequest.params.IDRecord+'.', {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-Read'});
			pResponse.send(pRequest.Record);
			return fNext();
		}
	);
};

module.exports = doAPIReadEndpoint;