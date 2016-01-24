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
				tmpQuery.setCap(tmpCap).setBegin(tmpBegin);

				// TODO: Set an upper limit for what can be returned in the select list

				// Do the record read
				pRequest.DAL.doReads(tmpQuery, fStageComplete);
			},
			// 2. Post processing of the records
			function (pQuery, pRecords, fStageComplete)
			{
				if (pRecords.length < 1)
				{
					pRecords = [];
				}

				// INJECT: Results validation, pass in pRecords
				pRequest.Records = pRecords;

				// Complete the waterfall operation
				fStageComplete(false);
			},
			// 2.5: Check if there is an authorizer set for this endpoint and user role combination, and authorize based on that
			function (fStageComplete)
			{
				pRequest.Authorizers.authorizeRequest('ReadSelectList', pRequest, fStageComplete);
			},
			// INJECT: Post process the records, tacking on or altering anything we want to do.

			// 2.6: Check if authorization or post processing denied security access to the record
			function (fStageComplete)
			{
				if (pRequest.MeadowAuthorization)
				{
					return fStageComplete(false);
				}

				// It looks like this record was not authorized.  Send an error.
				return fStageComplete({Code:405,Message:'UNAUTHORIZED ACCESS IS NOT ALLOWED'});
			},
			// 3. Marshalling of records into the hash list, using underscore templates.
			function (fStageComplete)
			{
				// Look on the Endpoint Customization object for an underscore template to generate hashes.
				var tmpSelectList = [];

				// Eventually we can cache this template to make the request faster

				// INJECT: Dynamically alter templates for the select
				for (var i = 0; i < pRequest.Records.length; i++)
				{
					tmpSelectList.push
					(
						{
							Hash: pRequest.Records[i][pRequest.DAL.defaultIdentifier], 
							Value: pRequest.BehaviorModifications.processTemplate('SelectList', {Record:pRequest.Records[i]}, pRequest.DAL.scope+' #<%= Record.'+pRequest.DAL.defaultIdentifier+'%>')
						}
					);
				}

				fStageComplete(false, tmpSelectList);
			}
		],
		// 3. Return the results to the user
		function(pError, pResultRecords)
		{
			//remove 'Records' object from pRequest, instead return template results (pResultRecords) for the records
			delete pRequest['Records'];

			if (pError)
			{
				return pRequest.CommonServices.sendCodedError('Error retreiving a recordset.', pError, pRequest, pResponse, fNext);
			}

			pRequest.CommonServices.log.info('Read a recordset select list with '+pResultRecords.length+' results.', {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-ReadSelectList'});
			pResponse.send(pResultRecords);
			return fNext();
		}
	);
};

module.exports = doAPIReadSelectListEndpoint;