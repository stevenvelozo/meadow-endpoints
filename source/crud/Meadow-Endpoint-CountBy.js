/**
* Meadow Endpoint - Count a Record filtered by a single value
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/

var libAsync = require('async');

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

	libAsync.waterfall(
		[
			// 1. Create the query
			function (fStageComplete)
			{
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

				return fStageComplete(false);
			},
			// 2: Check if there is an authorizer set for this endpoint and user role combination, and authorize based on that
			function (fStageComplete)
			{
				pRequest.Authorizers.authorizeRequest('CountBy', pRequest, fStageComplete);
			},
			// 3. INJECT: Query configuration
			function (fStageComplete)
			{
				pRequest.BehaviorModifications.runBehavior('Reads-QueryConfiguration', pRequest, fStageComplete);
			},
			// 4: Check if authorization denies security access to the record
			function (fStageComplete)
			{
				if (pRequest.MeadowAuthorization)
				{
					// This will complete the waterfall operation
					return fStageComplete(false);
				}

				// It looks like this record was not authorized.  Send an error.
				return fStageComplete({Code:405,Message:'UNAUTHORIZED ACCESS IS NOT ALLOWED'});
			},
			// 5: Do the count
			function (fStageComplete)
			{
				pRequest.DAL.doCount(pRequest.Query,
					function(pError, pQuery, pCount)
					{
						pRequest.Result = {Count:pCount};

						return fStageComplete(pError);
					});
			}
		],
		function(pError)
		{
			if (pError)
			{
				return pRequest.CommonServices.sendCodedError('Error retreiving a count.', pError, pRequest, pResponse, fNext);
			}

			pRequest.CommonServices.log.info('Delivered recordset count of '+pRequest.Result.Count+'.', {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-CountBy'});
			pResponse.send(pRequest.Result);

			return fNext();
		}
	);
};

module.exports = doAPICountByEndpoint;