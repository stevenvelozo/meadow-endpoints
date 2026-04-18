/**
* Simple browser shim loader - assign the npm module to a window global automatically
*
* @license MIT
* @author <steven@velozo.com>
*/
var libNPMModuleWrapper = require('./Meadow-Endpoints.js');

if ((typeof(window) === 'object') && !window.hasOwnProperty('MeadowEndpoints'))
{
	// Browser shim attaches the module to a named window global. The
	// property doesn't exist on the built-in Window type; cast to a
	// Window augmented with the optional property to satisfy checkJs.
	/** @type {Window & { MeadowEndpoints?: unknown }} */ (window).MeadowEndpoints = libNPMModuleWrapper;
}

module.exports = libNPMModuleWrapper;