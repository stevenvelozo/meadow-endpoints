//var assert = require('assert');
var url = require('url');

/**
 * given a request, try to match it against the regular expression to
 * get the route params.
 * i.e., /foo/:param1/:param2
 * @private
 * @function matchURL
 * @param	{String | RegExp} re   a string or regular expression
 * @param	{Object}		  req  the request object
 * @returns  {Object}
 */
function matchURL(re, req) {
	var i = 0;
	var result = re.exec(req.path());
	var params = {};

	if (!result) {
		return (false);
	}

	// This means the user original specified a regexp match, not a url
	// string like /:foo/:bar
	if (!re.restifyParams) {
		for (i = 1; i < result.length; i++) {
			params[(i - 1)] = result[i];
		}

		return (params);
	}

	// This was a static string, like /foo
	if (re.restifyParams.length === 0) {
		return (params);
	}

	// This was the "normal" case, of /foo/:id
	re.restifyParams.forEach(function (p) {
		if (++i < result.length) {
			params[p] = result[i];
		}
	});

	return (params);
}

var _RegexCache = {};

function compileURL(options) {
	if (options.url instanceof RegExp)
		return (options.url);
	//assert.string(options.url, 'url');
	if (_RegexCache[options.url])
	{
		return _RegexCache[options.url];
	}

	var params = [];
	var pattern = '^';
	var re;
	var _url = url.parse(options.url).pathname;
	_url.split('/').forEach(function (frag) {
		if (frag.length <= 0)
			return (false);

		pattern += '\\/+';
		if (frag.charAt(0) === ':') {
			var label = frag;
			var index = frag.indexOf('(');
			var subexp;
			if (index === -1) {
				if (options.urlParamPattern) {
					subexp = options.urlParamPattern;
				} else {
					subexp = '[^/]*';
				}
			} else {
				label = frag.substring(0, index);
				subexp = frag.substring(index+1, frag.length-1);
			}
			pattern += '(' + subexp + ')';
			params.push(label.slice(1));
		} else {
			pattern += frag;
		}
		return (true);
	});

	if (pattern === '^')
		pattern += '\\/';
	pattern += '$';

	re = new RegExp(pattern, options.flags);
	re.restifyParams = params;

	_RegexCache[options.url] = re;

	return (re);
}

module.exports = function parseParams(pRoute, pRequestPath)
{
	var tmpPath = compileURL({url: pRoute});

	var tmpReq = {
		path: function()
		{
			return pRequestPath;
		}
	};

	return matchURL(tmpPath, tmpReq);
}
