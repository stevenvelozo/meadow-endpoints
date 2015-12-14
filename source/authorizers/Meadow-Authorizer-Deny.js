// ##### Part of the **[retold](https://stevenvelozo.github.io/retold/)** system
/**
* @license MIT
* @author <steven@velozo.com>
*/

/**
* Meadow Authorizer - Always Deny Access
*/
var doAuthorize = function(pRequest, fNext)
{
	pRequest.MeadowAuthorization = false;

	return fNext();
};

module.exports = doAuthorize;