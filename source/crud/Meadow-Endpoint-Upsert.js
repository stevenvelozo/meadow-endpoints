/**
* Meadow Endpoint - Upsert (Insert OR Update) a Record
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
/**
* Upsert a record using the Meadow DAL object
*/

var libAsync = require('async');

var doUpsert = require('./Meadow-Operation-Upsert.js');

var doAPIUpsertEndpoint = function(pRequest, pResponse, fNext)
{
	// Configure the request for the generic create & update operations
	pRequest.CreatedRecords = [];
	pRequest.UpdatedRecords = [];
	pRequest.UpsertedRecords = [];
	pRequest.MeadowOperation = 'Upsert';

	libAsync.waterfall(
		[
			function(fStageComplete)
			{
				//1. Validate request body to ensure it is a valid record
				if (typeof(pRequest.body) !== 'object')
				{
					return pRequest.CommonServices.sendError('Record upsert failure - a valid record is required.', pRequest, pResponse, fNext);
				}

				pRequest.Record = pRequest.body;

				return fStageComplete(null);
			},
			function(fStageComplete)
			{
				//4. Do the upsert operation
				doUpsert(pRequest.body, pRequest, pResponse, fStageComplete);
			},
			function(fStageComplete)
			{
				//5. Respond with the new record

				// If there was an error, respond with that instead
				if (pRequest.RecordUpsertError)
					return fStageComplete(pRequest.RecordUpsertErrorMessage);

				pResponse.send(pRequest.Record);
				return fStageComplete(null);
			}
		], function(pError)
		{
			if (pError)
			{
				return pRequest.CommonServices.sendCodedError('Error upserting a record.', pError, pRequest, pResponse, fNext);
			}

			return fNext();
		});
};

module.exports = doAPIUpsertEndpoint;
