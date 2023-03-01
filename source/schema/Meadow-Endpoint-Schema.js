/**
* Meadow Endpoint - Get the Record Schema
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
/**
* Get the JSONSchema for a particular scope
*/
var doAPISchemaEndpoint = function(pRequest, pResponse, fNext)
{
	let tmpSessionData = this.getSessionData(pRequest);

	// INJECT: Pre endpoint operation

	var tmpSchema = this.DAL.jsonSchema;

	// INJECT: After the schema is grabbed, let the user alter it

	pResponse.send(tmpSchema);

	this.log.info(`Delivered JSON schema for ${this.DAL.scope}`, {SessionID:tmpSessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:this.DAL.scope+'-Schema'}, pRequest);

	return fNext();
};

module.exports = doAPISchemaEndpoint;