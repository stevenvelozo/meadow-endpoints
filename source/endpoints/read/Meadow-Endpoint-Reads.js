/**
* Meadow Endpoint - Read a Set of Records
*/
const doAPIEndpointReads = function(pRequest, pResponse, fNext)
{
	this.waterfall(
		[
			// 1. Construct the Query
			(fStageComplete) =>
			{
				tmpRequestState.Query = this.DAL.query;

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
				else
				{
					//maximum number of records to return by default on Read queries. Override via "MeadowDefaultMaxCap" fable setting.
					tmpCap = (this.settings['MeadowDefaultMaxCap']) || 250;
				}
				tmpRequestState.Query.setCap(tmpCap).setBegin(tmpBegin);
				if (typeof(pRequest.params.Filter) === 'string')
				{
					// If a filter has been passed in, parse it and add the values to the query.
					this.parseFilter(pRequest.params.Filter, tmpRequestState.Query);
				}
				else if (pRequest.params.Filter)
				{
					tmpRequestState.Query.setFilter(pRequest.params.Filter);
				}

				fStageComplete();
			},
			// 2. INJECT: Query configuration
			(fStageComplete) =>
			{
				pRequest.BehaviorModifications.runBehavior('Reads-QueryConfiguration', pRequest, fStageComplete);
			},
			// 2b. INJECT: Query pre-authorization behavior (ex. if authorizer needs fields to be included, it can add them)
			(fStageComplete) =>
			{
				pRequest.BehaviorModifications.runBehavior('Reads-PreAuth', pRequest, fStageComplete);
			},
			// 3. Execute the query
			(fStageComplete) =>
			{
				this.DAL.doReads(tmpRequestState.Query, fStageComplete);
			},
			// 4. Post processing of the records
			(pQuery, pRecords, fStageComplete) =>
			{
				if (!pRecords)
				{
									this.log.requestCompletedSuccessfully(pRequest, tmpRequestState, 'Records not found');
					return fStageComplete('Records not found');
				}
				tmpRequestState.Records = pRecords;
				fStageComplete();
			},
			// 4.5: Check if there is an authorizer set for this endpoint and user role combination, and authorize based on that
			(fStageComplete) =>
			{
				pRequest.Authorizers.authorizeRequest('Reads', pRequest, fStageComplete);
			},
			// 5. INJECT: Post process the record, tacking on or altering anything we want to.
			(fStageComplete) =>
			{
				pRequest.BehaviorModifications.runBehavior('Reads-PostOperation', pRequest, fStageComplete);
			},
			// 5.5: Check if authorization or post processing denied security access to the record
			(fStageComplete) =>
			{
				if (pRequest.MeadowAuthorization)
				{
					// This will complete the waterfall operation
					return fStageComplete();
				}

				// It looks like this record was not authorized.  Send an error.
				return fStageComplete({Code:405,Message:'UNAUTHORIZED ACCESS IS NOT ALLOWED'});
			}
		],
		// 6. Return the results to the user
		(pError) =>
		{
			if (pError)
			{
				return this.ErrorHandler.sendError(pRequest, tmpRequestState, pResponse, pError, fNext);
			}

							this.log.requestCompletedSuccessfully(pRequest, tmpRequestState, 'Read a list of records.');

			streamRecordsToResponse(pResponse, tmpRequestState.Records, fNext);
		}
	);
};

module.exports = doAPIEndpointReads;