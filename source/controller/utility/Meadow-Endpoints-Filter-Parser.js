/**
* Meadow Endpoint Utility Class - Parse a Filter String and put it into a Query.
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
 FBD - Filter by Date (exclude time)
       FBD~UpdateDate~EQ~2015-10-01
 FSF - Filter Sort Field
       FSF~Category~ASC~0
       FSF~Category~DESC~0
 FDST - Filter by Distinct (adds distinct keyword to Read and Count queries)
       FDST~0~0~0~

 This means: FBV~Category~EQ~Books~FBV~PublishedYear~GT~2000~FSF~PublishedYear~DESC~0
             Filters down to ALL BOOKS PUBLUSHED AFTER 2000 IN DESCENDING ORDER
*/

class MeadowEndpointsFilterParser
{
    constructor(pController)
	{
        this._Controller = pController;
    }

    // Get the comparison operator for use in a query stanza
    getFilterComparisonOperator(pFilterOperator)
    {
        let tmpOperator = '=';
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
            case 'FOP':
                tmpOperator = '(';
                break;
            case 'FCP':
                tmpOperator = ')';
                break;
        }
        return tmpOperator;
    }

    addFilterStanzaToQuery(pFilterStanza, pQuery)
    {
        if (!pFilterStanza.Instruction)
        {
            return false;
        }

        switch(pFilterStanza.Instruction)
        {
            case 'FBV':   // Filter by Value (left-side AND)
                pQuery.addFilter(pFilterStanza.Field, pFilterStanza.Value, this.getFilterComparisonOperator(pFilterStanza.Operator), 'AND');
                break;

            case 'FBVOR': // Filter by Value (left-side OR)
                pQuery.addFilter(pFilterStanza.Field, pFilterStanza.Value, this.getFilterComparisonOperator(pFilterStanza.Operator), 'OR');
                break;

            case 'FBL':   // Filter by List (left-side AND)
                // Just split the value by comma for now.  May want to revisit better characters or techniques later.
                pQuery.addFilter(pFilterStanza.Field, pFilterStanza.Value.split(','), this.getFilterComparisonOperator(pFilterStanza.Operator), 'AND');
                break;

            case 'FBLOR': // Filter by List (left-side OR)
                // Just split the value by comma for now.  May want to revisit better characters or techniques later.
                pQuery.addFilter(pFilterStanza.Field, pFilterStanza.Value.split(','), this.getFilterComparisonOperator(pFilterStanza.Operator), 'OR');
                break;

            case 'FBD': // Filter by Date (exclude time)
                pQuery.addFilter(`DATE(${pFilterStanza.Field})`, pFilterStanza.Value.split(','), this.getFilterComparisonOperator(pFilterStanza.Operator), 'AND', pFilterStanza.Field);
                break;

            case 'FBDOR': // Filter by Date (exclude time)
                pQuery.addFilter(`DATE(${pFilterStanza.Field})`, pFilterStanza.Value.split(','), this.getFilterComparisonOperator(pFilterStanza.Operator), 'OR', pFilterStanza.Field);
                break;

            case 'FSF':   // Filter Sort Field
                const tmpSortDirection = (pFilterStanza.Operator === 'DESC') ? 'Descending' : 'Ascending';
                pQuery.addSort({ Column: pFilterStanza.Field, Direction: tmpSortDirection });
                break;

            case 'FOP':   // Filter Open Paren
                pQuery.addFilter('', '', '(');
                break;

            case 'FCP':   // Filter Close Paren
                pQuery.addFilter('', '', ')');
                break;

            case 'FDST':   // Filter Distinct
                // ensure we don't break if using an older foxhound version
                if (pQuery.setDistinct)
                {
                    pQuery.setDistinct(true);
                }
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

    parseFilter(pFilterString, pQuery)
    {
        if (typeof(pFilterString) !== 'string')
        {
            return false;
        }

        const tmpFilterTerms = pFilterString.split('~');

        if (tmpFilterTerms.length < 4)
        {
            return true;
        }

        let tmpFilterStanza = { Instruction: false };

        for (let i = 0; i < tmpFilterTerms.length; i++)
        {
            switch(i % 4)
            {
                case 0:  // INSTRUCTION
                    this.addFilterStanzaToQuery(tmpFilterStanza, pQuery);
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

        this.addFilterStanzaToQuery(tmpFilterStanza, pQuery);

        return true;
    };
}

module.exports = MeadowEndpointsFilterParser;