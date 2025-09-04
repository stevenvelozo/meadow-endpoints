class MeadowEndpointsSessionMarshaler
{
    /**
     * @param {import('../Meadow-Endpoints-Controller-Base.js')} pController
     */
    constructor(pController)
	{
        this._Controller = pController;
    }

    getSessionData(pRequest)
    {
        let tmpSession = Object.assign({}, this._Controller.settings.MeadowEndpointsDefaultSessionObject);
        let tmpHeaderSessionString;

        switch (this._Controller.settings.MeadowEndpointsSessionDataSource || 'Request')
        {
            default:
                this._Controller.log.warn(`Unknown session source configured: ${this._Controller.settings.MeadowEndpointsSessionDataSource} - defaulting to Request for backward compatibility`);
            case 'Request':
                // noop - already set by orator-session
                tmpSession = this._Controller.extend(tmpSession, pRequest.UserSession);
                break;
            case 'None':
                break;
            case 'Header':
                try
                {
                    tmpHeaderSessionString = pRequest.headers['x-trusted-session'];
                    if (!tmpHeaderSessionString)
                    {
                        break;
                    }
                    const tmpHeaderSession = JSON.parse(tmpHeaderSessionString);
                    tmpSession = this._Controller.extend(tmpSession, tmpHeaderSession);
                }
                catch (pError)
                {
                    this._Controller.log.error(`Meadow Endpoints attempted to process a Header Session String with value [${tmpHeaderSessionString}] and failed -- likely culprit is bad JSON.`)
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
