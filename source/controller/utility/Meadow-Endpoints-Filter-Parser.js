/**
* Meadow Endpoint Utility Class - Parse a Filter String and put it into a Query.
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/

const { parse } = require('meadow-filter');

class MeadowEndpointsFilterParser
{
    /**
     * @param {import('../Meadow-Endpoints-Controller-Base.js')} pController - The controller instance to which this parser belongs.
     */
    constructor(pController)
	{
        this._Controller = pController;
    }

    /**
     * @param {string} pFilterString - The filter string to parse.
     * @param {any} pQuery - The foxhound query object to populate.
     *
     * @return {boolean} - True if the filter was parsed successfully, false otherwise.
     */
    parseFilter(pFilterString, pQuery)
    {
        return parse(pFilterString, pQuery);
    }
}

module.exports = MeadowEndpointsFilterParser;
