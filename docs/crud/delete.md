# Delete Endpoints

> Soft-delete and restore records with full authorization hooks

The Delete endpoints handle record deletion and undeletion. By default, Meadow uses soft deletes -- setting a `Deleted` column to `1` rather than removing the row. The delete lifecycle includes a pre-read of the target record, providing a checkpoint for authorization before the delete executes.

## Routes

| Method | Route | Description |
|--------|-------|-------------|
| DELETE | `/{v}/{entity}/:IDRecord` | Delete a record by URL parameter |
| DELETE | `/{v}/{entity}` | Delete a record (ID in request body) |
| GET | `/{v}/{entity}/Undelete/:IDRecord` | Undelete a soft-deleted record |

## Delete

**Request:** `DELETE /1.0/Book/42`

Or with the ID in the request body:

```
DELETE /1.0/Book
Content-Type: application/json

{ "IDBook": 42 }
```

**Response:** A count of deleted records:

```json
{
	"Count": 1
}
```

## Undelete

**Request:** `GET /1.0/Book/Undelete/42`

**Response:** A count of undeleted records:

```json
{
	"Count": 1
}
```

The Undelete endpoint verifies that the schema includes a `Deleted` column and that the target record actually has `Deleted = 1` before restoring it.

## Delete Request Lifecycle

```
DELETE /{v}/{entity}/:IDRecord
  |
  v
Extract record ID (from URL param or request body)
Validate ID > 0
  |
  v
Build query with ID filter, set IDUser from session
  |
  v
[Delete-QueryConfiguration]         <-- modify query before record load
  |
  v
DAL.doRead(query)                   <-- load the record for security checks
  |
  v
[Delete-PreOperation]               <-- authorize, validate, prevent
  |
  v
DAL.doDelete(query)                 <-- execute soft-delete
  |
  v
[Delete-PostOperation]              <-- audit, cascade, cleanup
  |
  v
Send response ({Count: N})
```

## Undelete Request Lifecycle

```
GET /{v}/{entity}/Undelete/:IDRecord
  |
  v
Extract record ID, validate ID > 0
  |
  v
Verify schema has a 'Deleted' type column
  |
  v
Build query: filter by ID + Deleted = 1
  |
  v
DAL.doRead(query)                   <-- find the deleted record
  |
  v
[Undelete-PreOperation]             <-- authorize the restore
  |
  v
DAL.doUndelete(query)               <-- set Deleted = 0
  |
  v
[Undelete-PostOperation]            <-- audit, notify
  |
  v
Send response ({Count: N})
```

## Behavior Injection Points

### Delete-QueryConfiguration

Runs after the initial query is built with the record ID filter and user ID, but before the record is loaded from the database. Use this to add additional query constraints.

```javascript
tmpEndpoints.controller.BehaviorInjection.setBehavior('Delete-QueryConfiguration',
	(pRequest, pRequestState, fCallback) =>
	{
		// Add tenant filter to prevent cross-tenant deletes
		pRequestState.Query.addFilter('IDCustomer',
			pRequestState.SessionData.CustomerID);
		return fCallback();
	});
```

### Delete-PreOperation

Runs after the target record is loaded from the database, but before the delete executes. The record is available on `pRequestState.Record`. This is the primary hook for authorization -- you can inspect the record's ownership, status, or relationships before allowing the delete.

```javascript
tmpEndpoints.controller.BehaviorInjection.setBehavior('Delete-PreOperation',
	(pRequest, pRequestState, fCallback) =>
	{
		// Only the record creator or admins can delete
		if (pRequestState.Record.CreatingIDUser !== pRequestState.SessionData.UserID &&
			pRequestState.SessionData.UserRoleIndex < 5)
		{
			return fCallback({
				Code: 403,
				Message: 'Only the record creator or an admin can delete this record'
			});
		}

		// Prevent deletion of published records
		if (pRequestState.Record.Status === 'Published')
		{
			return fCallback({
				Code: 409,
				Message: 'Cannot delete a published record. Unpublish it first.'
			});
		}

		return fCallback();
	});
```

### Delete-PostOperation

Runs after the record has been deleted (soft-delete). Use this for audit logging, cascading deletes to related entities, or sending notifications.

```javascript
tmpEndpoints.controller.BehaviorInjection.setBehavior('Delete-PostOperation',
	(pRequest, pRequestState, fCallback) =>
	{
		// Log the deletion
		_Fable.log.info(`Record ${pRequestState.IDRecord} deleted by user ${pRequestState.SessionData.UserID}`);

		// Cascade soft-delete to child records
		let tmpChildQuery = _ChapterDAL.query;
		tmpChildQuery.addFilter('IDBook', pRequestState.IDRecord);
		_ChapterDAL.doReads(tmpChildQuery,
			(pError, pQuery, pRecords) =>
			{
				if (pRecords && pRecords.length > 0)
				{
					// Soft-delete each child record
					_Fable.log.info(`Cascading delete to ${pRecords.length} chapters`);
				}
				return fCallback();
			});
	});
```

### Undelete-PreOperation

Runs after the deleted record is located (verified to exist with `Deleted = 1`), before the undelete executes. The record is available on `pRequestState.Record`.

```javascript
tmpEndpoints.controller.BehaviorInjection.setBehavior('Undelete-PreOperation',
	(pRequest, pRequestState, fCallback) =>
	{
		// Only admins can undelete
		if (pRequestState.SessionData.UserRoleIndex < 5)
		{
			return fCallback({
				Code: 403,
				Message: 'Only administrators can restore deleted records'
			});
		}
		return fCallback();
	});
```

### Undelete-PostOperation

Runs after the record has been restored. Use this for audit logging or re-enabling related records.

```javascript
tmpEndpoints.controller.BehaviorInjection.setBehavior('Undelete-PostOperation',
	(pRequest, pRequestState, fCallback) =>
	{
		_Fable.log.info(`Record ${pRequest.params.IDRecord} undeleted by user ${pRequestState.SessionData.UserID}`);
		return fCallback();
	});
```

## Soft Delete vs Hard Delete

Meadow's delete is always a soft delete -- it sets the `Deleted` column to `1`. This means:

- **Deleted records are excluded from normal reads** -- the DAL automatically filters `Deleted = 0` on Read and Reads operations
- **Deleted records can be restored** via the Undelete endpoint
- **No data is permanently lost** through the standard API

If your schema does not include a `Deleted` column, the Undelete endpoint will return a `500` error with the message "No undelete bit on record."

## Record ID Resolution

The Delete endpoint accepts the record ID from two sources, checked in order:

1. **URL parameter:** `DELETE /1.0/Book/42` -- `pRequest.params.IDRecord`
2. **Request body (number):** `{ "IDBook": 42 }` -- `pRequest.body[defaultIdentifier]`
3. **Request body (string):** `{ "IDBook": "42" }` -- string-to-number conversion

If no valid ID is found (ID < 1), the endpoint returns a `500` error.
