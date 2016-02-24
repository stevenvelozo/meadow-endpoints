// ##### Part of the **[retold](https://stevenvelozo.github.io/retold/)** system
/**
* @license MIT
* @author <steven@velozo.com>
*/

/**
* Meadow Authorizer - Records from My Customer
*/
var doAuthorize = function(pRequest, fNext)
{
	if (pRequest.EndpointHash === 'Count' ||
		pRequest.EndpointHash === 'CountBy')
	{
		pRequest.MeadowAuthorization = true;		
		return fNext();
	}
	if (typeof(pRequest.Record) !== 'object')
	{
		// If there is no record, fail.
		pRequest.MeadowAuthorization = false;		
		return fNext();
	}

	if (pRequest.Record.hasOwnProperty('CreatingIDUser'))
	{
		if (pRequest.Record.CreatingIDUser === pRequest.SessionData.UserID)
		{
			// If the UserID matches
			pRequest.MeadowAuthorization = (true && pRequest.MeadowAuthorization);
		}
		else
		{
			// DENY If the user IDs don't match
			pRequest.MeadowAuthorization = false;
		}
	}
	else
	{
		// This will pass records that don't have a CreatingIDUser.  Do we want that?
		pRequest.MeadowAuthorization = true;		
	}

	return fNext();
};

module.exports = doAuthorize;