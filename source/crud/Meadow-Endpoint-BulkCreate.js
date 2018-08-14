/**
* Meadow Endpoint - Create a set of Record in Bulk
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
/**
* Bulk Create records using the Meadow DAL object
*/

var libAsync = require('async');

var doCreate = require('./Meadow-Operation-Create.js');

var doAPIBulkCreateEndpoint = function(pRequest, pResponse, fNext)
{
	// Configure the request for the generic create operation
	pRequest.CreatedRecords = [];
	pRequest.MeadowOperation = 'CreateBulk';

	libAsync.waterfall(
		[
			function(fStageComplete)
			{
				//1. Validate request body to ensure it is a valid record
				if (!Array.isArray(pRequest.body))
				{
					return pRequest.CommonServices.sendError('Bulk record create failure - a valid array of records is required.', pRequest, pResponse, fNext);
				}

				pRequest.BulkRecords = pRequest.body;

				return fStageComplete(null);
			},
			function(fStageComplete)
			{
				pRequest.Response = pResponse;
				pRequest.BehaviorModifications.runBehavior('Create-PreRequest', pRequest, fStageComplete);
			},
			function(fStageComplete)
			{
				libAsync.eachSeries(pRequest.BulkRecords,
					function (pRecord, fCallback)
					{
						doCreate(pRecord, pRequest, pResponse, fCallback);
					}, fStageComplete);
			},
			function(fStageComplete)
			{
				//5. Respond with the new records
				pResponse.send(pRequest.CreatedRecords);
				return fStageComplete(null);
			}
		], function(pError)
		{
			if (pError)
			{
				return pRequest.CommonServices.sendCodedError('Error bulk creating a record.', pError, pRequest, pResponse, fNext);
			}

			return fNext();
		});
};

module.exports = doAPIBulkCreateEndpoint;