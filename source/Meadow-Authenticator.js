/**
 * Check that a user is logged in
 *
 * @method checkAuthentication
 */
var checkAuthentication = function(pRequest, pResponse, fNext)
{
	if (!pRequest.UserSession.LoggedIn)
	{
		pRequest.EndpointAuthenticated = false;
	}
	else
	{
		pRequest.EndpointAuthenticated = true;
	}

	// This doesn't call next in chain because SendError does that for us.
	fNext();
};

module.exports = checkAuthentication;