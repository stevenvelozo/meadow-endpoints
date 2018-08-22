/**
* Meadow Operation - Marshal an array of records into a lite list
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
/**
* Shared record marshaling code
*/

var marshalLiteList = (pRecords, pRequest, pFieldList) =>
{
	if (pRecords.length < 1)
	    return [];

	let tmpLiteList = [];
	// Allow the caller to pass in a list of fields.
	let tmpFieldList = (typeof(pFieldList) !== 'undefined') ? pFieldList : [];

    // See if this record has a GUID in the schema
	let tmpGUID = (pRequest.DAL.defaultGUIdentifier && pRequest.DAL.defaultGUIdentifier.length > 0) ? pRequest.DAL.defaultGUIdentifier : false;
	// Peek at the first record to check for updatedate
	let tmpHasUpdateDate = (pRecords[0].hasOwnProperty('UpdateDate')) ? true : false;
	//Include all GUID and ID fields on the record
	let tmpRecordFields = Object.keys(pRecords[0]);
	tmpRecordFields.forEach(
	    (pField) =>
		{
			if (pField.indexOf('ID') === 0 ||
				pField.indexOf('GUID') === 0 ||
				pField == 'CreatingIDUser') //we should always include owner info
			{
				tmpFieldList.push(pField);
			}
		});

	let h = 0;
	while (h < tmpFieldList.length)
	{
		// Remove any fields in the list that aren't in the first record.
		if (!pRecords[0].hasOwnProperty(tmpFieldList[0]))
			tmpFieldList.splice(h, 1);
		else
			h++;
	}

	for (let i = 0; i < pRecords.length; i++)
	{
		let tmpLiteRecord = (
			{
				Value: pRequest.BehaviorModifications.processTemplate('SelectList', {Record:pRecords[i]}, pRequest.DAL.scope+' #<%= Record.'+pRequest.DAL.defaultIdentifier+'%>')
			});
		tmpLiteRecord[pRequest.DAL.defaultIdentifier] = pRecords[i][pRequest.DAL.defaultIdentifier];

		if (tmpGUID)
			tmpLiteRecord[tmpGUID] = pRecords[i][tmpGUID];
		if (tmpHasUpdateDate)
			tmpLiteRecord['UpdateDate'] = pRecords[i].UpdateDate;

		tmpFieldList.forEach(
		    (pField) =>
    		{
    			tmpLiteRecord[pField] = pRecords[i][pField];
    		});

		tmpLiteList.push(tmpLiteRecord);
	}
	
	return tmpLiteList;
};

module.exports = marshalLiteList;