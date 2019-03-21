/**
* Meadow Operation - Create a record function
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
/**
* Shared record create code
*/
var libAsync = require('async');

var doCreate = function(pRecord, pRequest, pResponse, fCallback)
{
    pRequest.MeadowOperation = (typeof(pRequest.MeadowOperation) === 'string') ? pRequest.MeadowOperation : 'Create';

	libAsync.waterfall(
		[
			function(fStageComplete)
			{
				// Do this for compatibility with injected behaviors
				pRequest.Record = pRecord;

                //Make sure record gets created with a customerID
                if (!pRequest.Record.hasOwnProperty('IDCustomer') &&
                    pRequest.DAL.jsonSchema.properties.hasOwnProperty('IDCustomer'))
                {
                    pRequest.Record.IDCustomer = pRequest.UserSession.CustomerID || 0;
                }

				pRequest.BehaviorModifications.runBehavior('Create-PreOperation', pRequest, fStageComplete);
			},
			function(fStageComplete)
			{
				pRequest.Authorizers.authorizeRequest('Create', pRequest, fStageComplete);
			},
			function (fStageComplete)
			{
				if (pRequest.MeadowAuthorization)
				{
					return fStageComplete(false);
				}

				// It looks like this record was not authorized.  Send an error.
				return fStageComplete({Code:405,Message:'UNAUTHORIZED ACCESS IS NOT ALLOWED'});
			},
			function(fStageComplete)
			{
				//3. Prepare create query
				var tmpQuery = pRequest.DAL.query;

				if (pRecord._CreatingIDUser && pRequest.UserSession.UserRoleIndex >= 4)
				{
					tmpQuery.setIDUser(pRecord._CreatingIDUser);
					delete pRecord['_CreatingIDUser'];
				}
				else
				{
					tmpQuery.setIDUser(pRequest.UserSession.UserID);
				}

				tmpQuery.addRecord(pRecord);

				return fStageComplete(null, tmpQuery);
			},
			// 3. INJECT: Query configuration
			function (tmpQuery, fStageComplete)
			{
				pRequest.Query = tmpQuery;
				pRequest.BehaviorModifications.runBehavior('Create-QueryConfiguration', pRequest, fStageComplete);
			},
			function(fStageComplete)
			{
				//4. Do the create operation
				pRequest.DAL.doCreate(pRequest.Query,
					function(pError, pQuery, pReadQuery, pNewRecord)
					{
						if (!pNewRecord)
						{
							return fStageComplete('Error in DAL create: '+pError);
						}
						
						pRequest.Record = pNewRecord;

						pRequest.CreatedRecords.push(pNewRecord);

						//pRequest.CommonServices.log.info('Created a record with ID '+pNewRecord[pRequest.DAL.defaultIdentifier]+'.', {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-CreateBulk'}, pRequest);

						return fStageComplete(null);
					});
			},
			function(fStageComplete)
			{
				return pRequest.BehaviorModifications.runBehavior('Create-PostOperation', pRequest, fStageComplete);
			}
		], function(pError)
		{
			if (pError)
			{
				pRecord.Error = 'Error creating record:'+pError;
				// Added for singleton operations
				pRequest.RecordCreateError = true;
				pRequest.RecordCreateErrorMessage = pError;
				// Also push the record to the created record stack with an error message
				pRequest.CreatedRecords.push(pRecord);
				pRequest.CommonServices.log.error('Error creating record:'+pError, {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-'+pRequest.MeadowOperation}, pRequest);
			}

			return fCallback();
		});
};

module.exports = doCreate;