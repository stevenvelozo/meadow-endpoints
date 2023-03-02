/**
* Meadow Endpoint - Validate a Record
*/
const doAPIEndpointValidate = function(pRequest, pResponse, fNext)
{
	if (typeof(pRequest.body) !== 'object')
	{
		return fStageComplete(this.ErrorHandler.getError('Record validate failure - a valid JSON object is required.', 500));
	}
	var tmpRecord = pRequest.body;

	// INJECT: Pre endpoint operation

	var tmpValid = this.DAL.schemaFull.validateObject(tmpRecord);

	// INJECT: After the record is validated, let the API user alter the resultant

	pRequest.CommonServices.log.info('Delivered validation for '+this.DAL.scope+': '+tmpValid, {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:this.DAL.scope+'-Validate'}, pRequest);
	pResponse.send(tmpValid);
	return fNext();
};

module.exports = doAPIEndpointValidate;