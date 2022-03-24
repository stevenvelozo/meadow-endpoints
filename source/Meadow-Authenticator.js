/**
 * Check that a user is logged in, if enabled
 *
 * @method getAuthenticator
 */
const getAuthenticator = (pAuthenticatorMode) =>
{
	if (pAuthenticatorMode === 'Disabled')
	{
		return (pRequest, pResponse, fNext) =>
		{
			pRequest.EndpointAuthenticated = true;
			fNext();
		};
	}
	return (pRequest, pResponse, fNext) =>
	{
		if (!pRequest.UserSession.LoggedIn)
		{
			pRequest.EndpointAuthenticated = false;
		}
		else
		{
			pRequest.EndpointAuthenticated = true;
		}

		fNext();
	}
};

module.exports = getAuthenticator;
