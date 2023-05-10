/**
* Test Harness
*
* @license     MIT
*
* @author      Steven Velozo <steven@velozo.com>
*/

//const libImporter = require('../test_support/bookstore-import-books.js');
//const libServer = require('../test_support/bookstore-serve-meadow-endpoint-apis.js'); 
const libServer = require('../test_support/bookstore-serve-meadow-endpoint-apis-IPC.js'); 
let _Orator = libServer(
	()=>
	{
		console.log('Service is started!');
	});