# Create Endpoints

> Insert new records through REST with full lifecycle hooks

The Create endpoints handle single-record and bulk-record creation. Both variants use the same underlying `Meadow-Operation-Create` function, which runs behavior injection hooks around the actual DAL create call.

## Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/{v}/{entity}` | Create a single record |
| POST | `/{v}/{entity}/s` | Bulk create (array of records) |

## Single Create

**Request:** `POST /1.0/Book`

```json
{
	"Title": "Dune",
	"Author": "Frank Herbert"
}
```

**Response:** The complete created record, including auto-generated fields:

```json
{
	"IDBook": 42,
	"GUIDBook": "0x12ab34cd...",
	"Title": "Dune",
	"Author": "Frank Herbert",
	"CreateDate": "2024-01-15T10:30:00.000Z",
	"CreatingIDUser": 1,
	"UpdateDate": "2024-01-15T10:30:00.000Z",
	"UpdatingIDUser": 1,
	"Deleted": 0
}
```

## Bulk Create

**Request:** `POST /1.0/Book/s`

Send an array of records in the request body:

```json
[
	{ "Title": "Dune", "Author": "Frank Herbert" },
	{ "Title": "Neuromancer", "Author": "William Gibson" },
	{ "Title": "Snow Crash", "Author": "Neal Stephenson" }
]
```

**Response:** An array of created records. Each record in the array is processed through the full Create operation lifecycle individually, so all behavior hooks fire for each record.

## Request Lifecycle

The Create operation delegates to `Meadow-Operation-Create`, which runs the following waterfall:

```
POST /{v}/{entity}
  |
  v
Validate request body is an object
  |
  v
Set IDCustomer from session (if schema has IDCustomer)
  |
  v
[Create-PreOperation]              <-- validate, authorize, transform
  |
  v
Build query: addRecord(record), setIDUser(SessionData.UserID)
  |
  v
[Create-QueryConfiguration]        <-- modify query before execution
  |
  v
DAL.doCreate(query)                <-- insert + re-read the new record
  |
  v
[Create-PostOperation]             <-- audit, notify, enrich
  |
  v
Send response (created record)
```

For bulk creates, each record in the array passes through this same lifecycle independently. Errors on individual records do not halt the batch -- the error is attached to that record's response entry.

## Behavior Injection Points

### Create-PreOperation

Runs **before** the query is built. The record to be created is available on `pRequestState.RecordToCreate`. Use this hook for validation, authorization, or to modify the record before it is persisted.

```javascript
tmpEndpoints.controller.BehaviorInjection.setBehavior('Create-PreOperation',
	(pRequest, pRequestState, fCallback) =>
	{
		// Validate required fields
		if (!pRequestState.RecordToCreate.Title)
		{
			return fCallback({ Code: 400, Message: 'Title is required' });
		}

		// Set defaults
		if (!pRequestState.RecordToCreate.Status)
		{
			pRequestState.RecordToCreate.Status = 'Draft';
		}

		return fCallback();
	});
```

### Create-QueryConfiguration

Runs **after** the FoxHound query is configured with the record and user ID, but **before** `DAL.doCreate()` executes. Use this to modify the query object directly.

```javascript
tmpEndpoints.controller.BehaviorInjection.setBehavior('Create-QueryConfiguration',
	(pRequest, pRequestState, fCallback) =>
	{
		// Add extra query configuration
		pRequestState.Query.setLogLevel(5);
		return fCallback();
	});
```

### Create-PostOperation

Runs **after** the record has been created and re-read from the database. The complete record (including auto-generated fields like identity and timestamps) is available on `pRequestState.Record`.

```javascript
tmpEndpoints.controller.BehaviorInjection.setBehavior('Create-PostOperation',
	(pRequest, pRequestState, fCallback) =>
	{
		// Log an audit entry
		let tmpAuditRecord = {
			Action: 'Create',
			EntityType: 'Book',
			EntityID: pRequestState.Record.IDBook,
			UserID: pRequestState.SessionData.UserID
		};
		_Fable.log.info(`Book created: ${JSON.stringify(tmpAuditRecord)}`);
		return fCallback();
	});
```

## Automatic Field Handling

The Create operation automatically handles several fields:

| Field | Behavior |
|-------|----------|
| `IDCustomer` | Set from `SessionData.CustomerID` if the schema includes it and the field is not already set |
| `CreatingIDUser` | Set by the DAL from `Query.IDUser` (which comes from `SessionData.UserID`) |
| `CreateDate` | Set automatically by the DAL |
| `UpdatingIDUser` | Set by the DAL (same as CreatingIDUser on create) |
| `UpdateDate` | Set automatically by the DAL (same as CreateDate on create) |
| `Deleted` | Defaults to `0` |

## Error Handling

Errors returned to `fCallback` in any behavior hook halt the waterfall. The error object should include a `Code` (HTTP status) and `Message`:

```javascript
return fCallback({ Code: 400, Message: 'Validation failed: Title is required' });
```

For bulk creates, individual record errors are captured in the response without stopping the remaining records. Each errored record will include an `Error` property in its response entry.

## Real-World Example: Authorization Check

```javascript
tmpEndpoints.controller.BehaviorInjection.setBehavior('Create-PreOperation',
	(pRequest, pRequestState, fCallback) =>
	{
		// Only managers (role index >= 3) can create books
		if (pRequestState.SessionData.UserRoleIndex < 3)
		{
			return fCallback({
				Code: 403,
				Message: 'Insufficient permissions to create records'
			});
		}

		// Force the customer ID to match the session
		pRequestState.RecordToCreate.IDCustomer = pRequestState.SessionData.CustomerID;

		return fCallback();
	});
```
