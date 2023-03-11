/**
* Simple browser shim loader - assign the npm module to a window global automatically
*
* @license MIT
* @author <steven@velozo.com>
*/
var libNPMModuleWrapper = require('./Meadow-Endpoints.js');

if ((typeof(window) === 'object') && !window.hasOwnProperty('MeadowEndpoints'))
{
	window.MeadowEndpoints = libNPMModuleWrapper;
}

module.exports = libNPMModuleWrapper;