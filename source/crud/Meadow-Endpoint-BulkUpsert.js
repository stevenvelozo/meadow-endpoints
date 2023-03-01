/**
* Meadow Endpoint - Upsert a set of Records
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
/**
* Upsert a set of records using the Meadow DAL object
*/

var libAsync = require('async');

var doUpsert = require('./Meadow-Operation-Upsert.js');
var marshalLiteList = require('./Meadow-Marshal-LiteList.js');
const streamRecordsToResponse = require('./Meadow-StreamRecordArray');

var doAPIUpsertEndpoint = function(pRequest, pResponse, fNext)
{
	// Configure the request for the generic upsert operation
	pRequest.CreatedRecords = [];
	pRequest.UpdatedRecords = [];
	pRequest.UpsertedRecords = [];
	pRequest.MeadowOperation = 'UpsertBulk';

	libAsync.waterfall(
		[
			function(fStageComplete)
			{
				//1. Validate request body to ensure it is a valid record
				if (!Array.isArray(pRequest.body))
				{
					return pRequest.CommonServices.sendError('Record upsert failure - a valid record is required.', pRequest, pResponse, fNext);
				}

				pRequest.BulkRecords = pRequest.body;

				return fStageComplete(null);
			},
			function(fStageComplete)
			{
				libAsync.eachSeries(pRequest.BulkRecords,
					function (pRecord, fCallback)
					{
						doUpsert(pRecord, pRequest, pResponse, fCallback);
					}, fStageComplete);
			},
			function(fStageComplete)
			{
				//5. Respond with the new records
				return streamRecordsToResponse(pResponse, marshalLiteList(pRequest.UpsertedRecords, pRequest), fStageComplete);
			}
		], function(pError)
		{
			if (pError)
			{
				return pRequest.CommonServices.sendCodedError('Error bulk upserting records.', pError, pRequest, pResponse, fNext);
			}

			return fNext();
		});
};

module.exports = doAPIUpsertEndpoint;
