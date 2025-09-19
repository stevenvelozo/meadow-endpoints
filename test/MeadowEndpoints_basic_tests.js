/**
* Unit tests for Meadow Endpoints
*
* @license     MIT
*
* @author      Steven Velozo <steven@velozo.com>
*/

var Chai = require("chai");
var Expect = Chai.expect;
var Assert = Chai.assert;

const libAsync = require('async');

const libBookServer = require('../test_support/bookstore-serve-meadow-endpoint-apis.js');
let _BookServer = false;

let _INITIALIZATION_COMPLETE = false;

const libMeadowEndpoints = require('../source/Meadow-Endpoints.js');

const libSuperTest = require('supertest');

suite
(
	'Meadow-Endpoints-Core',
	() =>
	{
		suite
		(
			'Object Sanity',
			() =>
			{
				test
				(
					'The class should initialize itself into a happy little object.',
					function (fDone)
					{
						Expect(true).to.equal(true);
						fDone();
					}
				);
				test
				(
					'read: get a specific record',
					function(fDone)
					{
						libSuperTest('http://localhost:8086/')
						.get('1.0/Book/1')
						.end(
							function (pError, pResponse)
							{
								var tmpResult = JSON.parse(pResponse.text);
								Expect(tmpResult.Title).to.equal('Angels & Demons');
								fDone();
							}
						);
					}
				);
				test
				(
					'create: create a record',
					function(fDone)
					{
						var tmpRecord = {Title:'Batman is Batman'};
						libSuperTest('http://localhost:8086/')
						.post('1.0/Book')
						.send(tmpRecord)
						.end(
							function(pError, pResponse)
							{
								// Expect response to be the record we just created.
								var tmpResult = JSON.parse(pResponse.text);
								Expect(tmpResult.Title).to.equal('Batman is Batman');
								fDone();
							}
						);
					}
				);
			}
		);
	}
);