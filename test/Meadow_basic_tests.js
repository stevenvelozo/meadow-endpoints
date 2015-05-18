/**
* Unit tests for the MeadowEndpoints Server
*
* @license     MIT
*
* @author      Steven Velozo <steven@velozo.com>
*/

var Chai = require("chai");
var Expect = Chai.expect;
var Assert = Chai.assert;

var libSuperTest = require('supertest');

suite
(
	'Meadow-Endpoints',
	function()
	{
		var _MeadowEndpoints;

		setup
		(
			function()
			{
				_MeadowEndpoints = require('../source/Meadow-Endpoints.js').new();
			}
		);

		suite
		(
			'Object Sanity',
			function()
			{
				test
				(
					'initialize should build a happy little object',
					function()
					{
						Expect(_MeadowEndpoints)
							.to.be.an('object', 'MeadowEndpoints should initialize as an object directly from the require statement.');
					}
				);
			}
		);
		suite
		(
			'Basic Server Start',
			function()
			{
				test
				(
					'simple routes should work',
					function(fDone)
					{
					}
				);
			}
		);
	}
);