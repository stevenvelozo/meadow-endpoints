/**
* Meadow Operation - Upsert a record
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
/**
* Upsert a record using the Meadow DAL object.
*/

var libAsync = require('async');

var doCreate = require('./Meadow-Operation-Create.js');
var doUpdate = require('./Meadow-Operation-Update.js');

var doUpsert = function(pRecordToUpsert, pRequest, pResponse, fCallback)
{
    pRequest.MeadowOperation = (typeof(pRequest.MeadowOperation) === 'string') ? pRequest.MeadowOperation : 'Upsert';

    libAsync.waterfall(
    	[
    		function(fStageComplete)
    		{
    			// Prepare to gather requirements for upserting
    			pRequest.Record = pRecordToUpsert;
    
    			var tmpQuery = pRequest.DAL.query;

    			// This operation will be create only if there is no GUID or ID in the record bundle
    			pRequest.UpsertCreateOnly = true;
    			
    			// See if there is a default identifier or default GUIdentifier
    			if ((typeof(pRecordToUpsert[pRequest.DAL.defaultGUIdentifier]) !== 'undefined') && pRecordToUpsert[pRequest.DAL.defaultGUIdentifier].length > 0)
    			{
	    			tmpQuery.addFilter(pRequest.DAL.defaultGUIdentifier, pRecordToUpsert[pRequest.DAL.defaultGUIdentifier]);
	    			pRequest.UpsertCreateOnly = false;
    			}
    			if ((typeof(pRecordToUpsert[pRequest.DAL.defaultIdentifier]) !== 'undefined') && (pRecordToUpsert[pRequest.DAL.defaultIdentifier] > 0))
    			{
	    			tmpQuery.addFilter(pRequest.DAL.defaultIdentifier, pRecordToUpsert[pRequest.DAL.defaultIdentifier]);
	    			pRequest.UpsertCreateOnly = false;
    			}
    			
    			if (pRequest.UpsertCreateOnly)
    			{
    				// Just create the record
    				doCreate(pRecordToUpsert, pRequest, pResponse, fStageComplete);
    			}
    			else
    			{
	    			// Load the record to see if it exists
	    			pRequest.DAL.doRead(tmpQuery,
	    				function(pError, pQuery, pRecord)
	    				{
	    					if (pError)
	    					{
	    						// Return the error, because there was an error.
	    						return fStageComplete(pError);
	    					}
	    					else if (!pError && !pRecord)
	    					{
	    						// Record not found -- do a create.
	    						doCreate(pRecordToUpsert, pRequest, pResponse, fStageComplete);
	    					}
	    					else
	    					{
	    						// Record found -- do an update.  Use the cached record, though.
								doUpdate(pRequest.body, pRequest, pResponse, fStageComplete, pRecord);
							}
	    				});
    			}
    		}
    	], function(pError)
    	{
    		if (pError)
    		{
    			pRecordToUpsert.Error = 'Error upserting record:'+pError;
				pRequest.RecordUpsertError = true;
				pRequest.RecordUpsertErrorMessage = pError;
    			pRequest.UpsertdRecords.push(pRecordToUpsert);
    			pRequest.CommonServices.log.error('Error upserting record:'+pError, {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-'+pRequest.MeadowOperation}, pRequest);
    		}
    
    		return fCallback();
    	});
};

module.exports = doUpsert;