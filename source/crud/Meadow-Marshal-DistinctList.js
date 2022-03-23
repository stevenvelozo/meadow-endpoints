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

var marshalDistinctList = (pRecords, pRequest, pFieldList) =>
{
	if (pRecords.length < 1)
		return [];

	let tmpDistinctList = [];
	// Allow the caller to pass in a list of fields.
	let tmpFieldList = (typeof(pFieldList) !== 'undefined') ? pFieldList : [];

	// See if this record has a GUID in the schema
	let tmpGUID = (pRequest.DAL.defaultGUIdentifier && pRequest.DAL.defaultGUIdentifier.length > 0) ? pRequest.DAL.defaultGUIdentifier : false;
	// Peek at the first record to check for updatedate
	let tmpHasUpdateDate = (pRecords[0].hasOwnProperty('UpdateDate')) ? true : false;
	//Include all GUID and ID fields on the record
	let tmpRecordFields = Object.keys(pRecords[0]);

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
		let tmpDistinctRecord = { };

		tmpFieldList.forEach(
			(pField) =>
			{
				tmpDistinctRecord[pField] = pRecords[i][pField];
			});

		tmpDistinctList.push(tmpDistinctRecord);
	}

	return tmpDistinctList;
};

module.exports = marshalDistinctList;
