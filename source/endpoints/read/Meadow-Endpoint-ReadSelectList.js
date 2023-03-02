/**
* Meadow Endpoint - Read a select list of Records (for Drop-downs and such)
*/
const doAPIEndpointReadSelectList = function(pRequest, pResponse, fNext)
{
	this.waterfall(
		[
			// 1a. Get the records
			(fStageComplete) =>
			{
				tmpRequestState.Query = this.DAL.query;
				// TODO: Limit the query to the columns we need for the templated expression

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

				fStageComplete();
			},
			// 1b. INJECT: Query configuration
			(fStageComplete) =>
			{
				pRequest.BehaviorModifications.runBehavior('Reads-QueryConfiguration', pRequest, fStageComplete);
			},
			// 1b2. INJECT: Query pre-authorization behavior (ex. if authorizer needs fields to be included, it can add them)
			(fStageComplete) =>
			{
				pRequest.BehaviorModifications.runBehavior('Reads-PreAuth', pRequest, fStageComplete);
			},
			// 1c. Do the record read
			(fStageComplete) =>
			{
				this.DAL.doReads(tmpRequestState.Query, fStageComplete);
			},
			// 2. Post processing of the records
			(pQuery, pRecords, fStageComplete) =>
			{
				if (pRecords.length < 1)
				{
					pRecords = [];
				}

				tmpRequestState.Records = pRecords;

				// Complete the waterfall operation
				fStageComplete();
			},
			// 2.5: Check if there is an authorizer set for this endpoint and user role combination, and authorize based on that
			(fStageComplete) =>
			{
				pRequest.Authorizers.authorizeRequest('ReadSelectList', pRequest, fStageComplete);
			},
			// 2.6: Check if authorization or post processing denied security access to the record
			(fStageComplete) =>
			{
				if (pRequest.MeadowAuthorization)
				{
					return fStageComplete();
				}

				// It looks like this record was not authorized.  Send an error.
				return fStageComplete({Code:405,Message:'UNAUTHORIZED ACCESS IS NOT ALLOWED'});
			},
			// 3. Marshalling of records into the hash list, using underscore templates.
			(fStageComplete) =>
			{
				// Look on the Endpoint Customization object for an underscore template to generate hashes.
				var tmpSelectList = [];

				for (var i = 0; i < tmpRequestState.Records.length; i++)
				{
					tmpSelectList.push
					(
						{
							Hash: tmpRequestState.Records[i][this.DAL.defaultIdentifier],
							Value: pRequest.BehaviorModifications.processTemplate('SelectList', {Record:tmpRequestState.Records[i]}, this.DAL.scope+' #<%= Record.'+this.DAL.defaultIdentifier+'%>')
						}
					);
				}

				fStageComplete(false, tmpSelectList);
			}
		],
		// 3. Return the results to the user
		(pError, pResultRecords) =>
		{
			// Remove 'Records' object from pRequest, instead return template results (pResultRecords) for the records
			delete pRequest['Records'];

			if (pError)
			{
				return this.ErrorHandler.sendError(pRequest, tmpRequestState, pResponse, pError, fNext);
			}

							this.log.requestCompletedSuccessfully(pRequest, tmpRequestState, 'Read a recordset select list with '+pResultRecords.length+' results.');
			return this.streamRecordsToResponse(pResponse, pResultRecords, fNext);
		}
	);
};

module.exports = doAPIEndpointReadSelectList;