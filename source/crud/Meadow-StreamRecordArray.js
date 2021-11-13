/**
* Meadow Endpoint Marshaller - Stream an array of recods as JSON to an output stream.
*
* If the array is small enough, we just call send() for simplicity.
*
* @license MIT
*
* @author Alex Decker <alex.decker@headlight.com>
* @module Meadow
*/

const libAsync = require('async');
const JSONStream = require('JSONStream');
const libUnderscore = require('underscore');

module.exports = (pResponse, pRecords, fCallback) =>
{
	// for meadow invoke, writeHead isn't provided, so just call send(), which is the shim it uses...
	// also, for small arrays, don't bother with the async serialization; this threshold could use tuning
	if (!pResponse.writeHead || !Array.isArray(pRecords) || pRecords.length < 2500)
	{
		pResponse.send(pRecords);
		return fCallback();
	}

	pResponse.writeHead(200,
	{
		'content-type': 'application/json',
	});

	const recordJsonMarshaller = JSONStream.stringify();
	recordJsonMarshaller.pipe(pResponse);

	// we write the records in chunks; doing one per loop is very inefficient, doing all is the same as not doing this at all
	libAsync.eachSeries(libUnderscore.chunk(pRecords, 1000), (pRecordChunk, fNext) =>
	{
		pRecordChunk.forEach(recordJsonMarshaller.write);
		setImmediate(fNext);
	},
	(error) =>
	{
		recordJsonMarshaller.end();
		fCallback(error);
	});
};
