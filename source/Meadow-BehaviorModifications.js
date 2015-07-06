/**
* The Meadow Behavior Modification Object
*
* Provide a sane mechanism for overloading or injecting behaviors into request endpoints.
*
* @class MeadowBehaviorModifications
* @constructor
*/
var libUnderscore = require('underscore');

var MeadowBehaviorModifications = function()
{
	function createNew(pMeadow)
	{
		// If a valid fable object isn't passed in, return a constructor
		if ((typeof(pMeadow) !== 'object') || (!pMeadow.hasOwnProperty('fable')))
		{
			return {new: createNew};
		}

		// An object to hold modifications to specific behaviors.
		var _BehaviorFunctions = {};

		// A set of objects to hold the specific templates and their compiled functions
		var _Templates = {};
		var _TemplateFunctions = {};

		/**
		* Set a specific behavior.
		*/
		var setBehavior = function(pBehaviorHash, fBehavior)
		{
			_BehaviorFunctions[pBehaviorHash] = fBehavior;
		};

		/**
		* This method runs a behavior at a specific hash, and returns true.
		* Or it returns false if there was no behavior there.
		* Behaviors should expect their state to be in the pRequest object.
		* Some behaviors have specific results that may be expected on return.
		*/
		var runBehavior = function(pBehaviorHash, pRequest, pResponse, fNext)
		{
			// Run an injected behavior (if it exists)
			if (_BehaviorFunctions.hasOwnProperty(pBehaviorHash))
			{
				_BehaviorFunctions[pBehaviorHash](pRequest, pResponse, fNext);
				return true;
			}
			else
			{
				return false;
			}
		};




		/**
		* Set a template.
		*/
		var setTemplate = function(pTemplateHash, pTemplate)
		{
			// Store both the cached text as well as the function
			_Templates[pTemplateHash] = pTemplate;
			_TemplateFunctions[pTemplateHash] = libUnderscore.template(pTemplate)
		};

		/**
		* Get a template.
		*/
		var getTemplate = function(pTemplateHash)
		{
			if (_Templates.hasOwnProperty(pTemplateHash))
			{
				return _Templates[pTemplateHash]
			}
			else
			{
				return false;
			}
		};

		/**
		* Get a template.
		*/
		var getTemplateFunction = function(pTemplateHash)
		{
			if (_TemplateFunctions.hasOwnProperty(pTemplateHash))
			{
				return _TemplateFunctions[pTemplateHash]
			}
			else
			{
				return false;
			}
		};

		/**
		* Process a template at a hash, and return the result.
		*/
		var processTemplate = function(pTemplateHash, pTemplateData, pDefaultTemplate)
		{
			var tmpTemplateFunction = getTemplateFunction(pTemplateHash);
			var tmpTemplateData = (typeof(pTemplateData) === 'undefined') ? {} : pTemplateData;

			// This makes the function fairly laziliy loading.
			if (tmpTemplateFunction === false)
			{
				// If the template doesn't exist, try to use the passed-in default and set that as the template.
				// Otherwise make it empty.
				setTemplate(pTemplateHash, (typeof(pDefaultTemplate) === 'undefined') ? '' : pDefaultTemplate);
				tmpTemplateFunction = getTemplateFunction(pTemplateHash);
			}

			// Now process and return the underscore template.
			return tmpTemplateFunction(tmpTemplateData);
		};

		/**
		* Container Object for our Factory Pattern
		*/
		var tmpNewMeadowBehaviorModifications = (
		{
			setBehavior: setBehavior,
			runBehavior: runBehavior,

			setTemplate: setTemplate,
			getTemplate: getTemplate,
			getTemplateFunction: getTemplateFunction,
			processTemplate: processTemplate,

			new: createNew
		});

		return tmpNewMeadowBehaviorModifications;
	}

	return createNew();
};

module.exports = new MeadowBehaviorModifications();
