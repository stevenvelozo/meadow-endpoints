# Read Endpoints

> Retrieve records with pagination, filtering, and projections

The Read endpoint group is the largest in Meadow Endpoints, covering single-record reads, paginated lists, filtered queries, select lists for dropdowns, lite projections, and distinct value queries. All list-based endpoints share the `Reads-QueryConfiguration` behavior injection point.

## Routes

### Single Record

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/{v}/{entity}/:IDRecord` | Read a record by its integer ID |
| GET | `/{v}/{entity}/By/:GUIDRecord` | Read a record by its GUID |

### Record Lists

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/{v}/{entity}/s` | Read records (default cap: 250) |
| GET | `/{v}/{entity}/s/:Begin/:Cap` | Read with pagination |
| GET | `/{v}/{entity}/s/FilteredTo/:Filter` | Read with filter expression |
| GET | `/{v}/{entity}/s/FilteredTo/:Filter/:Begin/:Cap` | Filtered read with pagination |
| GET | `/{v}/{entity}/s/By/:ByField/:ByValue` | Read by exact field match |
| GET | `/{v}/{entity}/s/By/:ByField/:ByValue/:Begin/:Cap` | Field match with pagination |

### Aggregation

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/{v}/{entity}/Max/:ColumnName` | Maximum value for a column |

### Specialized Projections

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/{v}/{entity}/Select` | Select list ({Hash, Value} pairs) |
| GET | `/{v}/{entity}/Select/:Begin/:Cap` | Paginated select list |
| GET | `/{v}/{entity}/Select/FilteredTo/:Filter` | Filtered select list |
| GET | `/{v}/{entity}/Select/FilteredTo/:Filter/:Begin/:Cap` | Filtered paginated select list |
| GET | `/{v}/{entity}/s/Lite` | Lite list (ID + GUID + name only) |
| GET | `/{v}/{entity}/s/Lite/:Begin/:Cap` | Paginated lite list |
| GET | `/{v}/{entity}/s/LiteExtended/:ExtraColumns` | Lite list with extra columns |
| GET | `/{v}/{entity}/s/Distinct/:Columns` | Distinct values for columns |
| GET | `/{v}/{entity}/s/Distinct/:Columns/:Begin/:Cap` | Paginated distinct list |
| GET | `/{v}/{entity}/s/Distinct/:Columns/FilteredTo/:Filter` | Filtered distinct list |

## Single Read

**Request:** `GET /1.0/Book/42`

**Response:** A single record object:

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

### Single Read Lifecycle

```
GET /{v}/{entity}/:IDRecord
  |
  v
Initialize Query
  |
  v
[Read-PreOperation]                <-- authorize, modify criteria
  |
  v
Apply filter: IDRecord or GUIDRecord
  |
  v
[Read-QueryConfiguration]          <-- add extra filters, joins
  |
  v
DAL.doRead(query)
  |
  v
[Read-PostOperation]               <-- transform, redact fields
  |
  v
Send response (single record)
```

## Record List (Reads)

**Request:** `GET /1.0/Book/s/0/25`

**Response:** A newline-delimited JSON stream of records. Each record is a complete JSON object separated by newlines. This streaming approach efficiently handles large recordsets.

### Reads Lifecycle

```
GET /{v}/{entity}/s/:Begin/:Cap
  |
  v
Build query with pagination (Begin, Cap)
Parse filter expression (if FilteredTo)
  |
  v
[Reads-QueryConfiguration]         <-- add security filters, modify query
  |
  v
DAL.doReads(query)
  |
  v
[Reads-PostOperation]              <-- transform recordset, aggregate
  |
  v
Stream response (newline-delimited JSON)
```

## Pagination

All list endpoints support pagination via `Begin` and `Cap` URL parameters:

- **Begin** - Zero-based starting index (skip this many records)
- **Cap** - Maximum number of records to return

If no `Cap` is provided, the default is `250` (configurable via `MeadowDefaultMaxCap` in Fable settings).

```
GET /1.0/Book/s           -> records 0-249 (default)
GET /1.0/Book/s/0/10      -> first 10 records
GET /1.0/Book/s/10/10     -> records 10-19
GET /1.0/Book/s/100/50    -> records 100-149
```

## Filter Expressions

The `FilteredTo` parameter accepts filter expressions parsed by meadow-filter:

```
GET /1.0/Book/s/FilteredTo/Author~Herbert
GET /1.0/Book/s/FilteredTo/Title=Dune
GET /1.0/Book/s/FilteredTo/IDBook>10
```

| Operator | Meaning |
|----------|---------|
| `=` | Equals |
| `!=` | Not equals |
| `>` | Greater than |
| `<` | Less than |
| `>=` | Greater than or equal |
| `<=` | Less than or equal |
| `~` | Contains (LIKE) |

Multiple filters can be combined with semicolons:

```
GET /1.0/Book/s/FilteredTo/Author~Herbert;Title~Dune
```

## ReadsBy

The `ReadsBy` endpoint filters by an exact field match:

```
GET /1.0/Book/s/By/Author/Frank Herbert
GET /1.0/Book/s/By/Author/Frank Herbert/0/10
```

When the `ByValue` parameter is an array (passed via query string), it generates an `IN` filter:

```
GET /1.0/Book/s/By/IDBook/[1,2,3]
```

## ReadMax

Returns the maximum value for a given column:

```
GET /1.0/Book/Max/IDBook
```

## Select List

Returns `{Hash, Value}` pairs suitable for populating dropdowns. The `Hash` is the record's default identifier, and the `Value` is generated from a template:

```
GET /1.0/Book/Select
```

**Response:**

```json
[
	{ "Hash": 1, "Value": "Book #1" },
	{ "Hash": 2, "Value": "Book #2" }
]
```

The `Value` template defaults to `{Entity} #{ID}` but can be customized via `BehaviorInjection.processTemplate('SelectList', ...)`.

## Lite List

Returns only the identity columns (ID, GUID, and name/label columns) for a compact response:

```
GET /1.0/Book/s/Lite
GET /1.0/Book/s/Lite/0/50
```

### Extended Lite List

Include additional columns by name:

```
GET /1.0/Book/s/LiteExtended/Author,PublishYear
```

## Distinct List

Returns distinct values for the specified columns:

```
GET /1.0/Book/s/Distinct/Author
GET /1.0/Book/s/Distinct/Author,Publisher/0/100
GET /1.0/Book/s/Distinct/Author/FilteredTo/PublishYear>2000
```

## Behavior Injection Points

### Read-PreOperation

Runs before filter criteria are applied on single-record reads. The query object is initialized but no filters are set yet.

```javascript
tmpEndpoints.controller.BehaviorInjection.setBehavior('Read-PreOperation',
	(pRequest, pRequestState, fCallback) =>
	{
		// Check if user is authenticated
		if (!pRequestState.SessionData.LoggedIn)
		{
			return fCallback({ Code: 401, Message: 'Authentication required' });
		}
		return fCallback();
	});
```

### Read-QueryConfiguration

Runs after the ID/GUID filter is applied on single-record reads. Use this to add security filters or additional query constraints.

```javascript
tmpEndpoints.controller.BehaviorInjection.setBehavior('Read-QueryConfiguration',
	(pRequest, pRequestState, fCallback) =>
	{
		// Restrict reads to user's own customer
		pRequestState.Query.addFilter('IDCustomer',
			pRequestState.SessionData.CustomerID);
		return fCallback();
	});
```

### Read-PostOperation

Runs after the record is retrieved from the database. Use this to transform the result, redact sensitive fields, or load related data.

```javascript
tmpEndpoints.controller.BehaviorInjection.setBehavior('Read-PostOperation',
	(pRequest, pRequestState, fCallback) =>
	{
		// Redact sensitive information
		delete pRequestState.Record.InternalNotes;

		// Add computed fields
		pRequestState.Record.DisplayName =
			`${pRequestState.Record.Title} by ${pRequestState.Record.Author}`;

		return fCallback();
	});
```

### Reads-QueryConfiguration

Shared across all list-based read endpoints: Reads, ReadsBy, ReadSelectList, ReadLiteList, ReadDistinctList, and ReadMax. Runs after pagination and filter expressions are applied, before the DAL call.

```javascript
tmpEndpoints.controller.BehaviorInjection.setBehavior('Reads-QueryConfiguration',
	(pRequest, pRequestState, fCallback) =>
	{
		// Multi-tenant security: always filter by customer
		if (pRequestState.SessionData.UserRoleIndex < 5)
		{
			pRequestState.Query.addFilter('IDCustomer',
				pRequestState.SessionData.CustomerID);
		}
		return fCallback();
	});
```

### Reads-PostOperation

Runs after the recordset is retrieved on Reads and ReadsBy endpoints. Use this to transform the array of records before they are streamed to the client.

```javascript
tmpEndpoints.controller.BehaviorInjection.setBehavior('Reads-PostOperation',
	(pRequest, pRequestState, fCallback) =>
	{
		// Strip internal fields from all records
		for (let i = 0; i < pRequestState.Records.length; i++)
		{
			delete pRequestState.Records[i].InternalNotes;
		}
		return fCallback();
	});
```

## Streaming Responses

All list endpoints use `doStreamRecordArray()` to send records as newline-delimited JSON. This approach avoids buffering large result sets in memory and allows the client to begin processing records before the full response is complete.
