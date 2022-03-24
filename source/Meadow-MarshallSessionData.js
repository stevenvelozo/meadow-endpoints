/**
* Meadow Session Marshaller - Extract session data based on configuration.
*
* @license MIT
*
* @author Alex Decker <alex.decker@headlight.com>
* @module Meadow
*/

module.exports = (pFable) =>
{
	const _Fable = pFable;
	const _SessionDataSource = _Fable.settings.MeadowEndpointsSessionDataSource || 'Request';

	return (pRequest, pResponse, fNext) =>
	{
		let session;

		switch (_SessionDataSource)
		{
		default:
			_Fable.log.warn(`Unknown session source configured: ${_SessionDataSource} - defaulting to Request for backward compatibility`);
		case 'Request':
			// noop - already set by orator-session
			session = pRequest.UserSession;
			break;
		case 'None':
			break;
		case 'Header':
			try
			{
				const sessionStr = pRequest.headers['x-trusted-session'];
				if (!sessionStr)
				{
					break;
				}
				session = JSON.parse(sessionStr);
			}
			catch (pError)
			{
				_Fable.log.error('Error marshalling session data from header.', { Error: pError.message, Stack: pError.stack });
			}
			break;
		}

		if (!session)
		{
			// blank session so things don't break, for now
			session =
			{
				SessionID: '',
				UserID: 0,
				UserRole: '',
				UserRoleIndex: 0,
				LoggedIn: false,
				DeviceID: '',
				CustomerID: 0,
			};
		}

		pRequest.UserSession = session;
		fNext();
	}
};
