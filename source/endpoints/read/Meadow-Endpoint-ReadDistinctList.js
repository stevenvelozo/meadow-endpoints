/**
* Meadow Endpoint - Read a list of Records with a specified set of columns, distinct by those columns.
*/
const marshalDistinctList = require('./Meadow-Marshal-DistinctList.js');

const doAPIEndpointReadDistinct = function(pRequest, pResponse, fNext)
{
	// The hash for the endpoint (used for authorization and authentication)
	let tmpRequestState = initializeRequestState(pRequest, 'Read');

	let tmpDistinctColumns;

	this.waterfall(
		[
			// 1a. Get the records
			(fStageComplete) =>
			{
				tmpRequestState.Query = this.DAL.query.setDistinct(true);
				// TODO: Limit the query to the columns we need for the templated expression

				let tmpCap = false;
				let tmpBegin = false;
				if (typeof(pRequest.params.Begin) === 'string' ||
					typeof(pRequest.params.Begin) === 'number')
				{
					tmpBegin = parseInt(pRequest.params.Begin, 10);
				}
				if (typeof(pRequest.params.Cap) === 'string' ||
					typeof(pRequest.params.Cap) === 'number')
				{
					tmpCap = parseInt(pRequest.params.Cap, 10);
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
				if (typeof(pRequest.params.Columns) === 'string')
				{
					tmpDistinctColumns = pRequest.params.Columns.split(',');
					if (!tmpDistinctColumns)
					{
						return fStageComplete({Code:400,Message:'Columns to distinct on must be provided.'});
					}
					tmpRequestState.Query.setDataElements(tmpDistinctColumns);
				}
				fStageComplete();
			},
			(fStageComplete) =>
			{
				pRequest.BehaviorModifications.runBehavior('Reads-QueryConfiguration', pRequest, fStageComplete);
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
			(fStageComplete) =>
			{
				pRequest.ResultRecords = marshalDistinctList(tmpRequestState.Records, pRequest, tmpDistinctColumns);
			},
			(fStageComplete) =>
			{
				return this.streamRecordsToResponse(pResponse, pRequest.ResultRecords, fStageComplete);
			},
			(fStageComplete) =>
			{
				this.log.requestCompletedSuccessfully(pRequest, tmpRequestState, 'Read a recordset lite list with '+pRequest.ResultRecords.length+' results.');
				return fStageComplete();
			}
		],
		(pError) =>
		{
			// Remove 'Records' object from pRequest, instead return template results (pResultRecords) for the records
			delete pRequest['Records'];

			if (pError)
			{
				return this.ErrorHandler.sendError(pRequest, tmpRequestState, pResponse, pError, fNext);
			}
		}
	);
};

module.exports = doAPIEndpointReadDistinct;