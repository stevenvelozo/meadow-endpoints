# Schema Endpoints

> Serve metadata, default records, and validation with customization hooks

The Schema endpoints expose entity metadata over REST: the JSON Schema definition, an empty default record for new-record forms, and record validation. Each endpoint has both pre-operation and post-operation hooks, making them fully customizable.

## Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/{v}/{entity}/Schema` | Return the JSON Schema for the entity |
| GET | `/{v}/{entity}/Schema/New` | Return an empty default record |
| POST | `/{v}/{entity}/Schema/Validate` | Validate a record against the schema |

## Schema

**Request:** `GET /1.0/Book/Schema`

**Response:** The entity's JSON Schema definition:

```json
{
	"title": "Book",
	"type": "object",
	"properties": {
		"IDBook": { "type": "integer" },
		"GUIDBook": { "type": "string" },
		"Title": { "type": "string", "maxLength": 255 },
		"Author": { "type": "string", "maxLength": 128 },
		"CreateDate": { "type": "string", "format": "date-time" },
		"CreatingIDUser": { "type": "integer" },
		"UpdateDate": { "type": "string", "format": "date-time" },
		"UpdatingIDUser": { "type": "integer" },
		"Deleted": { "type": "integer" }
	}
}
```

## New (Default Record)

**Request:** `GET /1.0/Book/Schema/New`

**Response:** An empty record with default values populated from the schema:

```json
{
	"IDBook": 0,
	"GUIDBook": "",
	"Title": "",
	"Author": "",
	"CreateDate": "",
	"CreatingIDUser": 0,
	"UpdateDate": "",
	"UpdatingIDUser": 0,
	"Deleted": 0
}
```

## Validate

**Request:** `POST /1.0/Book/Schema/Validate`

```json
{
	"IDBook": 0,
	"Title": "Dune",
	"Author": "Frank Herbert"
}
```

**Response:** The validation result from the Meadow schema's `validateObject()` method. Returns the validation outcome indicating whether the record conforms to the schema constraints.

## Schema Request Lifecycle

```
GET /{v}/{entity}/Schema
  |
  v
[Schema-PreOperation]              <-- authorize, customize
  |
  v
Load JSON Schema from DAL (if not set during PreOperation)
  |
  v
[Schema-PostOperation]             <-- filter properties, add metadata
  |
  v
Send response (JSON Schema)
```

## New Request Lifecycle

```
GET /{v}/{entity}/Schema/New
  |
  v
[New-PreOperation]                  <-- set custom default record
  |
  v
Build default record from schema (if not set during PreOperation)
  |
  v
[New-PostOperation]                 <-- populate computed defaults
  |
  v
Send response (default record)
```

## Validate Request Lifecycle

```
POST /{v}/{entity}/Schema/Validate
  |
  v
[Validate-PreOperation]            <-- add custom validation rules
  |
  v
Validate request body is an object
  |
  v
Run schema validation: DAL.schemaFull.validateObject(record)
  |
  v
[Validate-PostOperation]           <-- augment validation result
  |
  v
Send response (validation result)
```

## Behavior Injection Points

### Schema-PreOperation

Runs before the JSON Schema is loaded. You can set `pRequest.JSONSchema` during this hook to provide a custom schema instead of the default.

```javascript
tmpEndpoints.controller.BehaviorInjection.setBehavior('Schema-PreOperation',
	(pRequest, pRequestState, fCallback) =>
	{
		// Require authentication to view schema
		if (!pRequestState.SessionData.LoggedIn)
		{
			return fCallback({ Code: 401, Message: 'Authentication required' });
		}
		return fCallback();
	});
```

### Schema-PostOperation

Runs after the JSON Schema is loaded onto `pRequestState.JSONSchema`. Use this to modify the schema before it is sent -- for example, to remove internal columns or add UI hints.

```javascript
tmpEndpoints.controller.BehaviorInjection.setBehavior('Schema-PostOperation',
	(pRequest, pRequestState, fCallback) =>
	{
		// Remove internal fields from the public schema
		if (pRequestState.JSONSchema && pRequestState.JSONSchema.properties)
		{
			delete pRequestState.JSONSchema.properties.InternalNotes;
			delete pRequestState.JSONSchema.properties.InternalStatus;
		}

		// Add UI metadata
		if (pRequestState.JSONSchema)
		{
			pRequestState.JSONSchema.uiHints = {
				primaryField: 'Title',
				searchableFields: ['Title', 'Author']
			};
		}

		return fCallback();
	});
```

### New-PreOperation

Runs before the default record is generated. You can set `pRequestState.EmptyEntityRecord` during this hook to provide a custom default object instead of the schema-generated one.

```javascript
tmpEndpoints.controller.BehaviorInjection.setBehavior('New-PreOperation',
	(pRequest, pRequestState, fCallback) =>
	{
		// Provide a custom default record with pre-populated values
		pRequestState.EmptyEntityRecord = {
			IDBook: 0,
			GUIDBook: '',
			Title: '',
			Author: '',
			Status: 'Draft',
			IDCustomer: pRequestState.SessionData.CustomerID,
			CreatingIDUser: pRequestState.SessionData.UserID
		};
		return fCallback();
	});
```

### New-PostOperation

Runs after the default record is generated (or custom default is set). Use this to add computed defaults or session-specific values.

```javascript
tmpEndpoints.controller.BehaviorInjection.setBehavior('New-PostOperation',
	(pRequest, pRequestState, fCallback) =>
	{
		// Set session-specific defaults
		pRequestState.EmptyEntityRecord.IDCustomer =
			pRequestState.SessionData.CustomerID;
		pRequestState.EmptyEntityRecord.CreatingIDUser =
			pRequestState.SessionData.UserID;

		// Add a generated reference number
		pRequestState.EmptyEntityRecord.ReferenceNumber =
			`BK-${Date.now()}`;

		return fCallback();
	});
```

### Validate-PreOperation

Runs before validation is performed. Use this to add custom validation logic or modify the record before schema validation.

```javascript
tmpEndpoints.controller.BehaviorInjection.setBehavior('Validate-PreOperation',
	(pRequest, pRequestState, fCallback) =>
	{
		// Normalize data before validation
		if (pRequest.body && pRequest.body.Title)
		{
			pRequest.body.Title = pRequest.body.Title.trim();
		}
		return fCallback();
	});
```

### Validate-PostOperation

Runs after schema validation completes. The validation result is on `pRequestState.RecordValidation`. Use this to add custom validation rules beyond what the JSON Schema checks.

```javascript
tmpEndpoints.controller.BehaviorInjection.setBehavior('Validate-PostOperation',
	(pRequest, pRequestState, fCallback) =>
	{
		// Add custom business rule validation
		if (pRequestState.Record && !pRequestState.Record.Author)
		{
			// Augment validation result with custom error
			if (!pRequestState.RecordValidation.errors)
			{
				pRequestState.RecordValidation.errors = [];
			}
			pRequestState.RecordValidation.errors.push({
				field: 'Author',
				message: 'Author is required for all books'
			});
		}

		return fCallback();
	});
```

## Complete Hook Example: Protected Schema with Custom Defaults

This example shows all six schema hooks working together to provide a customized, secure schema experience:

```javascript
const tmpEndpoints = new libMeadowEndpoints(tmpBookMeadow);

// Protect schema access
tmpEndpoints.controller.BehaviorInjection.setBehavior('Schema-PreOperation',
	(pRequest, pRequestState, fCallback) =>
	{
		if (!pRequestState.SessionData.LoggedIn)
		{
			return fCallback({ Code: 401, Message: 'Login required' });
		}
		return fCallback();
	});

// Clean up schema for API consumers
tmpEndpoints.controller.BehaviorInjection.setBehavior('Schema-PostOperation',
	(pRequest, pRequestState, fCallback) =>
	{
		// Hide internal tracking fields
		let tmpHiddenFields = ['CreatingIDUser', 'UpdatingIDUser', 'Deleted'];
		tmpHiddenFields.forEach((pField) =>
		{
			if (pRequestState.JSONSchema.properties)
			{
				delete pRequestState.JSONSchema.properties[pField];
			}
		});
		return fCallback();
	});

// Provide smart defaults for new records
tmpEndpoints.controller.BehaviorInjection.setBehavior('New-PostOperation',
	(pRequest, pRequestState, fCallback) =>
	{
		pRequestState.EmptyEntityRecord.IDCustomer =
			pRequestState.SessionData.CustomerID;
		pRequestState.EmptyEntityRecord.Status = 'Draft';
		return fCallback();
	});

// Normalize before validation
tmpEndpoints.controller.BehaviorInjection.setBehavior('Validate-PreOperation',
	(pRequest, pRequestState, fCallback) =>
	{
		if (pRequest.body && typeof(pRequest.body.Title) === 'string')
		{
			pRequest.body.Title = pRequest.body.Title.trim();
		}
		return fCallback();
	});

// Add business rules after schema validation
tmpEndpoints.controller.BehaviorInjection.setBehavior('Validate-PostOperation',
	(pRequest, pRequestState, fCallback) =>
	{
		if (pRequestState.Record)
		{
			if (!pRequestState.Record.Title || pRequestState.Record.Title.length < 1)
			{
				if (!pRequestState.RecordValidation.errors)
				{
					pRequestState.RecordValidation.errors = [];
				}
				pRequestState.RecordValidation.errors.push({
					field: 'Title',
					message: 'Title cannot be empty'
				});
			}
		}
		return fCallback();
	});

tmpEndpoints.connectRoutes(_Fable.Orator.serviceServer);
```

## Use Cases

| Endpoint | Common Use Cases |
|----------|-----------------|
| **Schema** | Form generation, API documentation, client-side validation setup |
| **New** | Pre-populating create forms with defaults, setting tenant-specific values |
| **Validate** | Pre-submit validation, import data verification, API input checking |
