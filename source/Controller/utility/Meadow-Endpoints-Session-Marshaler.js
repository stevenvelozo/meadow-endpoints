class MeadowEndpointsSessionMarshaler
{
    constructor(pController)
	{
        this._Controller = pController;
    }

    getSessionData(pRequest)
    {
        let tmpSession = Object.assign({}, this._Controller.settings.MeadowEndpointsDefaultSessionObject);

        switch (this._Controller.settings.MeadowEndpointsSessionDataSource || 'Request')
        {
            default:
                this._LogController.warn(`Unknown session source configured: ${_SessionDataSource} - defaulting to Request for backward compatibility`);
            case 'Request':
                // noop - already set by orator-session
                tmpSession = this._Controller.extend(tmpSession, pRequest.UserSession);
                break;
            case 'None':
                break;
            case 'Header':
                try
                {
                    const tmpHeaderSessionString = pRequest.headers['x-trusted-session'];
                    if (!tmpHeaderSessionString)
                    {
                        break;
                    }
                    tmpHeaderSession = JSON.parse(tmpHeaderSessionString);
                    tmpSession = this._Controller.extend(tmpSession, pRequest.tmpHeaderSession);
                }
                catch (pError)
                {
                    this._LogController.error(`Meadow Endpoints attempted to process a Header Session String with value [${tmpHeaderSessionString}] and failed -- likely culprit is bad JSON.`)
                }
                break;
        }

        // Do we keep this here for backwards compatibility?
        // Yes this makes sense here.
        pRequest.UserSession = tmpSession;

        return tmpSession;
    }
}

module.exports = MeadowEndpointsSessionMarshaler;