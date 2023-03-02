/**
* Meadow Endpoint - Read the Max Value of a Column in a Set
*/
const doAPIEndpointReadMax = function(pRequest, pResponse, fNext)
{
	this.waterfall(
		[
			// 1. Create the query
			(fStageComplete) =>
			{
				tmpRequestState.Query = this.DAL.query;
				fStageComplete();
			},
			// 2. Set the query up with the Column Name
			(fStageComplete) =>
			{
				var tmpColumnName =  pRequest.params.ColumnName;
				// We use a custon name for this (RequestDefaultIdentifier) in case there is a query with a dot in the default identifier.
				tmpRequestState.Query.setSort({Column:tmpColumnName, Direction:'Descending'});
				tmpRequestState.Query.setCap(1);

				fStageComplete();
			},
			// 3. INJECT: Query configuration
			(fStageComplete) =>
			{
				pRequest.BehaviorModifications.runBehavior('ReadMax-QueryConfiguration', pRequest, fStageComplete);
			},
			// 4. Execute the query
			(fStageComplete) =>
			{
				this.DAL.doRead(tmpRequestState.Query, fStageComplete);
			},
			// 5. Post processing of the records
			(pQuery, pRecord, fStageComplete) =>
			{
				if (!pRecord)
				{
									this.log.requestCompletedSuccessfully(pRequest, tmpRequestState, 'Record not found');
					return pResponse.send({});
				}
				tmpRequestState.Record = pRecord;
				fStageComplete();
			},
			// 6. INJECT: Post process the record, tacking on or altering anything we want to.
			(fStageComplete) =>
			{
				// This will also complete the waterfall operation
				pRequest.BehaviorModifications.runBehavior('ReadMax-PostOperation', pRequest, fStageComplete);
			}
		],
		// 3. Return the results to the user
		(pError) =>
		{
			if (pError)
			{
				return fStageComplete(this.ErrorHandler.getError('Error retreiving a record.', 500));
			}

							this.log.requestCompletedSuccessfully(pRequest, tmpRequestState, 'Read top record of '+pRequest.params.IDRecord+'.');
			pResponse.send(tmpRequestState.Record);
			return fNext();
		}
	);
};

module.exports = doAPIEndpointReadMax;