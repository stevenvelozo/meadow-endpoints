class MeadowEndpointsControllerBehaviorInjectionBase
{
	constructor(pMeadowEndpoints, pControllerOptions)
	{
		// Application Services
		this._Settings = false;
		this._LogController = false;

        this.DAL = pMeadowEndpoints.DAL;

		this.template = this.DAL.fable.Utility.template;

		// An object to hold modifications to specific behaviors.
		this._BehaviorFunctions = {};

		// A set of objects to hold the specific templates and their compiled functions
		this._Templates = {};
		this._TemplateFunctions = {};
    }

	/**
	* Set a specific behavior.
	*
	* The anatomy of a behavior function is as follows:
	*
	* var someBehavior = function(pRequest, fComplete)
	* {
	*      // Do some stuff with pRequest...
	*      if (pRequest.UserSession.UserRoleIndex < 5)
	*          pRequest.Query.addFilter('Customer', pRequest.UserSession.IDCustomer);
	*      return fComplete(false);
	* }
	*
	* It is important to note that the fComplete function expects false if no error, or a string message if there is one.
	*/
	setBehavior(pBehaviorHash, fBehavior)
	{
		this._BehaviorFunctions[pBehaviorHash] = fBehavior;
	}

	/**
	* This method runs a behavior at a specific hash, and returns true.
	* Or it returns false if there was no behavior there.
	* Behaviors should expect their state to be in the pRequest object, per the example in setBehavior
	*/
	runBehavior(pBehaviorHash, pRequest, fComplete)
	{
		// Run an injected behavior (if it exists)
		if (this._BehaviorFunctions.hasOwnProperty(pBehaviorHash))
		{
			return this._BehaviorFunctions[pBehaviorHash](pRequest, fComplete);
		}
	}

	/**
	* Get a template.
	*/
	getTemplate(pTemplateHash)
	{
		if (this._Templates.hasOwnProperty(pTemplateHash))
		{
			return this._Templates[pTemplateHash];
		}
		else
		{
			return false;
		}
	}

	/**
	* Set a template.
	*/
	setTemplate(pTemplateHash, pTemplate)
	{
		// Store both the cached text as well as the function
		this._Templates[pTemplateHash] = pTemplate;
		this._TemplateFunctions[pTemplateHash] = this.template(pTemplate);
	}

	/**
	* Get a template function.
	*/
	getTemplateFunction(pTemplateHash)
	{
		if (this._TemplateFunctions.hasOwnProperty(pTemplateHash))
		{
			return this._TemplateFunctions[pTemplateHash];
		}
		else
		{
			return false;
		}
	}

	/**
	* Process a template at a hash, and return the result.
	*/
	processTemplate(pTemplateHash, pTemplateData, pDefaultTemplate)
	{
		var tmpTemplateFunction = this.getTemplateFunction(pTemplateHash);
		var tmpTemplateData = (typeof(pTemplateData) === 'undefined') ? {} : pTemplateData;

		// This makes the function fairly laziliy loading.
		if (tmpTemplateFunction === false)
		{
			// If the template doesn't exist, try to use the passed-in default and set that as the template.
			// Otherwise make it empty.
			this.setTemplate(pTemplateHash, (typeof(pDefaultTemplate) === 'undefined') ? '' : pDefaultTemplate);
			tmpTemplateFunction = this.getTemplateFunction(pTemplateHash);
		}

		// Now process and return the underscore template.
		return tmpTemplateFunction(tmpTemplateData);
	}
}

module.exports = MeadowEndpointsControllerBehaviorInjectionBase;