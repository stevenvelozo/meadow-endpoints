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

const libAsyncEachSeries = require('async/eachSeries');
const JSONStream = require('JSONStream');

// Would be better to get fable into this context, but it isn't here yet.
const chunk = (pInput, pChunkSize, pChunkCache) =>
{
	let tmpInputArray = [...pInput];
	// Note lodash defaults to 1, underscore defaults to 0
	let tmpChunkSize = (typeof(pChunkSize) == 'number') ? pChunkSize : 0;
	let tmpChunkCache = (typeof(pChunkCache) != 'undefined') ? pChunkCache : [];

	if (tmpChunkSize <= 0)
	{
		return tmpChunkCache;
	}

	while (tmpInputArray.length)
	{
		tmpChunkCache.push(tmpInputArray.splice(0, tmpChunkSize));
	}

	return tmpChunkCache;
};

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
	libAsyncEachSeries(chunk(pRecords, 1000), (pRecordChunk, fNext) =>
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
