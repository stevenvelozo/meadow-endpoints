/**
* Meadow Endpoint - Count a Record filtered by a single value
*/
const doAPIEndpointCountBy = function(pRequest, pResponse, fNext)
{
	let tmpRequestState = initializeRequestState(pRequest, 'CountBy');

	this.waterfall(
		[
			(fStageComplete) =>
			{
				tmpRequestState.Query = this.DAL.query;
				tmpRequestState.Query.addFilter(pRequest.params.ByField, pRequest.params.ByValue, '=', 'AND', 'RequestByField');

				return fStageComplete();
			},
			(fStageComplete) =>
			{
				pRequest.BehaviorModifications.runBehavior('Reads-QueryConfiguration', pRequest, fStageComplete);
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
				this.log.requestCompletedSuccessfully(pRequest, tmpRequestState, 'Delivered recordset count of '+tmpRequestState.Result.Count+'.');
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
		});
};

module.exports = doAPIEndpointCountBy;