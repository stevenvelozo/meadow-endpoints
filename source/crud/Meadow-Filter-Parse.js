/**
* Meadow Endpoint Utility Function - Parse a Filter String and put it into a Query.
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
/**
* Parse GET-passed Filter Strings, turn the results into proper Meadow query stanzas

 Take the filter and return an array of filter instructions
 Basic instruction anatomy:
       INSTRUCTION~FIELD~OPERATOR~VALUE
 FOP - Filter Open Paren
       FOP~0~(~0
 FCP - Filter Close Paren
       FCP~0~)~0
 FBV - Filter By Value (left-side AND connected)
       FBV~Category~EQ~Books
       Possible comparisons:
       * EQ - Equals To (=)
       * NE - Not Equals To (!=)
       * GT - Greater Than (>)
       * GE - Greater Than or Equals To (>=)
       * LT - Less Than (<)
       * LE - Less Than or Equals To (<=)
       * LK - Like (Like)
       * IN - Is NULL
       * NN - Is NOT NULL
       * INN - IN list
 FBVOR - Filter By Value (left-side OR connected)
 FBL - Filter By List (value list, separated by commas)
       FBL~Category~EQ~Books,Movies
 FSF - Filter Sort Field
       FSF~Category~ASC~0
       FSF~Category~DESC~0

 This means: FBV~Category~EQ~Books~FBV~PublishedYear~GT~2000~FSF~PublishedYear~DESC~0
             Filters down to ALL BOOKS PUBLUSHED AFTER 200 IN DESCENDING ORDER
*/

// Get the comparison operator for use in a query stanza
var getFilterComparisonOperator = function(pFilterOperator)
{
	var tmpOperator = '=';
	switch(pFilterOperator)
	{
		case 'EQ':
			tmpOperator = '=';
			break;
		case 'NE':
			tmpOperator = '!=';
			break;
		case 'GT':
			tmpOperator = '>';
			break;
		case 'GE':
			tmpOperator = '>=';
			break;
		case 'LT':
			tmpOperator = '<';
			break;
		case 'LE':
			tmpOperator = '<=';
			break;
		case 'LK':
			tmpOperator = 'LIKE';
			break;
		case 'NLK':
			tmpOperator = 'NOT LIKE';
			break;
		case 'IN':
			tmpOperator = 'IS NULL';
			break;
		case 'NN':
			tmpOperator = 'IS NOT NULL';
			break;
		case 'INN':
			tmpOperator = 'IN';
			break;
	}
	return tmpOperator;
};

var addFilterStanzaToQuery = function(pFilterStanza, pQuery)
{
	if (!pFilterStanza.Instruction)
	{
		return false;
	}

	switch(pFilterStanza.Instruction)
	{
		case 'FBV':   // Filter by Value (left-side AND)
			pQuery.addFilter(pFilterStanza.Field, pFilterStanza.Value, getFilterComparisonOperator(pFilterStanza.Operator), 'AND');
			break;

		case 'FBVOR': // Filter by Value (left-side OR)
			pQuery.addFilter(pFilterStanza.Field, pFilterStanza.Value, getFilterComparisonOperator(pFilterStanza.Operator), 'OR');
			break;

		case 'FBL':   // Filter by List (left-side AND)
			// Just split the value by comma for now.  May want to revisit better characters or techniques later.
			pQuery.addFilter(pFilterStanza.Field, pFilterStanza.Value.split(','), getFilterComparisonOperator(pFilterStanza.Operator), 'AND');
			break;

		case 'FBLOR': // Filter by List (left-side OR)
			// Just split the value by comma for now.  May want to revisit better characters or techniques later.
			pQuery.addFilter(pFilterStanza.Field, pFilterStanza.Value.split(','), getFilterComparisonOperator(pFilterStanza.Operator, 'OR'));
			break;

		case 'FSF':   // Filter Sort Field
			var tmpSortDirection = (pFilterStanza.Operator === 'DESC') ? 'Descending' : 'Ascending';
			pQuery.addSort({Column:pFilterStanza.Field, Direction:tmpSortDirection});
			break;


		default:
			//console.log('Unparsable filter stanza.');
			return false;
			break;
	}

	// Be paranoid about the instruction
	pFilterStanza.Instruction = false;
	return true;
};

var doParseFilter = function(pFilterString, pQuery)
{
	if (typeof(pFilterString) !== 'string')
	{
		return false;
	}

	var tmpFilterTerms = pFilterString.split('~');

	if (tmpFilterTerms.length < 4)
		return true;

	var tmpFilterStanza = { Instruction:false };

	for (var i = 0; i < tmpFilterTerms.length; i++)
	{
		switch(i % 4)
		{
			case 0:  // INSTRUCTION
				addFilterStanzaToQuery(tmpFilterStanza, pQuery);
				//console.log(i+' Instruction: '+tmpFilterTerms[i]);
				tmpFilterStanza = (
				{
					Instruction: tmpFilterTerms[i],
					Field: '',
					Operator: '',
					Value: ''
				});
				break;

			case 1:  // FIELD
				//console.log(i+' Field:       '+tmpFilterTerms[i]);
				tmpFilterStanza.Field = tmpFilterTerms[i];
				break;

			case 2:  // OPERATOR
				//console.log(i+' Operator:    '+tmpFilterTerms[i]);
				tmpFilterStanza.Operator = tmpFilterTerms[i];
				break;

			case 3:  // VALUE
				//console.log(i+' Value:       '+tmpFilterTerms[i]);
				tmpFilterStanza.Value = tmpFilterTerms[i];
				break;
		}
	}

	addFilterStanzaToQuery(tmpFilterStanza, pQuery);

	return true;
};

module.exports = doParseFilter;