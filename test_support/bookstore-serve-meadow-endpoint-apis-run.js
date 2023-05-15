const libServer = require('./bookstore-serve-meadow-endpoint-apis.js'); 
let _Orator = libServer(
	()=>
	{
		console.log('API service is started!');
	});