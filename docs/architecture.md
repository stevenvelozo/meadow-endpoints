# Architecture

This document describes how Meadow Endpoints turns a single Meadow entity into a full suite of RESTful routes, the request lifecycle each route follows, the behavior-injection hook points that make that lifecycle customizable, and where the module sits in the Retold stack.

## Where It Sits in the Stack

Meadow Endpoints is the Layer-3 keystone of the data tier. It binds a Meadow data access layer (the data broker below it) to an Orator service server (the API host above it), registering one HTTP route per generated endpoint.

<!-- bespoke diagram: edit diagrams/where-it-sits-in-the-stack.mmd or .hints.json, then: npx pict-renderer-graph build modules/meadow/meadow-endpoints/docs -->
![Where It Sits in the Stack](diagrams/where-it-sits-in-the-stack.svg)

Orator hosts the routes and supplies the HTTP request and response objects. Meadow Endpoints owns the request lifecycle through its controller. Meadow executes the data operation against whichever database provider is configured. Fable underpins all of it, supplying configuration, logging, and the async utilities the controller uses.

## How Routes Are Generated

A `MeadowEndpoints` instance is constructed from a configured Meadow DAL. The DAL scope (for example `Book`) and the configured version (default `1.0`) form the route prefix `/{version}/{entity}` -- so `Book` becomes `/1.0/Book`.

<!-- bespoke diagram: edit diagrams/how-routes-are-generated.mmd or .hints.json, then: npx pict-renderer-graph build modules/meadow/meadow-endpoints/docs -->
![How Routes Are Generated](diagrams/how-routes-are-generated.svg)

Calling `connectRoutes(_Orator.serviceServer)` walks the enabled behavior sets and registers every route through the internal `connectRoute()` helper, which binds each endpoint handler to the controller instance. Endpoints are grouped into behavior sets -- `Create`, `Read`, `Reads`, `Update`, `Delete`, `Count`, `Schema`, `Validate`, and `New` -- and any set can be turned off before `connectRoutes()` is called so its routes are never registered.

Route ordering matters: the `Schema`, `Schema/New`, and `Schema/Validate` routes are registered before the `/:IDRecord` read route so the literal `Schema` path is not captured as a record identifier. For the same reason, the literal `Upsert` and `Upserts` PUT routes are registered before the by-id `PUT /:IDRecord` route. For the full generated route table, see [Generated Routes](generated-routes.md) and the [CRUD Deep Dive](crud/README.md).

## Request Lifecycle

Every generated endpoint runs the same async waterfall. Each stage either advances to the next or short-circuits to the shared error handler. Behavior-injection hooks are interleaved between the built-in stages, so custom logic runs at well-defined points without replacing any built-in step.

<!-- bespoke diagram: edit diagrams/request-lifecycle.mmd or .hints.json, then: npx pict-renderer-graph build modules/meadow/meadow-endpoints/docs -->
![Request Lifecycle](diagrams/request-lifecycle.svg)

Not every endpoint exposes all three hook phases. A single-record read, for example, runs `Read-PreOperation`, then `Read-QueryConfiguration`, then `Read-PostOperation`; a multi-record read runs `Reads-QueryConfiguration` and `Reads-PostOperation`. See [Behavior Injection](behavior-injection.md) for the complete hook matrix.

### Request State

`initializeRequestState()` creates the `pRequestState` object that travels through the waterfall. It carries the operation verb and the marshalled `SessionData`, and each stage attaches what it produces -- `Query`, then `Record` or `Records`, then `Result` for counts, and so on. The hook functions receive this object as their second argument and read or mutate it in place.

### Session Marshalling

Before any hook runs, the session marshaler populates `pRequestState.SessionData` from a configurable source, selected with `MeadowEndpointsSessionDataSource`:

| Source | Origin |
|--------|--------|
| `Request` (default) | `pRequest.UserSession`, set by Orator session middleware |
| `Header` | JSON parsed from the `x-trusted-session` HTTP header |
| `None` | The default session object only |

The marshaler always starts from the `MeadowEndpointsDefaultSessionObject` template and extends it with the resolved source, guaranteeing every operation sees a complete session shape (`UserID`, `CustomerID`, `SessionID`, `UserRole`, `UserRoleIndex`, `LoggedIn`). See [Session Management](session-management.md) for details.

## Behavior-Injection Hook Points

Behavior injection is the primary extension mechanism: it lets you hook the lifecycle of any endpoint without subclassing or replacing the built-in handler. Hooks are registered by name on the controller's `BehaviorInjection` component, and each name follows the pattern `{Verb}-{Phase}`.

<!-- bespoke diagram: edit diagrams/behavior-injection-hook-points.mmd or .hints.json, then: npx pict-renderer-graph build modules/meadow/meadow-endpoints/docs -->
![Behavior-Injection Hook Points](diagrams/behavior-injection-hook-points.svg)

A registered hook receives `(pRequest, pRequestState, fCallback)`. Call `fCallback()` with no argument to continue the waterfall, or call it with an error to halt and route to the error handler. Because the hook is invoked with the controller as its `this`, register hooks as standard functions rather than arrow functions when you need that scope.

```javascript
const tmpEndpoints = new libMeadowEndpoints(tmpMeadow);

// Scope every multi-record read to the caller's customer
tmpEndpoints.controller.BehaviorInjection.setBehavior('Reads-QueryConfiguration',
	function (pRequest, pRequestState, fCallback)
	{
		if (pRequestState.SessionData.UserRoleIndex < 5)
		{
			pRequestState.Query.addFilter('IDCustomer', pRequestState.SessionData.CustomerID);
		}
		return fCallback();
	});
```

The hook phases map onto the operations as follows:

| Phase | Runs |
|-------|------|
| `{Verb}-PreOperation` | Before the query is built -- ideal for authentication, authorization, and input validation |
| `{Verb}-QueryConfiguration` | After the query is built but before it executes -- ideal for adding tenant or role filters |
| `{Verb}-PostOperation` | After the data operation completes -- ideal for transforming results, auditing, or notifications |

The available verbs are `Create`, `Read`, `Reads`, `Update`, `Delete`, `Undelete`, `Count`, `CountBy`, `Schema`, `New`, and `Validate`. The exact set of phases each verb exposes is listed in the [Behavior Injection](behavior-injection.md) hook matrix and the [CRUD Deep Dive](crud/README.md).

## Controller Architecture

The controller owns the request lifecycle and is composed of replaceable components. The default `BaseController` wires up sensible defaults for each:

| Component | Responsibility |
|-----------|----------------|
| Behavior Injection | Stores and runs the named `{Verb}-{Phase}` hooks |
| Session Marshaler | Resolves `SessionData` from the configured source |
| Error Handler | Formats errors and optionally sets HTTP status codes |
| Log Controller | Emits structured request logging through Fable |
| Filter Parser | Parses `FilteredTo` URL expressions into query filters |

For deep customization, supply your own controller through the constructor options -- either an instantiated `ControllerInstance` or a `ControllerClass` extending the exported `BaseController`. See [Custom Controllers](custom-controllers.md).

```javascript
const libMeadowEndpoints = require('meadow-endpoints');
const BaseController = libMeadowEndpoints.BaseController;

class CustomController extends BaseController
{
	constructor(pMeadowEndpoints, pControllerOptions)
	{
		super(pMeadowEndpoints, pControllerOptions);
	}
}

const tmpEndpoints = new libMeadowEndpoints(tmpMeadow,
	{ ControllerClass: CustomController });
```

## Related Modules

- [meadow](https://fable-retold.github.io/meadow/) -- the data access layer Meadow Endpoints generates routes from
- [orator](https://fable-retold.github.io/orator/) -- the API server that hosts the generated routes
- [retold-data-service](https://fable-retold.github.io/retold-data-service/) -- assembles Meadow Endpoints into a complete, schema-driven REST service
- [pict-section-recordset](https://fable-retold.github.io/pict-section-recordset/) -- browser-side UI that consumes these CRUD endpoints
