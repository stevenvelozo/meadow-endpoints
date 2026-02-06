# Count Endpoints

> Aggregate record counts with filtering

The Count endpoints return the number of records matching given criteria. They support the same filter expressions as the Read endpoints and provide field-specific counting via the CountBy variant.

## Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/{v}/{entity}/s/Count` | Total record count |
| GET | `/{v}/{entity}/s/Count/FilteredTo/:Filter` | Filtered record count |
| GET | `/{v}/{entity}/s/Count/By/:ByField/:ByValue` | Count by field value |

## Count

**Request:** `GET /1.0/Book/s/Count`

**Response:**

```json
{
	"Count": 157
}
```

### Filtered Count

**Request:** `GET /1.0/Book/s/Count/FilteredTo/Author~Herbert`

**Response:**

```json
{
	"Count": 12
}
```

## CountBy

**Request:** `GET /1.0/Book/s/Count/By/Author/Frank Herbert`

**Response:**

```json
{
	"Count": 6
}
```

## Count Request Lifecycle

```
GET /{v}/{entity}/s/Count
  |
  v
Build query, parse filter expression (if FilteredTo)
  |
  v
[Count-QueryConfiguration]          <-- add security filters
  |
  v
DAL.doCount(query)
  |
  v
Send response ({Count: N})
```

## CountBy Request Lifecycle

```
GET /{v}/{entity}/s/Count/By/:ByField/:ByValue
  |
  v
Build query, add field = value filter
  |
  v
[CountBy-QueryConfiguration]        <-- add security filters
  |
  v
DAL.doCount(query)
  |
  v
Send response ({Count: N})
```

## Behavior Injection Points

### Count-QueryConfiguration

Runs after any filter expression is parsed and applied, but before the DAL count executes. Use this to add security filters so counts reflect only the records the user has access to.

```javascript
tmpEndpoints.controller.BehaviorInjection.setBehavior('Count-QueryConfiguration',
	(pRequest, pRequestState, fCallback) =>
	{
		// Multi-tenant security: restrict count to user's customer
		if (pRequestState.SessionData.UserRoleIndex < 5)
		{
			pRequestState.Query.addFilter('IDCustomer',
				pRequestState.SessionData.CustomerID);
		}
		return fCallback();
	});
```

### CountBy-QueryConfiguration

Runs after the field value filter is applied on CountBy requests. Operates the same as `Count-QueryConfiguration` but is specific to the `CountBy` endpoint, allowing different behavior for field-specific counts.

```javascript
tmpEndpoints.controller.BehaviorInjection.setBehavior('CountBy-QueryConfiguration',
	(pRequest, pRequestState, fCallback) =>
	{
		// Add tenant filter for CountBy as well
		pRequestState.Query.addFilter('IDCustomer',
			pRequestState.SessionData.CustomerID);

		// Log which field is being counted
		_Fable.log.info(`CountBy: ${pRequest.params.ByField} = ${pRequest.params.ByValue}`);

		return fCallback();
	});
```

## Filter Expressions

Count supports the same filter syntax as Read endpoints:

```
GET /1.0/Book/s/Count/FilteredTo/Author~Herbert
GET /1.0/Book/s/Count/FilteredTo/PublishYear>2000
GET /1.0/Book/s/Count/FilteredTo/Author~Herbert;PublishYear>2000
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

## Real-World Example: Dashboard Metrics

```javascript
// Set up security filtering for count operations
tmpEndpoints.controller.BehaviorInjection.setBehavior('Count-QueryConfiguration',
	(pRequest, pRequestState, fCallback) =>
	{
		// Non-admin users only see their customer's records
		if (pRequestState.SessionData.UserRoleIndex < 5)
		{
			pRequestState.Query.addFilter('IDCustomer',
				pRequestState.SessionData.CustomerID);
		}
		return fCallback();
	});

// The frontend can then call:
//   GET /1.0/Book/s/Count                          -> total books
//   GET /1.0/Book/s/Count/FilteredTo/Status=Draft  -> draft books
//   GET /1.0/Book/s/Count/By/Author/Frank Herbert  -> books by author
//
// All counts will automatically be filtered by the user's customer ID.
```
