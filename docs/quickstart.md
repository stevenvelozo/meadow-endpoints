# Quick Start

This guide walks you through standing up a working REST API from a single Meadow entity: install the packages, create a Fable instance, wire up Orator, define a Meadow DAL, generate the endpoints, and call them with `curl`.

## Installation

Meadow Endpoints needs Fable as its runtime container, Meadow for data access, Orator as the API server, and an Orator service server implementation. Install them together:

```bash
npm install meadow-endpoints fable meadow orator orator-serviceserver-restify
```

## Creating the Server

Create a Fable instance, register Orator and its Restify service server, and instantiate both service providers.

```javascript
const libFable = require('fable');
const libOrator = require('orator');
const libOratorServiceServerRestify = require('orator-serviceserver-restify');
const libMeadow = require('meadow');
const libMeadowEndpoints = require('meadow-endpoints');

const _Fable = new libFable(
	{
		Product: 'MyAPI',
		ProductVersion: '1.0.0',
		ServicePort: 8086
	});

// Register and instantiate Orator and the Restify service server
_Fable.serviceManager.addServiceType('Orator', libOrator);
_Fable.serviceManager.addServiceType('OratorServiceServer', libOratorServiceServerRestify);
_Fable.serviceManager.instantiateServiceProvider('Orator');
_Fable.serviceManager.instantiateServiceProvider('OratorServiceServer');
```

## Defining the Meadow Entity

Create a Meadow data access layer (DAL) for the entity you want to expose. The scope name (`Book`) becomes the entity segment in every generated route, and the schema's special column types drive auto-stamping and soft-delete behavior.

```javascript
const tmpMeadow = libMeadow.new(_Fable, 'Book')
	.setProvider('MySQL')
	.setDefaultIdentifier('IDBook')
	.setSchema(
		[
			{ Column: 'IDBook', Type: 'AutoIdentity' },
			{ Column: 'GUIDBook', Type: 'AutoGUID' },
			{ Column: 'Title', Type: 'String', Size: '255' },
			{ Column: 'Author', Type: 'String', Size: '128' },
			{ Column: 'CreateDate', Type: 'CreateDate' },
			{ Column: 'CreatingIDUser', Type: 'CreateIDUser' },
			{ Column: 'UpdateDate', Type: 'UpdateDate' },
			{ Column: 'UpdatingIDUser', Type: 'UpdateIDUser' },
			{ Column: 'Deleted', Type: 'Deleted' }
		]);
```

For the full set of schema column types and provider options, see the [meadow](https://fable-retold.github.io/meadow/) documentation.

## Generating and Connecting the Routes

Construct a `MeadowEndpoints` instance from the DAL and call `connectRoutes()`, passing the Orator service server. This is the single line that registers the entire CRUD route table.

```javascript
const tmpMeadowEndpoints = new libMeadowEndpoints(tmpMeadow);
tmpMeadowEndpoints.connectRoutes(_Fable.Orator.serviceServer);
```

## Starting the Service

```javascript
_Fable.Orator.startService(
	() =>
	{
		console.log('API running on port 8086');
	});
```

## Generated Routes

With the version defaulting to `1.0` and the entity scope `Book`, `connectRoutes()` registers the following routes. This is a representative selection -- see [Generated Routes](generated-routes.md) and the [CRUD Deep Dive](crud/README.md) for the complete table including filtered, paginated, lite, distinct, and select-list variants.

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/1.0/Book` | Create a record |
| POST | `/1.0/Book/s` | Bulk create (array of records) |
| GET | `/1.0/Book/:IDBook` | Read one record by ID |
| GET | `/1.0/Book/s` | Read records (default cap: 250) |
| GET | `/1.0/Book/s/:Begin/:Cap` | Read records with pagination |
| GET | `/1.0/Book/s/FilteredTo/:Filter` | Read records with a filter |
| PUT | `/1.0/Book` | Update a record |
| PUT | `/1.0/Book/Upsert` | Insert or update a record |
| DELETE | `/1.0/Book/:IDBook` | Delete a record |
| GET | `/1.0/Book/Undelete/:IDBook` | Undelete a soft-deleted record |
| GET | `/1.0/Book/s/Count` | Count records |
| GET | `/1.0/Book/Schema` | Return the JSON Schema |
| GET | `/1.0/Book/Schema/New` | Return an empty default record |
| POST | `/1.0/Book/Schema/Validate` | Validate a record against the schema |

## Calling the API

With the service running on port 8086, exercise the endpoints with `curl`.

Create a record:

```bash
curl -X POST http://localhost:8086/1.0/Book \
	-H "Content-Type: application/json" \
	-d '{ "Title": "Dune", "Author": "Frank Herbert" }'
```

Read it back by ID (the create response includes the new `IDBook`):

```bash
curl http://localhost:8086/1.0/Book/1
```

List records with pagination:

```bash
curl http://localhost:8086/1.0/Book/s/0/10
```

Filter the list (titles containing "Dune"):

```bash
curl http://localhost:8086/1.0/Book/s/FilteredTo/Title~Dune
```

Count the records:

```bash
curl http://localhost:8086/1.0/Book/s/Count
```

The `FilteredTo` segment accepts the operators `=`, `!=`, `>`, `<`, `>=`, `<=`, and `~` (contains). See [Dynamic Filtering](dynamic-filtering.md) for the full expression syntax.

## Next Steps

- Add authentication and authorization with [Behavior Injection](behavior-injection.md)
- Restrict which endpoints are generated -- see Disabling Endpoint Groups in the [CRUD Deep Dive](crud/README.md)
- Understand the request lifecycle in the [Architecture](architecture.md) overview

## Related Modules

- [meadow](https://fable-retold.github.io/meadow/) -- the data access layer this guide builds on
- [orator](https://fable-retold.github.io/orator/) -- the API server hosting the routes
- [retold-data-service](https://fable-retold.github.io/retold-data-service/) -- assembles Meadow Endpoints into a complete, schema-driven REST service
- [pict-section-recordset](https://fable-retold.github.io/pict-section-recordset/) -- browser-side UI that consumes these CRUD endpoints
