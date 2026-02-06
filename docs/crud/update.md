# Update Endpoints

> Modify existing records with automatic conflict detection

The Update endpoints handle single-record updates, bulk updates, upserts (insert-or-update), and bulk upserts. The Update operation reads the existing record before writing, providing a checkpoint for authorization.

## Routes

| Method | Route | Description |
|--------|-------|-------------|
| PUT | `/{v}/{entity}` | Update a single record |
| PUT | `/{v}/{entity}/s` | Bulk update (array of records) |
| PUT | `/{v}/{entity}/Upsert` | Insert or update a record |
| PUT | `/{v}/{entity}/Upserts` | Bulk upsert (array of records) |

## Single Update

**Request:** `PUT /1.0/Book`

The request body must include the record's default identifier (e.g., `IDBook`):

```json
{
	"IDBook": 42,
	"Title": "Dune (Revised Edition)",
	"Author": "Frank Herbert"
}
```

**Response:** The complete updated record, re-read from the database:

```json
{
	"IDBook": 42,
	"GUIDBook": "0x12ab34cd...",
	"Title": "Dune (Revised Edition)",
	"Author": "Frank Herbert",
	"CreateDate": "2024-01-15T10:30:00.000Z",
	"CreatingIDUser": 1,
	"UpdateDate": "2024-03-20T14:15:00.000Z",
	"UpdatingIDUser": 1,
	"Deleted": 0
}
```

## Bulk Update

**Request:** `PUT /1.0/Book/s`

Send an array of records, each including its identifier:

```json
[
	{ "IDBook": 42, "Title": "Dune (Revised Edition)" },
	{ "IDBook": 43, "Title": "Neuromancer (2nd Edition)" }
]
```

**Response:** An array of updated records. Each record passes through the full Update lifecycle individually.

## Upsert

**Request:** `PUT /1.0/Book/Upsert`

If the record has a valid identifier and that record exists, it is updated. Otherwise, it is created:

```json
{
	"IDBook": 0,
	"Title": "New Book",
	"Author": "New Author"
}
```

The Upsert endpoint first attempts a read. If the record is not found, it falls through to the Create operation. If found, it performs an Update.

## Bulk Upsert

**Request:** `PUT /1.0/Book/Upserts`

An array of records to upsert:

```json
[
	{ "IDBook": 42, "Title": "Updated Title" },
	{ "IDBook": 0, "Title": "Brand New Book", "Author": "New Author" }
]
```

## Request Lifecycle

The Update operation delegates to `Meadow-Operation-Update`, which runs the following waterfall:

```
PUT /{v}/{entity}
  |
  v
Validate request body is an object
Validate record has a valid ID (> 0)
  |
  v
Read existing record (DAL.doRead)   <-- loads current state for security checks
  |
  v
Build update query: addRecord(record), setIDUser(SessionData.UserID)
  |
  v
DAL.doUpdate(query)                 <-- execute update + re-read
  |
  v
[Update-PostOperation]              <-- audit, notify, transform
  |
  v
Send response (updated record)
```

## Behavior Injection Points

### Update-PostOperation

The Update operation has **only a post-operation hook** -- there is no pre-operation or query-configuration injection point. The existing record is loaded and used for the update automatically.

The hook runs after the record has been updated and re-read from the database. The updated record is available on `pRequestState.Record`.

```javascript
tmpEndpoints.controller.BehaviorInjection.setBehavior('Update-PostOperation',
	(pRequest, pRequestState, fCallback) =>
	{
		// Audit the update
		let tmpAuditRecord = {
			Action: 'Update',
			EntityType: 'Book',
			EntityID: pRequestState.Record.IDBook,
			UserID: pRequestState.SessionData.UserID
		};
		_Fable.log.info(`Book updated: ${JSON.stringify(tmpAuditRecord)}`);
		return fCallback();
	});
```

### Why No Pre-Operation Hook?

The Update operation reads the existing record before performing the update as an inherent part of its workflow. The original record is accessible via `pRequestState.OriginalRecord` (when using cached records) or loaded via `DAL.doRead()`. Authorization checks that need the original record state can use the `Update-PostOperation` hook to compare the original and updated records, or use a custom endpoint for more complex scenarios.

## Automatic Field Handling

| Field | Behavior |
|-------|----------|
| `UpdateDate` | Set automatically by the DAL on every update |
| `UpdatingIDUser` | Set from `Query.IDUser` (from `SessionData.UserID`) |
| `CreateDate` | Preserved from original record |
| `CreatingIDUser` | Preserved from original record |

## Error Handling

The Update endpoint validates two conditions before attempting the update:

1. **Request body must be an object** - Returns `400` if not
2. **Record ID must be valid (> 0)** - Returns `400` if missing or invalid

If the existing record is not found during the pre-update read, a `404` error is returned.

For bulk updates, individual record errors are captured per-record without halting the batch:

```json
[
	{ "IDBook": 42, "Title": "Updated Successfully", ... },
	{ "IDBook": 999, "Error": { "Code": 404, "Message": "Record not Found" } }
]
```

## Real-World Example: Computed Field Update

```javascript
tmpEndpoints.controller.BehaviorInjection.setBehavior('Update-PostOperation',
	(pRequest, pRequestState, fCallback) =>
	{
		// After updating an order line item, recalculate the order total
		if (pRequestState.Record.IDOrder)
		{
			let tmpQuery = _OrderDAL.query;
			tmpQuery.addFilter('IDOrder', pRequestState.Record.IDOrder);

			_OrderLineDAL.doReads(tmpQuery,
				(pError, pQuery, pRecords) =>
				{
					if (pError) return fCallback();

					let tmpTotal = pRecords.reduce(
						(pSum, pLine) => pSum + (pLine.Quantity * pLine.UnitPrice), 0);

					let tmpUpdateQuery = _OrderDAL.query;
					tmpUpdateQuery.addRecord({ IDOrder: pRequestState.Record.IDOrder, Total: tmpTotal });
					_OrderDAL.doUpdate(tmpUpdateQuery,
						(pError) => fCallback());
				});
		}
		else
		{
			return fCallback();
		}
	});
```
