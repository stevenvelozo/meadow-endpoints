/**
* Meadow Operation - Upsert a record
*/
const doCreate = require('../create/Meadow-Operation-Create.js');
const doUpdate = require('../update/Meadow-Operation-Update.js');

const doUpsert = function(pRecordToUpsert, pRequest, pResponse, fCallback)
{
	let tmpRequestState = initializeRequestState(pRequest, 'Upsert');


	this.waterfall(
		[
			(fStageComplete) =>
			{
				tmpRequestState.Query = this.DAL.query;

				// Prepare to gather requirements for upserting
				tmpRequestState.Record = pRecordToUpsert;

				// This operation will be create only if there is no GUID or ID in the record bundle
				pRequest.UpsertCreateOnly = true;

				// See if there is a default identifier or default GUIdentifier
				if ((typeof(pRecordToUpsert[this.DAL.defaultGUIdentifier]) !== 'undefined') && pRecordToUpsert[this.DAL.defaultGUIdentifier].length > 0)
				{
					tmpRequestState.Query.addFilter(this.DAL.defaultGUIdentifier, pRecordToUpsert[this.DAL.defaultGUIdentifier]);
					pRequest.UpsertCreateOnly = false;
				}
				if ((typeof(pRecordToUpsert[this.DAL.defaultIdentifier]) !== 'undefined') && (pRecordToUpsert[this.DAL.defaultIdentifier] > 0))
				{
					tmpRequestState.Query.addFilter(this.DAL.defaultIdentifier, pRecordToUpsert[this.DAL.defaultIdentifier]);
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
					this.DAL.doRead(tmpRequestState.Query,
						(pError, pQuery, pRecord) =>
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
								// Set the default ID in the passed-in record if it doesn't exist..
								if (!pRecordToUpsert.hasOwnProperty(this.DAL.defaultIdentifier))
								{
									pRecordToUpsert[this.DAL.defaultIdentifier] = pRecord[this.DAL.defaultIdentifier];
								}
								// If the found record does not match the passed ID --- what the heck?!
								if (pRecordToUpsert[this.DAL.defaultIdentifier] != pRecord[this.DAL.defaultIdentifier])
								{
									return fStageComplete('Default identifier does not match GUID record.');
								}
								// Record found -- do an update.  Use the cached record, though.
								doUpdate(pRecordToUpsert, pRequest, pResponse, fStageComplete, pRecord);
							}
						});
				}
			},
			(fStageComplete) =>
			{
				// Now stuff the record into the upserted array
				pRequest.UpsertedRecords.push(tmpRequestState.Record);
				fStageComplete(null);
			}
		], (pError) =>
		{
			if (pError)
			{
				pRecordToUpsert.Error = 'Error upserting record:'+pError;
				tmpRequestState.RecordUpsertError = true;
				tmpRequestState.RecordUpsertErrorMessage = pError;
				pRequest.UpsertedRecords.push(pRecordToUpsert);
				pRequest.CommonServices.log.error('Error upserting record:'+pError, {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:this.DAL.scope+'-'+pRequest.MeadowOperation, Stack: pError.stack }, pRequest);
			}

			return fCallback();
		});
};

module.exports = doUpsert;