/**
* Meadow Endpoint - Count a Record
*/
const doAPIEndpointCount = function(pRequest, pResponse, fNext)
{
	let tmpRequestState = initializeRequestState(pRequest, 'Count');

	this.waterfall(
		[
			(fStageComplete) =>
			{
				tmpRequestState.Query = this.DAL.query;
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
			(fStageComplete) =>
			{
				this.BehaviorInjection.runBehaviorWithContext(`Count-QueryConfiguration`, pRequest, tmpRequestState, this, fStageComplete);
			},
			(fStageComplete) =>
			{
				this.DAL.doCount(tmpRequestState.Query,
					(pError, pQuery, pCount) =>
					{
						tmpRequestState.Result = {Count:pCount};
						return fStageComplete(pError);
					});
			},
			(fStageComplete) =>
			{
				this.log.requestCompletedSuccessfully(pRequest, tmpRequestState, 'Delivered recordset count of ' + tmpRequestState.Result.Count + '.');
				pResponse.send(tmpRequestState.Result);
				return fStageComplete();
			}
		],
		(pError) =>
		{
			if (pError)
			{
				return this.ErrorHandler.sendError(pRequest, tmpRequestState, pResponse, pError, fNext);
			}

			return fNext();
		}
	);
};

module.exports = doAPIEndpointCount;
