/**
* Meadow Endpoint - Read a select list of Records (for Drop-downs and such)
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
var libAsync = require('async');
/**
* Get a set of records from a DAL.
*/
var doAPIReadSelectListEndpoint = function(pRequest, pResponse, fNext)
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
			// 1. Get the records
			function (fStageComplete)
			{
				var tmpQuery = pRequest.DAL.query;

				// TODO: Limit the query to the columns we need for the templated expression

				// INJECT: Query configuration and population

				var tmpCap = false;
				var tmpBegin = false;
				if (typeof(pRequest.params.Begin) === 'string')
				{
					tmpBegin = parseInt(pRequest.params.Begin);
				}
				if (typeof(pRequest.params.Cap) === 'string')
				{
					tmpCap = parseInt(pRequest.params.Cap);
				}
				tmpQuery.setCap(tmpCap).setBegin(tmpBegin);

				// TODO: Set an upper limit for what can be returned in the select list

				// Do the record read
				pRequest.DAL.doReads(tmpQuery, fStageComplete);
			},
			// 2. Post processing of the records
			function (pQuery, pRecords, fStageComplete)
			{
				// INJECT: Results validation, pass in pRecords

				if (pRecords.length < 1)
				{
					pRequest.CommonServices.log.info('Successfully delivered empty recordset', {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-Reads'});
					return pResponse.send([]);
				}

				// INJECT: Post process the records, tacking on or altering anything we want to do.

				// Complete the waterfall operation
				fStageComplete(false, pQuery, pRecords);
			},
			// 3. Marshalling of records into the hash list, using underscore templates.
			function (pQuery, pRecords, fStageComplete)
			{
				// Look on the Endpoint Customization object for an underscore template to generate hashes.
				var tmpSelectList = [];

				// Eventually we can cache this template to make the request faster

				// INJECT: Dynamically alter templates for the select
				for (var i = 0; i < pRecords.length; i++)
				{
					tmpSelectList.push
					(
						{
							Hash: pRecords[i][pRequest.DAL.defaultIdentifier], 
							Value: pRequest.BehaviorModifications.processTemplate('SelectList', {Record:pRecords[i]}, pRequest.DAL.scope+' #<%= Record.'+pRequest.DAL.defaultIdentifier+'%>')
						}
					);
				}

				fStageComplete(false, pQuery, tmpSelectList);
			}
		],
		// 3. Return the results to the user
		function(pError, pQuery, pRecords)
		{
			if (pError)
			{
				return pRequest.CommonServices.sendError('Error retreiving a recordset.', pRequest, pResponse, fNext);
			}

			pRequest.CommonServices.log.info('Read a recordset select list with '+pRecords.length+' results.', {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-ReadSelectList'});
			pResponse.send(pRecords);
			return fNext();
		}
	);
};

module.exports = doAPIReadSelectListEndpoint;