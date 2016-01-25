/**
* Meadow Endpoint - Read a Set of Records
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
var libAsync = require('async');
var meadowFilterParser = require('./Meadow-Filter-Parse.js');
/**
* Get a set of records from a DAL.
*/
var doAPIReadsEndpoint = function(pRequest, pResponse, fNext)
{
	// This state is the requirement for the UserRoleIndex value in the SessionData object... processed by default as >=
	// The default here is that any authenticated user can use this endpoint.
	pRequest.EndpointAuthorizationRequirement = pRequest.EndpointAuthorizationLevels.Reads;
	
	if (pRequest.CommonServices.authorizeEndpoint(pRequest, pResponse, fNext) === false)
	{
		// If this endpoint fails, it's sent an error automatically.
		return;
	}

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
				if (typeof(pRequest.params.Filter) === 'string')
				{
					// If a filter has been passed in, parse it and add the values to the query.
					meadowFilterParser(pRequest.params.Filter, pRequest.Query);
				}

				fStageComplete(false);
			},
			// 2. INJECT: Query configuration
			function (fStageComplete)
			{
				pRequest.BehaviorModifications.runBehavior('Reads-QueryConfiguration', pRequest, fStageComplete);
			},
			// 3. Execute the query
			function (fStageComplete)
			{
				pRequest.DAL.doReads(pRequest.Query, fStageComplete);
			},
			// 4. Post processing of the records
			function (pQuery, pRecords, fStageComplete)
			{
				if (!pRecords)
				{
					pRequest.CommonServices.log.info('Records not found', {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-Reads'});
					return fStageComplete('Records not found');
				}
				pRequest.Records = pRecords;
				fStageComplete(false);
			},
			// 4.5: Check if there is an authorizer set for this endpoint and user role combination, and authorize based on that
			function (fStageComplete)
			{
				pRequest.Authorizers.authorizeRequest('Reads', pRequest, fStageComplete);
			},
			// 5. INJECT: Post process the record, tacking on or altering anything we want to.
			function (fStageComplete)
			{
				pRequest.BehaviorModifications.runBehavior('Reads-PostOperation', pRequest, fStageComplete);
			},
			// 5.5: Check if authorization or post processing denied security access to the record
			function (fStageComplete)
			{
				if (pRequest.MeadowAuthorization)
				{
					// This will complete the waterfall operation
					return fStageComplete(false);
				}

				// It looks like this record was not authorized.  Send an error.
				return fStageComplete({Code:405,Message:'UNAUTHORIZED ACCESS IS NOT ALLOWED'});
			}
		],
		// 6. Return the results to the user
		function(pError)
		{
			if (pError)
			{
				return pRequest.CommonServices.sendCodedError('Error retreiving records by value.', pError, pRequest, pResponse, fNext);
			}

			pRequest.CommonServices.log.info('Read a list of records.', {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-Reads'});
			pResponse.send(pRequest.Records);
			return fNext();
		}
	);
};

module.exports = doAPIReadsEndpoint;