/**
* Meadow Endpoint - Read a Record
*/
const doAPIEndpointReadsBy = function(pRequest, pResponse, fNext)
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

				fStageComplete();
			},
			// 2. Set the query up with the By Value/Field combo
			(fStageComplete) =>
			{
				function addField(pByField, pByValue)
				{
					// TODO: Validate theat the ByField exists in the current database
					if (pByValue.constructor === Array)
					{
						tmpRequestState.Query.addFilter(pByField, pByValue, 'IN', 'AND', 'RequestByField');
					}
					else
					{
						// We use a custon name for this (RequestDefaultIdentifier) in case there is a query with a dot in the default identifier.
						tmpRequestState.Query.addFilter(pByField, pByValue, '=', 'AND', 'RequestByField');
					}
				}

				var tmpFilters = pRequest.params.Filters;
				if (tmpFilters &&
					tmpFilters.constructor === Array)
				{
					tmpFilters.forEach(function(filter)
					{
						addField(filter.ByField, filter.ByValue);
					});
				}
				else
				{
					addField(pRequest.params.ByField, pRequest.formattedParams.ByValue);
				}

				fStageComplete();
			},
			// 3. INJECT: Query configuration
			(fStageComplete) =>
			{
				pRequest.BehaviorModifications.runBehavior('Reads-QueryConfiguration', pRequest, fStageComplete);
			},
			// 3b. INJECT: Query pre-authorization behavior (ex. if authorizer needs fields to be included, it can add them)
			(fStageComplete) =>
			{
				pRequest.BehaviorModifications.runBehavior('Reads-PreAuth', pRequest, fStageComplete);
			},
			// 4. Execute the query
			(fStageComplete) =>
			{
				this.DAL.doReads(tmpRequestState.Query, fStageComplete);
			},
			// 5. Post processing of the records
			(pQuery, pRecords, fStageComplete) =>
			{
				if (!pRecords)
				{
									this.log.requestCompletedSuccessfully(pRequest, tmpRequestState, 'Records not found');
					return pResponse.send([]);
				}
				tmpRequestState.Records = pRecords;
				fStageComplete();
			},
			// 5.5: Check if there is an authorizer set for this endpoint and user role combination, and authorize based on that
			(fStageComplete) =>
			{
				pRequest.Authorizers.authorizeRequest('ReadsBy', pRequest, fStageComplete);
			},
			// 6. INJECT: Post process the record, tacking on or altering anything we want to.
			(fStageComplete) =>
			{
				pRequest.BehaviorModifications.runBehavior('Reads-PostOperation', pRequest, fStageComplete);
			},
			// 6.5: Check if authorization or post processing denied security access to the record
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
		// 7. Return the results to the user
		(pError) =>
		{
			if (pError)
			{
				return this.ErrorHandler.sendError(pRequest, tmpRequestState, pResponse, pError, fNext);
			}

							this.log.requestCompletedSuccessfully(pRequest, tmpRequestState, 'Read a list of records by '+pRequest.params.ByField+' = '+pRequest.params.ByValue+'.');
			return this.streamRecordsToResponse(pResponse, tmpRequestState.Records, fNext);
		}
	);
};

module.exports = doAPIEndpointReadsBy;