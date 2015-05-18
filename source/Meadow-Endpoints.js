/**
* Meadow Data Broker Library
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/

/**
* Meadow Data Broker Library
*
* @class Meadow
* @constructor
*/
var libAsync = require('async');

var Meadow = function()
{
	function createNew(pFable, pScope, pJsonSchema, pSchema)
	{
		// If a valid Fable object isn't passed in, return a constructor
		if ((typeof(pFable) !== 'object') || (!pFable.hasOwnProperty('fable')))
		{
			return {new: createNew};
		}
		var _Fable = pFable;

		/**
		* Container Object for our Factory Pattern
		*/
		var tmpNewMeadowObject = (
		{
			// Factory
			new: createNew
		});

		return tmpNewMeadowObject;
	}

	return createNew();
};

module.exports = new Meadow();
