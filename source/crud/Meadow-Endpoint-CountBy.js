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
	libAsync.waterfall(
		[
			// 1. Create the query
			function (fStageComplete)
			{
				// NOTE: Removed capability for comma separated 
				pRequest.Query = pRequest.DAL.query;
				pRequest.Query.addFilter(pRequest.params.ByField, pRequest.params.ByValue, '=', 'AND', 'RequestByField');

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

			pRequest.CommonServices.log.info('Delivered recordset count of '+pRequest.Result.Count+'.', {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-CountBy'}, pRequest);
			pResponse.send(pRequest.Result);

			return fNext();
		}
	);
};

module.exports = doAPICountByEndpoint;
