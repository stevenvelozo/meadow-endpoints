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
	if (typeof(pRequest.Record) !== 'object')
	{
		// If there is no record, fail.
		pRequest.MeadowAuthorization = false;		
		return fNext();
	}

	if (pRequest.Record.hasOwnProperty('IDCustomer') && (pRequest.Record.IDCustomer === pRequest.SessionData.CustomerID))
	{
		// If the customer matches
		pRequest.MeadowAuthorization = (true && pRequest.MeadowAuthorization);
	}
	else
	{
		// This will fail records that don't have a CustomerID.  Do we want that?
		pRequest.MeadowAuthorization = false;		
	}

	return fNext();
};

module.exports = doAuthorize;