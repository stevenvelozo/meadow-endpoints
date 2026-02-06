# CRUD Endpoints

> Complete REST API lifecycle from a single entity definition

Meadow Endpoints generates a full suite of RESTful routes from a configured Meadow entity. Every endpoint follows the same async waterfall pattern with behavior injection hooks, making the entire request lifecycle customizable without replacing any built-in logic.

## Endpoint Groups

| Group | Operations | Description |
|-------|-----------|-------------|
| [Create](crud/create.md) | Create, BulkCreate | Insert new records |
| [Read](crud/read.md) | Read, Reads, ReadsBy, ReadMax, ReadSelectList, ReadLiteList, ReadDistinctList | Retrieve records with pagination, filtering, and projections |
| [Update](crud/update.md) | Update, BulkUpdate, Upsert, BulkUpsert | Modify existing records |
| [Delete](crud/delete.md) | Delete, Undelete | Soft-delete and restore records |
| [Count](crud/count.md) | Count, CountBy | Aggregate record counts |
| [Schema](crud/schema.md) | Schema, New, Validate | Serve schema metadata, default objects, and validation |

## Complete Route Table

All routes are prefixed with `/{version}/{entity}`, where `version` defaults to `1.0` and `entity` is the Meadow DAL scope (e.g., `Book`).

### Create

| Method | Route | Handler |
|--------|-------|---------|
| POST | `/{v}/{entity}` | Create a single record |
| POST | `/{v}/{entity}/s` | Bulk create (array of records) |

### Read

| Method | Route | Handler |
|--------|-------|---------|
| GET | `/{v}/{entity}/:IDRecord` | Read one record by ID |
| GET | `/{v}/{entity}/By/:GUIDRecord` | Read one record by GUID |
| GET | `/{v}/{entity}/s` | Read list (default cap: 250) |
| GET | `/{v}/{entity}/s/:Begin/:Cap` | Read list with pagination |
| GET | `/{v}/{entity}/s/FilteredTo/:Filter` | Read list with filter |
| GET | `/{v}/{entity}/s/FilteredTo/:Filter/:Begin/:Cap` | Filtered read with pagination |
| GET | `/{v}/{entity}/s/By/:ByField/:ByValue` | Read by field value |
| GET | `/{v}/{entity}/s/By/:ByField/:ByValue/:Begin/:Cap` | Read by field with pagination |
| GET | `/{v}/{entity}/Max/:ColumnName` | Maximum value for a column |

### Specialized Read

| Method | Route | Handler |
|--------|-------|---------|
| GET | `/{v}/{entity}/Select` | Select list ({Hash, Value} pairs) |
| GET | `/{v}/{entity}/Select/:Begin/:Cap` | Paginated select list |
| GET | `/{v}/{entity}/Select/FilteredTo/:Filter` | Filtered select list |
| GET | `/{v}/{entity}/Select/FilteredTo/:Filter/:Begin/:Cap` | Filtered paginated select list |
| GET | `/{v}/{entity}/s/Lite` | Lite list (minimal columns) |
| GET | `/{v}/{entity}/s/Lite/:Begin/:Cap` | Paginated lite list |
| GET | `/{v}/{entity}/s/LiteExtended/:ExtraColumns` | Lite list with extra columns |
| GET | `/{v}/{entity}/s/Distinct/:Columns` | Distinct values for columns |
| GET | `/{v}/{entity}/s/Distinct/:Columns/:Begin/:Cap` | Paginated distinct list |
| GET | `/{v}/{entity}/s/Distinct/:Columns/FilteredTo/:Filter` | Filtered distinct list |

### Update

| Method | Route | Handler |
|--------|-------|---------|
| PUT | `/{v}/{entity}` | Update a single record |
| PUT | `/{v}/{entity}/s` | Bulk update (array of records) |
| PUT | `/{v}/{entity}/Upsert` | Insert or update a record |
| PUT | `/{v}/{entity}/Upserts` | Bulk upsert (array of records) |

### Delete

| Method | Route | Handler |
|--------|-------|---------|
| DELETE | `/{v}/{entity}/:IDRecord` | Delete a record by URL param |
| DELETE | `/{v}/{entity}` | Delete a record (ID in body) |
| GET | `/{v}/{entity}/Undelete/:IDRecord` | Undelete a soft-deleted record |

### Count

| Method | Route | Handler |
|--------|-------|---------|
| GET | `/{v}/{entity}/s/Count` | Total record count |
| GET | `/{v}/{entity}/s/Count/FilteredTo/:Filter` | Filtered count |
| GET | `/{v}/{entity}/s/Count/By/:ByField/:ByValue` | Count by field value |

### Schema

| Method | Route | Handler |
|--------|-------|---------|
| GET | `/{v}/{entity}/Schema` | Return JSON Schema |
| GET | `/{v}/{entity}/Schema/New` | Return empty default record |
| POST | `/{v}/{entity}/Schema/Validate` | Validate a record against schema |

## Request Lifecycle

Every endpoint follows the same async waterfall pattern:

```
HTTP Request
  |
  v
initializeRequestState(pRequest, 'OperationName')
  |
  v
[Pre-Operation Behavior Injection]     <-- authenticate, authorize, validate
  |
  v
Build/Configure Query
  |
  v
[Query-Configuration Behavior Injection]  <-- modify query, add filters
  |
  v
Execute DAL Operation (doCreate, doRead, doReads, etc.)
  |
  v
[Post-Operation Behavior Injection]    <-- transform results, audit, notify
  |
  v
Send Response
  |
  v
ErrorHandler.handleErrorIfSet()        <-- catch any errors from waterfall
```

Not every endpoint has all three injection points. See the individual endpoint documentation for the specific hooks available.

## Behavior Injection Summary

| Injection Point | Available On | Phase |
|-----------------|-------------|-------|
| `Create-PreOperation` | Create, BulkCreate | Before create query is built |
| `Create-QueryConfiguration` | Create, BulkCreate | After query is built, before execution |
| `Create-PostOperation` | Create, BulkCreate | After record is created and re-read |
| `Read-PreOperation` | Read | Before filter criteria are applied |
| `Read-QueryConfiguration` | Read | After filter criteria, before DAL call |
| `Read-PostOperation` | Read | After record is retrieved |
| `Reads-QueryConfiguration` | Reads, ReadsBy, ReadSelectList, ReadLiteList, ReadDistinctList, ReadMax | After pagination/filter, before DAL call |
| `Reads-PostOperation` | Reads, ReadsBy | After recordset is retrieved |
| `Update-PostOperation` | Update, BulkUpdate | After record is updated and re-read |
| `Delete-QueryConfiguration` | Delete | After delete query filter is built |
| `Delete-PreOperation` | Delete | After record is loaded, before delete |
| `Delete-PostOperation` | Delete | After record is deleted |
| `Undelete-PreOperation` | Undelete | After deleted record is loaded |
| `Undelete-PostOperation` | Undelete | After record is undeleted |
| `Count-QueryConfiguration` | Count | After filter is parsed |
| `CountBy-QueryConfiguration` | CountBy | After field filter is applied |
| `Schema-PreOperation` | Schema | Before schema is loaded |
| `Schema-PostOperation` | Schema | After schema is loaded |
| `New-PreOperation` | New | Before default object is built |
| `New-PostOperation` | New | After default object is built |
| `Validate-PreOperation` | Validate | Before validation runs |
| `Validate-PostOperation` | Validate | After validation completes |

## Registering Behaviors

```javascript
const tmpEndpoints = new libMeadowEndpoints(tmpMeadow);

tmpEndpoints.controller.BehaviorInjection.setBehavior('Create-PreOperation',
	(pRequest, pRequestState, fCallback) =>
	{
		// pRequest     - the HTTP request object (params, body, headers)
		// pRequestState - endpoint state (Query, Record, SessionData, etc.)
		// fCallback    - call with no args to continue, or with error to halt

		if (!pRequest.body.Title)
		{
			return fCallback({ Code: 400, Message: 'Title is required' });
		}
		return fCallback();
	});
```

## Request State Object

The `pRequestState` object is initialized by `initializeRequestState()` and carries state through the waterfall. Key properties:

| Property | Type | Description |
|----------|------|-------------|
| `SessionData` | object | Session data (UserID, CustomerID, UserRole, etc.) |
| `Query` | object | FoxHound query object for the current operation |
| `Record` | object | The current record (after read/create/update) |
| `Records` | array | Record array (for Reads operations) |
| `Result` | object | Result object (for Count: `{Count: N}`) |
| `RecordCount` | object | Delete result: `{Count: N}` |
| `JSONSchema` | object | Schema object (for Schema endpoint) |
| `EmptyEntityRecord` | object | Default record (for New endpoint) |
| `RecordValidation` | object | Validation result (for Validate endpoint) |
| `RecordToCreate` | object | Record being created (in Create operation) |
| `RecordToModify` | object | Record being updated (in Update operation) |

## Disabling Endpoint Groups

You can selectively disable any endpoint group before connecting routes:

```javascript
const tmpEndpoints = new libMeadowEndpoints(tmpMeadow);

// Disable specific operations
tmpEndpoints._EnabledBehaviorSets.Update = false;
tmpEndpoints._EnabledBehaviorSets.Delete = false;

// Connect only the remaining routes
tmpEndpoints.connectRoutes(serviceServer);
```

Available behavior sets: `Create`, `Read`, `Update`, `Delete`, `Count`, `Schema`.

## Session Data

Every endpoint has access to session data through `pRequestState.SessionData`:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `UserID` | number | `0` | Authenticated user ID |
| `CustomerID` | number | `0` | Customer/tenant ID |
| `SessionID` | string | `""` | Session identifier |
| `UserRole` | string | `"User"` | Role name |
| `UserRoleIndex` | number | `0` | Numeric role level |
| `LoggedIn` | boolean | `false` | Authentication status |

Session data is populated by the session marshaler before any behavior injection runs. Configure the source via `MeadowEndpointsSessionDataSource` (`Request`, `Header`, or `None`).
