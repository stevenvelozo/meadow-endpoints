/**
 * Check that a user is logged in
 *
 * @method checkAuthentication
 */
var checkAuthentication = function(pRequest, pResponse, fNext)
{
	var tmpNext = (typeof(fNext) === 'function') ? fNext : function () {};

	if (!pRequest.SessionData.LoggedIn)
	{
		pRequest.CommonServices.log.warn('Unauthenticated user attempting to get a secured resource.', {RequestID:pRequest.RequestUUID});
		pRequest.CommonServices.sendError('You must be authenticated to access this resource.', pRequest, pResponse, fNext);
	}

	tmpNext();
};

module.exports = checkAuthentication;