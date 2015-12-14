// ##### Part of the **[retold](https://stevenvelozo.github.io/retold/)** system
/**
* @license MIT
* @author <steven@velozo.com>
*/

/**
* Meadow Authorizer - Always Allow Access
*/
var doAuthorize = function(pRequest, fNext)
{
	pRequest.MeadowAuthorization = true;

	return fNext();
};

module.exports = doAuthorize;