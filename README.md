# Meadow Endpoints

Automagic REST endpoints for basic CRUD operations on the Retold framework.

This library generates REST endpoints in a consistent manner.  Endpoints have the following features:

* Authentication
* Resource Authorization
* CRUD Operations
* Dynamic Filtering
* Schema Validation

The design philosophy is not to cover every possible use case, but to cover the 99% via configuration.  The last 1% is easily hand-craftable.

To best use this library, it should be in conjunction with [stricture](https://github.com/stevenvelozo/stricture) and [orator](https://github.com/stevenvelozo/orator).


### Docker Development Environment

1. Run this command to build this image:

```
npm run docker-dev-build-image
```

2. Run this command to create and run the local container:

```
npm run docker-dev-run
```

3. Go to http://localhost:12343/ in a web browser

4. The password is "retold"

5. Right now you (may) need to delete the `node_modules` folders and regenerate it for Linux, depending on your OS.



## Pattern Description to Expand

```
const libMeadowEndpointsControllerBase = require('meadow-endpoints').ControllerBase;

class MySpecialLogController inherits libMeadowEndpointsControllerBase.LogControllerBase
{
	constructor(pMeadowEndpoints, pOptions)
	{
		super(pMeadowEndpoints, pOptions);
	}

	// Overload info to do something special
	info(pLogText, ...pLogObjects)
	{
		super(pLogText, ...pLogObjects);
		console.log('### THIS CONTROLLER DO MAGIC STUFF WITH'+pLogText);
	}
}

class MyMeadowEndpointsController
{
	constructor(pMeadowEndpoints, pOptions)
	{
		super(pMeadowEndpoints, pOptions);

		this._LogController = new mySpecialLogController(pMeadowEndpoints, pOptions);

		this.initializeDefaultUnsetControllers(pMeadowEndpoints, pControllerOptions);
	}
}

module.exports = MyMeadowEndpointsController;
```

```
let libMySpecialController = require('TheCodeAbove.js');

let tmpMeadow = new Meadow('INITIALIZE THE DAL');

let tmpMeadowEndpoints = new MeadowEndpoints(tmpMeadow, { Controller: libMySpecialController });

```