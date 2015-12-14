// ##### Part of the **[retold](https://stevenvelozo.github.io/retold/)** system
/**
* @license MIT
* @author <steven@velozo.com>
*/

/**
* Meadow Authorizer - My Records
*/
var doAuthorize = function(pRequest, fNext)
{
	if (typeof(pRequest.Record) !== 'object')
	{
		// If there is no record, fail.
		pRequest.MeadowAuthorization = false;		
		return fNext();
	}

	if (pRequest.Record.hasOwnProperty('CreatingIDUser') && (pRequest.Record.CreatingIDUser === pRequest.SessionData.UserID))
	{
		// If the creating user matches
		pRequest.MeadowAuthorization = (true && pRequest.MeadowAuthorization);
	}
	else
	{
		pRequest.MeadowAuthorization = false;		
	}

	return fNext();
};

module.exports = doAuthorize;