# Meadow Endpoints

Automagic REST endpoints for basic CRUD operations on the Retold framework.

[![Coverage Status](https://coveralls.io/repos/stevenvelozo/meadow-endpoints/badge.svg?branch=master)](https://coveralls.io/r/stevenvelozo/meadow-endpoints?branch=master) [![Build Status](https://travis-ci.org/stevenvelozo/meadow-endpoints.svg?branch=master)](https://travis-ci.org/stevenvelozo/meadow-endpoints) [![Dependency Status](https://david-dm.org/stevenvelozo/meadow-endpoints.svg)](https://david-dm.org/stevenvelozo/meadow-endpoints) [![devDependency Status](https://david-dm.org/stevenvelozo/meadow-endpoints/dev-status.svg)](https://david-dm.org/stevenvelozo/meadow-endpoints#info=devDependencies)

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
docker build ./ -t retold/meadow-endpoints:local
```

alternatively you can use npm to run this

```
npm run docker-dev-build-image
```

2. Run this command to build the local container:
```
docker run -it --name meadow-endpoints-dev -p 127.0.0.1:12343:8080 -v "$PWD/.config:/home/coder/.config"  -v "$PWD:/home/coder/meadow-endpoints" -u "$(id -u):$(id -g)" -e "DOCKER_USER=$USER" retold/meadow-endpoints:local
```

alternatively you can use npm to run this

```
npm run docker-dev-run
```

3. Go to http://localhost:12343/ in a web browser

4. The password is "retold"

5. Right now you (may) need to delete the `node_modules` folders and regenerate it for Linux.