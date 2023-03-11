(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f();}else if(typeof define==="function"&&define.amd){define([],f);}else{var g;if(typeof window!=="undefined"){g=window;}else if(typeof global!=="undefined"){g=global;}else if(typeof self!=="undefined"){g=self;}else{g=this;}g.MeadowEndpoints=f();}})(function(){var define,module,exports;return function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a;}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r);},p,p.exports,r,e,n,t);}return n[i].exports;}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o;}return r;}()({1:[function(require,module,exports){(function(Buffer){(function(){'use strict';var Parser=require('jsonparse'),through=require('through');var bufferFrom=Buffer.from&&Buffer.from!==Uint8Array.from;/*

  the value of this.stack that creationix's jsonparse has is weird.

  it makes this code ugly, but his problem is way harder that mine,
  so i'll forgive him.

*/exports.parse=function(path,map){var header,footer;var parser=new Parser();var stream=through(function(chunk){if('string'===typeof chunk)chunk=bufferFrom?Buffer.from(chunk):new Buffer(chunk);parser.write(chunk);},function(data){if(data)stream.write(data);if(header)stream.emit('header',header);if(footer)stream.emit('footer',footer);stream.queue(null);});if('string'===typeof path)path=path.split('.').map(function(e){if(e==='$*')return{emitKey:true};else if(e==='*')return true;else if(e==='')// '..'.split('.') returns an empty string
return{recurse:true};else return e;});var count=0,_key;if(!path||!path.length)path=null;parser.onValue=function(value){if(!this.root)stream.root=value;if(!path)return;var i=0;// iterates on path
var j=0;// iterates on stack
var emitKey=false;var emitPath=false;while(i<path.length){var key=path[i];var c;j++;if(key&&!key.recurse){c=j===this.stack.length?this:this.stack[j];if(!c)return;if(!check(key,c.key)){setHeaderFooter(c.key,value);return;}emitKey=!!key.emitKey;emitPath=!!key.emitPath;i++;}else{i++;var nextKey=path[i];if(!nextKey)return;while(true){c=j===this.stack.length?this:this.stack[j];if(!c)return;if(check(nextKey,c.key)){i++;if(!Object.isFrozen(this.stack[j]))this.stack[j].value=null;break;}else{setHeaderFooter(c.key,value);}j++;}}}// emit header
if(header){stream.emit('header',header);header=false;}if(j!==this.stack.length)return;count++;var actualPath=this.stack.slice(1).map(function(element){return element.key;}).concat([this.key]);var data=value;if(null!=data)if(null!=(data=map?map(data,actualPath):data)){if(emitKey||emitPath){data={value:data};if(emitKey)data["key"]=this.key;if(emitPath)data["path"]=actualPath;}stream.queue(data);}if(this.value)delete this.value[this.key];for(var k in this.stack)if(!Object.isFrozen(this.stack[k]))this.stack[k].value=null;};parser._onToken=parser.onToken;parser.onToken=function(token,value){parser._onToken(token,value);if(this.stack.length===0){if(stream.root){if(!path)stream.queue(stream.root);count=0;stream.root=null;}}};parser.onError=function(err){if(err.message.indexOf("at position")>-1)err.message="Invalid JSON ("+err.message+")";stream.emit('error',err);};return stream;function setHeaderFooter(key,value){// header has not been emitted yet
if(header!==false){header=header||{};header[key]=value;}// footer has not been emitted yet but header has
if(footer!==false&&header===false){footer=footer||{};footer[key]=value;}}};function check(x,y){if('string'===typeof x)return y==x;else if(x&&'function'===typeof x.exec)return x.exec(y);else if('boolean'===typeof x||'object'===typeof x)return x;else if('function'===typeof x)return x(y);return false;}exports.stringify=function(op,sep,cl,indent){indent=indent||0;if(op===false){op='';sep='\n';cl='';}else if(op==null){op='[\n';sep='\n,\n';cl='\n]\n';}//else, what ever you like
var stream,first=true,anyData=false;stream=through(function(data){anyData=true;try{var json=JSON.stringify(data,null,indent);}catch(err){return stream.emit('error',err);}if(first){first=false;stream.queue(op+json);}else stream.queue(sep+json);},function(data){if(!anyData)stream.queue(op);stream.queue(cl);stream.queue(null);});return stream;};exports.stringifyObject=function(op,sep,cl,indent){indent=indent||0;if(op===false){op='';sep='\n';cl='';}else if(op==null){op='{\n';sep='\n,\n';cl='\n}\n';}//else, what ever you like
var first=true;var anyData=false;var stream=through(function(data){anyData=true;var json=JSON.stringify(data[0])+':'+JSON.stringify(data[1],null,indent);if(first){first=false;this.queue(op+json);}else this.queue(sep+json);},function(data){if(!anyData)this.queue(op);this.queue(cl);this.queue(null);});return stream;};}).call(this);}).call(this,require("buffer").Buffer);},{"buffer":22,"jsonparse":56,"through":164}],2:[function(require,module,exports){'use strict';Object.defineProperty(exports,"__esModule",{value:true});exports.default=asyncify;var _isObject=require('lodash/isObject');var _isObject2=_interopRequireDefault(_isObject);var _initialParams=require('./internal/initialParams');var _initialParams2=_interopRequireDefault(_initialParams);var _setImmediate=require('./internal/setImmediate');var _setImmediate2=_interopRequireDefault(_setImmediate);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}/**
 * Take a sync function and make it async, passing its return value to a
 * callback. This is useful for plugging sync functions into a waterfall,
 * series, or other async functions. Any arguments passed to the generated
 * function will be passed to the wrapped function (except for the final
 * callback argument). Errors thrown will be passed to the callback.
 *
 * If the function passed to `asyncify` returns a Promise, that promises's
 * resolved/rejected state will be used to call the callback, rather than simply
 * the synchronous return value.
 *
 * This also means you can asyncify ES2017 `async` functions.
 *
 * @name asyncify
 * @static
 * @memberOf module:Utils
 * @method
 * @alias wrapSync
 * @category Util
 * @param {Function} func - The synchronous function, or Promise-returning
 * function to convert to an {@link AsyncFunction}.
 * @returns {AsyncFunction} An asynchronous wrapper of the `func`. To be
 * invoked with `(args..., callback)`.
 * @example
 *
 * // passing a regular synchronous function
 * async.waterfall([
 *     async.apply(fs.readFile, filename, "utf8"),
 *     async.asyncify(JSON.parse),
 *     function (data, next) {
 *         // data is the result of parsing the text.
 *         // If there was a parsing error, it would have been caught.
 *     }
 * ], callback);
 *
 * // passing a function returning a promise
 * async.waterfall([
 *     async.apply(fs.readFile, filename, "utf8"),
 *     async.asyncify(function (contents) {
 *         return db.model.create(contents);
 *     }),
 *     function (model, next) {
 *         // `model` is the instantiated model object.
 *         // If there was an error, this function would be skipped.
 *     }
 * ], callback);
 *
 * // es2017 example, though `asyncify` is not needed if your JS environment
 * // supports async functions out of the box
 * var q = async.queue(async.asyncify(async function(file) {
 *     var intermediateStep = await processFile(file);
 *     return await somePromise(intermediateStep)
 * }));
 *
 * q.push(files);
 */function asyncify(func){return(0,_initialParams2.default)(function(args,callback){var result;try{result=func.apply(this,args);}catch(e){return callback(e);}// if result is Promise object
if((0,_isObject2.default)(result)&&typeof result.then==='function'){result.then(function(value){invokeCallback(callback,null,value);},function(err){invokeCallback(callback,err.message?err:new Error(err));});}else{callback(null,result);}});}function invokeCallback(callback,error,value){try{callback(error,value);}catch(e){(0,_setImmediate2.default)(rethrow,e);}}function rethrow(error){throw error;}module.exports=exports['default'];},{"./internal/initialParams":9,"./internal/setImmediate":13,"lodash/isObject":81}],3:[function(require,module,exports){'use strict';Object.defineProperty(exports,"__esModule",{value:true});exports.default=eachLimit;var _eachOfLimit=require('./internal/eachOfLimit');var _eachOfLimit2=_interopRequireDefault(_eachOfLimit);var _withoutIndex=require('./internal/withoutIndex');var _withoutIndex2=_interopRequireDefault(_withoutIndex);var _wrapAsync=require('./internal/wrapAsync');var _wrapAsync2=_interopRequireDefault(_wrapAsync);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}/**
 * The same as [`each`]{@link module:Collections.each} but runs a maximum of `limit` async operations at a time.
 *
 * @name eachLimit
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.each]{@link module:Collections.each}
 * @alias forEachLimit
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {number} limit - The maximum number of async operations at a time.
 * @param {AsyncFunction} iteratee - An async function to apply to each item in
 * `coll`.
 * The array index is not passed to the iteratee.
 * If you need the index, use `eachOfLimit`.
 * Invoked with (item, callback).
 * @param {Function} [callback] - A callback which is called when all
 * `iteratee` functions have finished, or an error occurs. Invoked with (err).
 */function eachLimit(coll,limit,iteratee,callback){(0,_eachOfLimit2.default)(limit)(coll,(0,_withoutIndex2.default)((0,_wrapAsync2.default)(iteratee)),callback);}module.exports=exports['default'];},{"./internal/eachOfLimit":7,"./internal/withoutIndex":15,"./internal/wrapAsync":16}],4:[function(require,module,exports){'use strict';Object.defineProperty(exports,"__esModule",{value:true});var _eachLimit=require('./eachLimit');var _eachLimit2=_interopRequireDefault(_eachLimit);var _doLimit=require('./internal/doLimit');var _doLimit2=_interopRequireDefault(_doLimit);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}/**
 * The same as [`each`]{@link module:Collections.each} but runs only a single async operation at a time.
 *
 * @name eachSeries
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.each]{@link module:Collections.each}
 * @alias forEachSeries
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {AsyncFunction} iteratee - An async function to apply to each
 * item in `coll`.
 * The array index is not passed to the iteratee.
 * If you need the index, use `eachOfSeries`.
 * Invoked with (item, callback).
 * @param {Function} [callback] - A callback which is called when all
 * `iteratee` functions have finished, or an error occurs. Invoked with (err).
 */exports.default=(0,_doLimit2.default)(_eachLimit2.default,1);module.exports=exports['default'];},{"./eachLimit":3,"./internal/doLimit":6}],5:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});// A temporary value used to identify if the loop should be broken.
// See #1064, #1293
exports.default={};module.exports=exports["default"];},{}],6:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=doLimit;function doLimit(fn,limit){return function(iterable,iteratee,callback){return fn(iterable,limit,iteratee,callback);};}module.exports=exports["default"];},{}],7:[function(require,module,exports){'use strict';Object.defineProperty(exports,"__esModule",{value:true});exports.default=_eachOfLimit;var _noop=require('lodash/noop');var _noop2=_interopRequireDefault(_noop);var _once=require('./once');var _once2=_interopRequireDefault(_once);var _iterator=require('./iterator');var _iterator2=_interopRequireDefault(_iterator);var _onlyOnce=require('./onlyOnce');var _onlyOnce2=_interopRequireDefault(_onlyOnce);var _breakLoop=require('./breakLoop');var _breakLoop2=_interopRequireDefault(_breakLoop);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}function _eachOfLimit(limit){return function(obj,iteratee,callback){callback=(0,_once2.default)(callback||_noop2.default);if(limit<=0||!obj){return callback(null);}var nextElem=(0,_iterator2.default)(obj);var done=false;var running=0;var looping=false;function iterateeCallback(err,value){running-=1;if(err){done=true;callback(err);}else if(value===_breakLoop2.default||done&&running<=0){done=true;return callback(null);}else if(!looping){replenish();}}function replenish(){looping=true;while(running<limit&&!done){var elem=nextElem();if(elem===null){done=true;if(running<=0){callback(null);}return;}running+=1;iteratee(elem.value,elem.key,(0,_onlyOnce2.default)(iterateeCallback));}looping=false;}replenish();};}module.exports=exports['default'];},{"./breakLoop":5,"./iterator":10,"./once":11,"./onlyOnce":12,"lodash/noop":85}],8:[function(require,module,exports){'use strict';Object.defineProperty(exports,"__esModule",{value:true});exports.default=function(coll){return iteratorSymbol&&coll[iteratorSymbol]&&coll[iteratorSymbol]();};var iteratorSymbol=typeof Symbol==='function'&&Symbol.iterator;module.exports=exports['default'];},{}],9:[function(require,module,exports){'use strict';Object.defineProperty(exports,"__esModule",{value:true});exports.default=function(fn){return function()/*...args, callback*/{var args=(0,_slice2.default)(arguments);var callback=args.pop();fn.call(this,args,callback);};};var _slice=require('./slice');var _slice2=_interopRequireDefault(_slice);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}module.exports=exports['default'];},{"./slice":14}],10:[function(require,module,exports){'use strict';Object.defineProperty(exports,"__esModule",{value:true});exports.default=iterator;var _isArrayLike=require('lodash/isArrayLike');var _isArrayLike2=_interopRequireDefault(_isArrayLike);var _getIterator=require('./getIterator');var _getIterator2=_interopRequireDefault(_getIterator);var _keys=require('lodash/keys');var _keys2=_interopRequireDefault(_keys);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}function createArrayIterator(coll){var i=-1;var len=coll.length;return function next(){return++i<len?{value:coll[i],key:i}:null;};}function createES2015Iterator(iterator){var i=-1;return function next(){var item=iterator.next();if(item.done)return null;i++;return{value:item.value,key:i};};}function createObjectIterator(obj){var okeys=(0,_keys2.default)(obj);var i=-1;var len=okeys.length;return function next(){var key=okeys[++i];return i<len?{value:obj[key],key:key}:null;};}function iterator(coll){if((0,_isArrayLike2.default)(coll)){return createArrayIterator(coll);}var iterator=(0,_getIterator2.default)(coll);return iterator?createES2015Iterator(iterator):createObjectIterator(coll);}module.exports=exports['default'];},{"./getIterator":8,"lodash/isArrayLike":77,"lodash/keys":84}],11:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=once;function once(fn){return function(){if(fn===null)return;var callFn=fn;fn=null;callFn.apply(this,arguments);};}module.exports=exports["default"];},{}],12:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=onlyOnce;function onlyOnce(fn){return function(){if(fn===null)throw new Error("Callback was already called.");var callFn=fn;fn=null;callFn.apply(this,arguments);};}module.exports=exports["default"];},{}],13:[function(require,module,exports){(function(process,setImmediate){(function(){'use strict';Object.defineProperty(exports,"__esModule",{value:true});exports.hasNextTick=exports.hasSetImmediate=undefined;exports.fallback=fallback;exports.wrap=wrap;var _slice=require('./slice');var _slice2=_interopRequireDefault(_slice);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}var hasSetImmediate=exports.hasSetImmediate=typeof setImmediate==='function'&&setImmediate;var hasNextTick=exports.hasNextTick=typeof process==='object'&&typeof process.nextTick==='function';function fallback(fn){setTimeout(fn,0);}function wrap(defer){return function(fn/*, ...args*/){var args=(0,_slice2.default)(arguments,1);defer(function(){fn.apply(null,args);});};}var _defer;if(hasSetImmediate){_defer=setImmediate;}else if(hasNextTick){_defer=process.nextTick;}else{_defer=fallback;}exports.default=wrap(_defer);}).call(this);}).call(this,require('_process'),require("timers").setImmediate);},{"./slice":14,"_process":121,"timers":165}],14:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=slice;function slice(arrayLike,start){start=start|0;var newLen=Math.max(arrayLike.length-start,0);var newArr=Array(newLen);for(var idx=0;idx<newLen;idx++){newArr[idx]=arrayLike[start+idx];}return newArr;}module.exports=exports["default"];},{}],15:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=_withoutIndex;function _withoutIndex(iteratee){return function(value,index,callback){return iteratee(value,callback);};}module.exports=exports["default"];},{}],16:[function(require,module,exports){'use strict';Object.defineProperty(exports,"__esModule",{value:true});exports.isAsync=undefined;var _asyncify=require('../asyncify');var _asyncify2=_interopRequireDefault(_asyncify);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}var supportsSymbol=typeof Symbol==='function';function isAsync(fn){return supportsSymbol&&fn[Symbol.toStringTag]==='AsyncFunction';}function wrapAsync(asyncFn){return isAsync(asyncFn)?(0,_asyncify2.default)(asyncFn):asyncFn;}exports.default=wrapAsync;exports.isAsync=isAsync;},{"../asyncify":2}],17:[function(require,module,exports){'use strict';Object.defineProperty(exports,"__esModule",{value:true});exports.default=function(tasks,callback){callback=(0,_once2.default)(callback||_noop2.default);if(!(0,_isArray2.default)(tasks))return callback(new Error('First argument to waterfall must be an array of functions'));if(!tasks.length)return callback();var taskIndex=0;function nextTask(args){var task=(0,_wrapAsync2.default)(tasks[taskIndex++]);args.push((0,_onlyOnce2.default)(next));task.apply(null,args);}function next(err/*, ...args*/){if(err||taskIndex===tasks.length){return callback.apply(null,arguments);}nextTask((0,_slice2.default)(arguments,1));}nextTask([]);};var _isArray=require('lodash/isArray');var _isArray2=_interopRequireDefault(_isArray);var _noop=require('lodash/noop');var _noop2=_interopRequireDefault(_noop);var _once=require('./internal/once');var _once2=_interopRequireDefault(_once);var _slice=require('./internal/slice');var _slice2=_interopRequireDefault(_slice);var _onlyOnce=require('./internal/onlyOnce');var _onlyOnce2=_interopRequireDefault(_onlyOnce);var _wrapAsync=require('./internal/wrapAsync');var _wrapAsync2=_interopRequireDefault(_wrapAsync);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}module.exports=exports['default'];/**
 * Runs the `tasks` array of functions in series, each passing their results to
 * the next in the array. However, if any of the `tasks` pass an error to their
 * own callback, the next function is not executed, and the main `callback` is
 * immediately called with the error.
 *
 * @name waterfall
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @category Control Flow
 * @param {Array} tasks - An array of [async functions]{@link AsyncFunction}
 * to run.
 * Each function should complete with any number of `result` values.
 * The `result` values will be passed as arguments, in order, to the next task.
 * @param {Function} [callback] - An optional callback to run once all the
 * functions have completed. This will be passed the results of the last task's
 * callback. Invoked with (err, [results]).
 * @returns undefined
 * @example
 *
 * async.waterfall([
 *     function(callback) {
 *         callback(null, 'one', 'two');
 *     },
 *     function(arg1, arg2, callback) {
 *         // arg1 now equals 'one' and arg2 now equals 'two'
 *         callback(null, 'three');
 *     },
 *     function(arg1, callback) {
 *         // arg1 now equals 'three'
 *         callback(null, 'done');
 *     }
 * ], function (err, result) {
 *     // result now equals 'done'
 * });
 *
 * // Or, with named functions:
 * async.waterfall([
 *     myFirstFunction,
 *     mySecondFunction,
 *     myLastFunction,
 * ], function (err, result) {
 *     // result now equals 'done'
 * });
 * function myFirstFunction(callback) {
 *     callback(null, 'one', 'two');
 * }
 * function mySecondFunction(arg1, arg2, callback) {
 *     // arg1 now equals 'one' and arg2 now equals 'two'
 *     callback(null, 'three');
 * }
 * function myLastFunction(arg1, callback) {
 *     // arg1 now equals 'three'
 *     callback(null, 'done');
 * }
 */},{"./internal/once":11,"./internal/onlyOnce":12,"./internal/slice":14,"./internal/wrapAsync":16,"lodash/isArray":76,"lodash/noop":85}],18:[function(require,module,exports){(function(global){(function(){'use strict';var possibleNames=['BigInt64Array','BigUint64Array','Float32Array','Float64Array','Int16Array','Int32Array','Int8Array','Uint16Array','Uint32Array','Uint8Array','Uint8ClampedArray'];var g=typeof globalThis==='undefined'?global:globalThis;module.exports=function availableTypedArrays(){var out=[];for(var i=0;i<possibleNames.length;i++){if(typeof g[possibleNames[i]]==='function'){out[out.length]=possibleNames[i];}}return out;};}).call(this);}).call(this,typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{});},{}],19:[function(require,module,exports){'use strict';exports.byteLength=byteLength;exports.toByteArray=toByteArray;exports.fromByteArray=fromByteArray;var lookup=[];var revLookup=[];var Arr=typeof Uint8Array!=='undefined'?Uint8Array:Array;var code='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';for(var i=0,len=code.length;i<len;++i){lookup[i]=code[i];revLookup[code.charCodeAt(i)]=i;}// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)]=62;revLookup['_'.charCodeAt(0)]=63;function getLens(b64){var len=b64.length;if(len%4>0){throw new Error('Invalid string. Length must be a multiple of 4');}// Trim off extra bytes after placeholder bytes are found
// See: https://github.com/beatgammit/base64-js/issues/42
var validLen=b64.indexOf('=');if(validLen===-1)validLen=len;var placeHoldersLen=validLen===len?0:4-validLen%4;return[validLen,placeHoldersLen];}// base64 is 4/3 + up to two characters of the original data
function byteLength(b64){var lens=getLens(b64);var validLen=lens[0];var placeHoldersLen=lens[1];return(validLen+placeHoldersLen)*3/4-placeHoldersLen;}function _byteLength(b64,validLen,placeHoldersLen){return(validLen+placeHoldersLen)*3/4-placeHoldersLen;}function toByteArray(b64){var tmp;var lens=getLens(b64);var validLen=lens[0];var placeHoldersLen=lens[1];var arr=new Arr(_byteLength(b64,validLen,placeHoldersLen));var curByte=0;// if there are placeholders, only get up to the last complete 4 chars
var len=placeHoldersLen>0?validLen-4:validLen;var i;for(i=0;i<len;i+=4){tmp=revLookup[b64.charCodeAt(i)]<<18|revLookup[b64.charCodeAt(i+1)]<<12|revLookup[b64.charCodeAt(i+2)]<<6|revLookup[b64.charCodeAt(i+3)];arr[curByte++]=tmp>>16&0xFF;arr[curByte++]=tmp>>8&0xFF;arr[curByte++]=tmp&0xFF;}if(placeHoldersLen===2){tmp=revLookup[b64.charCodeAt(i)]<<2|revLookup[b64.charCodeAt(i+1)]>>4;arr[curByte++]=tmp&0xFF;}if(placeHoldersLen===1){tmp=revLookup[b64.charCodeAt(i)]<<10|revLookup[b64.charCodeAt(i+1)]<<4|revLookup[b64.charCodeAt(i+2)]>>2;arr[curByte++]=tmp>>8&0xFF;arr[curByte++]=tmp&0xFF;}return arr;}function tripletToBase64(num){return lookup[num>>18&0x3F]+lookup[num>>12&0x3F]+lookup[num>>6&0x3F]+lookup[num&0x3F];}function encodeChunk(uint8,start,end){var tmp;var output=[];for(var i=start;i<end;i+=3){tmp=(uint8[i]<<16&0xFF0000)+(uint8[i+1]<<8&0xFF00)+(uint8[i+2]&0xFF);output.push(tripletToBase64(tmp));}return output.join('');}function fromByteArray(uint8){var tmp;var len=uint8.length;var extraBytes=len%3;// if we have 1 byte left, pad 2 bytes
var parts=[];var maxChunkLength=16383;// must be multiple of 3
// go through the array every three bytes, we'll deal with trailing stuff later
for(var i=0,len2=len-extraBytes;i<len2;i+=maxChunkLength){parts.push(encodeChunk(uint8,i,i+maxChunkLength>len2?len2:i+maxChunkLength));}// pad the end with zeros, but make sure to not forget the extra bytes
if(extraBytes===1){tmp=uint8[len-1];parts.push(lookup[tmp>>2]+lookup[tmp<<4&0x3F]+'==');}else if(extraBytes===2){tmp=(uint8[len-2]<<8)+uint8[len-1];parts.push(lookup[tmp>>10]+lookup[tmp>>4&0x3F]+lookup[tmp<<2&0x3F]+'=');}return parts.join('');}},{}],20:[function(require,module,exports){},{}],21:[function(require,module,exports){arguments[4][20][0].apply(exports,arguments);},{"dup":20}],22:[function(require,module,exports){(function(Buffer){(function(){/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */ /* eslint-disable no-proto */'use strict';var base64=require('base64-js');var ieee754=require('ieee754');exports.Buffer=Buffer;exports.SlowBuffer=SlowBuffer;exports.INSPECT_MAX_BYTES=50;var K_MAX_LENGTH=0x7fffffff;exports.kMaxLength=K_MAX_LENGTH;/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */Buffer.TYPED_ARRAY_SUPPORT=typedArraySupport();if(!Buffer.TYPED_ARRAY_SUPPORT&&typeof console!=='undefined'&&typeof console.error==='function'){console.error('This browser lacks typed array (Uint8Array) support which is required by '+'`buffer` v5.x. Use `buffer` v4.x if you require old browser support.');}function typedArraySupport(){// Can typed array instances can be augmented?
try{var arr=new Uint8Array(1);arr.__proto__={__proto__:Uint8Array.prototype,foo:function(){return 42;}};return arr.foo()===42;}catch(e){return false;}}Object.defineProperty(Buffer.prototype,'parent',{enumerable:true,get:function(){if(!Buffer.isBuffer(this))return undefined;return this.buffer;}});Object.defineProperty(Buffer.prototype,'offset',{enumerable:true,get:function(){if(!Buffer.isBuffer(this))return undefined;return this.byteOffset;}});function createBuffer(length){if(length>K_MAX_LENGTH){throw new RangeError('The value "'+length+'" is invalid for option "size"');}// Return an augmented `Uint8Array` instance
var buf=new Uint8Array(length);buf.__proto__=Buffer.prototype;return buf;}/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */function Buffer(arg,encodingOrOffset,length){// Common case.
if(typeof arg==='number'){if(typeof encodingOrOffset==='string'){throw new TypeError('The "string" argument must be of type string. Received type number');}return allocUnsafe(arg);}return from(arg,encodingOrOffset,length);}// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if(typeof Symbol!=='undefined'&&Symbol.species!=null&&Buffer[Symbol.species]===Buffer){Object.defineProperty(Buffer,Symbol.species,{value:null,configurable:true,enumerable:false,writable:false});}Buffer.poolSize=8192;// not used by this implementation
function from(value,encodingOrOffset,length){if(typeof value==='string'){return fromString(value,encodingOrOffset);}if(ArrayBuffer.isView(value)){return fromArrayLike(value);}if(value==null){throw TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, '+'or Array-like Object. Received type '+typeof value);}if(isInstance(value,ArrayBuffer)||value&&isInstance(value.buffer,ArrayBuffer)){return fromArrayBuffer(value,encodingOrOffset,length);}if(typeof value==='number'){throw new TypeError('The "value" argument must not be of type number. Received type number');}var valueOf=value.valueOf&&value.valueOf();if(valueOf!=null&&valueOf!==value){return Buffer.from(valueOf,encodingOrOffset,length);}var b=fromObject(value);if(b)return b;if(typeof Symbol!=='undefined'&&Symbol.toPrimitive!=null&&typeof value[Symbol.toPrimitive]==='function'){return Buffer.from(value[Symbol.toPrimitive]('string'),encodingOrOffset,length);}throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, '+'or Array-like Object. Received type '+typeof value);}/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/Buffer.from=function(value,encodingOrOffset,length){return from(value,encodingOrOffset,length);};// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__=Uint8Array.prototype;Buffer.__proto__=Uint8Array;function assertSize(size){if(typeof size!=='number'){throw new TypeError('"size" argument must be of type number');}else if(size<0){throw new RangeError('The value "'+size+'" is invalid for option "size"');}}function alloc(size,fill,encoding){assertSize(size);if(size<=0){return createBuffer(size);}if(fill!==undefined){// Only pay attention to encoding if it's a string. This
// prevents accidentally sending in a number that would
// be interpretted as a start offset.
return typeof encoding==='string'?createBuffer(size).fill(fill,encoding):createBuffer(size).fill(fill);}return createBuffer(size);}/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/Buffer.alloc=function(size,fill,encoding){return alloc(size,fill,encoding);};function allocUnsafe(size){assertSize(size);return createBuffer(size<0?0:checked(size)|0);}/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */Buffer.allocUnsafe=function(size){return allocUnsafe(size);};/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */Buffer.allocUnsafeSlow=function(size){return allocUnsafe(size);};function fromString(string,encoding){if(typeof encoding!=='string'||encoding===''){encoding='utf8';}if(!Buffer.isEncoding(encoding)){throw new TypeError('Unknown encoding: '+encoding);}var length=byteLength(string,encoding)|0;var buf=createBuffer(length);var actual=buf.write(string,encoding);if(actual!==length){// Writing a hex string, for example, that contains invalid characters will
// cause everything after the first invalid character to be ignored. (e.g.
// 'abxxcd' will be treated as 'ab')
buf=buf.slice(0,actual);}return buf;}function fromArrayLike(array){var length=array.length<0?0:checked(array.length)|0;var buf=createBuffer(length);for(var i=0;i<length;i+=1){buf[i]=array[i]&255;}return buf;}function fromArrayBuffer(array,byteOffset,length){if(byteOffset<0||array.byteLength<byteOffset){throw new RangeError('"offset" is outside of buffer bounds');}if(array.byteLength<byteOffset+(length||0)){throw new RangeError('"length" is outside of buffer bounds');}var buf;if(byteOffset===undefined&&length===undefined){buf=new Uint8Array(array);}else if(length===undefined){buf=new Uint8Array(array,byteOffset);}else{buf=new Uint8Array(array,byteOffset,length);}// Return an augmented `Uint8Array` instance
buf.__proto__=Buffer.prototype;return buf;}function fromObject(obj){if(Buffer.isBuffer(obj)){var len=checked(obj.length)|0;var buf=createBuffer(len);if(buf.length===0){return buf;}obj.copy(buf,0,0,len);return buf;}if(obj.length!==undefined){if(typeof obj.length!=='number'||numberIsNaN(obj.length)){return createBuffer(0);}return fromArrayLike(obj);}if(obj.type==='Buffer'&&Array.isArray(obj.data)){return fromArrayLike(obj.data);}}function checked(length){// Note: cannot use `length < K_MAX_LENGTH` here because that fails when
// length is NaN (which is otherwise coerced to zero.)
if(length>=K_MAX_LENGTH){throw new RangeError('Attempt to allocate Buffer larger than maximum '+'size: 0x'+K_MAX_LENGTH.toString(16)+' bytes');}return length|0;}function SlowBuffer(length){if(+length!=length){// eslint-disable-line eqeqeq
length=0;}return Buffer.alloc(+length);}Buffer.isBuffer=function isBuffer(b){return b!=null&&b._isBuffer===true&&b!==Buffer.prototype;// so Buffer.isBuffer(Buffer.prototype) will be false
};Buffer.compare=function compare(a,b){if(isInstance(a,Uint8Array))a=Buffer.from(a,a.offset,a.byteLength);if(isInstance(b,Uint8Array))b=Buffer.from(b,b.offset,b.byteLength);if(!Buffer.isBuffer(a)||!Buffer.isBuffer(b)){throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');}if(a===b)return 0;var x=a.length;var y=b.length;for(var i=0,len=Math.min(x,y);i<len;++i){if(a[i]!==b[i]){x=a[i];y=b[i];break;}}if(x<y)return-1;if(y<x)return 1;return 0;};Buffer.isEncoding=function isEncoding(encoding){switch(String(encoding).toLowerCase()){case'hex':case'utf8':case'utf-8':case'ascii':case'latin1':case'binary':case'base64':case'ucs2':case'ucs-2':case'utf16le':case'utf-16le':return true;default:return false;}};Buffer.concat=function concat(list,length){if(!Array.isArray(list)){throw new TypeError('"list" argument must be an Array of Buffers');}if(list.length===0){return Buffer.alloc(0);}var i;if(length===undefined){length=0;for(i=0;i<list.length;++i){length+=list[i].length;}}var buffer=Buffer.allocUnsafe(length);var pos=0;for(i=0;i<list.length;++i){var buf=list[i];if(isInstance(buf,Uint8Array)){buf=Buffer.from(buf);}if(!Buffer.isBuffer(buf)){throw new TypeError('"list" argument must be an Array of Buffers');}buf.copy(buffer,pos);pos+=buf.length;}return buffer;};function byteLength(string,encoding){if(Buffer.isBuffer(string)){return string.length;}if(ArrayBuffer.isView(string)||isInstance(string,ArrayBuffer)){return string.byteLength;}if(typeof string!=='string'){throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. '+'Received type '+typeof string);}var len=string.length;var mustMatch=arguments.length>2&&arguments[2]===true;if(!mustMatch&&len===0)return 0;// Use a for loop to avoid recursion
var loweredCase=false;for(;;){switch(encoding){case'ascii':case'latin1':case'binary':return len;case'utf8':case'utf-8':return utf8ToBytes(string).length;case'ucs2':case'ucs-2':case'utf16le':case'utf-16le':return len*2;case'hex':return len>>>1;case'base64':return base64ToBytes(string).length;default:if(loweredCase){return mustMatch?-1:utf8ToBytes(string).length;// assume utf8
}encoding=(''+encoding).toLowerCase();loweredCase=true;}}}Buffer.byteLength=byteLength;function slowToString(encoding,start,end){var loweredCase=false;// No need to verify that "this.length <= MAX_UINT32" since it's a read-only
// property of a typed array.
// This behaves neither like String nor Uint8Array in that we set start/end
// to their upper/lower bounds if the value passed is out of range.
// undefined is handled specially as per ECMA-262 6th Edition,
// Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
if(start===undefined||start<0){start=0;}// Return early if start > this.length. Done here to prevent potential uint32
// coercion fail below.
if(start>this.length){return'';}if(end===undefined||end>this.length){end=this.length;}if(end<=0){return'';}// Force coersion to uint32. This will also coerce falsey/NaN values to 0.
end>>>=0;start>>>=0;if(end<=start){return'';}if(!encoding)encoding='utf8';while(true){switch(encoding){case'hex':return hexSlice(this,start,end);case'utf8':case'utf-8':return utf8Slice(this,start,end);case'ascii':return asciiSlice(this,start,end);case'latin1':case'binary':return latin1Slice(this,start,end);case'base64':return base64Slice(this,start,end);case'ucs2':case'ucs-2':case'utf16le':case'utf-16le':return utf16leSlice(this,start,end);default:if(loweredCase)throw new TypeError('Unknown encoding: '+encoding);encoding=(encoding+'').toLowerCase();loweredCase=true;}}}// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer=true;function swap(b,n,m){var i=b[n];b[n]=b[m];b[m]=i;}Buffer.prototype.swap16=function swap16(){var len=this.length;if(len%2!==0){throw new RangeError('Buffer size must be a multiple of 16-bits');}for(var i=0;i<len;i+=2){swap(this,i,i+1);}return this;};Buffer.prototype.swap32=function swap32(){var len=this.length;if(len%4!==0){throw new RangeError('Buffer size must be a multiple of 32-bits');}for(var i=0;i<len;i+=4){swap(this,i,i+3);swap(this,i+1,i+2);}return this;};Buffer.prototype.swap64=function swap64(){var len=this.length;if(len%8!==0){throw new RangeError('Buffer size must be a multiple of 64-bits');}for(var i=0;i<len;i+=8){swap(this,i,i+7);swap(this,i+1,i+6);swap(this,i+2,i+5);swap(this,i+3,i+4);}return this;};Buffer.prototype.toString=function toString(){var length=this.length;if(length===0)return'';if(arguments.length===0)return utf8Slice(this,0,length);return slowToString.apply(this,arguments);};Buffer.prototype.toLocaleString=Buffer.prototype.toString;Buffer.prototype.equals=function equals(b){if(!Buffer.isBuffer(b))throw new TypeError('Argument must be a Buffer');if(this===b)return true;return Buffer.compare(this,b)===0;};Buffer.prototype.inspect=function inspect(){var str='';var max=exports.INSPECT_MAX_BYTES;str=this.toString('hex',0,max).replace(/(.{2})/g,'$1 ').trim();if(this.length>max)str+=' ... ';return'<Buffer '+str+'>';};Buffer.prototype.compare=function compare(target,start,end,thisStart,thisEnd){if(isInstance(target,Uint8Array)){target=Buffer.from(target,target.offset,target.byteLength);}if(!Buffer.isBuffer(target)){throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. '+'Received type '+typeof target);}if(start===undefined){start=0;}if(end===undefined){end=target?target.length:0;}if(thisStart===undefined){thisStart=0;}if(thisEnd===undefined){thisEnd=this.length;}if(start<0||end>target.length||thisStart<0||thisEnd>this.length){throw new RangeError('out of range index');}if(thisStart>=thisEnd&&start>=end){return 0;}if(thisStart>=thisEnd){return-1;}if(start>=end){return 1;}start>>>=0;end>>>=0;thisStart>>>=0;thisEnd>>>=0;if(this===target)return 0;var x=thisEnd-thisStart;var y=end-start;var len=Math.min(x,y);var thisCopy=this.slice(thisStart,thisEnd);var targetCopy=target.slice(start,end);for(var i=0;i<len;++i){if(thisCopy[i]!==targetCopy[i]){x=thisCopy[i];y=targetCopy[i];break;}}if(x<y)return-1;if(y<x)return 1;return 0;};// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf(buffer,val,byteOffset,encoding,dir){// Empty buffer means no match
if(buffer.length===0)return-1;// Normalize byteOffset
if(typeof byteOffset==='string'){encoding=byteOffset;byteOffset=0;}else if(byteOffset>0x7fffffff){byteOffset=0x7fffffff;}else if(byteOffset<-0x80000000){byteOffset=-0x80000000;}byteOffset=+byteOffset;// Coerce to Number.
if(numberIsNaN(byteOffset)){// byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
byteOffset=dir?0:buffer.length-1;}// Normalize byteOffset: negative offsets start from the end of the buffer
if(byteOffset<0)byteOffset=buffer.length+byteOffset;if(byteOffset>=buffer.length){if(dir)return-1;else byteOffset=buffer.length-1;}else if(byteOffset<0){if(dir)byteOffset=0;else return-1;}// Normalize val
if(typeof val==='string'){val=Buffer.from(val,encoding);}// Finally, search either indexOf (if dir is true) or lastIndexOf
if(Buffer.isBuffer(val)){// Special case: looking for empty string/buffer always fails
if(val.length===0){return-1;}return arrayIndexOf(buffer,val,byteOffset,encoding,dir);}else if(typeof val==='number'){val=val&0xFF;// Search for a byte value [0-255]
if(typeof Uint8Array.prototype.indexOf==='function'){if(dir){return Uint8Array.prototype.indexOf.call(buffer,val,byteOffset);}else{return Uint8Array.prototype.lastIndexOf.call(buffer,val,byteOffset);}}return arrayIndexOf(buffer,[val],byteOffset,encoding,dir);}throw new TypeError('val must be string, number or Buffer');}function arrayIndexOf(arr,val,byteOffset,encoding,dir){var indexSize=1;var arrLength=arr.length;var valLength=val.length;if(encoding!==undefined){encoding=String(encoding).toLowerCase();if(encoding==='ucs2'||encoding==='ucs-2'||encoding==='utf16le'||encoding==='utf-16le'){if(arr.length<2||val.length<2){return-1;}indexSize=2;arrLength/=2;valLength/=2;byteOffset/=2;}}function read(buf,i){if(indexSize===1){return buf[i];}else{return buf.readUInt16BE(i*indexSize);}}var i;if(dir){var foundIndex=-1;for(i=byteOffset;i<arrLength;i++){if(read(arr,i)===read(val,foundIndex===-1?0:i-foundIndex)){if(foundIndex===-1)foundIndex=i;if(i-foundIndex+1===valLength)return foundIndex*indexSize;}else{if(foundIndex!==-1)i-=i-foundIndex;foundIndex=-1;}}}else{if(byteOffset+valLength>arrLength)byteOffset=arrLength-valLength;for(i=byteOffset;i>=0;i--){var found=true;for(var j=0;j<valLength;j++){if(read(arr,i+j)!==read(val,j)){found=false;break;}}if(found)return i;}}return-1;}Buffer.prototype.includes=function includes(val,byteOffset,encoding){return this.indexOf(val,byteOffset,encoding)!==-1;};Buffer.prototype.indexOf=function indexOf(val,byteOffset,encoding){return bidirectionalIndexOf(this,val,byteOffset,encoding,true);};Buffer.prototype.lastIndexOf=function lastIndexOf(val,byteOffset,encoding){return bidirectionalIndexOf(this,val,byteOffset,encoding,false);};function hexWrite(buf,string,offset,length){offset=Number(offset)||0;var remaining=buf.length-offset;if(!length){length=remaining;}else{length=Number(length);if(length>remaining){length=remaining;}}var strLen=string.length;if(length>strLen/2){length=strLen/2;}for(var i=0;i<length;++i){var parsed=parseInt(string.substr(i*2,2),16);if(numberIsNaN(parsed))return i;buf[offset+i]=parsed;}return i;}function utf8Write(buf,string,offset,length){return blitBuffer(utf8ToBytes(string,buf.length-offset),buf,offset,length);}function asciiWrite(buf,string,offset,length){return blitBuffer(asciiToBytes(string),buf,offset,length);}function latin1Write(buf,string,offset,length){return asciiWrite(buf,string,offset,length);}function base64Write(buf,string,offset,length){return blitBuffer(base64ToBytes(string),buf,offset,length);}function ucs2Write(buf,string,offset,length){return blitBuffer(utf16leToBytes(string,buf.length-offset),buf,offset,length);}Buffer.prototype.write=function write(string,offset,length,encoding){// Buffer#write(string)
if(offset===undefined){encoding='utf8';length=this.length;offset=0;// Buffer#write(string, encoding)
}else if(length===undefined&&typeof offset==='string'){encoding=offset;length=this.length;offset=0;// Buffer#write(string, offset[, length][, encoding])
}else if(isFinite(offset)){offset=offset>>>0;if(isFinite(length)){length=length>>>0;if(encoding===undefined)encoding='utf8';}else{encoding=length;length=undefined;}}else{throw new Error('Buffer.write(string, encoding, offset[, length]) is no longer supported');}var remaining=this.length-offset;if(length===undefined||length>remaining)length=remaining;if(string.length>0&&(length<0||offset<0)||offset>this.length){throw new RangeError('Attempt to write outside buffer bounds');}if(!encoding)encoding='utf8';var loweredCase=false;for(;;){switch(encoding){case'hex':return hexWrite(this,string,offset,length);case'utf8':case'utf-8':return utf8Write(this,string,offset,length);case'ascii':return asciiWrite(this,string,offset,length);case'latin1':case'binary':return latin1Write(this,string,offset,length);case'base64':// Warning: maxLength not taken into account in base64Write
return base64Write(this,string,offset,length);case'ucs2':case'ucs-2':case'utf16le':case'utf-16le':return ucs2Write(this,string,offset,length);default:if(loweredCase)throw new TypeError('Unknown encoding: '+encoding);encoding=(''+encoding).toLowerCase();loweredCase=true;}}};Buffer.prototype.toJSON=function toJSON(){return{type:'Buffer',data:Array.prototype.slice.call(this._arr||this,0)};};function base64Slice(buf,start,end){if(start===0&&end===buf.length){return base64.fromByteArray(buf);}else{return base64.fromByteArray(buf.slice(start,end));}}function utf8Slice(buf,start,end){end=Math.min(buf.length,end);var res=[];var i=start;while(i<end){var firstByte=buf[i];var codePoint=null;var bytesPerSequence=firstByte>0xEF?4:firstByte>0xDF?3:firstByte>0xBF?2:1;if(i+bytesPerSequence<=end){var secondByte,thirdByte,fourthByte,tempCodePoint;switch(bytesPerSequence){case 1:if(firstByte<0x80){codePoint=firstByte;}break;case 2:secondByte=buf[i+1];if((secondByte&0xC0)===0x80){tempCodePoint=(firstByte&0x1F)<<0x6|secondByte&0x3F;if(tempCodePoint>0x7F){codePoint=tempCodePoint;}}break;case 3:secondByte=buf[i+1];thirdByte=buf[i+2];if((secondByte&0xC0)===0x80&&(thirdByte&0xC0)===0x80){tempCodePoint=(firstByte&0xF)<<0xC|(secondByte&0x3F)<<0x6|thirdByte&0x3F;if(tempCodePoint>0x7FF&&(tempCodePoint<0xD800||tempCodePoint>0xDFFF)){codePoint=tempCodePoint;}}break;case 4:secondByte=buf[i+1];thirdByte=buf[i+2];fourthByte=buf[i+3];if((secondByte&0xC0)===0x80&&(thirdByte&0xC0)===0x80&&(fourthByte&0xC0)===0x80){tempCodePoint=(firstByte&0xF)<<0x12|(secondByte&0x3F)<<0xC|(thirdByte&0x3F)<<0x6|fourthByte&0x3F;if(tempCodePoint>0xFFFF&&tempCodePoint<0x110000){codePoint=tempCodePoint;}}}}if(codePoint===null){// we did not generate a valid codePoint so insert a
// replacement char (U+FFFD) and advance only 1 byte
codePoint=0xFFFD;bytesPerSequence=1;}else if(codePoint>0xFFFF){// encode to utf16 (surrogate pair dance)
codePoint-=0x10000;res.push(codePoint>>>10&0x3FF|0xD800);codePoint=0xDC00|codePoint&0x3FF;}res.push(codePoint);i+=bytesPerSequence;}return decodeCodePointsArray(res);}// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH=0x1000;function decodeCodePointsArray(codePoints){var len=codePoints.length;if(len<=MAX_ARGUMENTS_LENGTH){return String.fromCharCode.apply(String,codePoints);// avoid extra slice()
}// Decode in chunks to avoid "call stack size exceeded".
var res='';var i=0;while(i<len){res+=String.fromCharCode.apply(String,codePoints.slice(i,i+=MAX_ARGUMENTS_LENGTH));}return res;}function asciiSlice(buf,start,end){var ret='';end=Math.min(buf.length,end);for(var i=start;i<end;++i){ret+=String.fromCharCode(buf[i]&0x7F);}return ret;}function latin1Slice(buf,start,end){var ret='';end=Math.min(buf.length,end);for(var i=start;i<end;++i){ret+=String.fromCharCode(buf[i]);}return ret;}function hexSlice(buf,start,end){var len=buf.length;if(!start||start<0)start=0;if(!end||end<0||end>len)end=len;var out='';for(var i=start;i<end;++i){out+=toHex(buf[i]);}return out;}function utf16leSlice(buf,start,end){var bytes=buf.slice(start,end);var res='';for(var i=0;i<bytes.length;i+=2){res+=String.fromCharCode(bytes[i]+bytes[i+1]*256);}return res;}Buffer.prototype.slice=function slice(start,end){var len=this.length;start=~~start;end=end===undefined?len:~~end;if(start<0){start+=len;if(start<0)start=0;}else if(start>len){start=len;}if(end<0){end+=len;if(end<0)end=0;}else if(end>len){end=len;}if(end<start)end=start;var newBuf=this.subarray(start,end);// Return an augmented `Uint8Array` instance
newBuf.__proto__=Buffer.prototype;return newBuf;};/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */function checkOffset(offset,ext,length){if(offset%1!==0||offset<0)throw new RangeError('offset is not uint');if(offset+ext>length)throw new RangeError('Trying to access beyond buffer length');}Buffer.prototype.readUIntLE=function readUIntLE(offset,byteLength,noAssert){offset=offset>>>0;byteLength=byteLength>>>0;if(!noAssert)checkOffset(offset,byteLength,this.length);var val=this[offset];var mul=1;var i=0;while(++i<byteLength&&(mul*=0x100)){val+=this[offset+i]*mul;}return val;};Buffer.prototype.readUIntBE=function readUIntBE(offset,byteLength,noAssert){offset=offset>>>0;byteLength=byteLength>>>0;if(!noAssert){checkOffset(offset,byteLength,this.length);}var val=this[offset+--byteLength];var mul=1;while(byteLength>0&&(mul*=0x100)){val+=this[offset+--byteLength]*mul;}return val;};Buffer.prototype.readUInt8=function readUInt8(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,1,this.length);return this[offset];};Buffer.prototype.readUInt16LE=function readUInt16LE(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,2,this.length);return this[offset]|this[offset+1]<<8;};Buffer.prototype.readUInt16BE=function readUInt16BE(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,2,this.length);return this[offset]<<8|this[offset+1];};Buffer.prototype.readUInt32LE=function readUInt32LE(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,4,this.length);return(this[offset]|this[offset+1]<<8|this[offset+2]<<16)+this[offset+3]*0x1000000;};Buffer.prototype.readUInt32BE=function readUInt32BE(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,4,this.length);return this[offset]*0x1000000+(this[offset+1]<<16|this[offset+2]<<8|this[offset+3]);};Buffer.prototype.readIntLE=function readIntLE(offset,byteLength,noAssert){offset=offset>>>0;byteLength=byteLength>>>0;if(!noAssert)checkOffset(offset,byteLength,this.length);var val=this[offset];var mul=1;var i=0;while(++i<byteLength&&(mul*=0x100)){val+=this[offset+i]*mul;}mul*=0x80;if(val>=mul)val-=Math.pow(2,8*byteLength);return val;};Buffer.prototype.readIntBE=function readIntBE(offset,byteLength,noAssert){offset=offset>>>0;byteLength=byteLength>>>0;if(!noAssert)checkOffset(offset,byteLength,this.length);var i=byteLength;var mul=1;var val=this[offset+--i];while(i>0&&(mul*=0x100)){val+=this[offset+--i]*mul;}mul*=0x80;if(val>=mul)val-=Math.pow(2,8*byteLength);return val;};Buffer.prototype.readInt8=function readInt8(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,1,this.length);if(!(this[offset]&0x80))return this[offset];return(0xff-this[offset]+1)*-1;};Buffer.prototype.readInt16LE=function readInt16LE(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,2,this.length);var val=this[offset]|this[offset+1]<<8;return val&0x8000?val|0xFFFF0000:val;};Buffer.prototype.readInt16BE=function readInt16BE(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,2,this.length);var val=this[offset+1]|this[offset]<<8;return val&0x8000?val|0xFFFF0000:val;};Buffer.prototype.readInt32LE=function readInt32LE(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,4,this.length);return this[offset]|this[offset+1]<<8|this[offset+2]<<16|this[offset+3]<<24;};Buffer.prototype.readInt32BE=function readInt32BE(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,4,this.length);return this[offset]<<24|this[offset+1]<<16|this[offset+2]<<8|this[offset+3];};Buffer.prototype.readFloatLE=function readFloatLE(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,4,this.length);return ieee754.read(this,offset,true,23,4);};Buffer.prototype.readFloatBE=function readFloatBE(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,4,this.length);return ieee754.read(this,offset,false,23,4);};Buffer.prototype.readDoubleLE=function readDoubleLE(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,8,this.length);return ieee754.read(this,offset,true,52,8);};Buffer.prototype.readDoubleBE=function readDoubleBE(offset,noAssert){offset=offset>>>0;if(!noAssert)checkOffset(offset,8,this.length);return ieee754.read(this,offset,false,52,8);};function checkInt(buf,value,offset,ext,max,min){if(!Buffer.isBuffer(buf))throw new TypeError('"buffer" argument must be a Buffer instance');if(value>max||value<min)throw new RangeError('"value" argument is out of bounds');if(offset+ext>buf.length)throw new RangeError('Index out of range');}Buffer.prototype.writeUIntLE=function writeUIntLE(value,offset,byteLength,noAssert){value=+value;offset=offset>>>0;byteLength=byteLength>>>0;if(!noAssert){var maxBytes=Math.pow(2,8*byteLength)-1;checkInt(this,value,offset,byteLength,maxBytes,0);}var mul=1;var i=0;this[offset]=value&0xFF;while(++i<byteLength&&(mul*=0x100)){this[offset+i]=value/mul&0xFF;}return offset+byteLength;};Buffer.prototype.writeUIntBE=function writeUIntBE(value,offset,byteLength,noAssert){value=+value;offset=offset>>>0;byteLength=byteLength>>>0;if(!noAssert){var maxBytes=Math.pow(2,8*byteLength)-1;checkInt(this,value,offset,byteLength,maxBytes,0);}var i=byteLength-1;var mul=1;this[offset+i]=value&0xFF;while(--i>=0&&(mul*=0x100)){this[offset+i]=value/mul&0xFF;}return offset+byteLength;};Buffer.prototype.writeUInt8=function writeUInt8(value,offset,noAssert){value=+value;offset=offset>>>0;if(!noAssert)checkInt(this,value,offset,1,0xff,0);this[offset]=value&0xff;return offset+1;};Buffer.prototype.writeUInt16LE=function writeUInt16LE(value,offset,noAssert){value=+value;offset=offset>>>0;if(!noAssert)checkInt(this,value,offset,2,0xffff,0);this[offset]=value&0xff;this[offset+1]=value>>>8;return offset+2;};Buffer.prototype.writeUInt16BE=function writeUInt16BE(value,offset,noAssert){value=+value;offset=offset>>>0;if(!noAssert)checkInt(this,value,offset,2,0xffff,0);this[offset]=value>>>8;this[offset+1]=value&0xff;return offset+2;};Buffer.prototype.writeUInt32LE=function writeUInt32LE(value,offset,noAssert){value=+value;offset=offset>>>0;if(!noAssert)checkInt(this,value,offset,4,0xffffffff,0);this[offset+3]=value>>>24;this[offset+2]=value>>>16;this[offset+1]=value>>>8;this[offset]=value&0xff;return offset+4;};Buffer.prototype.writeUInt32BE=function writeUInt32BE(value,offset,noAssert){value=+value;offset=offset>>>0;if(!noAssert)checkInt(this,value,offset,4,0xffffffff,0);this[offset]=value>>>24;this[offset+1]=value>>>16;this[offset+2]=value>>>8;this[offset+3]=value&0xff;return offset+4;};Buffer.prototype.writeIntLE=function writeIntLE(value,offset,byteLength,noAssert){value=+value;offset=offset>>>0;if(!noAssert){var limit=Math.pow(2,8*byteLength-1);checkInt(this,value,offset,byteLength,limit-1,-limit);}var i=0;var mul=1;var sub=0;this[offset]=value&0xFF;while(++i<byteLength&&(mul*=0x100)){if(value<0&&sub===0&&this[offset+i-1]!==0){sub=1;}this[offset+i]=(value/mul>>0)-sub&0xFF;}return offset+byteLength;};Buffer.prototype.writeIntBE=function writeIntBE(value,offset,byteLength,noAssert){value=+value;offset=offset>>>0;if(!noAssert){var limit=Math.pow(2,8*byteLength-1);checkInt(this,value,offset,byteLength,limit-1,-limit);}var i=byteLength-1;var mul=1;var sub=0;this[offset+i]=value&0xFF;while(--i>=0&&(mul*=0x100)){if(value<0&&sub===0&&this[offset+i+1]!==0){sub=1;}this[offset+i]=(value/mul>>0)-sub&0xFF;}return offset+byteLength;};Buffer.prototype.writeInt8=function writeInt8(value,offset,noAssert){value=+value;offset=offset>>>0;if(!noAssert)checkInt(this,value,offset,1,0x7f,-0x80);if(value<0)value=0xff+value+1;this[offset]=value&0xff;return offset+1;};Buffer.prototype.writeInt16LE=function writeInt16LE(value,offset,noAssert){value=+value;offset=offset>>>0;if(!noAssert)checkInt(this,value,offset,2,0x7fff,-0x8000);this[offset]=value&0xff;this[offset+1]=value>>>8;return offset+2;};Buffer.prototype.writeInt16BE=function writeInt16BE(value,offset,noAssert){value=+value;offset=offset>>>0;if(!noAssert)checkInt(this,value,offset,2,0x7fff,-0x8000);this[offset]=value>>>8;this[offset+1]=value&0xff;return offset+2;};Buffer.prototype.writeInt32LE=function writeInt32LE(value,offset,noAssert){value=+value;offset=offset>>>0;if(!noAssert)checkInt(this,value,offset,4,0x7fffffff,-0x80000000);this[offset]=value&0xff;this[offset+1]=value>>>8;this[offset+2]=value>>>16;this[offset+3]=value>>>24;return offset+4;};Buffer.prototype.writeInt32BE=function writeInt32BE(value,offset,noAssert){value=+value;offset=offset>>>0;if(!noAssert)checkInt(this,value,offset,4,0x7fffffff,-0x80000000);if(value<0)value=0xffffffff+value+1;this[offset]=value>>>24;this[offset+1]=value>>>16;this[offset+2]=value>>>8;this[offset+3]=value&0xff;return offset+4;};function checkIEEE754(buf,value,offset,ext,max,min){if(offset+ext>buf.length)throw new RangeError('Index out of range');if(offset<0)throw new RangeError('Index out of range');}function writeFloat(buf,value,offset,littleEndian,noAssert){value=+value;offset=offset>>>0;if(!noAssert){checkIEEE754(buf,value,offset,4,3.4028234663852886e+38,-3.4028234663852886e+38);}ieee754.write(buf,value,offset,littleEndian,23,4);return offset+4;}Buffer.prototype.writeFloatLE=function writeFloatLE(value,offset,noAssert){return writeFloat(this,value,offset,true,noAssert);};Buffer.prototype.writeFloatBE=function writeFloatBE(value,offset,noAssert){return writeFloat(this,value,offset,false,noAssert);};function writeDouble(buf,value,offset,littleEndian,noAssert){value=+value;offset=offset>>>0;if(!noAssert){checkIEEE754(buf,value,offset,8,1.7976931348623157E+308,-1.7976931348623157E+308);}ieee754.write(buf,value,offset,littleEndian,52,8);return offset+8;}Buffer.prototype.writeDoubleLE=function writeDoubleLE(value,offset,noAssert){return writeDouble(this,value,offset,true,noAssert);};Buffer.prototype.writeDoubleBE=function writeDoubleBE(value,offset,noAssert){return writeDouble(this,value,offset,false,noAssert);};// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy=function copy(target,targetStart,start,end){if(!Buffer.isBuffer(target))throw new TypeError('argument should be a Buffer');if(!start)start=0;if(!end&&end!==0)end=this.length;if(targetStart>=target.length)targetStart=target.length;if(!targetStart)targetStart=0;if(end>0&&end<start)end=start;// Copy 0 bytes; we're done
if(end===start)return 0;if(target.length===0||this.length===0)return 0;// Fatal error conditions
if(targetStart<0){throw new RangeError('targetStart out of bounds');}if(start<0||start>=this.length)throw new RangeError('Index out of range');if(end<0)throw new RangeError('sourceEnd out of bounds');// Are we oob?
if(end>this.length)end=this.length;if(target.length-targetStart<end-start){end=target.length-targetStart+start;}var len=end-start;if(this===target&&typeof Uint8Array.prototype.copyWithin==='function'){// Use built-in when available, missing from IE11
this.copyWithin(targetStart,start,end);}else if(this===target&&start<targetStart&&targetStart<end){// descending copy from end
for(var i=len-1;i>=0;--i){target[i+targetStart]=this[i+start];}}else{Uint8Array.prototype.set.call(target,this.subarray(start,end),targetStart);}return len;};// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill=function fill(val,start,end,encoding){// Handle string cases:
if(typeof val==='string'){if(typeof start==='string'){encoding=start;start=0;end=this.length;}else if(typeof end==='string'){encoding=end;end=this.length;}if(encoding!==undefined&&typeof encoding!=='string'){throw new TypeError('encoding must be a string');}if(typeof encoding==='string'&&!Buffer.isEncoding(encoding)){throw new TypeError('Unknown encoding: '+encoding);}if(val.length===1){var code=val.charCodeAt(0);if(encoding==='utf8'&&code<128||encoding==='latin1'){// Fast path: If `val` fits into a single byte, use that numeric value.
val=code;}}}else if(typeof val==='number'){val=val&255;}// Invalid ranges are not set to a default, so can range check early.
if(start<0||this.length<start||this.length<end){throw new RangeError('Out of range index');}if(end<=start){return this;}start=start>>>0;end=end===undefined?this.length:end>>>0;if(!val)val=0;var i;if(typeof val==='number'){for(i=start;i<end;++i){this[i]=val;}}else{var bytes=Buffer.isBuffer(val)?val:Buffer.from(val,encoding);var len=bytes.length;if(len===0){throw new TypeError('The value "'+val+'" is invalid for argument "value"');}for(i=0;i<end-start;++i){this[i+start]=bytes[i%len];}}return this;};// HELPER FUNCTIONS
// ================
var INVALID_BASE64_RE=/[^+/0-9A-Za-z-_]/g;function base64clean(str){// Node takes equal signs as end of the Base64 encoding
str=str.split('=')[0];// Node strips out invalid characters like \n and \t from the string, base64-js does not
str=str.trim().replace(INVALID_BASE64_RE,'');// Node converts strings with length < 2 to ''
if(str.length<2)return'';// Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
while(str.length%4!==0){str=str+'=';}return str;}function toHex(n){if(n<16)return'0'+n.toString(16);return n.toString(16);}function utf8ToBytes(string,units){units=units||Infinity;var codePoint;var length=string.length;var leadSurrogate=null;var bytes=[];for(var i=0;i<length;++i){codePoint=string.charCodeAt(i);// is surrogate component
if(codePoint>0xD7FF&&codePoint<0xE000){// last char was a lead
if(!leadSurrogate){// no lead yet
if(codePoint>0xDBFF){// unexpected trail
if((units-=3)>-1)bytes.push(0xEF,0xBF,0xBD);continue;}else if(i+1===length){// unpaired lead
if((units-=3)>-1)bytes.push(0xEF,0xBF,0xBD);continue;}// valid lead
leadSurrogate=codePoint;continue;}// 2 leads in a row
if(codePoint<0xDC00){if((units-=3)>-1)bytes.push(0xEF,0xBF,0xBD);leadSurrogate=codePoint;continue;}// valid surrogate pair
codePoint=(leadSurrogate-0xD800<<10|codePoint-0xDC00)+0x10000;}else if(leadSurrogate){// valid bmp char, but last char was a lead
if((units-=3)>-1)bytes.push(0xEF,0xBF,0xBD);}leadSurrogate=null;// encode utf8
if(codePoint<0x80){if((units-=1)<0)break;bytes.push(codePoint);}else if(codePoint<0x800){if((units-=2)<0)break;bytes.push(codePoint>>0x6|0xC0,codePoint&0x3F|0x80);}else if(codePoint<0x10000){if((units-=3)<0)break;bytes.push(codePoint>>0xC|0xE0,codePoint>>0x6&0x3F|0x80,codePoint&0x3F|0x80);}else if(codePoint<0x110000){if((units-=4)<0)break;bytes.push(codePoint>>0x12|0xF0,codePoint>>0xC&0x3F|0x80,codePoint>>0x6&0x3F|0x80,codePoint&0x3F|0x80);}else{throw new Error('Invalid code point');}}return bytes;}function asciiToBytes(str){var byteArray=[];for(var i=0;i<str.length;++i){// Node's code seems to be doing this and not & 0x7F..
byteArray.push(str.charCodeAt(i)&0xFF);}return byteArray;}function utf16leToBytes(str,units){var c,hi,lo;var byteArray=[];for(var i=0;i<str.length;++i){if((units-=2)<0)break;c=str.charCodeAt(i);hi=c>>8;lo=c%256;byteArray.push(lo);byteArray.push(hi);}return byteArray;}function base64ToBytes(str){return base64.toByteArray(base64clean(str));}function blitBuffer(src,dst,offset,length){for(var i=0;i<length;++i){if(i+offset>=dst.length||i>=src.length)break;dst[i+offset]=src[i];}return i;}// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance(obj,type){return obj instanceof type||obj!=null&&obj.constructor!=null&&obj.constructor.name!=null&&obj.constructor.name===type.name;}function numberIsNaN(obj){// For IE11 support
return obj!==obj;// eslint-disable-line no-self-compare
}}).call(this);}).call(this,require("buffer").Buffer);},{"base64-js":19,"buffer":22,"ieee754":46}],23:[function(require,module,exports){module.exports={"100":"Continue","101":"Switching Protocols","102":"Processing","200":"OK","201":"Created","202":"Accepted","203":"Non-Authoritative Information","204":"No Content","205":"Reset Content","206":"Partial Content","207":"Multi-Status","208":"Already Reported","226":"IM Used","300":"Multiple Choices","301":"Moved Permanently","302":"Found","303":"See Other","304":"Not Modified","305":"Use Proxy","307":"Temporary Redirect","308":"Permanent Redirect","400":"Bad Request","401":"Unauthorized","402":"Payment Required","403":"Forbidden","404":"Not Found","405":"Method Not Allowed","406":"Not Acceptable","407":"Proxy Authentication Required","408":"Request Timeout","409":"Conflict","410":"Gone","411":"Length Required","412":"Precondition Failed","413":"Payload Too Large","414":"URI Too Long","415":"Unsupported Media Type","416":"Range Not Satisfiable","417":"Expectation Failed","418":"I'm a teapot","421":"Misdirected Request","422":"Unprocessable Entity","423":"Locked","424":"Failed Dependency","425":"Unordered Collection","426":"Upgrade Required","428":"Precondition Required","429":"Too Many Requests","431":"Request Header Fields Too Large","451":"Unavailable For Legal Reasons","500":"Internal Server Error","501":"Not Implemented","502":"Bad Gateway","503":"Service Unavailable","504":"Gateway Timeout","505":"HTTP Version Not Supported","506":"Variant Also Negotiates","507":"Insufficient Storage","508":"Loop Detected","509":"Bandwidth Limit Exceeded","510":"Not Extended","511":"Network Authentication Required"};},{}],24:[function(require,module,exports){'use strict';var GetIntrinsic=require('get-intrinsic');var callBind=require('./');var $indexOf=callBind(GetIntrinsic('String.prototype.indexOf'));module.exports=function callBoundIntrinsic(name,allowMissing){var intrinsic=GetIntrinsic(name,!!allowMissing);if(typeof intrinsic==='function'&&$indexOf(name,'.prototype.')>-1){return callBind(intrinsic);}return intrinsic;};},{"./":25,"get-intrinsic":39}],25:[function(require,module,exports){'use strict';var bind=require('function-bind');var GetIntrinsic=require('get-intrinsic');var $apply=GetIntrinsic('%Function.prototype.apply%');var $call=GetIntrinsic('%Function.prototype.call%');var $reflectApply=GetIntrinsic('%Reflect.apply%',true)||bind.call($call,$apply);var $gOPD=GetIntrinsic('%Object.getOwnPropertyDescriptor%',true);var $defineProperty=GetIntrinsic('%Object.defineProperty%',true);var $max=GetIntrinsic('%Math.max%');if($defineProperty){try{$defineProperty({},'a',{value:1});}catch(e){// IE 8 has a broken defineProperty
$defineProperty=null;}}module.exports=function callBind(originalFunction){var func=$reflectApply(bind,$call,arguments);if($gOPD&&$defineProperty){var desc=$gOPD(func,'length');if(desc.configurable){// original length, plus the receiver, minus any additional arguments (after the receiver)
$defineProperty(func,'length',{value:1+$max(0,originalFunction.length-(arguments.length-1))});}}return func;};var applyBind=function applyBind(){return $reflectApply(bind,$apply,arguments);};if($defineProperty){$defineProperty(module.exports,'apply',{value:applyBind});}else{module.exports.apply=applyBind;}},{"function-bind":36,"get-intrinsic":39}],26:[function(require,module,exports){// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
'use strict';var R=typeof Reflect==='object'?Reflect:null;var ReflectApply=R&&typeof R.apply==='function'?R.apply:function ReflectApply(target,receiver,args){return Function.prototype.apply.call(target,receiver,args);};var ReflectOwnKeys;if(R&&typeof R.ownKeys==='function'){ReflectOwnKeys=R.ownKeys;}else if(Object.getOwnPropertySymbols){ReflectOwnKeys=function ReflectOwnKeys(target){return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));};}else{ReflectOwnKeys=function ReflectOwnKeys(target){return Object.getOwnPropertyNames(target);};}function ProcessEmitWarning(warning){if(console&&console.warn)console.warn(warning);}var NumberIsNaN=Number.isNaN||function NumberIsNaN(value){return value!==value;};function EventEmitter(){EventEmitter.init.call(this);}module.exports=EventEmitter;module.exports.once=once;// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter=EventEmitter;EventEmitter.prototype._events=undefined;EventEmitter.prototype._eventsCount=0;EventEmitter.prototype._maxListeners=undefined;// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners=10;function checkListener(listener){if(typeof listener!=='function'){throw new TypeError('The "listener" argument must be of type Function. Received type '+typeof listener);}}Object.defineProperty(EventEmitter,'defaultMaxListeners',{enumerable:true,get:function(){return defaultMaxListeners;},set:function(arg){if(typeof arg!=='number'||arg<0||NumberIsNaN(arg)){throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received '+arg+'.');}defaultMaxListeners=arg;}});EventEmitter.init=function(){if(this._events===undefined||this._events===Object.getPrototypeOf(this)._events){this._events=Object.create(null);this._eventsCount=0;}this._maxListeners=this._maxListeners||undefined;};// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners=function setMaxListeners(n){if(typeof n!=='number'||n<0||NumberIsNaN(n)){throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received '+n+'.');}this._maxListeners=n;return this;};function _getMaxListeners(that){if(that._maxListeners===undefined)return EventEmitter.defaultMaxListeners;return that._maxListeners;}EventEmitter.prototype.getMaxListeners=function getMaxListeners(){return _getMaxListeners(this);};EventEmitter.prototype.emit=function emit(type){var args=[];for(var i=1;i<arguments.length;i++)args.push(arguments[i]);var doError=type==='error';var events=this._events;if(events!==undefined)doError=doError&&events.error===undefined;else if(!doError)return false;// If there is no 'error' event listener then throw.
if(doError){var er;if(args.length>0)er=args[0];if(er instanceof Error){// Note: The comments on the `throw` lines are intentional, they show
// up in Node's output if this results in an unhandled exception.
throw er;// Unhandled 'error' event
}// At least give some kind of context to the user
var err=new Error('Unhandled error.'+(er?' ('+er.message+')':''));err.context=er;throw err;// Unhandled 'error' event
}var handler=events[type];if(handler===undefined)return false;if(typeof handler==='function'){ReflectApply(handler,this,args);}else{var len=handler.length;var listeners=arrayClone(handler,len);for(var i=0;i<len;++i)ReflectApply(listeners[i],this,args);}return true;};function _addListener(target,type,listener,prepend){var m;var events;var existing;checkListener(listener);events=target._events;if(events===undefined){events=target._events=Object.create(null);target._eventsCount=0;}else{// To avoid recursion in the case that type === "newListener"! Before
// adding it to the listeners, first emit "newListener".
if(events.newListener!==undefined){target.emit('newListener',type,listener.listener?listener.listener:listener);// Re-assign `events` because a newListener handler could have caused the
// this._events to be assigned to a new object
events=target._events;}existing=events[type];}if(existing===undefined){// Optimize the case of one listener. Don't need the extra array object.
existing=events[type]=listener;++target._eventsCount;}else{if(typeof existing==='function'){// Adding the second element, need to change to array.
existing=events[type]=prepend?[listener,existing]:[existing,listener];// If we've already got an array, just append.
}else if(prepend){existing.unshift(listener);}else{existing.push(listener);}// Check for listener leak
m=_getMaxListeners(target);if(m>0&&existing.length>m&&!existing.warned){existing.warned=true;// No error code for this since it is a Warning
// eslint-disable-next-line no-restricted-syntax
var w=new Error('Possible EventEmitter memory leak detected. '+existing.length+' '+String(type)+' listeners '+'added. Use emitter.setMaxListeners() to '+'increase limit');w.name='MaxListenersExceededWarning';w.emitter=target;w.type=type;w.count=existing.length;ProcessEmitWarning(w);}}return target;}EventEmitter.prototype.addListener=function addListener(type,listener){return _addListener(this,type,listener,false);};EventEmitter.prototype.on=EventEmitter.prototype.addListener;EventEmitter.prototype.prependListener=function prependListener(type,listener){return _addListener(this,type,listener,true);};function onceWrapper(){if(!this.fired){this.target.removeListener(this.type,this.wrapFn);this.fired=true;if(arguments.length===0)return this.listener.call(this.target);return this.listener.apply(this.target,arguments);}}function _onceWrap(target,type,listener){var state={fired:false,wrapFn:undefined,target:target,type:type,listener:listener};var wrapped=onceWrapper.bind(state);wrapped.listener=listener;state.wrapFn=wrapped;return wrapped;}EventEmitter.prototype.once=function once(type,listener){checkListener(listener);this.on(type,_onceWrap(this,type,listener));return this;};EventEmitter.prototype.prependOnceListener=function prependOnceListener(type,listener){checkListener(listener);this.prependListener(type,_onceWrap(this,type,listener));return this;};// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener=function removeListener(type,listener){var list,events,position,i,originalListener;checkListener(listener);events=this._events;if(events===undefined)return this;list=events[type];if(list===undefined)return this;if(list===listener||list.listener===listener){if(--this._eventsCount===0)this._events=Object.create(null);else{delete events[type];if(events.removeListener)this.emit('removeListener',type,list.listener||listener);}}else if(typeof list!=='function'){position=-1;for(i=list.length-1;i>=0;i--){if(list[i]===listener||list[i].listener===listener){originalListener=list[i].listener;position=i;break;}}if(position<0)return this;if(position===0)list.shift();else{spliceOne(list,position);}if(list.length===1)events[type]=list[0];if(events.removeListener!==undefined)this.emit('removeListener',type,originalListener||listener);}return this;};EventEmitter.prototype.off=EventEmitter.prototype.removeListener;EventEmitter.prototype.removeAllListeners=function removeAllListeners(type){var listeners,events,i;events=this._events;if(events===undefined)return this;// not listening for removeListener, no need to emit
if(events.removeListener===undefined){if(arguments.length===0){this._events=Object.create(null);this._eventsCount=0;}else if(events[type]!==undefined){if(--this._eventsCount===0)this._events=Object.create(null);else delete events[type];}return this;}// emit removeListener for all listeners on all events
if(arguments.length===0){var keys=Object.keys(events);var key;for(i=0;i<keys.length;++i){key=keys[i];if(key==='removeListener')continue;this.removeAllListeners(key);}this.removeAllListeners('removeListener');this._events=Object.create(null);this._eventsCount=0;return this;}listeners=events[type];if(typeof listeners==='function'){this.removeListener(type,listeners);}else if(listeners!==undefined){// LIFO order
for(i=listeners.length-1;i>=0;i--){this.removeListener(type,listeners[i]);}}return this;};function _listeners(target,type,unwrap){var events=target._events;if(events===undefined)return[];var evlistener=events[type];if(evlistener===undefined)return[];if(typeof evlistener==='function')return unwrap?[evlistener.listener||evlistener]:[evlistener];return unwrap?unwrapListeners(evlistener):arrayClone(evlistener,evlistener.length);}EventEmitter.prototype.listeners=function listeners(type){return _listeners(this,type,true);};EventEmitter.prototype.rawListeners=function rawListeners(type){return _listeners(this,type,false);};EventEmitter.listenerCount=function(emitter,type){if(typeof emitter.listenerCount==='function'){return emitter.listenerCount(type);}else{return listenerCount.call(emitter,type);}};EventEmitter.prototype.listenerCount=listenerCount;function listenerCount(type){var events=this._events;if(events!==undefined){var evlistener=events[type];if(typeof evlistener==='function'){return 1;}else if(evlistener!==undefined){return evlistener.length;}}return 0;}EventEmitter.prototype.eventNames=function eventNames(){return this._eventsCount>0?ReflectOwnKeys(this._events):[];};function arrayClone(arr,n){var copy=new Array(n);for(var i=0;i<n;++i)copy[i]=arr[i];return copy;}function spliceOne(list,index){for(;index+1<list.length;index++)list[index]=list[index+1];list.pop();}function unwrapListeners(arr){var ret=new Array(arr.length);for(var i=0;i<ret.length;++i){ret[i]=arr[i].listener||arr[i];}return ret;}function once(emitter,name){return new Promise(function(resolve,reject){function errorListener(err){emitter.removeListener(name,resolver);reject(err);}function resolver(){if(typeof emitter.removeListener==='function'){emitter.removeListener('error',errorListener);}resolve([].slice.call(arguments));};eventTargetAgnosticAddListener(emitter,name,resolver,{once:true});if(name!=='error'){addErrorHandlerIfEventEmitter(emitter,errorListener,{once:true});}});}function addErrorHandlerIfEventEmitter(emitter,handler,flags){if(typeof emitter.on==='function'){eventTargetAgnosticAddListener(emitter,'error',handler,flags);}}function eventTargetAgnosticAddListener(emitter,name,listener,flags){if(typeof emitter.on==='function'){if(flags.once){emitter.once(name,listener);}else{emitter.on(name,listener);}}else if(typeof emitter.addEventListener==='function'){// EventTarget does not have `error` event semantics like Node
// EventEmitters, we do not listen for `error` events here.
emitter.addEventListener(name,function wrapListener(arg){// IE does not have builtin `{ once: true }` support so we
// have to do it manually.
if(flags.once){emitter.removeEventListener(name,wrapListener);}listener(arg);});}else{throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type '+typeof emitter);}}},{}],27:[function(require,module,exports){'use strict';var isCallable=require('is-callable');var toStr=Object.prototype.toString;var hasOwnProperty=Object.prototype.hasOwnProperty;var forEachArray=function forEachArray(array,iterator,receiver){for(var i=0,len=array.length;i<len;i++){if(hasOwnProperty.call(array,i)){if(receiver==null){iterator(array[i],i,array);}else{iterator.call(receiver,array[i],i,array);}}}};var forEachString=function forEachString(string,iterator,receiver){for(var i=0,len=string.length;i<len;i++){// no such thing as a sparse string.
if(receiver==null){iterator(string.charAt(i),i,string);}else{iterator.call(receiver,string.charAt(i),i,string);}}};var forEachObject=function forEachObject(object,iterator,receiver){for(var k in object){if(hasOwnProperty.call(object,k)){if(receiver==null){iterator(object[k],k,object);}else{iterator.call(receiver,object[k],k,object);}}}};var forEach=function forEach(list,iterator,thisArg){if(!isCallable(iterator)){throw new TypeError('iterator must be a function');}var receiver;if(arguments.length>=3){receiver=thisArg;}if(toStr.call(list)==='[object Array]'){forEachArray(list,iterator,receiver);}else if(typeof list==='string'){forEachString(list,iterator,receiver);}else{forEachObject(list,iterator,receiver);}};module.exports=forEach;},{"is-callable":49}],28:[function(require,module,exports){/**
* FoxHound Query Generation Library
* @license MIT
* @author Steven Velozo <steven@velozo.com>
*/ // Load our base parameters skeleton object
const baseParameters=require('./Parameters.js');var FoxHound=function(){function createNew(pFable,pFromParameters){// If a valid Fable object isn't passed in, return a constructor
if(typeof pFable!=='object'||!('fable'in pFable)){return{new:createNew};}var _Fable=pFable;// The default parameters config object, used as a template for all new
// queries created from this query.
var _DefaultParameters=typeof pFromParameters==='undefined'?{}:pFromParameters;// The parameters config object for the current query.  This is the only
// piece of internal state that is important to operation.
var _Parameters=false;var _Dialects=require('./Foxhound-Dialects.js');// The unique identifier for a query
var _UUID=_Fable.getUUID();// The log level, for debugging chattiness.
var _LogLevel=0;// The dialect to use when generating queries
var _Dialect=false;/**
		* Clone the current FoxHound Query into a new Query object, copying all
		* parameters as the new default.  Clone also copies the log level.
		*
		* @method clone
		* @return {Object} Returns a cloned Query.  This is still chainable.
		*/var clone=function(){var tmpFoxHound=createNew(_Fable,baseParameters).setScope(_Parameters.scope).setBegin(_Parameters.begin).setCap(_Parameters.cap);// Schema is the only part of a query that carries forward.
tmpFoxHound.query.schema=_Parameters.query.schema;if(_Parameters.dataElements){tmpFoxHound.parameters.dataElements=_Parameters.dataElements.slice();// Copy the array of dataElements
}if(_Parameters.sort){tmpFoxHound.parameters.sort=_Parameters.sort.slice();// Copy the sort array.
// TODO: Fix the side affect nature of these being objects in the array .. they are technically clones of the previous.
}if(_Parameters.filter){tmpFoxHound.parameters.filter=_Parameters.filter.slice();// Copy the filter array.
// TODO: Fix the side affect nature of these being objects in the array .. they are technically clones of the previous.
}return tmpFoxHound;};/**
		* Reset the parameters of the FoxHound Query to the Default.  Default
		* parameters were set during object construction.
		*
		* @method resetParameters
		* @return {Object} Returns the current Query for chaining.
		*/var resetParameters=function(){_Parameters=_Fable.Utility.extend({},baseParameters,_DefaultParameters);_Parameters.query={disableAutoIdentity:false,disableAutoDateStamp:false,disableAutoUserStamp:false,disableDeleteTracking:false,body:false,schema:false,// The schema to intersect with our records
IDUser:0,// The user to stamp into records
UUID:_Fable.getUUID(),// A UUID for this record
records:false,// The records to be created or changed
parameters:{}};_Parameters.result={executed:false,// True once we've run a query.
value:false,// The return value of the last query run
// Updated below due to changes in how Async.js responds to a false value here
error:undefined// The error message of the last run query
};return this;};resetParameters();/**
		* Reset the parameters of the FoxHound Query to the Default.  Default
		* parameters were set during object construction.
		*
		* @method mergeParameters
		* @param {Object} pFromParameters A Parameters Object to merge from
		* @return {Object} Returns the current Query for chaining.
		*/var mergeParameters=function(pFromParameters){_Parameters=_Fable.Utility.extend({},_Parameters,pFromParameters);return this;};/**
		* Set the the Logging level.
		*
		* The log levels are:
		*    0  -  Don't log anything
		*    1  -  Log queries
		*    2  -  Log queries and non-parameterized queries
		*    3  -  Log everything
		*
		* @method setLogLevel
		* @param {Number} pLogLevel The log level for our object
		* @return {Object} Returns the current Query for chaining.
		*/var setLogLevel=function(pLogLevel){var tmpLogLevel=0;if(typeof pLogLevel==='number'&&pLogLevel%1===0){tmpLogLevel=pLogLevel;}_LogLevel=tmpLogLevel;return this;};/**
		* Set the Scope for the Query.  *Scope* is the source for the data being
		* pulled.  In TSQL this would be the _table_, whereas in MongoDB this
		* would be the _collection_.
		*
		* A scope can be either a string, or an array (for JOINs and such).
		*
		* @method setScope
		* @param {String} pScope A Scope for the Query.
		* @return {Object} Returns the current Query for chaining.
		*/var setScope=function(pScope){var tmpScope=false;if(typeof pScope==='string'){tmpScope=pScope;}else if(pScope!==false){_Fable.log.error('Scope set failed.  You must pass in a string or array.',{queryUUID:_UUID,parameters:_Parameters,invalidScope:pScope});}_Parameters.scope=tmpScope;if(_LogLevel>2){_Fable.log.info('Scope set: '+tmpScope,{queryUUID:_UUID,parameters:_Parameters});}return this;};/**
		* Set whether the query returns DISTINCT results.
		* For count queries, returns the distinct for the selected fields, or all fields in the base table by default.
		*
		* @method setDistinct
		* @param {Boolean} pDistinct True if the query should be distinct.
		* @return {Object} Returns the current Query for chaining.
		*/var setDistinct=function(pDistinct){_Parameters.distinct=!!pDistinct;if(_LogLevel>2){_Fable.log.info('Distinct set: '+_Parameters.distinct,{queryUUID:_UUID,parameters:_Parameters});}return this;};/**
		* Set the Data Elements for the Query.  *Data Elements* are the fields
		* being pulled by the query.  In TSQL this would be the _columns_,
		* whereas in MongoDB this would be the _fields_.
		*
		* The passed values can be either a string, or an array.
		*
		* @method setDataElements
		* @param {String} pDataElements The Data Element(s) for the Query.
		* @return {Object} Returns the current Query for chaining.
		*/var setDataElements=function(pDataElements){var tmpDataElements=false;if(Array.isArray(pDataElements)){// TODO: Check each entry of the array are all strings
tmpDataElements=pDataElements;}if(typeof pDataElements==='string'){tmpDataElements=[pDataElements];}_Parameters.dataElements=tmpDataElements;if(_LogLevel>2){_Fable.log.info('Data Elements set',{queryUUID:_UUID,parameters:_Parameters});}return this;};/**
		* Set the sort data element
		*
		* The passed values can be either a string, an object or an array of objects.
		*
		* The Sort object has two values:
		* {Column:'Birthday', Direction:'Ascending'}
		*
		* @method setSort
		* @param {String} pSort The sort criteria(s) for the Query.
		* @return {Object} Returns the current Query for chaining.
		*/var setSort=function(pSort){var tmpSort=false;if(Array.isArray(pSort)){// TODO: Check each entry of the array are all conformant sort objects
tmpSort=pSort;}else if(typeof pSort==='string'){// Default to ascending
tmpSort=[{Column:pSort,Direction:'Ascending'}];}else if(typeof pSort==='object'){// TODO: Check that this sort entry conforms to a sort entry
tmpSort=[pSort];}_Parameters.sort=tmpSort;if(_LogLevel>2){_Fable.log.info('Sort set',{queryUUID:_UUID,parameters:_Parameters});}return this;};/**
		* Set the join data element
		*
		* The passed values can be either an object or an array of objects.
		*
		* The join object has four values:
		* {Type:'INNER JOIN', Table:'Test', From:'Test.ID', To:'Scope.IDItem'}
		*
		* @method setJoin
		* @param {Object} pJoin The join criteria(s) for the Query.
		* @return {Object} Returns the current Query for chaining.
		*/var setJoin=function(pJoin){_Parameters.join=[];if(Array.isArray(pJoin)){pJoin.forEach(function(join){addJoin(join.Table,join.From,join.To,join.Type);});}else if(typeof pJoin==='object'){addJoin(pJoin.Table,pJoin.From,pJoin.To,pJoin.Type);}return this;};/**
		* Add a sort data element
		*
		* The passed values can be either a string, an object or an array of objects.
		*
		* The Sort object has two values:
		* {Column:'Birthday', Direction:'Ascending'}
		*
		* @method setSort
		* @param {String} pSort The sort criteria to add to the Query.
		* @return {Object} Returns the current Query for chaining.
		*/var addSort=function(pSort){var tmpSort=false;if(typeof pSort==='string'){// Default to ascending
tmpSort={Column:pSort,Direction:'Ascending'};}if(typeof pSort==='object'){// TODO: Check that this sort entry conforms to a sort entry
tmpSort=pSort;}if(!_Parameters.sort){_Parameters.sort=[];}_Parameters.sort.push(tmpSort);if(_LogLevel>2){_Fable.log.info('Sort set',{queryUUID:_UUID,parameters:_Parameters});}return this;};/**
		* Set the the Begin index for the Query.  *Begin* is the index at which
		* a query should start returning rows.  In TSQL this would be the n
		* parameter of ```LIMIT 1,n```, whereas in MongoDB this would be the
		* n in ```skip(n)```.
		*
		* The passed value must be an Integer >= 0.
		*
		* @method setBegin
		* @param {Number} pBeginAmount The index to begin returning Query data.
		* @return {Object} Returns the current Query for chaining.
		*/var setBegin=function(pBeginAmount){var tmpBegin=false;// Test if it is an integer > -1
// http://jsperf.com/numbers-and-integers
if(typeof pBeginAmount==='number'&&pBeginAmount%1===0&&pBeginAmount>=0){tmpBegin=pBeginAmount;}else if(pBeginAmount!==false){_Fable.log.error('Begin set failed; non-positive or non-numeric argument.',{queryUUID:_UUID,parameters:_Parameters,invalidBeginAmount:pBeginAmount});}_Parameters.begin=tmpBegin;if(_LogLevel>2){_Fable.log.info('Begin set: '+pBeginAmount,{queryUUID:_UUID,parameters:_Parameters});}return this;};/**
		* Set the the Cap for the Query.  *Cap* is the maximum number of records
		* a Query should return in a set.  In TSQL this would be the n
		* parameter of ```LIMIT n```, whereas in MongoDB this would be the
		* n in ```limit(n)```.
		*
		* The passed value must be an Integer >= 0.
		*
		* @method setCap
		* @param {Number} pCapAmount The maximum records for the Query set.
		* @return {Object} Returns the current Query for chaining.
		*/var setCap=function(pCapAmount){var tmpCapAmount=false;if(typeof pCapAmount==='number'&&pCapAmount%1===0&&pCapAmount>=0){tmpCapAmount=pCapAmount;}else if(pCapAmount!==false){_Fable.log.error('Cap set failed; non-positive or non-numeric argument.',{queryUUID:_UUID,parameters:_Parameters,invalidCapAmount:pCapAmount});}_Parameters.cap=tmpCapAmount;if(_LogLevel>2){_Fable.log.info('Cap set to: '+tmpCapAmount,{queryUUID:_UUID,parameters:_Parameters});}return this;};/**
		* Set the filter expression
		*
		* The passed values can be either an object or an array of objects.
		*
		* The Filter object has a minimum of two values (which expands to the following):
		* {Column:'Name', Value:'John'}
		* {Column:'Name', Operator:'EQ', Value:'John', Connector:'And', Parameter:'Name'}
		*
		* @method setFilter
		* @param {String} pFilter The filter(s) for the Query.
		* @return {Object} Returns the current Query for chaining.
		*/var setFilter=function(pFilter){var tmpFilter=false;if(Array.isArray(pFilter)){// TODO: Check each entry of the array are all conformant Filter objects
tmpFilter=pFilter;}else if(typeof pFilter==='object'){// TODO: Check that this Filter entry conforms to a Filter entry
tmpFilter=[pFilter];}_Parameters.filter=tmpFilter;if(_LogLevel>2){_Fable.log.info('Filter set',{queryUUID:_UUID,parameters:_Parameters});}return this;};/**
		* Add a filter expression
		*
		* {Column:'Name', Operator:'EQ', Value:'John', Connector:'And', Parameter:'Name'}
		*
		* @method addFilter
		* @return {Object} Returns the current Query for chaining.
		*/var addFilter=function(pColumn,pValue,pOperator,pConnector,pParameter){if(typeof pColumn!=='string'){_Fable.log.warn('Tried to add an invalid query filter column',{queryUUID:_UUID,parameters:_Parameters});return this;}if(typeof pValue==='undefined'){_Fable.log.warn('Tried to add an invalid query filter value',{queryUUID:_UUID,parameters:_Parameters,invalidColumn:pColumn});return this;}var tmpOperator=typeof pOperator==='undefined'?'=':pOperator;var tmpConnector=typeof pConnector==='undefined'?'AND':pConnector;var tmpParameter=typeof pParameter==='undefined'?pColumn:pParameter;//support table.field notation (mysql2 requires this)
tmpParameter=tmpParameter.replace('.','_');var tmpFilter={Column:pColumn,Operator:tmpOperator,Value:pValue,Connector:tmpConnector,Parameter:tmpParameter};if(!Array.isArray(_Parameters.filter)){_Parameters.filter=[tmpFilter];}else{_Parameters.filter.push(tmpFilter);}if(_LogLevel>2){_Fable.log.info('Added a filter',{queryUUID:_UUID,parameters:_Parameters,newFilter:tmpFilter});}return this;};/**
		* Add a join expression
		*
		* {Type:'INNER JOIN', Table:'Test', From:'Test.ID', To:'Scope.IDItem'}
		*
		* @method addJoin
		* @return {Object} Returns the current Query for chaining.
		*/var addJoin=function(pTable,pFrom,pTo,pType){if(typeof pTable!=='string'){_Fable.log.warn('Tried to add an invalid query join table',{queryUUID:_UUID,parameters:_Parameters});return this;}if(typeof pFrom==='undefined'||typeof pTo==='undefined'){_Fable.log.warn('Tried to add an invalid query join field',{queryUUID:_UUID,parameters:_Parameters});return this;}//sanity check the join fields
if(pFrom.indexOf(pTable)!=0){_Fable.log.warn('Tried to add an invalid query join field, join must come FROM the join table!',{queryUUID:_UUID,parameters:_Parameters,invalidField:pFrom});return this;}if(pTo.indexOf('.')<=0){_Fable.log.warn('Tried to add an invalid query join field, join must go TO a field on another table ([table].[field])!',{queryUUID:_UUID,parameters:_Parameters,invalidField:pTo});return this;}var tmpType=typeof pType==='undefined'?'INNER JOIN':pType;var tmpJoin={Type:tmpType,Table:pTable,From:pFrom,To:pTo};if(!Array.isArray(_Parameters.join)){_Parameters.join=[tmpJoin];}else{_Parameters.join.push(tmpJoin);}if(_LogLevel>2){_Fable.log.info('Added a join',{queryUUID:_UUID,parameters:_Parameters});}return this;};/**
		* Add a record (for UPDATE and INSERT)
		*
		*
		* @method addRecord
		* @param {Object} pRecord The record to add.
		* @return {Object} Returns the current Query for chaining.
		*/var addRecord=function(pRecord){if(typeof pRecord!=='object'){_Fable.log.warn('Tried to add an invalid record to the query -- records must be an object',{queryUUID:_UUID,parameters:_Parameters});return this;}if(!Array.isArray(_Parameters.query.records)){_Parameters.query.records=[pRecord];}else{_Parameters.query.records.push(pRecord);}if(_LogLevel>2){_Fable.log.info('Added a record to the query',{queryUUID:_UUID,parameters:_Parameters,newRecord:pRecord});}return this;};/**
		* Set the Dialect for Query generation.
		*
		* This function expects a string, case sensitive, which matches both the
		* folder and filename
		*
		* @method setDialect
		* @param {String} pDialectName The dialect for query generation.
		* @return {Object} Returns the current Query for chaining.
		*/var setDialect=function(pDialectName){if(typeof pDialectName!=='string'){_Fable.log.warn('Dialect set to English - invalid name',{queryUUID:_UUID,parameters:_Parameters,invalidDialect:pDialectName});return setDialect('English');}if(_Dialects.hasOwnProperty(pDialectName)){_Dialect=_Dialects[pDialectName](_Fable);if(_LogLevel>2){_Fable.log.info('Dialog set to: '+pDialectName,{queryUUID:_UUID,parameters:_Parameters});}}else{_Fable.log.error('Dialect not set - unknown dialect "'+pDialectName+"'",{queryUUID:_UUID,parameters:_Parameters,invalidDialect:pDialectName});setDialect('English');}return this;};/**
		* User to use for this query
		*
		* @method setIDUser
		*/var setIDUser=function(pIDUser){var tmpUserID=0;if(typeof pIDUser==='number'&&pIDUser%1===0&&pIDUser>=0){tmpUserID=pIDUser;}else if(pIDUser!==false){_Fable.log.error('User set failed; non-positive or non-numeric argument.',{queryUUID:_UUID,parameters:_Parameters,invalidIDUser:pIDUser});}_Parameters.userID=tmpUserID;_Parameters.query.IDUser=tmpUserID;if(_LogLevel>2){_Fable.log.info('IDUser set to: '+tmpUserID,{queryUUID:_UUID,parameters:_Parameters});}return this;};/**
		* Flag to disable auto identity
		*
		* @method setDisableAutoIdentity
		*/var setDisableAutoIdentity=function(pFlag){_Parameters.query.disableAutoIdentity=pFlag;return this;//chainable
};/**
		* Flag to disable auto datestamp
		*
		* @method setDisableAutoDateStamp
		*/var setDisableAutoDateStamp=function(pFlag){_Parameters.query.disableAutoDateStamp=pFlag;return this;//chainable
};/**
		* Flag to disable auto userstamp
		*
		* @method setDisableAutoUserStamp
		*/var setDisableAutoUserStamp=function(pFlag){_Parameters.query.disableAutoUserStamp=pFlag;return this;//chainable
};/**
		* Flag to disable delete tracking
		*
		* @method setDisableDeleteTracking
		*/var setDisableDeleteTracking=function(pFlag){_Parameters.query.disableDeleteTracking=pFlag;return this;//chainable
};/**
		* Check that a valid Dialect has been set
		*
		* If there has not been a dialect set, it defaults to English.
		* TODO: Have the json configuration define a "default" dialect.
		*
		* @method checkDialect
		*/var checkDialect=function(){if(_Dialect===false){setDialect('English');}};var buildCreateQuery=function(){checkDialect();_Parameters.query.body=_Dialect.Create(_Parameters);return this;};var buildReadQuery=function(){checkDialect();_Parameters.query.body=_Dialect.Read(_Parameters);return this;};var buildUpdateQuery=function(){checkDialect();_Parameters.query.body=_Dialect.Update(_Parameters);return this;};var buildDeleteQuery=function(){checkDialect();_Parameters.query.body=_Dialect.Delete(_Parameters);return this;};var buildUndeleteQuery=function(){checkDialect();_Parameters.query.body=_Dialect.Undelete(_Parameters);return this;};var buildCountQuery=function(){checkDialect();_Parameters.query.body=_Dialect.Count(_Parameters);return this;};/**
		* Container Object for our Factory Pattern
		*/var tmpNewFoxHoundObject={resetParameters:resetParameters,mergeParameters:mergeParameters,setLogLevel:setLogLevel,setScope:setScope,setDistinct:setDistinct,setIDUser:setIDUser,setDataElements:setDataElements,setBegin:setBegin,setCap:setCap,setFilter:setFilter,addFilter:addFilter,setSort:setSort,addSort:addSort,setJoin:setJoin,addJoin:addJoin,addRecord:addRecord,setDisableAutoIdentity:setDisableAutoIdentity,setDisableAutoDateStamp:setDisableAutoDateStamp,setDisableAutoUserStamp:setDisableAutoUserStamp,setDisableDeleteTracking:setDisableDeleteTracking,setDialect:setDialect,buildCreateQuery:buildCreateQuery,buildReadQuery:buildReadQuery,buildUpdateQuery:buildUpdateQuery,buildDeleteQuery:buildDeleteQuery,buildUndeleteQuery:buildUndeleteQuery,buildCountQuery:buildCountQuery,clone:clone,new:createNew};/**
		 * Query
		 *
		 * @property query
		 * @type Object
		 */Object.defineProperty(tmpNewFoxHoundObject,'query',{get:function(){return _Parameters.query;},set:function(pQuery){_Parameters.query=pQuery;},enumerable:true});/**
		 * Result
		 *
		 * @property result
		 * @type Object
		 */Object.defineProperty(tmpNewFoxHoundObject,'result',{get:function(){return _Parameters.result;},set:function(pResult){_Parameters.result=pResult;},enumerable:true});/**
		 * Query Parameters
		 *
		 * @property parameters
		 * @type Object
		 */Object.defineProperty(tmpNewFoxHoundObject,'parameters',{get:function(){return _Parameters;},set:function(pParameters){_Parameters=pParameters;},enumerable:true});/**
		 * Dialect
		 *
		 * @property dialect
		 * @type Object
		 */Object.defineProperty(tmpNewFoxHoundObject,'dialect',{get:function(){return _Dialect;},enumerable:true});/**
		 * Universally Unique Identifier
		 *
		 * @property uuid
		 * @type String
		 */Object.defineProperty(tmpNewFoxHoundObject,'uuid',{get:function(){return _UUID;},enumerable:true});/**
		 * Log Level
		 *
		 * @property logLevel
		 * @type Integer
		 */Object.defineProperty(tmpNewFoxHoundObject,'logLevel',{get:function(){return _LogLevel;},enumerable:true});return tmpNewFoxHoundObject;}return createNew();};module.exports=FoxHound();},{"./Foxhound-Dialects.js":29,"./Parameters.js":30}],29:[function(require,module,exports){getDialects=()=>{let tmpDialects={};tmpDialects.ALASQL=require('./dialects/ALASQL/FoxHound-Dialect-ALASQL.js');tmpDialects.English=require('./dialects/English/FoxHound-Dialect-English.js');tmpDialects.MeadowEndpoints=require('./dialects/MeadowEndpoints/FoxHound-Dialect-MeadowEndpoints.js');tmpDialects.MySQL=require('./dialects/MySQL/FoxHound-Dialect-MySQL.js');tmpDialects.default=tmpDialects.English;return tmpDialects;};module.exports=getDialects();},{"./dialects/ALASQL/FoxHound-Dialect-ALASQL.js":31,"./dialects/English/FoxHound-Dialect-English.js":32,"./dialects/MeadowEndpoints/FoxHound-Dialect-MeadowEndpoints.js":33,"./dialects/MySQL/FoxHound-Dialect-MySQL.js":34}],30:[function(require,module,exports){/**
* Query Parameters Object
*
* @class FoxHoundQueryParameters
* @constructor
*/var FoxHoundQueryParameters={scope:false,// STR: The scope of the data
// TSQL: the "Table" or "View"
// MongoDB: the "Collection"
dataElements:false,// ARR of STR: The data elements to return
// TSQL: the "Columns"
// MongoDB: the "Fields"
begin:false,// INT: Record index to start at
// TSQL: n in LIMIT 1,n
// MongoDB: n in Skip(n)
cap:false,// INT: Maximum number of records to return
// TSQL: n in LIMIT n
// MongoDB: n in limit(n)
// Serialization example for a query:
// Take the filter and return an array of filter instructions
// Basic instruction anatomy:
//       INSTRUCTION~FIELD~OPERATOR~VALUE
// FOP - Filter Open Paren
//       FOP~~(~
// FCP - Filter Close Paren
//       FCP~~)~
// FBV - Filter By Value
//       FBV~Category~EQ~Books
//       Possible comparisons:
//       * EQ - Equals To (=)
//       * NE - Not Equals To (!=)
//       * GT - Greater Than (>)
//       * GE - Greater Than or Equals To (>=)
//       * LT - Less Than (<)
//       * LE - Less Than or Equals To (<=)
//       * LK - Like (Like)
// FBL - Filter By List (value list, separated by commas)
//       FBL~Category~EQ~Books,Movies
// FSF - Filter Sort Field
//       FSF~Category~ASC~0
//       FSF~Category~DESC~0
// FCC - Filter Constraint Cap (the limit of what is returned)
//       FCC~~10~
// FCB - Filter Constraint Begin (the zero-based start index of what is returned)
//       FCB~~10~
//
// This means: FBV~Category~EQ~Books~FBV~PublishedYear~GT~2000~FSF~PublishedYear~DESC~0
//             Filters down to ALL BOOKS PUBLISHED AFTER 2000 IN DESCENDING ORDER
filter:false,// ARR of OBJ: Data filter expression list {Column:'Name', Operator:'EQ', Value:'John', Connector:'And', Parameter:'Name'}
// TSQL: the WHERE clause
// MongoDB: a find() expression
sort:false,// ARR of OBJ: The sort order    {Column:'Birthday', Direction:'Ascending'}
// TSQL: ORDER BY
// MongoDB: sort()
join:false,// ARR of OBJ: The join tables    {Type:'INNER JOIN', Table:'test', From: 'Test.ID', To: 'Scope.IDItem' }
// TSQL: JOIN
// Force a specific query to run regardless of above ... this is used to override the query generator.
queryOverride:false,// Where the generated query goes
query:false,/*
			{
				body: false,
				schema: false,   // The schema to intersect with our records
				IDUser: 0,       // The User ID to stamp into records
				UUID: A_UUID,    // Some globally unique record id, different per cloned query.
				records: false,  // The records to be created or changed
				parameters: {}
			}
		*/ // Who is making the query
userID:0,// Where the query results are stuck
result:false/*
			{
				executed: false, // True once we've run a query.
				value: false,    // The return value of the last query run
				error: false     // The error message of the last run query
			}
		*/};module.exports=FoxHoundQueryParameters;},{}],31:[function(require,module,exports){/**
* FoxHound ALASQL Dialect
*
* @license MIT
*
* For an ALASQL query override:
// An underscore template with the following values:
//      <%= DataElements %> = Field1, Field2, Field3, Field4
//      <%= Begin %>        = 0
//      <%= Cap %>          = 10
//      <%= Filter %>       = WHERE StartDate > :MyStartDate
//      <%= Sort %>         = ORDER BY Field1
// The values are empty strings if they aren't set.
*
* @author Steven Velozo <steven@velozo.com>
* @class FoxHoundDialectALASQL
*/var FoxHoundDialectALASQL=function(pFable){//Request time from SQL server with microseconds resolution
const SQL_NOW="NOW(3)";_Fable=pFable;/**
	* Generate a table name from the scope.
	*
	* Because ALASQL is all in-memory, and can be run in two modes (anonymous
	* working on arrays or table-based) we are going to make this a programmable
	* value.  Then we can share the code across both providers.
	*
	* @method: generateTableName
	* @param: {Object} pParameters SQL Query Parameters
	* @return: {String} Returns the table name clause
	*/var generateTableName=function(pParameters){return' '+pParameters.scope;};/**
	* Escape columns, because ALASQL has more reserved KWs than most SQL dialects
	*/var escapeColumn=(pColumn,pParameters)=>{if(pColumn.indexOf('.')<0){return'`'+pColumn+'`';}else{// This could suck if the scope is not the same
var tmpTableName=pParameters.scope;if(pColumn.indexOf(tmpTableName+'.')>-1){return'`'+pColumn.replace(tmpTableName+'.','')+'`';}else{// This doesn't work well but we'll try it.
return'`'+pColumn+'`';}}};/**
	* Generate a field list from the array of dataElements
	*
	* Each entry in the dataElements is a simple string
	*
	* @method: generateFieldList
	* @param: {Object} pParameters SQL Query Parameters
	* @param {Boolean} pIsForCountClause (optional) If true, generate fields for use within a count clause.
	* @return: {String} Returns the field list clause, or empty string if explicit fields are requested but cannot be fulfilled
	*          due to missing schema.
	*/var generateFieldList=function(pParameters,pIsForCountClause){var tmpDataElements=pParameters.dataElements;if(!Array.isArray(tmpDataElements)||tmpDataElements.length<1){if(!pIsForCountClause){return' *';}// we need to list all of the table fields explicitly; get them from the schema
const tmpSchema=Array.isArray(pParameters.query.schema)?pParameters.query.schema:[];if(tmpSchema.length<1){// this means we have no schema; returning an empty string here signals the calling code to handle this case
return'';}const idColumn=tmpSchema.find(entry=>entry.Type==='AutoIdentity');if(!idColumn){// this means there is no autoincrementing unique ID column; treat as above
return'';}return` ${idColumn.Column}`;}var tmpFieldList=' ';for(var i=0;i<tmpDataElements.length;i++){if(i>0){tmpFieldList+=', ';}tmpFieldList+=escapeColumn(tmpDataElements[i],pParameters);}return tmpFieldList;};/**
	* Generate a query from the array of where clauses
	*
	* Each clause is an object like:
		{
			Column:'Name',
			Operator:'EQ',
			Value:'John',
			Connector:'And',
			Parameter:'Name'
		}
	*
	* @method: generateWhere
	* @param: {Object} pParameters SQL Query Parameters
	* @return: {String} Returns the WHERE clause prefixed with WHERE, or an empty string if unnecessary
	*/var generateWhere=function(pParameters){var tmpFilter=Array.isArray(pParameters.filter)?pParameters.filter:[];var tmpTableName=generateTableName(pParameters).trim();if(!pParameters.query.disableDeleteTracking){// Check if there is a Deleted column on the Schema. If so, we add this to the filters automatically (if not already present)
var tmpSchema=Array.isArray(pParameters.query.schema)?pParameters.query.schema:[];for(var i=0;i<tmpSchema.length;i++){// There is a schema entry for it.  Process it accordingly.
var tmpSchemaEntry=tmpSchema[i];if(tmpSchemaEntry.Type==='Deleted'){var tmpHasDeletedParameter=false;//first, check to see if filters are already looking for Deleted column
if(tmpFilter.length>0){for(var x=0;x<tmpFilter.length;x++){if(tmpFilter[x].Column===tmpSchemaEntry.Column){tmpHasDeletedParameter=true;break;}}}if(!tmpHasDeletedParameter){//if not, we need to add it
tmpFilter.push({Column:tmpTableName+'.'+tmpSchemaEntry.Column,Operator:'=',Value:0,Connector:'AND',Parameter:'Deleted'});}break;}}}if(tmpFilter.length<1){return'';}var tmpWhere=' WHERE';// This is used to disable the connectors for subsequent queries.
// Only the open parenthesis operator uses this, currently.
var tmpLastOperatorNoConnector=false;for(var i=0;i<tmpFilter.length;i++){if(tmpFilter[i].Connector!='NONE'&&tmpFilter[i].Operator!=')'&&tmpWhere!=' WHERE'&&tmpLastOperatorNoConnector==false){tmpWhere+=' '+tmpFilter[i].Connector;}tmpLastOperatorNoConnector=false;var tmpColumnParameter;if(tmpFilter[i].Operator==='('){// Open a logical grouping
tmpWhere+=' (';tmpLastOperatorNoConnector=true;}else if(tmpFilter[i].Operator===')'){// Close a logical grouping
tmpWhere+=' )';}else if(tmpFilter[i].Operator==='IN'){tmpColumnParameter=tmpFilter[i].Parameter+'_w'+i;// Add the column name, operator and parameter name to the list of where value parenthetical
tmpWhere+=' '+escapeColumn(tmpFilter[i].Column,pParameters)+' '+tmpFilter[i].Operator+' ( :'+tmpColumnParameter+' )';pParameters.query.parameters[tmpColumnParameter]=tmpFilter[i].Value;}else if(tmpFilter[i].Operator==='IS NOT NULL'){// IS NOT NULL is a special operator which doesn't require a value, or parameter
tmpWhere+=' '+escapeColumn(tmpFilter[i].Column,pParameters)+' '+tmpFilter[i].Operator;}else{tmpColumnParameter=tmpFilter[i].Parameter+'_w'+i;// Add the column name, operator and parameter name to the list of where value parenthetical
tmpWhere+=' '+escapeColumn(tmpFilter[i].Column,pParameters)+' '+tmpFilter[i].Operator+' :'+tmpColumnParameter;pParameters.query.parameters[tmpColumnParameter]=tmpFilter[i].Value;}}return tmpWhere;};/**
	* Generate an ORDER BY clause from the sort array
	*
	* Each entry in the sort is an object like:
	* {Column:'Color',Direction:'Descending'}
	*
	* @method: generateOrderBy
	* @param: {Object} pParameters SQL Query Parameters
	* @return: {String} Returns the field list clause
	*/var generateOrderBy=function(pParameters){var tmpOrderBy=pParameters.sort;if(!Array.isArray(tmpOrderBy)||tmpOrderBy.length<1){return'';}var tmpOrderClause=' ORDER BY';for(var i=0;i<tmpOrderBy.length;i++){if(i>0){tmpOrderClause+=',';}tmpOrderClause+=' '+escapeColumn(tmpOrderBy[i].Column,pParameters);if(tmpOrderBy[i].Direction=='Descending'){tmpOrderClause+=' DESC';}}return tmpOrderClause;};/**
	* Generate the limit clause
	*
	* @method: generateLimit
	* @param: {Object} pParameters SQL Query Parameters
	* @return: {String} Returns the table name clause
	*/var generateLimit=function(pParameters){if(!pParameters.cap){return'';}var tmpLimit=' LIMIT';// Cap is required for a limit clause.
tmpLimit+=' '+pParameters.cap;// If there is a begin record, we'll pass that in as well.
if(pParameters.begin!==false){tmpLimit+=' FETCH '+pParameters.begin;}return tmpLimit;};/**
	* Generate the update SET clause
	*
	* @method: generateUpdateSetters
	* @param: {Object} pParameters SQL Query Parameters
	* @return: {String} Returns the table name clause
	*/var generateUpdateSetters=function(pParameters){var tmpRecords=pParameters.query.records;// We need to tell the query not to generate improperly if there are no values to set.
if(!Array.isArray(tmpRecords)||tmpRecords.length<1){return false;}// Check if there is a schema.  If so, we will use it to decide if these are parameterized or not.
var tmpSchema=Array.isArray(pParameters.query.schema)?pParameters.query.schema:[];var tmpUpdate='';// If there is more than one record in records, we are going to ignore them for now.
var tmpCurrentColumn=0;for(var tmpColumn in tmpRecords[0]){// No hash table yet, so, we will just linear search it for now.
// This uses the schema to decide if we want to treat a column differently on insert
var tmpSchemaEntry={Column:tmpColumn,Type:'Default'};for(var i=0;i<tmpSchema.length;i++){if(tmpColumn==tmpSchema[i].Column){// There is a schema entry for it.  Process it accordingly.
tmpSchemaEntry=tmpSchema[i];break;}}if(pParameters.query.disableAutoDateStamp&&tmpSchemaEntry.Type==='UpdateDate'){// This is ignored if flag is set
continue;}if(pParameters.query.disableAutoUserStamp&&tmpSchemaEntry.Type==='UpdateIDUser'){// This is ignored if flag is set
continue;}switch(tmpSchemaEntry.Type){case'AutoIdentity':case'CreateDate':case'CreateIDUser':case'DeleteDate':case'DeleteIDUser':// These are all ignored on update
continue;}if(tmpCurrentColumn>0){tmpUpdate+=',';}switch(tmpSchemaEntry.Type){case'UpdateDate':// This is an autoidentity, so we don't parameterize it and just pass in NULL
tmpUpdate+=' '+escapeColumn(tmpColumn,pParameters)+' = NOW()';break;case'UpdateIDUser':// This is the user ID, which we hope is in the query.
// This is how to deal with a normal column
var tmpColumnParameter=tmpColumn+'_'+tmpCurrentColumn;tmpUpdate+=' '+escapeColumn(tmpColumn,pParameters)+' = :'+tmpColumnParameter;// Set the query parameter
pParameters.query.parameters[tmpColumnParameter]=pParameters.query.IDUser;break;default:var tmpColumnDefaultParameter=tmpColumn+'_'+tmpCurrentColumn;tmpUpdate+=' '+escapeColumn(tmpColumn,pParameters)+' = :'+tmpColumnDefaultParameter;// Set the query parameter
pParameters.query.parameters[tmpColumnDefaultParameter]=tmpRecords[0][tmpColumn];break;}// We use a number to make sure parameters are unique.
tmpCurrentColumn++;}// We need to tell the query not to generate improperly if there are no values set.
if(tmpUpdate===''){return false;}return tmpUpdate;};/**
	* Generate the update-delete SET clause
	*
	* @method: generateUpdateDeleteSetters
	* @param: {Object} pParameters SQL Query Parameters
	* @return: {String} Returns the table name clause
	*/var generateUpdateDeleteSetters=function(pParameters){if(pParameters.query.disableDeleteTracking){//Don't generate an UPDATE query if Delete tracking is disabled
return false;}// Check if there is a schema.  If so, we will use it to decide if these are parameterized or not.
var tmpSchema=Array.isArray(pParameters.query.schema)?pParameters.query.schema:[];var tmpCurrentColumn=0;var tmpHasDeletedField=false;var tmpUpdate='';// No hash table yet, so, we will just linear search it for now.
// This uses the schema to decide if we want to treat a column differently on insert
var tmpSchemaEntry={Type:'Default'};for(var i=0;i<tmpSchema.length;i++){// There is a schema entry for it.  Process it accordingly.
tmpSchemaEntry=tmpSchema[i];var tmpUpdateSql=null;switch(tmpSchemaEntry.Type){case'Deleted':tmpUpdateSql=' '+escapeColumn(tmpSchemaEntry.Column,pParameters)+' = 1';tmpHasDeletedField=true;//this field is required in order for query to be built
break;case'DeleteDate':tmpUpdateSql=' '+escapeColumn(tmpSchemaEntry.Column,pParameters)+' = NOW()';break;case'UpdateDate':// Delete operation is an Update, so we should stamp the update time
tmpUpdateSql=' '+escapeColumn(tmpSchemaEntry.Column,pParameters)+' = NOW()';break;case'DeleteIDUser':// This is the user ID, which we hope is in the query.
// This is how to deal with a normal column
var tmpColumnParameter=tmpSchemaEntry.Column+'_'+tmpCurrentColumn;tmpUpdateSql=' '+escapeColumn(tmpSchemaEntry.Column,pParameters)+' = :'+tmpColumnParameter;// Set the query parameter
pParameters.query.parameters[tmpColumnParameter]=pParameters.query.IDUser;break;default://DON'T allow update of other fields in this query
continue;}if(tmpCurrentColumn>0){tmpUpdate+=',';}tmpUpdate+=tmpUpdateSql;// We use a number to make sure parameters are unique.
tmpCurrentColumn++;}// We need to tell the query not to generate improperly if there are no values set.
if(!tmpHasDeletedField||tmpUpdate===''){return false;}return tmpUpdate;};/**
	* Generate the update-delete SET clause
	*
	* @method: generateUpdateDeleteSetters
	* @param: {Object} pParameters SQL Query Parameters
	* @return: {String} Returns the table name clause
	*/var generateUpdateUndeleteSetters=function(pParameters){// Check if there is a schema.  If so, we will use it to decide if these are parameterized or not.
var tmpSchema=Array.isArray(pParameters.query.schema)?pParameters.query.schema:[];var tmpCurrentColumn=0;var tmpHasDeletedField=false;var tmpUpdate='';// No hash table yet, so, we will just linear search it for now.
// This uses the schema to decide if we want to treat a column differently on insert
var tmpSchemaEntry={Type:'Default'};for(var i=0;i<tmpSchema.length;i++){// There is a schema entry for it.  Process it accordingly.
tmpSchemaEntry=tmpSchema[i];var tmpUpdateSql=null;switch(tmpSchemaEntry.Type){case'Deleted':tmpUpdateSql=' '+escapeColumn(tmpSchemaEntry.Column,pParameters)+' = 0';tmpHasDeletedField=true;//this field is required in order for query to be built
break;case'UpdateDate':// Delete operation is an Update, so we should stamp the update time
tmpUpdateSql=' '+escapeColumn(tmpSchemaEntry.Column,pParameters)+' = NOW()';break;case'UpdateIDUser':// This is the user ID, which we hope is in the query.
// This is how to deal with a normal column
var tmpColumnParameter=tmpSchemaEntry.Column+'_'+tmpCurrentColumn;tmpUpdateSql=' '+escapeColumn(tmpSchemaEntry.Column,pParameters)+' = :'+tmpColumnParameter;// Set the query parameter
pParameters.query.parameters[tmpColumnParameter]=pParameters.query.IDUser;break;default://DON'T allow update of other fields in this query
continue;}if(tmpCurrentColumn>0){tmpUpdate+=',';}tmpUpdate+=tmpUpdateSql;// We use a number to make sure parameters are unique.
tmpCurrentColumn++;}// We need to tell the query not to generate improperly if there are no values set.
if(!tmpHasDeletedField||tmpUpdate===''){return false;}return tmpUpdate;};/**
	* Generate the create SET clause
	*
	* @method: generateCreateSetList
	* @param: {Object} pParameters SQL Query Parameters
	* @return: {String} Returns the table name clause
	*/var generateCreateSetValues=function(pParameters){var tmpRecords=pParameters.query.records;// We need to tell the query not to generate improperly if there are no values to set.
if(!Array.isArray(tmpRecords)||tmpRecords.length<1){return false;}// Check if there is a schema.  If so, we will use it to decide if these are parameterized or not.
var tmpSchema=Array.isArray(pParameters.query.schema)?pParameters.query.schema:[];var tmpCreateSet='';// If there is more than one record in records, we are going to ignore them for now.
var tmpCurrentColumn=0;for(var tmpColumn in tmpRecords[0]){// No hash table yet, so, we will just linear search it for now.
// This uses the schema to decide if we want to treat a column differently on insert
var tmpSchemaEntry={Column:tmpColumn,Type:'Default'};for(var i=0;i<tmpSchema.length;i++){if(tmpColumn==tmpSchema[i].Column){// There is a schema entry for it.  Process it accordingly.
tmpSchemaEntry=tmpSchema[i];break;}}if(!pParameters.query.disableDeleteTracking){if(tmpSchemaEntry.Type==='DeleteDate'||tmpSchemaEntry.Type==='DeleteIDUser'){// These are all ignored on insert (if delete tracking is enabled as normal)
continue;}}if(tmpCurrentColumn>0){tmpCreateSet+=',';}//define a re-usable method for setting up field definitions in a default pattern
var buildDefaultDefinition=function(){var tmpColumnParameter=tmpColumn+'_'+tmpCurrentColumn;tmpCreateSet+=' :'+tmpColumnParameter;// Set the query parameter
pParameters.query.parameters[tmpColumnParameter]=tmpRecords[0][tmpColumn];};var tmpColumnParameter;switch(tmpSchemaEntry.Type){case'AutoIdentity':if(pParameters.query.disableAutoIdentity){buildDefaultDefinition();}else{// This is an autoidentity, so we don't parameterize it and just pass in NULL
tmpCreateSet+=' NULL';}break;case'AutoGUID':if(pParameters.query.disableAutoIdentity){buildDefaultDefinition();}else if(tmpRecords[0][tmpColumn]&&tmpRecords[0][tmpColumn].length>=5&&tmpRecords[0][tmpColumn]!=='0x0000000000000000')//stricture default
{// Allow consumer to override AutoGUID
buildDefaultDefinition();}else{// This is an autoidentity, so we don't parameterize it and just pass in NULL
tmpColumnParameter=tmpColumn+'_'+tmpCurrentColumn;tmpCreateSet+=' :'+tmpColumnParameter;// Set the query parameter
pParameters.query.parameters[tmpColumnParameter]=pParameters.query.UUID;}break;case'UpdateDate':case'CreateDate':case'DeleteDate':if(pParameters.query.disableAutoDateStamp){buildDefaultDefinition();}else{// This is an autoidentity, so we don't parameterize it and just pass in NULL
tmpCreateSet+=' NOW()';}break;case'UpdateIDUser':case'CreateIDUser':case'DeleteIDUser':if(pParameters.query.disableAutoUserStamp){buildDefaultDefinition();}else{// This is the user ID, which we hope is in the query.
// This is how to deal with a normal column
tmpColumnParameter=tmpColumn+'_'+tmpCurrentColumn;tmpCreateSet+=' :'+tmpColumnParameter;// Set the query parameter
pParameters.query.parameters[tmpColumnParameter]=pParameters.query.IDUser;}break;default:buildDefaultDefinition();break;}// We use an appended number to make sure parameters are unique.
tmpCurrentColumn++;}// We need to tell the query not to generate improperly if there are no values set.
if(tmpCreateSet===''){return false;}return tmpCreateSet;};/**
	* Generate the create SET clause
	*
	* @method: generateCreateSetList
	* @param: {Object} pParameters SQL Query Parameters
	* @return: {String} Returns the table name clause
	*/var generateCreateSetList=function(pParameters){// The records were already validated by generateCreateSetValues
var tmpRecords=pParameters.query.records;// Check if there is a schema.  If so, we will use it to decide if these are parameterized or not.
var tmpSchema=Array.isArray(pParameters.query.schema)?pParameters.query.schema:[];var tmpCreateSet='';// If there is more than one record in records, we are going to ignore them for now.
for(var tmpColumn in tmpRecords[0]){// No hash table yet, so, we will just linear search it for now.
// This uses the schema to decide if we want to treat a column differently on insert
var tmpSchemaEntry={Column:tmpColumn,Type:'Default'};for(var i=0;i<tmpSchema.length;i++){if(tmpColumn==tmpSchema[i].Column){// There is a schema entry for it.  Process it accordingly.
tmpSchemaEntry=tmpSchema[i];break;}}if(!pParameters.query.disableDeleteTracking){if(tmpSchemaEntry.Type==='DeleteDate'||tmpSchemaEntry.Type==='DeleteIDUser'){// These are all ignored on insert (if delete tracking is enabled as normal)
continue;}}switch(tmpSchemaEntry.Type){default:if(tmpCreateSet!=''){tmpCreateSet+=',';}tmpCreateSet+=' '+escapeColumn(tmpColumn,pParameters);break;}}return tmpCreateSet;};var Create=function(pParameters){var tmpTableName=generateTableName(pParameters);var tmpCreateSetList=generateCreateSetList(pParameters);var tmpCreateSetValues=generateCreateSetValues(pParameters);if(!tmpCreateSetValues){return false;}return'INSERT INTO'+tmpTableName+' ('+tmpCreateSetList+') VALUES ('+tmpCreateSetValues+');';};/**
	* Read one or many records
	*
	* Some examples:
	* SELECT * FROM WIDGETS;
	* SELECT * FROM WIDGETS LIMIT 0, 20;
	* SELECT * FROM WIDGETS LIMIT 5, 20;
	* SELECT ID, Name, Cost FROM WIDGETS LIMIT 5, 20;
	* SELECT ID, Name, Cost FROM WIDGETS LIMIT 5, 20 WHERE LastName = 'Smith';
	*
	* @method Read
	* @param {Object} pParameters SQL Query parameters
	* @return {String} Returns the current Query for chaining.
	*/var Read=function(pParameters){var tmpFieldList=generateFieldList(pParameters);var tmpTableName=generateTableName(pParameters);var tmpWhere=generateWhere(pParameters);var tmpOrderBy=generateOrderBy(pParameters);var tmpLimit=generateLimit(pParameters);const tmpOptDistinct=pParameters.distinct?' DISTINCT':'';if(pParameters.queryOverride){try{var tmpQueryTemplate=_Fable.Utility.template(pParameters.queryOverride);return tmpQueryTemplate({FieldList:tmpFieldList,TableName:tmpTableName,Where:tmpWhere,OrderBy:tmpOrderBy,Limit:tmpLimit,Distinct:tmpOptDistinct,_Params:pParameters});}catch(pError){// This pokemon is here to give us a convenient way of not throwing up totally if the query fails.
console.log('Error with custom Read Query ['+pParameters.queryOverride+']: '+pError);return false;}}return`SELECT${tmpOptDistinct}${tmpFieldList} FROM${tmpTableName}${tmpWhere}${tmpOrderBy}${tmpLimit};`;};var Update=function(pParameters){var tmpTableName=generateTableName(pParameters);var tmpWhere=generateWhere(pParameters);var tmpUpdateSetters=generateUpdateSetters(pParameters);if(!tmpUpdateSetters){return false;}return'UPDATE'+tmpTableName+' SET'+tmpUpdateSetters+tmpWhere+';';};var Delete=function(pParameters){var tmpTableName=generateTableName(pParameters);var tmpWhere=generateWhere(pParameters);var tmpUpdateDeleteSetters=generateUpdateDeleteSetters(pParameters);if(tmpUpdateDeleteSetters){//If it has a deleted bit, update it instead of actually deleting the record
return'UPDATE'+tmpTableName+' SET'+tmpUpdateDeleteSetters+tmpWhere+';';}else{return'DELETE FROM'+tmpTableName+tmpWhere+';';}};var Undelete=function(pParameters){var tmpTableName=generateTableName(pParameters);let tmpDeleteTrackingState=pParameters.query.disableDeleteTracking;pParameters.query.disableDeleteTracking=true;var tmpWhere=generateWhere(pParameters);var tmpUpdateUndeleteSetters=generateUpdateUndeleteSetters(pParameters);pParameters.query.disableDeleteTracking=tmpDeleteTrackingState;if(tmpUpdateUndeleteSetters){//If it has a deleted bit, update it instead of actually deleting the record
return'UPDATE'+tmpTableName+' SET'+tmpUpdateUndeleteSetters+tmpWhere+';';}else{return'SELECT NULL;';}};var Count=function(pParameters){var tmpTableName=generateTableName(pParameters);var tmpWhere=generateWhere(pParameters);const tmpFieldList=pParameters.distinct?generateFieldList(pParameters,true):'*';// here, we ignore the distinct keyword if no fields have been specified and
if(pParameters.distinct&&tmpFieldList.length<1){console.warn('Distinct requested but no field list or schema are available, so not honoring distinct for count query.');}const tmpOptDistinct=pParameters.distinct&&tmpFieldList.length>0?'DISTINCT':'';if(pParameters.queryOverride){try{var tmpQueryTemplate=_Fable.Utility.template(pParameters.queryOverride);return tmpQueryTemplate({FieldList:[],TableName:tmpTableName,Where:tmpWhere,OrderBy:'',Limit:'',Distinct:tmpOptDistinct,_Params:pParameters});}catch(pError){// This pokemon is here to give us a convenient way of not throwing up totally if the query fails.
console.log('Error with custom Count Query ['+pParameters.queryOverride+']: '+pError);return false;}}return`SELECT COUNT(${tmpOptDistinct}${tmpFieldList||'*'}) AS RowCount FROM${tmpTableName}${tmpWhere};`;};var tmpDialect={Create:Create,Read:Read,Update:Update,Delete:Delete,Undelete:Undelete,Count:Count};/**
	* Dialect Name
	*
	* @property name
	* @type string
	*/Object.defineProperty(tmpDialect,'name',{get:function(){return'ALASQL';},enumerable:true});return tmpDialect;};module.exports=FoxHoundDialectALASQL;},{}],32:[function(require,module,exports){/**
* FoxHound English Dialect
*
* Because if I can't ask for it in my native tongue, how am I going to ask a
* complicated server for it?
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @class FoxHoundDialectEnglish
*/var FoxHoundDialectEnglish=function(){var Create=function(pParameters){var tmpScope=pParameters.scope;return'Here is a '+tmpScope+'.';};/**
	* Read one or many records
	*
	* Some examples:
	* Please give me all your Widget records.  Thanks.
	* Please give me 20 Widget records.  Thanks.
	* Please give me 20 Widget records starting with record 5.  Thanks.
	* Please give me the ID, Name and Cost of 20 Widget records starting with record 5.  Thanks.
	* Please give me the ID and Name of 20 Widget records starting with record 5, when LastName equals "Smith".  Thanks.
	*
	* @method Read
	* @param {Number} pLogLevel The log level for our object
	* @return {String} Returns the current Query for chaining.
	*/var Read=function(pParameters){var tmpScope=pParameters.scope;const tmpDistinct=pParameters.distinct?'unique ':'';return`Please give me all your ${tmpDistinct}${tmpScope} records.  Thanks.`;};var Update=function(pParameters){var tmpScope=pParameters.scope;return'I am changing your '+tmpScope+'.';};var Delete=function(pParameters){var tmpScope=pParameters.scope;return'I am deleting your '+tmpScope+'.';};var Undelete=function(pParameters){var tmpScope=pParameters.scope;return'I am undeleting your '+tmpScope+'.';};var Count=function(pParameters){var tmpScope=pParameters.scope;const tmpDistinct=pParameters.distinct?'unique ':'';return`Count your ${tmpDistinct}${tmpScope}.`;};var tmpDialect={Create:Create,Read:Read,Update:Update,Delete:Delete,Undelete:Undelete,Count:Count};/**
	 * Dialect Name
	 *
	 * @property name
	 * @type string
	 */Object.defineProperty(tmpDialect,'name',{get:function(){return'English';},enumerable:true});return tmpDialect;};module.exports=FoxHoundDialectEnglish;},{}],33:[function(require,module,exports){/**
* FoxHound Meadow Endpoints Dialect
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @class FoxHoundDialectMeadowEndpoints
*/var FoxHoundDialectMeadowEndpoints=function(){/**
	 * Generate a table name from the scope
	 *
	 * @method: generateTableName
	 * @param: {Object} pParameters SQL Query Parameters
	 * @return: {String} Returns the table name clause
	 */var generateTableName=function(pParameters){return pParameters.scope;};/**
	 * Generate the Identity column from the schema or scope
	 * 
	 * @method: generateIdentityColumnName
	 * @param: {Object} pParameters SQL Query Parameters
	 * @return: {String} Returns the table name clause
	 */var generateIdentityColumnName=function(pParameters){// TODO: See about using the Schema or the Schemata for this
return`ID${pParameters.scope}`;};/**
	 * Generate a field list from the array of dataElements
	 *
	 * Each entry in the dataElements is a simple string
	 *
	 * @method: generateFieldList
	 * @param: {Object} pParameters SQL Query Parameters
	 * @return: {String} Returns the field list clause
	 */var generateFieldList=function(pParameters){var tmpDataElements=pParameters.dataElements;if(!Array.isArray(tmpDataElements)||tmpDataElements.length<1){return'';}var tmpFieldList='';for(var i=0;i<tmpDataElements.length;i++){if(i>0){tmpFieldList+=',';}tmpFieldList+=tmpDataElements[i];}return tmpFieldList;};/**
	 * Generate a query from the array of where clauses
	 *
	 * Each clause is an object like:
		{
			Column:'Name', 
			Operator:'EQ', 
			Value:'John', 
			Connector:'And', 
			Parameter:'Name'
		}
	 *
	 * @method: generateWhere
	 * @param: {Object} pParameters SQL Query Parameters
	 * @return: {String} Returns the WHERE clause prefixed with WHERE, or an empty string if unnecessary
	 */var generateWhere=function(pParameters){var tmpFilter=Array.isArray(pParameters.filter)?pParameters.filter:[];var tmpTableName=generateTableName(pParameters);var tmpURL='';let tmpfAddFilter=(pFilterCommand,pFilterParameters)=>{if(tmpURL.length>0){tmpURL+='~';}tmpURL+=`${pFilterCommand}~${pFilterParameters[0]}~${pFilterParameters[1]}~${pFilterParameters[2]}`;};let tmpfTranslateOperator=pOperator=>{tmpNewOperator='EQ';switch(pOperator.toUpperCase()){case'!=':tmpNewOperator='NE';break;case'>':tmpNewOperator='GT';break;case'>=':tmpNewOperator='GE';break;case'<=':tmpNewOperator='LE';break;case'<':tmpNewOperator='LT';break;case'LIKE':tmpNewOperator='LK';break;case'IN':tmpNewOperator='INN';break;case'NOT IN':tmpNewOperator='NI';break;}return tmpNewOperator;};// Translating Delete Tracking bit on query to a query with automagic
// This will eventually deprecate this as part of the necessary query
if(pParameters.query.disableDeleteTracking){tmpfAddFilter('FBV',['Deleted','GE','0']);}for(var i=0;i<tmpFilter.length;i++){if(tmpFilter[i].Operator==='('){tmpfAddFilter('FOP',['0','(','0']);}else if(tmpFilter[i].Operator===')'){// Close a logical grouping
tmpfAddFilter('FCP',['0',')','0']);}else if(tmpFilter[i].Operator==='IN'||tmpFilter[i].Operator==="NOT IN"){let tmpFilterCommand='FBV';if(tmpFilter[i].Connector=='OR'){tmpFilterCommand='FBVOR';}// Add the column name, operator and parameter name to the list of where value parenthetical
tmpfAddFilter(tmpFilterCommand,[tmpFilter[i].Column,tmpfTranslateOperator(tmpFilter[i].Operator),tmpFilter[i].Value.map(encodeURIComponent).join(',')]);}else if(tmpFilter[i].Operator==='IS NULL'){// IS NULL is a special operator which doesn't require a value, or parameter
tmpfAddFilter('FBV',[tmpFilter[i].Column,'IN','0']);}else if(tmpFilter[i].Operator==='IS NOT NULL'){// IS NOT NULL is a special operator which doesn't require a value, or parameter
tmpfAddFilter('FBV',[tmpFilter[i].Column,'NN','0']);}else{let tmpFilterCommand='FBV';if(tmpFilter[i].Connector=='OR'){tmpFilterCommand='FBVOR';}// Add the column name, operator and parameter name to the list of where value parenthetical
tmpfAddFilter(tmpFilterCommand,[tmpFilter[i].Column,tmpfTranslateOperator(tmpFilter[i].Operator),encodeURIComponent(tmpFilter[i].Value)]);}}let tmpOrderBy=generateOrderBy(pParameters);if(tmpOrderBy){if(tmpURL){tmpURL+='~';}tmpURL+=tmpOrderBy;}return tmpURL;};/**
	 * Get the flags for the request
     * 
     * These are usually passed in for Update and Create when extra tracking is disabled.
	 *
	 * @method: generateFlags
	 * @param: {Object} pParameters SQL Query Parameters
	 * @return: {String} Flags to be sent, if any.
	 */function generateFlags(pParameters){let tmpDisableAutoDateStamp=pParameters.query.disableAutoDateStamp;let tmpDisableDeleteTracking=pParameters.query.disableDeleteTracking;let tmpDisableAutoIdentity=pParameters.query.disableAutoIdentity;let tmpDisableAutoUserStamp=pParameters.query.disableAutoUserStamp;let tmpFlags='';let fAddFlag=(pFlagSet,pFlag)=>{if(pFlagSet){if(tmpFlags.length>0){tmpFlags+=',';}tmpFlags+=pFlag;}};fAddFlag(tmpDisableAutoDateStamp,'DisableAutoDateStamp');fAddFlag(tmpDisableDeleteTracking,'DisableDeleteTracking');fAddFlag(tmpDisableAutoIdentity,'DisableAutoIdentity');fAddFlag(tmpDisableAutoUserStamp,'DisableAutoUserStamp');return tmpFlags;};/**
	 * Get the ID for the record, to be used in URIs
	 *
	 * @method: getIDRecord
	 * @param: {Object} pParameters SQL Query Parameters
	 * @return: {String} ID of the record in string form for the URI
	 */var getIDRecord=function(pParameters){var tmpFilter=Array.isArray(pParameters.filter)?pParameters.filter:[];var tmpIDRecord=false;if(tmpFilter.length<1){return tmpIDRecord;}for(var i=0;i<tmpFilter.length;i++){// Check Schema Entry Type
var tmpSchema=Array.isArray(pParameters.query.schema)?pParameters.query.schema:[];var tmpSchemaEntry={Column:tmpFilter[i].Column,Type:'Default'};for(var j=0;j<tmpSchema.length;j++){// If this column is the AutoIdentity, set it.
if(tmpFilter[i].Column==tmpSchema[j].Column&&tmpSchema[j].Type=='AutoIdentity'){tmpIDRecord=tmpFilter[i].Value;break;}}}return tmpIDRecord;};/**
	 * Generate an ORDER BY clause from the sort array
	 *
	 * Each entry in the sort is an object like:
	 * {Column:'Color',Direction:'Descending'}
	 *
	 * @method: generateOrderBy
	 * @param: {Object} pParameters SQL Query Parameters
	 * @return: {String} Returns the field list clause
	 */var generateOrderBy=function(pParameters){var tmpOrderBy=pParameters.sort;var tmpOrderClause=false;if(!Array.isArray(tmpOrderBy)||tmpOrderBy.length<1){return tmpOrderClause;}tmpOrderClause='';for(var i=0;i<tmpOrderBy.length;i++){if(i>0){tmpOrderClause+='~';}tmpOrderClause+=`FSF~${tmpOrderBy[i].Column}~`;if(tmpOrderBy[i].Direction=='Descending'){tmpOrderClause+='DESC~0';}else{tmpOrderClause+='ASC~0';}}return tmpOrderClause;};/**
	 * Generate the limit clause
	 *
	 * @method: generateLimit
	 * @param: {Object} pParameters SQL Query Parameters
	 * @return: {String} Returns the table name clause
	 */var generateLimit=function(pParameters){if(!pParameters.cap){return'';}let tmpBegin=pParameters.begin!==false?pParameters.begin:0;return`${tmpBegin}/${pParameters.cap}`;};var Create=function(pParameters){var tmpTableName=generateTableName(pParameters);var tmpFlags=generateFlags(pParameters);if(tmpTableName){let tmpURL=tmpTableName;if(tmpFlags){tmpURL=`${tmpURL}/WithFlags/${tmpFlags}`;}return tmpURL;}else{return false;}};/**
	* Read one or many records
	*
	* @method Read
	* @param {Object} pParameters SQL Query parameters
	* @return {String} Returns the current Query for chaining.
	*/var Read=function(pParameters){var tmpTableName=generateTableName(pParameters);var tmpFieldList=generateFieldList(pParameters);var tmpWhere=generateWhere(pParameters);var tmpLimit=generateLimit(pParameters);var tmpURL=`${tmpTableName}`;// In the case that there is only a single query parameter, and the parameter is a single identity, 
// we will cast it to the READ endpoint rather than READS.
if(pParameters.filter&&pParameters.filter.length==1// If there is exactly one query filter parameter
&&pParameters.filter[0].Column===generateIdentityColumnName(pParameters)// AND It is the Identity column
&&pParameters.filter[0].Operator==='='// AND The comparators is a simple equals 
&&tmpLimit==''&&tmpFieldList==''// AND There is no limit or field list set
&&!pParameters.sort)// AND There is no sort clause
{// THEN This is a SINGLE READ by presumption.
// There are some bad side affects this could cause with chaining and overridden behaviors, if 
// we are requesting a filtered list of 1 record.
tmpURL=`${tmpURL}/${pParameters.filter[0].Value}`;}else{tmpURL=`${tmpURL}s`;if(tmpFieldList){tmpURL=`${tmpURL}/LiteExtended/${tmpFieldList}`;}if(tmpWhere){tmpURL=`${tmpURL}/FilteredTo/${tmpWhere}`;}if(tmpLimit){tmpURL=`${tmpURL}/${tmpLimit}`;}}return tmpURL;};var Update=function(pParameters){var tmpTableName=generateTableName(pParameters);var tmpFlags=generateFlags(pParameters);if(tmpTableName){let tmpURL=tmpTableName;if(tmpFlags){tmpURL=`${tmpURL}/WithFlags/${tmpFlags}`;}return tmpURL;}else{return false;}};var Delete=function(pParameters){var tmpTableName=generateTableName(pParameters);var tmpIDRecord=getIDRecord(pParameters);if(!tmpIDRecord){return false;}return`${tmpTableName}/${tmpIDRecord}`;};var Count=function(pParameters){var tmpTableName=generateTableName(pParameters);var tmpWhere=generateWhere(pParameters);let tmpCountQuery=`${tmpTableName}s/Count`;if(tmpWhere){return`${tmpTableName}s/Count/FilteredTo/${tmpWhere}`;}return tmpCountQuery;};var tmpDialect={Create:Create,Read:Read,Update:Update,Delete:Delete,Count:Count};/**
	 * Dialect Name
	 *
	 * @property name
	 * @type string
	 */Object.defineProperty(tmpDialect,'name',{get:function(){return'MeadowEndpoints';},enumerable:true});return tmpDialect;};module.exports=FoxHoundDialectMeadowEndpoints;},{}],34:[function(require,module,exports){/**
* FoxHound MySQL Dialect
*
* @license MIT
*
* For a MySQL query override:
// An underscore template with the following values:
//      <%= DataElements %> = Field1, Field2, Field3, Field4
//      <%= Begin %>        = 0
//      <%= Cap %>          = 10
//      <%= Filter %>       = WHERE StartDate > :MyStartDate
//      <%= Sort %>         = ORDER BY Field1
// The values are empty strings if they aren't set.
*
* @author Steven Velozo <steven@velozo.com>
* @class FoxHoundDialectMySQL
*/var FoxHoundDialectMySQL=function(pFable){//Request time from SQL server with microseconds resolution
const SQL_NOW="NOW(3)";_Fable=pFable;/**
	* Generate a table name from the scope
	*
	* @method: generateTableName
	* @param: {Object} pParameters SQL Query Parameters
	* @return: {String} Returns the table name clause
	*/var generateTableName=function(pParameters){if(pParameters.scope&&pParameters.scope.indexOf('`')>=0)return' '+pParameters.scope+'';else return' `'+pParameters.scope+'`';};/**
	* Generate a field list from the array of dataElements
	*
	* Each entry in the dataElements is a simple string
	*
	* @method: generateFieldList
	* @param: {Object} pParameters SQL Query Parameters
	* @param {Boolean} pIsForCountClause (optional) If true, generate fields for use within a count clause.
	* @return: {String} Returns the field list clause, or empty string if explicit fields are requested but cannot be fulfilled
	*          due to missing schema.
	*/var generateFieldList=function(pParameters,pIsForCountClause){var tmpDataElements=pParameters.dataElements;if(!Array.isArray(tmpDataElements)||tmpDataElements.length<1){const tmpTableName=generateTableName(pParameters);if(!pIsForCountClause){return tmpTableName+'.*';}// we need to list all of the table fields explicitly; get them from the schema
const tmpSchema=Array.isArray(pParameters.query.schema)?pParameters.query.schema:[];if(tmpSchema.length<1){// this means we have no schema; returning an empty string here signals the calling code to handle this case
return'';}const idColumn=tmpSchema.find(entry=>entry.Type==='AutoIdentity');if(!idColumn){// this means there is no autoincrementing unique ID column; treat as above
return'';}const qualifiedIDColumn=`${tmpTableName}.${idColumn.Column}`;return` ${generateSafeFieldName(qualifiedIDColumn)}`;}var tmpFieldList=' ';for(var i=0;i<tmpDataElements.length;i++){if(i>0){tmpFieldList+=', ';}if(Array.isArray(tmpDataElements[i])){tmpFieldList+=generateSafeFieldName(tmpDataElements[i][0]);if(tmpDataElements[i].length>1&&tmpDataElements[i][1]){tmpFieldList+=" AS "+generateSafeFieldName(tmpDataElements[i][1]);}}else{tmpFieldList+=generateSafeFieldName(tmpDataElements[i]);}}return tmpFieldList;};const SURROUNDING_QUOTES_AND_WHITESPACE_REGEX=/^[` ]+|[` ]+$/g;const cleanseQuoting=str=>{return str.replace(SURROUNDING_QUOTES_AND_WHITESPACE_REGEX,'');};/**
	* Ensure a field name is properly escaped.
	*/var generateSafeFieldName=function(pFieldName){let pFieldNames=pFieldName.split('.');if(pFieldNames.length>1){const cleansedFieldName=cleanseQuoting(pFieldNames[1]);if(cleansedFieldName==='*'){// do not put * as `*`
return"`"+cleanseQuoting(pFieldNames[0])+"`.*";}return"`"+cleanseQuoting(pFieldNames[0])+"`.`"+cleansedFieldName+"`";}const cleansedFieldName=cleanseQuoting(pFieldNames[0]);if(cleansedFieldName==='*'){// do not put * as `*`
return'*';}return"`"+cleanseQuoting(pFieldNames[0])+"`";};/**
	* Generate a query from the array of where clauses
	*
	* Each clause is an object like:
		{
			Column:'Name',
			Operator:'EQ',
			Value:'John',
			Connector:'And',
			Parameter:'Name'
		}
	*
	* @method: generateWhere
	* @param: {Object} pParameters SQL Query Parameters
	* @return: {String} Returns the WHERE clause prefixed with WHERE, or an empty string if unnecessary
	*/var generateWhere=function(pParameters){var tmpFilter=Array.isArray(pParameters.filter)?pParameters.filter:[];var tmpTableName=generateTableName(pParameters);if(!pParameters.query.disableDeleteTracking){// Check if there is a Deleted column on the Schema. If so, we add this to the filters automatically (if not already present)
var tmpSchema=Array.isArray(pParameters.query.schema)?pParameters.query.schema:[];for(var i=0;i<tmpSchema.length;i++){// There is a schema entry for it.  Process it accordingly.
var tmpSchemaEntry=tmpSchema[i];if(tmpSchemaEntry.Type==='Deleted'){var tmpHasDeletedParameter=false;//first, check to see if filters are already looking for Deleted column
if(tmpFilter.length>0){for(var x=0;x<tmpFilter.length;x++){if(tmpFilter[x].Column===tmpSchemaEntry.Column){tmpHasDeletedParameter=true;break;}}}if(!tmpHasDeletedParameter){//if not, we need to add it
tmpFilter.push({Column:tmpTableName+'.'+tmpSchemaEntry.Column,Operator:'=',Value:0,Connector:'AND',Parameter:'Deleted'});}break;}}}if(tmpFilter.length<1){return'';}var tmpWhere=' WHERE';// This is used to disable the connectors for subsequent queries.
// Only the open parenthesis operator uses this, currently.
var tmpLastOperatorNoConnector=false;for(var i=0;i<tmpFilter.length;i++){if(tmpFilter[i].Connector!='NONE'&&tmpFilter[i].Operator!=')'&&tmpWhere!=' WHERE'&&tmpLastOperatorNoConnector==false){tmpWhere+=' '+tmpFilter[i].Connector;}tmpLastOperatorNoConnector=false;var tmpColumnParameter;if(tmpFilter[i].Operator==='('){// Open a logical grouping
tmpWhere+=' (';tmpLastOperatorNoConnector=true;}else if(tmpFilter[i].Operator===')'){// Close a logical grouping
tmpWhere+=' )';}else if(tmpFilter[i].Operator==='IN'||tmpFilter[i].Operator==="NOT IN"){tmpColumnParameter=tmpFilter[i].Parameter+'_w'+i;// Add the column name, operator and parameter name to the list of where value parenthetical
tmpWhere+=' '+tmpFilter[i].Column+' '+tmpFilter[i].Operator+' ( :'+tmpColumnParameter+' )';pParameters.query.parameters[tmpColumnParameter]=tmpFilter[i].Value;}else if(tmpFilter[i].Operator==='IS NULL'){// IS NULL is a special operator which doesn't require a value, or parameter
tmpWhere+=' '+tmpFilter[i].Column+' '+tmpFilter[i].Operator;}else if(tmpFilter[i].Operator==='IS NOT NULL'){// IS NOT NULL is a special operator which doesn't require a value, or parameter
tmpWhere+=' '+tmpFilter[i].Column+' '+tmpFilter[i].Operator;}else{tmpColumnParameter=tmpFilter[i].Parameter+'_w'+i;// Add the column name, operator and parameter name to the list of where value parenthetical
tmpWhere+=' '+tmpFilter[i].Column+' '+tmpFilter[i].Operator+' :'+tmpColumnParameter;pParameters.query.parameters[tmpColumnParameter]=tmpFilter[i].Value;}}return tmpWhere;};/**
	* Generate an ORDER BY clause from the sort array
	*
	* Each entry in the sort is an object like:
	* {Column:'Color',Direction:'Descending'}
	*
	* @method: generateOrderBy
	* @param: {Object} pParameters SQL Query Parameters
	* @return: {String} Returns the field list clause
	*/var generateOrderBy=function(pParameters){var tmpOrderBy=pParameters.sort;if(!Array.isArray(tmpOrderBy)||tmpOrderBy.length<1){return'';}var tmpOrderClause=' ORDER BY';for(var i=0;i<tmpOrderBy.length;i++){if(i>0){tmpOrderClause+=',';}tmpOrderClause+=' '+tmpOrderBy[i].Column;if(tmpOrderBy[i].Direction=='Descending'){tmpOrderClause+=' DESC';}}return tmpOrderClause;};/**
	* Generate the limit clause
	*
	* @method: generateLimit
	* @param: {Object} pParameters SQL Query Parameters
	* @return: {String} Returns the table name clause
	*/var generateLimit=function(pParameters){if(!pParameters.cap){return'';}var tmpLimit=' LIMIT';// If there is a begin record, we'll pass that in as well.
if(pParameters.begin!==false){tmpLimit+=' '+pParameters.begin+',';}// Cap is required for a limit clause.
tmpLimit+=' '+pParameters.cap;return tmpLimit;};/**
	* Generate the join clause
	*
	* @method: generateJoins
	* @param: {Object} pParameters SQL Query Parameters
	* @return: {String} Returns the join clause
	*/var generateJoins=function(pParameters){var tmpJoins=pParameters.join;if(!Array.isArray(tmpJoins)||tmpJoins.length<1){return'';}var tmpJoinClause='';//ex. ' INNER JOIN';
for(var i=0;i<tmpJoins.length;i++){var join=tmpJoins[i];//verify that all required fields are valid
if(join.Type&&join.Table&&join.From&&join.To){tmpJoinClause+=` ${join.Type} ${join.Table} ON ${join.From} = ${join.To}`;}}return tmpJoinClause;};/**
	* Generate the update SET clause
	*
	* @method: generateUpdateSetters
	* @param: {Object} pParameters SQL Query Parameters
	* @return: {String} Returns the table name clause
	*/var generateUpdateSetters=function(pParameters){var tmpRecords=pParameters.query.records;// We need to tell the query not to generate improperly if there are no values to set.
if(!Array.isArray(tmpRecords)||tmpRecords.length<1){return false;}// Check if there is a schema.  If so, we will use it to decide if these are parameterized or not.
var tmpSchema=Array.isArray(pParameters.query.schema)?pParameters.query.schema:[];var tmpUpdate='';// If there is more than one record in records, we are going to ignore them for now.
var tmpCurrentColumn=0;for(var tmpColumn in tmpRecords[0]){// No hash table yet, so, we will just linear search it for now.
// This uses the schema to decide if we want to treat a column differently on insert
var tmpSchemaEntry={Column:tmpColumn,Type:'Default'};for(var i=0;i<tmpSchema.length;i++){if(tmpColumn==tmpSchema[i].Column){// There is a schema entry for it.  Process it accordingly.
tmpSchemaEntry=tmpSchema[i];break;}}if(pParameters.query.disableAutoDateStamp&&tmpSchemaEntry.Type==='UpdateDate'){// This is ignored if flag is set
continue;}if(pParameters.query.disableAutoUserStamp&&tmpSchemaEntry.Type==='UpdateIDUser'){// This is ignored if flag is set
continue;}switch(tmpSchemaEntry.Type){case'AutoIdentity':case'CreateDate':case'CreateIDUser':case'DeleteDate':case'DeleteIDUser':// These are all ignored on update
continue;}if(tmpCurrentColumn>0){tmpUpdate+=',';}switch(tmpSchemaEntry.Type){case'UpdateDate':// This is an autoidentity, so we don't parameterize it and just pass in NULL
tmpUpdate+=' '+tmpColumn+' = '+SQL_NOW;break;case'UpdateIDUser':// This is the user ID, which we hope is in the query.
// This is how to deal with a normal column
var tmpColumnParameter=tmpColumn+'_'+tmpCurrentColumn;tmpUpdate+=' '+tmpColumn+' = :'+tmpColumnParameter;// Set the query parameter
pParameters.query.parameters[tmpColumnParameter]=pParameters.query.IDUser;break;default:var tmpColumnDefaultParameter=tmpColumn+'_'+tmpCurrentColumn;tmpUpdate+=' '+tmpColumn+' = :'+tmpColumnDefaultParameter;// Set the query parameter
pParameters.query.parameters[tmpColumnDefaultParameter]=tmpRecords[0][tmpColumn];break;}// We use a number to make sure parameters are unique.
tmpCurrentColumn++;}// We need to tell the query not to generate improperly if there are no values set.
if(tmpUpdate===''){return false;}return tmpUpdate;};/**
	* Generate the update-delete SET clause
	*
	* @method: generateUpdateDeleteSetters
	* @param: {Object} pParameters SQL Query Parameters
	* @return: {String} Returns the table name clause
	*/var generateUpdateDeleteSetters=function(pParameters){if(pParameters.query.disableDeleteTracking){//Don't generate an UPDATE query if Delete tracking is disabled
return false;}// Check if there is a schema.  If so, we will use it to decide if these are parameterized or not.
var tmpSchema=Array.isArray(pParameters.query.schema)?pParameters.query.schema:[];var tmpCurrentColumn=0;var tmpHasDeletedField=false;var tmpUpdate='';// No hash table yet, so, we will just linear search it for now.
// This uses the schema to decide if we want to treat a column differently on insert
var tmpSchemaEntry={Type:'Default'};for(var i=0;i<tmpSchema.length;i++){// There is a schema entry for it.  Process it accordingly.
tmpSchemaEntry=tmpSchema[i];var tmpUpdateSql=null;switch(tmpSchemaEntry.Type){case'Deleted':tmpUpdateSql=' '+tmpSchemaEntry.Column+' = 1';tmpHasDeletedField=true;//this field is required in order for query to be built
break;case'DeleteDate':tmpUpdateSql=' '+tmpSchemaEntry.Column+' = '+SQL_NOW;break;case'UpdateDate':// Delete operation is an Update, so we should stamp the update time
tmpUpdateSql=' '+tmpSchemaEntry.Column+' = '+SQL_NOW;break;case'DeleteIDUser':// This is the user ID, which we hope is in the query.
// This is how to deal with a normal column
var tmpColumnParameter=tmpSchemaEntry.Column+'_'+tmpCurrentColumn;tmpUpdateSql=' '+tmpSchemaEntry.Column+' = :'+tmpColumnParameter;// Set the query parameter
pParameters.query.parameters[tmpColumnParameter]=pParameters.query.IDUser;break;default://DON'T allow update of other fields in this query
continue;}if(tmpCurrentColumn>0){tmpUpdate+=',';}tmpUpdate+=tmpUpdateSql;// We use a number to make sure parameters are unique.
tmpCurrentColumn++;}// We need to tell the query not to generate improperly if there are no values set.
if(!tmpHasDeletedField||tmpUpdate===''){return false;}return tmpUpdate;};/**
	* Generate the update-undelete SET clause
	*
	* @method: generateUpdateUndeleteSetters
	* @param: {Object} pParameters SQL Query Parameters
	* @return: {String} Returns the table name clause
	*/var generateUpdateUndeleteSetters=function(pParameters){// Check if there is a schema.  If so, we will use it to decide if these are parameterized or not.
var tmpSchema=Array.isArray(pParameters.query.schema)?pParameters.query.schema:[];var tmpCurrentColumn=0;var tmpHasDeletedField=false;var tmpUpdate='';// No hash table yet, so, we will just linear search it for now.
// This uses the schema to decide if we want to treat a column differently on insert
var tmpSchemaEntry={Type:'Default'};for(var i=0;i<tmpSchema.length;i++){// There is a schema entry for it.  Process it accordingly.
tmpSchemaEntry=tmpSchema[i];var tmpUpdateSql=null;switch(tmpSchemaEntry.Type){case'Deleted':tmpUpdateSql=' '+tmpSchemaEntry.Column+' = 0';tmpHasDeletedField=true;//this field is required in order for query to be built
break;case'UpdateDate':// The undelete operation is an Update, so we should stamp the update time
tmpUpdateSql=' '+tmpSchemaEntry.Column+' = '+SQL_NOW;break;case'UpdateIDUser':var tmpColumnParameter=tmpSchemaEntry.Column+'_'+tmpCurrentColumn;tmpUpdateSql=' '+tmpSchemaEntry.Column+' = :'+tmpColumnParameter;pParameters.query.parameters[tmpColumnParameter]=pParameters.query.IDUser;break;default://DON'T allow update of other fields in this query
continue;}if(tmpCurrentColumn>0){tmpUpdate+=',';}tmpUpdate+=tmpUpdateSql;// We use a number to make sure parameters are unique.
tmpCurrentColumn++;}// We need to tell the query not to generate improperly if there are no values set.
if(!tmpHasDeletedField||tmpUpdate===''){return false;}return tmpUpdate;};/**
	* Generate the create SET clause
	*
	* @method: generateCreateSetList
	* @param: {Object} pParameters SQL Query Parameters
	* @return: {String} Returns the table name clause
	*/var generateCreateSetValues=function(pParameters){var tmpRecords=pParameters.query.records;// We need to tell the query not to generate improperly if there are no values to set.
if(!Array.isArray(tmpRecords)||tmpRecords.length<1){return false;}// Check if there is a schema.  If so, we will use it to decide if these are parameterized or not.
var tmpSchema=Array.isArray(pParameters.query.schema)?pParameters.query.schema:[];var tmpCreateSet='';// If there is more than one record in records, we are going to ignore them for now.
var tmpCurrentColumn=0;for(var tmpColumn in tmpRecords[0]){// No hash table yet, so, we will just linear search it for now.
// This uses the schema to decide if we want to treat a column differently on insert
var tmpSchemaEntry={Column:tmpColumn,Type:'Default'};for(var i=0;i<tmpSchema.length;i++){if(tmpColumn==tmpSchema[i].Column){// There is a schema entry for it.  Process it accordingly.
tmpSchemaEntry=tmpSchema[i];break;}}if(!pParameters.query.disableDeleteTracking){if(tmpSchemaEntry.Type==='DeleteDate'||tmpSchemaEntry.Type==='DeleteIDUser'){// These are all ignored on insert (if delete tracking is enabled as normal)
continue;}}if(tmpCurrentColumn>0){tmpCreateSet+=',';}//define a re-usable method for setting up field definitions in a default pattern
var buildDefaultDefinition=function(){var tmpColumnParameter=tmpColumn+'_'+tmpCurrentColumn;tmpCreateSet+=' :'+tmpColumnParameter;// Set the query parameter
pParameters.query.parameters[tmpColumnParameter]=tmpRecords[0][tmpColumn];};var tmpColumnParameter;switch(tmpSchemaEntry.Type){case'AutoIdentity':if(pParameters.query.disableAutoIdentity){buildDefaultDefinition();}else{// This is an autoidentity, so we don't parameterize it and just pass in NULL
tmpCreateSet+=' NULL';}break;case'AutoGUID':if(pParameters.query.disableAutoIdentity){buildDefaultDefinition();}else if(tmpRecords[0][tmpColumn]&&tmpRecords[0][tmpColumn].length>=5&&tmpRecords[0][tmpColumn]!=='0x0000000000000000')//stricture default
{// Allow consumer to override AutoGUID
buildDefaultDefinition();}else{// This is an autoidentity, so we don't parameterize it and just pass in NULL
tmpColumnParameter=tmpColumn+'_'+tmpCurrentColumn;tmpCreateSet+=' :'+tmpColumnParameter;// Set the query parameter
pParameters.query.parameters[tmpColumnParameter]=pParameters.query.UUID;}break;case'UpdateDate':case'CreateDate':case'DeleteDate':if(pParameters.query.disableAutoDateStamp){buildDefaultDefinition();}else{// This is an autoidentity, so we don't parameterize it and just pass in NULL
tmpCreateSet+=' '+SQL_NOW;}break;case'DeleteIDUser':case'UpdateIDUser':case'CreateIDUser':if(pParameters.query.disableAutoUserStamp){buildDefaultDefinition();}else{// This is the user ID, which we hope is in the query.
// This is how to deal with a normal column
tmpColumnParameter=tmpColumn+'_'+tmpCurrentColumn;tmpCreateSet+=' :'+tmpColumnParameter;// Set the query parameter
pParameters.query.parameters[tmpColumnParameter]=pParameters.query.IDUser;}break;default:buildDefaultDefinition();break;}// We use an appended number to make sure parameters are unique.
tmpCurrentColumn++;}// We need to tell the query not to generate improperly if there are no values set.
if(tmpCreateSet===''){return false;}return tmpCreateSet;};/**
	* Generate the create SET clause
	*
	* @method: generateCreateSetList
	* @param: {Object} pParameters SQL Query Parameters
	* @return: {String} Returns the table name clause
	*/var generateCreateSetList=function(pParameters){// The records were already validated by generateCreateSetValues
var tmpRecords=pParameters.query.records;// Check if there is a schema.  If so, we will use it to decide if these are parameterized or not.
var tmpSchema=Array.isArray(pParameters.query.schema)?pParameters.query.schema:[];var tmpCreateSet='';// If there is more than one record in records, we are going to ignore them for now.
for(var tmpColumn in tmpRecords[0]){// No hash table yet, so, we will just linear search it for now.
// This uses the schema to decide if we want to treat a column differently on insert
var tmpSchemaEntry={Column:tmpColumn,Type:'Default'};for(var i=0;i<tmpSchema.length;i++){if(tmpColumn==tmpSchema[i].Column){// There is a schema entry for it.  Process it accordingly.
tmpSchemaEntry=tmpSchema[i];break;}}if(!pParameters.query.disableDeleteTracking){if(tmpSchemaEntry.Type==='DeleteDate'||tmpSchemaEntry.Type==='DeleteIDUser'){// These are all ignored on insert (if delete tracking is enabled as normal)
continue;}}switch(tmpSchemaEntry.Type){default:if(tmpCreateSet!=''){tmpCreateSet+=',';}tmpCreateSet+=' '+tmpColumn;break;}}return tmpCreateSet;};var Create=function(pParameters){var tmpTableName=generateTableName(pParameters);var tmpCreateSetList=generateCreateSetList(pParameters);var tmpCreateSetValues=generateCreateSetValues(pParameters);if(!tmpCreateSetValues){return false;}return'INSERT INTO'+tmpTableName+' ('+tmpCreateSetList+') VALUES ('+tmpCreateSetValues+');';};/**
	* Read one or many records
	*
	* Some examples:
	* SELECT * FROM WIDGETS;
	* SELECT * FROM WIDGETS LIMIT 0, 20;
	* SELECT * FROM WIDGETS LIMIT 5, 20;
	* SELECT ID, Name, Cost FROM WIDGETS LIMIT 5, 20;
	* SELECT ID, Name, Cost FROM WIDGETS LIMIT 5, 20 WHERE LastName = 'Smith';
	*
	* @method Read
	* @param {Object} pParameters SQL Query parameters
	* @return {String} Returns the current Query for chaining.
	*/var Read=function(pParameters){var tmpFieldList=generateFieldList(pParameters);var tmpTableName=generateTableName(pParameters);var tmpWhere=generateWhere(pParameters);var tmpJoin=generateJoins(pParameters);var tmpOrderBy=generateOrderBy(pParameters);var tmpLimit=generateLimit(pParameters);const tmpOptDistinct=pParameters.distinct?' DISTINCT':'';if(pParameters.queryOverride){try{var tmpQueryTemplate=_Fable.Utility.template(pParameters.queryOverride);return tmpQueryTemplate({FieldList:tmpFieldList,TableName:tmpTableName,Where:tmpWhere,Join:tmpJoin,OrderBy:tmpOrderBy,Limit:tmpLimit,Distinct:tmpOptDistinct,_Params:pParameters});}catch(pError){// This pokemon is here to give us a convenient way of not throwing up totally if the query fails.
console.log('Error with custom Read Query ['+pParameters.queryOverride+']: '+pError);return false;}}return`SELECT${tmpOptDistinct}${tmpFieldList} FROM${tmpTableName}${tmpJoin}${tmpWhere}${tmpOrderBy}${tmpLimit};`;};var Update=function(pParameters){var tmpTableName=generateTableName(pParameters);var tmpWhere=generateWhere(pParameters);var tmpUpdateSetters=generateUpdateSetters(pParameters);if(!tmpUpdateSetters){return false;}return'UPDATE'+tmpTableName+' SET'+tmpUpdateSetters+tmpWhere+';';};var Delete=function(pParameters){var tmpTableName=generateTableName(pParameters);var tmpWhere=generateWhere(pParameters);var tmpUpdateDeleteSetters=generateUpdateDeleteSetters(pParameters);if(tmpUpdateDeleteSetters){//If it has a deleted bit, update it instead of actually deleting the record
return'UPDATE'+tmpTableName+' SET'+tmpUpdateDeleteSetters+tmpWhere+';';}else{return'DELETE FROM'+tmpTableName+tmpWhere+';';}};var Undelete=function(pParameters){var tmpTableName=generateTableName(pParameters);// TODO: Fix these
let tmpDeleteTrackingState=pParameters.query.disableDeleteTracking;pParameters.query.disableDeleteTracking=true;var tmpWhere=generateWhere(pParameters);var tmpUpdateUndeleteSetters=generateUpdateUndeleteSetters(pParameters);pParameters.query.disableDeleteTracking=tmpDeleteTrackingState;if(tmpUpdateUndeleteSetters){//If the table has a deleted bit, go forward with the update to change things.
return'UPDATE'+tmpTableName+' SET'+tmpUpdateUndeleteSetters+tmpWhere+';';}else{// This is a no-op because the record can't be undeleted.
// TODO: Should it throw instead?
return'SELECT NULL;';}};var Count=function(pParameters){var tmpFieldList=pParameters.distinct?generateFieldList(pParameters,true):'*';var tmpTableName=generateTableName(pParameters);var tmpJoin=generateJoins(pParameters);var tmpWhere=generateWhere(pParameters);// here, we ignore the distinct keyword if no fields have been specified and
if(pParameters.distinct&&tmpFieldList.length<1){console.warn('Distinct requested but no field list or schema are available, so not honoring distinct for count query.');}const tmpOptDistinct=pParameters.distinct&&tmpFieldList.length>0?'DISTINCT':'';if(pParameters.queryOverride){try{var tmpQueryTemplate=_Fable.Utility.template(pParameters.queryOverride);return tmpQueryTemplate({FieldList:[],TableName:tmpTableName,Where:tmpWhere,OrderBy:'',Limit:'',Distinct:tmpOptDistinct,_Params:pParameters});}catch(pError){// This pokemon is here to give us a convenient way of not throwing up totally if the query fails.
console.log('Error with custom Count Query ['+pParameters.queryOverride+']: '+pError);return false;}}return`SELECT COUNT(${tmpOptDistinct}${tmpFieldList||'*'}) AS RowCount FROM${tmpTableName}${tmpJoin}${tmpWhere};`;};var tmpDialect={Create:Create,Read:Read,Update:Update,Delete:Delete,Undelete:Undelete,Count:Count};/**
	* Dialect Name
	*
	* @property name
	* @type string
	*/Object.defineProperty(tmpDialect,'name',{get:function(){return'MySQL';},enumerable:true});return tmpDialect;};module.exports=FoxHoundDialectMySQL;},{}],35:[function(require,module,exports){'use strict';/* eslint no-invalid-this: 1 */var ERROR_MESSAGE='Function.prototype.bind called on incompatible ';var slice=Array.prototype.slice;var toStr=Object.prototype.toString;var funcType='[object Function]';module.exports=function bind(that){var target=this;if(typeof target!=='function'||toStr.call(target)!==funcType){throw new TypeError(ERROR_MESSAGE+target);}var args=slice.call(arguments,1);var bound;var binder=function(){if(this instanceof bound){var result=target.apply(this,args.concat(slice.call(arguments)));if(Object(result)===result){return result;}return this;}else{return target.apply(that,args.concat(slice.call(arguments)));}};var boundLength=Math.max(0,target.length-args.length);var boundArgs=[];for(var i=0;i<boundLength;i++){boundArgs.push('$'+i);}bound=Function('binder','return function ('+boundArgs.join(',')+'){ return binder.apply(this,arguments); }')(binder);if(target.prototype){var Empty=function Empty(){};Empty.prototype=target.prototype;bound.prototype=new Empty();Empty.prototype=null;}return bound;};},{}],36:[function(require,module,exports){'use strict';var implementation=require('./implementation');module.exports=Function.prototype.bind||implementation;},{"./implementation":35}],37:[function(require,module,exports){var util=require('util');var isProperty=require('is-property');var INDENT_START=/[\{\[]/;var INDENT_END=/[\}\]]/;// from https://mathiasbynens.be/notes/reserved-keywords
var RESERVED=['do','if','in','for','let','new','try','var','case','else','enum','eval','null','this','true','void','with','await','break','catch','class','const','false','super','throw','while','yield','delete','export','import','public','return','static','switch','typeof','default','extends','finally','package','private','continue','debugger','function','arguments','interface','protected','implements','instanceof','NaN','undefined'];var RESERVED_MAP={};for(var i=0;i<RESERVED.length;i++){RESERVED_MAP[RESERVED[i]]=true;}var isVariable=function(name){return isProperty(name)&&!RESERVED_MAP.hasOwnProperty(name);};var formats={s:function(s){return''+s;},d:function(d){return''+Number(d);},o:function(o){return JSON.stringify(o);}};var genfun=function(){var lines=[];var indent=0;var vars={};var push=function(str){var spaces='';while(spaces.length<indent*2)spaces+='  ';lines.push(spaces+str);};var pushLine=function(line){if(INDENT_END.test(line.trim()[0])&&INDENT_START.test(line[line.length-1])){indent--;push(line);indent++;return;}if(INDENT_START.test(line[line.length-1])){push(line);indent++;return;}if(INDENT_END.test(line.trim()[0])){indent--;push(line);return;}push(line);};var line=function(fmt){if(!fmt)return line;if(arguments.length===1&&fmt.indexOf('\n')>-1){var lines=fmt.trim().split('\n');for(var i=0;i<lines.length;i++){pushLine(lines[i].trim());}}else{pushLine(util.format.apply(util,arguments));}return line;};line.scope={};line.formats=formats;line.sym=function(name){if(!name||!isVariable(name))name='tmp';if(!vars[name])vars[name]=0;return name+(vars[name]++||'');};line.property=function(obj,name){if(arguments.length===1){name=obj;obj='';}name=name+'';if(isProperty(name))return obj?obj+'.'+name:name;return obj?obj+'['+JSON.stringify(name)+']':JSON.stringify(name);};line.toString=function(){return lines.join('\n');};line.toFunction=function(scope){if(!scope)scope={};var src='return ('+line.toString()+')';Object.keys(line.scope).forEach(function(key){if(!scope[key])scope[key]=line.scope[key];});var keys=Object.keys(scope).map(function(key){return key;});var vals=keys.map(function(key){return scope[key];});return Function.apply(null,keys.concat(src)).apply(null,vals);};if(arguments.length)line.apply(null,arguments);return line;};genfun.formats=formats;module.exports=genfun;},{"is-property":54,"util":171}],38:[function(require,module,exports){var isProperty=require('is-property');var gen=function(obj,prop){return isProperty(prop)?obj+'.'+prop:obj+'['+JSON.stringify(prop)+']';};gen.valid=isProperty;gen.property=function(prop){return isProperty(prop)?prop:JSON.stringify(prop);};module.exports=gen;},{"is-property":54}],39:[function(require,module,exports){'use strict';var undefined;var $SyntaxError=SyntaxError;var $Function=Function;var $TypeError=TypeError;// eslint-disable-next-line consistent-return
var getEvalledConstructor=function(expressionSyntax){try{return $Function('"use strict"; return ('+expressionSyntax+').constructor;')();}catch(e){}};var $gOPD=Object.getOwnPropertyDescriptor;if($gOPD){try{$gOPD({},'');}catch(e){$gOPD=null;// this is IE 8, which has a broken gOPD
}}var throwTypeError=function(){throw new $TypeError();};var ThrowTypeError=$gOPD?function(){try{// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
arguments.callee;// IE 8 does not throw here
return throwTypeError;}catch(calleeThrows){try{// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
return $gOPD(arguments,'callee').get;}catch(gOPDthrows){return throwTypeError;}}}():throwTypeError;var hasSymbols=require('has-symbols')();var getProto=Object.getPrototypeOf||function(x){return x.__proto__;};// eslint-disable-line no-proto
var needsEval={};var TypedArray=typeof Uint8Array==='undefined'?undefined:getProto(Uint8Array);var INTRINSICS={'%AggregateError%':typeof AggregateError==='undefined'?undefined:AggregateError,'%Array%':Array,'%ArrayBuffer%':typeof ArrayBuffer==='undefined'?undefined:ArrayBuffer,'%ArrayIteratorPrototype%':hasSymbols?getProto([][Symbol.iterator]()):undefined,'%AsyncFromSyncIteratorPrototype%':undefined,'%AsyncFunction%':needsEval,'%AsyncGenerator%':needsEval,'%AsyncGeneratorFunction%':needsEval,'%AsyncIteratorPrototype%':needsEval,'%Atomics%':typeof Atomics==='undefined'?undefined:Atomics,'%BigInt%':typeof BigInt==='undefined'?undefined:BigInt,'%BigInt64Array%':typeof BigInt64Array==='undefined'?undefined:BigInt64Array,'%BigUint64Array%':typeof BigUint64Array==='undefined'?undefined:BigUint64Array,'%Boolean%':Boolean,'%DataView%':typeof DataView==='undefined'?undefined:DataView,'%Date%':Date,'%decodeURI%':decodeURI,'%decodeURIComponent%':decodeURIComponent,'%encodeURI%':encodeURI,'%encodeURIComponent%':encodeURIComponent,'%Error%':Error,'%eval%':eval,// eslint-disable-line no-eval
'%EvalError%':EvalError,'%Float32Array%':typeof Float32Array==='undefined'?undefined:Float32Array,'%Float64Array%':typeof Float64Array==='undefined'?undefined:Float64Array,'%FinalizationRegistry%':typeof FinalizationRegistry==='undefined'?undefined:FinalizationRegistry,'%Function%':$Function,'%GeneratorFunction%':needsEval,'%Int8Array%':typeof Int8Array==='undefined'?undefined:Int8Array,'%Int16Array%':typeof Int16Array==='undefined'?undefined:Int16Array,'%Int32Array%':typeof Int32Array==='undefined'?undefined:Int32Array,'%isFinite%':isFinite,'%isNaN%':isNaN,'%IteratorPrototype%':hasSymbols?getProto(getProto([][Symbol.iterator]())):undefined,'%JSON%':typeof JSON==='object'?JSON:undefined,'%Map%':typeof Map==='undefined'?undefined:Map,'%MapIteratorPrototype%':typeof Map==='undefined'||!hasSymbols?undefined:getProto(new Map()[Symbol.iterator]()),'%Math%':Math,'%Number%':Number,'%Object%':Object,'%parseFloat%':parseFloat,'%parseInt%':parseInt,'%Promise%':typeof Promise==='undefined'?undefined:Promise,'%Proxy%':typeof Proxy==='undefined'?undefined:Proxy,'%RangeError%':RangeError,'%ReferenceError%':ReferenceError,'%Reflect%':typeof Reflect==='undefined'?undefined:Reflect,'%RegExp%':RegExp,'%Set%':typeof Set==='undefined'?undefined:Set,'%SetIteratorPrototype%':typeof Set==='undefined'||!hasSymbols?undefined:getProto(new Set()[Symbol.iterator]()),'%SharedArrayBuffer%':typeof SharedArrayBuffer==='undefined'?undefined:SharedArrayBuffer,'%String%':String,'%StringIteratorPrototype%':hasSymbols?getProto(''[Symbol.iterator]()):undefined,'%Symbol%':hasSymbols?Symbol:undefined,'%SyntaxError%':$SyntaxError,'%ThrowTypeError%':ThrowTypeError,'%TypedArray%':TypedArray,'%TypeError%':$TypeError,'%Uint8Array%':typeof Uint8Array==='undefined'?undefined:Uint8Array,'%Uint8ClampedArray%':typeof Uint8ClampedArray==='undefined'?undefined:Uint8ClampedArray,'%Uint16Array%':typeof Uint16Array==='undefined'?undefined:Uint16Array,'%Uint32Array%':typeof Uint32Array==='undefined'?undefined:Uint32Array,'%URIError%':URIError,'%WeakMap%':typeof WeakMap==='undefined'?undefined:WeakMap,'%WeakRef%':typeof WeakRef==='undefined'?undefined:WeakRef,'%WeakSet%':typeof WeakSet==='undefined'?undefined:WeakSet};try{null.error;// eslint-disable-line no-unused-expressions
}catch(e){// https://github.com/tc39/proposal-shadowrealm/pull/384#issuecomment-1364264229
var errorProto=getProto(getProto(e));INTRINSICS['%Error.prototype%']=errorProto;}var doEval=function doEval(name){var value;if(name==='%AsyncFunction%'){value=getEvalledConstructor('async function () {}');}else if(name==='%GeneratorFunction%'){value=getEvalledConstructor('function* () {}');}else if(name==='%AsyncGeneratorFunction%'){value=getEvalledConstructor('async function* () {}');}else if(name==='%AsyncGenerator%'){var fn=doEval('%AsyncGeneratorFunction%');if(fn){value=fn.prototype;}}else if(name==='%AsyncIteratorPrototype%'){var gen=doEval('%AsyncGenerator%');if(gen){value=getProto(gen.prototype);}}INTRINSICS[name]=value;return value;};var LEGACY_ALIASES={'%ArrayBufferPrototype%':['ArrayBuffer','prototype'],'%ArrayPrototype%':['Array','prototype'],'%ArrayProto_entries%':['Array','prototype','entries'],'%ArrayProto_forEach%':['Array','prototype','forEach'],'%ArrayProto_keys%':['Array','prototype','keys'],'%ArrayProto_values%':['Array','prototype','values'],'%AsyncFunctionPrototype%':['AsyncFunction','prototype'],'%AsyncGenerator%':['AsyncGeneratorFunction','prototype'],'%AsyncGeneratorPrototype%':['AsyncGeneratorFunction','prototype','prototype'],'%BooleanPrototype%':['Boolean','prototype'],'%DataViewPrototype%':['DataView','prototype'],'%DatePrototype%':['Date','prototype'],'%ErrorPrototype%':['Error','prototype'],'%EvalErrorPrototype%':['EvalError','prototype'],'%Float32ArrayPrototype%':['Float32Array','prototype'],'%Float64ArrayPrototype%':['Float64Array','prototype'],'%FunctionPrototype%':['Function','prototype'],'%Generator%':['GeneratorFunction','prototype'],'%GeneratorPrototype%':['GeneratorFunction','prototype','prototype'],'%Int8ArrayPrototype%':['Int8Array','prototype'],'%Int16ArrayPrototype%':['Int16Array','prototype'],'%Int32ArrayPrototype%':['Int32Array','prototype'],'%JSONParse%':['JSON','parse'],'%JSONStringify%':['JSON','stringify'],'%MapPrototype%':['Map','prototype'],'%NumberPrototype%':['Number','prototype'],'%ObjectPrototype%':['Object','prototype'],'%ObjProto_toString%':['Object','prototype','toString'],'%ObjProto_valueOf%':['Object','prototype','valueOf'],'%PromisePrototype%':['Promise','prototype'],'%PromiseProto_then%':['Promise','prototype','then'],'%Promise_all%':['Promise','all'],'%Promise_reject%':['Promise','reject'],'%Promise_resolve%':['Promise','resolve'],'%RangeErrorPrototype%':['RangeError','prototype'],'%ReferenceErrorPrototype%':['ReferenceError','prototype'],'%RegExpPrototype%':['RegExp','prototype'],'%SetPrototype%':['Set','prototype'],'%SharedArrayBufferPrototype%':['SharedArrayBuffer','prototype'],'%StringPrototype%':['String','prototype'],'%SymbolPrototype%':['Symbol','prototype'],'%SyntaxErrorPrototype%':['SyntaxError','prototype'],'%TypedArrayPrototype%':['TypedArray','prototype'],'%TypeErrorPrototype%':['TypeError','prototype'],'%Uint8ArrayPrototype%':['Uint8Array','prototype'],'%Uint8ClampedArrayPrototype%':['Uint8ClampedArray','prototype'],'%Uint16ArrayPrototype%':['Uint16Array','prototype'],'%Uint32ArrayPrototype%':['Uint32Array','prototype'],'%URIErrorPrototype%':['URIError','prototype'],'%WeakMapPrototype%':['WeakMap','prototype'],'%WeakSetPrototype%':['WeakSet','prototype']};var bind=require('function-bind');var hasOwn=require('has');var $concat=bind.call(Function.call,Array.prototype.concat);var $spliceApply=bind.call(Function.apply,Array.prototype.splice);var $replace=bind.call(Function.call,String.prototype.replace);var $strSlice=bind.call(Function.call,String.prototype.slice);var $exec=bind.call(Function.call,RegExp.prototype.exec);/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */var rePropName=/[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;var reEscapeChar=/\\(\\)?/g;/** Used to match backslashes in property paths. */var stringToPath=function stringToPath(string){var first=$strSlice(string,0,1);var last=$strSlice(string,-1);if(first==='%'&&last!=='%'){throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');}else if(last==='%'&&first!=='%'){throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');}var result=[];$replace(string,rePropName,function(match,number,quote,subString){result[result.length]=quote?$replace(subString,reEscapeChar,'$1'):number||match;});return result;};/* end adaptation */var getBaseIntrinsic=function getBaseIntrinsic(name,allowMissing){var intrinsicName=name;var alias;if(hasOwn(LEGACY_ALIASES,intrinsicName)){alias=LEGACY_ALIASES[intrinsicName];intrinsicName='%'+alias[0]+'%';}if(hasOwn(INTRINSICS,intrinsicName)){var value=INTRINSICS[intrinsicName];if(value===needsEval){value=doEval(intrinsicName);}if(typeof value==='undefined'&&!allowMissing){throw new $TypeError('intrinsic '+name+' exists, but is not available. Please file an issue!');}return{alias:alias,name:intrinsicName,value:value};}throw new $SyntaxError('intrinsic '+name+' does not exist!');};module.exports=function GetIntrinsic(name,allowMissing){if(typeof name!=='string'||name.length===0){throw new $TypeError('intrinsic name must be a non-empty string');}if(arguments.length>1&&typeof allowMissing!=='boolean'){throw new $TypeError('"allowMissing" argument must be a boolean');}if($exec(/^%?[^%]*%?$/,name)===null){throw new $SyntaxError('`%` may not be present anywhere but at the beginning and end of the intrinsic name');}var parts=stringToPath(name);var intrinsicBaseName=parts.length>0?parts[0]:'';var intrinsic=getBaseIntrinsic('%'+intrinsicBaseName+'%',allowMissing);var intrinsicRealName=intrinsic.name;var value=intrinsic.value;var skipFurtherCaching=false;var alias=intrinsic.alias;if(alias){intrinsicBaseName=alias[0];$spliceApply(parts,$concat([0,1],alias));}for(var i=1,isOwn=true;i<parts.length;i+=1){var part=parts[i];var first=$strSlice(part,0,1);var last=$strSlice(part,-1);if((first==='"'||first==="'"||first==='`'||last==='"'||last==="'"||last==='`')&&first!==last){throw new $SyntaxError('property names with quotes must have matching quotes');}if(part==='constructor'||!isOwn){skipFurtherCaching=true;}intrinsicBaseName+='.'+part;intrinsicRealName='%'+intrinsicBaseName+'%';if(hasOwn(INTRINSICS,intrinsicRealName)){value=INTRINSICS[intrinsicRealName];}else if(value!=null){if(!(part in value)){if(!allowMissing){throw new $TypeError('base intrinsic for '+name+' exists, but the property is not available.');}return void undefined;}if($gOPD&&i+1>=parts.length){var desc=$gOPD(value,part);isOwn=!!desc;// By convention, when a data property is converted to an accessor
// property to emulate a data property that does not suffer from
// the override mistake, that accessor's getter is marked with
// an `originalValue` property. Here, when we detect this, we
// uphold the illusion by pretending to see that original data
// property, i.e., returning the value rather than the getter
// itself.
if(isOwn&&'get'in desc&&!('originalValue'in desc.get)){value=desc.get;}else{value=value[part];}}else{isOwn=hasOwn(value,part);value=value[part];}if(isOwn&&!skipFurtherCaching){INTRINSICS[intrinsicRealName]=value;}}}return value;};},{"function-bind":36,"has":44,"has-symbols":41}],40:[function(require,module,exports){'use strict';var GetIntrinsic=require('get-intrinsic');var $gOPD=GetIntrinsic('%Object.getOwnPropertyDescriptor%',true);if($gOPD){try{$gOPD([],'length');}catch(e){// IE 8 has a broken gOPD
$gOPD=null;}}module.exports=$gOPD;},{"get-intrinsic":39}],41:[function(require,module,exports){'use strict';var origSymbol=typeof Symbol!=='undefined'&&Symbol;var hasSymbolSham=require('./shams');module.exports=function hasNativeSymbols(){if(typeof origSymbol!=='function'){return false;}if(typeof Symbol!=='function'){return false;}if(typeof origSymbol('foo')!=='symbol'){return false;}if(typeof Symbol('bar')!=='symbol'){return false;}return hasSymbolSham();};},{"./shams":42}],42:[function(require,module,exports){'use strict';/* eslint complexity: [2, 18], max-statements: [2, 33] */module.exports=function hasSymbols(){if(typeof Symbol!=='function'||typeof Object.getOwnPropertySymbols!=='function'){return false;}if(typeof Symbol.iterator==='symbol'){return true;}var obj={};var sym=Symbol('test');var symObj=Object(sym);if(typeof sym==='string'){return false;}if(Object.prototype.toString.call(sym)!=='[object Symbol]'){return false;}if(Object.prototype.toString.call(symObj)!=='[object Symbol]'){return false;}// temp disabled per https://github.com/ljharb/object.assign/issues/17
// if (sym instanceof Symbol) { return false; }
// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
// if (!(symObj instanceof Symbol)) { return false; }
// if (typeof Symbol.prototype.toString !== 'function') { return false; }
// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }
var symVal=42;obj[sym]=symVal;for(sym in obj){return false;}// eslint-disable-line no-restricted-syntax, no-unreachable-loop
if(typeof Object.keys==='function'&&Object.keys(obj).length!==0){return false;}if(typeof Object.getOwnPropertyNames==='function'&&Object.getOwnPropertyNames(obj).length!==0){return false;}var syms=Object.getOwnPropertySymbols(obj);if(syms.length!==1||syms[0]!==sym){return false;}if(!Object.prototype.propertyIsEnumerable.call(obj,sym)){return false;}if(typeof Object.getOwnPropertyDescriptor==='function'){var descriptor=Object.getOwnPropertyDescriptor(obj,sym);if(descriptor.value!==symVal||descriptor.enumerable!==true){return false;}}return true;};},{}],43:[function(require,module,exports){'use strict';var hasSymbols=require('has-symbols/shams');module.exports=function hasToStringTagShams(){return hasSymbols()&&!!Symbol.toStringTag;};},{"has-symbols/shams":42}],44:[function(require,module,exports){'use strict';var bind=require('function-bind');module.exports=bind.call(Function.call,Object.prototype.hasOwnProperty);},{"function-bind":36}],45:[function(require,module,exports){var http=require('http');var url=require('url');var https=module.exports;for(var key in http){if(http.hasOwnProperty(key))https[key]=http[key];}https.request=function(params,cb){params=validateParams(params);return http.request.call(this,params,cb);};https.get=function(params,cb){params=validateParams(params);return http.get.call(this,params,cb);};function validateParams(params){if(typeof params==='string'){params=url.parse(params);}if(!params.protocol){params.protocol='https:';}if(params.protocol!=='https:'){throw new Error('Protocol "'+params.protocol+'" not supported. Expected "https:"');}return params;}},{"http":144,"url":166}],46:[function(require,module,exports){/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */exports.read=function(buffer,offset,isLE,mLen,nBytes){var e,m;var eLen=nBytes*8-mLen-1;var eMax=(1<<eLen)-1;var eBias=eMax>>1;var nBits=-7;var i=isLE?nBytes-1:0;var d=isLE?-1:1;var s=buffer[offset+i];i+=d;e=s&(1<<-nBits)-1;s>>=-nBits;nBits+=eLen;for(;nBits>0;e=e*256+buffer[offset+i],i+=d,nBits-=8){}m=e&(1<<-nBits)-1;e>>=-nBits;nBits+=mLen;for(;nBits>0;m=m*256+buffer[offset+i],i+=d,nBits-=8){}if(e===0){e=1-eBias;}else if(e===eMax){return m?NaN:(s?-1:1)*Infinity;}else{m=m+Math.pow(2,mLen);e=e-eBias;}return(s?-1:1)*m*Math.pow(2,e-mLen);};exports.write=function(buffer,value,offset,isLE,mLen,nBytes){var e,m,c;var eLen=nBytes*8-mLen-1;var eMax=(1<<eLen)-1;var eBias=eMax>>1;var rt=mLen===23?Math.pow(2,-24)-Math.pow(2,-77):0;var i=isLE?0:nBytes-1;var d=isLE?1:-1;var s=value<0||value===0&&1/value<0?1:0;value=Math.abs(value);if(isNaN(value)||value===Infinity){m=isNaN(value)?1:0;e=eMax;}else{e=Math.floor(Math.log(value)/Math.LN2);if(value*(c=Math.pow(2,-e))<1){e--;c*=2;}if(e+eBias>=1){value+=rt/c;}else{value+=rt*Math.pow(2,1-eBias);}if(value*c>=2){e++;c/=2;}if(e+eBias>=eMax){m=0;e=eMax;}else if(e+eBias>=1){m=(value*c-1)*Math.pow(2,mLen);e=e+eBias;}else{m=value*Math.pow(2,eBias-1)*Math.pow(2,mLen);e=0;}}for(;mLen>=8;buffer[offset+i]=m&0xff,i+=d,m/=256,mLen-=8){}e=e<<mLen|m;eLen+=mLen;for(;eLen>0;buffer[offset+i]=e&0xff,i+=d,e/=256,eLen-=8){}buffer[offset+i-d]|=s*128;};},{}],47:[function(require,module,exports){if(typeof Object.create==='function'){// implementation from standard node.js 'util' module
module.exports=function inherits(ctor,superCtor){if(superCtor){ctor.super_=superCtor;ctor.prototype=Object.create(superCtor.prototype,{constructor:{value:ctor,enumerable:false,writable:true,configurable:true}});}};}else{// old school shim for old browsers
module.exports=function inherits(ctor,superCtor){if(superCtor){ctor.super_=superCtor;var TempCtor=function(){};TempCtor.prototype=superCtor.prototype;ctor.prototype=new TempCtor();ctor.prototype.constructor=ctor;}};}},{}],48:[function(require,module,exports){'use strict';var hasToStringTag=require('has-tostringtag/shams')();var callBound=require('call-bind/callBound');var $toString=callBound('Object.prototype.toString');var isStandardArguments=function isArguments(value){if(hasToStringTag&&value&&typeof value==='object'&&Symbol.toStringTag in value){return false;}return $toString(value)==='[object Arguments]';};var isLegacyArguments=function isArguments(value){if(isStandardArguments(value)){return true;}return value!==null&&typeof value==='object'&&typeof value.length==='number'&&value.length>=0&&$toString(value)!=='[object Array]'&&$toString(value.callee)==='[object Function]';};var supportsStandardArguments=function(){return isStandardArguments(arguments);}();isStandardArguments.isLegacyArguments=isLegacyArguments;// for tests
module.exports=supportsStandardArguments?isStandardArguments:isLegacyArguments;},{"call-bind/callBound":24,"has-tostringtag/shams":43}],49:[function(require,module,exports){'use strict';var fnToStr=Function.prototype.toString;var reflectApply=typeof Reflect==='object'&&Reflect!==null&&Reflect.apply;var badArrayLike;var isCallableMarker;if(typeof reflectApply==='function'&&typeof Object.defineProperty==='function'){try{badArrayLike=Object.defineProperty({},'length',{get:function(){throw isCallableMarker;}});isCallableMarker={};// eslint-disable-next-line no-throw-literal
reflectApply(function(){throw 42;},null,badArrayLike);}catch(_){if(_!==isCallableMarker){reflectApply=null;}}}else{reflectApply=null;}var constructorRegex=/^\s*class\b/;var isES6ClassFn=function isES6ClassFunction(value){try{var fnStr=fnToStr.call(value);return constructorRegex.test(fnStr);}catch(e){return false;// not a function
}};var tryFunctionObject=function tryFunctionToStr(value){try{if(isES6ClassFn(value)){return false;}fnToStr.call(value);return true;}catch(e){return false;}};var toStr=Object.prototype.toString;var objectClass='[object Object]';var fnClass='[object Function]';var genClass='[object GeneratorFunction]';var ddaClass='[object HTMLAllCollection]';// IE 11
var ddaClass2='[object HTML document.all class]';var ddaClass3='[object HTMLCollection]';// IE 9-10
var hasToStringTag=typeof Symbol==='function'&&!!Symbol.toStringTag;// better: use `has-tostringtag`
var isIE68=!(0 in[,]);// eslint-disable-line no-sparse-arrays, comma-spacing
var isDDA=function isDocumentDotAll(){return false;};if(typeof document==='object'){// Firefox 3 canonicalizes DDA to undefined when it's not accessed directly
var all=document.all;if(toStr.call(all)===toStr.call(document.all)){isDDA=function isDocumentDotAll(value){/* globals document: false */ // in IE 6-8, typeof document.all is "object" and it's truthy
if((isIE68||!value)&&(typeof value==='undefined'||typeof value==='object')){try{var str=toStr.call(value);return(str===ddaClass||str===ddaClass2||str===ddaClass3// opera 12.16
||str===objectClass// IE 6-8
)&&value('')==null;// eslint-disable-line eqeqeq
}catch(e){/**/}}return false;};}}module.exports=reflectApply?function isCallable(value){if(isDDA(value)){return true;}if(!value){return false;}if(typeof value!=='function'&&typeof value!=='object'){return false;}try{reflectApply(value,null,badArrayLike);}catch(e){if(e!==isCallableMarker){return false;}}return!isES6ClassFn(value)&&tryFunctionObject(value);}:function isCallable(value){if(isDDA(value)){return true;}if(!value){return false;}if(typeof value!=='function'&&typeof value!=='object'){return false;}if(hasToStringTag){return tryFunctionObject(value);}if(isES6ClassFn(value)){return false;}var strClass=toStr.call(value);if(strClass!==fnClass&&strClass!==genClass&&!/^\[object HTML/.test(strClass)){return false;}return tryFunctionObject(value);};},{}],50:[function(require,module,exports){'use strict';var toStr=Object.prototype.toString;var fnToStr=Function.prototype.toString;var isFnRegex=/^\s*(?:function)?\*/;var hasToStringTag=require('has-tostringtag/shams')();var getProto=Object.getPrototypeOf;var getGeneratorFunc=function(){// eslint-disable-line consistent-return
if(!hasToStringTag){return false;}try{return Function('return function*() {}')();}catch(e){}};var GeneratorFunction;module.exports=function isGeneratorFunction(fn){if(typeof fn!=='function'){return false;}if(isFnRegex.test(fnToStr.call(fn))){return true;}if(!hasToStringTag){var str=toStr.call(fn);return str==='[object GeneratorFunction]';}if(!getProto){return false;}if(typeof GeneratorFunction==='undefined'){var generatorFunc=getGeneratorFunc();GeneratorFunction=generatorFunc?getProto(generatorFunc):false;}return getProto(fn)===GeneratorFunction;};},{"has-tostringtag/shams":43}],51:[function(require,module,exports){var reIpv4FirstPass=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;var reSubnetString=/\/\d{1,3}(?=%|$)/;var reForwardSlash=/\//;var reZone=/%.*$/;var reBadCharacters=/([^0-9a-f:/%])/i;var reBadAddress=/([0-9a-f]{5,}|:{3,}|[^:]:$|^:[^:]|\/$)/i;function validate4(input){if(!reIpv4FirstPass.test(input))return false;var parts=input.split('.');if(parts.length!==4)return false;if(parts[0][0]==='0'&&parts[0].length>1)return false;if(parts[1][0]==='0'&&parts[1].length>1)return false;if(parts[2][0]==='0'&&parts[2].length>1)return false;if(parts[3][0]==='0'&&parts[3].length>1)return false;var n0=Number(parts[0]);var n1=Number(parts[1]);var n2=Number(parts[2]);var n3=Number(parts[3]);return n0>=0&&n0<256&&n1>=0&&n1<256&&n2>=0&&n2<256&&n3>=0&&n3<256;}function validate6(input){var withoutSubnet=input.replace(reSubnetString,'');var hasSubnet=input.length!==withoutSubnet.length;// FIXME: this should probably be an option in the future
if(hasSubnet)return false;if(!hasSubnet){if(reForwardSlash.test(input))return false;}var withoutZone=withoutSubnet.replace(reZone,'');var lastPartSeparator=withoutZone.lastIndexOf(':');if(lastPartSeparator===-1)return false;var lastPart=withoutZone.substring(lastPartSeparator+1);var hasV4Part=validate4(lastPart);var address=hasV4Part?withoutZone.substring(0,lastPartSeparator+1)+'1234:5678':withoutZone;if(reBadCharacters.test(address))return false;if(reBadAddress.test(address))return false;var halves=address.split('::');if(halves.length>2)return false;if(halves.length===2){var first=halves[0]===''?[]:halves[0].split(':');var last=halves[1]===''?[]:halves[1].split(':');var remainingLength=8-(first.length+last.length);if(remainingLength<=0)return false;}else{if(address.split(':').length!==8)return false;}return true;}function validate(input){return validate4(input)||validate6(input);}module.exports=function validator(options){if(!options)options={};if(options.version===4)return validate4;if(options.version===6)return validate6;if(options.version==null)return validate;throw new Error('Unknown version: '+options.version);};module.exports['__all_regexes__']=[reIpv4FirstPass,reSubnetString,reForwardSlash,reZone,reBadCharacters,reBadAddress];},{}],52:[function(require,module,exports){var createIpValidator=require('is-my-ip-valid');var reEmailWhitespace=/\s/;var reHostnameFirstPass=/^[a-zA-Z0-9.-]+$/;var reHostnamePart=/^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])$/;var rePhoneFirstPass=/^\+[0-9][0-9 ]{5,27}[0-9]$/;var rePhoneDoubleSpace=/ {2}/;var rePhoneGlobalSpace=/ /g;exports['date-time']=/^\d{4}-(?:0[0-9]{1}|1[0-2]{1})-[0-9]{2}[tT ]\d{2}:\d{2}:\d{2}(?:\.\d+|)([zZ]|[+-]\d{2}:\d{2})$/;exports['date']=/^\d{4}-(?:0[0-9]{1}|1[0-2]{1})-[0-9]{2}$/;exports['time']=/^\d{2}:\d{2}:\d{2}$/;exports['email']=function(input){return input.indexOf('@')!==-1&&!reEmailWhitespace.test(input);};exports['ip-address']=exports['ipv4']=createIpValidator({version:4});exports['ipv6']=createIpValidator({version:6});exports['uri']=/^[a-zA-Z][a-zA-Z0-9+\-.]*:[^\s]*$/;exports['color']=/(#?([0-9A-Fa-f]{3,6})\b)|(aqua)|(black)|(blue)|(fuchsia)|(gray)|(green)|(lime)|(maroon)|(navy)|(olive)|(orange)|(purple)|(red)|(silver)|(teal)|(white)|(yellow)|(rgb\(\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*\))|(rgb\(\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*\))/;exports['hostname']=function(input){if(!reHostnameFirstPass.test(input))return false;var parts=input.split('.');for(var i=0;i<parts.length;i++){if(!reHostnamePart.test(parts[i]))return false;}return true;};exports['alpha']=/^[a-zA-Z]+$/;exports['alphanumeric']=/^[a-zA-Z0-9]+$/;exports['style']=/.:\s*[^;]/g;exports['phone']=function(input){if(!rePhoneFirstPass.test(input))return false;if(rePhoneDoubleSpace.test(input))return false;var digits=input.substring(1).replace(rePhoneGlobalSpace,'').length;return digits>=7&&digits<=15;};exports['utc-millisec']=/^[0-9]{1,15}\.?[0-9]{0,15}$/;},{"is-my-ip-valid":51}],53:[function(require,module,exports){var genobj=require('generate-object-property');var genfun=require('generate-function');var jsonpointer=require('jsonpointer');var xtend=require('xtend');var formats=require('./formats');var get=function(obj,additionalSchemas,ptr){var visit=function(sub){if(sub&&sub.id===ptr)return sub;if(typeof sub!=='object'||!sub)return null;return Object.keys(sub).reduce(function(res,k){return res||visit(sub[k]);},null);};var res=visit(obj);if(res)return res;ptr=ptr.replace(/^#/,'');ptr=ptr.replace(/\/$/,'');try{return jsonpointer.get(obj,decodeURI(ptr));}catch(err){var end=ptr.indexOf('#');var other;// external reference
if(end!==0){// fragment doesn't exist.
if(end===-1){other=additionalSchemas[ptr];}else{var ext=ptr.slice(0,end);other=additionalSchemas[ext];var fragment=ptr.slice(end).replace(/^#/,'');try{return jsonpointer.get(other,fragment);}catch(err){}}}else{other=additionalSchemas[ptr];}return other||null;}};var types={};types.any=function(){return'true';};types.null=function(name){return name+' === null';};types.boolean=function(name){return'typeof '+name+' === "boolean"';};types.array=function(name){return'Array.isArray('+name+')';};types.object=function(name){return'typeof '+name+' === "object" && '+name+' && !Array.isArray('+name+')';};types.number=function(name){return'typeof '+name+' === "number" && isFinite('+name+')';};types.integer=function(name){return'typeof '+name+' === "number" && (Math.floor('+name+') === '+name+' || '+name+' > 9007199254740992 || '+name+' < -9007199254740992)';};types.string=function(name){return'typeof '+name+' === "string"';};var unique=function(array,len){len=Math.min(len===-1?array.length:len,array.length);var list=[];for(var i=0;i<len;i++){list.push(typeof array[i]==='object'?JSON.stringify(array[i]):array[i]);}for(var i=1;i<list.length;i++){if(list.indexOf(list[i])!==i)return false;}return true;};var isMultipleOf=function(name,multipleOf){var res;var factor=(multipleOf|0)!==multipleOf?Math.pow(10,multipleOf.toString().split('.').pop().length):1;if(factor>1){var factorName=(name|0)!==name?Math.pow(10,name.toString().split('.').pop().length):1;if(factorName>factor)res=true;else res=Math.round(factor*name)%(factor*multipleOf);}else res=name%multipleOf;return!res;};var testLimitedRegex=function(r,s,maxLength){if(maxLength>-1&&s.length>maxLength)return true;return r.test(s);};var compile=function(schema,cache,root,reporter,opts){var fmts=opts?xtend(formats,opts.formats):formats;var scope={unique:unique,formats:fmts,isMultipleOf:isMultipleOf,testLimitedRegex:testLimitedRegex};var verbose=opts?!!opts.verbose:false;var greedy=opts&&opts.greedy!==undefined?opts.greedy:false;var syms={};var allocated=[];var gensym=function(name){var res=name+(syms[name]=(syms[name]||0)+1);allocated.push(res);return res;};var formatName=function(field){var s=JSON.stringify(field);try{var pattern=/\[([^\[\]"]+)\]/;while(pattern.test(s))s=s.replace(pattern,replacer);return s;}catch(_){return JSON.stringify(field);}function replacer(match,v){if(allocated.indexOf(v)===-1)throw new Error('Unreplaceable');return'." + '+v+' + "';}};var reversePatterns={};var patterns=function(p){if(reversePatterns[p])return reversePatterns[p];var n=gensym('pattern');scope[n]=new RegExp(p);reversePatterns[p]=n;return n;};var vars=['i','j','k','l','m','n','o','p','q','r','s','t','u','v','x','y','z'];var genloop=function(){var v=vars.shift();vars.push(v+v[0]);allocated.push(v);return v;};var visit=function(name,node,reporter,filter,schemaPath){var properties=node.properties;var type=node.type;var tuple=false;if(Array.isArray(node.items)){// tuple type
properties={};node.items.forEach(function(item,i){properties[i]=item;});type='array';tuple=true;}var indent=0;var error=function(msg,prop,value){validate('errors++');if(reporter===true){validate('if (validate.errors === null) validate.errors = []');if(verbose){validate('validate.errors.push({field:%s,message:%s,value:%s,type:%s,schemaPath:%s})',formatName(prop||name),JSON.stringify(msg),value||name,JSON.stringify(type),JSON.stringify(schemaPath));}else{validate('validate.errors.push({field:%s,message:%s})',formatName(prop||name),JSON.stringify(msg));}}};if(node.required===true){indent++;validate('if (%s === undefined) {',name);error('is required');validate('} else {');}else{indent++;validate('if (%s !== undefined) {',name);}var valid=[].concat(type).map(function(t){if(t&&!types.hasOwnProperty(t)){throw new Error('Unknown type: '+t);}return types[t||'any'](name);}).join(' || ')||'true';if(valid!=='true'){indent++;validate('if (!(%s)) {',valid);error('is the wrong type');validate('} else {');}if(tuple){if(node.additionalItems===false){validate('if (%s.length > %d) {',name,node.items.length);error('has additional items');validate('}');}else if(node.additionalItems){var i=genloop();validate('for (var %s = %d; %s < %s.length; %s++) {',i,node.items.length,i,name,i);visit(name+'['+i+']',node.additionalItems,reporter,filter,schemaPath.concat('additionalItems'));validate('}');}}if(node.format&&fmts[node.format]){if(type!=='string'&&formats[node.format])validate('if (%s) {',types.string(name));var n=gensym('format');scope[n]=fmts[node.format];if(typeof scope[n]==='function')validate('if (!%s(%s)) {',n,name);else validate('if (!testLimitedRegex(%s, %s, %d)) {',n,name,typeof node.maxLength==='undefined'?-1:node.maxLength);error('must be '+node.format+' format');validate('}');if(type!=='string'&&formats[node.format])validate('}');}if(Array.isArray(node.required)){var n=gensym('missing');validate('var %s = 0',n);var checkRequired=function(req){var prop=genobj(name,req);validate('if (%s === undefined) {',prop);error('is required',prop);validate('%s++',n);validate('}');};validate('if ((%s)) {',type!=='object'?types.object(name):'true');node.required.map(checkRequired);validate('}');if(!greedy){validate('if (%s === 0) {',n);indent++;}}if(node.uniqueItems){if(type!=='array')validate('if (%s) {',types.array(name));validate('if (!(unique(%s, %d))) {',name,node.maxItems||-1);error('must be unique');validate('}');if(type!=='array')validate('}');}if(node.enum){var complex=node.enum.some(function(e){return typeof e==='object';});var compare=complex?function(e){return'JSON.stringify('+name+')'+' !== JSON.stringify('+JSON.stringify(e)+')';}:function(e){return name+' !== '+JSON.stringify(e);};validate('if (%s) {',node.enum.map(compare).join(' && ')||'false');error('must be an enum value');validate('}');}if(node.dependencies){if(type!=='object')validate('if (%s) {',types.object(name));Object.keys(node.dependencies).forEach(function(key){var deps=node.dependencies[key];if(typeof deps==='string')deps=[deps];var exists=function(k){return genobj(name,k)+' !== undefined';};if(Array.isArray(deps)){validate('if (%s !== undefined && !(%s)) {',genobj(name,key),deps.map(exists).join(' && ')||'true');error('dependencies not set');validate('}');}if(typeof deps==='object'){validate('if (%s !== undefined) {',genobj(name,key));visit(name,deps,reporter,filter,schemaPath.concat(['dependencies',key]));validate('}');}});if(type!=='object')validate('}');}if(node.additionalProperties||node.additionalProperties===false){if(type!=='object')validate('if (%s) {',types.object(name));var i=genloop();var keys=gensym('keys');var toCompare=function(p){return keys+'['+i+'] !== '+JSON.stringify(p);};var toTest=function(p){return'!'+patterns(p)+'.test('+keys+'['+i+'])';};var additionalProp=Object.keys(properties||{}).map(toCompare).concat(Object.keys(node.patternProperties||{}).map(toTest)).join(' && ')||'true';validate('var %s = Object.keys(%s)',keys,name)('for (var %s = 0; %s < %s.length; %s++) {',i,i,keys,i)('if (%s) {',additionalProp);if(node.additionalProperties===false){if(filter)validate('delete %s',name+'['+keys+'['+i+']]');error('has additional properties',null,JSON.stringify(name+'.')+' + '+keys+'['+i+']');}else{visit(name+'['+keys+'['+i+']]',node.additionalProperties,reporter,filter,schemaPath.concat(['additionalProperties']));}validate('}')('}');if(type!=='object')validate('}');}if(node.$ref){var sub=get(root,opts&&opts.schemas||{},node.$ref);if(sub){var fn=cache[node.$ref];if(!fn){cache[node.$ref]=function proxy(data){return fn(data);};fn=compile(sub,cache,root,false,opts);}var n=gensym('ref');scope[n]=fn;validate('if (!(%s(%s))) {',n,name);error('referenced schema does not match');validate('}');}}if(node.not){var prev=gensym('prev');validate('var %s = errors',prev);visit(name,node.not,false,filter,schemaPath.concat('not'));validate('if (%s === errors) {',prev);error('negative schema matches');validate('} else {')('errors = %s',prev)('}');}if(node.items&&!tuple){if(type!=='array')validate('if (%s) {',types.array(name));var i=genloop();validate('for (var %s = 0; %s < %s.length; %s++) {',i,i,name,i);visit(name+'['+i+']',node.items,reporter,filter,schemaPath.concat('items'));validate('}');if(type!=='array')validate('}');}if(node.patternProperties){if(type!=='object')validate('if (%s) {',types.object(name));var keys=gensym('keys');var i=genloop();validate('var %s = Object.keys(%s)',keys,name)('for (var %s = 0; %s < %s.length; %s++) {',i,i,keys,i);Object.keys(node.patternProperties).forEach(function(key){var p=patterns(key);validate('if (%s.test(%s)) {',p,keys+'['+i+']');visit(name+'['+keys+'['+i+']]',node.patternProperties[key],reporter,filter,schemaPath.concat(['patternProperties',key]));validate('}');});validate('}');if(type!=='object')validate('}');}if(node.pattern){var p=patterns(node.pattern);if(type!=='string')validate('if (%s) {',types.string(name));validate('if (!(testLimitedRegex(%s, %s, %d))) {',p,name,typeof node.maxLength==='undefined'?-1:node.maxLength);error('pattern mismatch');validate('}');if(type!=='string')validate('}');}if(node.allOf){node.allOf.forEach(function(sch,key){visit(name,sch,reporter,filter,schemaPath.concat(['allOf',key]));});}if(node.anyOf&&node.anyOf.length){var prev=gensym('prev');node.anyOf.forEach(function(sch,i){if(i===0){validate('var %s = errors',prev);}else{validate('if (errors !== %s) {',prev)('errors = %s',prev);}visit(name,sch,false,false,schemaPath);});node.anyOf.forEach(function(sch,i){if(i)validate('}');});validate('if (%s !== errors) {',prev);error('no schemas match');validate('}');}if(node.oneOf&&node.oneOf.length){var prev=gensym('prev');var passes=gensym('passes');validate('var %s = errors',prev)('var %s = 0',passes);node.oneOf.forEach(function(sch,i){visit(name,sch,false,false,schemaPath);validate('if (%s === errors) {',prev)('%s++',passes)('} else {')('errors = %s',prev)('}');});validate('if (%s !== 1) {',passes);error('no (or more than one) schemas match');validate('}');}if(node.multipleOf!==undefined){if(type!=='number'&&type!=='integer')validate('if (%s) {',types.number(name));validate('if (!isMultipleOf(%s, %d)) {',name,node.multipleOf);error('has a remainder');validate('}');if(type!=='number'&&type!=='integer')validate('}');}if(node.maxProperties!==undefined){if(type!=='object')validate('if (%s) {',types.object(name));validate('if (Object.keys(%s).length > %d) {',name,node.maxProperties);error('has more properties than allowed');validate('}');if(type!=='object')validate('}');}if(node.minProperties!==undefined){if(type!=='object')validate('if (%s) {',types.object(name));validate('if (Object.keys(%s).length < %d) {',name,node.minProperties);error('has less properties than allowed');validate('}');if(type!=='object')validate('}');}if(node.maxItems!==undefined){if(type!=='array')validate('if (%s) {',types.array(name));validate('if (%s.length > %d) {',name,node.maxItems);error('has more items than allowed');validate('}');if(type!=='array')validate('}');}if(node.minItems!==undefined){if(type!=='array')validate('if (%s) {',types.array(name));validate('if (%s.length < %d) {',name,node.minItems);error('has less items than allowed');validate('}');if(type!=='array')validate('}');}if(node.maxLength!==undefined){if(type!=='string')validate('if (%s) {',types.string(name));validate('if (%s.length > %d) {',name,node.maxLength);error('has longer length than allowed');validate('}');if(type!=='string')validate('}');}if(node.minLength!==undefined){if(type!=='string')validate('if (%s) {',types.string(name));validate('if (%s.length < %d) {',name,node.minLength);error('has less length than allowed');validate('}');if(type!=='string')validate('}');}if(node.minimum!==undefined){if(type!=='number'&&type!=='integer')validate('if (%s) {',types.number(name));validate('if (%s %s %d) {',name,node.exclusiveMinimum?'<=':'<',node.minimum);error('is less than minimum');validate('}');if(type!=='number'&&type!=='integer')validate('}');}if(node.maximum!==undefined){if(type!=='number'&&type!=='integer')validate('if (%s) {',types.number(name));validate('if (%s %s %d) {',name,node.exclusiveMaximum?'>=':'>',node.maximum);error('is more than maximum');validate('}');if(type!=='number'&&type!=='integer')validate('}');}if(properties){Object.keys(properties).forEach(function(p){if(Array.isArray(type)&&type.indexOf('null')!==-1)validate('if (%s !== null) {',name);visit(genobj(name,p),properties[p],reporter,filter,schemaPath.concat(tuple?p:['properties',p]));if(Array.isArray(type)&&type.indexOf('null')!==-1)validate('}');});}while(indent--)validate('}');};var validate=genfun('function validate(data) {')// Since undefined is not a valid JSON value, we coerce to null and other checks will catch this
('if (data === undefined) data = null')('validate.errors = null')('var errors = 0');visit('data',schema,reporter,opts&&opts.filter,[]);validate('return errors === 0')('}');validate=validate.toFunction(scope);validate.errors=null;if(Object.defineProperty){Object.defineProperty(validate,'error',{get:function(){if(!validate.errors)return'';return validate.errors.map(function(err){return err.field+' '+err.message;}).join('\n');}});}validate.toJSON=function(){return schema;};return validate;};module.exports=function(schema,opts){if(typeof schema==='string')schema=JSON.parse(schema);return compile(schema,{},schema,true,opts);};module.exports.filter=function(schema,opts){var validate=module.exports(schema,xtend(opts,{filter:true}));return function(sch){validate(sch);return sch;};};},{"./formats":52,"generate-function":37,"generate-object-property":38,"jsonpointer":57,"xtend":174}],54:[function(require,module,exports){"use strict";function isProperty(str){return /^[$A-Z\_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc][$A-Z\_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc0-9\u0300-\u036f\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08e4-\u08fe\u0900-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d02\u0d03\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19b0-\u19c0\u19c8\u19c9\u19d0-\u19d9\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1dc0-\u1de6\u1dfc-\u1dff\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8e0-\ua8f1\ua900-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f]*$/.test(str);}module.exports=isProperty;},{}],55:[function(require,module,exports){(function(global){(function(){'use strict';var forEach=require('for-each');var availableTypedArrays=require('available-typed-arrays');var callBound=require('call-bind/callBound');var $toString=callBound('Object.prototype.toString');var hasToStringTag=require('has-tostringtag/shams')();var gOPD=require('gopd');var g=typeof globalThis==='undefined'?global:globalThis;var typedArrays=availableTypedArrays();var $indexOf=callBound('Array.prototype.indexOf',true)||function indexOf(array,value){for(var i=0;i<array.length;i+=1){if(array[i]===value){return i;}}return-1;};var $slice=callBound('String.prototype.slice');var toStrTags={};var getPrototypeOf=Object.getPrototypeOf;// require('getprototypeof');
if(hasToStringTag&&gOPD&&getPrototypeOf){forEach(typedArrays,function(typedArray){var arr=new g[typedArray]();if(Symbol.toStringTag in arr){var proto=getPrototypeOf(arr);var descriptor=gOPD(proto,Symbol.toStringTag);if(!descriptor){var superProto=getPrototypeOf(proto);descriptor=gOPD(superProto,Symbol.toStringTag);}toStrTags[typedArray]=descriptor.get;}});}var tryTypedArrays=function tryAllTypedArrays(value){var anyTrue=false;forEach(toStrTags,function(getter,typedArray){if(!anyTrue){try{anyTrue=getter.call(value)===typedArray;}catch(e){/**/}}});return anyTrue;};module.exports=function isTypedArray(value){if(!value||typeof value!=='object'){return false;}if(!hasToStringTag||!(Symbol.toStringTag in value)){var tag=$slice($toString(value),8,-1);return $indexOf(typedArrays,tag)>-1;}if(!gOPD){return false;}return tryTypedArrays(value);};}).call(this);}).call(this,typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{});},{"available-typed-arrays":18,"call-bind/callBound":24,"for-each":27,"gopd":40,"has-tostringtag/shams":43}],56:[function(require,module,exports){(function(Buffer){(function(){/*global Buffer*/ // Named constants with unique integer values
var C={};// Tokens
var LEFT_BRACE=C.LEFT_BRACE=0x1;var RIGHT_BRACE=C.RIGHT_BRACE=0x2;var LEFT_BRACKET=C.LEFT_BRACKET=0x3;var RIGHT_BRACKET=C.RIGHT_BRACKET=0x4;var COLON=C.COLON=0x5;var COMMA=C.COMMA=0x6;var TRUE=C.TRUE=0x7;var FALSE=C.FALSE=0x8;var NULL=C.NULL=0x9;var STRING=C.STRING=0xa;var NUMBER=C.NUMBER=0xb;// Tokenizer States
var START=C.START=0x11;var STOP=C.STOP=0x12;var TRUE1=C.TRUE1=0x21;var TRUE2=C.TRUE2=0x22;var TRUE3=C.TRUE3=0x23;var FALSE1=C.FALSE1=0x31;var FALSE2=C.FALSE2=0x32;var FALSE3=C.FALSE3=0x33;var FALSE4=C.FALSE4=0x34;var NULL1=C.NULL1=0x41;var NULL2=C.NULL2=0x42;var NULL3=C.NULL3=0x43;var NUMBER1=C.NUMBER1=0x51;var NUMBER3=C.NUMBER3=0x53;var STRING1=C.STRING1=0x61;var STRING2=C.STRING2=0x62;var STRING3=C.STRING3=0x63;var STRING4=C.STRING4=0x64;var STRING5=C.STRING5=0x65;var STRING6=C.STRING6=0x66;// Parser States
var VALUE=C.VALUE=0x71;var KEY=C.KEY=0x72;// Parser Modes
var OBJECT=C.OBJECT=0x81;var ARRAY=C.ARRAY=0x82;// Character constants
var BACK_SLASH="\\".charCodeAt(0);var FORWARD_SLASH="\/".charCodeAt(0);var BACKSPACE="\b".charCodeAt(0);var FORM_FEED="\f".charCodeAt(0);var NEWLINE="\n".charCodeAt(0);var CARRIAGE_RETURN="\r".charCodeAt(0);var TAB="\t".charCodeAt(0);var STRING_BUFFER_SIZE=64*1024;function Parser(){this.tState=START;this.value=undefined;this.string=undefined;// string data
this.stringBuffer=Buffer.alloc?Buffer.alloc(STRING_BUFFER_SIZE):new Buffer(STRING_BUFFER_SIZE);this.stringBufferOffset=0;this.unicode=undefined;// unicode escapes
this.highSurrogate=undefined;this.key=undefined;this.mode=undefined;this.stack=[];this.state=VALUE;this.bytes_remaining=0;// number of bytes remaining in multi byte utf8 char to read after split boundary
this.bytes_in_sequence=0;// bytes in multi byte utf8 char to read
this.temp_buffs={"2":new Buffer(2),"3":new Buffer(3),"4":new Buffer(4)};// for rebuilding chars split before boundary is reached
// Stream offset
this.offset=-1;}// Slow code to string converter (only used when throwing syntax errors)
Parser.toknam=function(code){var keys=Object.keys(C);for(var i=0,l=keys.length;i<l;i++){var key=keys[i];if(C[key]===code){return key;}}return code&&"0x"+code.toString(16);};var proto=Parser.prototype;proto.onError=function(err){throw err;};proto.charError=function(buffer,i){this.tState=STOP;this.onError(new Error("Unexpected "+JSON.stringify(String.fromCharCode(buffer[i]))+" at position "+i+" in state "+Parser.toknam(this.tState)));};proto.appendStringChar=function(char){if(this.stringBufferOffset>=STRING_BUFFER_SIZE){this.string+=this.stringBuffer.toString('utf8');this.stringBufferOffset=0;}this.stringBuffer[this.stringBufferOffset++]=char;};proto.appendStringBuf=function(buf,start,end){var size=buf.length;if(typeof start==='number'){if(typeof end==='number'){if(end<0){// adding a negative end decreeses the size
size=buf.length-start+end;}else{size=end-start;}}else{size=buf.length-start;}}if(size<0){size=0;}if(this.stringBufferOffset+size>STRING_BUFFER_SIZE){this.string+=this.stringBuffer.toString('utf8',0,this.stringBufferOffset);this.stringBufferOffset=0;}buf.copy(this.stringBuffer,this.stringBufferOffset,start,end);this.stringBufferOffset+=size;};proto.write=function(buffer){if(typeof buffer==="string")buffer=new Buffer(buffer);var n;for(var i=0,l=buffer.length;i<l;i++){if(this.tState===START){n=buffer[i];this.offset++;if(n===0x7b){this.onToken(LEFT_BRACE,"{");// {
}else if(n===0x7d){this.onToken(RIGHT_BRACE,"}");// }
}else if(n===0x5b){this.onToken(LEFT_BRACKET,"[");// [
}else if(n===0x5d){this.onToken(RIGHT_BRACKET,"]");// ]
}else if(n===0x3a){this.onToken(COLON,":");// :
}else if(n===0x2c){this.onToken(COMMA,",");// ,
}else if(n===0x74){this.tState=TRUE1;// t
}else if(n===0x66){this.tState=FALSE1;// f
}else if(n===0x6e){this.tState=NULL1;// n
}else if(n===0x22){// "
this.string="";this.stringBufferOffset=0;this.tState=STRING1;}else if(n===0x2d){this.string="-";this.tState=NUMBER1;// -
}else{if(n>=0x30&&n<0x40){// 1-9
this.string=String.fromCharCode(n);this.tState=NUMBER3;}else if(n===0x20||n===0x09||n===0x0a||n===0x0d){// whitespace
}else{return this.charError(buffer,i);}}}else if(this.tState===STRING1){// After open quote
n=buffer[i];// get current byte from buffer
// check for carry over of a multi byte char split between data chunks
// & fill temp buffer it with start of this data chunk up to the boundary limit set in the last iteration
if(this.bytes_remaining>0){for(var j=0;j<this.bytes_remaining;j++){this.temp_buffs[this.bytes_in_sequence][this.bytes_in_sequence-this.bytes_remaining+j]=buffer[j];}this.appendStringBuf(this.temp_buffs[this.bytes_in_sequence]);this.bytes_in_sequence=this.bytes_remaining=0;i=i+j-1;}else if(this.bytes_remaining===0&&n>=128){// else if no remainder bytes carried over, parse multi byte (>=128) chars one at a time
if(n<=193||n>244){return this.onError(new Error("Invalid UTF-8 character at position "+i+" in state "+Parser.toknam(this.tState)));}if(n>=194&&n<=223)this.bytes_in_sequence=2;if(n>=224&&n<=239)this.bytes_in_sequence=3;if(n>=240&&n<=244)this.bytes_in_sequence=4;if(this.bytes_in_sequence+i>buffer.length){// if bytes needed to complete char fall outside buffer length, we have a boundary split
for(var k=0;k<=buffer.length-1-i;k++){this.temp_buffs[this.bytes_in_sequence][k]=buffer[i+k];// fill temp buffer of correct size with bytes available in this chunk
}this.bytes_remaining=i+this.bytes_in_sequence-buffer.length;i=buffer.length-1;}else{this.appendStringBuf(buffer,i,i+this.bytes_in_sequence);i=i+this.bytes_in_sequence-1;}}else if(n===0x22){this.tState=START;this.string+=this.stringBuffer.toString('utf8',0,this.stringBufferOffset);this.stringBufferOffset=0;this.onToken(STRING,this.string);this.offset+=Buffer.byteLength(this.string,'utf8')+1;this.string=undefined;}else if(n===0x5c){this.tState=STRING2;}else if(n>=0x20){this.appendStringChar(n);}else{return this.charError(buffer,i);}}else if(this.tState===STRING2){// After backslash
n=buffer[i];if(n===0x22){this.appendStringChar(n);this.tState=STRING1;}else if(n===0x5c){this.appendStringChar(BACK_SLASH);this.tState=STRING1;}else if(n===0x2f){this.appendStringChar(FORWARD_SLASH);this.tState=STRING1;}else if(n===0x62){this.appendStringChar(BACKSPACE);this.tState=STRING1;}else if(n===0x66){this.appendStringChar(FORM_FEED);this.tState=STRING1;}else if(n===0x6e){this.appendStringChar(NEWLINE);this.tState=STRING1;}else if(n===0x72){this.appendStringChar(CARRIAGE_RETURN);this.tState=STRING1;}else if(n===0x74){this.appendStringChar(TAB);this.tState=STRING1;}else if(n===0x75){this.unicode="";this.tState=STRING3;}else{return this.charError(buffer,i);}}else if(this.tState===STRING3||this.tState===STRING4||this.tState===STRING5||this.tState===STRING6){// unicode hex codes
n=buffer[i];// 0-9 A-F a-f
if(n>=0x30&&n<0x40||n>0x40&&n<=0x46||n>0x60&&n<=0x66){this.unicode+=String.fromCharCode(n);if(this.tState++===STRING6){var intVal=parseInt(this.unicode,16);this.unicode=undefined;if(this.highSurrogate!==undefined&&intVal>=0xDC00&&intVal<0xDFFF+1){//<56320,57343> - lowSurrogate
this.appendStringBuf(new Buffer(String.fromCharCode(this.highSurrogate,intVal)));this.highSurrogate=undefined;}else if(this.highSurrogate===undefined&&intVal>=0xD800&&intVal<0xDBFF+1){//<55296,56319> - highSurrogate
this.highSurrogate=intVal;}else{if(this.highSurrogate!==undefined){this.appendStringBuf(new Buffer(String.fromCharCode(this.highSurrogate)));this.highSurrogate=undefined;}this.appendStringBuf(new Buffer(String.fromCharCode(intVal)));}this.tState=STRING1;}}else{return this.charError(buffer,i);}}else if(this.tState===NUMBER1||this.tState===NUMBER3){n=buffer[i];switch(n){case 0x30:// 0
case 0x31:// 1
case 0x32:// 2
case 0x33:// 3
case 0x34:// 4
case 0x35:// 5
case 0x36:// 6
case 0x37:// 7
case 0x38:// 8
case 0x39:// 9
case 0x2e:// .
case 0x65:// e
case 0x45:// E
case 0x2b:// +
case 0x2d:// -
this.string+=String.fromCharCode(n);this.tState=NUMBER3;break;default:this.tState=START;var result=Number(this.string);if(isNaN(result)){return this.charError(buffer,i);}if(this.string.match(/[0-9]+/)==this.string&&result.toString()!=this.string){// Long string of digits which is an ID string and not valid and/or safe JavaScript integer Number
this.onToken(STRING,this.string);}else{this.onToken(NUMBER,result);}this.offset+=this.string.length-1;this.string=undefined;i--;break;}}else if(this.tState===TRUE1){// r
if(buffer[i]===0x72){this.tState=TRUE2;}else{return this.charError(buffer,i);}}else if(this.tState===TRUE2){// u
if(buffer[i]===0x75){this.tState=TRUE3;}else{return this.charError(buffer,i);}}else if(this.tState===TRUE3){// e
if(buffer[i]===0x65){this.tState=START;this.onToken(TRUE,true);this.offset+=3;}else{return this.charError(buffer,i);}}else if(this.tState===FALSE1){// a
if(buffer[i]===0x61){this.tState=FALSE2;}else{return this.charError(buffer,i);}}else if(this.tState===FALSE2){// l
if(buffer[i]===0x6c){this.tState=FALSE3;}else{return this.charError(buffer,i);}}else if(this.tState===FALSE3){// s
if(buffer[i]===0x73){this.tState=FALSE4;}else{return this.charError(buffer,i);}}else if(this.tState===FALSE4){// e
if(buffer[i]===0x65){this.tState=START;this.onToken(FALSE,false);this.offset+=4;}else{return this.charError(buffer,i);}}else if(this.tState===NULL1){// u
if(buffer[i]===0x75){this.tState=NULL2;}else{return this.charError(buffer,i);}}else if(this.tState===NULL2){// l
if(buffer[i]===0x6c){this.tState=NULL3;}else{return this.charError(buffer,i);}}else if(this.tState===NULL3){// l
if(buffer[i]===0x6c){this.tState=START;this.onToken(NULL,null);this.offset+=3;}else{return this.charError(buffer,i);}}}};proto.onToken=function(token,value){// Override this to get events
};proto.parseError=function(token,value){this.tState=STOP;this.onError(new Error("Unexpected "+Parser.toknam(token)+(value?"("+JSON.stringify(value)+")":"")+" in state "+Parser.toknam(this.state)));};proto.push=function(){this.stack.push({value:this.value,key:this.key,mode:this.mode});};proto.pop=function(){var value=this.value;var parent=this.stack.pop();this.value=parent.value;this.key=parent.key;this.mode=parent.mode;this.emit(value);if(!this.mode){this.state=VALUE;}};proto.emit=function(value){if(this.mode){this.state=COMMA;}this.onValue(value);};proto.onValue=function(value){// Override me
};proto.onToken=function(token,value){if(this.state===VALUE){if(token===STRING||token===NUMBER||token===TRUE||token===FALSE||token===NULL){if(this.value){this.value[this.key]=value;}this.emit(value);}else if(token===LEFT_BRACE){this.push();if(this.value){this.value=this.value[this.key]={};}else{this.value={};}this.key=undefined;this.state=KEY;this.mode=OBJECT;}else if(token===LEFT_BRACKET){this.push();if(this.value){this.value=this.value[this.key]=[];}else{this.value=[];}this.key=0;this.mode=ARRAY;this.state=VALUE;}else if(token===RIGHT_BRACE){if(this.mode===OBJECT){this.pop();}else{return this.parseError(token,value);}}else if(token===RIGHT_BRACKET){if(this.mode===ARRAY){this.pop();}else{return this.parseError(token,value);}}else{return this.parseError(token,value);}}else if(this.state===KEY){if(token===STRING){this.key=value;this.state=COLON;}else if(token===RIGHT_BRACE){this.pop();}else{return this.parseError(token,value);}}else if(this.state===COLON){if(token===COLON){this.state=VALUE;}else{return this.parseError(token,value);}}else if(this.state===COMMA){if(token===COMMA){if(this.mode===ARRAY){this.key++;this.state=VALUE;}else if(this.mode===OBJECT){this.state=KEY;}}else if(token===RIGHT_BRACKET&&this.mode===ARRAY||token===RIGHT_BRACE&&this.mode===OBJECT){this.pop();}else{return this.parseError(token,value);}}else{return this.parseError(token,value);}};Parser.C=C;module.exports=Parser;}).call(this);}).call(this,require("buffer").Buffer);},{"buffer":22}],57:[function(require,module,exports){var hasExcape=/~/;var escapeMatcher=/~[01]/g;function escapeReplacer(m){switch(m){case'~1':return'/';case'~0':return'~';}throw new Error('Invalid tilde escape: '+m);}function untilde(str){if(!hasExcape.test(str))return str;return str.replace(escapeMatcher,escapeReplacer);}function setter(obj,pointer,value){var part;var hasNextPart;for(var p=1,len=pointer.length;p<len;){if(pointer[p]==='constructor'||pointer[p]==='prototype'||pointer[p]==='__proto__')return obj;part=untilde(pointer[p++]);hasNextPart=len>p;if(typeof obj[part]==='undefined'){// support setting of /-
if(Array.isArray(obj)&&part==='-'){part=obj.length;}// support nested objects/array when setting values
if(hasNextPart){if(pointer[p]!==''&&pointer[p]<Infinity||pointer[p]==='-')obj[part]=[];else obj[part]={};}}if(!hasNextPart)break;obj=obj[part];}var oldValue=obj[part];if(value===undefined)delete obj[part];else obj[part]=value;return oldValue;}function compilePointer(pointer){if(typeof pointer==='string'){pointer=pointer.split('/');if(pointer[0]==='')return pointer;throw new Error('Invalid JSON pointer.');}else if(Array.isArray(pointer)){for(const part of pointer){if(typeof part!=='string'&&typeof part!=='number'){throw new Error('Invalid JSON pointer. Must be of type string or number.');}}return pointer;}throw new Error('Invalid JSON pointer.');}function get(obj,pointer){if(typeof obj!=='object')throw new Error('Invalid input object.');pointer=compilePointer(pointer);var len=pointer.length;if(len===1)return obj;for(var p=1;p<len;){obj=obj[untilde(pointer[p++])];if(len===p)return obj;if(typeof obj!=='object'||obj===null)return undefined;}}function set(obj,pointer,value){if(typeof obj!=='object')throw new Error('Invalid input object.');pointer=compilePointer(pointer);if(pointer.length===0)throw new Error('Invalid JSON pointer for set.');return setter(obj,pointer,value);}function compile(pointer){var compiled=compilePointer(pointer);return{get:function(object){return get(object,compiled);},set:function(object,value){return set(object,compiled,value);}};}exports.get=get;exports.set=set;exports.compile=compile;},{}],58:[function(require,module,exports){var root=require('./_root');/** Built-in value references. */var Symbol=root.Symbol;module.exports=Symbol;},{"./_root":74}],59:[function(require,module,exports){var baseTimes=require('./_baseTimes'),isArguments=require('./isArguments'),isArray=require('./isArray'),isBuffer=require('./isBuffer'),isIndex=require('./_isIndex'),isTypedArray=require('./isTypedArray');/** Used for built-in method references. */var objectProto=Object.prototype;/** Used to check objects for own properties. */var hasOwnProperty=objectProto.hasOwnProperty;/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */function arrayLikeKeys(value,inherited){var isArr=isArray(value),isArg=!isArr&&isArguments(value),isBuff=!isArr&&!isArg&&isBuffer(value),isType=!isArr&&!isArg&&!isBuff&&isTypedArray(value),skipIndexes=isArr||isArg||isBuff||isType,result=skipIndexes?baseTimes(value.length,String):[],length=result.length;for(var key in value){if((inherited||hasOwnProperty.call(value,key))&&!(skipIndexes&&(// Safari 9 has enumerable `arguments.length` in strict mode.
key=='length'||// Node.js 0.10 has enumerable non-index properties on buffers.
isBuff&&(key=='offset'||key=='parent')||// PhantomJS 2 has enumerable non-index properties on typed arrays.
isType&&(key=='buffer'||key=='byteLength'||key=='byteOffset')||// Skip index properties.
isIndex(key,length)))){result.push(key);}}return result;}module.exports=arrayLikeKeys;},{"./_baseTimes":64,"./_isIndex":68,"./isArguments":75,"./isArray":76,"./isBuffer":78,"./isTypedArray":83}],60:[function(require,module,exports){var Symbol=require('./_Symbol'),getRawTag=require('./_getRawTag'),objectToString=require('./_objectToString');/** `Object#toString` result references. */var nullTag='[object Null]',undefinedTag='[object Undefined]';/** Built-in value references. */var symToStringTag=Symbol?Symbol.toStringTag:undefined;/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */function baseGetTag(value){if(value==null){return value===undefined?undefinedTag:nullTag;}return symToStringTag&&symToStringTag in Object(value)?getRawTag(value):objectToString(value);}module.exports=baseGetTag;},{"./_Symbol":58,"./_getRawTag":67,"./_objectToString":72}],61:[function(require,module,exports){var baseGetTag=require('./_baseGetTag'),isObjectLike=require('./isObjectLike');/** `Object#toString` result references. */var argsTag='[object Arguments]';/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */function baseIsArguments(value){return isObjectLike(value)&&baseGetTag(value)==argsTag;}module.exports=baseIsArguments;},{"./_baseGetTag":60,"./isObjectLike":82}],62:[function(require,module,exports){var baseGetTag=require('./_baseGetTag'),isLength=require('./isLength'),isObjectLike=require('./isObjectLike');/** `Object#toString` result references. */var argsTag='[object Arguments]',arrayTag='[object Array]',boolTag='[object Boolean]',dateTag='[object Date]',errorTag='[object Error]',funcTag='[object Function]',mapTag='[object Map]',numberTag='[object Number]',objectTag='[object Object]',regexpTag='[object RegExp]',setTag='[object Set]',stringTag='[object String]',weakMapTag='[object WeakMap]';var arrayBufferTag='[object ArrayBuffer]',dataViewTag='[object DataView]',float32Tag='[object Float32Array]',float64Tag='[object Float64Array]',int8Tag='[object Int8Array]',int16Tag='[object Int16Array]',int32Tag='[object Int32Array]',uint8Tag='[object Uint8Array]',uint8ClampedTag='[object Uint8ClampedArray]',uint16Tag='[object Uint16Array]',uint32Tag='[object Uint32Array]';/** Used to identify `toStringTag` values of typed arrays. */var typedArrayTags={};typedArrayTags[float32Tag]=typedArrayTags[float64Tag]=typedArrayTags[int8Tag]=typedArrayTags[int16Tag]=typedArrayTags[int32Tag]=typedArrayTags[uint8Tag]=typedArrayTags[uint8ClampedTag]=typedArrayTags[uint16Tag]=typedArrayTags[uint32Tag]=true;typedArrayTags[argsTag]=typedArrayTags[arrayTag]=typedArrayTags[arrayBufferTag]=typedArrayTags[boolTag]=typedArrayTags[dataViewTag]=typedArrayTags[dateTag]=typedArrayTags[errorTag]=typedArrayTags[funcTag]=typedArrayTags[mapTag]=typedArrayTags[numberTag]=typedArrayTags[objectTag]=typedArrayTags[regexpTag]=typedArrayTags[setTag]=typedArrayTags[stringTag]=typedArrayTags[weakMapTag]=false;/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */function baseIsTypedArray(value){return isObjectLike(value)&&isLength(value.length)&&!!typedArrayTags[baseGetTag(value)];}module.exports=baseIsTypedArray;},{"./_baseGetTag":60,"./isLength":80,"./isObjectLike":82}],63:[function(require,module,exports){var isPrototype=require('./_isPrototype'),nativeKeys=require('./_nativeKeys');/** Used for built-in method references. */var objectProto=Object.prototype;/** Used to check objects for own properties. */var hasOwnProperty=objectProto.hasOwnProperty;/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */function baseKeys(object){if(!isPrototype(object)){return nativeKeys(object);}var result=[];for(var key in Object(object)){if(hasOwnProperty.call(object,key)&&key!='constructor'){result.push(key);}}return result;}module.exports=baseKeys;},{"./_isPrototype":69,"./_nativeKeys":70}],64:[function(require,module,exports){/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */function baseTimes(n,iteratee){var index=-1,result=Array(n);while(++index<n){result[index]=iteratee(index);}return result;}module.exports=baseTimes;},{}],65:[function(require,module,exports){/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */function baseUnary(func){return function(value){return func(value);};}module.exports=baseUnary;},{}],66:[function(require,module,exports){(function(global){(function(){/** Detect free variable `global` from Node.js. */var freeGlobal=typeof global=='object'&&global&&global.Object===Object&&global;module.exports=freeGlobal;}).call(this);}).call(this,typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{});},{}],67:[function(require,module,exports){var Symbol=require('./_Symbol');/** Used for built-in method references. */var objectProto=Object.prototype;/** Used to check objects for own properties. */var hasOwnProperty=objectProto.hasOwnProperty;/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */var nativeObjectToString=objectProto.toString;/** Built-in value references. */var symToStringTag=Symbol?Symbol.toStringTag:undefined;/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */function getRawTag(value){var isOwn=hasOwnProperty.call(value,symToStringTag),tag=value[symToStringTag];try{value[symToStringTag]=undefined;var unmasked=true;}catch(e){}var result=nativeObjectToString.call(value);if(unmasked){if(isOwn){value[symToStringTag]=tag;}else{delete value[symToStringTag];}}return result;}module.exports=getRawTag;},{"./_Symbol":58}],68:[function(require,module,exports){/** Used as references for various `Number` constants. */var MAX_SAFE_INTEGER=9007199254740991;/** Used to detect unsigned integer values. */var reIsUint=/^(?:0|[1-9]\d*)$/;/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */function isIndex(value,length){var type=typeof value;length=length==null?MAX_SAFE_INTEGER:length;return!!length&&(type=='number'||type!='symbol'&&reIsUint.test(value))&&value>-1&&value%1==0&&value<length;}module.exports=isIndex;},{}],69:[function(require,module,exports){/** Used for built-in method references. */var objectProto=Object.prototype;/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */function isPrototype(value){var Ctor=value&&value.constructor,proto=typeof Ctor=='function'&&Ctor.prototype||objectProto;return value===proto;}module.exports=isPrototype;},{}],70:[function(require,module,exports){var overArg=require('./_overArg');/* Built-in method references for those with the same name as other `lodash` methods. */var nativeKeys=overArg(Object.keys,Object);module.exports=nativeKeys;},{"./_overArg":73}],71:[function(require,module,exports){var freeGlobal=require('./_freeGlobal');/** Detect free variable `exports`. */var freeExports=typeof exports=='object'&&exports&&!exports.nodeType&&exports;/** Detect free variable `module`. */var freeModule=freeExports&&typeof module=='object'&&module&&!module.nodeType&&module;/** Detect the popular CommonJS extension `module.exports`. */var moduleExports=freeModule&&freeModule.exports===freeExports;/** Detect free variable `process` from Node.js. */var freeProcess=moduleExports&&freeGlobal.process;/** Used to access faster Node.js helpers. */var nodeUtil=function(){try{// Use `util.types` for Node.js 10+.
var types=freeModule&&freeModule.require&&freeModule.require('util').types;if(types){return types;}// Legacy `process.binding('util')` for Node.js < 10.
return freeProcess&&freeProcess.binding&&freeProcess.binding('util');}catch(e){}}();module.exports=nodeUtil;},{"./_freeGlobal":66}],72:[function(require,module,exports){/** Used for built-in method references. */var objectProto=Object.prototype;/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */var nativeObjectToString=objectProto.toString;/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */function objectToString(value){return nativeObjectToString.call(value);}module.exports=objectToString;},{}],73:[function(require,module,exports){/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */function overArg(func,transform){return function(arg){return func(transform(arg));};}module.exports=overArg;},{}],74:[function(require,module,exports){var freeGlobal=require('./_freeGlobal');/** Detect free variable `self`. */var freeSelf=typeof self=='object'&&self&&self.Object===Object&&self;/** Used as a reference to the global object. */var root=freeGlobal||freeSelf||Function('return this')();module.exports=root;},{"./_freeGlobal":66}],75:[function(require,module,exports){var baseIsArguments=require('./_baseIsArguments'),isObjectLike=require('./isObjectLike');/** Used for built-in method references. */var objectProto=Object.prototype;/** Used to check objects for own properties. */var hasOwnProperty=objectProto.hasOwnProperty;/** Built-in value references. */var propertyIsEnumerable=objectProto.propertyIsEnumerable;/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */var isArguments=baseIsArguments(function(){return arguments;}())?baseIsArguments:function(value){return isObjectLike(value)&&hasOwnProperty.call(value,'callee')&&!propertyIsEnumerable.call(value,'callee');};module.exports=isArguments;},{"./_baseIsArguments":61,"./isObjectLike":82}],76:[function(require,module,exports){/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */var isArray=Array.isArray;module.exports=isArray;},{}],77:[function(require,module,exports){var isFunction=require('./isFunction'),isLength=require('./isLength');/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */function isArrayLike(value){return value!=null&&isLength(value.length)&&!isFunction(value);}module.exports=isArrayLike;},{"./isFunction":79,"./isLength":80}],78:[function(require,module,exports){var root=require('./_root'),stubFalse=require('./stubFalse');/** Detect free variable `exports`. */var freeExports=typeof exports=='object'&&exports&&!exports.nodeType&&exports;/** Detect free variable `module`. */var freeModule=freeExports&&typeof module=='object'&&module&&!module.nodeType&&module;/** Detect the popular CommonJS extension `module.exports`. */var moduleExports=freeModule&&freeModule.exports===freeExports;/** Built-in value references. */var Buffer=moduleExports?root.Buffer:undefined;/* Built-in method references for those with the same name as other `lodash` methods. */var nativeIsBuffer=Buffer?Buffer.isBuffer:undefined;/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */var isBuffer=nativeIsBuffer||stubFalse;module.exports=isBuffer;},{"./_root":74,"./stubFalse":86}],79:[function(require,module,exports){var baseGetTag=require('./_baseGetTag'),isObject=require('./isObject');/** `Object#toString` result references. */var asyncTag='[object AsyncFunction]',funcTag='[object Function]',genTag='[object GeneratorFunction]',proxyTag='[object Proxy]';/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */function isFunction(value){if(!isObject(value)){return false;}// The use of `Object#toString` avoids issues with the `typeof` operator
// in Safari 9 which returns 'object' for typed arrays and other constructors.
var tag=baseGetTag(value);return tag==funcTag||tag==genTag||tag==asyncTag||tag==proxyTag;}module.exports=isFunction;},{"./_baseGetTag":60,"./isObject":81}],80:[function(require,module,exports){/** Used as references for various `Number` constants. */var MAX_SAFE_INTEGER=9007199254740991;/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */function isLength(value){return typeof value=='number'&&value>-1&&value%1==0&&value<=MAX_SAFE_INTEGER;}module.exports=isLength;},{}],81:[function(require,module,exports){/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */function isObject(value){var type=typeof value;return value!=null&&(type=='object'||type=='function');}module.exports=isObject;},{}],82:[function(require,module,exports){/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */function isObjectLike(value){return value!=null&&typeof value=='object';}module.exports=isObjectLike;},{}],83:[function(require,module,exports){var baseIsTypedArray=require('./_baseIsTypedArray'),baseUnary=require('./_baseUnary'),nodeUtil=require('./_nodeUtil');/* Node.js helper references. */var nodeIsTypedArray=nodeUtil&&nodeUtil.isTypedArray;/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */var isTypedArray=nodeIsTypedArray?baseUnary(nodeIsTypedArray):baseIsTypedArray;module.exports=isTypedArray;},{"./_baseIsTypedArray":62,"./_baseUnary":65,"./_nodeUtil":71}],84:[function(require,module,exports){var arrayLikeKeys=require('./_arrayLikeKeys'),baseKeys=require('./_baseKeys'),isArrayLike=require('./isArrayLike');/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */function keys(object){return isArrayLike(object)?arrayLikeKeys(object):baseKeys(object);}module.exports=keys;},{"./_arrayLikeKeys":59,"./_baseKeys":63,"./isArrayLike":77}],85:[function(require,module,exports){/**
 * This method returns `undefined`.
 *
 * @static
 * @memberOf _
 * @since 2.3.0
 * @category Util
 * @example
 *
 * _.times(2, _.noop);
 * // => [undefined, undefined]
 */function noop(){// No operation performed.
}module.exports=noop;},{}],86:[function(require,module,exports){/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */function stubFalse(){return false;}module.exports=stubFalse;},{}],87:[function(require,module,exports){'use strict';Object.defineProperty(exports,"__esModule",{value:true});exports.default=asyncify;var _initialParams=require('./internal/initialParams.js');var _initialParams2=_interopRequireDefault(_initialParams);var _setImmediate=require('./internal/setImmediate.js');var _setImmediate2=_interopRequireDefault(_setImmediate);var _wrapAsync=require('./internal/wrapAsync.js');function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}/**
 * Take a sync function and make it async, passing its return value to a
 * callback. This is useful for plugging sync functions into a waterfall,
 * series, or other async functions. Any arguments passed to the generated
 * function will be passed to the wrapped function (except for the final
 * callback argument). Errors thrown will be passed to the callback.
 *
 * If the function passed to `asyncify` returns a Promise, that promises's
 * resolved/rejected state will be used to call the callback, rather than simply
 * the synchronous return value.
 *
 * This also means you can asyncify ES2017 `async` functions.
 *
 * @name asyncify
 * @static
 * @memberOf module:Utils
 * @method
 * @alias wrapSync
 * @category Util
 * @param {Function} func - The synchronous function, or Promise-returning
 * function to convert to an {@link AsyncFunction}.
 * @returns {AsyncFunction} An asynchronous wrapper of the `func`. To be
 * invoked with `(args..., callback)`.
 * @example
 *
 * // passing a regular synchronous function
 * async.waterfall([
 *     async.apply(fs.readFile, filename, "utf8"),
 *     async.asyncify(JSON.parse),
 *     function (data, next) {
 *         // data is the result of parsing the text.
 *         // If there was a parsing error, it would have been caught.
 *     }
 * ], callback);
 *
 * // passing a function returning a promise
 * async.waterfall([
 *     async.apply(fs.readFile, filename, "utf8"),
 *     async.asyncify(function (contents) {
 *         return db.model.create(contents);
 *     }),
 *     function (model, next) {
 *         // `model` is the instantiated model object.
 *         // If there was an error, this function would be skipped.
 *     }
 * ], callback);
 *
 * // es2017 example, though `asyncify` is not needed if your JS environment
 * // supports async functions out of the box
 * var q = async.queue(async.asyncify(async function(file) {
 *     var intermediateStep = await processFile(file);
 *     return await somePromise(intermediateStep)
 * }));
 *
 * q.push(files);
 */function asyncify(func){if((0,_wrapAsync.isAsync)(func)){return function(...args/*, callback*/){const callback=args.pop();const promise=func.apply(this,args);return handlePromise(promise,callback);};}return(0,_initialParams2.default)(function(args,callback){var result;try{result=func.apply(this,args);}catch(e){return callback(e);}// if result is Promise object
if(result&&typeof result.then==='function'){return handlePromise(result,callback);}else{callback(null,result);}});}function handlePromise(promise,callback){return promise.then(value=>{invokeCallback(callback,null,value);},err=>{invokeCallback(callback,err&&err.message?err:new Error(err));});}function invokeCallback(callback,error,value){try{callback(error,value);}catch(err){(0,_setImmediate2.default)(e=>{throw e;},err);}}module.exports=exports['default'];},{"./internal/initialParams.js":95,"./internal/setImmediate.js":100,"./internal/wrapAsync.js":102}],88:[function(require,module,exports){'use strict';Object.defineProperty(exports,"__esModule",{value:true});var _eachOfLimit=require('./internal/eachOfLimit.js');var _eachOfLimit2=_interopRequireDefault(_eachOfLimit);var _withoutIndex=require('./internal/withoutIndex.js');var _withoutIndex2=_interopRequireDefault(_withoutIndex);var _wrapAsync=require('./internal/wrapAsync.js');var _wrapAsync2=_interopRequireDefault(_wrapAsync);var _awaitify=require('./internal/awaitify.js');var _awaitify2=_interopRequireDefault(_awaitify);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}/**
 * The same as [`each`]{@link module:Collections.each} but runs a maximum of `limit` async operations at a time.
 *
 * @name eachLimit
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.each]{@link module:Collections.each}
 * @alias forEachLimit
 * @category Collection
 * @param {Array|Iterable|AsyncIterable|Object} coll - A collection to iterate over.
 * @param {number} limit - The maximum number of async operations at a time.
 * @param {AsyncFunction} iteratee - An async function to apply to each item in
 * `coll`.
 * The array index is not passed to the iteratee.
 * If you need the index, use `eachOfLimit`.
 * Invoked with (item, callback).
 * @param {Function} [callback] - A callback which is called when all
 * `iteratee` functions have finished, or an error occurs. Invoked with (err).
 * @returns {Promise} a promise, if a callback is omitted
 */function eachLimit(coll,limit,iteratee,callback){return(0,_eachOfLimit2.default)(limit)(coll,(0,_withoutIndex2.default)((0,_wrapAsync2.default)(iteratee)),callback);}exports.default=(0,_awaitify2.default)(eachLimit,4);module.exports=exports['default'];},{"./internal/awaitify.js":91,"./internal/eachOfLimit.js":93,"./internal/withoutIndex.js":101,"./internal/wrapAsync.js":102}],89:[function(require,module,exports){'use strict';Object.defineProperty(exports,"__esModule",{value:true});var _eachLimit=require('./eachLimit.js');var _eachLimit2=_interopRequireDefault(_eachLimit);var _awaitify=require('./internal/awaitify.js');var _awaitify2=_interopRequireDefault(_awaitify);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}/**
 * The same as [`each`]{@link module:Collections.each} but runs only a single async operation at a time.
 *
 * Note, that unlike [`each`]{@link module:Collections.each}, this function applies iteratee to each item
 * in series and therefore the iteratee functions will complete in order.

 * @name eachSeries
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.each]{@link module:Collections.each}
 * @alias forEachSeries
 * @category Collection
 * @param {Array|Iterable|AsyncIterable|Object} coll - A collection to iterate over.
 * @param {AsyncFunction} iteratee - An async function to apply to each
 * item in `coll`.
 * The array index is not passed to the iteratee.
 * If you need the index, use `eachOfSeries`.
 * Invoked with (item, callback).
 * @param {Function} [callback] - A callback which is called when all
 * `iteratee` functions have finished, or an error occurs. Invoked with (err).
 * @returns {Promise} a promise, if a callback is omitted
 */function eachSeries(coll,iteratee,callback){return(0,_eachLimit2.default)(coll,1,iteratee,callback);}exports.default=(0,_awaitify2.default)(eachSeries,3);module.exports=exports['default'];},{"./eachLimit.js":88,"./internal/awaitify.js":91}],90:[function(require,module,exports){'use strict';Object.defineProperty(exports,"__esModule",{value:true});exports.default=asyncEachOfLimit;var _breakLoop=require('./breakLoop.js');var _breakLoop2=_interopRequireDefault(_breakLoop);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}// for async generators
function asyncEachOfLimit(generator,limit,iteratee,callback){let done=false;let canceled=false;let awaiting=false;let running=0;let idx=0;function replenish(){//console.log('replenish')
if(running>=limit||awaiting||done)return;//console.log('replenish awaiting')
awaiting=true;generator.next().then(({value,done:iterDone})=>{//console.log('got value', value)
if(canceled||done)return;awaiting=false;if(iterDone){done=true;if(running<=0){//console.log('done nextCb')
callback(null);}return;}running++;iteratee(value,idx,iterateeCallback);idx++;replenish();}).catch(handleError);}function iterateeCallback(err,result){//console.log('iterateeCallback')
running-=1;if(canceled)return;if(err)return handleError(err);if(err===false){done=true;canceled=true;return;}if(result===_breakLoop2.default||done&&running<=0){done=true;//console.log('done iterCb')
return callback(null);}replenish();}function handleError(err){if(canceled)return;awaiting=false;done=true;callback(err);}replenish();}module.exports=exports['default'];},{"./breakLoop.js":92}],91:[function(require,module,exports){'use strict';Object.defineProperty(exports,"__esModule",{value:true});exports.default=awaitify;// conditionally promisify a function.
// only return a promise if a callback is omitted
function awaitify(asyncFn,arity=asyncFn.length){if(!arity)throw new Error('arity is undefined');function awaitable(...args){if(typeof args[arity-1]==='function'){return asyncFn.apply(this,args);}return new Promise((resolve,reject)=>{args[arity-1]=(err,...cbArgs)=>{if(err)return reject(err);resolve(cbArgs.length>1?cbArgs:cbArgs[0]);};asyncFn.apply(this,args);});}return awaitable;}module.exports=exports['default'];},{}],92:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});// A temporary value used to identify if the loop should be broken.
// See #1064, #1293
const breakLoop={};exports.default=breakLoop;module.exports=exports["default"];},{}],93:[function(require,module,exports){'use strict';Object.defineProperty(exports,"__esModule",{value:true});var _once=require('./once.js');var _once2=_interopRequireDefault(_once);var _iterator=require('./iterator.js');var _iterator2=_interopRequireDefault(_iterator);var _onlyOnce=require('./onlyOnce.js');var _onlyOnce2=_interopRequireDefault(_onlyOnce);var _wrapAsync=require('./wrapAsync.js');var _asyncEachOfLimit=require('./asyncEachOfLimit.js');var _asyncEachOfLimit2=_interopRequireDefault(_asyncEachOfLimit);var _breakLoop=require('./breakLoop.js');var _breakLoop2=_interopRequireDefault(_breakLoop);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}exports.default=limit=>{return(obj,iteratee,callback)=>{callback=(0,_once2.default)(callback);if(limit<=0){throw new RangeError('concurrency limit cannot be less than 1');}if(!obj){return callback(null);}if((0,_wrapAsync.isAsyncGenerator)(obj)){return(0,_asyncEachOfLimit2.default)(obj,limit,iteratee,callback);}if((0,_wrapAsync.isAsyncIterable)(obj)){return(0,_asyncEachOfLimit2.default)(obj[Symbol.asyncIterator](),limit,iteratee,callback);}var nextElem=(0,_iterator2.default)(obj);var done=false;var canceled=false;var running=0;var looping=false;function iterateeCallback(err,value){if(canceled)return;running-=1;if(err){done=true;callback(err);}else if(err===false){done=true;canceled=true;}else if(value===_breakLoop2.default||done&&running<=0){done=true;return callback(null);}else if(!looping){replenish();}}function replenish(){looping=true;while(running<limit&&!done){var elem=nextElem();if(elem===null){done=true;if(running<=0){callback(null);}return;}running+=1;iteratee(elem.value,elem.key,(0,_onlyOnce2.default)(iterateeCallback));}looping=false;}replenish();};};module.exports=exports['default'];},{"./asyncEachOfLimit.js":90,"./breakLoop.js":92,"./iterator.js":97,"./once.js":98,"./onlyOnce.js":99,"./wrapAsync.js":102}],94:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=function(coll){return coll[Symbol.iterator]&&coll[Symbol.iterator]();};module.exports=exports["default"];},{}],95:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=function(fn){return function(...args/*, callback*/){var callback=args.pop();return fn.call(this,args,callback);};};module.exports=exports["default"];},{}],96:[function(require,module,exports){'use strict';Object.defineProperty(exports,"__esModule",{value:true});exports.default=isArrayLike;function isArrayLike(value){return value&&typeof value.length==='number'&&value.length>=0&&value.length%1===0;}module.exports=exports['default'];},{}],97:[function(require,module,exports){'use strict';Object.defineProperty(exports,"__esModule",{value:true});exports.default=createIterator;var _isArrayLike=require('./isArrayLike.js');var _isArrayLike2=_interopRequireDefault(_isArrayLike);var _getIterator=require('./getIterator.js');var _getIterator2=_interopRequireDefault(_getIterator);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}function createArrayIterator(coll){var i=-1;var len=coll.length;return function next(){return++i<len?{value:coll[i],key:i}:null;};}function createES2015Iterator(iterator){var i=-1;return function next(){var item=iterator.next();if(item.done)return null;i++;return{value:item.value,key:i};};}function createObjectIterator(obj){var okeys=obj?Object.keys(obj):[];var i=-1;var len=okeys.length;return function next(){var key=okeys[++i];if(key==='__proto__'){return next();}return i<len?{value:obj[key],key}:null;};}function createIterator(coll){if((0,_isArrayLike2.default)(coll)){return createArrayIterator(coll);}var iterator=(0,_getIterator2.default)(coll);return iterator?createES2015Iterator(iterator):createObjectIterator(coll);}module.exports=exports['default'];},{"./getIterator.js":94,"./isArrayLike.js":96}],98:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=once;function once(fn){function wrapper(...args){if(fn===null)return;var callFn=fn;fn=null;callFn.apply(this,args);}Object.assign(wrapper,fn);return wrapper;}module.exports=exports["default"];},{}],99:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=onlyOnce;function onlyOnce(fn){return function(...args){if(fn===null)throw new Error("Callback was already called.");var callFn=fn;fn=null;callFn.apply(this,args);};}module.exports=exports["default"];},{}],100:[function(require,module,exports){(function(process,setImmediate){(function(){'use strict';Object.defineProperty(exports,"__esModule",{value:true});exports.fallback=fallback;exports.wrap=wrap;/* istanbul ignore file */var hasQueueMicrotask=exports.hasQueueMicrotask=typeof queueMicrotask==='function'&&queueMicrotask;var hasSetImmediate=exports.hasSetImmediate=typeof setImmediate==='function'&&setImmediate;var hasNextTick=exports.hasNextTick=typeof process==='object'&&typeof process.nextTick==='function';function fallback(fn){setTimeout(fn,0);}function wrap(defer){return(fn,...args)=>defer(()=>fn(...args));}var _defer;if(hasQueueMicrotask){_defer=queueMicrotask;}else if(hasSetImmediate){_defer=setImmediate;}else if(hasNextTick){_defer=process.nextTick;}else{_defer=fallback;}exports.default=wrap(_defer);}).call(this);}).call(this,require('_process'),require("timers").setImmediate);},{"_process":121,"timers":165}],101:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=_withoutIndex;function _withoutIndex(iteratee){return(value,index,callback)=>iteratee(value,callback);}module.exports=exports["default"];},{}],102:[function(require,module,exports){'use strict';Object.defineProperty(exports,"__esModule",{value:true});exports.isAsyncIterable=exports.isAsyncGenerator=exports.isAsync=undefined;var _asyncify=require('../asyncify.js');var _asyncify2=_interopRequireDefault(_asyncify);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}function isAsync(fn){return fn[Symbol.toStringTag]==='AsyncFunction';}function isAsyncGenerator(fn){return fn[Symbol.toStringTag]==='AsyncGenerator';}function isAsyncIterable(obj){return typeof obj[Symbol.asyncIterator]==='function';}function wrapAsync(asyncFn){if(typeof asyncFn!=='function')throw new Error('expected a function');return isAsync(asyncFn)?(0,_asyncify2.default)(asyncFn):asyncFn;}exports.default=wrapAsync;exports.isAsync=isAsync;exports.isAsyncGenerator=isAsyncGenerator;exports.isAsyncIterable=isAsyncIterable;},{"../asyncify.js":87}],103:[function(require,module,exports){'use strict';Object.defineProperty(exports,"__esModule",{value:true});var _once=require('./internal/once.js');var _once2=_interopRequireDefault(_once);var _onlyOnce=require('./internal/onlyOnce.js');var _onlyOnce2=_interopRequireDefault(_onlyOnce);var _wrapAsync=require('./internal/wrapAsync.js');var _wrapAsync2=_interopRequireDefault(_wrapAsync);var _awaitify=require('./internal/awaitify.js');var _awaitify2=_interopRequireDefault(_awaitify);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}/**
 * Runs the `tasks` array of functions in series, each passing their results to
 * the next in the array. However, if any of the `tasks` pass an error to their
 * own callback, the next function is not executed, and the main `callback` is
 * immediately called with the error.
 *
 * @name waterfall
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @category Control Flow
 * @param {Array} tasks - An array of [async functions]{@link AsyncFunction}
 * to run.
 * Each function should complete with any number of `result` values.
 * The `result` values will be passed as arguments, in order, to the next task.
 * @param {Function} [callback] - An optional callback to run once all the
 * functions have completed. This will be passed the results of the last task's
 * callback. Invoked with (err, [results]).
 * @returns {Promise} a promise, if a callback is omitted
 * @example
 *
 * async.waterfall([
 *     function(callback) {
 *         callback(null, 'one', 'two');
 *     },
 *     function(arg1, arg2, callback) {
 *         // arg1 now equals 'one' and arg2 now equals 'two'
 *         callback(null, 'three');
 *     },
 *     function(arg1, callback) {
 *         // arg1 now equals 'three'
 *         callback(null, 'done');
 *     }
 * ], function (err, result) {
 *     // result now equals 'done'
 * });
 *
 * // Or, with named functions:
 * async.waterfall([
 *     myFirstFunction,
 *     mySecondFunction,
 *     myLastFunction,
 * ], function (err, result) {
 *     // result now equals 'done'
 * });
 * function myFirstFunction(callback) {
 *     callback(null, 'one', 'two');
 * }
 * function mySecondFunction(arg1, arg2, callback) {
 *     // arg1 now equals 'one' and arg2 now equals 'two'
 *     callback(null, 'three');
 * }
 * function myLastFunction(arg1, callback) {
 *     // arg1 now equals 'three'
 *     callback(null, 'done');
 * }
 */function waterfall(tasks,callback){callback=(0,_once2.default)(callback);if(!Array.isArray(tasks))return callback(new Error('First argument to waterfall must be an array of functions'));if(!tasks.length)return callback();var taskIndex=0;function nextTask(args){var task=(0,_wrapAsync2.default)(tasks[taskIndex++]);task(...args,(0,_onlyOnce2.default)(next));}function next(err,...args){if(err===false)return;if(err||taskIndex===tasks.length){return callback(err,...args);}nextTask(args);}nextTask([]);}exports.default=(0,_awaitify2.default)(waterfall);module.exports=exports['default'];},{"./internal/awaitify.js":91,"./internal/once.js":98,"./internal/onlyOnce.js":99,"./internal/wrapAsync.js":102}],104:[function(require,module,exports){// ##### Part of the **[retold](https://stevenvelozo.github.io/retold/)** system
/**
* @license MIT
* @author <steven@velozo.com>
*/ /**
* Load the schema and metadata from a package file
*
* @method loadFromPackageFile
* @return {Object} Returns a new Meadow, or false if it failed
*/var loadFromPackageFile=function(pMeadow,pPackage){// Use the package loader to grab the configuration objects and clone a new Meadow.
var tmpPackage=false;try{tmpPackage=require(pPackage);}catch(pError){pMeadow.fable.log.error('Error loading Fable package',{Package:pPackage});return false;}// Spool up a new Meadow object
var tmpNewMeadow=pMeadow.new(pMeadow.fable);// Safely set the parameters
if(typeof tmpPackage.Scope==='string'){tmpNewMeadow.setScope(tmpPackage.Scope);}if(typeof tmpPackage.Domain==='string'){tmpNewMeadow.setDomain(tmpPackage.Domain);}if(typeof tmpPackage.DefaultIdentifier==='string'){tmpNewMeadow.setDefaultIdentifier(tmpPackage.DefaultIdentifier);}if(Array.isArray(tmpPackage.Schema)){tmpNewMeadow.setSchema(tmpPackage.Schema);}if(typeof tmpPackage.JsonSchema==='object'){tmpNewMeadow.setJsonSchema(tmpPackage.JsonSchema);}if(typeof tmpPackage.DefaultObject==='object'){tmpNewMeadow.setDefault(tmpPackage.DefaultObject);}if(typeof tmpPackage.Authorization==='object'){tmpNewMeadow.setAuthorizer(tmpPackage.Authorization);}return tmpNewMeadow;};module.exports=loadFromPackageFile;},{}],105:[function(require,module,exports){// ##### Part of the **[retold](https://stevenvelozo.github.io/retold/)** system
/**
* @license MIT
* @author <steven@velozo.com>
*/ /**
* Load the schema and metadata from a package object
*
* @method loadFromPackageObject
* @return {Object} Returns a new Meadow, or false if it failed
*/var loadFromPackageObject=function(pMeadow,pPackage){// Use the package loader to grab the configuration objects and clone a new Meadow.
var tmpPackage=typeof pPackage=='object'?pPackage:{};if(!pPackage.hasOwnProperty('Scope')){pMeadow.fable.log.error('Error loading Fable package -- scope not defined.',{Package:pPackage});}// Spool up a new Meadow object
var tmpNewMeadow=pMeadow.new(pMeadow.fable);// Safely set the parameters
if(typeof tmpPackage.Scope==='string'){tmpNewMeadow.setScope(tmpPackage.Scope);}if(typeof tmpPackage.Domain==='string'){tmpNewMeadow.setDomain(tmpPackage.Domain);}if(typeof tmpPackage.DefaultIdentifier==='string'){tmpNewMeadow.setDefaultIdentifier(tmpPackage.DefaultIdentifier);}if(Array.isArray(tmpPackage.Schema)){tmpNewMeadow.setSchema(tmpPackage.Schema);}if(typeof tmpPackage.JsonSchema==='object'){tmpNewMeadow.setJsonSchema(tmpPackage.JsonSchema);}if(typeof tmpPackage.DefaultObject==='object'){tmpNewMeadow.setDefault(tmpPackage.DefaultObject);}if(typeof tmpPackage.Authorization==='object'){tmpNewMeadow.setAuthorizer(tmpPackage.Authorization);}return tmpNewMeadow;};module.exports=loadFromPackageObject;},{}],106:[function(require,module,exports){// ##### Part of the **[retold](https://stevenvelozo.github.io/retold/)** system
/**
* @license MIT
* @author <steven@velozo.com>
*/var libFS=require('fs');/**
* ### Meadow Raw Query Library
*
* This library loads and stores raw queries for FoxHound to use.
* You can overload the default query that is built for each of
* the following query archetypes:
*
* `Create`, `Read`, `Reads`, `Update`, `Delete`, `Count`
*
* You can also load other custom queries and give them an
* arbitrary name.
*
* @class MeadowRawQuery
*/var MeadowRawQuery=function(){function createNew(pMeadow){// If a valid Fable object isn't passed in, return a constructor
if(typeof pMeadow!=='object'||!('fable'in pMeadow)){return{new:createNew};}var _Meadow=pMeadow;var _Queries={};/**
		* Load a Custom Query from a File
		*
		* @method doLoadQuery
		*/function doLoadQuery(pQueryTag,pFileName,fCallBack){var tmpCallBack=typeof fCallBack==='function'?fCallBack:function(){};libFS.readFile(pFileName,'utf8',function(pError,pData){if(pError){_Meadow.fable.log.error('Problem loading custom query file.',{QueryTag:pQueryTag,FileName:pFileName,Error:pError});// There is some debate whether we should leave the queries entry unset or set it to empty so nothing happens.
// If this were to set the query to `false` instead of `''`, FoxHound would be used to generate a query.
doSetQuery(pQueryTag,'');tmpCallBack(false);}else{_Meadow.fable.log.trace('Loaded custom query file.',{QueryTag:pQueryTag,FileName:pFileName});doSetQuery(pQueryTag,pData);tmpCallBack(true);}});return _Meadow;}/**
		* Sets a Custom Query from a String
		*
		* @method doSetQuery
		*/function doSetQuery(pQueryTag,pQueryString){_Queries[pQueryTag]=pQueryString;return _Meadow;}/**
		* Returns a Custom Query if one has been set for this tag
		*
		* @method doGetQuery
		*/function doGetQuery(pQueryTag){if(_Queries.hasOwnProperty(pQueryTag)){return _Queries[pQueryTag];}return false;}/**
		* Check if a Custom Query exists
		*
		* @method doCheckQuery
		*/function doCheckQuery(pQueryTag){return _Queries.hasOwnProperty(pQueryTag);}var tmpNewMeadowRawQuery={loadQuery:doLoadQuery,setQuery:doSetQuery,checkQuery:doCheckQuery,getQuery:doGetQuery,new:createNew};return tmpNewMeadowRawQuery;}return createNew();};module.exports=new MeadowRawQuery();},{"fs":21}],107:[function(require,module,exports){// ##### Part of the **[retold](https://stevenvelozo.github.io/retold/)** system
/**
* @license MIT
* @author <steven@velozo.com>
*/var libValidator=require('is-my-json-valid');/**
* @class MeadowSchema
*/var MeadowSchema=function(){function createNew(pOriginalJsonSchema,pOriginalSchema){/* ^ An Example Meadow Schema Object
		    [
		    	{ "Column": "IDAnimal", "Type":"AutoIdentity" },
		    	{ "Column": "GUIDAnimal", "Type":"AutoGUID" },
		    	{ "Column": "Created", "Type":"CreateDate" },
		    	{ "Column": "CreatingIDUser", "Type":"CreateIDUser" },
		    	{ "Column": "Modified", "Type":"UpdateDate" },
		    	{ "Column": "ModifyingIDUser", "Type":"UpdateIDUser" },
		    	{ "Column": "Deleted", "Type":"Deleted" },
		    	{ "Column": "DeletingIDUser", "Type":"DeleteIDUser" },
		    	{ "Column": "DeleteDate", "Type":"DeleteDate" }
		    ]
		*/ /* #### The Meadow Schema
		 *
		 * Meadow uses this description object to create queries, broker data and generate interfaces.
		 */var _Schema=false;/* ^ An Example JSONSchema Object:
		    	{
		    		"$schema": "http://json-schema.org/draft-04/schema#",
		    		"title": "Product",
		    		"description": "A product from Acme's catalog",
		    		"type": "object",
		    		"properties": {
		    			"id": {
		    				"description": "The unique identifier for a product",
		    				"type": "integer"
		    			},
		    			"name": {
		    				"description": "Name of the product",
		    				"type": "string"
		    			},
		    			"price": {
		    				"type": "number",
		    				"minimum": 0,
		    				"exclusiveMinimum": true
		    			},
		    			"tags": {
		    				"type": "array",
		    				"items": {
		    					"type": "string"
		    				},
		    				"minItems": 1,
		    				"uniqueItems": true
		    			}
		    		},
		    		"required": ["id", "name", "price"]
		    	}
		*/ /* #### A JSONSchema Description
		 *
		 * http://json-schema.org/examples.html
		 *
		 * http://json-schema.org/latest/json-schema-core.html
		 */var _JsonSchema=false;/* #### An "empty" ORM object
		 * This is the basis for being filled out by the marshalling code.
		 */var _Default=false;// The cached validator, which uses the JSONSchema
var _Validate=false;// The authorizers available to this meadow object
var _Authorizers={};/**
		* Set the Meadow schema
		*
		* Our schemas are really instructions for *what* to do *when*.  We track:
		*   - Column
		*   - Type _(e.g. AutoIdentity, AutoGUID, CreateDate, CreateIDUser, UpdateDate, UpdateIDUser, DeleteDate, Deleted, DeleteIDUser)_
		*   - Optionally Special Instractions
		*
		* @method setSchema
		*/var setSchema=function(pSchema){_Schema=typeof pSchema==='object'?pSchema:{title:'Unknown',type:'object',required:[]};};setSchema(pOriginalSchema);/**
		* Set the JSONSchema
		*
		* @method setJsonSchema
		*/var setJsonSchema=function(pJsonSchema){_JsonSchema=typeof pJsonSchema==='object'?pJsonSchema:{title:'Unknown',type:'object',required:[]};_Validate=libValidator(_JsonSchema,{greedy:true,verbose:true});};setJsonSchema(pOriginalJsonSchema);/**
		* Set the Default ORM object
		*
		* @method setDefault
		*/var setDefault=function(pDefault){_Default=typeof pDefault==='object'?pDefault:{};};setDefault();/**
		* Set the authorizer set
		*
		* @method setAuthorizer
		* @return {Object} This is chainable.
		*/var setAuthorizer=function(pAuthorizer){_Authorizers=typeof pAuthorizer==='object'?pAuthorizer:{};};/**
		* Validate an object against the current schema
		*
		* @method validateObject
		*/var validateObject=function(pObject){var tmpValidation={Valid:_Validate(pObject)};// Stuff the errors in if it is invalid
if(!tmpValidation.Valid){tmpValidation.Errors=_Validate.errors;}return tmpValidation;};var tmpNewMeadowSchemaObject={setSchema:setSchema,setJsonSchema:setJsonSchema,setDefault:setDefault,setAuthorizer:setAuthorizer,validateObject:validateObject,new:createNew};/**
		 * The Meadow Schema
		 *
		 * @property schema
		 * @type object
		 */Object.defineProperty(tmpNewMeadowSchemaObject,'schema',{get:function(){return _Schema;},enumerable:true});/**
		 * The JsonSchema
		 *
		 * @property jsonSchema
		 * @type object
		 */Object.defineProperty(tmpNewMeadowSchemaObject,'jsonSchema',{get:function(){return _JsonSchema;},enumerable:true});/**
		 * Default Object
		 *
		 * @property defaultObject
		 * @type object
		 */Object.defineProperty(tmpNewMeadowSchemaObject,'defaultObject',{get:function(){return _Default;},enumerable:true});/**
		 * Authorizer
		 *
		 * @property defaultObject
		 * @type object
		 */Object.defineProperty(tmpNewMeadowSchemaObject,'authorizer',{get:function(){return _Authorizers;},enumerable:true});return tmpNewMeadowSchemaObject;}return createNew();};module.exports=new MeadowSchema();},{"is-my-json-valid":53}],108:[function(require,module,exports){// ##### Part of the **[retold](https://stevenvelozo.github.io/retold/)** system
/**
* @license MIT
* @author <steven@velozo.com>
*/var libFoxHound=require('foxhound');/**
* Meadow Data Broker Library
*
* @class Meadow
*/var Meadow=function(){function createNew(pFable,pScope,pJsonSchema,pSchema){// If a valid Fable object isn't passed in, return a constructor
if(typeof pFable!=='object'||!('fable'in pFable)){return{new:createNew};}var _Fable=pFable;// Make sure there is a valid data broker set
_Fable.settingsManager.fill({MeadowProvider:'None'});var _IDUser=0;// The scope of this broker.
var _Scope=typeof pScope==='string'?pScope:'Unknown';var _Domain='Default';// The schema for this broker
var _Schema=require('./Meadow-Schema.js').new(pJsonSchema,pSchema);// The query for this broker
var _Query=libFoxHound.new(_Fable).setScope(_Scope);// The custom query loader
var _RawQueries=require('./Meadow-RawQuery.js').new(_Fable);// The core behaviors.. abstracted into their own modules to encapsulate complexity
var _CreateBehavior=require('./behaviors/Meadow-Create.js');var _ReadBehavior=require('./behaviors/Meadow-Read.js');var _ReadsBehavior=require('./behaviors/Meadow-Reads.js');var _UpdateBehavior=require('./behaviors/Meadow-Update.js');var _DeleteBehavior=require('./behaviors/Meadow-Delete.js');var _UndeleteBehavior=require('./behaviors/Meadow-Undelete.js');var _CountBehavior=require('./behaviors/Meadow-Count.js');// The data provider
var _Provider=false;var _ProviderName=false;// The default identifier for this broker.
// This is what is used for the automated endpoint queries
// For example the 198 in GET http://myapi.com/Widget/198
//
// Our development model prefers IDWidget as the column name for the default identifier.
var _DefaultIdentifier='ID'+_Scope;var _DefaultGUIdentifier='GUID'+_Scope;/**
		 * Load a Meadow Package JSON, create a Meadow object from it.
		 */var _MeadowPackageLoader=require('./Meadow-PackageFileLoader.js');var loadFromPackage=function(pPackage){return _MeadowPackageLoader(this,pPackage);};/**
		 * Load a Meadow Package JSON from file, create a Meadow object from it.
		 */var _MeadowPackageObjectLoader=require('./Meadow-PackageObjectLoader.js');var loadFromPackageObject=function(pPackage){return _MeadowPackageObjectLoader(this,pPackage);};/**
		* Pass relevant state into the provider
		*
		* @method updateProviderState
		* @return {Object} Returns the current Meadow for chaining.
		*/var updateProviderState=()=>{if(typeof _Provider.setSchema==='function'){_Provider.setSchema(_Scope,_Schema.schema,_DefaultIdentifier,_DefaultGUIdentifier);}return this;};/**
		* Set the scope
		*
		* @method setScope
		* @return {Object} Returns the current Meadow for chaining.
		*/var setScope=function(pScope){_Scope=pScope;_Query.setScope(pScope);updateProviderState();return this;};/**
		* Set the user ID for inserts and updates
		*
		* @method setIDUser
		* @return {Object} Returns the current Meadow for chaining.
		*/var setIDUser=function(pIDUser){_IDUser=pIDUser;return this;};/**
		* Set the Provider for Query execution.
		*
		* This function expects a string, case sensitive, which matches the
		* provider filename
		*
		* @method setProvider
		* @param {String} pProviderName The provider for query generation.
		* @return {Object} Returns the current Meadow for chaining.
		*/var _PROVIDERS={'ALASQL':require(`./providers/Meadow-Provider-ALASQL.js`),'MeadowEndpoints':require(`./providers/Meadow-Provider-MeadowEndpoints.js`),'MySQL':require(`./providers/Meadow-Provider-MySQL.js`),'None':require(`./providers/Meadow-Provider-None.js`)};var setProvider=function(pProviderName){if(typeof pProviderName!=='string'){pProviderName='None';}try{_Provider=_PROVIDERS[pProviderName].new(_Fable);// Give the provider access to the schema object
updateProviderState();_ProviderName=pProviderName;}catch(pError){_Fable.log.error('Provider not set - require load problem',{InvalidProvider:pProviderName,error:pError});setProvider('None');}return this;};setProvider(_Fable.settings.MeadowProvider);/**
		* Set the schema to be something else
		*
		* @method setSchema
		* @return {Object} This is chainable.
		*/var setSchema=function(pSchema){_Schema.setSchema(pSchema);updateProviderState();return this;};/**
		* Set the Jsonschema to be something else
		*
		* @method setJsonSchema
		* @return {Object} This is chainable.
		*/var setJsonSchema=function(pJsonSchema){_Schema.setJsonSchema(pJsonSchema);return this;};/**
		* Set the default object to be something else
		*
		* @method setDefault
		* @return {Object} This is chainable.
		*/var setDefault=function(pDefault){_Schema.setDefault(pDefault);return this;};/**
		* Set the authorizer set
		*
		* @method setAuthorizer
		* @return {Object} This is chainable.
		*/var setAuthorizer=function(pAuthorizer){_Schema.setAuthorizer(pAuthorizer);return this;};/**
		* Set the domain
		*
		* @method setDomain
		* @return {Object} This is chainable.
		*/var setDomain=function(pDomain){_Domain=pDomain;return this;};/**
		* Set the default identifier
		*
		* @method setDefaultIdentifier
		* @return {Object} This is chainable.
		*/var setDefaultIdentifier=function(pDefaultIdentifier){_DefaultIdentifier=pDefaultIdentifier;_DefaultGUIdentifier='GU'+pDefaultIdentifier;updateProviderState();return this;};/**
		 * Create a record
		 */var doCreate=function(pQuery,fCallBack){return _CreateBehavior(this,pQuery,fCallBack);};/**
		 * Read a record
		 */var doRead=function(pQuery,fCallBack){return _ReadBehavior(this,pQuery,fCallBack);};/**
		 * Read multiple records
		 */var doReads=function(pQuery,fCallBack){return _ReadsBehavior(this,pQuery,fCallBack);};/**
		 * Update a record
		 */var doUpdate=function(pQuery,fCallBack){return _UpdateBehavior(this,pQuery,fCallBack);};/**
		 * Delete a record
		 */var doDelete=function(pQuery,fCallBack){return _DeleteBehavior(this,pQuery,fCallBack);};/**
		 * Undelete a record
		 */var doUndelete=function(pQuery,fCallBack){return _UndeleteBehavior(this,pQuery,fCallBack);};/**
		 * Count multiple records
		 */var doCount=function(pQuery,fCallBack){return _CountBehavior(this,pQuery,fCallBack);};/**
		 * Get the role name for an index
		 */let _RoleNames;if(Array.isArray(_Fable.settings.MeadowRoleNames)){_RoleNames=_Fable.settings.MeadowRoleNames;}else{_RoleNames=['Unauthenticated','User','Manager','Director','Executive','Administrator'];}var getRoleName=function(pRoleIndex){if(pRoleIndex<0||pRoleIndex>=_RoleNames.length){return'Unauthenticated';}return _RoleNames[pRoleIndex];};/**
		 * Take the stored representation of our object and stuff the proper values
		 * into our record, translating where necessary.
		 */var marshalRecordFromSourceToObject=function(pRecord){// Create an object from the default schema object
var tmpNewObject=_Fable.Utility.extend({},_Schema.defaultObject);// Now marshal the values from pRecord into tmpNewObject, based on schema
_Provider.marshalRecordFromSourceToObject(tmpNewObject,pRecord,_Schema.schema);// This turns on magical validation
//_Fable.log.trace('Validation', {Value:tmpNewObject, Validation:_Schema.validateObject(tmpNewObject)})
return tmpNewObject;};/**
		 * Method to log slow queries in a consistent pattern
		 */var logSlowQuery=function(pProfileTime,pQuery){var tmpQuery=pQuery.query||{body:'',parameters:{}};var tmpFullQuery=tmpQuery.body;if(tmpQuery.parameters.length){for(var tmpKey in tmpQuery.parameters){tmpFullQuery=tmpFullQuery.replace(':'+tmpKey,tmpQuery.parameters[tmpKey]);}}_Fable.log.warn('Slow Read query took '+pProfileTime+'ms',{Provider:_ProviderName,Query:{Body:tmpQuery.body,Parameters:tmpQuery.parameters,FullQuery:tmpFullQuery}});};/**
		* Container Object for our Factory Pattern
		*/var tmpNewMeadowObject={doCreate:doCreate,doRead:doRead,doReads:doReads,doUpdate:doUpdate,doDelete:doDelete,doUndelete:doUndelete,doCount:doCount,validateObject:_Schema.validateObject,marshalRecordFromSourceToObject:marshalRecordFromSourceToObject,setProvider:setProvider,setIDUser:setIDUser,loadFromPackage:loadFromPackage,loadFromPackageObject:loadFromPackageObject,setScope:setScope,setDomain:setDomain,setSchema:setSchema,setJsonSchema:setJsonSchema,setDefault:setDefault,setDefaultIdentifier:setDefaultIdentifier,setAuthorizer:setAuthorizer,getRoleName:getRoleName,logSlowQuery:logSlowQuery,// Factory
new:createNew};/**
		 * Entity Scope -- usually the name of the entity it represents
		 *
		 * @property scope
		 * @type string
		 */Object.defineProperty(tmpNewMeadowObject,'scope',{get:function(){return _Scope;},enumerable:true});/**
		 * Entity Schema
		 *
		 * @property schema
		 * @type object
		 */Object.defineProperty(tmpNewMeadowObject,'schema',{get:function(){return _Schema.schema;},enumerable:true});/**
		 * Entity Schema
		 *
		 * @property schema
		 * @type object
		 */Object.defineProperty(tmpNewMeadowObject,'schemaFull',{get:function(){return _Schema;},enumerable:true});/**
		 * Default Identifier
		 *
		 * @property schema
		 * @type object
		 */Object.defineProperty(tmpNewMeadowObject,'defaultIdentifier',{get:function(){return _DefaultIdentifier;},enumerable:true});/**
		 * Default GUIdentifier
		 *
		 * @property schema
		 * @type object
		 */Object.defineProperty(tmpNewMeadowObject,'defaultGUIdentifier',{get:function(){return _DefaultGUIdentifier;},enumerable:true});/**
		 * Json Schema
		 *
		 * @property schema
		 * @type object
		 */Object.defineProperty(tmpNewMeadowObject,'jsonSchema',{get:function(){return _Schema.jsonSchema;},enumerable:true});/**
		 * User Identifier
		 *
		 * Used to stamp user identity into Create/Update operations.
		 *
		 * @property userIdentifier
		 * @type string
		 */Object.defineProperty(tmpNewMeadowObject,'userIdentifier',{get:function(){return _IDUser;},enumerable:true});/**
		 * Query (FoxHound) object
		 *
		 * This always returns a cloned query, so it's safe to get queries with a simple:
		 *   var tmpQuery = libSomeFableObject.query;
		 *
		 * and not expect leakage of basic (cap, begin, filter, dataelements) cloned values.
		 *
		 * @property query
		 * @type object
		 */Object.defineProperty(tmpNewMeadowObject,'query',{get:function(){var tmpQuery=_Query.clone();// Set the default schema
tmpQuery.query.schema=_Schema.schema;return tmpQuery;},enumerable:true});/**
		 * Raw Queries
		 *
		 * @property rawQueries
		 * @type object
		 */Object.defineProperty(tmpNewMeadowObject,'rawQueries',{get:function(){return _RawQueries;},enumerable:true});/**
		 * Provider
		 *
		 * @property provider
		 * @type object
		 */Object.defineProperty(tmpNewMeadowObject,'provider',{get:function(){return _Provider;},enumerable:true});/**
		 * Provider Name
		 *
		 * @property providerName
		 * @type object
		 */Object.defineProperty(tmpNewMeadowObject,'providerName',{get:function(){return _ProviderName;},enumerable:true});// addServices removed in fable 2.x
if(typeof _Fable.addServices==='function'){_Fable.addServices(tmpNewMeadowObject);}else{// bring over addServices implementation from Fable 1.x for backward compatibility
Object.defineProperty(tmpNewMeadowObject,'fable',{get:function(){return _Fable;},enumerable:false});Object.defineProperty(tmpNewMeadowObject,'settings',{get:function(){return _Fable.settings;},enumerable:false});Object.defineProperty(tmpNewMeadowObject,'log',{get:function(){return _Fable.log;},enumerable:false});}return tmpNewMeadowObject;}return createNew();};module.exports=new Meadow();},{"./Meadow-PackageFileLoader.js":104,"./Meadow-PackageObjectLoader.js":105,"./Meadow-RawQuery.js":106,"./Meadow-Schema.js":107,"./behaviors/Meadow-Count.js":109,"./behaviors/Meadow-Create.js":110,"./behaviors/Meadow-Delete.js":111,"./behaviors/Meadow-Read.js":112,"./behaviors/Meadow-Reads.js":113,"./behaviors/Meadow-Undelete.js":114,"./behaviors/Meadow-Update.js":115,"./providers/Meadow-Provider-ALASQL.js":116,"./providers/Meadow-Provider-MeadowEndpoints.js":117,"./providers/Meadow-Provider-MySQL.js":118,"./providers/Meadow-Provider-None.js":119,"foxhound":28}],109:[function(require,module,exports){// ##### Part of the **[retold](https://stevenvelozo.github.io/retold/)** system
/**
* @license MIT
* @author <steven@velozo.com>
*/var libAsyncWaterfall=require('async/waterfall');/**
* Meadow Behavior - Count multiple records
*
* @function meadowBehaviorCount
*/var meadowBehaviorCount=function(pMeadow,pQuery,fCallBack){var tmpProfileStart=new Date();//for profiling query time
// Count the record(s) from the source
libAsyncWaterfall([// Step 1: Get the record countfrom the data source
function(fStageComplete){if(pMeadow.rawQueries.checkQuery('Count')){pQuery.parameters.queryOverride=pMeadow.rawQueries.getQuery('Count');}pMeadow.provider.Count(pQuery,function(){fStageComplete(pQuery.result.error,pQuery);});},// Step 2: Validate the resulting value
function(pQuery,fStageComplete){// Check if query time exceeded threshold in settings. Log if slow.
var tmpProfileTime=new Date().getTime()-tmpProfileStart.getTime();if(tmpProfileTime>(pMeadow.fable.settings['QueryThresholdWarnTime']||200)){pMeadow.logSlowQuery(tmpProfileTime,pQuery);}if(typeof pQuery.parameters.result.value!=='number'){// The return value is a number.. something is wrong.
return fStageComplete('Count did not return valid results.',pQuery,false);}fStageComplete(pQuery.result.error,pQuery,pQuery.result.value);}],function(pError,pQuery,pCount){if(pError){pMeadow.fable.log.warn('Error during the count waterfall',{Error:pError,Message:pError.message,Query:pQuery.query});}fCallBack(pError,pQuery,pCount);});return pMeadow;};module.exports=meadowBehaviorCount;},{"async/waterfall":103}],110:[function(require,module,exports){// ##### Part of the **[retold](https://stevenvelozo.github.io/retold/)** system
/**
* @license MIT
* @author <steven@velozo.com>
*/var libAsyncWaterfall=require('async/waterfall');/**
* Meadow Behavior - Create
*
* @function meadowBehaviorCreate
*/var meadowBehaviorCreate=function(pMeadow,pQuery,fCallBack){libAsyncWaterfall([// Step 0: If GUID is specified, make sure the record does not already exist
function(fStageComplete){// Make sure the user submitted a record
if(!pQuery.query.records){return fStageComplete('No record submitted',pQuery,false);}if(pQuery.query.records[0][pMeadow.defaultGUIdentifier]&&pQuery.query.records[0][pMeadow.defaultGUIdentifier].length>=5)//see Foxhound mysql build create query: GUID min len must be 5
{var tmpGUIDRecord=pQuery.query.records[0][pMeadow.defaultGUIdentifier];var tmpQueryRead=pQuery.clone().addFilter(pMeadow.defaultGUIdentifier,tmpGUIDRecord).setDisableDeleteTracking(true);//this check is to guarantee uniqueness across the entire table, so always do this
if(pMeadow.rawQueries.checkQuery('Read')){tmpQueryRead.parameters.queryOverride=pMeadow.rawQueries.getQuery('Read');}pMeadow.provider.Read(tmpQueryRead,function(){var tmpError=tmpQueryRead.error;if(!tmpError&&tmpQueryRead.result.value.length>0){tmpError='Record with GUID '+tmpGUIDRecord+' already exists!';}if(tmpError){return fStageComplete(tmpError,tmpQueryRead,tmpQueryRead,null);}else{return fStageComplete();}});}else{return fStageComplete();}},// Step 1: Create the record in the data source
function(fStageComplete){if(!pQuery.query.IDUser){// The user ID is not already set, set it magically.
if(typeof pQuery.userID==='number'&&pQuery.userID%1===0&&pQuery.userID>=0){pQuery.query.IDUser=pQuery.userID;}else{pQuery.query.IDUser=pMeadow.userIdentifier;}}// Merge in the default record with the passed-in record for completeness
pQuery.query.records[0]=pMeadow.fable.Utility.extend({},pMeadow.schemaFull.defaultObject,pQuery.query.records[0]);// Create override is too complex ... punting for now
// if (pMeadow.rawQueries.checkQuery('Create'))
//	pQuery.parameters.queryOverride = pMeadow.rawQueries.getQuery('Create');
pMeadow.provider.Create(pQuery,function(){fStageComplete(pQuery.result.error,pQuery);});},// Step 2: Setup a read operation
function(pQuery,fStageComplete){// The value is not set (it should be set to the value for our DefaultIdentifier)
if(pQuery.parameters.result.value===false){return fStageComplete('Creation failed',pQuery,false);}var tmpIDRecord=pQuery.result.value;fStageComplete(pQuery.result.error,pQuery,tmpIDRecord);},// Step 3: Read the record
function(pQuery,pIDRecord,fStageComplete){var tmpQueryRead=pQuery.clone().addFilter(pMeadow.defaultIdentifier,pIDRecord).setDisableDeleteTracking(pQuery.parameters.query.disableDeleteTracking);//if delete tracking is disabled, we need to disable it on this Read operation
if(pMeadow.rawQueries.checkQuery('Read')){tmpQueryRead.parameters.queryOverride=pMeadow.rawQueries.getQuery('Read');}pMeadow.provider.Read(tmpQueryRead,function(){fStageComplete(tmpQueryRead.result.error,pQuery,tmpQueryRead);});},// Step 4: Marshal the record into a POJO
function(pQuery,pQueryRead,fStageComplete){// Ensure there is not at least one record returned
if(pQueryRead.parameters.result.value.length<1){return fStageComplete('No record found after create.',pQuery,pQueryRead,false);}var tmpRecord=pMeadow.marshalRecordFromSourceToObject(pQueryRead.result.value[0]);fStageComplete(pQuery.result.error,pQuery,pQueryRead,tmpRecord);}],function(pError,pQuery,pQueryRead,pRecord){if(pError){pMeadow.fable.log.warn('Error during the create waterfall',{Error:pError,Message:pError.message,Query:pQuery.query,Stack:pError.stack});}fCallBack(pError,pQuery,pQueryRead,pRecord);});return pMeadow;};module.exports=meadowBehaviorCreate;},{"async/waterfall":103}],111:[function(require,module,exports){// ##### Part of the **[retold](https://stevenvelozo.github.io/retold/)** system
/**
* @license MIT
* @author <steven@velozo.com>
*/var libAsyncWaterfall=require('async/waterfall');/**
* Meadow Behavior - Delete a single record
*
* @function meadowBehaviorDelete
*/var meadowBehaviorDelete=function(pMeadow,pQuery,fCallBack){// TODO: Check if this recordset has implicit delete tracking, branch in this module.
// Delete the record(s) from the source
libAsyncWaterfall([// Step 1: Delete the record
function(fStageComplete){if(pMeadow.rawQueries.checkQuery('Delete')){pQuery.parameters.queryOverride=pMeadow.rawQueries.getQuery('Delete');}pMeadow.provider.Delete(pQuery,function(){fStageComplete(pQuery.result.error,pQuery,pQuery.result.value);});}],function(pError,pQuery,pRecord){if(pError){pMeadow.fable.log.warn('Error during the delete waterfall',{Error:pError,Message:pError.message,Query:pQuery.query});}fCallBack(pError,pQuery,pRecord);});return pMeadow;};module.exports=meadowBehaviorDelete;},{"async/waterfall":103}],112:[function(require,module,exports){// ##### Part of the **[retold](https://stevenvelozo.github.io/retold/)** system
/**
* @license MIT
* @author <steven@velozo.com>
*/var libAsyncWaterfall=require('async/waterfall');/**
* Meadow Behavior - Read a single record
*
* @function meadowBehaviorRead
*/var meadowBehaviorRead=function(pMeadow,pQuery,fCallBack){// Read the record from the source
libAsyncWaterfall([// Step 1: Get the record from the data source
function(fStageComplete){// If there is a Read override query, use it!
if(pMeadow.rawQueries.checkQuery('Read')){pQuery.parameters.queryOverride=pMeadow.rawQueries.getQuery('Read');}pMeadow.provider.Read(pQuery,function(){fStageComplete(pQuery.result.error,pQuery);});},// Step 2: Marshal the record into a POJO
function(pQuery,fStageComplete){// Check that a record was returned
if(pQuery.parameters.result.value.length<1){return fStageComplete(undefined,pQuery,false);}var tmpRecord=pMeadow.marshalRecordFromSourceToObject(pQuery.result.value[0]);fStageComplete(pQuery.result.error,pQuery,tmpRecord);}],(pError,pQuery,pRecord)=>{if(pError){pMeadow.fable.log.warn('Error during the read waterfall',{Error:pError,Message:pError.message,Query:pQuery.query});}fCallBack(pError,pQuery,pRecord);});return pMeadow;};module.exports=meadowBehaviorRead;},{"async/waterfall":103}],113:[function(require,module,exports){// ##### Part of the **[retold](https://stevenvelozo.github.io/retold/)** system
/**
* @license MIT
* @author <steven@velozo.com>
*/var libAsyncWaterfall=require('async/waterfall');var libAsyncEach=require('async/eachSeries');/**
* Meadow Behavior - Read multiple records
*
* @function meadowBehaviorReads
*/var meadowBehaviorReads=function(pMeadow,pQuery,fCallBack){var tmpProfileStart=new Date();//for profiling query time
// Read the record(s) from the source
libAsyncWaterfall([// Step 1: Get the record(s) from the data source
function(fStageComplete){if(pMeadow.rawQueries.checkQuery('Reads')){pQuery.parameters.queryOverride=pMeadow.rawQueries.getQuery('Reads');}pMeadow.provider.Read(pQuery,function(){fStageComplete(pQuery.result.error,pQuery);});},// Step 2: Marshal all the records into an array of POJOs
function(pQuery,fStageComplete){// Check if query time exceeded threshold in settings. Log if slow.
var tmpProfileTime=new Date().getTime()-tmpProfileStart.getTime();if(tmpProfileTime>(pMeadow.fable.settings['QueryThresholdWarnTime']||200)){pMeadow.logSlowQuery(tmpProfileTime,pQuery);}var tmpRecords=[];libAsyncEach(pQuery.parameters.result.value,function(pRow,pQueueCallback){tmpRecords.push(pMeadow.marshalRecordFromSourceToObject(pRow));pQueueCallback();},function(){// After we've pushed every record into the array in order, complete the waterfall
fStageComplete(pQuery.result.error,pQuery,tmpRecords);});}],function(pError,pQuery,pRecords){if(pError){pMeadow.fable.log.warn('Error during the read multiple waterfall',{Error:pError,Message:pError.message,Query:pQuery.query});}fCallBack(pError,pQuery,pRecords);});return pMeadow;};module.exports=meadowBehaviorReads;},{"async/eachSeries":89,"async/waterfall":103}],114:[function(require,module,exports){// ##### Part of the **[retold](https://stevenvelozo.github.io/retold/)** system
/**
* @license MIT
* @author <steven@velozo.com>
*/var libAsyncWaterfall=require('async/waterfall');/**
* Meadow Behavior - Undelete a single record
*
* @function meadowBehaviorUndelete
*/var meadowBehaviorUndelete=function(pMeadow,pQuery,fCallBack){// TODO: Check if this recordset has implicit delete tracking, branch in this module?
// Undelete the record(s) if they were deleted with a bit
libAsyncWaterfall([// Step 1: Undelete the record
function(fStageComplete){if(pMeadow.rawQueries.checkQuery('Undelete')){pQuery.parameters.queryOverride=pMeadow.rawQueries.getQuery('Undelete');}pMeadow.provider.Undelete(pQuery,function(){fStageComplete(pQuery.result.error,pQuery,pQuery.result.value);});}],function(pError,pQuery,pRecord){if(pError){pMeadow.fable.log.warn('Error during the undelete waterfall',{Error:pError,Message:pError.message,Query:pQuery.query});}fCallBack(pError,pQuery,pRecord);});return pMeadow;};module.exports=meadowBehaviorUndelete;},{"async/waterfall":103}],115:[function(require,module,exports){// ##### Part of the **[retold](https://stevenvelozo.github.io/retold/)** system
/**
* @license MIT
* @author <steven@velozo.com>
*/var libAsyncWaterfall=require('async/waterfall');/**
* Meadow Behavior - Update a single record
*
* @function meadowBehaviorUpdate
*/var meadowBehaviorUpdate=function(pMeadow,pQuery,fCallBack){// Update the record(s) from the source
libAsyncWaterfall([// Step 1: Update the record
function(fStageComplete){if(!pQuery.query.IDUser){// The user ID is not already set, set it magically.
if(typeof pQuery.userID==='number'&&pQuery.userID%1===0&&pQuery.userID>=0){pQuery.query.IDUser=pQuery.userID;}else{pQuery.query.IDUser=pMeadow.userIdentifier;}}// Make sure the developer submitted a record
if(!pQuery.query.records){return fStageComplete('No record submitted',pQuery,false);}// Make sure there is a default identifier
if(!pQuery.query.records[0].hasOwnProperty(pMeadow.defaultIdentifier)){return fStageComplete('Automated update missing default identifier',pQuery,false);}// Now see if there is anything in the schema that is an Update action that isn't in this query
for(var i=0;i<pMeadow.schema.length;i++){switch(pMeadow.schema[i].Type){case'UpdateIDUser':case'UpdateDate':pQuery.query.records[0][pMeadow.schema[i].Column]=false;break;}}// Set the update filter
pQuery.addFilter(pMeadow.defaultIdentifier,pQuery.query.records[0][pMeadow.defaultIdentifier]);// Sanity check on update to make sure we don't update EVERY record.
if(pQuery.parameters.filter===false||pQuery.parameters.filter.length<1){return fStageComplete('Automated update missing filters... aborting!',pQuery,false);}// Updates are too complex to override for now, punting on this feature.
//if (pMeadow.rawQueries.checkQuery('Update'))
//	pQuery.parameters.queryOverride = pMeadow.rawQueries.getQuery('Update');
pMeadow.provider.Update(pQuery,function(){fStageComplete(pQuery.result.error,pQuery);});},// Step 2: Check that the record was updated
function(pQuery,fStageComplete){if(typeof pQuery.parameters.result.value!=='object'){// The value is not an object
return fStageComplete('No record updated.',pQuery,false);}fStageComplete(pQuery.result.error,pQuery);},// Step 3: Read the record
function(pQuery,fStageComplete){// We can clone the query, since it has the criteria for the update in it already (filters survive a clone)
var tmpQueryRead=pQuery.clone();// Make sure to load the record with the custom query if necessary.
if(pMeadow.rawQueries.checkQuery('Read')){tmpQueryRead.parameters.queryOverride=pMeadow.rawQueries.getQuery('Read');}pMeadow.provider.Read(tmpQueryRead,function(){fStageComplete(tmpQueryRead.result.error,pQuery,tmpQueryRead);});},// Step 4: Marshal the record into a POJO
function(pQuery,pQueryRead,fStageComplete){if(pQueryRead.result.value.length===0){//No record found to update
return fStageComplete('No record found to update!',pQueryRead.result,false);}var tmpRecord=pMeadow.marshalRecordFromSourceToObject(pQueryRead.result.value[0]);fStageComplete(pQuery.result.error,pQuery,pQueryRead,tmpRecord);}],function(pError,pQuery,pQueryRead,pRecord){if(pError){pMeadow.fable.log.warn('Error during Update waterfall',{Error:pError,Message:pError.message,Query:pQuery.query});}fCallBack(pError,pQuery,pQueryRead,pRecord);});return pMeadow;};module.exports=meadowBehaviorUpdate;},{"async/waterfall":103}],116:[function(require,module,exports){// ##### Part of the **[retold](https://stevenvelozo.github.io/retold/)** system
/**
* @license MIT
* @author <steven@velozo.com>
*/var MeadowProvider=function(){function createNew(pFable){// If a valid Fable object isn't passed in, return a constructor
if(typeof pFable!=='object'){return{new:createNew};}var _Fable=pFable;var _GlobalLogLevel=0;if(_Fable.settings.ArrayStorage){_GlobalLogLevel=_Fable.settings.ArrayStorage.GlobalLogLevel||0;}if(!_Fable.hasOwnProperty('ALASQL')){// This is going to be problematic.
_Fable.log.fatal('Meadow is trying to perform queries without a valid [Fable.ALASQL] object.  See the documentation for how to initialize one.');return false;}var libALASQL=_Fable.ALASQL;var _Scope='Unknown_Meadow_ALASQL_Scope';var _Schema={};var _DefaultIdentifier='ID';var _DefaultGUIDentifier='GUID';var setSchema=(pScope,pSchema,pDefaultIdentifier,pDefaultGUIdentifier)=>{_Scope=pScope;_Schema=pSchema;_DefaultIdentifier=pDefaultIdentifier;_DefaultGUIDentifier=pDefaultGUIdentifier;return this;};// Create a table for this schema on the fly
// This is ripped off from https://github.com/stevenvelozo/stricture/blob/master/source/Stricture-Generate-MySQL.js
var createTableDynamically=()=>{var tmpCreateStatement='';var tmpTable=_Scope;var tmpSchema=_Schema;// Check if the scope in the query matches the passed-in scope
// Check if the schema does not contain all columns in the query, and add them if it doesn't.
tmpCreateStatement+="CREATE TABLE IF NOT EXISTS\n    "+tmpTable+"\n";if(tmpSchema.length>0){tmpCreateStatement+="    (\n";for(var j=0;j<tmpSchema.length;j++){// If we aren't the first element, append a comma.
if(j>0)tmpCreateStatement+=",";tmpCreateStatement+="\n";// Dump out each column......
switch(tmpSchema[j].Type){case'AutoIdentity':tmpCreateStatement+="        `"+tmpSchema[j].Column+"` INT UNSIGNED NOT NULL AUTO_INCREMENT";_DefaultIdentifier=tmpSchema[j].Column;break;case'AutoGUID':tmpCreateStatement+="        `"+tmpSchema[j].Column+"` CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'";_DefaultGUIDentifier=tmpSchema[j].Column;break;case'Boolean':case'Deleted':case'CreateIDUser':case'UpdateIDUser':case'DeleteIDUser':case'Numeric':tmpCreateStatement+="        `"+tmpSchema[j].Column+"` INT NOT NULL DEFAULT 0";break;case'Decimal':tmpCreateStatement+="        `"+tmpSchema[j].Column+"` DECIMAL("+tmpSchema[j].Size+")";break;case'String':tmpCreateStatement+="        `"+tmpSchema[j].Column+"` VARCHAR NOT NULL DEFAULT ''";break;case'Text':tmpCreateStatement+="        `"+tmpSchema[j].Column+"` TEXT";break;case'CreateDate':case'UpdateDate':case'DeleteDate':case'DateTime':tmpCreateStatement+="        `"+tmpSchema[j].Column+"` DATETIME";break;default:break;}}tmpCreateStatement+="\n    )";}tmpCreateStatement+=";";_Fable.log.info('Auto Creating ALASQL database `'+tmpTable+'`',{CreateStatement:tmpCreateStatement});libALASQL(tmpCreateStatement);return this;};// Determine if the table has been created in ALASQL.  If not, create it.
var checkDataExists=pParameters=>{// Check if the scope was passed in via the query and it hasn't been set yet.
if(_Scope=='Unknown_Meadow_ALASQL_Scope'&&typeof pParameters.scope!=='undefined'){_Scope=pParameters.scope;}// Per https://github.com/agershun/alasql/wiki/How-to-insert-data-into-the-table
if(!_Fable.ALASQL.tables.hasOwnProperty(_Scope)){// Create the table with the schema
createTableDynamically();}};var bindObject=pObject=>{if(!Array.isArray(pObject))return false;// Check that the database is created in ALASQL first
checkDataExists({});if(!_Fable.ALASQL.tables.hasOwnProperty(_Scope))return false;// Per https://github.com/agershun/alasql/wiki/How-to-insert-data-into-the-table
_Fable.ALASQL.tables[_Scope].data=pObject;return true;};// The Meadow marshaller also passes in the Schema as the third parameter, but this is a blunt function ATM.
var marshalRecordFromSourceToObject=function(pObject,pRecord){// For now, crudely assign everything in pRecord to pObject
// This is safe in this context, and we don't want to slow down marshalling with millions of hasOwnProperty checks
for(var tmpColumn in pRecord){pObject[tmpColumn]=pRecord[tmpColumn];}};var Create=function(pQuery,fCallback){var tmpResult=pQuery.parameters.result;checkDataExists(pQuery.parameters);pQuery.setDialect('ALASQL').buildCreateQuery();// Compile the ALASQL query
// Per https://github.com/agershun/alasql/wiki/Compile
var fQuery=libALASQL.compile(pQuery.query.body);// TODO: Test the query before executing
if(pQuery.logLevel>0||_GlobalLogLevel>0){_Fable.log.trace(pQuery.query.body,pQuery.query.parameters);}// No iops so this is not async
try{tmpResult.error=undefined;tmpResult.executed=false;tmpResult.value=0;var tmpQueryResponse=fQuery(pQuery.query.parameters);if(tmpQueryResponse>0){// Check if there is an ALASQL autoval for this insert
if(libALASQL.tables[pQuery.parameters.scope].identities[_DefaultIdentifier]){tmpResult.value=libALASQL.autoval(pQuery.parameters.scope,_DefaultIdentifier);}else if(pQuery.query.records.length>0&&pQuery.query.records[0].hasOwnProperty(_DefaultIdentifier)){tmpResult.value=pQuery.query.records[0][_DefaultIdentifier];}}tmpResult.executed=true;}catch(pError){tmpResult.error=pError;}fCallback();};// This is a synchronous read, good for a few records.
// TODO: Add a pipe-able read for huge sets
var Read=function(pQuery,fCallback){var tmpResult=pQuery.parameters.result;checkDataExists(pQuery.parameters);pQuery.setDialect('ALASQL').buildReadQuery();var fQuery=libALASQL.compile(pQuery.query.body);if(pQuery.logLevel>0||_GlobalLogLevel>0){_Fable.log.trace(pQuery.query.body,pQuery.query.parameters);}try{tmpResult.error=undefined;tmpResult.executed=false;tmpResult.value=fQuery(pQuery.query.parameters);tmpResult.executed=true;}catch(pError){tmpResult.error=pError;}fCallback();};var Update=function(pQuery,fCallback){var tmpResult=pQuery.parameters.result;checkDataExists(pQuery.parameters);pQuery.setDialect('ALASQL').buildUpdateQuery();var fQuery=libALASQL.compile(pQuery.query.body);if(pQuery.logLevel>0||_GlobalLogLevel>0){_Fable.log.trace(pQuery.query.body,pQuery.query.parameters);}try{tmpResult.error=undefined;tmpResult.executed=false;tmpResult.value={affectedRows:fQuery(pQuery.query.parameters)};tmpResult.executed=true;}catch(pError){tmpResult.error=pError;}fCallback();};var Delete=function(pQuery,fCallback){var tmpResult=pQuery.parameters.result;checkDataExists(pQuery.parameters);pQuery.setDialect('ALASQL').buildDeleteQuery();var fQuery=libALASQL.compile(pQuery.query.body);if(pQuery.logLevel>0||_GlobalLogLevel>0){_Fable.log.trace(pQuery.query.body,pQuery.query.parameters);}try{tmpResult.error=undefined;tmpResult.executed=false;tmpResult.value=fQuery(pQuery.query.parameters);tmpResult.executed=true;}catch(pError){tmpResult.error=pError;}fCallback();};var Undelete=function(pQuery,fCallback){var tmpResult=pQuery.parameters.result;checkDataExists(pQuery.parameters);pQuery.setDialect('ALASQL').buildUndeleteQuery();var fQuery=libALASQL.compile(pQuery.query.body);if(pQuery.logLevel>0||_GlobalLogLevel>0){_Fable.log.trace(pQuery.query.body,pQuery.query.parameters);}try{tmpResult.error=undefined;tmpResult.executed=false;tmpResult.value=fQuery(pQuery.query.parameters);tmpResult.executed=true;}catch(pError){tmpResult.error=pError;}fCallback();};var Count=function(pQuery,fCallback){var tmpResult=pQuery.parameters.result;checkDataExists(pQuery.parameters);pQuery.setDialect('ALASQL').buildCountQuery();var fQuery=libALASQL.compile(pQuery.query.body);if(pQuery.logLevel>0||_GlobalLogLevel>0){_Fable.log.trace(pQuery.query.body,pQuery.query.parameters);}try{tmpResult.error=undefined;tmpResult.executed=false;tmpResult.value=fQuery(pQuery.query.parameters)[0].RowCount;tmpResult.executed=true;}catch(pError){tmpResult.error=pError;}fCallback();};/**
		 * Construct a new Meadow from a record prototype, optionally passing in records.
		 * 
		 * Takes an object
		 * {
		 *		Meadow:          Meadow object to use (required)
		 *      Scope:           "DATA" (string)
		 *      ObjectPrototype: {}     (the object to base the schema off of -- REQUIRED)
		 *      AuditData:       true   (boolean -- whether or not to add audit columns)
		 *      Import:          true   (boolean -- whether or not to import them using the DAL)
		 *      Data:            []     (optional array of records, one object each)
		 * }
		 */var constructFromObject=pParameters=>{if(typeof pParameters!=='object'||typeof pParameters.Meadow!=='object')return false;// I know there are better ways to do this, but for now I want to keep it very manual
if(!(typeof pParameters.Scope==='string'))pParameters.Scope='DATA';if(!(typeof pParameters.ObjectPrototype==='object'))pParameters.ObjectPrototype={};if(!(typeof pParameters.AuditData==='boolean'))pParameters.AuditData=true;if(!(typeof pParameters.Import==='boolean'))pParameters.Import=true;if(!Array.isArray(pParameters.Data))pParameters.Data=[];// Construct a meadow
var tmpMeadow=pParameters.Meadow.new(_Fable,pParameters.Scope).setProvider('ALASQL');var tmpSchema=[];var tmpDefaultIdentifier;if(pParameters.AuditData){// Add the audit fields to the schema
tmpDefaultIdentifier='ID'+pParameters.Scope;tmpSchema.push({Column:tmpDefaultIdentifier,Type:"AutoIdentity"});tmpSchema.push({Column:"GU"+tmpDefaultIdentifier,Type:"AutoGUID"});tmpSchema.push({Column:"CreateDate",Type:"CreateDate"});tmpSchema.push({Column:"CreatingIDUser",Type:"CreateIDUser"});tmpSchema.push({Column:"UpdateDate",Type:"UpdateDate"});tmpSchema.push({Column:"UpdatingIDUser",Type:"UpdateIDUser"});tmpSchema.push({Column:"DeleteDate",Type:"DeleteDate"});tmpSchema.push({Column:"DeletingIDUser",Type:"DeleteIDUser"});tmpSchema.push({Column:"Deleted",Type:"Deleted"});}// Now add the fields from the object in
for(var tmpProperty in pParameters.ObjectPrototype){var tmpAdded=false;// Add it to the schema
switch(typeof pParameters.ObjectPrototype[tmpProperty]){case"undefined":case"object":case"function":// Do nothing with these types of properties
break;case"boolean":tmpSchema.push({Column:tmpProperty,Type:"Boolean"});break;// Because we can't tell the difference between floating point and not
case"number":case"string":tmpSchema.push({Column:tmpProperty,Type:"Text"});break;default:break;}if(tmpAdded&&typeof tmpDefaultIdentifier==='undefined')// Just use the first property of the prototype object as the default identifier
tmpDefaultIdentifier=tmpProperty;}tmpMeadow.setSchema(tmpSchema);if(typeof tmpDefaultIdentifier==='undefined')tmpMeadow.setDefaultIdentifier(tmpDefaultIdentifier);// Now import the data
if(pParameters.Import){for(var j=0;j<pParameters.Data.length;j++){tmpMeadow.doCreate(tmpMeadow.query.clone().addRecord(pParameters.Data[j]),function(pError,pQuery,pQueryRead,pRecord){// Maybe log the error?
_Fable.log.trace('Auto imported record',pRecord);});}}else{// Just assign the object
tmpMeadow.provider.bindObject(pParameters.Data);}return tmpMeadow;};var tmpNewProvider={setSchema:setSchema,marshalRecordFromSourceToObject:marshalRecordFromSourceToObject,constructFromObject:constructFromObject,bindObject:bindObject,Create:Create,Read:Read,Update:Update,Delete:Delete,Undelete:Undelete,Count:Count,new:createNew};return tmpNewProvider;}return createNew();};module.exports=new MeadowProvider();},{}],117:[function(require,module,exports){// ##### Part of the **[retold](https://stevenvelozo.github.io/retold/)** system
/**
* @license MIT
* @author <steven@velozo.com>
*/var libSimpleGet=require('simple-get');var MeadowProvider=function(){function createNew(pFable){// If a valid Fable object isn't passed in, return a constructor
if(typeof pFable!=='object'){return{new:createNew};}var _Fable=pFable;var _GlobalLogLevel=0;var _Dialect='MeadowEndpoints';var _Headers={};var _Cookies=[];var _EndpointSettings=_Fable.settings.hasOwnProperty('MeadowEndpoints')?JSON.parse(JSON.stringify(_Fable.settings.MedaowEndpoints)):{ServerProtocol:'http',ServerAddress:'127.0.0.1',ServerPort:'8086',ServerEndpointPrefix:'1.0/'};var buildURL=function(pAddress){return`${_EndpointSettings.ServerProtocol}://${_EndpointSettings.ServerAddress}:${_EndpointSettings.ServerPort}/${_EndpointSettings.ServerEndpointPrefix}${pAddress}`;};var buildRequestOptions=function(pQuery){if(pQuery.logLevel>0||_GlobalLogLevel>0){_Fable.log.trace(pQuery.query.body,pQuery.query.records);}let tmpURL=buildURL(pQuery.query.body);let tmpRequestOptions={url:tmpURL,headers:_Fable.Utility.extend({cookie:''},_Headers)};tmpRequestOptions.headers.cookie=_Cookies.join(';');if(pQuery.logLevel>0||_GlobalLogLevel>0)_Fable.log.debug(`Request options built...`,tmpRequestOptions);return tmpRequestOptions;};// The Meadow marshaller also passes in the Schema as the third parameter, but this is a blunt function ATM.
var marshalRecordFromSourceToObject=function(pObject,pRecord){for(var tmpColumn in pRecord){pObject[tmpColumn]=pRecord[tmpColumn];}};var Create=function(pQuery,fCallback){var tmpResult=pQuery.parameters.result;pQuery.setDialect(_Dialect).buildCreateQuery();let tmpRequestOptions=buildRequestOptions(pQuery);// TODO: Should this test for exactly one?
if(!pQuery.query.records.length>0){tmpResult.error='No records passed for proxying to Meadow-Endpoints.';return fCallback();}tmpRequestOptions.body=pQuery.query.records[0];tmpRequestOptions.json=true;libSimpleGet.post(tmpRequestOptions,(pError,pResponse)=>{tmpResult.error=pError;tmpResult.executed=true;if(pQuery.logLevel>0||_GlobalLogLevel>0)_Fable.log.debug(`--> POST request connected`);if(pError){return fCallback(tmpResult);}let tmpData='';pResponse.on('data',pChunk=>{if(pQuery.logLevel>0||_GlobalLogLevel>0)_Fable.log.debug(`--> POST data chunk size ${pChunk.length}b received`);tmpData+=pChunk;});pResponse.on('end',()=>{if(tmpData)tmpResult.value=JSON.parse(tmpData);// TODO Because this was proxied, read happens at this layer too.  Inefficient -- fixable
let tmpIdentityColumn=`ID${pQuery.parameters.scope}`;if(tmpResult.value.hasOwnProperty(tmpIdentityColumn))tmpResult.value=tmpResult.value[tmpIdentityColumn];if(pQuery.logLevel>0||_GlobalLogLevel>0){_Fable.log.debug(`==> POST completed data size ${tmpData.length}b received`,tmpResult);}return fCallback();});});};// This is a synchronous read, good for a few records.
// TODO: Add a pipe-able read for huge sets
var Read=function(pQuery,fCallback){var tmpResult=pQuery.parameters.result;pQuery.setDialect(_Dialect).buildReadQuery();let tmpRequestOptions=buildRequestOptions(pQuery);libSimpleGet.get(tmpRequestOptions,(pError,pResponse)=>{tmpResult.error=pError;tmpResult.executed=true;if(pQuery.logLevel>0||_GlobalLogLevel>0)_Fable.log.debug(`--> GET request connected`);if(pError){return fCallback(tmpResult);}let tmpData='';pResponse.on('data',pChunk=>{if(pQuery.logLevel>0||_GlobalLogLevel>0)_Fable.log.debug(`--> GET data chunk size ${pChunk.length}b received`);tmpData+=pChunk;});pResponse.on('end',()=>{if(tmpData)tmpResult.value=JSON.parse(tmpData);if(pQuery.query.body.startsWith(`${pQuery.parameters.scope}/`)){// If this is not a plural read, make the result into an array.
tmpResult.value=[tmpResult.value];}if(pQuery.logLevel>0||_GlobalLogLevel>0){_Fable.log.debug(`==> GET completed data size ${tmpData.length}b received`,tmpResult);}fCallback();});});};var Update=function(pQuery,fCallback){var tmpResult=pQuery.parameters.result;pQuery.setDialect(_Dialect).buildUpdateQuery();let tmpRequestOptions=buildRequestOptions(pQuery);// TODO: Should this test for exactly one?
if(!pQuery.query.records.length>0){tmpResult.error='No records passed for proxying to Meadow-Endpoints.';return fCallback();}tmpRequestOptions.body=pQuery.query.records[0];tmpRequestOptions.json=true;libSimpleGet.put(tmpRequestOptions,(pError,pResponse)=>{tmpResult.error=pError;tmpResult.executed=true;if(pQuery.logLevel>0||_GlobalLogLevel>0)_Fable.log.debug(`--> PUT request connected`);if(pError){return fCallback(tmpResult);}let tmpData='';pResponse.on('data',pChunk=>{if(pQuery.logLevel>0||_GlobalLogLevel>0)_Fable.log.debug(`--> PUT data chunk size ${pChunk.length}b received`);tmpData+=pChunk;});pResponse.on('end',()=>{if(tmpData)tmpResult.value=JSON.parse(tmpData);// TODO Because this was proxied, read happens at this layer too.  Inefficient -- fixable
let tmpIdentityColumn=`ID${pQuery.parameters.scope}`;if(tmpResult.value.hasOwnProperty(tmpIdentityColumn))tmpResult.value=tmpResult.value[tmpIdentityColumn];if(pQuery.logLevel>0||_GlobalLogLevel>0){_Fable.log.debug(`==> PUT completed data size ${tmpData.length}b received`,tmpResult);}return fCallback();});});};var Delete=function(pQuery,fCallback){var tmpResult=pQuery.parameters.result;pQuery.setDialect(_Dialect).buildDeleteQuery();let tmpRequestOptions=buildRequestOptions(pQuery);libSimpleGet.delete(tmpRequestOptions,(pError,pResponse)=>{tmpResult.error=pError;tmpResult.executed=true;if(pQuery.logLevel>0||_GlobalLogLevel>0)_Fable.log.debug(`--> DEL request connected`);if(pError){return fCallback(tmpResult);}let tmpData='';pResponse.on('data',pChunk=>{if(pQuery.logLevel>0||_GlobalLogLevel>0)_Fable.log.debug(`--> DEL data chunk size ${pChunk.length}b received`);tmpData+=pChunk;});pResponse.on('end',()=>{if(tmpData)tmpResult.value=JSON.parse(tmpData);if(tmpResult.value.hasOwnProperty('Count'))tmpResult.value=tmpResult.value.Count;if(pQuery.logLevel>0||_GlobalLogLevel>0){_Fable.log.debug(`==> DEL completed data size ${tmpData.length}b received`,tmpResult);}fCallback();});});};var Count=function(pQuery,fCallback){var tmpResult=pQuery.parameters.result;pQuery.setDialect(_Dialect).buildCountQuery();let tmpRequestOptions=buildRequestOptions(pQuery);libSimpleGet.get(tmpRequestOptions,(pError,pResponse)=>{tmpResult.error=pError;tmpResult.executed=true;if(pQuery.logLevel>0||_GlobalLogLevel>0)_Fable.log.debug(`--> GET request connected`);if(pError){return fCallback(tmpResult);}let tmpData='';pResponse.on('data',pChunk=>{if(pQuery.logLevel>0||_GlobalLogLevel>0)_Fable.log.debug(`--> GET data chunk size ${pChunk.length}b received`);tmpData+=pChunk;});pResponse.on('end',()=>{if(tmpData)tmpResult.value=JSON.parse(tmpData);try{tmpResult.value=tmpResult.value.Count;}catch(pErrorGettingRowcount){// This is an error state...
tmpResult.value=-1;_Fable.log.warn('Error getting rowcount during count query',{Body:pQuery.query.body,Parameters:pQuery.query.parameters});}if(pQuery.logLevel>0||_GlobalLogLevel>0){_Fable.log.debug(`==> GET completed data size ${tmpData.length}b received`,tmpResult);}fCallback();});});};var tmpNewProvider={marshalRecordFromSourceToObject:marshalRecordFromSourceToObject,Create:Create,Read:Read,Update:Update,Delete:Delete,Count:Count,new:createNew};return tmpNewProvider;}return createNew();};module.exports=new MeadowProvider();},{"simple-get":128}],118:[function(require,module,exports){// ##### Part of the **[retold](https://stevenvelozo.github.io/retold/)** system
/**
* @license MIT
* @author <steven@velozo.com>
*/var MeadowProvider=function(){function createNew(pFable){// If a valid Fable object isn't passed in, return a constructor
if(typeof pFable!=='object'){return{new:createNew};}var _Fable=pFable;var _GlobalLogLevel=0;if(_Fable.settings.MySQL){_GlobalLogLevel=_Fable.settings.MySQL.GlobalLogLevel||0;}/**
		 * Build a connection pool, shared within this provider.
		 * This may be more performant as a shared object.
		 */var getSQLPool=function(){if(typeof _Fable.MeadowMySQLConnectionPool!=='object'){// This is going to be problematic.
_Fable.log.fatal('Meadow is trying to perform queries without a valid [Fable.MeadowMySQLConnectionPool] object.  See the documentation for how to initialize one.');return false;}return _Fable.MeadowMySQLConnectionPool;};// The Meadow marshaller also passes in the Schema as the third parameter, but this is a blunt function ATM.
var marshalRecordFromSourceToObject=function(pObject,pRecord){// For now, crudely assign everything in pRecord to pObject
// This is safe in this context, and we don't want to slow down marshalling with millions of hasOwnProperty checks
for(var tmpColumn in pRecord){pObject[tmpColumn]=pRecord[tmpColumn];}};var Create=function(pQuery,fCallback){var tmpResult=pQuery.parameters.result;pQuery.setDialect('MySQL').buildCreateQuery();// TODO: Test the query before executing
if(pQuery.logLevel>0||_GlobalLogLevel>0){_Fable.log.trace(pQuery.query.body,pQuery.query.parameters);}getSQLPool().getConnection(function(pError,pDBConnection){pDBConnection.query(pQuery.query.body,pQuery.query.parameters,// The MySQL library also returns the Fields as the third parameter
function(pError,pRows){pDBConnection.release();tmpResult.error=pError;tmpResult.value=false;try{tmpResult.value=pRows.insertId;}catch(pErrorGettingRowcount){_Fable.log.warn('Error getting insert ID during create query',{Body:pQuery.query.body,Parameters:pQuery.query.parameters});}tmpResult.executed=true;return fCallback();});});};// This is a synchronous read, good for a few records.
// TODO: Add a pipe-able read for huge sets
var Read=function(pQuery,fCallback){var tmpResult=pQuery.parameters.result;pQuery.setDialect('MySQL').buildReadQuery();if(pQuery.logLevel>0||_GlobalLogLevel>0){_Fable.log.trace(pQuery.query.body,pQuery.query.parameters);}getSQLPool().getConnection(function(pError,pDBConnection){pDBConnection.query(pQuery.query.body,pQuery.query.parameters,// The MySQL library also returns the Fields as the third parameter
function(pError,pRows){pDBConnection.release();tmpResult.error=pError;tmpResult.value=pRows;tmpResult.executed=true;return fCallback();});});};var Update=function(pQuery,fCallback){var tmpResult=pQuery.parameters.result;pQuery.setDialect('MySQL').buildUpdateQuery();if(pQuery.logLevel>0||_GlobalLogLevel>0){_Fable.log.trace(pQuery.query.body,pQuery.query.parameters);}getSQLPool().getConnection(function(pError,pDBConnection){pDBConnection.query(pQuery.query.body,pQuery.query.parameters,// The MySQL library also returns the Fields as the third parameter
function(pError,pRows){pDBConnection.release();tmpResult.error=pError;tmpResult.value=pRows;tmpResult.executed=true;return fCallback();});});};var Delete=function(pQuery,fCallback){var tmpResult=pQuery.parameters.result;pQuery.setDialect('MySQL').buildDeleteQuery();if(pQuery.logLevel>0||_GlobalLogLevel>0){_Fable.log.trace(pQuery.query.body,pQuery.query.parameters);}getSQLPool().getConnection(function(pError,pDBConnection){pDBConnection.query(pQuery.query.body,pQuery.query.parameters,// The MySQL library also returns the Fields as the third parameter
function(pError,pRows){pDBConnection.release();tmpResult.error=pError;tmpResult.value=false;try{tmpResult.value=pRows.affectedRows;}catch(pErrorGettingRowcount){_Fable.log.warn('Error getting affected rowcount during delete query',{Body:pQuery.query.body,Parameters:pQuery.query.parameters});}tmpResult.executed=true;return fCallback();});});};var Undelete=function(pQuery,fCallback){var tmpResult=pQuery.parameters.result;pQuery.setDialect('MySQL').buildUndeleteQuery();if(pQuery.logLevel>0||_GlobalLogLevel>0){_Fable.log.trace(pQuery.query.body,pQuery.query.parameters);}getSQLPool().getConnection(function(pError,pDBConnection){pDBConnection.query(pQuery.query.body,pQuery.query.parameters,// The MySQL library also returns the Fields as the third parameter
function(pError,pRows){pDBConnection.release();tmpResult.error=pError;tmpResult.value=false;try{tmpResult.value=pRows.affectedRows;}catch(pErrorGettingRowcount){_Fable.log.warn('Error getting affected rowcount during delete query',{Body:pQuery.query.body,Parameters:pQuery.query.parameters});}tmpResult.executed=true;return fCallback();});});};var Count=function(pQuery,fCallback){var tmpResult=pQuery.parameters.result;pQuery.setDialect('MySQL').buildCountQuery();if(pQuery.logLevel>0||_GlobalLogLevel>0){_Fable.log.trace(pQuery.query.body,pQuery.query.parameters);}getSQLPool().getConnection(function(pError,pDBConnection){pDBConnection.query(pQuery.query.body,pQuery.query.parameters,// The MySQL library also returns the Fields as the third parameter
function(pError,pRows){pDBConnection.release();tmpResult.executed=true;tmpResult.error=pError;tmpResult.value=false;try{tmpResult.value=pRows[0].RowCount;}catch(pErrorGettingRowcount){_Fable.log.warn('Error getting rowcount during count query',{Body:pQuery.query.body,Parameters:pQuery.query.parameters});}return fCallback();});});};var tmpNewProvider={marshalRecordFromSourceToObject:marshalRecordFromSourceToObject,Create:Create,Read:Read,Update:Update,Delete:Delete,Undelete:Undelete,Count:Count,new:createNew};return tmpNewProvider;}return createNew();};module.exports=new MeadowProvider();},{}],119:[function(require,module,exports){// ##### Part of the **[retold](https://stevenvelozo.github.io/retold/)** system
/**
* @license MIT
* @author <steven@velozo.com>
*/var MeadowProvider=function(){function createNew(pFable){// If a valid Fable object isn't passed in, return a constructor
if(typeof pFable!=='object'||!('fable'in pFable)){return{new:createNew};}//var _Fable = pFable;
//var marshalRecordFromSourceToObject = function(pObject, pRecord, pSchema)
var marshalRecordFromSourceToObject=function(){// Do nothing ... this is the NONE provider after all
};var Create=function(pQuery,fCallback){// This does nothing because it's the none data provider!
pQuery.parameters.result.executed=true;fCallback();};// This is a synchronous read, good for a few records.
// TODO: Add a pipe-able read for huge sets
var Read=function(pQuery,fCallback){// This does nothing because it's the none data provider!
pQuery.parameters.result.executed=true;pQuery.parameters.result.value=[true];fCallback();};var Update=function(pQuery,fCallback){// This does nothing because it's the none data provider!
pQuery.parameters.result.executed=true;fCallback();};var Delete=function(pQuery,fCallback){// This does nothing because it's the none data provider!
pQuery.parameters.result.executed=true;fCallback();};var Undelete=function(pQuery,fCallback){// This does nothing because it's the none data provider!
pQuery.parameters.result.executed=true;fCallback();};var Count=function(pQuery,fCallback){// This does nothing because it's the none data provider!
pQuery.parameters.result.executed=true;fCallback();};var tmpNewProvider={marshalRecordFromSourceToObject:marshalRecordFromSourceToObject,Create:Create,Read:Read,Update:Update,Delete:Delete,Undelete:Undelete,Count:Count,new:createNew};return tmpNewProvider;}return createNew();};module.exports=new MeadowProvider();},{}],120:[function(require,module,exports){var wrappy=require('wrappy');module.exports=wrappy(once);module.exports.strict=wrappy(onceStrict);once.proto=once(function(){Object.defineProperty(Function.prototype,'once',{value:function(){return once(this);},configurable:true});Object.defineProperty(Function.prototype,'onceStrict',{value:function(){return onceStrict(this);},configurable:true});});function once(fn){var f=function(){if(f.called)return f.value;f.called=true;return f.value=fn.apply(this,arguments);};f.called=false;return f;}function onceStrict(fn){var f=function(){if(f.called)throw new Error(f.onceError);f.called=true;return f.value=fn.apply(this,arguments);};var name=fn.name||'Function wrapped with `once`';f.onceError=name+" shouldn't be called more than once";f.called=false;return f;}},{"wrappy":173}],121:[function(require,module,exports){// shim for using process in browser
var process=module.exports={};// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.
var cachedSetTimeout;var cachedClearTimeout;function defaultSetTimout(){throw new Error('setTimeout has not been defined');}function defaultClearTimeout(){throw new Error('clearTimeout has not been defined');}(function(){try{if(typeof setTimeout==='function'){cachedSetTimeout=setTimeout;}else{cachedSetTimeout=defaultSetTimout;}}catch(e){cachedSetTimeout=defaultSetTimout;}try{if(typeof clearTimeout==='function'){cachedClearTimeout=clearTimeout;}else{cachedClearTimeout=defaultClearTimeout;}}catch(e){cachedClearTimeout=defaultClearTimeout;}})();function runTimeout(fun){if(cachedSetTimeout===setTimeout){//normal enviroments in sane situations
return setTimeout(fun,0);}// if setTimeout wasn't available but was latter defined
if((cachedSetTimeout===defaultSetTimout||!cachedSetTimeout)&&setTimeout){cachedSetTimeout=setTimeout;return setTimeout(fun,0);}try{// when when somebody has screwed with setTimeout but no I.E. maddness
return cachedSetTimeout(fun,0);}catch(e){try{// When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
return cachedSetTimeout.call(null,fun,0);}catch(e){// same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
return cachedSetTimeout.call(this,fun,0);}}}function runClearTimeout(marker){if(cachedClearTimeout===clearTimeout){//normal enviroments in sane situations
return clearTimeout(marker);}// if clearTimeout wasn't available but was latter defined
if((cachedClearTimeout===defaultClearTimeout||!cachedClearTimeout)&&clearTimeout){cachedClearTimeout=clearTimeout;return clearTimeout(marker);}try{// when when somebody has screwed with setTimeout but no I.E. maddness
return cachedClearTimeout(marker);}catch(e){try{// When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
return cachedClearTimeout.call(null,marker);}catch(e){// same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
// Some versions of I.E. have different rules for clearTimeout vs setTimeout
return cachedClearTimeout.call(this,marker);}}}var queue=[];var draining=false;var currentQueue;var queueIndex=-1;function cleanUpNextTick(){if(!draining||!currentQueue){return;}draining=false;if(currentQueue.length){queue=currentQueue.concat(queue);}else{queueIndex=-1;}if(queue.length){drainQueue();}}function drainQueue(){if(draining){return;}var timeout=runTimeout(cleanUpNextTick);draining=true;var len=queue.length;while(len){currentQueue=queue;queue=[];while(++queueIndex<len){if(currentQueue){currentQueue[queueIndex].run();}}queueIndex=-1;len=queue.length;}currentQueue=null;draining=false;runClearTimeout(timeout);}process.nextTick=function(fun){var args=new Array(arguments.length-1);if(arguments.length>1){for(var i=1;i<arguments.length;i++){args[i-1]=arguments[i];}}queue.push(new Item(fun,args));if(queue.length===1&&!draining){runTimeout(drainQueue);}};// v8 likes predictible objects
function Item(fun,array){this.fun=fun;this.array=array;}Item.prototype.run=function(){this.fun.apply(null,this.array);};process.title='browser';process.browser=true;process.env={};process.argv=[];process.version='';// empty string to avoid regexp issues
process.versions={};function noop(){}process.on=noop;process.addListener=noop;process.once=noop;process.off=noop;process.removeListener=noop;process.removeAllListeners=noop;process.emit=noop;process.prependListener=noop;process.prependOnceListener=noop;process.listeners=function(name){return[];};process.binding=function(name){throw new Error('process.binding is not supported');};process.cwd=function(){return'/';};process.chdir=function(dir){throw new Error('process.chdir is not supported');};process.umask=function(){return 0;};},{}],122:[function(require,module,exports){(function(global){(function(){/*! https://mths.be/punycode v1.4.1 by @mathias */;(function(root){/** Detect free variables */var freeExports=typeof exports=='object'&&exports&&!exports.nodeType&&exports;var freeModule=typeof module=='object'&&module&&!module.nodeType&&module;var freeGlobal=typeof global=='object'&&global;if(freeGlobal.global===freeGlobal||freeGlobal.window===freeGlobal||freeGlobal.self===freeGlobal){root=freeGlobal;}/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */var punycode,/** Highest positive signed 32-bit float value */maxInt=2147483647,// aka. 0x7FFFFFFF or 2^31-1
/** Bootstring parameters */base=36,tMin=1,tMax=26,skew=38,damp=700,initialBias=72,initialN=128,// 0x80
delimiter='-',// '\x2D'
/** Regular expressions */regexPunycode=/^xn--/,regexNonASCII=/[^\x20-\x7E]/,// unprintable ASCII chars + non-ASCII chars
regexSeparators=/[\x2E\u3002\uFF0E\uFF61]/g,// RFC 3490 separators
/** Error messages */errors={'overflow':'Overflow: input needs wider integers to process','not-basic':'Illegal input >= 0x80 (not a basic code point)','invalid-input':'Invalid input'},/** Convenience shortcuts */baseMinusTMin=base-tMin,floor=Math.floor,stringFromCharCode=String.fromCharCode,/** Temporary variable */key;/*--------------------------------------------------------------------------*/ /**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */function error(type){throw new RangeError(errors[type]);}/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */function map(array,fn){var length=array.length;var result=[];while(length--){result[length]=fn(array[length]);}return result;}/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */function mapDomain(string,fn){var parts=string.split('@');var result='';if(parts.length>1){// In email addresses, only the domain name should be punycoded. Leave
// the local part (i.e. everything up to `@`) intact.
result=parts[0]+'@';string=parts[1];}// Avoid `split(regex)` for IE8 compatibility. See #17.
string=string.replace(regexSeparators,'\x2E');var labels=string.split('.');var encoded=map(labels,fn).join('.');return result+encoded;}/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */function ucs2decode(string){var output=[],counter=0,length=string.length,value,extra;while(counter<length){value=string.charCodeAt(counter++);if(value>=0xD800&&value<=0xDBFF&&counter<length){// high surrogate, and there is a next character
extra=string.charCodeAt(counter++);if((extra&0xFC00)==0xDC00){// low surrogate
output.push(((value&0x3FF)<<10)+(extra&0x3FF)+0x10000);}else{// unmatched surrogate; only append this code unit, in case the next
// code unit is the high surrogate of a surrogate pair
output.push(value);counter--;}}else{output.push(value);}}return output;}/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */function ucs2encode(array){return map(array,function(value){var output='';if(value>0xFFFF){value-=0x10000;output+=stringFromCharCode(value>>>10&0x3FF|0xD800);value=0xDC00|value&0x3FF;}output+=stringFromCharCode(value);return output;}).join('');}/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */function basicToDigit(codePoint){if(codePoint-48<10){return codePoint-22;}if(codePoint-65<26){return codePoint-65;}if(codePoint-97<26){return codePoint-97;}return base;}/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */function digitToBasic(digit,flag){//  0..25 map to ASCII a..z or A..Z
// 26..35 map to ASCII 0..9
return digit+22+75*(digit<26)-((flag!=0)<<5);}/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */function adapt(delta,numPoints,firstTime){var k=0;delta=firstTime?floor(delta/damp):delta>>1;delta+=floor(delta/numPoints);for/* no initialization */(;delta>baseMinusTMin*tMax>>1;k+=base){delta=floor(delta/baseMinusTMin);}return floor(k+(baseMinusTMin+1)*delta/(delta+skew));}/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */function decode(input){// Don't use UCS-2
var output=[],inputLength=input.length,out,i=0,n=initialN,bias=initialBias,basic,j,index,oldi,w,k,digit,t,/** Cached calculation results */baseMinusT;// Handle the basic code points: let `basic` be the number of input code
// points before the last delimiter, or `0` if there is none, then copy
// the first basic code points to the output.
basic=input.lastIndexOf(delimiter);if(basic<0){basic=0;}for(j=0;j<basic;++j){// if it's not a basic code point
if(input.charCodeAt(j)>=0x80){error('not-basic');}output.push(input.charCodeAt(j));}// Main decoding loop: start just after the last delimiter if any basic code
// points were copied; start at the beginning otherwise.
for/* no final expression */(index=basic>0?basic+1:0;index<inputLength;){// `index` is the index of the next character to be consumed.
// Decode a generalized variable-length integer into `delta`,
// which gets added to `i`. The overflow checking is easier
// if we increase `i` as we go, then subtract off its starting
// value at the end to obtain `delta`.
for/* no condition */(oldi=i,w=1,k=base;;k+=base){if(index>=inputLength){error('invalid-input');}digit=basicToDigit(input.charCodeAt(index++));if(digit>=base||digit>floor((maxInt-i)/w)){error('overflow');}i+=digit*w;t=k<=bias?tMin:k>=bias+tMax?tMax:k-bias;if(digit<t){break;}baseMinusT=base-t;if(w>floor(maxInt/baseMinusT)){error('overflow');}w*=baseMinusT;}out=output.length+1;bias=adapt(i-oldi,out,oldi==0);// `i` was supposed to wrap around from `out` to `0`,
// incrementing `n` each time, so we'll fix that now:
if(floor(i/out)>maxInt-n){error('overflow');}n+=floor(i/out);i%=out;// Insert `n` at position `i` of the output
output.splice(i++,0,n);}return ucs2encode(output);}/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */function encode(input){var n,delta,handledCPCount,basicLength,bias,j,m,q,k,t,currentValue,output=[],/** `inputLength` will hold the number of code points in `input`. */inputLength,/** Cached calculation results */handledCPCountPlusOne,baseMinusT,qMinusT;// Convert the input in UCS-2 to Unicode
input=ucs2decode(input);// Cache the length
inputLength=input.length;// Initialize the state
n=initialN;delta=0;bias=initialBias;// Handle the basic code points
for(j=0;j<inputLength;++j){currentValue=input[j];if(currentValue<0x80){output.push(stringFromCharCode(currentValue));}}handledCPCount=basicLength=output.length;// `handledCPCount` is the number of code points that have been handled;
// `basicLength` is the number of basic code points.
// Finish the basic string - if it is not empty - with a delimiter
if(basicLength){output.push(delimiter);}// Main encoding loop:
while(handledCPCount<inputLength){// All non-basic code points < n have been handled already. Find the next
// larger one:
for(m=maxInt,j=0;j<inputLength;++j){currentValue=input[j];if(currentValue>=n&&currentValue<m){m=currentValue;}}// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
// but guard against overflow
handledCPCountPlusOne=handledCPCount+1;if(m-n>floor((maxInt-delta)/handledCPCountPlusOne)){error('overflow');}delta+=(m-n)*handledCPCountPlusOne;n=m;for(j=0;j<inputLength;++j){currentValue=input[j];if(currentValue<n&&++delta>maxInt){error('overflow');}if(currentValue==n){// Represent delta as a generalized variable-length integer
for/* no condition */(q=delta,k=base;;k+=base){t=k<=bias?tMin:k>=bias+tMax?tMax:k-bias;if(q<t){break;}qMinusT=q-t;baseMinusT=base-t;output.push(stringFromCharCode(digitToBasic(t+qMinusT%baseMinusT,0)));q=floor(qMinusT/baseMinusT);}output.push(stringFromCharCode(digitToBasic(q,0)));bias=adapt(delta,handledCPCountPlusOne,handledCPCount==basicLength);delta=0;++handledCPCount;}}++delta;++n;}return output.join('');}/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */function toUnicode(input){return mapDomain(input,function(string){return regexPunycode.test(string)?decode(string.slice(4).toLowerCase()):string;});}/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */function toASCII(input){return mapDomain(input,function(string){return regexNonASCII.test(string)?'xn--'+encode(string):string;});}/*--------------------------------------------------------------------------*/ /** Define the public API */punycode={/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */'version':'1.4.1',/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */'ucs2':{'decode':ucs2decode,'encode':ucs2encode},'decode':decode,'encode':encode,'toASCII':toASCII,'toUnicode':toUnicode};/** Expose `punycode` */ // Some AMD build optimizers, like r.js, check for specific condition patterns
// like the following:
if(typeof define=='function'&&typeof define.amd=='object'&&define.amd){define('punycode',function(){return punycode;});}else if(freeExports&&freeModule){if(module.exports==freeExports){// in Node.js, io.js, or RingoJS v0.8.0+
freeModule.exports=punycode;}else{// in Narwhal or RingoJS v0.7.0-
for(key in punycode){punycode.hasOwnProperty(key)&&(freeExports[key]=punycode[key]);}}}else{// in Rhino or a web browser
root.punycode=punycode;}})(this);}).call(this);}).call(this,typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{});},{}],123:[function(require,module,exports){// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
'use strict';// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj,prop){return Object.prototype.hasOwnProperty.call(obj,prop);}module.exports=function(qs,sep,eq,options){sep=sep||'&';eq=eq||'=';var obj={};if(typeof qs!=='string'||qs.length===0){return obj;}var regexp=/\+/g;qs=qs.split(sep);var maxKeys=1000;if(options&&typeof options.maxKeys==='number'){maxKeys=options.maxKeys;}var len=qs.length;// maxKeys <= 0 means that we should not limit keys count
if(maxKeys>0&&len>maxKeys){len=maxKeys;}for(var i=0;i<len;++i){var x=qs[i].replace(regexp,'%20'),idx=x.indexOf(eq),kstr,vstr,k,v;if(idx>=0){kstr=x.substr(0,idx);vstr=x.substr(idx+1);}else{kstr=x;vstr='';}k=decodeURIComponent(kstr);v=decodeURIComponent(vstr);if(!hasOwnProperty(obj,k)){obj[k]=v;}else if(isArray(obj[k])){obj[k].push(v);}else{obj[k]=[obj[k],v];}}return obj;};var isArray=Array.isArray||function(xs){return Object.prototype.toString.call(xs)==='[object Array]';};},{}],124:[function(require,module,exports){// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
'use strict';var stringifyPrimitive=function(v){switch(typeof v){case'string':return v;case'boolean':return v?'true':'false';case'number':return isFinite(v)?v:'';default:return'';}};module.exports=function(obj,sep,eq,name){sep=sep||'&';eq=eq||'=';if(obj===null){obj=undefined;}if(typeof obj==='object'){return map(objectKeys(obj),function(k){var ks=encodeURIComponent(stringifyPrimitive(k))+eq;if(isArray(obj[k])){return map(obj[k],function(v){return ks+encodeURIComponent(stringifyPrimitive(v));}).join(sep);}else{return ks+encodeURIComponent(stringifyPrimitive(obj[k]));}}).join(sep);}if(!name)return'';return encodeURIComponent(stringifyPrimitive(name))+eq+encodeURIComponent(stringifyPrimitive(obj));};var isArray=Array.isArray||function(xs){return Object.prototype.toString.call(xs)==='[object Array]';};function map(xs,f){if(xs.map)return xs.map(f);var res=[];for(var i=0;i<xs.length;i++){res.push(f(xs[i],i));}return res;}var objectKeys=Object.keys||function(obj){var res=[];for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key))res.push(key);}return res;};},{}],125:[function(require,module,exports){'use strict';exports.decode=exports.parse=require('./decode');exports.encode=exports.stringify=require('./encode');},{"./decode":123,"./encode":124}],126:[function(require,module,exports){/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */ /* eslint-disable node/no-deprecated-api */var buffer=require('buffer');var Buffer=buffer.Buffer;// alternative to using Object.keys for old browsers
function copyProps(src,dst){for(var key in src){dst[key]=src[key];}}if(Buffer.from&&Buffer.alloc&&Buffer.allocUnsafe&&Buffer.allocUnsafeSlow){module.exports=buffer;}else{// Copy properties from require('buffer')
copyProps(buffer,exports);exports.Buffer=SafeBuffer;}function SafeBuffer(arg,encodingOrOffset,length){return Buffer(arg,encodingOrOffset,length);}SafeBuffer.prototype=Object.create(Buffer.prototype);// Copy static methods from Buffer
copyProps(Buffer,SafeBuffer);SafeBuffer.from=function(arg,encodingOrOffset,length){if(typeof arg==='number'){throw new TypeError('Argument must not be a number');}return Buffer(arg,encodingOrOffset,length);};SafeBuffer.alloc=function(size,fill,encoding){if(typeof size!=='number'){throw new TypeError('Argument must be a number');}var buf=Buffer(size);if(fill!==undefined){if(typeof encoding==='string'){buf.fill(fill,encoding);}else{buf.fill(fill);}}else{buf.fill(0);}return buf;};SafeBuffer.allocUnsafe=function(size){if(typeof size!=='number'){throw new TypeError('Argument must be a number');}return Buffer(size);};SafeBuffer.allocUnsafeSlow=function(size){if(typeof size!=='number'){throw new TypeError('Argument must be a number');}return buffer.SlowBuffer(size);};},{"buffer":22}],127:[function(require,module,exports){(function(Buffer){(function(){/*! simple-concat. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */module.exports=function(stream,cb){var chunks=[];stream.on('data',function(chunk){chunks.push(chunk);});stream.once('end',function(){if(cb)cb(null,Buffer.concat(chunks));cb=null;});stream.once('error',function(err){if(cb)cb(err);cb=null;});};}).call(this);}).call(this,require("buffer").Buffer);},{"buffer":22}],128:[function(require,module,exports){(function(Buffer){(function(){/*! simple-get. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */module.exports=simpleGet;const concat=require('simple-concat');const decompressResponse=require('decompress-response');// excluded from browser build
const http=require('http');const https=require('https');const once=require('once');const querystring=require('querystring');const url=require('url');const isStream=o=>o!==null&&typeof o==='object'&&typeof o.pipe==='function';function simpleGet(opts,cb){opts=Object.assign({maxRedirects:10},typeof opts==='string'?{url:opts}:opts);cb=once(cb);if(opts.url){const{hostname,port,protocol,auth,path}=url.parse(opts.url);// eslint-disable-line node/no-deprecated-api
delete opts.url;if(!hostname&&!port&&!protocol&&!auth)opts.path=path;// Relative redirect
else Object.assign(opts,{hostname,port,protocol,auth,path});// Absolute redirect
}const headers={'accept-encoding':'gzip, deflate'};if(opts.headers)Object.keys(opts.headers).forEach(k=>headers[k.toLowerCase()]=opts.headers[k]);opts.headers=headers;let body;if(opts.body){body=opts.json&&!isStream(opts.body)?JSON.stringify(opts.body):opts.body;}else if(opts.form){body=typeof opts.form==='string'?opts.form:querystring.stringify(opts.form);opts.headers['content-type']='application/x-www-form-urlencoded';}if(body){if(!opts.method)opts.method='POST';if(!isStream(body))opts.headers['content-length']=Buffer.byteLength(body);if(opts.json&&!opts.form)opts.headers['content-type']='application/json';}delete opts.body;delete opts.form;if(opts.json)opts.headers.accept='application/json';if(opts.method)opts.method=opts.method.toUpperCase();const originalHost=opts.hostname;// hostname before potential redirect
const protocol=opts.protocol==='https:'?https:http;// Support http/https urls
const req=protocol.request(opts,res=>{if(opts.followRedirects!==false&&res.statusCode>=300&&res.statusCode<400&&res.headers.location){opts.url=res.headers.location;// Follow 3xx redirects
delete opts.headers.host;// Discard `host` header on redirect (see #32)
res.resume();// Discard response
const redirectHost=url.parse(opts.url).hostname;// eslint-disable-line node/no-deprecated-api
// If redirected host is different than original host, drop headers to prevent cookie leak (#73)
if(redirectHost!==null&&redirectHost!==originalHost){delete opts.headers.cookie;delete opts.headers.authorization;}if(opts.method==='POST'&&[301,302].includes(res.statusCode)){opts.method='GET';// On 301/302 redirect, change POST to GET (see #35)
delete opts.headers['content-length'];delete opts.headers['content-type'];}if(opts.maxRedirects--===0)return cb(new Error('too many redirects'));else return simpleGet(opts,cb);}const tryUnzip=typeof decompressResponse==='function'&&opts.method!=='HEAD';cb(null,tryUnzip?decompressResponse(res):res);});req.on('timeout',()=>{req.abort();cb(new Error('Request timed out'));});req.on('error',cb);if(isStream(body))body.on('error',cb).pipe(req);else req.end(body);return req;}simpleGet.concat=(opts,cb)=>{return simpleGet(opts,(err,res)=>{if(err)return cb(err);concat(res,(err,data)=>{if(err)return cb(err);if(opts.json){try{data=JSON.parse(data.toString());}catch(err){return cb(err,res,data);}}cb(null,res,data);});});};['get','post','put','patch','head','delete'].forEach(method=>{simpleGet[method]=(opts,cb)=>{if(typeof opts==='string')opts={url:opts};return simpleGet(Object.assign({method:method.toUpperCase()},opts),cb);};});}).call(this);}).call(this,require("buffer").Buffer);},{"buffer":22,"decompress-response":20,"http":144,"https":45,"once":120,"querystring":125,"simple-concat":127,"url":166}],129:[function(require,module,exports){// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
module.exports=Stream;var EE=require('events').EventEmitter;var inherits=require('inherits');inherits(Stream,EE);Stream.Readable=require('readable-stream/lib/_stream_readable.js');Stream.Writable=require('readable-stream/lib/_stream_writable.js');Stream.Duplex=require('readable-stream/lib/_stream_duplex.js');Stream.Transform=require('readable-stream/lib/_stream_transform.js');Stream.PassThrough=require('readable-stream/lib/_stream_passthrough.js');Stream.finished=require('readable-stream/lib/internal/streams/end-of-stream.js');Stream.pipeline=require('readable-stream/lib/internal/streams/pipeline.js');// Backwards-compat with node 0.4.x
Stream.Stream=Stream;// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.
function Stream(){EE.call(this);}Stream.prototype.pipe=function(dest,options){var source=this;function ondata(chunk){if(dest.writable){if(false===dest.write(chunk)&&source.pause){source.pause();}}}source.on('data',ondata);function ondrain(){if(source.readable&&source.resume){source.resume();}}dest.on('drain',ondrain);// If the 'end' option is not supplied, dest.end() will be called when
// source gets the 'end' or 'close' events.  Only dest.end() once.
if(!dest._isStdio&&(!options||options.end!==false)){source.on('end',onend);source.on('close',onclose);}var didOnEnd=false;function onend(){if(didOnEnd)return;didOnEnd=true;dest.end();}function onclose(){if(didOnEnd)return;didOnEnd=true;if(typeof dest.destroy==='function')dest.destroy();}// don't leave dangling pipes when there are errors.
function onerror(er){cleanup();if(EE.listenerCount(this,'error')===0){throw er;// Unhandled stream error in pipe.
}}source.on('error',onerror);dest.on('error',onerror);// remove all the event listeners that were added.
function cleanup(){source.removeListener('data',ondata);dest.removeListener('drain',ondrain);source.removeListener('end',onend);source.removeListener('close',onclose);source.removeListener('error',onerror);dest.removeListener('error',onerror);source.removeListener('end',cleanup);source.removeListener('close',cleanup);dest.removeListener('close',cleanup);}source.on('end',cleanup);source.on('close',cleanup);dest.on('close',cleanup);dest.emit('pipe',source);// Allow for unix-like usage: A.pipe(B).pipe(C)
return dest;};},{"events":26,"inherits":47,"readable-stream/lib/_stream_duplex.js":131,"readable-stream/lib/_stream_passthrough.js":132,"readable-stream/lib/_stream_readable.js":133,"readable-stream/lib/_stream_transform.js":134,"readable-stream/lib/_stream_writable.js":135,"readable-stream/lib/internal/streams/end-of-stream.js":139,"readable-stream/lib/internal/streams/pipeline.js":141}],130:[function(require,module,exports){'use strict';function _inheritsLoose(subClass,superClass){subClass.prototype=Object.create(superClass.prototype);subClass.prototype.constructor=subClass;subClass.__proto__=superClass;}var codes={};function createErrorType(code,message,Base){if(!Base){Base=Error;}function getMessage(arg1,arg2,arg3){if(typeof message==='string'){return message;}else{return message(arg1,arg2,arg3);}}var NodeError=/*#__PURE__*/function(_Base){_inheritsLoose(NodeError,_Base);function NodeError(arg1,arg2,arg3){return _Base.call(this,getMessage(arg1,arg2,arg3))||this;}return NodeError;}(Base);NodeError.prototype.name=Base.name;NodeError.prototype.code=code;codes[code]=NodeError;}// https://github.com/nodejs/node/blob/v10.8.0/lib/internal/errors.js
function oneOf(expected,thing){if(Array.isArray(expected)){var len=expected.length;expected=expected.map(function(i){return String(i);});if(len>2){return"one of ".concat(thing," ").concat(expected.slice(0,len-1).join(', '),", or ")+expected[len-1];}else if(len===2){return"one of ".concat(thing," ").concat(expected[0]," or ").concat(expected[1]);}else{return"of ".concat(thing," ").concat(expected[0]);}}else{return"of ".concat(thing," ").concat(String(expected));}}// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
function startsWith(str,search,pos){return str.substr(!pos||pos<0?0:+pos,search.length)===search;}// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
function endsWith(str,search,this_len){if(this_len===undefined||this_len>str.length){this_len=str.length;}return str.substring(this_len-search.length,this_len)===search;}// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes
function includes(str,search,start){if(typeof start!=='number'){start=0;}if(start+search.length>str.length){return false;}else{return str.indexOf(search,start)!==-1;}}createErrorType('ERR_INVALID_OPT_VALUE',function(name,value){return'The value "'+value+'" is invalid for option "'+name+'"';},TypeError);createErrorType('ERR_INVALID_ARG_TYPE',function(name,expected,actual){// determiner: 'must be' or 'must not be'
var determiner;if(typeof expected==='string'&&startsWith(expected,'not ')){determiner='must not be';expected=expected.replace(/^not /,'');}else{determiner='must be';}var msg;if(endsWith(name,' argument')){// For cases like 'first argument'
msg="The ".concat(name," ").concat(determiner," ").concat(oneOf(expected,'type'));}else{var type=includes(name,'.')?'property':'argument';msg="The \"".concat(name,"\" ").concat(type," ").concat(determiner," ").concat(oneOf(expected,'type'));}msg+=". Received type ".concat(typeof actual);return msg;},TypeError);createErrorType('ERR_STREAM_PUSH_AFTER_EOF','stream.push() after EOF');createErrorType('ERR_METHOD_NOT_IMPLEMENTED',function(name){return'The '+name+' method is not implemented';});createErrorType('ERR_STREAM_PREMATURE_CLOSE','Premature close');createErrorType('ERR_STREAM_DESTROYED',function(name){return'Cannot call '+name+' after a stream was destroyed';});createErrorType('ERR_MULTIPLE_CALLBACK','Callback called multiple times');createErrorType('ERR_STREAM_CANNOT_PIPE','Cannot pipe, not readable');createErrorType('ERR_STREAM_WRITE_AFTER_END','write after end');createErrorType('ERR_STREAM_NULL_VALUES','May not write null values to stream',TypeError);createErrorType('ERR_UNKNOWN_ENCODING',function(arg){return'Unknown encoding: '+arg;},TypeError);createErrorType('ERR_STREAM_UNSHIFT_AFTER_END_EVENT','stream.unshift() after end event');module.exports.codes=codes;},{}],131:[function(require,module,exports){(function(process){(function(){// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.
'use strict';/*<replacement>*/var objectKeys=Object.keys||function(obj){var keys=[];for(var key in obj)keys.push(key);return keys;};/*</replacement>*/module.exports=Duplex;const Readable=require('./_stream_readable');const Writable=require('./_stream_writable');require('inherits')(Duplex,Readable);{// Allow the keys array to be GC'ed.
const keys=objectKeys(Writable.prototype);for(var v=0;v<keys.length;v++){const method=keys[v];if(!Duplex.prototype[method])Duplex.prototype[method]=Writable.prototype[method];}}function Duplex(options){if(!(this instanceof Duplex))return new Duplex(options);Readable.call(this,options);Writable.call(this,options);this.allowHalfOpen=true;if(options){if(options.readable===false)this.readable=false;if(options.writable===false)this.writable=false;if(options.allowHalfOpen===false){this.allowHalfOpen=false;this.once('end',onend);}}}Object.defineProperty(Duplex.prototype,'writableHighWaterMark',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get(){return this._writableState.highWaterMark;}});Object.defineProperty(Duplex.prototype,'writableBuffer',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get:function get(){return this._writableState&&this._writableState.getBuffer();}});Object.defineProperty(Duplex.prototype,'writableLength',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get(){return this._writableState.length;}});// the no-half-open enforcer
function onend(){// If the writable side ended, then we're ok.
if(this._writableState.ended)return;// no more data can be written.
// But allow more writes to happen in this tick.
process.nextTick(onEndNT,this);}function onEndNT(self){self.end();}Object.defineProperty(Duplex.prototype,'destroyed',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get(){if(this._readableState===undefined||this._writableState===undefined){return false;}return this._readableState.destroyed&&this._writableState.destroyed;},set(value){// we ignore the value if the stream
// has not been initialized yet
if(this._readableState===undefined||this._writableState===undefined){return;}// backward compatibility, the user is explicitly
// managing destroyed
this._readableState.destroyed=value;this._writableState.destroyed=value;}});}).call(this);}).call(this,require('_process'));},{"./_stream_readable":133,"./_stream_writable":135,"_process":121,"inherits":47}],132:[function(require,module,exports){// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.
'use strict';module.exports=PassThrough;const Transform=require('./_stream_transform');require('inherits')(PassThrough,Transform);function PassThrough(options){if(!(this instanceof PassThrough))return new PassThrough(options);Transform.call(this,options);}PassThrough.prototype._transform=function(chunk,encoding,cb){cb(null,chunk);};},{"./_stream_transform":134,"inherits":47}],133:[function(require,module,exports){(function(process,global){(function(){// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
'use strict';module.exports=Readable;/*<replacement>*/var Duplex;/*</replacement>*/Readable.ReadableState=ReadableState;/*<replacement>*/const EE=require('events').EventEmitter;var EElistenerCount=function EElistenerCount(emitter,type){return emitter.listeners(type).length;};/*</replacement>*/ /*<replacement>*/var Stream=require('./internal/streams/stream');/*</replacement>*/const Buffer=require('buffer').Buffer;const OurUint8Array=(typeof global!=='undefined'?global:typeof window!=='undefined'?window:typeof self!=='undefined'?self:{}).Uint8Array||function(){};function _uint8ArrayToBuffer(chunk){return Buffer.from(chunk);}function _isUint8Array(obj){return Buffer.isBuffer(obj)||obj instanceof OurUint8Array;}/*<replacement>*/const debugUtil=require('util');let debug;if(debugUtil&&debugUtil.debuglog){debug=debugUtil.debuglog('stream');}else{debug=function debug(){};}/*</replacement>*/const BufferList=require('./internal/streams/buffer_list');const destroyImpl=require('./internal/streams/destroy');const _require=require('./internal/streams/state'),getHighWaterMark=_require.getHighWaterMark;const _require$codes=require('../errors').codes,ERR_INVALID_ARG_TYPE=_require$codes.ERR_INVALID_ARG_TYPE,ERR_STREAM_PUSH_AFTER_EOF=_require$codes.ERR_STREAM_PUSH_AFTER_EOF,ERR_METHOD_NOT_IMPLEMENTED=_require$codes.ERR_METHOD_NOT_IMPLEMENTED,ERR_STREAM_UNSHIFT_AFTER_END_EVENT=_require$codes.ERR_STREAM_UNSHIFT_AFTER_END_EVENT;// Lazy loaded to improve the startup performance.
let StringDecoder;let createReadableStreamAsyncIterator;let from;require('inherits')(Readable,Stream);const errorOrDestroy=destroyImpl.errorOrDestroy;const kProxyEvents=['error','close','destroy','pause','resume'];function prependListener(emitter,event,fn){// Sadly this is not cacheable as some libraries bundle their own
// event emitter implementation with them.
if(typeof emitter.prependListener==='function')return emitter.prependListener(event,fn);// This is a hack to make sure that our error handler is attached before any
// userland ones.  NEVER DO THIS. This is here only because this code needs
// to continue to work with older versions of Node.js that do not include
// the prependListener() method. The goal is to eventually remove this hack.
if(!emitter._events||!emitter._events[event])emitter.on(event,fn);else if(Array.isArray(emitter._events[event]))emitter._events[event].unshift(fn);else emitter._events[event]=[fn,emitter._events[event]];}function ReadableState(options,stream,isDuplex){Duplex=Duplex||require('./_stream_duplex');options=options||{};// Duplex streams are both readable and writable, but share
// the same options object.
// However, some cases require setting options to different
// values for the readable and the writable sides of the duplex stream.
// These options can be provided separately as readableXXX and writableXXX.
if(typeof isDuplex!=='boolean')isDuplex=stream instanceof Duplex;// object stream flag. Used to make read(n) ignore n and to
// make all the buffer merging and length checks go away
this.objectMode=!!options.objectMode;if(isDuplex)this.objectMode=this.objectMode||!!options.readableObjectMode;// the point at which it stops calling _read() to fill the buffer
// Note: 0 is a valid value, means "don't call _read preemptively ever"
this.highWaterMark=getHighWaterMark(this,options,'readableHighWaterMark',isDuplex);// A linked list is used to store data chunks instead of an array because the
// linked list can remove elements from the beginning faster than
// array.shift()
this.buffer=new BufferList();this.length=0;this.pipes=null;this.pipesCount=0;this.flowing=null;this.ended=false;this.endEmitted=false;this.reading=false;// a flag to be able to tell if the event 'readable'/'data' is emitted
// immediately, or on a later tick.  We set this to true at first, because
// any actions that shouldn't happen until "later" should generally also
// not happen before the first read call.
this.sync=true;// whenever we return null, then we set a flag to say
// that we're awaiting a 'readable' event emission.
this.needReadable=false;this.emittedReadable=false;this.readableListening=false;this.resumeScheduled=false;this.paused=true;// Should close be emitted on destroy. Defaults to true.
this.emitClose=options.emitClose!==false;// Should .destroy() be called after 'end' (and potentially 'finish')
this.autoDestroy=!!options.autoDestroy;// has it been destroyed
this.destroyed=false;// Crypto is kind of old and crusty.  Historically, its default string
// encoding is 'binary' so we have to make this configurable.
// Everything else in the universe uses 'utf8', though.
this.defaultEncoding=options.defaultEncoding||'utf8';// the number of writers that are awaiting a drain event in .pipe()s
this.awaitDrain=0;// if true, a maybeReadMore has been scheduled
this.readingMore=false;this.decoder=null;this.encoding=null;if(options.encoding){if(!StringDecoder)StringDecoder=require('string_decoder/').StringDecoder;this.decoder=new StringDecoder(options.encoding);this.encoding=options.encoding;}}function Readable(options){Duplex=Duplex||require('./_stream_duplex');if(!(this instanceof Readable))return new Readable(options);// Checking for a Stream.Duplex instance is faster here instead of inside
// the ReadableState constructor, at least with V8 6.5
const isDuplex=this instanceof Duplex;this._readableState=new ReadableState(options,this,isDuplex);// legacy
this.readable=true;if(options){if(typeof options.read==='function')this._read=options.read;if(typeof options.destroy==='function')this._destroy=options.destroy;}Stream.call(this);}Object.defineProperty(Readable.prototype,'destroyed',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get(){if(this._readableState===undefined){return false;}return this._readableState.destroyed;},set(value){// we ignore the value if the stream
// has not been initialized yet
if(!this._readableState){return;}// backward compatibility, the user is explicitly
// managing destroyed
this._readableState.destroyed=value;}});Readable.prototype.destroy=destroyImpl.destroy;Readable.prototype._undestroy=destroyImpl.undestroy;Readable.prototype._destroy=function(err,cb){cb(err);};// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push=function(chunk,encoding){var state=this._readableState;var skipChunkCheck;if(!state.objectMode){if(typeof chunk==='string'){encoding=encoding||state.defaultEncoding;if(encoding!==state.encoding){chunk=Buffer.from(chunk,encoding);encoding='';}skipChunkCheck=true;}}else{skipChunkCheck=true;}return readableAddChunk(this,chunk,encoding,false,skipChunkCheck);};// Unshift should *always* be something directly out of read()
Readable.prototype.unshift=function(chunk){return readableAddChunk(this,chunk,null,true,false);};function readableAddChunk(stream,chunk,encoding,addToFront,skipChunkCheck){debug('readableAddChunk',chunk);var state=stream._readableState;if(chunk===null){state.reading=false;onEofChunk(stream,state);}else{var er;if(!skipChunkCheck)er=chunkInvalid(state,chunk);if(er){errorOrDestroy(stream,er);}else if(state.objectMode||chunk&&chunk.length>0){if(typeof chunk!=='string'&&!state.objectMode&&Object.getPrototypeOf(chunk)!==Buffer.prototype){chunk=_uint8ArrayToBuffer(chunk);}if(addToFront){if(state.endEmitted)errorOrDestroy(stream,new ERR_STREAM_UNSHIFT_AFTER_END_EVENT());else addChunk(stream,state,chunk,true);}else if(state.ended){errorOrDestroy(stream,new ERR_STREAM_PUSH_AFTER_EOF());}else if(state.destroyed){return false;}else{state.reading=false;if(state.decoder&&!encoding){chunk=state.decoder.write(chunk);if(state.objectMode||chunk.length!==0)addChunk(stream,state,chunk,false);else maybeReadMore(stream,state);}else{addChunk(stream,state,chunk,false);}}}else if(!addToFront){state.reading=false;maybeReadMore(stream,state);}}// We can push more data if we are below the highWaterMark.
// Also, if we have no data yet, we can stand some more bytes.
// This is to work around cases where hwm=0, such as the repl.
return!state.ended&&(state.length<state.highWaterMark||state.length===0);}function addChunk(stream,state,chunk,addToFront){if(state.flowing&&state.length===0&&!state.sync){state.awaitDrain=0;stream.emit('data',chunk);}else{// update the buffer info.
state.length+=state.objectMode?1:chunk.length;if(addToFront)state.buffer.unshift(chunk);else state.buffer.push(chunk);if(state.needReadable)emitReadable(stream);}maybeReadMore(stream,state);}function chunkInvalid(state,chunk){var er;if(!_isUint8Array(chunk)&&typeof chunk!=='string'&&chunk!==undefined&&!state.objectMode){er=new ERR_INVALID_ARG_TYPE('chunk',['string','Buffer','Uint8Array'],chunk);}return er;}Readable.prototype.isPaused=function(){return this._readableState.flowing===false;};// backwards compatibility.
Readable.prototype.setEncoding=function(enc){if(!StringDecoder)StringDecoder=require('string_decoder/').StringDecoder;const decoder=new StringDecoder(enc);this._readableState.decoder=decoder;// If setEncoding(null), decoder.encoding equals utf8
this._readableState.encoding=this._readableState.decoder.encoding;// Iterate over current buffer to convert already stored Buffers:
let p=this._readableState.buffer.head;let content='';while(p!==null){content+=decoder.write(p.data);p=p.next;}this._readableState.buffer.clear();if(content!=='')this._readableState.buffer.push(content);this._readableState.length=content.length;return this;};// Don't raise the hwm > 1GB
const MAX_HWM=0x40000000;function computeNewHighWaterMark(n){if(n>=MAX_HWM){// TODO(ronag): Throw ERR_VALUE_OUT_OF_RANGE.
n=MAX_HWM;}else{// Get the next highest power of 2 to prevent increasing hwm excessively in
// tiny amounts
n--;n|=n>>>1;n|=n>>>2;n|=n>>>4;n|=n>>>8;n|=n>>>16;n++;}return n;}// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n,state){if(n<=0||state.length===0&&state.ended)return 0;if(state.objectMode)return 1;if(n!==n){// Only flow one buffer at a time
if(state.flowing&&state.length)return state.buffer.head.data.length;else return state.length;}// If we're asking for more than the current hwm, then raise the hwm.
if(n>state.highWaterMark)state.highWaterMark=computeNewHighWaterMark(n);if(n<=state.length)return n;// Don't have enough
if(!state.ended){state.needReadable=true;return 0;}return state.length;}// you can override either this method, or the async _read(n) below.
Readable.prototype.read=function(n){debug('read',n);n=parseInt(n,10);var state=this._readableState;var nOrig=n;if(n!==0)state.emittedReadable=false;// if we're doing read(0) to trigger a readable event, but we
// already have a bunch of data in the buffer, then just trigger
// the 'readable' event and move on.
if(n===0&&state.needReadable&&((state.highWaterMark!==0?state.length>=state.highWaterMark:state.length>0)||state.ended)){debug('read: emitReadable',state.length,state.ended);if(state.length===0&&state.ended)endReadable(this);else emitReadable(this);return null;}n=howMuchToRead(n,state);// if we've ended, and we're now clear, then finish it up.
if(n===0&&state.ended){if(state.length===0)endReadable(this);return null;}// All the actual chunk generation logic needs to be
// *below* the call to _read.  The reason is that in certain
// synthetic stream cases, such as passthrough streams, _read
// may be a completely synchronous operation which may change
// the state of the read buffer, providing enough data when
// before there was *not* enough.
//
// So, the steps are:
// 1. Figure out what the state of things will be after we do
// a read from the buffer.
//
// 2. If that resulting state will trigger a _read, then call _read.
// Note that this may be asynchronous, or synchronous.  Yes, it is
// deeply ugly to write APIs this way, but that still doesn't mean
// that the Readable class should behave improperly, as streams are
// designed to be sync/async agnostic.
// Take note if the _read call is sync or async (ie, if the read call
// has returned yet), so that we know whether or not it's safe to emit
// 'readable' etc.
//
// 3. Actually pull the requested chunks out of the buffer and return.
// if we need a readable event, then we need to do some reading.
var doRead=state.needReadable;debug('need readable',doRead);// if we currently have less than the highWaterMark, then also read some
if(state.length===0||state.length-n<state.highWaterMark){doRead=true;debug('length less than watermark',doRead);}// however, if we've ended, then there's no point, and if we're already
// reading, then it's unnecessary.
if(state.ended||state.reading){doRead=false;debug('reading or ended',doRead);}else if(doRead){debug('do read');state.reading=true;state.sync=true;// if the length is currently zero, then we *need* a readable event.
if(state.length===0)state.needReadable=true;// call internal read method
this._read(state.highWaterMark);state.sync=false;// If _read pushed data synchronously, then `reading` will be false,
// and we need to re-evaluate how much data we can return to the user.
if(!state.reading)n=howMuchToRead(nOrig,state);}var ret;if(n>0)ret=fromList(n,state);else ret=null;if(ret===null){state.needReadable=state.length<=state.highWaterMark;n=0;}else{state.length-=n;state.awaitDrain=0;}if(state.length===0){// If we have nothing in the buffer, then we want to know
// as soon as we *do* get something into the buffer.
if(!state.ended)state.needReadable=true;// If we tried to read() past the EOF, then emit end on the next tick.
if(nOrig!==n&&state.ended)endReadable(this);}if(ret!==null)this.emit('data',ret);return ret;};function onEofChunk(stream,state){debug('onEofChunk');if(state.ended)return;if(state.decoder){var chunk=state.decoder.end();if(chunk&&chunk.length){state.buffer.push(chunk);state.length+=state.objectMode?1:chunk.length;}}state.ended=true;if(state.sync){// if we are sync, wait until next tick to emit the data.
// Otherwise we risk emitting data in the flow()
// the readable code triggers during a read() call
emitReadable(stream);}else{// emit 'readable' now to make sure it gets picked up.
state.needReadable=false;if(!state.emittedReadable){state.emittedReadable=true;emitReadable_(stream);}}}// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream){var state=stream._readableState;debug('emitReadable',state.needReadable,state.emittedReadable);state.needReadable=false;if(!state.emittedReadable){debug('emitReadable',state.flowing);state.emittedReadable=true;process.nextTick(emitReadable_,stream);}}function emitReadable_(stream){var state=stream._readableState;debug('emitReadable_',state.destroyed,state.length,state.ended);if(!state.destroyed&&(state.length||state.ended)){stream.emit('readable');state.emittedReadable=false;}// The stream needs another readable event if
// 1. It is not flowing, as the flow mechanism will take
//    care of it.
// 2. It is not ended.
// 3. It is below the highWaterMark, so we can schedule
//    another readable later.
state.needReadable=!state.flowing&&!state.ended&&state.length<=state.highWaterMark;flow(stream);}// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream,state){if(!state.readingMore){state.readingMore=true;process.nextTick(maybeReadMore_,stream,state);}}function maybeReadMore_(stream,state){// Attempt to read more data if we should.
//
// The conditions for reading more data are (one of):
// - Not enough data buffered (state.length < state.highWaterMark). The loop
//   is responsible for filling the buffer with enough data if such data
//   is available. If highWaterMark is 0 and we are not in the flowing mode
//   we should _not_ attempt to buffer any extra data. We'll get more data
//   when the stream consumer calls read() instead.
// - No data in the buffer, and the stream is in flowing mode. In this mode
//   the loop below is responsible for ensuring read() is called. Failing to
//   call read here would abort the flow and there's no other mechanism for
//   continuing the flow if the stream consumer has just subscribed to the
//   'data' event.
//
// In addition to the above conditions to keep reading data, the following
// conditions prevent the data from being read:
// - The stream has ended (state.ended).
// - There is already a pending 'read' operation (state.reading). This is a
//   case where the the stream has called the implementation defined _read()
//   method, but they are processing the call asynchronously and have _not_
//   called push() with new data. In this case we skip performing more
//   read()s. The execution ends in this method again after the _read() ends
//   up calling push() with more data.
while(!state.reading&&!state.ended&&(state.length<state.highWaterMark||state.flowing&&state.length===0)){const len=state.length;debug('maybeReadMore read 0');stream.read(0);if(len===state.length)// didn't get any data, stop spinning.
break;}state.readingMore=false;}// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read=function(n){errorOrDestroy(this,new ERR_METHOD_NOT_IMPLEMENTED('_read()'));};Readable.prototype.pipe=function(dest,pipeOpts){var src=this;var state=this._readableState;switch(state.pipesCount){case 0:state.pipes=dest;break;case 1:state.pipes=[state.pipes,dest];break;default:state.pipes.push(dest);break;}state.pipesCount+=1;debug('pipe count=%d opts=%j',state.pipesCount,pipeOpts);var doEnd=(!pipeOpts||pipeOpts.end!==false)&&dest!==process.stdout&&dest!==process.stderr;var endFn=doEnd?onend:unpipe;if(state.endEmitted)process.nextTick(endFn);else src.once('end',endFn);dest.on('unpipe',onunpipe);function onunpipe(readable,unpipeInfo){debug('onunpipe');if(readable===src){if(unpipeInfo&&unpipeInfo.hasUnpiped===false){unpipeInfo.hasUnpiped=true;cleanup();}}}function onend(){debug('onend');dest.end();}// when the dest drains, it reduces the awaitDrain counter
// on the source.  This would be more elegant with a .once()
// handler in flow(), but adding and removing repeatedly is
// too slow.
var ondrain=pipeOnDrain(src);dest.on('drain',ondrain);var cleanedUp=false;function cleanup(){debug('cleanup');// cleanup event handlers once the pipe is broken
dest.removeListener('close',onclose);dest.removeListener('finish',onfinish);dest.removeListener('drain',ondrain);dest.removeListener('error',onerror);dest.removeListener('unpipe',onunpipe);src.removeListener('end',onend);src.removeListener('end',unpipe);src.removeListener('data',ondata);cleanedUp=true;// if the reader is waiting for a drain event from this
// specific writer, then it would cause it to never start
// flowing again.
// So, if this is awaiting a drain, then we just call it now.
// If we don't know, then assume that we are waiting for one.
if(state.awaitDrain&&(!dest._writableState||dest._writableState.needDrain))ondrain();}src.on('data',ondata);function ondata(chunk){debug('ondata');var ret=dest.write(chunk);debug('dest.write',ret);if(ret===false){// If the user unpiped during `dest.write()`, it is possible
// to get stuck in a permanently paused state if that write
// also returned false.
// => Check whether `dest` is still a piping destination.
if((state.pipesCount===1&&state.pipes===dest||state.pipesCount>1&&indexOf(state.pipes,dest)!==-1)&&!cleanedUp){debug('false write response, pause',state.awaitDrain);state.awaitDrain++;}src.pause();}}// if the dest has an error, then stop piping into it.
// however, don't suppress the throwing behavior for this.
function onerror(er){debug('onerror',er);unpipe();dest.removeListener('error',onerror);if(EElistenerCount(dest,'error')===0)errorOrDestroy(dest,er);}// Make sure our error handler is attached before userland ones.
prependListener(dest,'error',onerror);// Both close and finish should trigger unpipe, but only once.
function onclose(){dest.removeListener('finish',onfinish);unpipe();}dest.once('close',onclose);function onfinish(){debug('onfinish');dest.removeListener('close',onclose);unpipe();}dest.once('finish',onfinish);function unpipe(){debug('unpipe');src.unpipe(dest);}// tell the dest that it's being piped to
dest.emit('pipe',src);// start the flow if it hasn't been started already.
if(!state.flowing){debug('pipe resume');src.resume();}return dest;};function pipeOnDrain(src){return function pipeOnDrainFunctionResult(){var state=src._readableState;debug('pipeOnDrain',state.awaitDrain);if(state.awaitDrain)state.awaitDrain--;if(state.awaitDrain===0&&EElistenerCount(src,'data')){state.flowing=true;flow(src);}};}Readable.prototype.unpipe=function(dest){var state=this._readableState;var unpipeInfo={hasUnpiped:false};// if we're not piping anywhere, then do nothing.
if(state.pipesCount===0)return this;// just one destination.  most common case.
if(state.pipesCount===1){// passed in one, but it's not the right one.
if(dest&&dest!==state.pipes)return this;if(!dest)dest=state.pipes;// got a match.
state.pipes=null;state.pipesCount=0;state.flowing=false;if(dest)dest.emit('unpipe',this,unpipeInfo);return this;}// slow case. multiple pipe destinations.
if(!dest){// remove all.
var dests=state.pipes;var len=state.pipesCount;state.pipes=null;state.pipesCount=0;state.flowing=false;for(var i=0;i<len;i++)dests[i].emit('unpipe',this,{hasUnpiped:false});return this;}// try to find the right one.
var index=indexOf(state.pipes,dest);if(index===-1)return this;state.pipes.splice(index,1);state.pipesCount-=1;if(state.pipesCount===1)state.pipes=state.pipes[0];dest.emit('unpipe',this,unpipeInfo);return this;};// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on=function(ev,fn){const res=Stream.prototype.on.call(this,ev,fn);const state=this._readableState;if(ev==='data'){// update readableListening so that resume() may be a no-op
// a few lines down. This is needed to support once('readable').
state.readableListening=this.listenerCount('readable')>0;// Try start flowing on next tick if stream isn't explicitly paused
if(state.flowing!==false)this.resume();}else if(ev==='readable'){if(!state.endEmitted&&!state.readableListening){state.readableListening=state.needReadable=true;state.flowing=false;state.emittedReadable=false;debug('on readable',state.length,state.reading);if(state.length){emitReadable(this);}else if(!state.reading){process.nextTick(nReadingNextTick,this);}}}return res;};Readable.prototype.addListener=Readable.prototype.on;Readable.prototype.removeListener=function(ev,fn){const res=Stream.prototype.removeListener.call(this,ev,fn);if(ev==='readable'){// We need to check if there is someone still listening to
// readable and reset the state. However this needs to happen
// after readable has been emitted but before I/O (nextTick) to
// support once('readable', fn) cycles. This means that calling
// resume within the same tick will have no
// effect.
process.nextTick(updateReadableListening,this);}return res;};Readable.prototype.removeAllListeners=function(ev){const res=Stream.prototype.removeAllListeners.apply(this,arguments);if(ev==='readable'||ev===undefined){// We need to check if there is someone still listening to
// readable and reset the state. However this needs to happen
// after readable has been emitted but before I/O (nextTick) to
// support once('readable', fn) cycles. This means that calling
// resume within the same tick will have no
// effect.
process.nextTick(updateReadableListening,this);}return res;};function updateReadableListening(self){const state=self._readableState;state.readableListening=self.listenerCount('readable')>0;if(state.resumeScheduled&&!state.paused){// flowing needs to be set to true now, otherwise
// the upcoming resume will not flow.
state.flowing=true;// crude way to check if we should resume
}else if(self.listenerCount('data')>0){self.resume();}}function nReadingNextTick(self){debug('readable nexttick read 0');self.read(0);}// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume=function(){var state=this._readableState;if(!state.flowing){debug('resume');// we flow only if there is no one listening
// for readable, but we still have to call
// resume()
state.flowing=!state.readableListening;resume(this,state);}state.paused=false;return this;};function resume(stream,state){if(!state.resumeScheduled){state.resumeScheduled=true;process.nextTick(resume_,stream,state);}}function resume_(stream,state){debug('resume',state.reading);if(!state.reading){stream.read(0);}state.resumeScheduled=false;stream.emit('resume');flow(stream);if(state.flowing&&!state.reading)stream.read(0);}Readable.prototype.pause=function(){debug('call pause flowing=%j',this._readableState.flowing);if(this._readableState.flowing!==false){debug('pause');this._readableState.flowing=false;this.emit('pause');}this._readableState.paused=true;return this;};function flow(stream){const state=stream._readableState;debug('flow',state.flowing);while(state.flowing&&stream.read()!==null);}// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap=function(stream){var state=this._readableState;var paused=false;stream.on('end',()=>{debug('wrapped end');if(state.decoder&&!state.ended){var chunk=state.decoder.end();if(chunk&&chunk.length)this.push(chunk);}this.push(null);});stream.on('data',chunk=>{debug('wrapped data');if(state.decoder)chunk=state.decoder.write(chunk);// don't skip over falsy values in objectMode
if(state.objectMode&&(chunk===null||chunk===undefined))return;else if(!state.objectMode&&(!chunk||!chunk.length))return;var ret=this.push(chunk);if(!ret){paused=true;stream.pause();}});// proxy all the other methods.
// important when wrapping filters and duplexes.
for(var i in stream){if(this[i]===undefined&&typeof stream[i]==='function'){this[i]=function methodWrap(method){return function methodWrapReturnFunction(){return stream[method].apply(stream,arguments);};}(i);}}// proxy certain important events.
for(var n=0;n<kProxyEvents.length;n++){stream.on(kProxyEvents[n],this.emit.bind(this,kProxyEvents[n]));}// when we try to consume some more bytes, simply unpause the
// underlying stream.
this._read=n=>{debug('wrapped _read',n);if(paused){paused=false;stream.resume();}};return this;};if(typeof Symbol==='function'){Readable.prototype[Symbol.asyncIterator]=function(){if(createReadableStreamAsyncIterator===undefined){createReadableStreamAsyncIterator=require('./internal/streams/async_iterator');}return createReadableStreamAsyncIterator(this);};}Object.defineProperty(Readable.prototype,'readableHighWaterMark',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get:function get(){return this._readableState.highWaterMark;}});Object.defineProperty(Readable.prototype,'readableBuffer',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get:function get(){return this._readableState&&this._readableState.buffer;}});Object.defineProperty(Readable.prototype,'readableFlowing',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get:function get(){return this._readableState.flowing;},set:function set(state){if(this._readableState){this._readableState.flowing=state;}}});// exposed for testing purposes only.
Readable._fromList=fromList;Object.defineProperty(Readable.prototype,'readableLength',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get(){return this._readableState.length;}});// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n,state){// nothing buffered
if(state.length===0)return null;var ret;if(state.objectMode)ret=state.buffer.shift();else if(!n||n>=state.length){// read it all, truncate the list
if(state.decoder)ret=state.buffer.join('');else if(state.buffer.length===1)ret=state.buffer.first();else ret=state.buffer.concat(state.length);state.buffer.clear();}else{// read part of list
ret=state.buffer.consume(n,state.decoder);}return ret;}function endReadable(stream){var state=stream._readableState;debug('endReadable',state.endEmitted);if(!state.endEmitted){state.ended=true;process.nextTick(endReadableNT,state,stream);}}function endReadableNT(state,stream){debug('endReadableNT',state.endEmitted,state.length);// Check that we didn't get one last unshift.
if(!state.endEmitted&&state.length===0){state.endEmitted=true;stream.readable=false;stream.emit('end');if(state.autoDestroy){// In case of duplex streams we need a way to detect
// if the writable side is ready for autoDestroy as well
const wState=stream._writableState;if(!wState||wState.autoDestroy&&wState.finished){stream.destroy();}}}}if(typeof Symbol==='function'){Readable.from=function(iterable,opts){if(from===undefined){from=require('./internal/streams/from');}return from(Readable,iterable,opts);};}function indexOf(xs,x){for(var i=0,l=xs.length;i<l;i++){if(xs[i]===x)return i;}return-1;}}).call(this);}).call(this,require('_process'),typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{});},{"../errors":130,"./_stream_duplex":131,"./internal/streams/async_iterator":136,"./internal/streams/buffer_list":137,"./internal/streams/destroy":138,"./internal/streams/from":140,"./internal/streams/state":142,"./internal/streams/stream":143,"_process":121,"buffer":22,"events":26,"inherits":47,"string_decoder/":163,"util":20}],134:[function(require,module,exports){// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.
'use strict';module.exports=Transform;const _require$codes=require('../errors').codes,ERR_METHOD_NOT_IMPLEMENTED=_require$codes.ERR_METHOD_NOT_IMPLEMENTED,ERR_MULTIPLE_CALLBACK=_require$codes.ERR_MULTIPLE_CALLBACK,ERR_TRANSFORM_ALREADY_TRANSFORMING=_require$codes.ERR_TRANSFORM_ALREADY_TRANSFORMING,ERR_TRANSFORM_WITH_LENGTH_0=_require$codes.ERR_TRANSFORM_WITH_LENGTH_0;const Duplex=require('./_stream_duplex');require('inherits')(Transform,Duplex);function afterTransform(er,data){var ts=this._transformState;ts.transforming=false;var cb=ts.writecb;if(cb===null){return this.emit('error',new ERR_MULTIPLE_CALLBACK());}ts.writechunk=null;ts.writecb=null;if(data!=null)// single equals check for both `null` and `undefined`
this.push(data);cb(er);var rs=this._readableState;rs.reading=false;if(rs.needReadable||rs.length<rs.highWaterMark){this._read(rs.highWaterMark);}}function Transform(options){if(!(this instanceof Transform))return new Transform(options);Duplex.call(this,options);this._transformState={afterTransform:afterTransform.bind(this),needTransform:false,transforming:false,writecb:null,writechunk:null,writeencoding:null};// start out asking for a readable event once data is transformed.
this._readableState.needReadable=true;// we have implemented the _read method, and done the other things
// that Readable wants before the first _read call, so unset the
// sync guard flag.
this._readableState.sync=false;if(options){if(typeof options.transform==='function')this._transform=options.transform;if(typeof options.flush==='function')this._flush=options.flush;}// When the writable side finishes, then flush out anything remaining.
this.on('prefinish',prefinish);}function prefinish(){if(typeof this._flush==='function'&&!this._readableState.destroyed){this._flush((er,data)=>{done(this,er,data);});}else{done(this,null,null);}}Transform.prototype.push=function(chunk,encoding){this._transformState.needTransform=false;return Duplex.prototype.push.call(this,chunk,encoding);};// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform=function(chunk,encoding,cb){cb(new ERR_METHOD_NOT_IMPLEMENTED('_transform()'));};Transform.prototype._write=function(chunk,encoding,cb){var ts=this._transformState;ts.writecb=cb;ts.writechunk=chunk;ts.writeencoding=encoding;if(!ts.transforming){var rs=this._readableState;if(ts.needTransform||rs.needReadable||rs.length<rs.highWaterMark)this._read(rs.highWaterMark);}};// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read=function(n){var ts=this._transformState;if(ts.writechunk!==null&&!ts.transforming){ts.transforming=true;this._transform(ts.writechunk,ts.writeencoding,ts.afterTransform);}else{// mark that we need a transform, so that any data that comes in
// will get processed, now that we've asked for it.
ts.needTransform=true;}};Transform.prototype._destroy=function(err,cb){Duplex.prototype._destroy.call(this,err,err2=>{cb(err2);});};function done(stream,er,data){if(er)return stream.emit('error',er);if(data!=null)// single equals check for both `null` and `undefined`
stream.push(data);// TODO(BridgeAR): Write a test for these two error cases
// if there's nothing in the write buffer, then that means
// that nothing more will ever be provided
if(stream._writableState.length)throw new ERR_TRANSFORM_WITH_LENGTH_0();if(stream._transformState.transforming)throw new ERR_TRANSFORM_ALREADY_TRANSFORMING();return stream.push(null);}},{"../errors":130,"./_stream_duplex":131,"inherits":47}],135:[function(require,module,exports){(function(process,global){(function(){// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.
'use strict';module.exports=Writable;/* <replacement> */function WriteReq(chunk,encoding,cb){this.chunk=chunk;this.encoding=encoding;this.callback=cb;this.next=null;}// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state){this.next=null;this.entry=null;this.finish=()=>{onCorkedFinish(this,state);};}/* </replacement> */ /*<replacement>*/var Duplex;/*</replacement>*/Writable.WritableState=WritableState;/*<replacement>*/const internalUtil={deprecate:require('util-deprecate')};/*</replacement>*/ /*<replacement>*/var Stream=require('./internal/streams/stream');/*</replacement>*/const Buffer=require('buffer').Buffer;const OurUint8Array=(typeof global!=='undefined'?global:typeof window!=='undefined'?window:typeof self!=='undefined'?self:{}).Uint8Array||function(){};function _uint8ArrayToBuffer(chunk){return Buffer.from(chunk);}function _isUint8Array(obj){return Buffer.isBuffer(obj)||obj instanceof OurUint8Array;}const destroyImpl=require('./internal/streams/destroy');const _require=require('./internal/streams/state'),getHighWaterMark=_require.getHighWaterMark;const _require$codes=require('../errors').codes,ERR_INVALID_ARG_TYPE=_require$codes.ERR_INVALID_ARG_TYPE,ERR_METHOD_NOT_IMPLEMENTED=_require$codes.ERR_METHOD_NOT_IMPLEMENTED,ERR_MULTIPLE_CALLBACK=_require$codes.ERR_MULTIPLE_CALLBACK,ERR_STREAM_CANNOT_PIPE=_require$codes.ERR_STREAM_CANNOT_PIPE,ERR_STREAM_DESTROYED=_require$codes.ERR_STREAM_DESTROYED,ERR_STREAM_NULL_VALUES=_require$codes.ERR_STREAM_NULL_VALUES,ERR_STREAM_WRITE_AFTER_END=_require$codes.ERR_STREAM_WRITE_AFTER_END,ERR_UNKNOWN_ENCODING=_require$codes.ERR_UNKNOWN_ENCODING;const errorOrDestroy=destroyImpl.errorOrDestroy;require('inherits')(Writable,Stream);function nop(){}function WritableState(options,stream,isDuplex){Duplex=Duplex||require('./_stream_duplex');options=options||{};// Duplex streams are both readable and writable, but share
// the same options object.
// However, some cases require setting options to different
// values for the readable and the writable sides of the duplex stream,
// e.g. options.readableObjectMode vs. options.writableObjectMode, etc.
if(typeof isDuplex!=='boolean')isDuplex=stream instanceof Duplex;// object stream flag to indicate whether or not this stream
// contains buffers or objects.
this.objectMode=!!options.objectMode;if(isDuplex)this.objectMode=this.objectMode||!!options.writableObjectMode;// the point at which write() starts returning false
// Note: 0 is a valid value, means that we always return false if
// the entire buffer is not flushed immediately on write()
this.highWaterMark=getHighWaterMark(this,options,'writableHighWaterMark',isDuplex);// if _final has been called
this.finalCalled=false;// drain event flag.
this.needDrain=false;// at the start of calling end()
this.ending=false;// when end() has been called, and returned
this.ended=false;// when 'finish' is emitted
this.finished=false;// has it been destroyed
this.destroyed=false;// should we decode strings into buffers before passing to _write?
// this is here so that some node-core streams can optimize string
// handling at a lower level.
var noDecode=options.decodeStrings===false;this.decodeStrings=!noDecode;// Crypto is kind of old and crusty.  Historically, its default string
// encoding is 'binary' so we have to make this configurable.
// Everything else in the universe uses 'utf8', though.
this.defaultEncoding=options.defaultEncoding||'utf8';// not an actual buffer we keep track of, but a measurement
// of how much we're waiting to get pushed to some underlying
// socket or file.
this.length=0;// a flag to see when we're in the middle of a write.
this.writing=false;// when true all writes will be buffered until .uncork() call
this.corked=0;// a flag to be able to tell if the onwrite cb is called immediately,
// or on a later tick.  We set this to true at first, because any
// actions that shouldn't happen until "later" should generally also
// not happen before the first write call.
this.sync=true;// a flag to know if we're processing previously buffered items, which
// may call the _write() callback in the same tick, so that we don't
// end up in an overlapped onwrite situation.
this.bufferProcessing=false;// the callback that's passed to _write(chunk,cb)
this.onwrite=function(er){onwrite(stream,er);};// the callback that the user supplies to write(chunk,encoding,cb)
this.writecb=null;// the amount that is being written when _write is called.
this.writelen=0;this.bufferedRequest=null;this.lastBufferedRequest=null;// number of pending user-supplied write callbacks
// this must be 0 before 'finish' can be emitted
this.pendingcb=0;// emit prefinish if the only thing we're waiting for is _write cbs
// This is relevant for synchronous Transform streams
this.prefinished=false;// True if the error was already emitted and should not be thrown again
this.errorEmitted=false;// Should close be emitted on destroy. Defaults to true.
this.emitClose=options.emitClose!==false;// Should .destroy() be called after 'finish' (and potentially 'end')
this.autoDestroy=!!options.autoDestroy;// count buffered requests
this.bufferedRequestCount=0;// allocate the first CorkedRequest, there is always
// one allocated and free to use, and we maintain at most two
this.corkedRequestsFree=new CorkedRequest(this);}WritableState.prototype.getBuffer=function getBuffer(){var current=this.bufferedRequest;var out=[];while(current){out.push(current);current=current.next;}return out;};(function(){try{Object.defineProperty(WritableState.prototype,'buffer',{get:internalUtil.deprecate(function writableStateBufferGetter(){return this.getBuffer();},'_writableState.buffer is deprecated. Use _writableState.getBuffer '+'instead.','DEP0003')});}catch(_){}})();// Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.
var realHasInstance;if(typeof Symbol==='function'&&Symbol.hasInstance&&typeof Function.prototype[Symbol.hasInstance]==='function'){realHasInstance=Function.prototype[Symbol.hasInstance];Object.defineProperty(Writable,Symbol.hasInstance,{value:function value(object){if(realHasInstance.call(this,object))return true;if(this!==Writable)return false;return object&&object._writableState instanceof WritableState;}});}else{realHasInstance=function realHasInstance(object){return object instanceof this;};}function Writable(options){Duplex=Duplex||require('./_stream_duplex');// Writable ctor is applied to Duplexes, too.
// `realHasInstance` is necessary because using plain `instanceof`
// would return false, as no `_writableState` property is attached.
// Trying to use the custom `instanceof` for Writable here will also break the
// Node.js LazyTransform implementation, which has a non-trivial getter for
// `_writableState` that would lead to infinite recursion.
// Checking for a Stream.Duplex instance is faster here instead of inside
// the WritableState constructor, at least with V8 6.5
const isDuplex=this instanceof Duplex;if(!isDuplex&&!realHasInstance.call(Writable,this))return new Writable(options);this._writableState=new WritableState(options,this,isDuplex);// legacy.
this.writable=true;if(options){if(typeof options.write==='function')this._write=options.write;if(typeof options.writev==='function')this._writev=options.writev;if(typeof options.destroy==='function')this._destroy=options.destroy;if(typeof options.final==='function')this._final=options.final;}Stream.call(this);}// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe=function(){errorOrDestroy(this,new ERR_STREAM_CANNOT_PIPE());};function writeAfterEnd(stream,cb){var er=new ERR_STREAM_WRITE_AFTER_END();// TODO: defer error events consistently everywhere, not just the cb
errorOrDestroy(stream,er);process.nextTick(cb,er);}// Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.
function validChunk(stream,state,chunk,cb){var er;if(chunk===null){er=new ERR_STREAM_NULL_VALUES();}else if(typeof chunk!=='string'&&!state.objectMode){er=new ERR_INVALID_ARG_TYPE('chunk',['string','Buffer'],chunk);}if(er){errorOrDestroy(stream,er);process.nextTick(cb,er);return false;}return true;}Writable.prototype.write=function(chunk,encoding,cb){var state=this._writableState;var ret=false;var isBuf=!state.objectMode&&_isUint8Array(chunk);if(isBuf&&!Buffer.isBuffer(chunk)){chunk=_uint8ArrayToBuffer(chunk);}if(typeof encoding==='function'){cb=encoding;encoding=null;}if(isBuf)encoding='buffer';else if(!encoding)encoding=state.defaultEncoding;if(typeof cb!=='function')cb=nop;if(state.ending)writeAfterEnd(this,cb);else if(isBuf||validChunk(this,state,chunk,cb)){state.pendingcb++;ret=writeOrBuffer(this,state,isBuf,chunk,encoding,cb);}return ret;};Writable.prototype.cork=function(){this._writableState.corked++;};Writable.prototype.uncork=function(){var state=this._writableState;if(state.corked){state.corked--;if(!state.writing&&!state.corked&&!state.bufferProcessing&&state.bufferedRequest)clearBuffer(this,state);}};Writable.prototype.setDefaultEncoding=function setDefaultEncoding(encoding){// node::ParseEncoding() requires lower case.
if(typeof encoding==='string')encoding=encoding.toLowerCase();if(!(['hex','utf8','utf-8','ascii','binary','base64','ucs2','ucs-2','utf16le','utf-16le','raw'].indexOf((encoding+'').toLowerCase())>-1))throw new ERR_UNKNOWN_ENCODING(encoding);this._writableState.defaultEncoding=encoding;return this;};Object.defineProperty(Writable.prototype,'writableBuffer',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get:function get(){return this._writableState&&this._writableState.getBuffer();}});function decodeChunk(state,chunk,encoding){if(!state.objectMode&&state.decodeStrings!==false&&typeof chunk==='string'){chunk=Buffer.from(chunk,encoding);}return chunk;}Object.defineProperty(Writable.prototype,'writableHighWaterMark',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get:function get(){return this._writableState.highWaterMark;}});// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream,state,isBuf,chunk,encoding,cb){if(!isBuf){var newChunk=decodeChunk(state,chunk,encoding);if(chunk!==newChunk){isBuf=true;encoding='buffer';chunk=newChunk;}}var len=state.objectMode?1:chunk.length;state.length+=len;var ret=state.length<state.highWaterMark;// we must ensure that previous needDrain will not be reset to false.
if(!ret)state.needDrain=true;if(state.writing||state.corked){var last=state.lastBufferedRequest;state.lastBufferedRequest={chunk,encoding,isBuf,callback:cb,next:null};if(last){last.next=state.lastBufferedRequest;}else{state.bufferedRequest=state.lastBufferedRequest;}state.bufferedRequestCount+=1;}else{doWrite(stream,state,false,len,chunk,encoding,cb);}return ret;}function doWrite(stream,state,writev,len,chunk,encoding,cb){state.writelen=len;state.writecb=cb;state.writing=true;state.sync=true;if(state.destroyed)state.onwrite(new ERR_STREAM_DESTROYED('write'));else if(writev)stream._writev(chunk,state.onwrite);else stream._write(chunk,encoding,state.onwrite);state.sync=false;}function onwriteError(stream,state,sync,er,cb){--state.pendingcb;if(sync){// defer the callback if we are being called synchronously
// to avoid piling up things on the stack
process.nextTick(cb,er);// this can emit finish, and it will always happen
// after error
process.nextTick(finishMaybe,stream,state);stream._writableState.errorEmitted=true;errorOrDestroy(stream,er);}else{// the caller expect this to happen before if
// it is async
cb(er);stream._writableState.errorEmitted=true;errorOrDestroy(stream,er);// this can emit finish, but finish must
// always follow error
finishMaybe(stream,state);}}function onwriteStateUpdate(state){state.writing=false;state.writecb=null;state.length-=state.writelen;state.writelen=0;}function onwrite(stream,er){var state=stream._writableState;var sync=state.sync;var cb=state.writecb;if(typeof cb!=='function')throw new ERR_MULTIPLE_CALLBACK();onwriteStateUpdate(state);if(er)onwriteError(stream,state,sync,er,cb);else{// Check if we're actually ready to finish, but don't emit yet
var finished=needFinish(state)||stream.destroyed;if(!finished&&!state.corked&&!state.bufferProcessing&&state.bufferedRequest){clearBuffer(stream,state);}if(sync){process.nextTick(afterWrite,stream,state,finished,cb);}else{afterWrite(stream,state,finished,cb);}}}function afterWrite(stream,state,finished,cb){if(!finished)onwriteDrain(stream,state);state.pendingcb--;cb();finishMaybe(stream,state);}// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream,state){if(state.length===0&&state.needDrain){state.needDrain=false;stream.emit('drain');}}// if there's something in the buffer waiting, then process it
function clearBuffer(stream,state){state.bufferProcessing=true;var entry=state.bufferedRequest;if(stream._writev&&entry&&entry.next){// Fast case, write everything using _writev()
var l=state.bufferedRequestCount;var buffer=new Array(l);var holder=state.corkedRequestsFree;holder.entry=entry;var count=0;var allBuffers=true;while(entry){buffer[count]=entry;if(!entry.isBuf)allBuffers=false;entry=entry.next;count+=1;}buffer.allBuffers=allBuffers;doWrite(stream,state,true,state.length,buffer,'',holder.finish);// doWrite is almost always async, defer these to save a bit of time
// as the hot path ends with doWrite
state.pendingcb++;state.lastBufferedRequest=null;if(holder.next){state.corkedRequestsFree=holder.next;holder.next=null;}else{state.corkedRequestsFree=new CorkedRequest(state);}state.bufferedRequestCount=0;}else{// Slow case, write chunks one-by-one
while(entry){var chunk=entry.chunk;var encoding=entry.encoding;var cb=entry.callback;var len=state.objectMode?1:chunk.length;doWrite(stream,state,false,len,chunk,encoding,cb);entry=entry.next;state.bufferedRequestCount--;// if we didn't call the onwrite immediately, then
// it means that we need to wait until it does.
// also, that means that the chunk and cb are currently
// being processed, so move the buffer counter past them.
if(state.writing){break;}}if(entry===null)state.lastBufferedRequest=null;}state.bufferedRequest=entry;state.bufferProcessing=false;}Writable.prototype._write=function(chunk,encoding,cb){cb(new ERR_METHOD_NOT_IMPLEMENTED('_write()'));};Writable.prototype._writev=null;Writable.prototype.end=function(chunk,encoding,cb){var state=this._writableState;if(typeof chunk==='function'){cb=chunk;chunk=null;encoding=null;}else if(typeof encoding==='function'){cb=encoding;encoding=null;}if(chunk!==null&&chunk!==undefined)this.write(chunk,encoding);// .end() fully uncorks
if(state.corked){state.corked=1;this.uncork();}// ignore unnecessary end() calls.
if(!state.ending)endWritable(this,state,cb);return this;};Object.defineProperty(Writable.prototype,'writableLength',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get(){return this._writableState.length;}});function needFinish(state){return state.ending&&state.length===0&&state.bufferedRequest===null&&!state.finished&&!state.writing;}function callFinal(stream,state){stream._final(err=>{state.pendingcb--;if(err){errorOrDestroy(stream,err);}state.prefinished=true;stream.emit('prefinish');finishMaybe(stream,state);});}function prefinish(stream,state){if(!state.prefinished&&!state.finalCalled){if(typeof stream._final==='function'&&!state.destroyed){state.pendingcb++;state.finalCalled=true;process.nextTick(callFinal,stream,state);}else{state.prefinished=true;stream.emit('prefinish');}}}function finishMaybe(stream,state){var need=needFinish(state);if(need){prefinish(stream,state);if(state.pendingcb===0){state.finished=true;stream.emit('finish');if(state.autoDestroy){// In case of duplex streams we need a way to detect
// if the readable side is ready for autoDestroy as well
const rState=stream._readableState;if(!rState||rState.autoDestroy&&rState.endEmitted){stream.destroy();}}}}return need;}function endWritable(stream,state,cb){state.ending=true;finishMaybe(stream,state);if(cb){if(state.finished)process.nextTick(cb);else stream.once('finish',cb);}state.ended=true;stream.writable=false;}function onCorkedFinish(corkReq,state,err){var entry=corkReq.entry;corkReq.entry=null;while(entry){var cb=entry.callback;state.pendingcb--;cb(err);entry=entry.next;}// reuse the free corkReq.
state.corkedRequestsFree.next=corkReq;}Object.defineProperty(Writable.prototype,'destroyed',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get(){if(this._writableState===undefined){return false;}return this._writableState.destroyed;},set(value){// we ignore the value if the stream
// has not been initialized yet
if(!this._writableState){return;}// backward compatibility, the user is explicitly
// managing destroyed
this._writableState.destroyed=value;}});Writable.prototype.destroy=destroyImpl.destroy;Writable.prototype._undestroy=destroyImpl.undestroy;Writable.prototype._destroy=function(err,cb){cb(err);};}).call(this);}).call(this,require('_process'),typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{});},{"../errors":130,"./_stream_duplex":131,"./internal/streams/destroy":138,"./internal/streams/state":142,"./internal/streams/stream":143,"_process":121,"buffer":22,"inherits":47,"util-deprecate":168}],136:[function(require,module,exports){(function(process){(function(){'use strict';const finished=require('./end-of-stream');const kLastResolve=Symbol('lastResolve');const kLastReject=Symbol('lastReject');const kError=Symbol('error');const kEnded=Symbol('ended');const kLastPromise=Symbol('lastPromise');const kHandlePromise=Symbol('handlePromise');const kStream=Symbol('stream');function createIterResult(value,done){return{value,done};}function readAndResolve(iter){const resolve=iter[kLastResolve];if(resolve!==null){const data=iter[kStream].read();// we defer if data is null
// we can be expecting either 'end' or
// 'error'
if(data!==null){iter[kLastPromise]=null;iter[kLastResolve]=null;iter[kLastReject]=null;resolve(createIterResult(data,false));}}}function onReadable(iter){// we wait for the next tick, because it might
// emit an error with process.nextTick
process.nextTick(readAndResolve,iter);}function wrapForNext(lastPromise,iter){return(resolve,reject)=>{lastPromise.then(()=>{if(iter[kEnded]){resolve(createIterResult(undefined,true));return;}iter[kHandlePromise](resolve,reject);},reject);};}const AsyncIteratorPrototype=Object.getPrototypeOf(function(){});const ReadableStreamAsyncIteratorPrototype=Object.setPrototypeOf({get stream(){return this[kStream];},next(){// if we have detected an error in the meanwhile
// reject straight away
const error=this[kError];if(error!==null){return Promise.reject(error);}if(this[kEnded]){return Promise.resolve(createIterResult(undefined,true));}if(this[kStream].destroyed){// We need to defer via nextTick because if .destroy(err) is
// called, the error will be emitted via nextTick, and
// we cannot guarantee that there is no error lingering around
// waiting to be emitted.
return new Promise((resolve,reject)=>{process.nextTick(()=>{if(this[kError]){reject(this[kError]);}else{resolve(createIterResult(undefined,true));}});});}// if we have multiple next() calls
// we will wait for the previous Promise to finish
// this logic is optimized to support for await loops,
// where next() is only called once at a time
const lastPromise=this[kLastPromise];let promise;if(lastPromise){promise=new Promise(wrapForNext(lastPromise,this));}else{// fast path needed to support multiple this.push()
// without triggering the next() queue
const data=this[kStream].read();if(data!==null){return Promise.resolve(createIterResult(data,false));}promise=new Promise(this[kHandlePromise]);}this[kLastPromise]=promise;return promise;},[Symbol.asyncIterator](){return this;},return(){// destroy(err, cb) is a private API
// we can guarantee we have that here, because we control the
// Readable class this is attached to
return new Promise((resolve,reject)=>{this[kStream].destroy(null,err=>{if(err){reject(err);return;}resolve(createIterResult(undefined,true));});});}},AsyncIteratorPrototype);const createReadableStreamAsyncIterator=stream=>{const iterator=Object.create(ReadableStreamAsyncIteratorPrototype,{[kStream]:{value:stream,writable:true},[kLastResolve]:{value:null,writable:true},[kLastReject]:{value:null,writable:true},[kError]:{value:null,writable:true},[kEnded]:{value:stream._readableState.endEmitted,writable:true},// the function passed to new Promise
// is cached so we avoid allocating a new
// closure at every run
[kHandlePromise]:{value:(resolve,reject)=>{const data=iterator[kStream].read();if(data){iterator[kLastPromise]=null;iterator[kLastResolve]=null;iterator[kLastReject]=null;resolve(createIterResult(data,false));}else{iterator[kLastResolve]=resolve;iterator[kLastReject]=reject;}},writable:true}});iterator[kLastPromise]=null;finished(stream,err=>{if(err&&err.code!=='ERR_STREAM_PREMATURE_CLOSE'){const reject=iterator[kLastReject];// reject if we are waiting for data in the Promise
// returned by next() and store the error
if(reject!==null){iterator[kLastPromise]=null;iterator[kLastResolve]=null;iterator[kLastReject]=null;reject(err);}iterator[kError]=err;return;}const resolve=iterator[kLastResolve];if(resolve!==null){iterator[kLastPromise]=null;iterator[kLastResolve]=null;iterator[kLastReject]=null;resolve(createIterResult(undefined,true));}iterator[kEnded]=true;});stream.on('readable',onReadable.bind(null,iterator));return iterator;};module.exports=createReadableStreamAsyncIterator;}).call(this);}).call(this,require('_process'));},{"./end-of-stream":139,"_process":121}],137:[function(require,module,exports){'use strict';function ownKeys(object,enumerableOnly){var keys=Object.keys(object);if(Object.getOwnPropertySymbols){var symbols=Object.getOwnPropertySymbols(object);enumerableOnly&&(symbols=symbols.filter(function(sym){return Object.getOwnPropertyDescriptor(object,sym).enumerable;})),keys.push.apply(keys,symbols);}return keys;}function _objectSpread(target){for(var i=1;i<arguments.length;i++){var source=null!=arguments[i]?arguments[i]:{};i%2?ownKeys(Object(source),!0).forEach(function(key){_defineProperty(target,key,source[key]);}):Object.getOwnPropertyDescriptors?Object.defineProperties(target,Object.getOwnPropertyDescriptors(source)):ownKeys(Object(source)).forEach(function(key){Object.defineProperty(target,key,Object.getOwnPropertyDescriptor(source,key));});}return target;}function _defineProperty(obj,key,value){key=_toPropertyKey(key);if(key in obj){Object.defineProperty(obj,key,{value:value,enumerable:true,configurable:true,writable:true});}else{obj[key]=value;}return obj;}function _toPropertyKey(arg){var key=_toPrimitive(arg,"string");return typeof key==="symbol"?key:String(key);}function _toPrimitive(input,hint){if(typeof input!=="object"||input===null)return input;var prim=input[Symbol.toPrimitive];if(prim!==undefined){var res=prim.call(input,hint||"default");if(typeof res!=="object")return res;throw new TypeError("@@toPrimitive must return a primitive value.");}return(hint==="string"?String:Number)(input);}const _require=require('buffer'),Buffer=_require.Buffer;const _require2=require('util'),inspect=_require2.inspect;const custom=inspect&&inspect.custom||'inspect';function copyBuffer(src,target,offset){Buffer.prototype.copy.call(src,target,offset);}module.exports=class BufferList{constructor(){this.head=null;this.tail=null;this.length=0;}push(v){const entry={data:v,next:null};if(this.length>0)this.tail.next=entry;else this.head=entry;this.tail=entry;++this.length;}unshift(v){const entry={data:v,next:this.head};if(this.length===0)this.tail=entry;this.head=entry;++this.length;}shift(){if(this.length===0)return;const ret=this.head.data;if(this.length===1)this.head=this.tail=null;else this.head=this.head.next;--this.length;return ret;}clear(){this.head=this.tail=null;this.length=0;}join(s){if(this.length===0)return'';var p=this.head;var ret=''+p.data;while(p=p.next)ret+=s+p.data;return ret;}concat(n){if(this.length===0)return Buffer.alloc(0);const ret=Buffer.allocUnsafe(n>>>0);var p=this.head;var i=0;while(p){copyBuffer(p.data,ret,i);i+=p.data.length;p=p.next;}return ret;}// Consumes a specified amount of bytes or characters from the buffered data.
consume(n,hasStrings){var ret;if(n<this.head.data.length){// `slice` is the same for buffers and strings.
ret=this.head.data.slice(0,n);this.head.data=this.head.data.slice(n);}else if(n===this.head.data.length){// First chunk is a perfect match.
ret=this.shift();}else{// Result spans more than one buffer.
ret=hasStrings?this._getString(n):this._getBuffer(n);}return ret;}first(){return this.head.data;}// Consumes a specified amount of characters from the buffered data.
_getString(n){var p=this.head;var c=1;var ret=p.data;n-=ret.length;while(p=p.next){const str=p.data;const nb=n>str.length?str.length:n;if(nb===str.length)ret+=str;else ret+=str.slice(0,n);n-=nb;if(n===0){if(nb===str.length){++c;if(p.next)this.head=p.next;else this.head=this.tail=null;}else{this.head=p;p.data=str.slice(nb);}break;}++c;}this.length-=c;return ret;}// Consumes a specified amount of bytes from the buffered data.
_getBuffer(n){const ret=Buffer.allocUnsafe(n);var p=this.head;var c=1;p.data.copy(ret);n-=p.data.length;while(p=p.next){const buf=p.data;const nb=n>buf.length?buf.length:n;buf.copy(ret,ret.length-n,0,nb);n-=nb;if(n===0){if(nb===buf.length){++c;if(p.next)this.head=p.next;else this.head=this.tail=null;}else{this.head=p;p.data=buf.slice(nb);}break;}++c;}this.length-=c;return ret;}// Make sure the linked list only shows the minimal necessary information.
[custom](_,options){return inspect(this,_objectSpread(_objectSpread({},options),{},{// Only inspect one level.
depth:0,// It should not recurse.
customInspect:false}));}};},{"buffer":22,"util":20}],138:[function(require,module,exports){(function(process){(function(){'use strict';// undocumented cb() API, needed for core, not for public API
function destroy(err,cb){const readableDestroyed=this._readableState&&this._readableState.destroyed;const writableDestroyed=this._writableState&&this._writableState.destroyed;if(readableDestroyed||writableDestroyed){if(cb){cb(err);}else if(err){if(!this._writableState){process.nextTick(emitErrorNT,this,err);}else if(!this._writableState.errorEmitted){this._writableState.errorEmitted=true;process.nextTick(emitErrorNT,this,err);}}return this;}// we set destroyed to true before firing error callbacks in order
// to make it re-entrance safe in case destroy() is called within callbacks
if(this._readableState){this._readableState.destroyed=true;}// if this is a duplex stream mark the writable part as destroyed as well
if(this._writableState){this._writableState.destroyed=true;}this._destroy(err||null,err=>{if(!cb&&err){if(!this._writableState){process.nextTick(emitErrorAndCloseNT,this,err);}else if(!this._writableState.errorEmitted){this._writableState.errorEmitted=true;process.nextTick(emitErrorAndCloseNT,this,err);}else{process.nextTick(emitCloseNT,this);}}else if(cb){process.nextTick(emitCloseNT,this);cb(err);}else{process.nextTick(emitCloseNT,this);}});return this;}function emitErrorAndCloseNT(self,err){emitErrorNT(self,err);emitCloseNT(self);}function emitCloseNT(self){if(self._writableState&&!self._writableState.emitClose)return;if(self._readableState&&!self._readableState.emitClose)return;self.emit('close');}function undestroy(){if(this._readableState){this._readableState.destroyed=false;this._readableState.reading=false;this._readableState.ended=false;this._readableState.endEmitted=false;}if(this._writableState){this._writableState.destroyed=false;this._writableState.ended=false;this._writableState.ending=false;this._writableState.finalCalled=false;this._writableState.prefinished=false;this._writableState.finished=false;this._writableState.errorEmitted=false;}}function emitErrorNT(self,err){self.emit('error',err);}function errorOrDestroy(stream,err){// We have tests that rely on errors being emitted
// in the same tick, so changing this is semver major.
// For now when you opt-in to autoDestroy we allow
// the error to be emitted nextTick. In a future
// semver major update we should change the default to this.
const rState=stream._readableState;const wState=stream._writableState;if(rState&&rState.autoDestroy||wState&&wState.autoDestroy)stream.destroy(err);else stream.emit('error',err);}module.exports={destroy,undestroy,errorOrDestroy};}).call(this);}).call(this,require('_process'));},{"_process":121}],139:[function(require,module,exports){// Ported from https://github.com/mafintosh/end-of-stream with
// permission from the author, Mathias Buus (@mafintosh).
'use strict';const ERR_STREAM_PREMATURE_CLOSE=require('../../../errors').codes.ERR_STREAM_PREMATURE_CLOSE;function once(callback){let called=false;return function(){if(called)return;called=true;for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}callback.apply(this,args);};}function noop(){}function isRequest(stream){return stream.setHeader&&typeof stream.abort==='function';}function eos(stream,opts,callback){if(typeof opts==='function')return eos(stream,null,opts);if(!opts)opts={};callback=once(callback||noop);let readable=opts.readable||opts.readable!==false&&stream.readable;let writable=opts.writable||opts.writable!==false&&stream.writable;const onlegacyfinish=()=>{if(!stream.writable)onfinish();};var writableEnded=stream._writableState&&stream._writableState.finished;const onfinish=()=>{writable=false;writableEnded=true;if(!readable)callback.call(stream);};var readableEnded=stream._readableState&&stream._readableState.endEmitted;const onend=()=>{readable=false;readableEnded=true;if(!writable)callback.call(stream);};const onerror=err=>{callback.call(stream,err);};const onclose=()=>{let err;if(readable&&!readableEnded){if(!stream._readableState||!stream._readableState.ended)err=new ERR_STREAM_PREMATURE_CLOSE();return callback.call(stream,err);}if(writable&&!writableEnded){if(!stream._writableState||!stream._writableState.ended)err=new ERR_STREAM_PREMATURE_CLOSE();return callback.call(stream,err);}};const onrequest=()=>{stream.req.on('finish',onfinish);};if(isRequest(stream)){stream.on('complete',onfinish);stream.on('abort',onclose);if(stream.req)onrequest();else stream.on('request',onrequest);}else if(writable&&!stream._writableState){// legacy streams
stream.on('end',onlegacyfinish);stream.on('close',onlegacyfinish);}stream.on('end',onend);stream.on('finish',onfinish);if(opts.error!==false)stream.on('error',onerror);stream.on('close',onclose);return function(){stream.removeListener('complete',onfinish);stream.removeListener('abort',onclose);stream.removeListener('request',onrequest);if(stream.req)stream.req.removeListener('finish',onfinish);stream.removeListener('end',onlegacyfinish);stream.removeListener('close',onlegacyfinish);stream.removeListener('finish',onfinish);stream.removeListener('end',onend);stream.removeListener('error',onerror);stream.removeListener('close',onclose);};}module.exports=eos;},{"../../../errors":130}],140:[function(require,module,exports){module.exports=function(){throw new Error('Readable.from is not available in the browser');};},{}],141:[function(require,module,exports){// Ported from https://github.com/mafintosh/pump with
// permission from the author, Mathias Buus (@mafintosh).
'use strict';let eos;function once(callback){let called=false;return function(){if(called)return;called=true;callback(...arguments);};}const _require$codes=require('../../../errors').codes,ERR_MISSING_ARGS=_require$codes.ERR_MISSING_ARGS,ERR_STREAM_DESTROYED=_require$codes.ERR_STREAM_DESTROYED;function noop(err){// Rethrow the error if it exists to avoid swallowing it
if(err)throw err;}function isRequest(stream){return stream.setHeader&&typeof stream.abort==='function';}function destroyer(stream,reading,writing,callback){callback=once(callback);let closed=false;stream.on('close',()=>{closed=true;});if(eos===undefined)eos=require('./end-of-stream');eos(stream,{readable:reading,writable:writing},err=>{if(err)return callback(err);closed=true;callback();});let destroyed=false;return err=>{if(closed)return;if(destroyed)return;destroyed=true;// request.destroy just do .end - .abort is what we want
if(isRequest(stream))return stream.abort();if(typeof stream.destroy==='function')return stream.destroy();callback(err||new ERR_STREAM_DESTROYED('pipe'));};}function call(fn){fn();}function pipe(from,to){return from.pipe(to);}function popCallback(streams){if(!streams.length)return noop;if(typeof streams[streams.length-1]!=='function')return noop;return streams.pop();}function pipeline(){for(var _len=arguments.length,streams=new Array(_len),_key=0;_key<_len;_key++){streams[_key]=arguments[_key];}const callback=popCallback(streams);if(Array.isArray(streams[0]))streams=streams[0];if(streams.length<2){throw new ERR_MISSING_ARGS('streams');}let error;const destroys=streams.map(function(stream,i){const reading=i<streams.length-1;const writing=i>0;return destroyer(stream,reading,writing,function(err){if(!error)error=err;if(err)destroys.forEach(call);if(reading)return;destroys.forEach(call);callback(error);});});return streams.reduce(pipe);}module.exports=pipeline;},{"../../../errors":130,"./end-of-stream":139}],142:[function(require,module,exports){'use strict';const ERR_INVALID_OPT_VALUE=require('../../../errors').codes.ERR_INVALID_OPT_VALUE;function highWaterMarkFrom(options,isDuplex,duplexKey){return options.highWaterMark!=null?options.highWaterMark:isDuplex?options[duplexKey]:null;}function getHighWaterMark(state,options,duplexKey,isDuplex){const hwm=highWaterMarkFrom(options,isDuplex,duplexKey);if(hwm!=null){if(!(isFinite(hwm)&&Math.floor(hwm)===hwm)||hwm<0){const name=isDuplex?duplexKey:'highWaterMark';throw new ERR_INVALID_OPT_VALUE(name,hwm);}return Math.floor(hwm);}// Default value
return state.objectMode?16:16*1024;}module.exports={getHighWaterMark};},{"../../../errors":130}],143:[function(require,module,exports){module.exports=require('events').EventEmitter;},{"events":26}],144:[function(require,module,exports){(function(global){(function(){var ClientRequest=require('./lib/request');var response=require('./lib/response');var extend=require('xtend');var statusCodes=require('builtin-status-codes');var url=require('url');var http=exports;http.request=function(opts,cb){if(typeof opts==='string')opts=url.parse(opts);else opts=extend(opts);// Normally, the page is loaded from http or https, so not specifying a protocol
// will result in a (valid) protocol-relative url. However, this won't work if
// the protocol is something else, like 'file:'
var defaultProtocol=global.location.protocol.search(/^https?:$/)===-1?'http:':'';var protocol=opts.protocol||defaultProtocol;var host=opts.hostname||opts.host;var port=opts.port;var path=opts.path||'/';// Necessary for IPv6 addresses
if(host&&host.indexOf(':')!==-1)host='['+host+']';// This may be a relative url. The browser should always be able to interpret it correctly.
opts.url=(host?protocol+'//'+host:'')+(port?':'+port:'')+path;opts.method=(opts.method||'GET').toUpperCase();opts.headers=opts.headers||{};// Also valid opts.auth, opts.mode
var req=new ClientRequest(opts);if(cb)req.on('response',cb);return req;};http.get=function get(opts,cb){var req=http.request(opts,cb);req.end();return req;};http.ClientRequest=ClientRequest;http.IncomingMessage=response.IncomingMessage;http.Agent=function(){};http.Agent.defaultMaxSockets=4;http.globalAgent=new http.Agent();http.STATUS_CODES=statusCodes;http.METHODS=['CHECKOUT','CONNECT','COPY','DELETE','GET','HEAD','LOCK','M-SEARCH','MERGE','MKACTIVITY','MKCOL','MOVE','NOTIFY','OPTIONS','PATCH','POST','PROPFIND','PROPPATCH','PURGE','PUT','REPORT','SEARCH','SUBSCRIBE','TRACE','UNLOCK','UNSUBSCRIBE'];}).call(this);}).call(this,typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{});},{"./lib/request":146,"./lib/response":147,"builtin-status-codes":23,"url":166,"xtend":174}],145:[function(require,module,exports){(function(global){(function(){exports.fetch=isFunction(global.fetch)&&isFunction(global.ReadableStream);exports.writableStream=isFunction(global.WritableStream);exports.abortController=isFunction(global.AbortController);// The xhr request to example.com may violate some restrictive CSP configurations,
// so if we're running in a browser that supports `fetch`, avoid calling getXHR()
// and assume support for certain features below.
var xhr;function getXHR(){// Cache the xhr value
if(xhr!==undefined)return xhr;if(global.XMLHttpRequest){xhr=new global.XMLHttpRequest();// If XDomainRequest is available (ie only, where xhr might not work
// cross domain), use the page location. Otherwise use example.com
// Note: this doesn't actually make an http request.
try{xhr.open('GET',global.XDomainRequest?'/':'https://example.com');}catch(e){xhr=null;}}else{// Service workers don't have XHR
xhr=null;}return xhr;}function checkTypeSupport(type){var xhr=getXHR();if(!xhr)return false;try{xhr.responseType=type;return xhr.responseType===type;}catch(e){}return false;}// If fetch is supported, then arraybuffer will be supported too. Skip calling
// checkTypeSupport(), since that calls getXHR().
exports.arraybuffer=exports.fetch||checkTypeSupport('arraybuffer');// These next two tests unavoidably show warnings in Chrome. Since fetch will always
// be used if it's available, just return false for these to avoid the warnings.
exports.msstream=!exports.fetch&&checkTypeSupport('ms-stream');exports.mozchunkedarraybuffer=!exports.fetch&&checkTypeSupport('moz-chunked-arraybuffer');// If fetch is supported, then overrideMimeType will be supported too. Skip calling
// getXHR().
exports.overrideMimeType=exports.fetch||(getXHR()?isFunction(getXHR().overrideMimeType):false);function isFunction(value){return typeof value==='function';}xhr=null;// Help gc
}).call(this);}).call(this,typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{});},{}],146:[function(require,module,exports){(function(process,global,Buffer){(function(){var capability=require('./capability');var inherits=require('inherits');var response=require('./response');var stream=require('readable-stream');var IncomingMessage=response.IncomingMessage;var rStates=response.readyStates;function decideMode(preferBinary,useFetch){if(capability.fetch&&useFetch){return'fetch';}else if(capability.mozchunkedarraybuffer){return'moz-chunked-arraybuffer';}else if(capability.msstream){return'ms-stream';}else if(capability.arraybuffer&&preferBinary){return'arraybuffer';}else{return'text';}}var ClientRequest=module.exports=function(opts){var self=this;stream.Writable.call(self);self._opts=opts;self._body=[];self._headers={};if(opts.auth)self.setHeader('Authorization','Basic '+Buffer.from(opts.auth).toString('base64'));Object.keys(opts.headers).forEach(function(name){self.setHeader(name,opts.headers[name]);});var preferBinary;var useFetch=true;if(opts.mode==='disable-fetch'||'requestTimeout'in opts&&!capability.abortController){// If the use of XHR should be preferred. Not typically needed.
useFetch=false;preferBinary=true;}else if(opts.mode==='prefer-streaming'){// If streaming is a high priority but binary compatibility and
// the accuracy of the 'content-type' header aren't
preferBinary=false;}else if(opts.mode==='allow-wrong-content-type'){// If streaming is more important than preserving the 'content-type' header
preferBinary=!capability.overrideMimeType;}else if(!opts.mode||opts.mode==='default'||opts.mode==='prefer-fast'){// Use binary if text streaming may corrupt data or the content-type header, or for speed
preferBinary=true;}else{throw new Error('Invalid value for opts.mode');}self._mode=decideMode(preferBinary,useFetch);self._fetchTimer=null;self._socketTimeout=null;self._socketTimer=null;self.on('finish',function(){self._onFinish();});};inherits(ClientRequest,stream.Writable);ClientRequest.prototype.setHeader=function(name,value){var self=this;var lowerName=name.toLowerCase();// This check is not necessary, but it prevents warnings from browsers about setting unsafe
// headers. To be honest I'm not entirely sure hiding these warnings is a good thing, but
// http-browserify did it, so I will too.
if(unsafeHeaders.indexOf(lowerName)!==-1)return;self._headers[lowerName]={name:name,value:value};};ClientRequest.prototype.getHeader=function(name){var header=this._headers[name.toLowerCase()];if(header)return header.value;return null;};ClientRequest.prototype.removeHeader=function(name){var self=this;delete self._headers[name.toLowerCase()];};ClientRequest.prototype._onFinish=function(){var self=this;if(self._destroyed)return;var opts=self._opts;if('timeout'in opts&&opts.timeout!==0){self.setTimeout(opts.timeout);}var headersObj=self._headers;var body=null;if(opts.method!=='GET'&&opts.method!=='HEAD'){body=new Blob(self._body,{type:(headersObj['content-type']||{}).value||''});}// create flattened list of headers
var headersList=[];Object.keys(headersObj).forEach(function(keyName){var name=headersObj[keyName].name;var value=headersObj[keyName].value;if(Array.isArray(value)){value.forEach(function(v){headersList.push([name,v]);});}else{headersList.push([name,value]);}});if(self._mode==='fetch'){var signal=null;if(capability.abortController){var controller=new AbortController();signal=controller.signal;self._fetchAbortController=controller;if('requestTimeout'in opts&&opts.requestTimeout!==0){self._fetchTimer=global.setTimeout(function(){self.emit('requestTimeout');if(self._fetchAbortController)self._fetchAbortController.abort();},opts.requestTimeout);}}global.fetch(self._opts.url,{method:self._opts.method,headers:headersList,body:body||undefined,mode:'cors',credentials:opts.withCredentials?'include':'same-origin',signal:signal}).then(function(response){self._fetchResponse=response;self._resetTimers(false);self._connect();},function(reason){self._resetTimers(true);if(!self._destroyed)self.emit('error',reason);});}else{var xhr=self._xhr=new global.XMLHttpRequest();try{xhr.open(self._opts.method,self._opts.url,true);}catch(err){process.nextTick(function(){self.emit('error',err);});return;}// Can't set responseType on really old browsers
if('responseType'in xhr)xhr.responseType=self._mode;if('withCredentials'in xhr)xhr.withCredentials=!!opts.withCredentials;if(self._mode==='text'&&'overrideMimeType'in xhr)xhr.overrideMimeType('text/plain; charset=x-user-defined');if('requestTimeout'in opts){xhr.timeout=opts.requestTimeout;xhr.ontimeout=function(){self.emit('requestTimeout');};}headersList.forEach(function(header){xhr.setRequestHeader(header[0],header[1]);});self._response=null;xhr.onreadystatechange=function(){switch(xhr.readyState){case rStates.LOADING:case rStates.DONE:self._onXHRProgress();break;}};// Necessary for streaming in Firefox, since xhr.response is ONLY defined
// in onprogress, not in onreadystatechange with xhr.readyState = 3
if(self._mode==='moz-chunked-arraybuffer'){xhr.onprogress=function(){self._onXHRProgress();};}xhr.onerror=function(){if(self._destroyed)return;self._resetTimers(true);self.emit('error',new Error('XHR error'));};try{xhr.send(body);}catch(err){process.nextTick(function(){self.emit('error',err);});return;}}};/**
 * Checks if xhr.status is readable and non-zero, indicating no error.
 * Even though the spec says it should be available in readyState 3,
 * accessing it throws an exception in IE8
 */function statusValid(xhr){try{var status=xhr.status;return status!==null&&status!==0;}catch(e){return false;}}ClientRequest.prototype._onXHRProgress=function(){var self=this;self._resetTimers(false);if(!statusValid(self._xhr)||self._destroyed)return;if(!self._response)self._connect();self._response._onXHRProgress(self._resetTimers.bind(self));};ClientRequest.prototype._connect=function(){var self=this;if(self._destroyed)return;self._response=new IncomingMessage(self._xhr,self._fetchResponse,self._mode,self._resetTimers.bind(self));self._response.on('error',function(err){self.emit('error',err);});self.emit('response',self._response);};ClientRequest.prototype._write=function(chunk,encoding,cb){var self=this;self._body.push(chunk);cb();};ClientRequest.prototype._resetTimers=function(done){var self=this;global.clearTimeout(self._socketTimer);self._socketTimer=null;if(done){global.clearTimeout(self._fetchTimer);self._fetchTimer=null;}else if(self._socketTimeout){self._socketTimer=global.setTimeout(function(){self.emit('timeout');},self._socketTimeout);}};ClientRequest.prototype.abort=ClientRequest.prototype.destroy=function(err){var self=this;self._destroyed=true;self._resetTimers(true);if(self._response)self._response._destroyed=true;if(self._xhr)self._xhr.abort();else if(self._fetchAbortController)self._fetchAbortController.abort();if(err)self.emit('error',err);};ClientRequest.prototype.end=function(data,encoding,cb){var self=this;if(typeof data==='function'){cb=data;data=undefined;}stream.Writable.prototype.end.call(self,data,encoding,cb);};ClientRequest.prototype.setTimeout=function(timeout,cb){var self=this;if(cb)self.once('timeout',cb);self._socketTimeout=timeout;self._resetTimers(false);};ClientRequest.prototype.flushHeaders=function(){};ClientRequest.prototype.setNoDelay=function(){};ClientRequest.prototype.setSocketKeepAlive=function(){};// Taken from http://www.w3.org/TR/XMLHttpRequest/#the-setrequestheader%28%29-method
var unsafeHeaders=['accept-charset','accept-encoding','access-control-request-headers','access-control-request-method','connection','content-length','cookie','cookie2','date','dnt','expect','host','keep-alive','origin','referer','te','trailer','transfer-encoding','upgrade','via'];}).call(this);}).call(this,require('_process'),typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{},require("buffer").Buffer);},{"./capability":145,"./response":147,"_process":121,"buffer":22,"inherits":47,"readable-stream":162}],147:[function(require,module,exports){(function(process,global,Buffer){(function(){var capability=require('./capability');var inherits=require('inherits');var stream=require('readable-stream');var rStates=exports.readyStates={UNSENT:0,OPENED:1,HEADERS_RECEIVED:2,LOADING:3,DONE:4};var IncomingMessage=exports.IncomingMessage=function(xhr,response,mode,resetTimers){var self=this;stream.Readable.call(self);self._mode=mode;self.headers={};self.rawHeaders=[];self.trailers={};self.rawTrailers=[];// Fake the 'close' event, but only once 'end' fires
self.on('end',function(){// The nextTick is necessary to prevent the 'request' module from causing an infinite loop
process.nextTick(function(){self.emit('close');});});if(mode==='fetch'){self._fetchResponse=response;self.url=response.url;self.statusCode=response.status;self.statusMessage=response.statusText;response.headers.forEach(function(header,key){self.headers[key.toLowerCase()]=header;self.rawHeaders.push(key,header);});if(capability.writableStream){var writable=new WritableStream({write:function(chunk){resetTimers(false);return new Promise(function(resolve,reject){if(self._destroyed){reject();}else if(self.push(Buffer.from(chunk))){resolve();}else{self._resumeFetch=resolve;}});},close:function(){resetTimers(true);if(!self._destroyed)self.push(null);},abort:function(err){resetTimers(true);if(!self._destroyed)self.emit('error',err);}});try{response.body.pipeTo(writable).catch(function(err){resetTimers(true);if(!self._destroyed)self.emit('error',err);});return;}catch(e){}// pipeTo method isn't defined. Can't find a better way to feature test this
}// fallback for when writableStream or pipeTo aren't available
var reader=response.body.getReader();function read(){reader.read().then(function(result){if(self._destroyed)return;resetTimers(result.done);if(result.done){self.push(null);return;}self.push(Buffer.from(result.value));read();}).catch(function(err){resetTimers(true);if(!self._destroyed)self.emit('error',err);});}read();}else{self._xhr=xhr;self._pos=0;self.url=xhr.responseURL;self.statusCode=xhr.status;self.statusMessage=xhr.statusText;var headers=xhr.getAllResponseHeaders().split(/\r?\n/);headers.forEach(function(header){var matches=header.match(/^([^:]+):\s*(.*)/);if(matches){var key=matches[1].toLowerCase();if(key==='set-cookie'){if(self.headers[key]===undefined){self.headers[key]=[];}self.headers[key].push(matches[2]);}else if(self.headers[key]!==undefined){self.headers[key]+=', '+matches[2];}else{self.headers[key]=matches[2];}self.rawHeaders.push(matches[1],matches[2]);}});self._charset='x-user-defined';if(!capability.overrideMimeType){var mimeType=self.rawHeaders['mime-type'];if(mimeType){var charsetMatch=mimeType.match(/;\s*charset=([^;])(;|$)/);if(charsetMatch){self._charset=charsetMatch[1].toLowerCase();}}if(!self._charset)self._charset='utf-8';// best guess
}}};inherits(IncomingMessage,stream.Readable);IncomingMessage.prototype._read=function(){var self=this;var resolve=self._resumeFetch;if(resolve){self._resumeFetch=null;resolve();}};IncomingMessage.prototype._onXHRProgress=function(resetTimers){var self=this;var xhr=self._xhr;var response=null;switch(self._mode){case'text':response=xhr.responseText;if(response.length>self._pos){var newData=response.substr(self._pos);if(self._charset==='x-user-defined'){var buffer=Buffer.alloc(newData.length);for(var i=0;i<newData.length;i++)buffer[i]=newData.charCodeAt(i)&0xff;self.push(buffer);}else{self.push(newData,self._charset);}self._pos=response.length;}break;case'arraybuffer':if(xhr.readyState!==rStates.DONE||!xhr.response)break;response=xhr.response;self.push(Buffer.from(new Uint8Array(response)));break;case'moz-chunked-arraybuffer':// take whole
response=xhr.response;if(xhr.readyState!==rStates.LOADING||!response)break;self.push(Buffer.from(new Uint8Array(response)));break;case'ms-stream':response=xhr.response;if(xhr.readyState!==rStates.LOADING)break;var reader=new global.MSStreamReader();reader.onprogress=function(){if(reader.result.byteLength>self._pos){self.push(Buffer.from(new Uint8Array(reader.result.slice(self._pos))));self._pos=reader.result.byteLength;}};reader.onload=function(){resetTimers(true);self.push(null);};// reader.onerror = ??? // TODO: this
reader.readAsArrayBuffer(response);break;}// The ms-stream case handles end separately in reader.onload()
if(self._xhr.readyState===rStates.DONE&&self._mode!=='ms-stream'){resetTimers(true);self.push(null);}};}).call(this);}).call(this,require('_process'),typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{},require("buffer").Buffer);},{"./capability":145,"_process":121,"buffer":22,"inherits":47,"readable-stream":162}],148:[function(require,module,exports){arguments[4][130][0].apply(exports,arguments);},{"dup":130}],149:[function(require,module,exports){(function(process){(function(){// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.
'use strict';/*<replacement>*/var objectKeys=Object.keys||function(obj){var keys=[];for(var key in obj)keys.push(key);return keys;};/*</replacement>*/module.exports=Duplex;const Readable=require('./_stream_readable');const Writable=require('./_stream_writable');require('inherits')(Duplex,Readable);{// Allow the keys array to be GC'ed.
const keys=objectKeys(Writable.prototype);for(var v=0;v<keys.length;v++){const method=keys[v];if(!Duplex.prototype[method])Duplex.prototype[method]=Writable.prototype[method];}}function Duplex(options){if(!(this instanceof Duplex))return new Duplex(options);Readable.call(this,options);Writable.call(this,options);this.allowHalfOpen=true;if(options){if(options.readable===false)this.readable=false;if(options.writable===false)this.writable=false;if(options.allowHalfOpen===false){this.allowHalfOpen=false;this.once('end',onend);}}}Object.defineProperty(Duplex.prototype,'writableHighWaterMark',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get(){return this._writableState.highWaterMark;}});Object.defineProperty(Duplex.prototype,'writableBuffer',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get:function get(){return this._writableState&&this._writableState.getBuffer();}});Object.defineProperty(Duplex.prototype,'writableLength',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get(){return this._writableState.length;}});// the no-half-open enforcer
function onend(){// If the writable side ended, then we're ok.
if(this._writableState.ended)return;// no more data can be written.
// But allow more writes to happen in this tick.
process.nextTick(onEndNT,this);}function onEndNT(self){self.end();}Object.defineProperty(Duplex.prototype,'destroyed',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get(){if(this._readableState===undefined||this._writableState===undefined){return false;}return this._readableState.destroyed&&this._writableState.destroyed;},set(value){// we ignore the value if the stream
// has not been initialized yet
if(this._readableState===undefined||this._writableState===undefined){return;}// backward compatibility, the user is explicitly
// managing destroyed
this._readableState.destroyed=value;this._writableState.destroyed=value;}});}).call(this);}).call(this,require('_process'));},{"./_stream_readable":151,"./_stream_writable":153,"_process":121,"inherits":47}],150:[function(require,module,exports){arguments[4][132][0].apply(exports,arguments);},{"./_stream_transform":152,"dup":132,"inherits":47}],151:[function(require,module,exports){(function(process,global){(function(){// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
'use strict';module.exports=Readable;/*<replacement>*/var Duplex;/*</replacement>*/Readable.ReadableState=ReadableState;/*<replacement>*/const EE=require('events').EventEmitter;var EElistenerCount=function EElistenerCount(emitter,type){return emitter.listeners(type).length;};/*</replacement>*/ /*<replacement>*/var Stream=require('./internal/streams/stream');/*</replacement>*/const Buffer=require('buffer').Buffer;const OurUint8Array=(typeof global!=='undefined'?global:typeof window!=='undefined'?window:typeof self!=='undefined'?self:{}).Uint8Array||function(){};function _uint8ArrayToBuffer(chunk){return Buffer.from(chunk);}function _isUint8Array(obj){return Buffer.isBuffer(obj)||obj instanceof OurUint8Array;}/*<replacement>*/const debugUtil=require('util');let debug;if(debugUtil&&debugUtil.debuglog){debug=debugUtil.debuglog('stream');}else{debug=function debug(){};}/*</replacement>*/const BufferList=require('./internal/streams/buffer_list');const destroyImpl=require('./internal/streams/destroy');const _require=require('./internal/streams/state'),getHighWaterMark=_require.getHighWaterMark;const _require$codes=require('../errors').codes,ERR_INVALID_ARG_TYPE=_require$codes.ERR_INVALID_ARG_TYPE,ERR_STREAM_PUSH_AFTER_EOF=_require$codes.ERR_STREAM_PUSH_AFTER_EOF,ERR_METHOD_NOT_IMPLEMENTED=_require$codes.ERR_METHOD_NOT_IMPLEMENTED,ERR_STREAM_UNSHIFT_AFTER_END_EVENT=_require$codes.ERR_STREAM_UNSHIFT_AFTER_END_EVENT;// Lazy loaded to improve the startup performance.
let StringDecoder;let createReadableStreamAsyncIterator;let from;require('inherits')(Readable,Stream);const errorOrDestroy=destroyImpl.errorOrDestroy;const kProxyEvents=['error','close','destroy','pause','resume'];function prependListener(emitter,event,fn){// Sadly this is not cacheable as some libraries bundle their own
// event emitter implementation with them.
if(typeof emitter.prependListener==='function')return emitter.prependListener(event,fn);// This is a hack to make sure that our error handler is attached before any
// userland ones.  NEVER DO THIS. This is here only because this code needs
// to continue to work with older versions of Node.js that do not include
// the prependListener() method. The goal is to eventually remove this hack.
if(!emitter._events||!emitter._events[event])emitter.on(event,fn);else if(Array.isArray(emitter._events[event]))emitter._events[event].unshift(fn);else emitter._events[event]=[fn,emitter._events[event]];}function ReadableState(options,stream,isDuplex){Duplex=Duplex||require('./_stream_duplex');options=options||{};// Duplex streams are both readable and writable, but share
// the same options object.
// However, some cases require setting options to different
// values for the readable and the writable sides of the duplex stream.
// These options can be provided separately as readableXXX and writableXXX.
if(typeof isDuplex!=='boolean')isDuplex=stream instanceof Duplex;// object stream flag. Used to make read(n) ignore n and to
// make all the buffer merging and length checks go away
this.objectMode=!!options.objectMode;if(isDuplex)this.objectMode=this.objectMode||!!options.readableObjectMode;// the point at which it stops calling _read() to fill the buffer
// Note: 0 is a valid value, means "don't call _read preemptively ever"
this.highWaterMark=getHighWaterMark(this,options,'readableHighWaterMark',isDuplex);// A linked list is used to store data chunks instead of an array because the
// linked list can remove elements from the beginning faster than
// array.shift()
this.buffer=new BufferList();this.length=0;this.pipes=null;this.pipesCount=0;this.flowing=null;this.ended=false;this.endEmitted=false;this.reading=false;// a flag to be able to tell if the event 'readable'/'data' is emitted
// immediately, or on a later tick.  We set this to true at first, because
// any actions that shouldn't happen until "later" should generally also
// not happen before the first read call.
this.sync=true;// whenever we return null, then we set a flag to say
// that we're awaiting a 'readable' event emission.
this.needReadable=false;this.emittedReadable=false;this.readableListening=false;this.resumeScheduled=false;this.paused=true;// Should close be emitted on destroy. Defaults to true.
this.emitClose=options.emitClose!==false;// Should .destroy() be called after 'end' (and potentially 'finish')
this.autoDestroy=!!options.autoDestroy;// has it been destroyed
this.destroyed=false;// Crypto is kind of old and crusty.  Historically, its default string
// encoding is 'binary' so we have to make this configurable.
// Everything else in the universe uses 'utf8', though.
this.defaultEncoding=options.defaultEncoding||'utf8';// the number of writers that are awaiting a drain event in .pipe()s
this.awaitDrain=0;// if true, a maybeReadMore has been scheduled
this.readingMore=false;this.decoder=null;this.encoding=null;if(options.encoding){if(!StringDecoder)StringDecoder=require('string_decoder/').StringDecoder;this.decoder=new StringDecoder(options.encoding);this.encoding=options.encoding;}}function Readable(options){Duplex=Duplex||require('./_stream_duplex');if(!(this instanceof Readable))return new Readable(options);// Checking for a Stream.Duplex instance is faster here instead of inside
// the ReadableState constructor, at least with V8 6.5
const isDuplex=this instanceof Duplex;this._readableState=new ReadableState(options,this,isDuplex);// legacy
this.readable=true;if(options){if(typeof options.read==='function')this._read=options.read;if(typeof options.destroy==='function')this._destroy=options.destroy;}Stream.call(this);}Object.defineProperty(Readable.prototype,'destroyed',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get(){if(this._readableState===undefined){return false;}return this._readableState.destroyed;},set(value){// we ignore the value if the stream
// has not been initialized yet
if(!this._readableState){return;}// backward compatibility, the user is explicitly
// managing destroyed
this._readableState.destroyed=value;}});Readable.prototype.destroy=destroyImpl.destroy;Readable.prototype._undestroy=destroyImpl.undestroy;Readable.prototype._destroy=function(err,cb){cb(err);};// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push=function(chunk,encoding){var state=this._readableState;var skipChunkCheck;if(!state.objectMode){if(typeof chunk==='string'){encoding=encoding||state.defaultEncoding;if(encoding!==state.encoding){chunk=Buffer.from(chunk,encoding);encoding='';}skipChunkCheck=true;}}else{skipChunkCheck=true;}return readableAddChunk(this,chunk,encoding,false,skipChunkCheck);};// Unshift should *always* be something directly out of read()
Readable.prototype.unshift=function(chunk){return readableAddChunk(this,chunk,null,true,false);};function readableAddChunk(stream,chunk,encoding,addToFront,skipChunkCheck){debug('readableAddChunk',chunk);var state=stream._readableState;if(chunk===null){state.reading=false;onEofChunk(stream,state);}else{var er;if(!skipChunkCheck)er=chunkInvalid(state,chunk);if(er){errorOrDestroy(stream,er);}else if(state.objectMode||chunk&&chunk.length>0){if(typeof chunk!=='string'&&!state.objectMode&&Object.getPrototypeOf(chunk)!==Buffer.prototype){chunk=_uint8ArrayToBuffer(chunk);}if(addToFront){if(state.endEmitted)errorOrDestroy(stream,new ERR_STREAM_UNSHIFT_AFTER_END_EVENT());else addChunk(stream,state,chunk,true);}else if(state.ended){errorOrDestroy(stream,new ERR_STREAM_PUSH_AFTER_EOF());}else if(state.destroyed){return false;}else{state.reading=false;if(state.decoder&&!encoding){chunk=state.decoder.write(chunk);if(state.objectMode||chunk.length!==0)addChunk(stream,state,chunk,false);else maybeReadMore(stream,state);}else{addChunk(stream,state,chunk,false);}}}else if(!addToFront){state.reading=false;maybeReadMore(stream,state);}}// We can push more data if we are below the highWaterMark.
// Also, if we have no data yet, we can stand some more bytes.
// This is to work around cases where hwm=0, such as the repl.
return!state.ended&&(state.length<state.highWaterMark||state.length===0);}function addChunk(stream,state,chunk,addToFront){if(state.flowing&&state.length===0&&!state.sync){state.awaitDrain=0;stream.emit('data',chunk);}else{// update the buffer info.
state.length+=state.objectMode?1:chunk.length;if(addToFront)state.buffer.unshift(chunk);else state.buffer.push(chunk);if(state.needReadable)emitReadable(stream);}maybeReadMore(stream,state);}function chunkInvalid(state,chunk){var er;if(!_isUint8Array(chunk)&&typeof chunk!=='string'&&chunk!==undefined&&!state.objectMode){er=new ERR_INVALID_ARG_TYPE('chunk',['string','Buffer','Uint8Array'],chunk);}return er;}Readable.prototype.isPaused=function(){return this._readableState.flowing===false;};// backwards compatibility.
Readable.prototype.setEncoding=function(enc){if(!StringDecoder)StringDecoder=require('string_decoder/').StringDecoder;const decoder=new StringDecoder(enc);this._readableState.decoder=decoder;// If setEncoding(null), decoder.encoding equals utf8
this._readableState.encoding=this._readableState.decoder.encoding;// Iterate over current buffer to convert already stored Buffers:
let p=this._readableState.buffer.head;let content='';while(p!==null){content+=decoder.write(p.data);p=p.next;}this._readableState.buffer.clear();if(content!=='')this._readableState.buffer.push(content);this._readableState.length=content.length;return this;};// Don't raise the hwm > 1GB
const MAX_HWM=0x40000000;function computeNewHighWaterMark(n){if(n>=MAX_HWM){// TODO(ronag): Throw ERR_VALUE_OUT_OF_RANGE.
n=MAX_HWM;}else{// Get the next highest power of 2 to prevent increasing hwm excessively in
// tiny amounts
n--;n|=n>>>1;n|=n>>>2;n|=n>>>4;n|=n>>>8;n|=n>>>16;n++;}return n;}// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n,state){if(n<=0||state.length===0&&state.ended)return 0;if(state.objectMode)return 1;if(n!==n){// Only flow one buffer at a time
if(state.flowing&&state.length)return state.buffer.head.data.length;else return state.length;}// If we're asking for more than the current hwm, then raise the hwm.
if(n>state.highWaterMark)state.highWaterMark=computeNewHighWaterMark(n);if(n<=state.length)return n;// Don't have enough
if(!state.ended){state.needReadable=true;return 0;}return state.length;}// you can override either this method, or the async _read(n) below.
Readable.prototype.read=function(n){debug('read',n);n=parseInt(n,10);var state=this._readableState;var nOrig=n;if(n!==0)state.emittedReadable=false;// if we're doing read(0) to trigger a readable event, but we
// already have a bunch of data in the buffer, then just trigger
// the 'readable' event and move on.
if(n===0&&state.needReadable&&((state.highWaterMark!==0?state.length>=state.highWaterMark:state.length>0)||state.ended)){debug('read: emitReadable',state.length,state.ended);if(state.length===0&&state.ended)endReadable(this);else emitReadable(this);return null;}n=howMuchToRead(n,state);// if we've ended, and we're now clear, then finish it up.
if(n===0&&state.ended){if(state.length===0)endReadable(this);return null;}// All the actual chunk generation logic needs to be
// *below* the call to _read.  The reason is that in certain
// synthetic stream cases, such as passthrough streams, _read
// may be a completely synchronous operation which may change
// the state of the read buffer, providing enough data when
// before there was *not* enough.
//
// So, the steps are:
// 1. Figure out what the state of things will be after we do
// a read from the buffer.
//
// 2. If that resulting state will trigger a _read, then call _read.
// Note that this may be asynchronous, or synchronous.  Yes, it is
// deeply ugly to write APIs this way, but that still doesn't mean
// that the Readable class should behave improperly, as streams are
// designed to be sync/async agnostic.
// Take note if the _read call is sync or async (ie, if the read call
// has returned yet), so that we know whether or not it's safe to emit
// 'readable' etc.
//
// 3. Actually pull the requested chunks out of the buffer and return.
// if we need a readable event, then we need to do some reading.
var doRead=state.needReadable;debug('need readable',doRead);// if we currently have less than the highWaterMark, then also read some
if(state.length===0||state.length-n<state.highWaterMark){doRead=true;debug('length less than watermark',doRead);}// however, if we've ended, then there's no point, and if we're already
// reading, then it's unnecessary.
if(state.ended||state.reading){doRead=false;debug('reading or ended',doRead);}else if(doRead){debug('do read');state.reading=true;state.sync=true;// if the length is currently zero, then we *need* a readable event.
if(state.length===0)state.needReadable=true;// call internal read method
this._read(state.highWaterMark);state.sync=false;// If _read pushed data synchronously, then `reading` will be false,
// and we need to re-evaluate how much data we can return to the user.
if(!state.reading)n=howMuchToRead(nOrig,state);}var ret;if(n>0)ret=fromList(n,state);else ret=null;if(ret===null){state.needReadable=state.length<=state.highWaterMark;n=0;}else{state.length-=n;state.awaitDrain=0;}if(state.length===0){// If we have nothing in the buffer, then we want to know
// as soon as we *do* get something into the buffer.
if(!state.ended)state.needReadable=true;// If we tried to read() past the EOF, then emit end on the next tick.
if(nOrig!==n&&state.ended)endReadable(this);}if(ret!==null)this.emit('data',ret);return ret;};function onEofChunk(stream,state){debug('onEofChunk');if(state.ended)return;if(state.decoder){var chunk=state.decoder.end();if(chunk&&chunk.length){state.buffer.push(chunk);state.length+=state.objectMode?1:chunk.length;}}state.ended=true;if(state.sync){// if we are sync, wait until next tick to emit the data.
// Otherwise we risk emitting data in the flow()
// the readable code triggers during a read() call
emitReadable(stream);}else{// emit 'readable' now to make sure it gets picked up.
state.needReadable=false;if(!state.emittedReadable){state.emittedReadable=true;emitReadable_(stream);}}}// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream){var state=stream._readableState;debug('emitReadable',state.needReadable,state.emittedReadable);state.needReadable=false;if(!state.emittedReadable){debug('emitReadable',state.flowing);state.emittedReadable=true;process.nextTick(emitReadable_,stream);}}function emitReadable_(stream){var state=stream._readableState;debug('emitReadable_',state.destroyed,state.length,state.ended);if(!state.destroyed&&(state.length||state.ended)){stream.emit('readable');state.emittedReadable=false;}// The stream needs another readable event if
// 1. It is not flowing, as the flow mechanism will take
//    care of it.
// 2. It is not ended.
// 3. It is below the highWaterMark, so we can schedule
//    another readable later.
state.needReadable=!state.flowing&&!state.ended&&state.length<=state.highWaterMark;flow(stream);}// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream,state){if(!state.readingMore){state.readingMore=true;process.nextTick(maybeReadMore_,stream,state);}}function maybeReadMore_(stream,state){// Attempt to read more data if we should.
//
// The conditions for reading more data are (one of):
// - Not enough data buffered (state.length < state.highWaterMark). The loop
//   is responsible for filling the buffer with enough data if such data
//   is available. If highWaterMark is 0 and we are not in the flowing mode
//   we should _not_ attempt to buffer any extra data. We'll get more data
//   when the stream consumer calls read() instead.
// - No data in the buffer, and the stream is in flowing mode. In this mode
//   the loop below is responsible for ensuring read() is called. Failing to
//   call read here would abort the flow and there's no other mechanism for
//   continuing the flow if the stream consumer has just subscribed to the
//   'data' event.
//
// In addition to the above conditions to keep reading data, the following
// conditions prevent the data from being read:
// - The stream has ended (state.ended).
// - There is already a pending 'read' operation (state.reading). This is a
//   case where the the stream has called the implementation defined _read()
//   method, but they are processing the call asynchronously and have _not_
//   called push() with new data. In this case we skip performing more
//   read()s. The execution ends in this method again after the _read() ends
//   up calling push() with more data.
while(!state.reading&&!state.ended&&(state.length<state.highWaterMark||state.flowing&&state.length===0)){const len=state.length;debug('maybeReadMore read 0');stream.read(0);if(len===state.length)// didn't get any data, stop spinning.
break;}state.readingMore=false;}// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read=function(n){errorOrDestroy(this,new ERR_METHOD_NOT_IMPLEMENTED('_read()'));};Readable.prototype.pipe=function(dest,pipeOpts){var src=this;var state=this._readableState;switch(state.pipesCount){case 0:state.pipes=dest;break;case 1:state.pipes=[state.pipes,dest];break;default:state.pipes.push(dest);break;}state.pipesCount+=1;debug('pipe count=%d opts=%j',state.pipesCount,pipeOpts);var doEnd=(!pipeOpts||pipeOpts.end!==false)&&dest!==process.stdout&&dest!==process.stderr;var endFn=doEnd?onend:unpipe;if(state.endEmitted)process.nextTick(endFn);else src.once('end',endFn);dest.on('unpipe',onunpipe);function onunpipe(readable,unpipeInfo){debug('onunpipe');if(readable===src){if(unpipeInfo&&unpipeInfo.hasUnpiped===false){unpipeInfo.hasUnpiped=true;cleanup();}}}function onend(){debug('onend');dest.end();}// when the dest drains, it reduces the awaitDrain counter
// on the source.  This would be more elegant with a .once()
// handler in flow(), but adding and removing repeatedly is
// too slow.
var ondrain=pipeOnDrain(src);dest.on('drain',ondrain);var cleanedUp=false;function cleanup(){debug('cleanup');// cleanup event handlers once the pipe is broken
dest.removeListener('close',onclose);dest.removeListener('finish',onfinish);dest.removeListener('drain',ondrain);dest.removeListener('error',onerror);dest.removeListener('unpipe',onunpipe);src.removeListener('end',onend);src.removeListener('end',unpipe);src.removeListener('data',ondata);cleanedUp=true;// if the reader is waiting for a drain event from this
// specific writer, then it would cause it to never start
// flowing again.
// So, if this is awaiting a drain, then we just call it now.
// If we don't know, then assume that we are waiting for one.
if(state.awaitDrain&&(!dest._writableState||dest._writableState.needDrain))ondrain();}src.on('data',ondata);function ondata(chunk){debug('ondata');var ret=dest.write(chunk);debug('dest.write',ret);if(ret===false){// If the user unpiped during `dest.write()`, it is possible
// to get stuck in a permanently paused state if that write
// also returned false.
// => Check whether `dest` is still a piping destination.
if((state.pipesCount===1&&state.pipes===dest||state.pipesCount>1&&indexOf(state.pipes,dest)!==-1)&&!cleanedUp){debug('false write response, pause',state.awaitDrain);state.awaitDrain++;}src.pause();}}// if the dest has an error, then stop piping into it.
// however, don't suppress the throwing behavior for this.
function onerror(er){debug('onerror',er);unpipe();dest.removeListener('error',onerror);if(EElistenerCount(dest,'error')===0)errorOrDestroy(dest,er);}// Make sure our error handler is attached before userland ones.
prependListener(dest,'error',onerror);// Both close and finish should trigger unpipe, but only once.
function onclose(){dest.removeListener('finish',onfinish);unpipe();}dest.once('close',onclose);function onfinish(){debug('onfinish');dest.removeListener('close',onclose);unpipe();}dest.once('finish',onfinish);function unpipe(){debug('unpipe');src.unpipe(dest);}// tell the dest that it's being piped to
dest.emit('pipe',src);// start the flow if it hasn't been started already.
if(!state.flowing){debug('pipe resume');src.resume();}return dest;};function pipeOnDrain(src){return function pipeOnDrainFunctionResult(){var state=src._readableState;debug('pipeOnDrain',state.awaitDrain);if(state.awaitDrain)state.awaitDrain--;if(state.awaitDrain===0&&EElistenerCount(src,'data')){state.flowing=true;flow(src);}};}Readable.prototype.unpipe=function(dest){var state=this._readableState;var unpipeInfo={hasUnpiped:false};// if we're not piping anywhere, then do nothing.
if(state.pipesCount===0)return this;// just one destination.  most common case.
if(state.pipesCount===1){// passed in one, but it's not the right one.
if(dest&&dest!==state.pipes)return this;if(!dest)dest=state.pipes;// got a match.
state.pipes=null;state.pipesCount=0;state.flowing=false;if(dest)dest.emit('unpipe',this,unpipeInfo);return this;}// slow case. multiple pipe destinations.
if(!dest){// remove all.
var dests=state.pipes;var len=state.pipesCount;state.pipes=null;state.pipesCount=0;state.flowing=false;for(var i=0;i<len;i++)dests[i].emit('unpipe',this,{hasUnpiped:false});return this;}// try to find the right one.
var index=indexOf(state.pipes,dest);if(index===-1)return this;state.pipes.splice(index,1);state.pipesCount-=1;if(state.pipesCount===1)state.pipes=state.pipes[0];dest.emit('unpipe',this,unpipeInfo);return this;};// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on=function(ev,fn){const res=Stream.prototype.on.call(this,ev,fn);const state=this._readableState;if(ev==='data'){// update readableListening so that resume() may be a no-op
// a few lines down. This is needed to support once('readable').
state.readableListening=this.listenerCount('readable')>0;// Try start flowing on next tick if stream isn't explicitly paused
if(state.flowing!==false)this.resume();}else if(ev==='readable'){if(!state.endEmitted&&!state.readableListening){state.readableListening=state.needReadable=true;state.flowing=false;state.emittedReadable=false;debug('on readable',state.length,state.reading);if(state.length){emitReadable(this);}else if(!state.reading){process.nextTick(nReadingNextTick,this);}}}return res;};Readable.prototype.addListener=Readable.prototype.on;Readable.prototype.removeListener=function(ev,fn){const res=Stream.prototype.removeListener.call(this,ev,fn);if(ev==='readable'){// We need to check if there is someone still listening to
// readable and reset the state. However this needs to happen
// after readable has been emitted but before I/O (nextTick) to
// support once('readable', fn) cycles. This means that calling
// resume within the same tick will have no
// effect.
process.nextTick(updateReadableListening,this);}return res;};Readable.prototype.removeAllListeners=function(ev){const res=Stream.prototype.removeAllListeners.apply(this,arguments);if(ev==='readable'||ev===undefined){// We need to check if there is someone still listening to
// readable and reset the state. However this needs to happen
// after readable has been emitted but before I/O (nextTick) to
// support once('readable', fn) cycles. This means that calling
// resume within the same tick will have no
// effect.
process.nextTick(updateReadableListening,this);}return res;};function updateReadableListening(self){const state=self._readableState;state.readableListening=self.listenerCount('readable')>0;if(state.resumeScheduled&&!state.paused){// flowing needs to be set to true now, otherwise
// the upcoming resume will not flow.
state.flowing=true;// crude way to check if we should resume
}else if(self.listenerCount('data')>0){self.resume();}}function nReadingNextTick(self){debug('readable nexttick read 0');self.read(0);}// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume=function(){var state=this._readableState;if(!state.flowing){debug('resume');// we flow only if there is no one listening
// for readable, but we still have to call
// resume()
state.flowing=!state.readableListening;resume(this,state);}state.paused=false;return this;};function resume(stream,state){if(!state.resumeScheduled){state.resumeScheduled=true;process.nextTick(resume_,stream,state);}}function resume_(stream,state){debug('resume',state.reading);if(!state.reading){stream.read(0);}state.resumeScheduled=false;stream.emit('resume');flow(stream);if(state.flowing&&!state.reading)stream.read(0);}Readable.prototype.pause=function(){debug('call pause flowing=%j',this._readableState.flowing);if(this._readableState.flowing!==false){debug('pause');this._readableState.flowing=false;this.emit('pause');}this._readableState.paused=true;return this;};function flow(stream){const state=stream._readableState;debug('flow',state.flowing);while(state.flowing&&stream.read()!==null);}// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap=function(stream){var state=this._readableState;var paused=false;stream.on('end',()=>{debug('wrapped end');if(state.decoder&&!state.ended){var chunk=state.decoder.end();if(chunk&&chunk.length)this.push(chunk);}this.push(null);});stream.on('data',chunk=>{debug('wrapped data');if(state.decoder)chunk=state.decoder.write(chunk);// don't skip over falsy values in objectMode
if(state.objectMode&&(chunk===null||chunk===undefined))return;else if(!state.objectMode&&(!chunk||!chunk.length))return;var ret=this.push(chunk);if(!ret){paused=true;stream.pause();}});// proxy all the other methods.
// important when wrapping filters and duplexes.
for(var i in stream){if(this[i]===undefined&&typeof stream[i]==='function'){this[i]=function methodWrap(method){return function methodWrapReturnFunction(){return stream[method].apply(stream,arguments);};}(i);}}// proxy certain important events.
for(var n=0;n<kProxyEvents.length;n++){stream.on(kProxyEvents[n],this.emit.bind(this,kProxyEvents[n]));}// when we try to consume some more bytes, simply unpause the
// underlying stream.
this._read=n=>{debug('wrapped _read',n);if(paused){paused=false;stream.resume();}};return this;};if(typeof Symbol==='function'){Readable.prototype[Symbol.asyncIterator]=function(){if(createReadableStreamAsyncIterator===undefined){createReadableStreamAsyncIterator=require('./internal/streams/async_iterator');}return createReadableStreamAsyncIterator(this);};}Object.defineProperty(Readable.prototype,'readableHighWaterMark',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get:function get(){return this._readableState.highWaterMark;}});Object.defineProperty(Readable.prototype,'readableBuffer',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get:function get(){return this._readableState&&this._readableState.buffer;}});Object.defineProperty(Readable.prototype,'readableFlowing',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get:function get(){return this._readableState.flowing;},set:function set(state){if(this._readableState){this._readableState.flowing=state;}}});// exposed for testing purposes only.
Readable._fromList=fromList;Object.defineProperty(Readable.prototype,'readableLength',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get(){return this._readableState.length;}});// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n,state){// nothing buffered
if(state.length===0)return null;var ret;if(state.objectMode)ret=state.buffer.shift();else if(!n||n>=state.length){// read it all, truncate the list
if(state.decoder)ret=state.buffer.join('');else if(state.buffer.length===1)ret=state.buffer.first();else ret=state.buffer.concat(state.length);state.buffer.clear();}else{// read part of list
ret=state.buffer.consume(n,state.decoder);}return ret;}function endReadable(stream){var state=stream._readableState;debug('endReadable',state.endEmitted);if(!state.endEmitted){state.ended=true;process.nextTick(endReadableNT,state,stream);}}function endReadableNT(state,stream){debug('endReadableNT',state.endEmitted,state.length);// Check that we didn't get one last unshift.
if(!state.endEmitted&&state.length===0){state.endEmitted=true;stream.readable=false;stream.emit('end');if(state.autoDestroy){// In case of duplex streams we need a way to detect
// if the writable side is ready for autoDestroy as well
const wState=stream._writableState;if(!wState||wState.autoDestroy&&wState.finished){stream.destroy();}}}}if(typeof Symbol==='function'){Readable.from=function(iterable,opts){if(from===undefined){from=require('./internal/streams/from');}return from(Readable,iterable,opts);};}function indexOf(xs,x){for(var i=0,l=xs.length;i<l;i++){if(xs[i]===x)return i;}return-1;}}).call(this);}).call(this,require('_process'),typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{});},{"../errors":148,"./_stream_duplex":149,"./internal/streams/async_iterator":154,"./internal/streams/buffer_list":155,"./internal/streams/destroy":156,"./internal/streams/from":158,"./internal/streams/state":160,"./internal/streams/stream":161,"_process":121,"buffer":22,"events":26,"inherits":47,"string_decoder/":163,"util":20}],152:[function(require,module,exports){arguments[4][134][0].apply(exports,arguments);},{"../errors":148,"./_stream_duplex":149,"dup":134,"inherits":47}],153:[function(require,module,exports){(function(process,global){(function(){// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.
'use strict';module.exports=Writable;/* <replacement> */function WriteReq(chunk,encoding,cb){this.chunk=chunk;this.encoding=encoding;this.callback=cb;this.next=null;}// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state){this.next=null;this.entry=null;this.finish=()=>{onCorkedFinish(this,state);};}/* </replacement> */ /*<replacement>*/var Duplex;/*</replacement>*/Writable.WritableState=WritableState;/*<replacement>*/const internalUtil={deprecate:require('util-deprecate')};/*</replacement>*/ /*<replacement>*/var Stream=require('./internal/streams/stream');/*</replacement>*/const Buffer=require('buffer').Buffer;const OurUint8Array=(typeof global!=='undefined'?global:typeof window!=='undefined'?window:typeof self!=='undefined'?self:{}).Uint8Array||function(){};function _uint8ArrayToBuffer(chunk){return Buffer.from(chunk);}function _isUint8Array(obj){return Buffer.isBuffer(obj)||obj instanceof OurUint8Array;}const destroyImpl=require('./internal/streams/destroy');const _require=require('./internal/streams/state'),getHighWaterMark=_require.getHighWaterMark;const _require$codes=require('../errors').codes,ERR_INVALID_ARG_TYPE=_require$codes.ERR_INVALID_ARG_TYPE,ERR_METHOD_NOT_IMPLEMENTED=_require$codes.ERR_METHOD_NOT_IMPLEMENTED,ERR_MULTIPLE_CALLBACK=_require$codes.ERR_MULTIPLE_CALLBACK,ERR_STREAM_CANNOT_PIPE=_require$codes.ERR_STREAM_CANNOT_PIPE,ERR_STREAM_DESTROYED=_require$codes.ERR_STREAM_DESTROYED,ERR_STREAM_NULL_VALUES=_require$codes.ERR_STREAM_NULL_VALUES,ERR_STREAM_WRITE_AFTER_END=_require$codes.ERR_STREAM_WRITE_AFTER_END,ERR_UNKNOWN_ENCODING=_require$codes.ERR_UNKNOWN_ENCODING;const errorOrDestroy=destroyImpl.errorOrDestroy;require('inherits')(Writable,Stream);function nop(){}function WritableState(options,stream,isDuplex){Duplex=Duplex||require('./_stream_duplex');options=options||{};// Duplex streams are both readable and writable, but share
// the same options object.
// However, some cases require setting options to different
// values for the readable and the writable sides of the duplex stream,
// e.g. options.readableObjectMode vs. options.writableObjectMode, etc.
if(typeof isDuplex!=='boolean')isDuplex=stream instanceof Duplex;// object stream flag to indicate whether or not this stream
// contains buffers or objects.
this.objectMode=!!options.objectMode;if(isDuplex)this.objectMode=this.objectMode||!!options.writableObjectMode;// the point at which write() starts returning false
// Note: 0 is a valid value, means that we always return false if
// the entire buffer is not flushed immediately on write()
this.highWaterMark=getHighWaterMark(this,options,'writableHighWaterMark',isDuplex);// if _final has been called
this.finalCalled=false;// drain event flag.
this.needDrain=false;// at the start of calling end()
this.ending=false;// when end() has been called, and returned
this.ended=false;// when 'finish' is emitted
this.finished=false;// has it been destroyed
this.destroyed=false;// should we decode strings into buffers before passing to _write?
// this is here so that some node-core streams can optimize string
// handling at a lower level.
var noDecode=options.decodeStrings===false;this.decodeStrings=!noDecode;// Crypto is kind of old and crusty.  Historically, its default string
// encoding is 'binary' so we have to make this configurable.
// Everything else in the universe uses 'utf8', though.
this.defaultEncoding=options.defaultEncoding||'utf8';// not an actual buffer we keep track of, but a measurement
// of how much we're waiting to get pushed to some underlying
// socket or file.
this.length=0;// a flag to see when we're in the middle of a write.
this.writing=false;// when true all writes will be buffered until .uncork() call
this.corked=0;// a flag to be able to tell if the onwrite cb is called immediately,
// or on a later tick.  We set this to true at first, because any
// actions that shouldn't happen until "later" should generally also
// not happen before the first write call.
this.sync=true;// a flag to know if we're processing previously buffered items, which
// may call the _write() callback in the same tick, so that we don't
// end up in an overlapped onwrite situation.
this.bufferProcessing=false;// the callback that's passed to _write(chunk,cb)
this.onwrite=function(er){onwrite(stream,er);};// the callback that the user supplies to write(chunk,encoding,cb)
this.writecb=null;// the amount that is being written when _write is called.
this.writelen=0;this.bufferedRequest=null;this.lastBufferedRequest=null;// number of pending user-supplied write callbacks
// this must be 0 before 'finish' can be emitted
this.pendingcb=0;// emit prefinish if the only thing we're waiting for is _write cbs
// This is relevant for synchronous Transform streams
this.prefinished=false;// True if the error was already emitted and should not be thrown again
this.errorEmitted=false;// Should close be emitted on destroy. Defaults to true.
this.emitClose=options.emitClose!==false;// Should .destroy() be called after 'finish' (and potentially 'end')
this.autoDestroy=!!options.autoDestroy;// count buffered requests
this.bufferedRequestCount=0;// allocate the first CorkedRequest, there is always
// one allocated and free to use, and we maintain at most two
this.corkedRequestsFree=new CorkedRequest(this);}WritableState.prototype.getBuffer=function getBuffer(){var current=this.bufferedRequest;var out=[];while(current){out.push(current);current=current.next;}return out;};(function(){try{Object.defineProperty(WritableState.prototype,'buffer',{get:internalUtil.deprecate(function writableStateBufferGetter(){return this.getBuffer();},'_writableState.buffer is deprecated. Use _writableState.getBuffer '+'instead.','DEP0003')});}catch(_){}})();// Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.
var realHasInstance;if(typeof Symbol==='function'&&Symbol.hasInstance&&typeof Function.prototype[Symbol.hasInstance]==='function'){realHasInstance=Function.prototype[Symbol.hasInstance];Object.defineProperty(Writable,Symbol.hasInstance,{value:function value(object){if(realHasInstance.call(this,object))return true;if(this!==Writable)return false;return object&&object._writableState instanceof WritableState;}});}else{realHasInstance=function realHasInstance(object){return object instanceof this;};}function Writable(options){Duplex=Duplex||require('./_stream_duplex');// Writable ctor is applied to Duplexes, too.
// `realHasInstance` is necessary because using plain `instanceof`
// would return false, as no `_writableState` property is attached.
// Trying to use the custom `instanceof` for Writable here will also break the
// Node.js LazyTransform implementation, which has a non-trivial getter for
// `_writableState` that would lead to infinite recursion.
// Checking for a Stream.Duplex instance is faster here instead of inside
// the WritableState constructor, at least with V8 6.5
const isDuplex=this instanceof Duplex;if(!isDuplex&&!realHasInstance.call(Writable,this))return new Writable(options);this._writableState=new WritableState(options,this,isDuplex);// legacy.
this.writable=true;if(options){if(typeof options.write==='function')this._write=options.write;if(typeof options.writev==='function')this._writev=options.writev;if(typeof options.destroy==='function')this._destroy=options.destroy;if(typeof options.final==='function')this._final=options.final;}Stream.call(this);}// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe=function(){errorOrDestroy(this,new ERR_STREAM_CANNOT_PIPE());};function writeAfterEnd(stream,cb){var er=new ERR_STREAM_WRITE_AFTER_END();// TODO: defer error events consistently everywhere, not just the cb
errorOrDestroy(stream,er);process.nextTick(cb,er);}// Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.
function validChunk(stream,state,chunk,cb){var er;if(chunk===null){er=new ERR_STREAM_NULL_VALUES();}else if(typeof chunk!=='string'&&!state.objectMode){er=new ERR_INVALID_ARG_TYPE('chunk',['string','Buffer'],chunk);}if(er){errorOrDestroy(stream,er);process.nextTick(cb,er);return false;}return true;}Writable.prototype.write=function(chunk,encoding,cb){var state=this._writableState;var ret=false;var isBuf=!state.objectMode&&_isUint8Array(chunk);if(isBuf&&!Buffer.isBuffer(chunk)){chunk=_uint8ArrayToBuffer(chunk);}if(typeof encoding==='function'){cb=encoding;encoding=null;}if(isBuf)encoding='buffer';else if(!encoding)encoding=state.defaultEncoding;if(typeof cb!=='function')cb=nop;if(state.ending)writeAfterEnd(this,cb);else if(isBuf||validChunk(this,state,chunk,cb)){state.pendingcb++;ret=writeOrBuffer(this,state,isBuf,chunk,encoding,cb);}return ret;};Writable.prototype.cork=function(){this._writableState.corked++;};Writable.prototype.uncork=function(){var state=this._writableState;if(state.corked){state.corked--;if(!state.writing&&!state.corked&&!state.bufferProcessing&&state.bufferedRequest)clearBuffer(this,state);}};Writable.prototype.setDefaultEncoding=function setDefaultEncoding(encoding){// node::ParseEncoding() requires lower case.
if(typeof encoding==='string')encoding=encoding.toLowerCase();if(!(['hex','utf8','utf-8','ascii','binary','base64','ucs2','ucs-2','utf16le','utf-16le','raw'].indexOf((encoding+'').toLowerCase())>-1))throw new ERR_UNKNOWN_ENCODING(encoding);this._writableState.defaultEncoding=encoding;return this;};Object.defineProperty(Writable.prototype,'writableBuffer',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get:function get(){return this._writableState&&this._writableState.getBuffer();}});function decodeChunk(state,chunk,encoding){if(!state.objectMode&&state.decodeStrings!==false&&typeof chunk==='string'){chunk=Buffer.from(chunk,encoding);}return chunk;}Object.defineProperty(Writable.prototype,'writableHighWaterMark',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get:function get(){return this._writableState.highWaterMark;}});// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream,state,isBuf,chunk,encoding,cb){if(!isBuf){var newChunk=decodeChunk(state,chunk,encoding);if(chunk!==newChunk){isBuf=true;encoding='buffer';chunk=newChunk;}}var len=state.objectMode?1:chunk.length;state.length+=len;var ret=state.length<state.highWaterMark;// we must ensure that previous needDrain will not be reset to false.
if(!ret)state.needDrain=true;if(state.writing||state.corked){var last=state.lastBufferedRequest;state.lastBufferedRequest={chunk,encoding,isBuf,callback:cb,next:null};if(last){last.next=state.lastBufferedRequest;}else{state.bufferedRequest=state.lastBufferedRequest;}state.bufferedRequestCount+=1;}else{doWrite(stream,state,false,len,chunk,encoding,cb);}return ret;}function doWrite(stream,state,writev,len,chunk,encoding,cb){state.writelen=len;state.writecb=cb;state.writing=true;state.sync=true;if(state.destroyed)state.onwrite(new ERR_STREAM_DESTROYED('write'));else if(writev)stream._writev(chunk,state.onwrite);else stream._write(chunk,encoding,state.onwrite);state.sync=false;}function onwriteError(stream,state,sync,er,cb){--state.pendingcb;if(sync){// defer the callback if we are being called synchronously
// to avoid piling up things on the stack
process.nextTick(cb,er);// this can emit finish, and it will always happen
// after error
process.nextTick(finishMaybe,stream,state);stream._writableState.errorEmitted=true;errorOrDestroy(stream,er);}else{// the caller expect this to happen before if
// it is async
cb(er);stream._writableState.errorEmitted=true;errorOrDestroy(stream,er);// this can emit finish, but finish must
// always follow error
finishMaybe(stream,state);}}function onwriteStateUpdate(state){state.writing=false;state.writecb=null;state.length-=state.writelen;state.writelen=0;}function onwrite(stream,er){var state=stream._writableState;var sync=state.sync;var cb=state.writecb;if(typeof cb!=='function')throw new ERR_MULTIPLE_CALLBACK();onwriteStateUpdate(state);if(er)onwriteError(stream,state,sync,er,cb);else{// Check if we're actually ready to finish, but don't emit yet
var finished=needFinish(state)||stream.destroyed;if(!finished&&!state.corked&&!state.bufferProcessing&&state.bufferedRequest){clearBuffer(stream,state);}if(sync){process.nextTick(afterWrite,stream,state,finished,cb);}else{afterWrite(stream,state,finished,cb);}}}function afterWrite(stream,state,finished,cb){if(!finished)onwriteDrain(stream,state);state.pendingcb--;cb();finishMaybe(stream,state);}// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream,state){if(state.length===0&&state.needDrain){state.needDrain=false;stream.emit('drain');}}// if there's something in the buffer waiting, then process it
function clearBuffer(stream,state){state.bufferProcessing=true;var entry=state.bufferedRequest;if(stream._writev&&entry&&entry.next){// Fast case, write everything using _writev()
var l=state.bufferedRequestCount;var buffer=new Array(l);var holder=state.corkedRequestsFree;holder.entry=entry;var count=0;var allBuffers=true;while(entry){buffer[count]=entry;if(!entry.isBuf)allBuffers=false;entry=entry.next;count+=1;}buffer.allBuffers=allBuffers;doWrite(stream,state,true,state.length,buffer,'',holder.finish);// doWrite is almost always async, defer these to save a bit of time
// as the hot path ends with doWrite
state.pendingcb++;state.lastBufferedRequest=null;if(holder.next){state.corkedRequestsFree=holder.next;holder.next=null;}else{state.corkedRequestsFree=new CorkedRequest(state);}state.bufferedRequestCount=0;}else{// Slow case, write chunks one-by-one
while(entry){var chunk=entry.chunk;var encoding=entry.encoding;var cb=entry.callback;var len=state.objectMode?1:chunk.length;doWrite(stream,state,false,len,chunk,encoding,cb);entry=entry.next;state.bufferedRequestCount--;// if we didn't call the onwrite immediately, then
// it means that we need to wait until it does.
// also, that means that the chunk and cb are currently
// being processed, so move the buffer counter past them.
if(state.writing){break;}}if(entry===null)state.lastBufferedRequest=null;}state.bufferedRequest=entry;state.bufferProcessing=false;}Writable.prototype._write=function(chunk,encoding,cb){cb(new ERR_METHOD_NOT_IMPLEMENTED('_write()'));};Writable.prototype._writev=null;Writable.prototype.end=function(chunk,encoding,cb){var state=this._writableState;if(typeof chunk==='function'){cb=chunk;chunk=null;encoding=null;}else if(typeof encoding==='function'){cb=encoding;encoding=null;}if(chunk!==null&&chunk!==undefined)this.write(chunk,encoding);// .end() fully uncorks
if(state.corked){state.corked=1;this.uncork();}// ignore unnecessary end() calls.
if(!state.ending)endWritable(this,state,cb);return this;};Object.defineProperty(Writable.prototype,'writableLength',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get(){return this._writableState.length;}});function needFinish(state){return state.ending&&state.length===0&&state.bufferedRequest===null&&!state.finished&&!state.writing;}function callFinal(stream,state){stream._final(err=>{state.pendingcb--;if(err){errorOrDestroy(stream,err);}state.prefinished=true;stream.emit('prefinish');finishMaybe(stream,state);});}function prefinish(stream,state){if(!state.prefinished&&!state.finalCalled){if(typeof stream._final==='function'&&!state.destroyed){state.pendingcb++;state.finalCalled=true;process.nextTick(callFinal,stream,state);}else{state.prefinished=true;stream.emit('prefinish');}}}function finishMaybe(stream,state){var need=needFinish(state);if(need){prefinish(stream,state);if(state.pendingcb===0){state.finished=true;stream.emit('finish');if(state.autoDestroy){// In case of duplex streams we need a way to detect
// if the readable side is ready for autoDestroy as well
const rState=stream._readableState;if(!rState||rState.autoDestroy&&rState.endEmitted){stream.destroy();}}}}return need;}function endWritable(stream,state,cb){state.ending=true;finishMaybe(stream,state);if(cb){if(state.finished)process.nextTick(cb);else stream.once('finish',cb);}state.ended=true;stream.writable=false;}function onCorkedFinish(corkReq,state,err){var entry=corkReq.entry;corkReq.entry=null;while(entry){var cb=entry.callback;state.pendingcb--;cb(err);entry=entry.next;}// reuse the free corkReq.
state.corkedRequestsFree.next=corkReq;}Object.defineProperty(Writable.prototype,'destroyed',{// making it explicit this property is not enumerable
// because otherwise some prototype manipulation in
// userland will fail
enumerable:false,get(){if(this._writableState===undefined){return false;}return this._writableState.destroyed;},set(value){// we ignore the value if the stream
// has not been initialized yet
if(!this._writableState){return;}// backward compatibility, the user is explicitly
// managing destroyed
this._writableState.destroyed=value;}});Writable.prototype.destroy=destroyImpl.destroy;Writable.prototype._undestroy=destroyImpl.undestroy;Writable.prototype._destroy=function(err,cb){cb(err);};}).call(this);}).call(this,require('_process'),typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{});},{"../errors":148,"./_stream_duplex":149,"./internal/streams/destroy":156,"./internal/streams/state":160,"./internal/streams/stream":161,"_process":121,"buffer":22,"inherits":47,"util-deprecate":168}],154:[function(require,module,exports){(function(process){(function(){'use strict';const finished=require('./end-of-stream');const kLastResolve=Symbol('lastResolve');const kLastReject=Symbol('lastReject');const kError=Symbol('error');const kEnded=Symbol('ended');const kLastPromise=Symbol('lastPromise');const kHandlePromise=Symbol('handlePromise');const kStream=Symbol('stream');function createIterResult(value,done){return{value,done};}function readAndResolve(iter){const resolve=iter[kLastResolve];if(resolve!==null){const data=iter[kStream].read();// we defer if data is null
// we can be expecting either 'end' or
// 'error'
if(data!==null){iter[kLastPromise]=null;iter[kLastResolve]=null;iter[kLastReject]=null;resolve(createIterResult(data,false));}}}function onReadable(iter){// we wait for the next tick, because it might
// emit an error with process.nextTick
process.nextTick(readAndResolve,iter);}function wrapForNext(lastPromise,iter){return(resolve,reject)=>{lastPromise.then(()=>{if(iter[kEnded]){resolve(createIterResult(undefined,true));return;}iter[kHandlePromise](resolve,reject);},reject);};}const AsyncIteratorPrototype=Object.getPrototypeOf(function(){});const ReadableStreamAsyncIteratorPrototype=Object.setPrototypeOf({get stream(){return this[kStream];},next(){// if we have detected an error in the meanwhile
// reject straight away
const error=this[kError];if(error!==null){return Promise.reject(error);}if(this[kEnded]){return Promise.resolve(createIterResult(undefined,true));}if(this[kStream].destroyed){// We need to defer via nextTick because if .destroy(err) is
// called, the error will be emitted via nextTick, and
// we cannot guarantee that there is no error lingering around
// waiting to be emitted.
return new Promise((resolve,reject)=>{process.nextTick(()=>{if(this[kError]){reject(this[kError]);}else{resolve(createIterResult(undefined,true));}});});}// if we have multiple next() calls
// we will wait for the previous Promise to finish
// this logic is optimized to support for await loops,
// where next() is only called once at a time
const lastPromise=this[kLastPromise];let promise;if(lastPromise){promise=new Promise(wrapForNext(lastPromise,this));}else{// fast path needed to support multiple this.push()
// without triggering the next() queue
const data=this[kStream].read();if(data!==null){return Promise.resolve(createIterResult(data,false));}promise=new Promise(this[kHandlePromise]);}this[kLastPromise]=promise;return promise;},[Symbol.asyncIterator](){return this;},return(){// destroy(err, cb) is a private API
// we can guarantee we have that here, because we control the
// Readable class this is attached to
return new Promise((resolve,reject)=>{this[kStream].destroy(null,err=>{if(err){reject(err);return;}resolve(createIterResult(undefined,true));});});}},AsyncIteratorPrototype);const createReadableStreamAsyncIterator=stream=>{const iterator=Object.create(ReadableStreamAsyncIteratorPrototype,{[kStream]:{value:stream,writable:true},[kLastResolve]:{value:null,writable:true},[kLastReject]:{value:null,writable:true},[kError]:{value:null,writable:true},[kEnded]:{value:stream._readableState.endEmitted,writable:true},// the function passed to new Promise
// is cached so we avoid allocating a new
// closure at every run
[kHandlePromise]:{value:(resolve,reject)=>{const data=iterator[kStream].read();if(data){iterator[kLastPromise]=null;iterator[kLastResolve]=null;iterator[kLastReject]=null;resolve(createIterResult(data,false));}else{iterator[kLastResolve]=resolve;iterator[kLastReject]=reject;}},writable:true}});iterator[kLastPromise]=null;finished(stream,err=>{if(err&&err.code!=='ERR_STREAM_PREMATURE_CLOSE'){const reject=iterator[kLastReject];// reject if we are waiting for data in the Promise
// returned by next() and store the error
if(reject!==null){iterator[kLastPromise]=null;iterator[kLastResolve]=null;iterator[kLastReject]=null;reject(err);}iterator[kError]=err;return;}const resolve=iterator[kLastResolve];if(resolve!==null){iterator[kLastPromise]=null;iterator[kLastResolve]=null;iterator[kLastReject]=null;resolve(createIterResult(undefined,true));}iterator[kEnded]=true;});stream.on('readable',onReadable.bind(null,iterator));return iterator;};module.exports=createReadableStreamAsyncIterator;}).call(this);}).call(this,require('_process'));},{"./end-of-stream":157,"_process":121}],155:[function(require,module,exports){arguments[4][137][0].apply(exports,arguments);},{"buffer":22,"dup":137,"util":20}],156:[function(require,module,exports){(function(process){(function(){'use strict';// undocumented cb() API, needed for core, not for public API
function destroy(err,cb){const readableDestroyed=this._readableState&&this._readableState.destroyed;const writableDestroyed=this._writableState&&this._writableState.destroyed;if(readableDestroyed||writableDestroyed){if(cb){cb(err);}else if(err){if(!this._writableState){process.nextTick(emitErrorNT,this,err);}else if(!this._writableState.errorEmitted){this._writableState.errorEmitted=true;process.nextTick(emitErrorNT,this,err);}}return this;}// we set destroyed to true before firing error callbacks in order
// to make it re-entrance safe in case destroy() is called within callbacks
if(this._readableState){this._readableState.destroyed=true;}// if this is a duplex stream mark the writable part as destroyed as well
if(this._writableState){this._writableState.destroyed=true;}this._destroy(err||null,err=>{if(!cb&&err){if(!this._writableState){process.nextTick(emitErrorAndCloseNT,this,err);}else if(!this._writableState.errorEmitted){this._writableState.errorEmitted=true;process.nextTick(emitErrorAndCloseNT,this,err);}else{process.nextTick(emitCloseNT,this);}}else if(cb){process.nextTick(emitCloseNT,this);cb(err);}else{process.nextTick(emitCloseNT,this);}});return this;}function emitErrorAndCloseNT(self,err){emitErrorNT(self,err);emitCloseNT(self);}function emitCloseNT(self){if(self._writableState&&!self._writableState.emitClose)return;if(self._readableState&&!self._readableState.emitClose)return;self.emit('close');}function undestroy(){if(this._readableState){this._readableState.destroyed=false;this._readableState.reading=false;this._readableState.ended=false;this._readableState.endEmitted=false;}if(this._writableState){this._writableState.destroyed=false;this._writableState.ended=false;this._writableState.ending=false;this._writableState.finalCalled=false;this._writableState.prefinished=false;this._writableState.finished=false;this._writableState.errorEmitted=false;}}function emitErrorNT(self,err){self.emit('error',err);}function errorOrDestroy(stream,err){// We have tests that rely on errors being emitted
// in the same tick, so changing this is semver major.
// For now when you opt-in to autoDestroy we allow
// the error to be emitted nextTick. In a future
// semver major update we should change the default to this.
const rState=stream._readableState;const wState=stream._writableState;if(rState&&rState.autoDestroy||wState&&wState.autoDestroy)stream.destroy(err);else stream.emit('error',err);}module.exports={destroy,undestroy,errorOrDestroy};}).call(this);}).call(this,require('_process'));},{"_process":121}],157:[function(require,module,exports){arguments[4][139][0].apply(exports,arguments);},{"../../../errors":148,"dup":139}],158:[function(require,module,exports){arguments[4][140][0].apply(exports,arguments);},{"dup":140}],159:[function(require,module,exports){arguments[4][141][0].apply(exports,arguments);},{"../../../errors":148,"./end-of-stream":157,"dup":141}],160:[function(require,module,exports){arguments[4][142][0].apply(exports,arguments);},{"../../../errors":148,"dup":142}],161:[function(require,module,exports){arguments[4][143][0].apply(exports,arguments);},{"dup":143,"events":26}],162:[function(require,module,exports){exports=module.exports=require('./lib/_stream_readable.js');exports.Stream=exports;exports.Readable=exports;exports.Writable=require('./lib/_stream_writable.js');exports.Duplex=require('./lib/_stream_duplex.js');exports.Transform=require('./lib/_stream_transform.js');exports.PassThrough=require('./lib/_stream_passthrough.js');exports.finished=require('./lib/internal/streams/end-of-stream.js');exports.pipeline=require('./lib/internal/streams/pipeline.js');},{"./lib/_stream_duplex.js":149,"./lib/_stream_passthrough.js":150,"./lib/_stream_readable.js":151,"./lib/_stream_transform.js":152,"./lib/_stream_writable.js":153,"./lib/internal/streams/end-of-stream.js":157,"./lib/internal/streams/pipeline.js":159}],163:[function(require,module,exports){// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
'use strict';/*<replacement>*/var Buffer=require('safe-buffer').Buffer;/*</replacement>*/var isEncoding=Buffer.isEncoding||function(encoding){encoding=''+encoding;switch(encoding&&encoding.toLowerCase()){case'hex':case'utf8':case'utf-8':case'ascii':case'binary':case'base64':case'ucs2':case'ucs-2':case'utf16le':case'utf-16le':case'raw':return true;default:return false;}};function _normalizeEncoding(enc){if(!enc)return'utf8';var retried;while(true){switch(enc){case'utf8':case'utf-8':return'utf8';case'ucs2':case'ucs-2':case'utf16le':case'utf-16le':return'utf16le';case'latin1':case'binary':return'latin1';case'base64':case'ascii':case'hex':return enc;default:if(retried)return;// undefined
enc=(''+enc).toLowerCase();retried=true;}}};// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc){var nenc=_normalizeEncoding(enc);if(typeof nenc!=='string'&&(Buffer.isEncoding===isEncoding||!isEncoding(enc)))throw new Error('Unknown encoding: '+enc);return nenc||enc;}// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder=StringDecoder;function StringDecoder(encoding){this.encoding=normalizeEncoding(encoding);var nb;switch(this.encoding){case'utf16le':this.text=utf16Text;this.end=utf16End;nb=4;break;case'utf8':this.fillLast=utf8FillLast;nb=4;break;case'base64':this.text=base64Text;this.end=base64End;nb=3;break;default:this.write=simpleWrite;this.end=simpleEnd;return;}this.lastNeed=0;this.lastTotal=0;this.lastChar=Buffer.allocUnsafe(nb);}StringDecoder.prototype.write=function(buf){if(buf.length===0)return'';var r;var i;if(this.lastNeed){r=this.fillLast(buf);if(r===undefined)return'';i=this.lastNeed;this.lastNeed=0;}else{i=0;}if(i<buf.length)return r?r+this.text(buf,i):this.text(buf,i);return r||'';};StringDecoder.prototype.end=utf8End;// Returns only complete characters in a Buffer
StringDecoder.prototype.text=utf8Text;// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast=function(buf){if(this.lastNeed<=buf.length){buf.copy(this.lastChar,this.lastTotal-this.lastNeed,0,this.lastNeed);return this.lastChar.toString(this.encoding,0,this.lastTotal);}buf.copy(this.lastChar,this.lastTotal-this.lastNeed,0,buf.length);this.lastNeed-=buf.length;};// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte){if(byte<=0x7F)return 0;else if(byte>>5===0x06)return 2;else if(byte>>4===0x0E)return 3;else if(byte>>3===0x1E)return 4;return byte>>6===0x02?-1:-2;}// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self,buf,i){var j=buf.length-1;if(j<i)return 0;var nb=utf8CheckByte(buf[j]);if(nb>=0){if(nb>0)self.lastNeed=nb-1;return nb;}if(--j<i||nb===-2)return 0;nb=utf8CheckByte(buf[j]);if(nb>=0){if(nb>0)self.lastNeed=nb-2;return nb;}if(--j<i||nb===-2)return 0;nb=utf8CheckByte(buf[j]);if(nb>=0){if(nb>0){if(nb===2)nb=0;else self.lastNeed=nb-3;}return nb;}return 0;}// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self,buf,p){if((buf[0]&0xC0)!==0x80){self.lastNeed=0;return'\ufffd';}if(self.lastNeed>1&&buf.length>1){if((buf[1]&0xC0)!==0x80){self.lastNeed=1;return'\ufffd';}if(self.lastNeed>2&&buf.length>2){if((buf[2]&0xC0)!==0x80){self.lastNeed=2;return'\ufffd';}}}}// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf){var p=this.lastTotal-this.lastNeed;var r=utf8CheckExtraBytes(this,buf,p);if(r!==undefined)return r;if(this.lastNeed<=buf.length){buf.copy(this.lastChar,p,0,this.lastNeed);return this.lastChar.toString(this.encoding,0,this.lastTotal);}buf.copy(this.lastChar,p,0,buf.length);this.lastNeed-=buf.length;}// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf,i){var total=utf8CheckIncomplete(this,buf,i);if(!this.lastNeed)return buf.toString('utf8',i);this.lastTotal=total;var end=buf.length-(total-this.lastNeed);buf.copy(this.lastChar,0,end);return buf.toString('utf8',i,end);}// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf){var r=buf&&buf.length?this.write(buf):'';if(this.lastNeed)return r+'\ufffd';return r;}// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf,i){if((buf.length-i)%2===0){var r=buf.toString('utf16le',i);if(r){var c=r.charCodeAt(r.length-1);if(c>=0xD800&&c<=0xDBFF){this.lastNeed=2;this.lastTotal=4;this.lastChar[0]=buf[buf.length-2];this.lastChar[1]=buf[buf.length-1];return r.slice(0,-1);}}return r;}this.lastNeed=1;this.lastTotal=2;this.lastChar[0]=buf[buf.length-1];return buf.toString('utf16le',i,buf.length-1);}// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf){var r=buf&&buf.length?this.write(buf):'';if(this.lastNeed){var end=this.lastTotal-this.lastNeed;return r+this.lastChar.toString('utf16le',0,end);}return r;}function base64Text(buf,i){var n=(buf.length-i)%3;if(n===0)return buf.toString('base64',i);this.lastNeed=3-n;this.lastTotal=3;if(n===1){this.lastChar[0]=buf[buf.length-1];}else{this.lastChar[0]=buf[buf.length-2];this.lastChar[1]=buf[buf.length-1];}return buf.toString('base64',i,buf.length-n);}function base64End(buf){var r=buf&&buf.length?this.write(buf):'';if(this.lastNeed)return r+this.lastChar.toString('base64',0,3-this.lastNeed);return r;}// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf){return buf.toString(this.encoding);}function simpleEnd(buf){return buf&&buf.length?this.write(buf):'';}},{"safe-buffer":126}],164:[function(require,module,exports){(function(process){(function(){var Stream=require('stream');// through
//
// a stream that does nothing but re-emit the input.
// useful for aggregating a series of changing but not ending streams into one stream)
exports=module.exports=through;through.through=through;//create a readable writable stream.
function through(write,end,opts){write=write||function(data){this.queue(data);};end=end||function(){this.queue(null);};var ended=false,destroyed=false,buffer=[],_ended=false;var stream=new Stream();stream.readable=stream.writable=true;stream.paused=false;//  stream.autoPause   = !(opts && opts.autoPause   === false)
stream.autoDestroy=!(opts&&opts.autoDestroy===false);stream.write=function(data){write.call(this,data);return!stream.paused;};function drain(){while(buffer.length&&!stream.paused){var data=buffer.shift();if(null===data)return stream.emit('end');else stream.emit('data',data);}}stream.queue=stream.push=function(data){//    console.error(ended)
if(_ended)return stream;if(data===null)_ended=true;buffer.push(data);drain();return stream;};//this will be registered as the first 'end' listener
//must call destroy next tick, to make sure we're after any
//stream piped from here.
//this is only a problem if end is not emitted synchronously.
//a nicer way to do this is to make sure this is the last listener for 'end'
stream.on('end',function(){stream.readable=false;if(!stream.writable&&stream.autoDestroy)process.nextTick(function(){stream.destroy();});});function _end(){stream.writable=false;end.call(stream);if(!stream.readable&&stream.autoDestroy)stream.destroy();}stream.end=function(data){if(ended)return;ended=true;if(arguments.length)stream.write(data);_end();// will emit or queue
return stream;};stream.destroy=function(){if(destroyed)return;destroyed=true;ended=true;buffer.length=0;stream.writable=stream.readable=false;stream.emit('close');return stream;};stream.pause=function(){if(stream.paused)return;stream.paused=true;return stream;};stream.resume=function(){if(stream.paused){stream.paused=false;stream.emit('resume');}drain();//may have become paused again,
//as drain emits 'data'.
if(!stream.paused)stream.emit('drain');return stream;};return stream;}}).call(this);}).call(this,require('_process'));},{"_process":121,"stream":129}],165:[function(require,module,exports){(function(setImmediate,clearImmediate){(function(){var nextTick=require('process/browser.js').nextTick;var apply=Function.prototype.apply;var slice=Array.prototype.slice;var immediateIds={};var nextImmediateId=0;// DOM APIs, for completeness
exports.setTimeout=function(){return new Timeout(apply.call(setTimeout,window,arguments),clearTimeout);};exports.setInterval=function(){return new Timeout(apply.call(setInterval,window,arguments),clearInterval);};exports.clearTimeout=exports.clearInterval=function(timeout){timeout.close();};function Timeout(id,clearFn){this._id=id;this._clearFn=clearFn;}Timeout.prototype.unref=Timeout.prototype.ref=function(){};Timeout.prototype.close=function(){this._clearFn.call(window,this._id);};// Does not start the time, just sets up the members needed.
exports.enroll=function(item,msecs){clearTimeout(item._idleTimeoutId);item._idleTimeout=msecs;};exports.unenroll=function(item){clearTimeout(item._idleTimeoutId);item._idleTimeout=-1;};exports._unrefActive=exports.active=function(item){clearTimeout(item._idleTimeoutId);var msecs=item._idleTimeout;if(msecs>=0){item._idleTimeoutId=setTimeout(function onTimeout(){if(item._onTimeout)item._onTimeout();},msecs);}};// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate=typeof setImmediate==="function"?setImmediate:function(fn){var id=nextImmediateId++;var args=arguments.length<2?false:slice.call(arguments,1);immediateIds[id]=true;nextTick(function onNextTick(){if(immediateIds[id]){// fn.call() is faster so we optimize for the common use-case
// @see http://jsperf.com/call-apply-segu
if(args){fn.apply(null,args);}else{fn.call(null);}// Prevent ids from leaking
exports.clearImmediate(id);}});return id;};exports.clearImmediate=typeof clearImmediate==="function"?clearImmediate:function(id){delete immediateIds[id];};}).call(this);}).call(this,require("timers").setImmediate,require("timers").clearImmediate);},{"process/browser.js":121,"timers":165}],166:[function(require,module,exports){// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
'use strict';var punycode=require('punycode');var util=require('./util');exports.parse=urlParse;exports.resolve=urlResolve;exports.resolveObject=urlResolveObject;exports.format=urlFormat;exports.Url=Url;function Url(){this.protocol=null;this.slashes=null;this.auth=null;this.host=null;this.port=null;this.hostname=null;this.hash=null;this.search=null;this.query=null;this.pathname=null;this.path=null;this.href=null;}// Reference: RFC 3986, RFC 1808, RFC 2396
// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern=/^([a-z0-9.+-]+:)/i,portPattern=/:[0-9]*$/,// Special case for a simple path URL
simplePathPattern=/^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,// RFC 2396: characters reserved for delimiting URLs.
// We actually just auto-escape these.
delims=['<','>','"','`',' ','\r','\n','\t'],// RFC 2396: characters not allowed for various reasons.
unwise=['{','}','|','\\','^','`'].concat(delims),// Allowed by RFCs, but cause of XSS attacks.  Always escape these.
autoEscape=['\''].concat(unwise),// Characters that are never ever allowed in a hostname.
// Note that any invalid chars are also handled, but these
// are the ones that are *expected* to be seen, so we fast-path
// them.
nonHostChars=['%','/','?',';','#'].concat(autoEscape),hostEndingChars=['/','?','#'],hostnameMaxLen=255,hostnamePartPattern=/^[+a-z0-9A-Z_-]{0,63}$/,hostnamePartStart=/^([+a-z0-9A-Z_-]{0,63})(.*)$/,// protocols that can allow "unsafe" and "unwise" chars.
unsafeProtocol={'javascript':true,'javascript:':true},// protocols that never have a hostname.
hostlessProtocol={'javascript':true,'javascript:':true},// protocols that always contain a // bit.
slashedProtocol={'http':true,'https':true,'ftp':true,'gopher':true,'file':true,'http:':true,'https:':true,'ftp:':true,'gopher:':true,'file:':true},querystring=require('querystring');function urlParse(url,parseQueryString,slashesDenoteHost){if(url&&util.isObject(url)&&url instanceof Url)return url;var u=new Url();u.parse(url,parseQueryString,slashesDenoteHost);return u;}Url.prototype.parse=function(url,parseQueryString,slashesDenoteHost){if(!util.isString(url)){throw new TypeError("Parameter 'url' must be a string, not "+typeof url);}// Copy chrome, IE, opera backslash-handling behavior.
// Back slashes before the query string get converted to forward slashes
// See: https://code.google.com/p/chromium/issues/detail?id=25916
var queryIndex=url.indexOf('?'),splitter=queryIndex!==-1&&queryIndex<url.indexOf('#')?'?':'#',uSplit=url.split(splitter),slashRegex=/\\/g;uSplit[0]=uSplit[0].replace(slashRegex,'/');url=uSplit.join(splitter);var rest=url;// trim before proceeding.
// This is to support parse stuff like "  http://foo.com  \n"
rest=rest.trim();if(!slashesDenoteHost&&url.split('#').length===1){// Try fast path regexp
var simplePath=simplePathPattern.exec(rest);if(simplePath){this.path=rest;this.href=rest;this.pathname=simplePath[1];if(simplePath[2]){this.search=simplePath[2];if(parseQueryString){this.query=querystring.parse(this.search.substr(1));}else{this.query=this.search.substr(1);}}else if(parseQueryString){this.search='';this.query={};}return this;}}var proto=protocolPattern.exec(rest);if(proto){proto=proto[0];var lowerProto=proto.toLowerCase();this.protocol=lowerProto;rest=rest.substr(proto.length);}// figure out if it's got a host
// user@server is *always* interpreted as a hostname, and url
// resolution will treat //foo/bar as host=foo,path=bar because that's
// how the browser resolves relative URLs.
if(slashesDenoteHost||proto||rest.match(/^\/\/[^@\/]+@[^@\/]+/)){var slashes=rest.substr(0,2)==='//';if(slashes&&!(proto&&hostlessProtocol[proto])){rest=rest.substr(2);this.slashes=true;}}if(!hostlessProtocol[proto]&&(slashes||proto&&!slashedProtocol[proto])){// there's a hostname.
// the first instance of /, ?, ;, or # ends the host.
//
// If there is an @ in the hostname, then non-host chars *are* allowed
// to the left of the last @ sign, unless some host-ending character
// comes *before* the @-sign.
// URLs are obnoxious.
//
// ex:
// http://a@b@c/ => user:a@b host:c
// http://a@b?@c => user:a host:c path:/?@c
// v0.12 TODO(isaacs): This is not quite how Chrome does things.
// Review our test case against browsers more comprehensively.
// find the first instance of any hostEndingChars
var hostEnd=-1;for(var i=0;i<hostEndingChars.length;i++){var hec=rest.indexOf(hostEndingChars[i]);if(hec!==-1&&(hostEnd===-1||hec<hostEnd))hostEnd=hec;}// at this point, either we have an explicit point where the
// auth portion cannot go past, or the last @ char is the decider.
var auth,atSign;if(hostEnd===-1){// atSign can be anywhere.
atSign=rest.lastIndexOf('@');}else{// atSign must be in auth portion.
// http://a@b/c@d => host:b auth:a path:/c@d
atSign=rest.lastIndexOf('@',hostEnd);}// Now we have a portion which is definitely the auth.
// Pull that off.
if(atSign!==-1){auth=rest.slice(0,atSign);rest=rest.slice(atSign+1);this.auth=decodeURIComponent(auth);}// the host is the remaining to the left of the first non-host char
hostEnd=-1;for(var i=0;i<nonHostChars.length;i++){var hec=rest.indexOf(nonHostChars[i]);if(hec!==-1&&(hostEnd===-1||hec<hostEnd))hostEnd=hec;}// if we still have not hit it, then the entire thing is a host.
if(hostEnd===-1)hostEnd=rest.length;this.host=rest.slice(0,hostEnd);rest=rest.slice(hostEnd);// pull out port.
this.parseHost();// we've indicated that there is a hostname,
// so even if it's empty, it has to be present.
this.hostname=this.hostname||'';// if hostname begins with [ and ends with ]
// assume that it's an IPv6 address.
var ipv6Hostname=this.hostname[0]==='['&&this.hostname[this.hostname.length-1]===']';// validate a little.
if(!ipv6Hostname){var hostparts=this.hostname.split(/\./);for(var i=0,l=hostparts.length;i<l;i++){var part=hostparts[i];if(!part)continue;if(!part.match(hostnamePartPattern)){var newpart='';for(var j=0,k=part.length;j<k;j++){if(part.charCodeAt(j)>127){// we replace non-ASCII char with a temporary placeholder
// we need this to make sure size of hostname is not
// broken by replacing non-ASCII by nothing
newpart+='x';}else{newpart+=part[j];}}// we test again with ASCII char only
if(!newpart.match(hostnamePartPattern)){var validParts=hostparts.slice(0,i);var notHost=hostparts.slice(i+1);var bit=part.match(hostnamePartStart);if(bit){validParts.push(bit[1]);notHost.unshift(bit[2]);}if(notHost.length){rest='/'+notHost.join('.')+rest;}this.hostname=validParts.join('.');break;}}}}if(this.hostname.length>hostnameMaxLen){this.hostname='';}else{// hostnames are always lower case.
this.hostname=this.hostname.toLowerCase();}if(!ipv6Hostname){// IDNA Support: Returns a punycoded representation of "domain".
// It only converts parts of the domain name that
// have non-ASCII characters, i.e. it doesn't matter if
// you call it with a domain that already is ASCII-only.
this.hostname=punycode.toASCII(this.hostname);}var p=this.port?':'+this.port:'';var h=this.hostname||'';this.host=h+p;this.href+=this.host;// strip [ and ] from the hostname
// the host field still retains them, though
if(ipv6Hostname){this.hostname=this.hostname.substr(1,this.hostname.length-2);if(rest[0]!=='/'){rest='/'+rest;}}}// now rest is set to the post-host stuff.
// chop off any delim chars.
if(!unsafeProtocol[lowerProto]){// First, make 100% sure that any "autoEscape" chars get
// escaped, even if encodeURIComponent doesn't think they
// need to be.
for(var i=0,l=autoEscape.length;i<l;i++){var ae=autoEscape[i];if(rest.indexOf(ae)===-1)continue;var esc=encodeURIComponent(ae);if(esc===ae){esc=escape(ae);}rest=rest.split(ae).join(esc);}}// chop off from the tail first.
var hash=rest.indexOf('#');if(hash!==-1){// got a fragment string.
this.hash=rest.substr(hash);rest=rest.slice(0,hash);}var qm=rest.indexOf('?');if(qm!==-1){this.search=rest.substr(qm);this.query=rest.substr(qm+1);if(parseQueryString){this.query=querystring.parse(this.query);}rest=rest.slice(0,qm);}else if(parseQueryString){// no query string, but parseQueryString still requested
this.search='';this.query={};}if(rest)this.pathname=rest;if(slashedProtocol[lowerProto]&&this.hostname&&!this.pathname){this.pathname='/';}//to support http.request
if(this.pathname||this.search){var p=this.pathname||'';var s=this.search||'';this.path=p+s;}// finally, reconstruct the href based on what has been validated.
this.href=this.format();return this;};// format a parsed object into a url string
function urlFormat(obj){// ensure it's an object, and not a string url.
// If it's an obj, this is a no-op.
// this way, you can call url_format() on strings
// to clean up potentially wonky urls.
if(util.isString(obj))obj=urlParse(obj);if(!(obj instanceof Url))return Url.prototype.format.call(obj);return obj.format();}Url.prototype.format=function(){var auth=this.auth||'';if(auth){auth=encodeURIComponent(auth);auth=auth.replace(/%3A/i,':');auth+='@';}var protocol=this.protocol||'',pathname=this.pathname||'',hash=this.hash||'',host=false,query='';if(this.host){host=auth+this.host;}else if(this.hostname){host=auth+(this.hostname.indexOf(':')===-1?this.hostname:'['+this.hostname+']');if(this.port){host+=':'+this.port;}}if(this.query&&util.isObject(this.query)&&Object.keys(this.query).length){query=querystring.stringify(this.query);}var search=this.search||query&&'?'+query||'';if(protocol&&protocol.substr(-1)!==':')protocol+=':';// only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
// unless they had them to begin with.
if(this.slashes||(!protocol||slashedProtocol[protocol])&&host!==false){host='//'+(host||'');if(pathname&&pathname.charAt(0)!=='/')pathname='/'+pathname;}else if(!host){host='';}if(hash&&hash.charAt(0)!=='#')hash='#'+hash;if(search&&search.charAt(0)!=='?')search='?'+search;pathname=pathname.replace(/[?#]/g,function(match){return encodeURIComponent(match);});search=search.replace('#','%23');return protocol+host+pathname+search+hash;};function urlResolve(source,relative){return urlParse(source,false,true).resolve(relative);}Url.prototype.resolve=function(relative){return this.resolveObject(urlParse(relative,false,true)).format();};function urlResolveObject(source,relative){if(!source)return relative;return urlParse(source,false,true).resolveObject(relative);}Url.prototype.resolveObject=function(relative){if(util.isString(relative)){var rel=new Url();rel.parse(relative,false,true);relative=rel;}var result=new Url();var tkeys=Object.keys(this);for(var tk=0;tk<tkeys.length;tk++){var tkey=tkeys[tk];result[tkey]=this[tkey];}// hash is always overridden, no matter what.
// even href="" will remove it.
result.hash=relative.hash;// if the relative url is empty, then there's nothing left to do here.
if(relative.href===''){result.href=result.format();return result;}// hrefs like //foo/bar always cut to the protocol.
if(relative.slashes&&!relative.protocol){// take everything except the protocol from relative
var rkeys=Object.keys(relative);for(var rk=0;rk<rkeys.length;rk++){var rkey=rkeys[rk];if(rkey!=='protocol')result[rkey]=relative[rkey];}//urlParse appends trailing / to urls like http://www.example.com
if(slashedProtocol[result.protocol]&&result.hostname&&!result.pathname){result.path=result.pathname='/';}result.href=result.format();return result;}if(relative.protocol&&relative.protocol!==result.protocol){// if it's a known url protocol, then changing
// the protocol does weird things
// first, if it's not file:, then we MUST have a host,
// and if there was a path
// to begin with, then we MUST have a path.
// if it is file:, then the host is dropped,
// because that's known to be hostless.
// anything else is assumed to be absolute.
if(!slashedProtocol[relative.protocol]){var keys=Object.keys(relative);for(var v=0;v<keys.length;v++){var k=keys[v];result[k]=relative[k];}result.href=result.format();return result;}result.protocol=relative.protocol;if(!relative.host&&!hostlessProtocol[relative.protocol]){var relPath=(relative.pathname||'').split('/');while(relPath.length&&!(relative.host=relPath.shift()));if(!relative.host)relative.host='';if(!relative.hostname)relative.hostname='';if(relPath[0]!=='')relPath.unshift('');if(relPath.length<2)relPath.unshift('');result.pathname=relPath.join('/');}else{result.pathname=relative.pathname;}result.search=relative.search;result.query=relative.query;result.host=relative.host||'';result.auth=relative.auth;result.hostname=relative.hostname||relative.host;result.port=relative.port;// to support http.request
if(result.pathname||result.search){var p=result.pathname||'';var s=result.search||'';result.path=p+s;}result.slashes=result.slashes||relative.slashes;result.href=result.format();return result;}var isSourceAbs=result.pathname&&result.pathname.charAt(0)==='/',isRelAbs=relative.host||relative.pathname&&relative.pathname.charAt(0)==='/',mustEndAbs=isRelAbs||isSourceAbs||result.host&&relative.pathname,removeAllDots=mustEndAbs,srcPath=result.pathname&&result.pathname.split('/')||[],relPath=relative.pathname&&relative.pathname.split('/')||[],psychotic=result.protocol&&!slashedProtocol[result.protocol];// if the url is a non-slashed url, then relative
// links like ../.. should be able
// to crawl up to the hostname, as well.  This is strange.
// result.protocol has already been set by now.
// Later on, put the first path part into the host field.
if(psychotic){result.hostname='';result.port=null;if(result.host){if(srcPath[0]==='')srcPath[0]=result.host;else srcPath.unshift(result.host);}result.host='';if(relative.protocol){relative.hostname=null;relative.port=null;if(relative.host){if(relPath[0]==='')relPath[0]=relative.host;else relPath.unshift(relative.host);}relative.host=null;}mustEndAbs=mustEndAbs&&(relPath[0]===''||srcPath[0]==='');}if(isRelAbs){// it's absolute.
result.host=relative.host||relative.host===''?relative.host:result.host;result.hostname=relative.hostname||relative.hostname===''?relative.hostname:result.hostname;result.search=relative.search;result.query=relative.query;srcPath=relPath;// fall through to the dot-handling below.
}else if(relPath.length){// it's relative
// throw away the existing file, and take the new path instead.
if(!srcPath)srcPath=[];srcPath.pop();srcPath=srcPath.concat(relPath);result.search=relative.search;result.query=relative.query;}else if(!util.isNullOrUndefined(relative.search)){// just pull out the search.
// like href='?foo'.
// Put this after the other two cases because it simplifies the booleans
if(psychotic){result.hostname=result.host=srcPath.shift();//occationaly the auth can get stuck only in host
//this especially happens in cases like
//url.resolveObject('mailto:local1@domain1', 'local2@domain2')
var authInHost=result.host&&result.host.indexOf('@')>0?result.host.split('@'):false;if(authInHost){result.auth=authInHost.shift();result.host=result.hostname=authInHost.shift();}}result.search=relative.search;result.query=relative.query;//to support http.request
if(!util.isNull(result.pathname)||!util.isNull(result.search)){result.path=(result.pathname?result.pathname:'')+(result.search?result.search:'');}result.href=result.format();return result;}if(!srcPath.length){// no path at all.  easy.
// we've already handled the other stuff above.
result.pathname=null;//to support http.request
if(result.search){result.path='/'+result.search;}else{result.path=null;}result.href=result.format();return result;}// if a url ENDs in . or .., then it must get a trailing slash.
// however, if it ends in anything else non-slashy,
// then it must NOT get a trailing slash.
var last=srcPath.slice(-1)[0];var hasTrailingSlash=(result.host||relative.host||srcPath.length>1)&&(last==='.'||last==='..')||last==='';// strip single dots, resolve double dots to parent dir
// if the path tries to go above the root, `up` ends up > 0
var up=0;for(var i=srcPath.length;i>=0;i--){last=srcPath[i];if(last==='.'){srcPath.splice(i,1);}else if(last==='..'){srcPath.splice(i,1);up++;}else if(up){srcPath.splice(i,1);up--;}}// if the path is allowed to go above the root, restore leading ..s
if(!mustEndAbs&&!removeAllDots){for(;up--;up){srcPath.unshift('..');}}if(mustEndAbs&&srcPath[0]!==''&&(!srcPath[0]||srcPath[0].charAt(0)!=='/')){srcPath.unshift('');}if(hasTrailingSlash&&srcPath.join('/').substr(-1)!=='/'){srcPath.push('');}var isAbsolute=srcPath[0]===''||srcPath[0]&&srcPath[0].charAt(0)==='/';// put the host back
if(psychotic){result.hostname=result.host=isAbsolute?'':srcPath.length?srcPath.shift():'';//occationaly the auth can get stuck only in host
//this especially happens in cases like
//url.resolveObject('mailto:local1@domain1', 'local2@domain2')
var authInHost=result.host&&result.host.indexOf('@')>0?result.host.split('@'):false;if(authInHost){result.auth=authInHost.shift();result.host=result.hostname=authInHost.shift();}}mustEndAbs=mustEndAbs||result.host&&srcPath.length;if(mustEndAbs&&!isAbsolute){srcPath.unshift('');}if(!srcPath.length){result.pathname=null;result.path=null;}else{result.pathname=srcPath.join('/');}//to support request.http
if(!util.isNull(result.pathname)||!util.isNull(result.search)){result.path=(result.pathname?result.pathname:'')+(result.search?result.search:'');}result.auth=relative.auth||result.auth;result.slashes=result.slashes||relative.slashes;result.href=result.format();return result;};Url.prototype.parseHost=function(){var host=this.host;var port=portPattern.exec(host);if(port){port=port[0];if(port!==':'){this.port=port.substr(1);}host=host.substr(0,host.length-port.length);}if(host)this.hostname=host;};},{"./util":167,"punycode":122,"querystring":125}],167:[function(require,module,exports){'use strict';module.exports={isString:function(arg){return typeof arg==='string';},isObject:function(arg){return typeof arg==='object'&&arg!==null;},isNull:function(arg){return arg===null;},isNullOrUndefined:function(arg){return arg==null;}};},{}],168:[function(require,module,exports){(function(global){(function(){/**
 * Module exports.
 */module.exports=deprecate;/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */function deprecate(fn,msg){if(config('noDeprecation')){return fn;}var warned=false;function deprecated(){if(!warned){if(config('throwDeprecation')){throw new Error(msg);}else if(config('traceDeprecation')){console.trace(msg);}else{console.warn(msg);}warned=true;}return fn.apply(this,arguments);}return deprecated;}/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */function config(name){// accessing global.localStorage can trigger a DOMException in sandboxed iframes
try{if(!global.localStorage)return false;}catch(_){return false;}var val=global.localStorage[name];if(null==val)return false;return String(val).toLowerCase()==='true';}}).call(this);}).call(this,typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{});},{}],169:[function(require,module,exports){module.exports=function isBuffer(arg){return arg&&typeof arg==='object'&&typeof arg.copy==='function'&&typeof arg.fill==='function'&&typeof arg.readUInt8==='function';};},{}],170:[function(require,module,exports){// Currently in sync with Node.js lib/internal/util/types.js
// https://github.com/nodejs/node/commit/112cc7c27551254aa2b17098fb774867f05ed0d9
'use strict';var isArgumentsObject=require('is-arguments');var isGeneratorFunction=require('is-generator-function');var whichTypedArray=require('which-typed-array');var isTypedArray=require('is-typed-array');function uncurryThis(f){return f.call.bind(f);}var BigIntSupported=typeof BigInt!=='undefined';var SymbolSupported=typeof Symbol!=='undefined';var ObjectToString=uncurryThis(Object.prototype.toString);var numberValue=uncurryThis(Number.prototype.valueOf);var stringValue=uncurryThis(String.prototype.valueOf);var booleanValue=uncurryThis(Boolean.prototype.valueOf);if(BigIntSupported){var bigIntValue=uncurryThis(BigInt.prototype.valueOf);}if(SymbolSupported){var symbolValue=uncurryThis(Symbol.prototype.valueOf);}function checkBoxedPrimitive(value,prototypeValueOf){if(typeof value!=='object'){return false;}try{prototypeValueOf(value);return true;}catch(e){return false;}}exports.isArgumentsObject=isArgumentsObject;exports.isGeneratorFunction=isGeneratorFunction;exports.isTypedArray=isTypedArray;// Taken from here and modified for better browser support
// https://github.com/sindresorhus/p-is-promise/blob/cda35a513bda03f977ad5cde3a079d237e82d7ef/index.js
function isPromise(input){return typeof Promise!=='undefined'&&input instanceof Promise||input!==null&&typeof input==='object'&&typeof input.then==='function'&&typeof input.catch==='function';}exports.isPromise=isPromise;function isArrayBufferView(value){if(typeof ArrayBuffer!=='undefined'&&ArrayBuffer.isView){return ArrayBuffer.isView(value);}return isTypedArray(value)||isDataView(value);}exports.isArrayBufferView=isArrayBufferView;function isUint8Array(value){return whichTypedArray(value)==='Uint8Array';}exports.isUint8Array=isUint8Array;function isUint8ClampedArray(value){return whichTypedArray(value)==='Uint8ClampedArray';}exports.isUint8ClampedArray=isUint8ClampedArray;function isUint16Array(value){return whichTypedArray(value)==='Uint16Array';}exports.isUint16Array=isUint16Array;function isUint32Array(value){return whichTypedArray(value)==='Uint32Array';}exports.isUint32Array=isUint32Array;function isInt8Array(value){return whichTypedArray(value)==='Int8Array';}exports.isInt8Array=isInt8Array;function isInt16Array(value){return whichTypedArray(value)==='Int16Array';}exports.isInt16Array=isInt16Array;function isInt32Array(value){return whichTypedArray(value)==='Int32Array';}exports.isInt32Array=isInt32Array;function isFloat32Array(value){return whichTypedArray(value)==='Float32Array';}exports.isFloat32Array=isFloat32Array;function isFloat64Array(value){return whichTypedArray(value)==='Float64Array';}exports.isFloat64Array=isFloat64Array;function isBigInt64Array(value){return whichTypedArray(value)==='BigInt64Array';}exports.isBigInt64Array=isBigInt64Array;function isBigUint64Array(value){return whichTypedArray(value)==='BigUint64Array';}exports.isBigUint64Array=isBigUint64Array;function isMapToString(value){return ObjectToString(value)==='[object Map]';}isMapToString.working=typeof Map!=='undefined'&&isMapToString(new Map());function isMap(value){if(typeof Map==='undefined'){return false;}return isMapToString.working?isMapToString(value):value instanceof Map;}exports.isMap=isMap;function isSetToString(value){return ObjectToString(value)==='[object Set]';}isSetToString.working=typeof Set!=='undefined'&&isSetToString(new Set());function isSet(value){if(typeof Set==='undefined'){return false;}return isSetToString.working?isSetToString(value):value instanceof Set;}exports.isSet=isSet;function isWeakMapToString(value){return ObjectToString(value)==='[object WeakMap]';}isWeakMapToString.working=typeof WeakMap!=='undefined'&&isWeakMapToString(new WeakMap());function isWeakMap(value){if(typeof WeakMap==='undefined'){return false;}return isWeakMapToString.working?isWeakMapToString(value):value instanceof WeakMap;}exports.isWeakMap=isWeakMap;function isWeakSetToString(value){return ObjectToString(value)==='[object WeakSet]';}isWeakSetToString.working=typeof WeakSet!=='undefined'&&isWeakSetToString(new WeakSet());function isWeakSet(value){return isWeakSetToString(value);}exports.isWeakSet=isWeakSet;function isArrayBufferToString(value){return ObjectToString(value)==='[object ArrayBuffer]';}isArrayBufferToString.working=typeof ArrayBuffer!=='undefined'&&isArrayBufferToString(new ArrayBuffer());function isArrayBuffer(value){if(typeof ArrayBuffer==='undefined'){return false;}return isArrayBufferToString.working?isArrayBufferToString(value):value instanceof ArrayBuffer;}exports.isArrayBuffer=isArrayBuffer;function isDataViewToString(value){return ObjectToString(value)==='[object DataView]';}isDataViewToString.working=typeof ArrayBuffer!=='undefined'&&typeof DataView!=='undefined'&&isDataViewToString(new DataView(new ArrayBuffer(1),0,1));function isDataView(value){if(typeof DataView==='undefined'){return false;}return isDataViewToString.working?isDataViewToString(value):value instanceof DataView;}exports.isDataView=isDataView;// Store a copy of SharedArrayBuffer in case it's deleted elsewhere
var SharedArrayBufferCopy=typeof SharedArrayBuffer!=='undefined'?SharedArrayBuffer:undefined;function isSharedArrayBufferToString(value){return ObjectToString(value)==='[object SharedArrayBuffer]';}function isSharedArrayBuffer(value){if(typeof SharedArrayBufferCopy==='undefined'){return false;}if(typeof isSharedArrayBufferToString.working==='undefined'){isSharedArrayBufferToString.working=isSharedArrayBufferToString(new SharedArrayBufferCopy());}return isSharedArrayBufferToString.working?isSharedArrayBufferToString(value):value instanceof SharedArrayBufferCopy;}exports.isSharedArrayBuffer=isSharedArrayBuffer;function isAsyncFunction(value){return ObjectToString(value)==='[object AsyncFunction]';}exports.isAsyncFunction=isAsyncFunction;function isMapIterator(value){return ObjectToString(value)==='[object Map Iterator]';}exports.isMapIterator=isMapIterator;function isSetIterator(value){return ObjectToString(value)==='[object Set Iterator]';}exports.isSetIterator=isSetIterator;function isGeneratorObject(value){return ObjectToString(value)==='[object Generator]';}exports.isGeneratorObject=isGeneratorObject;function isWebAssemblyCompiledModule(value){return ObjectToString(value)==='[object WebAssembly.Module]';}exports.isWebAssemblyCompiledModule=isWebAssemblyCompiledModule;function isNumberObject(value){return checkBoxedPrimitive(value,numberValue);}exports.isNumberObject=isNumberObject;function isStringObject(value){return checkBoxedPrimitive(value,stringValue);}exports.isStringObject=isStringObject;function isBooleanObject(value){return checkBoxedPrimitive(value,booleanValue);}exports.isBooleanObject=isBooleanObject;function isBigIntObject(value){return BigIntSupported&&checkBoxedPrimitive(value,bigIntValue);}exports.isBigIntObject=isBigIntObject;function isSymbolObject(value){return SymbolSupported&&checkBoxedPrimitive(value,symbolValue);}exports.isSymbolObject=isSymbolObject;function isBoxedPrimitive(value){return isNumberObject(value)||isStringObject(value)||isBooleanObject(value)||isBigIntObject(value)||isSymbolObject(value);}exports.isBoxedPrimitive=isBoxedPrimitive;function isAnyArrayBuffer(value){return typeof Uint8Array!=='undefined'&&(isArrayBuffer(value)||isSharedArrayBuffer(value));}exports.isAnyArrayBuffer=isAnyArrayBuffer;['isProxy','isExternal','isModuleNamespaceObject'].forEach(function(method){Object.defineProperty(exports,method,{enumerable:false,value:function(){throw new Error(method+' is not supported in userland');}});});},{"is-arguments":48,"is-generator-function":50,"is-typed-array":55,"which-typed-array":172}],171:[function(require,module,exports){(function(process){(function(){// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
var getOwnPropertyDescriptors=Object.getOwnPropertyDescriptors||function getOwnPropertyDescriptors(obj){var keys=Object.keys(obj);var descriptors={};for(var i=0;i<keys.length;i++){descriptors[keys[i]]=Object.getOwnPropertyDescriptor(obj,keys[i]);}return descriptors;};var formatRegExp=/%[sdj%]/g;exports.format=function(f){if(!isString(f)){var objects=[];for(var i=0;i<arguments.length;i++){objects.push(inspect(arguments[i]));}return objects.join(' ');}var i=1;var args=arguments;var len=args.length;var str=String(f).replace(formatRegExp,function(x){if(x==='%%')return'%';if(i>=len)return x;switch(x){case'%s':return String(args[i++]);case'%d':return Number(args[i++]);case'%j':try{return JSON.stringify(args[i++]);}catch(_){return'[Circular]';}default:return x;}});for(var x=args[i];i<len;x=args[++i]){if(isNull(x)||!isObject(x)){str+=' '+x;}else{str+=' '+inspect(x);}}return str;};// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate=function(fn,msg){if(typeof process!=='undefined'&&process.noDeprecation===true){return fn;}// Allow for deprecating things in the process of starting up.
if(typeof process==='undefined'){return function(){return exports.deprecate(fn,msg).apply(this,arguments);};}var warned=false;function deprecated(){if(!warned){if(process.throwDeprecation){throw new Error(msg);}else if(process.traceDeprecation){console.trace(msg);}else{console.error(msg);}warned=true;}return fn.apply(this,arguments);}return deprecated;};var debugs={};var debugEnvRegex=/^$/;if(process.env.NODE_DEBUG){var debugEnv=process.env.NODE_DEBUG;debugEnv=debugEnv.replace(/[|\\{}()[\]^$+?.]/g,'\\$&').replace(/\*/g,'.*').replace(/,/g,'$|^').toUpperCase();debugEnvRegex=new RegExp('^'+debugEnv+'$','i');}exports.debuglog=function(set){set=set.toUpperCase();if(!debugs[set]){if(debugEnvRegex.test(set)){var pid=process.pid;debugs[set]=function(){var msg=exports.format.apply(exports,arguments);console.error('%s %d: %s',set,pid,msg);};}else{debugs[set]=function(){};}}return debugs[set];};/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */ /* legacy: obj, showHidden, depth, colors*/function inspect(obj,opts){// default options
var ctx={seen:[],stylize:stylizeNoColor};// legacy...
if(arguments.length>=3)ctx.depth=arguments[2];if(arguments.length>=4)ctx.colors=arguments[3];if(isBoolean(opts)){// legacy...
ctx.showHidden=opts;}else if(opts){// got an "options" object
exports._extend(ctx,opts);}// set default options
if(isUndefined(ctx.showHidden))ctx.showHidden=false;if(isUndefined(ctx.depth))ctx.depth=2;if(isUndefined(ctx.colors))ctx.colors=false;if(isUndefined(ctx.customInspect))ctx.customInspect=true;if(ctx.colors)ctx.stylize=stylizeWithColor;return formatValue(ctx,obj,ctx.depth);}exports.inspect=inspect;// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors={'bold':[1,22],'italic':[3,23],'underline':[4,24],'inverse':[7,27],'white':[37,39],'grey':[90,39],'black':[30,39],'blue':[34,39],'cyan':[36,39],'green':[32,39],'magenta':[35,39],'red':[31,39],'yellow':[33,39]};// Don't use 'blue' not visible on cmd.exe
inspect.styles={'special':'cyan','number':'yellow','boolean':'yellow','undefined':'grey','null':'bold','string':'green','date':'magenta',// "name": intentionally not styling
'regexp':'red'};function stylizeWithColor(str,styleType){var style=inspect.styles[styleType];if(style){return'\u001b['+inspect.colors[style][0]+'m'+str+'\u001b['+inspect.colors[style][1]+'m';}else{return str;}}function stylizeNoColor(str,styleType){return str;}function arrayToHash(array){var hash={};array.forEach(function(val,idx){hash[val]=true;});return hash;}function formatValue(ctx,value,recurseTimes){// Provide a hook for user-specified inspect functions.
// Check that value is an object with an inspect function on it
if(ctx.customInspect&&value&&isFunction(value.inspect)&&// Filter out the util module, it's inspect function is special
value.inspect!==exports.inspect&&// Also filter out any prototype objects using the circular check.
!(value.constructor&&value.constructor.prototype===value)){var ret=value.inspect(recurseTimes,ctx);if(!isString(ret)){ret=formatValue(ctx,ret,recurseTimes);}return ret;}// Primitive types cannot have properties
var primitive=formatPrimitive(ctx,value);if(primitive){return primitive;}// Look up the keys of the object.
var keys=Object.keys(value);var visibleKeys=arrayToHash(keys);if(ctx.showHidden){keys=Object.getOwnPropertyNames(value);}// IE doesn't make error fields non-enumerable
// http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
if(isError(value)&&(keys.indexOf('message')>=0||keys.indexOf('description')>=0)){return formatError(value);}// Some type of object without properties can be shortcutted.
if(keys.length===0){if(isFunction(value)){var name=value.name?': '+value.name:'';return ctx.stylize('[Function'+name+']','special');}if(isRegExp(value)){return ctx.stylize(RegExp.prototype.toString.call(value),'regexp');}if(isDate(value)){return ctx.stylize(Date.prototype.toString.call(value),'date');}if(isError(value)){return formatError(value);}}var base='',array=false,braces=['{','}'];// Make Array say that they are Array
if(isArray(value)){array=true;braces=['[',']'];}// Make functions say that they are functions
if(isFunction(value)){var n=value.name?': '+value.name:'';base=' [Function'+n+']';}// Make RegExps say that they are RegExps
if(isRegExp(value)){base=' '+RegExp.prototype.toString.call(value);}// Make dates with properties first say the date
if(isDate(value)){base=' '+Date.prototype.toUTCString.call(value);}// Make error with message first say the error
if(isError(value)){base=' '+formatError(value);}if(keys.length===0&&(!array||value.length==0)){return braces[0]+base+braces[1];}if(recurseTimes<0){if(isRegExp(value)){return ctx.stylize(RegExp.prototype.toString.call(value),'regexp');}else{return ctx.stylize('[Object]','special');}}ctx.seen.push(value);var output;if(array){output=formatArray(ctx,value,recurseTimes,visibleKeys,keys);}else{output=keys.map(function(key){return formatProperty(ctx,value,recurseTimes,visibleKeys,key,array);});}ctx.seen.pop();return reduceToSingleString(output,base,braces);}function formatPrimitive(ctx,value){if(isUndefined(value))return ctx.stylize('undefined','undefined');if(isString(value)){var simple='\''+JSON.stringify(value).replace(/^"|"$/g,'').replace(/'/g,"\\'").replace(/\\"/g,'"')+'\'';return ctx.stylize(simple,'string');}if(isNumber(value))return ctx.stylize(''+value,'number');if(isBoolean(value))return ctx.stylize(''+value,'boolean');// For some reason typeof null is "object", so special case here.
if(isNull(value))return ctx.stylize('null','null');}function formatError(value){return'['+Error.prototype.toString.call(value)+']';}function formatArray(ctx,value,recurseTimes,visibleKeys,keys){var output=[];for(var i=0,l=value.length;i<l;++i){if(hasOwnProperty(value,String(i))){output.push(formatProperty(ctx,value,recurseTimes,visibleKeys,String(i),true));}else{output.push('');}}keys.forEach(function(key){if(!key.match(/^\d+$/)){output.push(formatProperty(ctx,value,recurseTimes,visibleKeys,key,true));}});return output;}function formatProperty(ctx,value,recurseTimes,visibleKeys,key,array){var name,str,desc;desc=Object.getOwnPropertyDescriptor(value,key)||{value:value[key]};if(desc.get){if(desc.set){str=ctx.stylize('[Getter/Setter]','special');}else{str=ctx.stylize('[Getter]','special');}}else{if(desc.set){str=ctx.stylize('[Setter]','special');}}if(!hasOwnProperty(visibleKeys,key)){name='['+key+']';}if(!str){if(ctx.seen.indexOf(desc.value)<0){if(isNull(recurseTimes)){str=formatValue(ctx,desc.value,null);}else{str=formatValue(ctx,desc.value,recurseTimes-1);}if(str.indexOf('\n')>-1){if(array){str=str.split('\n').map(function(line){return'  '+line;}).join('\n').slice(2);}else{str='\n'+str.split('\n').map(function(line){return'   '+line;}).join('\n');}}}else{str=ctx.stylize('[Circular]','special');}}if(isUndefined(name)){if(array&&key.match(/^\d+$/)){return str;}name=JSON.stringify(''+key);if(name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)){name=name.slice(1,-1);name=ctx.stylize(name,'name');}else{name=name.replace(/'/g,"\\'").replace(/\\"/g,'"').replace(/(^"|"$)/g,"'");name=ctx.stylize(name,'string');}}return name+': '+str;}function reduceToSingleString(output,base,braces){var numLinesEst=0;var length=output.reduce(function(prev,cur){numLinesEst++;if(cur.indexOf('\n')>=0)numLinesEst++;return prev+cur.replace(/\u001b\[\d\d?m/g,'').length+1;},0);if(length>60){return braces[0]+(base===''?'':base+'\n ')+' '+output.join(',\n  ')+' '+braces[1];}return braces[0]+base+' '+output.join(', ')+' '+braces[1];}// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
exports.types=require('./support/types');function isArray(ar){return Array.isArray(ar);}exports.isArray=isArray;function isBoolean(arg){return typeof arg==='boolean';}exports.isBoolean=isBoolean;function isNull(arg){return arg===null;}exports.isNull=isNull;function isNullOrUndefined(arg){return arg==null;}exports.isNullOrUndefined=isNullOrUndefined;function isNumber(arg){return typeof arg==='number';}exports.isNumber=isNumber;function isString(arg){return typeof arg==='string';}exports.isString=isString;function isSymbol(arg){return typeof arg==='symbol';}exports.isSymbol=isSymbol;function isUndefined(arg){return arg===void 0;}exports.isUndefined=isUndefined;function isRegExp(re){return isObject(re)&&objectToString(re)==='[object RegExp]';}exports.isRegExp=isRegExp;exports.types.isRegExp=isRegExp;function isObject(arg){return typeof arg==='object'&&arg!==null;}exports.isObject=isObject;function isDate(d){return isObject(d)&&objectToString(d)==='[object Date]';}exports.isDate=isDate;exports.types.isDate=isDate;function isError(e){return isObject(e)&&(objectToString(e)==='[object Error]'||e instanceof Error);}exports.isError=isError;exports.types.isNativeError=isError;function isFunction(arg){return typeof arg==='function';}exports.isFunction=isFunction;function isPrimitive(arg){return arg===null||typeof arg==='boolean'||typeof arg==='number'||typeof arg==='string'||typeof arg==='symbol'||// ES6 symbol
typeof arg==='undefined';}exports.isPrimitive=isPrimitive;exports.isBuffer=require('./support/isBuffer');function objectToString(o){return Object.prototype.toString.call(o);}function pad(n){return n<10?'0'+n.toString(10):n.toString(10);}var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];// 26 Feb 16:19:34
function timestamp(){var d=new Date();var time=[pad(d.getHours()),pad(d.getMinutes()),pad(d.getSeconds())].join(':');return[d.getDate(),months[d.getMonth()],time].join(' ');}// log is just a thin wrapper to console.log that prepends a timestamp
exports.log=function(){console.log('%s - %s',timestamp(),exports.format.apply(exports,arguments));};/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */exports.inherits=require('inherits');exports._extend=function(origin,add){// Don't do anything if add isn't an object
if(!add||!isObject(add))return origin;var keys=Object.keys(add);var i=keys.length;while(i--){origin[keys[i]]=add[keys[i]];}return origin;};function hasOwnProperty(obj,prop){return Object.prototype.hasOwnProperty.call(obj,prop);}var kCustomPromisifiedSymbol=typeof Symbol!=='undefined'?Symbol('util.promisify.custom'):undefined;exports.promisify=function promisify(original){if(typeof original!=='function')throw new TypeError('The "original" argument must be of type Function');if(kCustomPromisifiedSymbol&&original[kCustomPromisifiedSymbol]){var fn=original[kCustomPromisifiedSymbol];if(typeof fn!=='function'){throw new TypeError('The "util.promisify.custom" argument must be of type Function');}Object.defineProperty(fn,kCustomPromisifiedSymbol,{value:fn,enumerable:false,writable:false,configurable:true});return fn;}function fn(){var promiseResolve,promiseReject;var promise=new Promise(function(resolve,reject){promiseResolve=resolve;promiseReject=reject;});var args=[];for(var i=0;i<arguments.length;i++){args.push(arguments[i]);}args.push(function(err,value){if(err){promiseReject(err);}else{promiseResolve(value);}});try{original.apply(this,args);}catch(err){promiseReject(err);}return promise;}Object.setPrototypeOf(fn,Object.getPrototypeOf(original));if(kCustomPromisifiedSymbol)Object.defineProperty(fn,kCustomPromisifiedSymbol,{value:fn,enumerable:false,writable:false,configurable:true});return Object.defineProperties(fn,getOwnPropertyDescriptors(original));};exports.promisify.custom=kCustomPromisifiedSymbol;function callbackifyOnRejected(reason,cb){// `!reason` guard inspired by bluebird (Ref: https://goo.gl/t5IS6M).
// Because `null` is a special error value in callbacks which means "no error
// occurred", we error-wrap so the callback consumer can distinguish between
// "the promise rejected with null" or "the promise fulfilled with undefined".
if(!reason){var newReason=new Error('Promise was rejected with a falsy value');newReason.reason=reason;reason=newReason;}return cb(reason);}function callbackify(original){if(typeof original!=='function'){throw new TypeError('The "original" argument must be of type Function');}// We DO NOT return the promise as it gives the user a false sense that
// the promise is actually somehow related to the callback's execution
// and that the callback throwing will reject the promise.
function callbackified(){var args=[];for(var i=0;i<arguments.length;i++){args.push(arguments[i]);}var maybeCb=args.pop();if(typeof maybeCb!=='function'){throw new TypeError('The last argument must be of type Function');}var self=this;var cb=function(){return maybeCb.apply(self,arguments);};// In true node style we process the callback on `nextTick` with all the
// implications (stack, `uncaughtException`, `async_hooks`)
original.apply(this,args).then(function(ret){process.nextTick(cb.bind(null,null,ret));},function(rej){process.nextTick(callbackifyOnRejected.bind(null,rej,cb));});}Object.setPrototypeOf(callbackified,Object.getPrototypeOf(original));Object.defineProperties(callbackified,getOwnPropertyDescriptors(original));return callbackified;}exports.callbackify=callbackify;}).call(this);}).call(this,require('_process'));},{"./support/isBuffer":169,"./support/types":170,"_process":121,"inherits":47}],172:[function(require,module,exports){(function(global){(function(){'use strict';var forEach=require('for-each');var availableTypedArrays=require('available-typed-arrays');var callBound=require('call-bind/callBound');var gOPD=require('gopd');var $toString=callBound('Object.prototype.toString');var hasToStringTag=require('has-tostringtag/shams')();var g=typeof globalThis==='undefined'?global:globalThis;var typedArrays=availableTypedArrays();var $slice=callBound('String.prototype.slice');var toStrTags={};var getPrototypeOf=Object.getPrototypeOf;// require('getprototypeof');
if(hasToStringTag&&gOPD&&getPrototypeOf){forEach(typedArrays,function(typedArray){if(typeof g[typedArray]==='function'){var arr=new g[typedArray]();if(Symbol.toStringTag in arr){var proto=getPrototypeOf(arr);var descriptor=gOPD(proto,Symbol.toStringTag);if(!descriptor){var superProto=getPrototypeOf(proto);descriptor=gOPD(superProto,Symbol.toStringTag);}toStrTags[typedArray]=descriptor.get;}}});}var tryTypedArrays=function tryAllTypedArrays(value){var foundName=false;forEach(toStrTags,function(getter,typedArray){if(!foundName){try{var name=getter.call(value);if(name===typedArray){foundName=name;}}catch(e){}}});return foundName;};var isTypedArray=require('is-typed-array');module.exports=function whichTypedArray(value){if(!isTypedArray(value)){return false;}if(!hasToStringTag||!(Symbol.toStringTag in value)){return $slice($toString(value),8,-1);}return tryTypedArrays(value);};}).call(this);}).call(this,typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{});},{"available-typed-arrays":18,"call-bind/callBound":24,"for-each":27,"gopd":40,"has-tostringtag/shams":43,"is-typed-array":55}],173:[function(require,module,exports){// Returns a wrapper function that returns a wrapped callback
// The wrapper function should do some stuff, and return a
// presumably different callback function.
// This makes sure that own properties are retained, so that
// decorations and such are not lost along the way.
module.exports=wrappy;function wrappy(fn,cb){if(fn&&cb)return wrappy(fn)(cb);if(typeof fn!=='function')throw new TypeError('need wrapper function');Object.keys(fn).forEach(function(k){wrapper[k]=fn[k];});return wrapper;function wrapper(){var args=new Array(arguments.length);for(var i=0;i<args.length;i++){args[i]=arguments[i];}var ret=fn.apply(this,args);var cb=args[args.length-1];if(typeof ret==='function'&&ret!==cb){Object.keys(cb).forEach(function(k){ret[k]=cb[k];});}return ret;}}},{}],174:[function(require,module,exports){module.exports=extend;var hasOwnProperty=Object.prototype.hasOwnProperty;function extend(){var target={};for(var i=0;i<arguments.length;i++){var source=arguments[i];for(var key in source){if(hasOwnProperty.call(source,key)){target[key]=source[key];}}}return target;}},{}],175:[function(require,module,exports){/**
* Simple browser shim loader - assign the npm module to a window global automatically
*
* @license MIT
* @author <steven@velozo.com>
*/var libNPMModuleWrapper=require('./Meadow-Endpoints.js');if(typeof window==='object'&&!window.hasOwnProperty('MeadowEndpoints')){window.MeadowEndpoints=libNPMModuleWrapper;}module.exports=libNPMModuleWrapper;},{"./Meadow-Endpoints.js":176}],176:[function(require,module,exports){/**
* Meadow Endpoints Service Data Broker Library
*
* @license MIT
* @author Steven Velozo <steven@velozo.com>
*/const libMeadowEndpointsControllerBase=require('./controller/Meadow-Endpoints-Controller-Base.js');const libMeadow=require('meadow');class MeadowEndpoints{constructor(pMeadow,pControllerOptions){this._Meadow=pMeadow;// This is for backwards compatibility
this.DAL=this._Meadow;this._Controller=false;this._ControllerOptions=typeof pControllerOptions=='object'?pControllerOptions:{};if(typeof pMeadow!='object'){throw new Error('Meadow endpoints requires a valid Meadow DAL object as the first parameter of the constructor.');}if(this._ControllerOptions.hasOwnProperty('ControllerInstance')){// Passed in already instantiated controller instance
this._Controller=this._ControllerOptions.ControllerInstance;}else if(this._ControllerOptions.hasOwnProperty('ControllerClass')){// Passed in controller class, ready to initialize
this._Controller=new this._ControllerOptions.ControllerClass(this);}else{this._Controller=new libMeadowEndpointsControllerBase(this);}// Pull version from the settings; default to 1.0
this.EndpointVersion=this._Controller.settings.MeadowEndpointVersion||'1.0';// Pull endpoint name from settings if the user to override the endpoint "name" eventually.
this.EndpointName=this.DAL.scope;// This allows a wily developer to change what this prefix is....
this.EndpointPrefix=`/${this.EndpointVersion}/${this.EndpointName}`;// The default behavior sets available.
// Turning these off before wiring the endpoints up will result in their counterpart endpoints not being available.
this._EnabledBehaviorSets={Create:true,Read:true,Reads:true,Update:true,Delete:true,Count:true,Schema:true,Validate:true,New:true};// The default endpoints
this._Endpoints={Create:require('./endpoints/create/Meadow-Endpoint-Create.js'),Creates:require('./endpoints/create/Meadow-Endpoint-BulkCreate.js'),Read:require('./endpoints/read/Meadow-Endpoint-Read.js'),ReadMax:require('./endpoints/read/Meadow-Endpoint-ReadMax.js'),Reads:require('./endpoints/read/Meadow-Endpoint-Reads.js'),ReadsBy:require('./endpoints/read/Meadow-Endpoint-ReadsBy.js'),ReadSelectList:require('./endpoints/read/Meadow-Endpoint-ReadSelectList.js'),ReadLiteList:require('./endpoints/read/Meadow-Endpoint-ReadLiteList.js'),ReadDistinctList:require('./endpoints/read/Meadow-Endpoint-ReadDistinctList.js'),Update:require('./endpoints/update/Meadow-Endpoint-Update.js'),Updates:require('./endpoints/update/Meadow-Endpoint-BulkUpdate.js'),Upsert:require('./endpoints/upsert/Meadow-Endpoint-Upsert.js'),Upserts:require('./endpoints/upsert/Meadow-Endpoint-BulkUpsert.js'),Delete:require('./endpoints/delete/Meadow-Endpoint-Delete.js'),Undelete:require('./endpoints/delete/Meadow-Endpoint-Undelete.js'),Count:require('./endpoints/count/Meadow-Endpoint-Count.js'),CountBy:require('./endpoints/count/Meadow-Endpoint-CountBy.js'),// Get the JSONSchema spec schema
/* http://json-schema.org/examples.html
			 * http://json-schema.org/latest/json-schema-core.html
			 */Schema:require('./endpoints/schema/Meadow-Endpoint-Schema.js'),// Validate a passed-in JSON object for if it matches the schema
Validate:require('./endpoints/schema/Meadow-Endpoint-Validate.js'),// Get an empty initialized JSON object for this.
New:require('./endpoints/schema/Meadow-Endpoint-New.js')};}get controller(){return this._Controller;}set controller(pController){this._Controller=pController;}/**
	* Customize a default endpoint (or create more)
	*
	* @method setEndpoint
	*/setBehaviorEndpoint(pEndpointHash,fEndpoint){if(typeof fEndpoint==='function'){this._Endpoints[pEndpointHash]=fEndpoint;}return this;}connectRoute(pServiceServer,pRequestMethod,pRoutePartial,pEndpointProcessingFunction,pBehaviorName){let tmpRoute=`${this.EndpointPrefix}${pRoutePartial}`;let tmpBehaviorName=typeof pBehaviorName=='string'?pBehaviorName:'an unnamed custom behavior';this._Controller.log.trace(`...meadow-endpoints mapping a ${pRequestMethod} endpoint for scope ${this.DAL.scope} on route [${tmpRoute}] which runs ${tmpBehaviorName}.`);try{pServiceServer[pRequestMethod](tmpRoute,pEndpointProcessingFunction.bind(this._Controller));}catch(pServiceServerRouteConnectError){this._Controller.log.error(`...error mapping ${pBehaviorName} to method ${pRequestMethod} for scope ${this.DAL.scope} to route [${tmpRoute}]: ${pServiceServerRouteConnectError}`,pServiceServerRouteConnectError.stack);}return true;}connectRoutes(pServiceServer){this._Controller.log.trace(`Creating automatic meadow endpoints at prefix [${this.EndpointPrefix}] for scope ${this.DAL.scope}...`);// These special schema services must come in the route table before the READ because they
// technically block out the routes for the IDRecord 'Schema' (e.g. GET[/1.0/EntityName/Schema] ==NEEDS=> GET[/1.0/EntityName/100])
if(this._EnabledBehaviorSets.Schema){this.connectRoute(pServiceServer,'get',`/Schema`,this._Endpoints.Schema,`the internal behavior _Endpoints.Schema`);}if(this._EnabledBehaviorSets.New){this.connectRoute(pServiceServer,'get',`/Schema/New`,this._Endpoints.New,`the internal behavior _Endpoints.New`);}if(this._EnabledBehaviorSets.Validate){this.connectRoute(pServiceServer,'post',`/Schema/Validate`,this._Endpoints.Validate,`the internal behavior _Endpoints.Validate`);}// Standard CRUD and Count endpoints
if(this._EnabledBehaviorSets.Create){this.connectRoute(pServiceServer,'post',``,this._Endpoints.Create,`the internal behavior _Endpoints.Create`);this.connectRoute(pServiceServer,'post',`s`,this._Endpoints.Creates,`the internal behavior _Endpoints.Creates`);}if(this._EnabledBehaviorSets.Read){this.connectRoute(pServiceServer,'get',`/Max/:ColumnName`,this._Endpoints.ReadMax,`the internal behavior _Endpoints.ReadMax`);this.connectRoute(pServiceServer,'get',`/:IDRecord`,this._Endpoints.Read,`the internal behavior _Endpoints.Read`);}if(this._EnabledBehaviorSets.Reads){this.connectRoute(pServiceServer,'get',`s`,this._Endpoints.Reads,`the internal behavior _Endpoints.Reads`);this.connectRoute(pServiceServer,'get',`s/By/:ByField/:ByValue`,this._Endpoints.ReadsBy,`the internal behavior _Endpoints.ReadsBy`);this.connectRoute(pServiceServer,'get',`s/By/:ByField/:ByValue/:Begin/:Cap`,this._Endpoints.ReadsBy,`the internal behavior _Endpoints.ReadsBy`);this.connectRoute(pServiceServer,'get',`s/FilteredTo/:Filter`,this._Endpoints.Reads,`the internal behavior _Endpoints.Reads`);this.connectRoute(pServiceServer,'get',`s/FilteredTo/:Filter/:Begin/:Cap`,this._Endpoints.Reads,`the internal behavior _Endpoints.Reads`);this.connectRoute(pServiceServer,'get',`Select`,this._Endpoints.ReadSelectList,`the internal behavior _Endpoints.ReadSelectList`);this.connectRoute(pServiceServer,'get',`Select/FilteredTo/:Filter`,this._Endpoints.ReadSelectList,`the internal behavior _Endpoints.ReadSelectList`);this.connectRoute(pServiceServer,'get',`Select/FilteredTo/:Filter/:Begin/:Cap`,this._Endpoints.ReadSelectList,`the internal behavior _Endpoints.ReadSelectList`);this.connectRoute(pServiceServer,'get',`Select/:Begin/:Cap`,this._Endpoints.ReadSelectList,`the internal behavior _Endpoints.ReadSelectList`);this.connectRoute(pServiceServer,'get',`s/Lite`,this._Endpoints.ReadLiteList,`the internal behavior _Endpoints.ReadLiteList`);this.connectRoute(pServiceServer,'get',`s/Lite/FilteredTo/:Filter`,this._Endpoints.ReadLiteList,`the internal behavior _Endpoints.ReadLiteList`);this.connectRoute(pServiceServer,'get',`s/Lite/FilteredTo/:Filter/:Begin/:Cap`,this._Endpoints.ReadLiteList,`the internal behavior _Endpoints.ReadLiteList`);this.connectRoute(pServiceServer,'get',`s/Lite/:Begin/:Cap`,this._Endpoints.ReadLiteList,`the internal behavior _Endpoints.ReadLiteList`);this.connectRoute(pServiceServer,'get',`s/LiteExtended/:ExtraColumns`,this._Endpoints.ReadLiteList,`the internal behavior _Endpoints.ReadLiteList`);this.connectRoute(pServiceServer,'get',`s/LiteExtended/:ExtraColumns/FilteredTo/:Filter`,this._Endpoints.ReadLiteList,`the internal behavior _Endpoints.ReadLiteList`);this.connectRoute(pServiceServer,'get',`s/LiteExtended/:ExtraColumns/FilteredTo/:Filter/:Begin/:Cap`,this._Endpoints.ReadLiteList,`the internal behavior _Endpoints.ReadLiteList`);this.connectRoute(pServiceServer,'get',`s/LiteExtended/:ExtraColumns/:Begin/:Cap`,this._Endpoints.ReadLiteList,`the internal behavior _Endpoints.ReadLiteList`);this.connectRoute(pServiceServer,'get',`s/Distinct/:Columns`,this._Endpoints.ReadDistinctList,`the internal behavior _Endpoints.ReadDistinctList`);this.connectRoute(pServiceServer,'get',`s/Distinct/:Columns/FilteredTo/:Filter`,this._Endpoints.ReadDistinctList,`the internal behavior _Endpoints.ReadDistinctList`);this.connectRoute(pServiceServer,'get',`s/Distinct/:Columns/FilteredTo/:Filter/:Begin/:Cap`,this._Endpoints.ReadDistinctList,`the internal behavior _Endpoints.ReadDistinctList`);this.connectRoute(pServiceServer,'get',`s/Distinct/:Columns/:Begin/:Cap`,this._Endpoints.ReadDistinctList,`the internal behavior _Endpoints.ReadDistinctList`);this.connectRoute(pServiceServer,'get',`s/:Begin/:Cap`,this._Endpoints.Reads,`the internal behavior _Endpoints.Reads`);}if(this._EnabledBehaviorSets.Update){this.connectRoute(pServiceServer,'put',``,this._Endpoints.Update,`the internal behavior _Endpoints.Update`);this.connectRoute(pServiceServer,'put',`s`,this._Endpoints.Updates,`the internal behavior _Endpoints.Updates`);this.connectRoute(pServiceServer,'put',`/Upsert`,this._Endpoints.Upsert,`the internal behavior _Endpoints.Upsert`);this.connectRoute(pServiceServer,'put',`/Upserts`,this._Endpoints.Upserts,`the internal behavior _Endpoints.Upserts`);}if(this._EnabledBehaviorSets.Delete){this.connectRoute(pServiceServer,'del',``,this._Endpoints.Delete,`the internal behavior _Endpoints.Delete`);this.connectRoute(pServiceServer,'del',`/:IDRecord`,this._Endpoints.Delete,`the internal behavior _Endpoints.Delete`);this.connectRoute(pServiceServer,'get',`/Undelete/:IDRecord`,this._Endpoints.Undelete,`the internal behavior _Endpoints.Undelete`);}if(this._EnabledBehaviorSets.Count){this.connectRoute(pServiceServer,'get',`s/Count`,this._Endpoints.Count,`the internal behavior _Endpoints.Count`);this.connectRoute(pServiceServer,'get',`s/Count/By/:ByField/:ByValue`,this._Endpoints.CountBy,`the internal behavior _Endpoints.CountBy`);this.connectRoute(pServiceServer,'get',`s/Count/FilteredTo/:Filter`,this._Endpoints.Count,`the internal behavior _Endpoints.Count`);}}}// This is for backwards compatibility
function autoConstruct(pMeadow,pControllerOptions){return new MeadowEndpoints(pMeadow,pControllerOptions);}module.exports=MeadowEndpoints;module.exports.new=autoConstruct;module.exports.Meadow=libMeadow;module.exports.BaseController=libMeadowEndpointsControllerBase;},{"./controller/Meadow-Endpoints-Controller-Base.js":177,"./endpoints/count/Meadow-Endpoint-Count.js":184,"./endpoints/count/Meadow-Endpoint-CountBy.js":185,"./endpoints/create/Meadow-Endpoint-BulkCreate.js":186,"./endpoints/create/Meadow-Endpoint-Create.js":187,"./endpoints/delete/Meadow-Endpoint-Delete.js":189,"./endpoints/delete/Meadow-Endpoint-Undelete.js":190,"./endpoints/read/Meadow-Endpoint-Read.js":191,"./endpoints/read/Meadow-Endpoint-ReadDistinctList.js":192,"./endpoints/read/Meadow-Endpoint-ReadLiteList.js":193,"./endpoints/read/Meadow-Endpoint-ReadMax.js":194,"./endpoints/read/Meadow-Endpoint-ReadSelectList.js":195,"./endpoints/read/Meadow-Endpoint-Reads.js":196,"./endpoints/read/Meadow-Endpoint-ReadsBy.js":197,"./endpoints/schema/Meadow-Endpoint-New.js":200,"./endpoints/schema/Meadow-Endpoint-Schema.js":201,"./endpoints/schema/Meadow-Endpoint-Validate.js":202,"./endpoints/update/Meadow-Endpoint-BulkUpdate.js":203,"./endpoints/update/Meadow-Endpoint-Update.js":204,"./endpoints/upsert/Meadow-Endpoint-BulkUpsert.js":206,"./endpoints/upsert/Meadow-Endpoint-Upsert.js":207,"meadow":108}],177:[function(require,module,exports){const libAsyncWaterfall=require('async/waterfall');const libBaseLogController=require('./components/Meadow-Endpoints-Controller-Log.js');const libBaseErrorController=require('./components/Meadow-Endpoints-Controller-Error.js');const libBaseBehaviorInjectionController=require('./components/Meadow-Endpoints-Controller-BehaviorInjection.js');const libMeadowEndpointsFilterParser=require('./utility/Meadow-Endpoints-Filter-Parser.js');const libMeadowEndpointsSessionMarshaler=require('./utility/Meadow-Endpoints-Session-Marshaler.js');const libMeadowEndpointsStreamRecordArray=require('./utility/Meadow-Endpoints-Stream-RecordArray.js');class MeadowEndpointControllerBase{constructor(pMeadowEndpoints){this.DAL=pMeadowEndpoints.DAL;this.ControllerOptions=pMeadowEndpoints._ControllerOptions;// Application Services
this._Settings=false;this._LogController=false;// Logic and Behavior
this._BehaviorInjectionController=false;this._ErrorController=false;// Internal async utility functions
this.waterfall=this.DAL.fable.Utility.waterfall;this.eachLimit=this.DAL.fable.Utility.eachLimit;this.extend=this.DAL.fable.Utility.extend;if(typeof pControllerOptions!='object'||pControllerOptions.hasOwnProperty('ControllerClass')){this.initializeDefaultUnsetControllers(this);}// Behavior functions
this._FilterParser=new libMeadowEndpointsFilterParser(this);this._SessionMarshaler=new libMeadowEndpointsSessionMarshaler(this);this._StreamRecordArray=new libMeadowEndpointsStreamRecordArray(this);}initializeDefaultUnsetControllers(pController){// Application Services
if(!this._Settings){this._Settings=pController.DAL.fable.settings;}if(!this._Settings.hasOwnProperty('MeadowEndpointsDefaultSessionObject')){this._Settings.MeadowEndpointsDefaultSessionObject={CustomerID:0,SessionID:'0x0000',DeviceID:'Unset',UserID:0,UserRole:'None',UserRoleIndex:0,LoggedIn:false};}if(!this._LogController){this._LogController=new libBaseLogController(pController);}if(!this._BehaviorInjectionController){this._BehaviorInjectionController=new libBaseBehaviorInjectionController(pController);}if(!this._ErrorController){this._ErrorController=new libBaseErrorController(pController);}}initializeRequestState(pRequest,pVerb){let tmpRequestState={};tmpRequestState.Verb=typeof pVerb=='string'?pVerb:'Unnamed_Custom_Behavior';tmpRequestState.SessionData=this.getSessionData(pRequest);return tmpRequestState;}// Clone the session data and verb to a new request state object
cloneAsyncSafeRequestState(pRequestState,pNewVerb){let tmpSafeRequestState={ParentRequestState:pRequestState,SessionData:pRequestState.SessionData};tmpSafeRequestState.Verb=typeof pNewVerb=='string'?pVerb:pRequestState.Verb;return tmpSafeRequestState;}// Override this to provide an alternate ending function that is run with every endpoint.
_BeginDataRequestFunction(pRequest,pResponse,fNext){return fNext();}beginMeadowRequest(pRequest,pResponse,fNext){this._BeginDataRequestFunction(pRequest,pResponse,fNext);}// Override this to provide an alternate ending function that is run with every endpoint.
_EndDataRequestFunction(pRequest,pResponse,fNext){return fNext();}endMeadowRequest(pRequest,pResponse,fNext){this._EndDataRequestFunction(pRequest,pResponse,fNext);}// Application Services
get settings(){return this._Settings;}set settings(pSettings){this._Settings=pSettings;}get log(){return this._LogController;}set log(pLogController){this._LogController=pLogController;}// Logic and Behavior
get BehaviorInjection(){return this._BehaviorInjectionController;}set BehaviorInjection(pBehaviorInjectionController){this._BehaviorInjectionController=pBehaviorInjectionController;}get ErrorHandler(){return this._ErrorController;}set ErrorHandler(pErrorController){this._ErrorController=pErrorController;}parseFilter(pFilterString,pQuery){return this._FilterParser.parseFilter(pFilterString,pQuery);}doStreamRecordArray(pResponse,pRecords,fCallback){return this._StreamRecordArray.streamRecordArray(pResponse,pRecords,fCallback);}getSessionData(pRequest){return this._SessionMarshaler.getSessionData(pRequest);}}module.exports=MeadowEndpointControllerBase;// Export the base classes for the controller components, for inheritance
module.exports.BaseErrorController=libBaseErrorController;module.exports.BaseBehaviorInjectionController=libBaseBehaviorInjectionController;module.exports.BaseFilterParser=libMeadowEndpointsFilterParser;module.exports.BaseSessionMarshaler=libMeadowEndpointsSessionMarshaler;module.exports.BaseStreamRecordArray=libMeadowEndpointsStreamRecordArray;},{"./components/Meadow-Endpoints-Controller-BehaviorInjection.js":178,"./components/Meadow-Endpoints-Controller-Error.js":179,"./components/Meadow-Endpoints-Controller-Log.js":180,"./utility/Meadow-Endpoints-Filter-Parser.js":181,"./utility/Meadow-Endpoints-Session-Marshaler.js":182,"./utility/Meadow-Endpoints-Stream-RecordArray.js":183,"async/waterfall":17}],178:[function(require,module,exports){class MeadowEndpointsControllerBehaviorInjectionBase{constructor(pController){this._Controller=pController;// The template compilation function
this.template=this._Controller.DAL.fable.Utility.template;// An object to hold modifications to specific behaviors.
this._BehaviorFunctions={};// A set of objects to hold the specific templates and their compiled functions
this._Templates={};this._TemplateFunctions={};}/**
	* Set a specific behavior.
	*
	* The anatomy of a behavior function is as follows:
	*
	* var someBehavior = function(pRequest, fCallback)
	* {
	*      // Do some stuff with pRequest...
	*      if (pRequest.UserSession.UserRoleIndex < 5)
	*          tmpRequestState.Query.addFilter('Customer', pRequest.UserSession.IDCustomer);
	*      return fCallback(false);
	* }
	*
	* It is important to note that the fCallback function expects false if no error, or a string message if there is one.
	*/setBehavior(pBehaviorHash,fBehavior){this._BehaviorFunctions[pBehaviorHash]=fBehavior;}/**
	* This method runs a behavior at a specific hash, and returns true.
	* Or it returns false if there was no behavior there.
	* Behaviors should expect their state to be in the pRequest object, per the example in setBehavior
	*/runBehavior(pBehaviorHash,pController,pRequest,pRequestState,fCallback){// Run an injected behavior (if it exists)
if(this._BehaviorFunctions.hasOwnProperty(pBehaviorHash)){try{// Call the behavior with the scoped [this] of the Meadow behavior
// NOTE: If you define a behavior with lambda arrow syntax, it will *not* respect the call
return this._BehaviorFunctions[pBehaviorHash].call(pController,pRequest,pRequestState,fCallback);}catch(pInjectedBehaviorError){return fCallback(pInjectedBehaviorError);}}return fCallback();}/**
	* Get a template.
	*/getTemplate(pTemplateHash){if(this._Templates.hasOwnProperty(pTemplateHash)){return this._Templates[pTemplateHash];}else{return false;}}/**
	* Set a template.
	*/setTemplate(pTemplateHash,pTemplate){// Store both the cached text as well as the function
this._Templates[pTemplateHash]=pTemplate;this._TemplateFunctions[pTemplateHash]=this.template(pTemplate);}/**
	* Get a template function.
	*/getTemplateFunction(pTemplateHash){if(this._TemplateFunctions.hasOwnProperty(pTemplateHash)){return this._TemplateFunctions[pTemplateHash];}else{return false;}}/**
	* Process a template at a hash, and return the result.
	*/processTemplate(pTemplateHash,pTemplateData,pDefaultTemplate){var tmpTemplateFunction=this.getTemplateFunction(pTemplateHash);var tmpTemplateData=typeof pTemplateData==='undefined'?{}:pTemplateData;// This makes the function fairly laziliy loading.
if(tmpTemplateFunction===false){// If the template doesn't exist, try to use the passed-in default and set that as the template.
// Otherwise make it empty.
this.setTemplate(pTemplateHash,typeof pDefaultTemplate==='undefined'?'':pDefaultTemplate);tmpTemplateFunction=this.getTemplateFunction(pTemplateHash);}// Now process and return the underscore template.
return tmpTemplateFunction(tmpTemplateData);}}module.exports=MeadowEndpointsControllerBehaviorInjectionBase;},{}],179:[function(require,module,exports){class MeadowEndpointsControllerErrorBase{constructor(pController){this._Controller=pController;}// Get the error object
getError(pMessage,pStatusCode,pSuppressSoftwareTrace){let tmpError=new Error(pMessage);// Default the error status code to 400 if none is passed
tmpError.StatusCode=typeof pStatusCode=='number'?pStatusCode:400;// This suppresses the stack trace from being sent back or logged.
// And by default it does not send a stack trace, as we expect errors created this way to be protocol, schema or data related.
tmpError.SuppressSoftwareTrace=typeof pSuppressSoftwareTrace!='undefined'?pSuppressSoftwareTrace:true;return tmpError;}// Handle an error if set -- some errors don't send the response back because they aren't fully errory errors.
handleErrorIfSet(pRequest,pRequestState,pResponse,pError,fCallback){if(pError){return this.sendError(pRequest,pRequestState,pResponse,pError,fCallback);}return fCallback();}// Send an error object
sendError(pRequest,pRequestState,pResponse,pError,fCallback){this._Controller.log.logRequestError(pRequest,pRequestState,pError);// TODO: Detect if we've already sent headers?
if(!this._Controller.ControllerOptions.SendErrorStatusCodes){let tmpStatusCode=pError.hasOwnProperty('StatusCode')?pError.StatusCode:500;pResponse.status(tmpStatusCode);}let tmpResponseObject={Error:pError.message,StatusCode:pError.StatusCode};tmpResponseObject=this._Controller.ErrorHandler.prepareRequestContextOutputObject(tmpResponseObject,pRequest,pRequestState,pError);pResponse.send(tmpResponseObject);fCallback(pError);}// This looks for some generic markers in the request state and puts them into a log or send object
prepareRequestContextOutputObject(pObjectToPopulate,pRequest,pRequestState,pError){// Internally created errors supress stack traces
if(pError){pObjectToPopulate.Error=pError.message;pObjectToPopulate.Code=pError.code;pObjectToPopulate.StatusCode=pError.StatusCode;if(!pError.SuppressSoftwareTrace){pObjectToPopulate.Stack=pError.stack;}if(pRequestState.hasOwnProperty('Record')){pObjectToPopulate.Record=pRequestState.Record;}if(pRequestState.hasOwnProperty('Query')&&typeof pRequestState.Query=='object'){if(pRequestState.Query.query){if(typeof pRequestState.Query.query.body=='string'){pObjectToPopulate.Query=pRequestState.Query.query.body;}if(typeof pRequestState.Query.query.parameters=='object'){pObjectToPopulate.QueryParameters=pRequestState.Query.query.parameters;pObjectToPopulate.RebuiltQueryString=typeof pObjectToPopulate.Query=='string'?pObjectToPopulate.Query:'';// This gnarly bit of code attempts to reconstruct a non prepared string version of the query, to help.
let tmpQueryParameterSet=Object.keys(pObjectToPopulate.QueryParameters);for(let i=0;i<tmpQueryParameterSet.length;i++){switch(typeof tmpQueryParameterSet[i]){case'number':pObjectToPopulate.RebuiltQueryString=pObjectToPopulate.RebuiltQueryString.replace(new RegExp(`:${tmpQueryParameterSet[i]}\\b`,'g'),`'${pObjectToPopulate.QueryParameters[tmpQueryParameterSet[i]]}'`);break;case'string':// TODO: This may need more ... nuance...
default:pObjectToPopulate.RebuiltQueryString=pObjectToPopulate.RebuiltQueryString.replace(new RegExp(`:${tmpQueryParameterSet[i]}\\b`,'g'),pObjectToPopulate.QueryParameters[tmpQueryParameterSet[i]]);break;}}}}}}return pObjectToPopulate;}}module.exports=MeadowEndpointsControllerErrorBase;},{}],180:[function(require,module,exports){class MeadowEndpointsControllerLogBase{constructor(pController){this._Controller=pController;}// This is called whenever an endpoint is completed successfully
requestCompletedSuccessfully(pRequest,pRequestState,pActionSummary){this._Controller.log.info(pActionSummary,{SessionID:pRequestState.SessionData.SessionID,RequestID:pRequest.RequestUUID,RequestURL:pRequest.url,Scope:this._Controller.DAL.scope,Action:`${this._Controller.DAL.scope}-${pRequestState.Verb}`,Verb:pRequestState.Verb});}// This is called whenever an endpoint is completed successfully
logRequestError(pRequest,pRequestState,pError){let tmpErrorLogData={SessionID:pRequestState.SessionData.SessionID,RequestID:pRequest.RequestUUID,RequestURL:pRequest.url,Scope:this._Controller.DAL.scope,Action:`${this._Controller.DAL.scope}-${pRequestState.Verb}`,Verb:pRequestState.Verb};tmpErrorLogData=this._Controller.ErrorHandler.prepareRequestContextOutputObject(tmpErrorLogData,pRequest,pRequestState,pError);this._Controller.log.error(pError.message,tmpErrorLogData);}trace(pLogText,pLogObject){this._Controller.DAL.log.trace(pLogText,pLogObject);}debug(pLogText,pLogObject){this._Controller.DAL.log.debug(pLogText,pLogObject);}info(pLogText,pLogObject){this._Controller.DAL.log.info(pLogText,pLogObject);}warn(pLogText,pLogObject){this._Controller.DAL.log.warn(pLogText,pLogObject);}error(pLogText,pLogObject){this._Controller.DAL.log.error(pLogText,pLogObject);}fatal(pLogText,pLogObject){this._Controller.DAL.log.fatal(pLogText,pLogObject);}}module.exports=MeadowEndpointsControllerLogBase;},{}],181:[function(require,module,exports){/**
* Meadow Endpoint Utility Class - Parse a Filter String and put it into a Query.
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/ /**
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
*/class MeadowEndpointsFilterParser{constructor(pController){this._Controller=pController;}// Get the comparison operator for use in a query stanza
getFilterComparisonOperator(pFilterOperator){let tmpOperator='=';switch(pFilterOperator){case'EQ':tmpOperator='=';break;case'NE':tmpOperator='!=';break;case'GT':tmpOperator='>';break;case'GE':tmpOperator='>=';break;case'LT':tmpOperator='<';break;case'LE':tmpOperator='<=';break;case'LK':tmpOperator='LIKE';break;case'NLK':tmpOperator='NOT LIKE';break;case'IN':tmpOperator='IS NULL';break;case'NN':tmpOperator='IS NOT NULL';break;case'INN':tmpOperator='IN';break;case'FOP':tmpOperator='(';break;case'FCP':tmpOperator=')';break;}return tmpOperator;}addFilterStanzaToQuery(pFilterStanza,pQuery){if(!pFilterStanza.Instruction){return false;}switch(pFilterStanza.Instruction){case'FBV':// Filter by Value (left-side AND)
pQuery.addFilter(pFilterStanza.Field,pFilterStanza.Value,getFilterComparisonOperator(pFilterStanza.Operator),'AND');break;case'FBVOR':// Filter by Value (left-side OR)
pQuery.addFilter(pFilterStanza.Field,pFilterStanza.Value,getFilterComparisonOperator(pFilterStanza.Operator),'OR');break;case'FBL':// Filter by List (left-side AND)
// Just split the value by comma for now.  May want to revisit better characters or techniques later.
pQuery.addFilter(pFilterStanza.Field,pFilterStanza.Value.split(','),getFilterComparisonOperator(pFilterStanza.Operator),'AND');break;case'FBLOR':// Filter by List (left-side OR)
// Just split the value by comma for now.  May want to revisit better characters or techniques later.
pQuery.addFilter(pFilterStanza.Field,pFilterStanza.Value.split(','),getFilterComparisonOperator(pFilterStanza.Operator),'OR');break;case'FBD':// Filter by Date (exclude time)
pQuery.addFilter(`DATE(${pFilterStanza.Field})`,pFilterStanza.Value.split(','),getFilterComparisonOperator(pFilterStanza.Operator),'AND',pFilterStanza.Field);break;case'FBDOR':// Filter by Date (exclude time)
pQuery.addFilter(`DATE(${pFilterStanza.Field})`,pFilterStanza.Value.split(','),getFilterComparisonOperator(pFilterStanza.Operator),'OR',pFilterStanza.Field);break;case'FSF':// Filter Sort Field
const tmpSortDirection=pFilterStanza.Operator==='DESC'?'Descending':'Ascending';pQuery.addSort({Column:pFilterStanza.Field,Direction:tmpSortDirection});break;case'FOP':// Filter Open Paren
pQuery.addFilter('','','(');break;case'FCP':// Filter Close Paren
pQuery.addFilter('','',')');break;case'FDST':// Filter Distinct
// ensure we don't break if using an older foxhound version
if(pQuery.setDistinct){pQuery.setDistinct(true);}break;default://console.log('Unparsable filter stanza.');
return false;break;}// Be paranoid about the instruction
pFilterStanza.Instruction=false;return true;}parseFilter(pFilterString,pQuery){if(typeof pFilterString!=='string'){return false;}const tmpFilterTerms=pFilterString.split('~');if(tmpFilterTerms.length<4){return true;}let tmpFilterStanza={Instruction:false};for(let i=0;i<tmpFilterTerms.length;i++){switch(i%4){case 0:// INSTRUCTION
addFilterStanzaToQuery(tmpFilterStanza,pQuery);//console.log(i+' Instruction: '+tmpFilterTerms[i]);
tmpFilterStanza={Instruction:tmpFilterTerms[i],Field:'',Operator:'',Value:''};break;case 1:// FIELD
//console.log(i+' Field:       '+tmpFilterTerms[i]);
tmpFilterStanza.Field=tmpFilterTerms[i];break;case 2:// OPERATOR
//console.log(i+' Operator:    '+tmpFilterTerms[i]);
tmpFilterStanza.Operator=tmpFilterTerms[i];break;case 3:// VALUE
//console.log(i+' Value:       '+tmpFilterTerms[i]);
tmpFilterStanza.Value=tmpFilterTerms[i];break;}}this.addFilterStanzaToQuery(tmpFilterStanza,pQuery);return true;}}module.exports=MeadowEndpointsFilterParser;},{}],182:[function(require,module,exports){class MeadowEndpointsSessionMarshaler{constructor(pController){this._Controller=pController;}getSessionData(pRequest){let tmpSession=Object.assign({},this._Controller.settings.MeadowEndpointsDefaultSessionObject);switch(this._Controller.settings.MeadowEndpointsSessionDataSource||'Request'){default:this._LogController.warn(`Unknown session source configured: ${_SessionDataSource} - defaulting to Request for backward compatibility`);case'Request':// noop - already set by orator-session
tmpSession=this._Controller.extend(tmpSession,pRequest.UserSession);break;case'None':break;case'Header':try{const tmpHeaderSessionString=pRequest.headers['x-trusted-session'];if(!tmpHeaderSessionString){break;}tmpHeaderSession=JSON.parse(tmpHeaderSessionString);tmpSession=this._Controller.extend(tmpSession,pRequest.tmpHeaderSession);}catch(pError){this._LogController.error(`Meadow Endpoints attempted to process a Header Session String with value [${tmpHeaderSessionString}] and failed -- likely culprit is bad JSON.`);}break;}// Do we keep this here for backwards compatibility?
// Yes this makes sense here.
pRequest.UserSession=tmpSession;return tmpSession;}}module.exports=MeadowEndpointsSessionMarshaler;},{}],183:[function(require,module,exports){(function(setImmediate){(function(){/**
* Meadow Endpoint Streamer - Stream an array of recods as JSON to an output stream.
*/const libAsyncEachSeries=require('async/eachSeries');const JSONStream=require('JSONStream');class MeadowEndpointsStreamRecordArray{constructor(pController){this._Controller=pController;}chunk(pInput,pChunkSize,pChunkCache){let tmpInputArray=[...pInput];// Note lodash defaults to 1, underscore defaults to 0
let tmpChunkSize=typeof pChunkSize=='number'?pChunkSize:0;let tmpChunkCache=typeof pChunkCache!='undefined'?pChunkCache:[];if(tmpChunkSize<=0){return tmpChunkCache;}while(tmpInputArray.length){tmpChunkCache.push(tmpInputArray.splice(0,tmpChunkSize));}return tmpChunkCache;}streamRecordArray(pResponse,pRecords,fCallback){// for meadow invoke, writeHead isn't provided, so just call send(), which is the shim it uses...
// also, for small arrays, don't bother with the async serialization; this threshold could use tuning
if(!pResponse.writeHead||!Array.isArray(pRecords)||pRecords.length<2500){pResponse.send(pRecords);return fCallback();}pResponse.writeHead(200,{'content-type':'application/json'});const recordJsonMarshaller=JSONStream.stringify();recordJsonMarshaller.pipe(pResponse);// we write the records in chunks; doing one per loop is very inefficient, doing all is the same as not doing this at all
libAsyncEachSeries(this.chunk(pRecords,1000),(pRecordChunk,fNext)=>{pRecordChunk.forEach(recordJsonMarshaller.write);setImmediate(fNext);},error=>{recordJsonMarshaller.end();fCallback(error);});}}module.exports=MeadowEndpointsStreamRecordArray;}).call(this);}).call(this,require("timers").setImmediate);},{"JSONStream":1,"async/eachSeries":4,"timers":165}],184:[function(require,module,exports){/**
* Meadow Endpoint - Count a Record
*/const doAPIEndpointCount=function(pRequest,pResponse,fNext){let tmpRequestState=this.initializeRequestState(pRequest,'Count');let fBehaviorInjector=pBehaviorHash=>{return fStageComplete=>{this.BehaviorInjection.runBehavior(pBehaviorHash,this,pRequest,tmpRequestState,fStageComplete);};};this.waterfall([fStageComplete=>{tmpRequestState.Query=this.DAL.query;if(typeof pRequest.params.Filter==='string'){// If a filter has been passed in, parse it and add the values to the query.
this.parseFilter(pRequest.params.Filter,tmpRequestState.Query);}else if(pRequest.params.Filter){tmpRequestState.Query.setFilter(pRequest.params.Filter);}return fStageComplete();},fBehaviorInjector(`Count-QueryConfiguration`),fStageComplete=>{this.DAL.doCount(tmpRequestState.Query,(pError,pQuery,pCount)=>{tmpRequestState.Result={Count:pCount};return fStageComplete(pError);});},fStageComplete=>{pResponse.send(tmpRequestState.Result);this.log.requestCompletedSuccessfully(pRequest,tmpRequestState,`Delivered recordset count of ${tmpRequestState.Result.Count} for ${this.DAL.scope}.`);return fStageComplete();}],pError=>{return this.ErrorHandler.handleErrorIfSet(pRequest,tmpRequestState,pResponse,pError,fNext);});};module.exports=doAPIEndpointCount;},{}],185:[function(require,module,exports){/**
* Meadow Endpoint - Count a Record filtered by a single value
*/const doAPIEndpointCountBy=function(pRequest,pResponse,fNext){let tmpRequestState=this.initializeRequestState(pRequest,'CountBy');let fBehaviorInjector=pBehaviorHash=>{return fStageComplete=>{this.BehaviorInjection.runBehavior(pBehaviorHash,this,pRequest,tmpRequestState,fStageComplete);};};this.waterfall([fStageComplete=>{tmpRequestState.Query=this.DAL.query;tmpRequestState.Query.addFilter(pRequest.params.ByField,pRequest.params.ByValue,'=','AND','RequestByField');return fStageComplete();},fBehaviorInjector(`CountBy-QueryConfiguration`),fStageComplete=>{this.DAL.doCount(tmpRequestState.Query,(pError,pQuery,pCount)=>{tmpRequestState.Result={Count:pCount};return fStageComplete(pError);});},fStageComplete=>{this.log.requestCompletedSuccessfully(pRequest,tmpRequestState,'Delivered recordset count of '+tmpRequestState.Result.Count+'.');pResponse.send(tmpRequestState.Result);return fStageComplete();}],pError=>{return this.ErrorHandler.handleErrorIfSet(pRequest,tmpRequestState,pResponse,pError,fNext);});};module.exports=doAPIEndpointCountBy;},{}],186:[function(require,module,exports){/**
* Meadow Endpoint - Create a set of Record in Bulk
*/const doCreate=require('./Meadow-Operation-Create.js');const doAPIEndpointBulkCreate=function(pRequest,pResponse,fNext){let tmpRequestState=this.initializeRequestState(pRequest,'CreateBulk');let fBehaviorInjector=pBehaviorHash=>{return fStageComplete=>{this.BehaviorInjection.runBehavior(pBehaviorHash,this,pRequest,tmpRequestState,fStageComplete);};};tmpRequestState.CreatedRecords=[];this.waterfall([fStageComplete=>{if(!Array.isArray(pRequest.body)){return fStageComplete(this.ErrorHandler.getError('Bulk record create failure - a valid array of records to create is required.',500));}pRequest.RecordsToBulkCreate=pRequest.body;return fStageComplete();},fBehaviorInjector(`CreateBulk-PreOperation`),fStageComplete=>{libAsync.eachSeries(pRequest.RecordsToBulkCreate,(pRecord,fCallback)=>{doCreate.call(this,pRecord,pRequest,tmpRequestState,pResponse,fCallback);},fStageComplete);},fBehaviorInjector(`CreateBulk-PostOperation`),fStageComplete=>{return this.doStreamRecordArray(pResponse,tmpRequestState.CreatedRecords,fStageComplete);},fStageComplete=>{this.log.requestCompletedSuccessfully(pRequest,tmpRequestState,'Created a record with ID '+pNewRecord[this.DAL.defaultIdentifier]+'.');return fStageComplete();}],pError=>{return this.ErrorHandler.handleErrorIfSet(pRequest,tmpRequestState,pResponse,pError,fNext);});};module.exports=doAPIEndpointBulkCreate;},{"./Meadow-Operation-Create.js":188}],187:[function(require,module,exports){/**
* Meadow Endpoint - Create a Record
*/const doCreate=require('./Meadow-Operation-Create.js');const doAPIEndpointCreate=function(pRequest,pResponse,fNext){let tmpRequestState=this.initializeRequestState(pRequest,'Create');let fBehaviorInjector=pBehaviorHash=>{return fStageComplete=>{this.BehaviorInjection.runBehavior(pBehaviorHash,this,pRequest,tmpRequestState,fStageComplete);};};this.waterfall([fStageComplete=>{if(typeof pRequest.body!=='object'){return fStageComplete(this.ErrorHandler.getError('Record create failure - a valid record is required.',500));}return fStageComplete();},fStageComplete=>{doCreate.call(this,pRequest.body,pRequest,tmpRequestState,pResponse,fStageComplete);},fStageComplete=>{if(tmpRequestState.RecordCreateError){return fStageComplete(tmpRequestState.RecordCreateErrorObject);}return fStageComplete();},fStageComplete=>{pResponse.send(tmpRequestState.Record);return fStageComplete();},fStageComplete=>{this.log.requestCompletedSuccessfully(pRequest,tmpRequestState,`Created a ${this.DAL.scope} record ID ${tmpRequestState.Record.IDRecord}`);return fStageComplete();}],pError=>{return this.ErrorHandler.handleErrorIfSet(pRequest,tmpRequestState,pResponse,pError,fNext);});};module.exports=doAPIEndpointCreate;},{"./Meadow-Operation-Create.js":188}],188:[function(require,module,exports){/**
* Meadow Operation - Create a record function
*/const doCreate=function(pRecord,pRequest,pRequestState,pResponse,fCallback){// This is a virtual operation
let tmpRequestState=cloneAsyncSafeRequestState(pRequestState,'doCreate');let fBehaviorInjector=pBehaviorHash=>{return fStageComplete=>{this.BehaviorInjection.runBehavior(pBehaviorHash,this,pRequest,tmpRequestState,fStageComplete);};};if(!Array.isArray(tmpRequestState.ParentRequestState.CreatedRecords)){tmpRequestState.ParentRequestState.CreatedRecords=[];}this.waterfall([fStageComplete=>{tmpRequestState.RecordToCreate=pRecord;//Make sure record gets created with a customerID
if(!tmpRequestState.RecordToCreate.hasOwnProperty('IDCustomer')&&this.DAL.jsonSchema.properties.hasOwnProperty('IDCustomer')){tmpRequestState.RecordToCreate.IDCustomer=tmpRequestState.SessionData.CustomerID||0;}return fStageComplete();},fStageComplete=>{this.BehaviorInjection.runBehavior(`Create-PreOperation`,this,pRequest,tmpRequestState,fStageComplete);},fStageComplete=>{// Prepare create query
tmpRequestState.Query=this.DAL.query;tmpRequestState.Query.setIDUser(tmpRequestState.SessionData.UserID);tmpRequestState.Query.addRecord(tmpRequestState.RecordToCreate);return fStageComplete();},fStageComplete=>{this.BehaviorInjection.runBehavior(`Create-QueryConfiguration`,this,pRequest,tmpRequestState,fStageComplete);},fStageComplete=>{// Do the actual create operation with the DAL
this.DAL.doCreate(tmpRequestState.Query,(pError,pQuery,pReadQuery,pNewRecord)=>{if(pError){return fStageComplete(pError);}if(!pNewRecord){return fStageComplete(this.ErrorHandler.getError(`Error in DAL Create: No record returned from persistence engine.`,500));}tmpRequestState.Record=pNewRecord;return fStageComplete();});},fStageComplete=>{return this.BehaviorInjection.runBehavior(`Create-PostOperation`,this,pRequest,tmpRequestState,fStageComplete);},fStageComplete=>{tmpRequestState.ParentRequestState.CreatedRecords.push(tmpRequestState.Record);this.log.requestCompletedSuccessfully(pRequest,tmpRequestState,`Created a record with ${this.DAL.defaultIdentifier} = ${tmpRequestState.Record[this.DAL.defaultIdentifier]}`);return fStageComplete();}],pError=>{if(pError){tmpRequestState.RecordToCreate.Error=pError;tmpRequestState.ParentRequestState.RecordCreateError=true;tmpRequestState.ParentRequestState.RecordCreateErrorObject=pError;tmpRequestState.ParentRequestState.CreatedRecords.push(tmpRequestState.RecordToCreate);}return fCallback();});};module.exports=doCreate;},{}],189:[function(require,module,exports){/**
* Meadow Endpoint - Delete a Record
*/const doAPIEndpointDelete=function(pRequest,pResponse,fNext){let tmpRequestState=this.initializeRequestState(pRequest,'Delete');let fBehaviorInjector=pBehaviorHash=>{return fStageComplete=>{this.BehaviorInjection.runBehavior(pBehaviorHash,this,pRequest,tmpRequestState,fStageComplete);};};tmpRequestState.IDRecord=0;tmpRequestState.RecordCount={Count:0};this.waterfall([fStageComplete=>{if(typeof pRequest.params.IDRecord==='string'){tmpRequestState.IDRecord=pRequest.params.IDRecord;}else if(typeof pRequest.body[this.DAL.defaultIdentifier]==='number'){tmpRequestState.IDRecord=pRequest.body[this.DAL.defaultIdentifier];}else if(typeof pRequest.body[this.DAL.defaultIdentifier]==='string'){tmpRequestState.IDRecord=pRequest.body[this.DAL.defaultIdentifier];}// Although the Meadow delete behavior does allow multiple deletes, we require an identifier.
// If a developer wants bulk delete, it will require a custom endpoint.
if(tmpRequestState.IDRecord<1){return fStageComplete(this.ErrorHandler.getError('Record delete failure - a valid record ID is required in the passed-in record.',500));}return fStageComplete();},fStageComplete=>{tmpRequestState.Query=this.DAL.query;tmpRequestState.Query.addFilter(this.DAL.defaultIdentifier,tmpRequestState.IDRecord);tmpRequestState.Query.setIDUser(tmpRequestState.SessionData.UserID);return fStageComplete();},fStageComplete=>{return this.BehaviorInjection.runBehavior(`Delete-QueryConfiguration`,this,pRequest,tmpRequestState,fStageComplete);},fStageComplete=>{// Load the record so we can do security checks on it
this.DAL.doRead(tmpRequestState.Query,(pError,pQuery,pRecord)=>{if(!pRecord){return fStageComplete(this.ErrorHandler.getError('Record not found.',404));}tmpRequestState.Record=pRecord;return fStageComplete();});},fStageComplete=>{return this.BehaviorInjection.runBehavior(`Delete-PreOperation`,this,pRequest,tmpRequestState,fStageComplete);},fStageComplete=>{// Do the delete
this.DAL.doDelete(tmpRequestState.Query,(pError,pQuery,pCount)=>{// MySQL returns the number of rows deleted
tmpRequestState.RecordCount.Count=pCount;return fStageComplete(pError);});},fStageComplete=>{return this.BehaviorInjection.runBehavior(`Delete-PostOperation`,this,pRequest,tmpRequestState,fStageComplete);},fStageComplete=>{pResponse.send(tmpRequestState.RecordCount);this.log.requestCompletedSuccessfully(pRequest,tmpRequestState,`Deleted ${tmpRequestState.RecordCount.Count} ${this.DAL.scope} records with ID ${tmpRequestState.IDRecord}`);return fStageComplete();}],pError=>{return this.ErrorHandler.handleErrorIfSet(pRequest,tmpRequestState,pResponse,pError,fNext);});};module.exports=doAPIEndpointDelete;},{}],190:[function(require,module,exports){/**
* Meadow Endpoint - Undelete a Record
*/const doAPIEndpointUndelete=function(pRequest,pResponse,fNext){let tmpRequestState=this.initializeRequestState(pRequest,'Undelete');let fBehaviorInjector=pBehaviorHash=>{return fStageComplete=>{this.BehaviorInjection.runBehavior(pBehaviorHash,this,pRequest,tmpRequestState,fStageComplete);};};var tmpIDRecord=0;if(typeof pRequest.params.IDRecord==='string'){tmpIDRecord=pRequest.params.IDRecord;}else if(typeof pRequest.body[this.DAL.defaultIdentifier]==='number'){tmpIDRecord=pRequest.body[this.DAL.defaultIdentifier];}else if(typeof pRequest.body[this.DAL.defaultIdentifier]==='string'){tmpIDRecord=pRequest.body[this.DAL.defaultIdentifier];}// Although the undelete request does allow multiple undeletes, we require an identifier.
// TODO: Decide if we want to keep this pattern similar to Delete, or, if we want to change it to allow bulk undeletes.
if(tmpIDRecord<1){return fStageComplete(this.ErrorHandler.getError('Record undelete failure - a valid record ID is required.',500));}tmpRequestState.RecordCount={Count:0};this.waterfall([fStageComplete=>{// Validate that the schema has a deleted bit
var tmpSchema=this.DAL.schema;var tmpHasDeletedBit=false;for(let i=0;i<tmpSchema.length;i++){if(tmpSchema[i].Type=='Deleted'){tmpHasDeletedBit=true;}}if(!tmpHasDeletedBit){return fStageComplete(this.ErrorHandler.getError('No undelete bit on record.',500));}return fStageComplete();},fStageComplete=>{// Now see if the record, with this identifier, for this user, exists with the deleted bit set to 1
tmpRequestState.Query=this.DAL.query;tmpRequestState.Query.addFilter(this.DAL.defaultIdentifier,tmpIDRecord);tmpRequestState.Query.addFilter('Deleted',1);tmpRequestState.Query.setIDUser(tmpRequestState.SessionData.UserID);return fStageComplete();},fStageComplete=>{// Load the record so we can do security checks on it
this.DAL.doRead(tmpRequestState.Query,(pError,pQuery,pRecord)=>{if(!pRecord){return fStageComplete(this.ErrorHandler.getError('Record not found.',404));}tmpRequestState.Record=pRecord;return fStageComplete();});},fStageComplete=>{return this.BehaviorInjection.runBehavior(`Undelete-PreOperation`,this,pRequest,tmpRequestState,fStageComplete);},fStageComplete=>{// Do the undelete
this.DAL.doUndelete(tmpRequestState.Query,(pError,pQuery,pCount)=>{// MySQL returns the number of rows deleted
tmpRequestState.RecordCount={Count:pCount};return fStageComplete(pError);});},fStageComplete=>{return this.BehaviorInjection.runBehavior(`Undelete-PostOperation`,this,pRequest,tmpRequestState,fStageComplete);},fStageComplete=>{pResponse.send(tmpRequestState.RecordCount);this.log.requestCompletedSuccessfully(pRequest,tmpRequestState,'Undeleted '+tmpRequestState.RecordCount.Count+' records with ID '+tmpIDRecord+'.');return fStageComplete();}],pError=>{return this.ErrorHandler.handleErrorIfSet(pRequest,tmpRequestState,pResponse,pError,fNext);});};module.exports=doAPIEndpointUndelete;},{}],191:[function(require,module,exports){/**
* Meadow Endpoint - Read a Record
*/const doAPIEndpointRead=function(pRequest,pResponse,fNext){let tmpRequestState=this.initializeRequestState(pRequest,'Read');let fBehaviorInjector=pBehaviorHash=>{return fStageComplete=>{this.BehaviorInjection.runBehavior(pBehaviorHash,this,pRequest,tmpRequestState,fStageComplete);};};this.waterfall([fStageComplete=>{tmpRequestState.Query=this.DAL.query;return fStageComplete();},fBehaviorInjector(`Read-PreOperation`),fStageComplete=>{if(!pRequest.params.IDRecord&&pRequest.params.GUIDRecord){// We use a custom name for this (RequestDefaultIdentifier) in case there is a query with a dot in the default identifier.
tmpRequestState.RecordSearchCriteria=`${this.DAL.defaultGUIdentifier} = ${pRequest.params.GUIDRecord}`;tmpRequestState.Query.addFilter(this.DAL.defaultGUIdentifier,pRequest.params.GUIDRecord,'=','AND','RequestDefaultIdentifier');}else if(pRequest.params.IDRecord){// We use a custon name for this (RequestDefaultIdentifier) in case there is a query with a dot in the default identifier.
tmpRequestState.RecordSearchCriteria=`${this.DAL.defaultIdentifier} = ${pRequest.params.IDRecord}`;tmpRequestState.Query.addFilter(this.DAL.defaultIdentifier,pRequest.params.IDRecord,'=','AND','RequestDefaultIdentifier');}else{return fStageComplete(this.ErrorHandler.getError('No ID Provided',400));}return fStageComplete();},fBehaviorInjector(`Read-QueryConfiguration`),fStageComplete=>{try{this.DAL.doRead(tmpRequestState.Query,(pError,pQuery,pRecord)=>{if(!pRecord){return fStageComplete(this.ErrorHandler.getError('Record not Found',404));}tmpRequestState.Record=pRecord;return fStageComplete();});}catch(pQueryError){return fStageComplete(pQueryError);}},fBehaviorInjector(`Read-PostOperation`),fStageComplete=>{pResponse.send(tmpRequestState.Record);this.log.requestCompletedSuccessfully(pRequest,tmpRequestState,`Read Record Where ${tmpRequestState.RecordSearchCriteria}`);return fStageComplete();}],pError=>{return this.ErrorHandler.handleErrorIfSet(pRequest,tmpRequestState,pResponse,pError,fNext);});};module.exports=doAPIEndpointRead;},{}],192:[function(require,module,exports){/**
* Meadow Endpoint - Read a list of Records with a specified set of columns, distinct by those columns.
*/const marshalDistinctList=require('./Meadow-Marshal-DistinctList.js');const doAPIEndpointReadDistinct=function(pRequest,pResponse,fNext){let tmpRequestState=this.initializeRequestState(pRequest,'ReadDistinct');let fBehaviorInjector=pBehaviorHash=>{return fStageComplete=>{this.BehaviorInjection.runBehavior(pBehaviorHash,this,pRequest,tmpRequestState,fStageComplete);};};tmpRequestState.DistinctColumns;this.waterfall([fStageComplete=>{tmpRequestState.Query=this.DAL.query.setDistinct(true);let tmpCap=false;let tmpBegin=false;if(typeof pRequest.params.Begin==='string'||typeof pRequest.params.Begin==='number'){tmpBegin=parseInt(pRequest.params.Begin,10);}if(typeof pRequest.params.Cap==='string'||typeof pRequest.params.Cap==='number'){tmpCap=parseInt(pRequest.params.Cap,10);}else{//maximum number of records to return by default on Read queries. Override via "MeadowDefaultMaxCap" fable setting.
tmpCap=this.settings['MeadowDefaultMaxCap']||250;}tmpRequestState.Query.setCap(tmpCap).setBegin(tmpBegin);if(typeof pRequest.params.Filter==='string'){// If a filter has been passed in, parse it and add the values to the query.
this.parseFilter(pRequest.params.Filter,tmpRequestState.Query);}else if(pRequest.params.Filter){tmpRequestState.Query.setFilter(pRequest.params.Filter);}if(typeof pRequest.params.Columns==='string'){tmpRequestState.DistinctColumns=pRequest.params.Columns.split(',');if(!tmpRequestState.DistinctColumns){return fStageComplete({Code:400,Message:'Columns to distinct on must be provided.'});}tmpRequestState.Query.setDataElements(tmpRequestState.DistinctColumns);}return fStageComplete();},fBehaviorInjector(`Reads-QueryConfiguration`),fStageComplete=>{this.DAL.doReads(tmpRequestState.Query,fStageComplete);},(pQuery,pRecords,fStageComplete)=>{if(pRecords.length<1){pRecords=[];}tmpRequestState.Records=pRecords;return fStageComplete();},fStageComplete=>{tmpRequestState.ResultRecords=marshalDistinctList.call(this,tmpRequestState.Records,pRequest,tmpRequestState.DistinctColumns);return fStageComplete();},fStageComplete=>{return this.doStreamRecordArray(pResponse,tmpRequestState.ResultRecords,fStageComplete);},fStageComplete=>{this.log.requestCompletedSuccessfully(pRequest,tmpRequestState,`Read a recordset distinct lite list with ${tmpRequestState.ResultRecords.length} results.`);return fStageComplete();}],pError=>{return this.ErrorHandler.handleErrorIfSet(pRequest,tmpRequestState,pResponse,pError,fNext);});};module.exports=doAPIEndpointReadDistinct;},{"./Meadow-Marshal-DistinctList.js":198}],193:[function(require,module,exports){/**
* Meadow Endpoint - Read a list of lite Records (for Drop-downs and such)
*/const marshalLiteList=require('./Meadow-Marshal-LiteList.js');const doAPIEndpointReadLite=function(pRequest,pResponse,fNext){let tmpRequestState=this.initializeRequestState(pRequest,'ReadsLite');let fBehaviorInjector=pBehaviorHash=>{return fStageComplete=>{this.BehaviorInjection.runBehavior(pBehaviorHash,this,pRequest,tmpRequestState,fStageComplete);};};this.waterfall([// 1a. Get the records
fStageComplete=>{tmpRequestState.Query=this.DAL.query;// TODO: Limit the query to the columns we need for the templated expression
var tmpCap=false;var tmpBegin=false;if(typeof pRequest.params.Begin==='string'||typeof pRequest.params.Begin==='number'){tmpBegin=parseInt(pRequest.params.Begin,10);}if(typeof pRequest.params.Cap==='string'||typeof pRequest.params.Cap==='number'){tmpCap=parseInt(pRequest.params.Cap,10);}else{//maximum number of records to return by default on Read queries. Override via "MeadowDefaultMaxCap" fable setting.
tmpCap=this.settings['MeadowDefaultMaxCap']||250;}tmpRequestState.Query.setCap(tmpCap).setBegin(tmpBegin);if(typeof pRequest.params.Filter==='string'){// If a filter has been passed in, parse it and add the values to the query.
this.parseFilter(pRequest.params.Filter,tmpRequestState.Query);}else if(pRequest.params.Filter){tmpRequestState.Query.setFilter(pRequest.params.Filter);}return fStageComplete();},fBehaviorInjector(`Reads-QueryConfiguration`),fStageComplete=>{this.DAL.doReads(tmpRequestState.Query,fStageComplete);},(pQuery,pRecords,fStageComplete)=>{if(pRecords.length<1){pRecords=[];}tmpRequestState.RawRecords=pRecords;return fStageComplete();},fStageComplete=>{tmpRequestState.Records=marshalLiteList.call(this,tmpRequestState.RawRecords,pRequest,typeof pRequest.params.ExtraColumns==='string'?pRequest.params.ExtraColumns.split(','):[]);return fStageComplete();},fStageComplete=>{return this.doStreamRecordArray(pResponse,tmpRequestState.Records,fNext);},fStageComplete=>{this.log.requestCompletedSuccessfully(pRequest,tmpRequestState,`Read a recordset lite list with ${tmpRequestState.Records.length} results`);return fStageComplete();}],(pError,pResultRecords)=>{return this.ErrorHandler.handleErrorIfSet(pRequest,tmpRequestState,pResponse,pError,fNext);});};module.exports=doAPIEndpointReadLite;},{"./Meadow-Marshal-LiteList.js":199}],194:[function(require,module,exports){/**
* Meadow Endpoint - Read the Max Value of a Column in a Set
*/const doAPIEndpointReadMax=function(pRequest,pResponse,fNext){let tmpRequestState=this.initializeRequestState(pRequest,'ReadMax');let fBehaviorInjector=pBehaviorHash=>{return fStageComplete=>{this.BehaviorInjection.runBehavior(pBehaviorHash,this,pRequest,tmpRequestState,fStageComplete);};};this.waterfall([fStageComplete=>{tmpRequestState.Query=this.DAL.query;return fStageComplete();},fStageComplete=>{tmpRequestState.ColumnName=pRequest.params.ColumnName;tmpRequestState.Query.setSort({Column:tmpRequestState.ColumnName,Direction:'Descending'});tmpRequestState.Query.setCap(1);return fStageComplete();},fBehaviorInjector(`ReadMax-QueryConfiguration`),fStageComplete=>{this.DAL.doRead(tmpRequestState.Query,fStageComplete);},(pQuery,pRecord,fStageComplete)=>{if(!pRecord){return fStageComplete(this.ErrorHandler.getError('Record not Found',404));}tmpRequestState.Record=pRecord;return fStageComplete();},fStageComplete=>{this.BehaviorInjection.runBehavior(`ReadMax-PostOperation`,this,pRequest,tmpRequestState,fStageComplete);},fStageComplete=>{this.log.requestCompletedSuccessfully(pRequest,tmpRequestState,`Read max record of ${this.DAL.scope} on ${tmpRequestState.ColumnName}`);pResponse.send(tmpRequestState.Record);}],pError=>{return this.ErrorHandler.handleErrorIfSet(pRequest,tmpRequestState,pResponse,pError,fNext);});};module.exports=doAPIEndpointReadMax;},{}],195:[function(require,module,exports){/**
* Meadow Endpoint - Read a select list of Records (for Drop-downs and such)
*/const doAPIEndpointReadSelectList=function(pRequest,pResponse,fNext){let tmpRequestState=this.initializeRequestState(pRequest,'ReadsBy');let fBehaviorInjector=pBehaviorHash=>{return fStageComplete=>{this.BehaviorInjection.runBehavior(pBehaviorHash,this,pRequest,tmpRequestState,fStageComplete);};};this.waterfall([fStageComplete=>{tmpRequestState.Query=this.DAL.query;var tmpCap=false;var tmpBegin=false;if(typeof pRequest.params.Begin==='string'||typeof pRequest.params.Begin==='number'){tmpBegin=parseInt(pRequest.params.Begin);}if(typeof pRequest.params.Cap==='string'||typeof pRequest.params.Cap==='number'){tmpCap=parseInt(pRequest.params.Cap);}else{tmpCap=this.settings['MeadowDefaultMaxCap']||250;}tmpRequestState.Query.setCap(tmpCap).setBegin(tmpBegin);if(typeof pRequest.params.Filter==='string'){this.parseFilter(pRequest.params.Filter,tmpRequestState.Query);}return fStageComplete();},fBehaviorInjector(`Reads-QueryConfiguration`),fStageComplete=>{this.DAL.doReads(tmpRequestState.Query,fStageComplete);},(pQuery,pRecords,fStageComplete)=>{if(pRecords.length<1){pRecords=[];}tmpRequestState.Records=pRecords;return fStageComplete();},fStageComplete=>{tmpRequestState.SelectList=[];for(var i=0;i<tmpRequestState.Records.length;i++){tmpRequestState.SelectList.push({Hash:tmpRequestState.Records[i][this.DAL.defaultIdentifier],Value:this.BehaviorInjection.processTemplate('SelectList',{Record:tmpRequestState.Records[i]},this.DAL.scope+' #<%= Record.'+this.DAL.defaultIdentifier+'%>')});}return fStageComplete();},fStageComplete=>{return this.doStreamRecordArray(pResponse,tmpRequestState.SelectList,fStageComplete);},fStageComplete=>{this.log.requestCompletedSuccessfully(pRequest,tmpRequestState,`Read a recordset lite list with ${tmpRequestState.SelectList.length} results.`);return fStageComplete();}],(pError,pResultRecords)=>{return this.ErrorHandler.handleErrorIfSet(pRequest,tmpRequestState,pResponse,pError,fNext);});};module.exports=doAPIEndpointReadSelectList;},{}],196:[function(require,module,exports){/**
* Meadow Endpoint - Read a Set of Records
*/const doAPIEndpointReads=function(pRequest,pResponse,fNext){let tmpRequestState=this.initializeRequestState(pRequest,'Reads');let fBehaviorInjector=pBehaviorHash=>{return fStageComplete=>{this.BehaviorInjection.runBehavior(pBehaviorHash,this,pRequest,tmpRequestState,fStageComplete);};};this.waterfall([fStageComplete=>{tmpRequestState.Query=this.DAL.query;var tmpCap=false;var tmpBegin=false;if(typeof pRequest.params.Begin==='string'||typeof pRequest.params.Begin==='number'){tmpBegin=parseInt(pRequest.params.Begin);}if(typeof pRequest.params.Cap==='string'||typeof pRequest.params.Cap==='number'){tmpCap=parseInt(pRequest.params.Cap);}else{tmpCap=this.settings['MeadowDefaultMaxCap']||250;}tmpRequestState.Query.setCap(tmpCap).setBegin(tmpBegin);if(typeof pRequest.params.Filter==='string'){// If a filter has been passed in, parse it and add the values to the query.
this.parseFilter(pRequest.params.Filter,tmpRequestState.Query);}else if(pRequest.params.Filter){tmpRequestState.Query.setFilter(pRequest.params.Filter);}return fStageComplete();},fBehaviorInjector(`Reads-QueryConfiguration`),fStageComplete=>{this.DAL.doReads(tmpRequestState.Query,fStageComplete);},(pQuery,pRecords,fStageComplete)=>{if(!pRecords){return fStageComplete(this.ErrorHandler.getError('No records found.',404));}tmpRequestState.Records=pRecords;return fStageComplete();},fBehaviorInjector(`Reads-PostOperation`),fStageComplete=>{this.doStreamRecordArray(pResponse,tmpRequestState.Records,fStageComplete);},fStageComplete=>{this.log.requestCompletedSuccessfully(pRequest,tmpRequestState,'Read a list of records.');return fStageComplete();}],pError=>{return this.ErrorHandler.handleErrorIfSet(pRequest,tmpRequestState,pResponse,pError,fNext);});};module.exports=doAPIEndpointReads;},{}],197:[function(require,module,exports){/**
* Meadow Endpoint - Read a Record
*/const doAPIEndpointReadsBy=function(pRequest,pResponse,fNext){let tmpRequestState=this.initializeRequestState(pRequest,'ReadsBy');let fBehaviorInjector=pBehaviorHash=>{return fStageComplete=>{this.BehaviorInjection.runBehavior(pBehaviorHash,this,pRequest,tmpRequestState,fStageComplete);};};this.waterfall([// 1. Construct the Query
fStageComplete=>{tmpRequestState.Query=this.DAL.query;var tmpCap=false;var tmpBegin=false;if(typeof pRequest.params.Begin==='string'||typeof pRequest.params.Begin==='number'){tmpBegin=parseInt(pRequest.params.Begin);}if(typeof pRequest.params.Cap==='string'||typeof pRequest.params.Cap==='number'){tmpCap=parseInt(pRequest.params.Cap);}else{//maximum number of records to return by default on Read queries. Override via "MeadowDefaultMaxCap" fable setting.
tmpCap=this.settings['MeadowDefaultMaxCap']||250;}tmpRequestState.Query.setCap(tmpCap).setBegin(tmpBegin);return fStageComplete();},fStageComplete=>{function addField(pByField,pByValue){if(pByValue.constructor===Array){tmpRequestState.Query.addFilter(pByField,pByValue,'IN','AND','RequestByField');}else{tmpRequestState.Query.addFilter(pByField,pByValue,'=','AND','RequestByField');}}var tmpFilters=pRequest.params.Filters;if(tmpFilters&&tmpFilters.constructor===Array){tmpFilters.forEach(function(filter){addField(filter.ByField,filter.ByValue);});}else{addField(pRequest.params.ByField,pRequest.params.ByValue);}return fStageComplete();},fBehaviorInjector(`Reads-QueryConfiguration`),fStageComplete=>{this.DAL.doReads(tmpRequestState.Query,(pError,pQuery,pRecords)=>{if(!pRecords){return fStageComplete(this.ErrorHandler.getError('No records found.',404));}tmpRequestState.Records=pRecords;return fStageComplete();});},fBehaviorInjector(`Reads-PostOperation`),fStageComplete=>{return this.doStreamRecordArray(pResponse,tmpRequestState.Records,fStageComplete);},fStageComplete=>{this.log.requestCompletedSuccessfully(pRequest,tmpRequestState,`Read a list of records by ${pRequest.params.ByField} = ${pRequest.params.ByValue}`);return fStageComplete();}],// 7. Return the results to the user
pError=>{return this.ErrorHandler.handleErrorIfSet(pRequest,tmpRequestState,pResponse,pError,fNext);});};module.exports=doAPIEndpointReadsBy;},{}],198:[function(require,module,exports){/**
* Meadow Operation - Marshal an array of records into a distinct list
*/const marshalDistinctList=function(pRecords,pRequest,pFieldList){if(pRecords.length<1)return[];let tmpDistinctList=[];// Allow the caller to pass in a list of fields.
let tmpFieldList=typeof pFieldList!=='undefined'?pFieldList:[];// See if this record has a GUID in the schema
let tmpGUID=this.DAL.defaultGUIdentifier&&this.DAL.defaultGUIdentifier.length>0?this.DAL.defaultGUIdentifier:false;// Peek at the first record to check for updatedate
let tmpHasUpdateDate=pRecords[0].hasOwnProperty('UpdateDate')?true:false;//Include all GUID and ID fields on the record
let tmpRecordFields=Object.keys(pRecords[0]);let h=0;while(h<tmpFieldList.length){// Remove any fields in the list that aren't in the first record.
if(!pRecords[0].hasOwnProperty(tmpFieldList[0]))tmpFieldList.splice(h,1);else h++;}for(let i=0;i<pRecords.length;i++){let tmpDistinctRecord={};tmpFieldList.forEach(pField=>{tmpDistinctRecord[pField]=pRecords[i][pField];});tmpDistinctList.push(tmpDistinctRecord);}return tmpDistinctList;};module.exports=marshalDistinctList;},{}],199:[function(require,module,exports){/**
* Meadow Operation - Marshal an array of records into a lite list
*/const marshalLiteList=function(pRecords,pRequest,pFieldList){if(pRecords.length<1)return[];let tmpLiteList=[];// Allow the caller to pass in a list of fields.
let tmpFieldList=typeof pFieldList!=='undefined'?pFieldList:[];// See if this record has a GUID in the schema
let tmpGUID=this.DAL.defaultGUIdentifier&&this.DAL.defaultGUIdentifier.length>0?this.DAL.defaultGUIdentifier:false;// Peek at the first record to check for updatedate
let tmpHasUpdateDate=pRecords[0].hasOwnProperty('UpdateDate')?true:false;//Include all GUID and ID fields on the record
let tmpRecordFields=Object.keys(pRecords[0]);tmpRecordFields.forEach(pField=>{if(pField.indexOf('ID')===0||pField.indexOf('GUID')===0||pField=='CreatingIDUser')//we should always include owner info
{tmpFieldList.push(pField);}});let h=0;while(h<tmpFieldList.length){// Remove any fields in the list that aren't in the first record.
if(!pRecords[0].hasOwnProperty(tmpFieldList[0]))tmpFieldList.splice(h,1);else h++;}for(let i=0;i<pRecords.length;i++){let tmpLiteRecord={Value:this.BehaviorInjection.processTemplate('SelectList',{Record:pRecords[i]},this.DAL.scope+' #<%= Record.'+this.DAL.defaultIdentifier+'%>')};tmpLiteRecord[this.DAL.defaultIdentifier]=pRecords[i][this.DAL.defaultIdentifier];if(tmpGUID)tmpLiteRecord[tmpGUID]=pRecords[i][tmpGUID];if(tmpHasUpdateDate)tmpLiteRecord['UpdateDate']=pRecords[i].UpdateDate;tmpFieldList.forEach(pField=>{tmpLiteRecord[pField]=pRecords[i][pField];});tmpLiteList.push(tmpLiteRecord);}return tmpLiteList;};module.exports=marshalLiteList;},{}],200:[function(require,module,exports){/**
* Meadow Endpoint - Get a New, empty Record
*/const doAPIEndpointNew=function(pRequest,pResponse,fNext){let tmpRequestState=this.initializeRequestState(pRequest,'New');let fBehaviorInjector=pBehaviorHash=>{return fStageComplete=>{this.BehaviorInjection.runBehavior(pBehaviorHash,this,pRequest,tmpRequestState,fStageComplete);};};this.waterfall([fBehaviorInjector(`New-PreOperation`),fStageComplete=>{// If during the PreOperation this was set, we can
if(!tmpRequestState.EmptyEntityRecord){tmpRequestState.EmptyEntityRecord=this.extend({},this.DAL.schemaFull.defaultObject);}return fStageComplete();},fBehaviorInjector(`New-PostOperation`),fStageComplete=>{pResponse.send(tmpRequestState.EmptyEntityRecord);this.log.requestCompletedSuccessfully(pRequest,tmpRequestState,`Delivered New ${this.DAL.scope} Record`);return fStageComplete();}],pError=>{return this.ErrorHandler.handleErrorIfSet(pRequest,tmpRequestState,pResponse,pError,fNext);});};module.exports=doAPIEndpointNew;},{}],201:[function(require,module,exports){/**
* Meadow Endpoint - Get the Record Schema
*/const doAPIEndpointSchema=function(pRequest,pResponse,fNext){let tmpRequestState=this.initializeRequestState(pRequest,'Schema');let fBehaviorInjector=pBehaviorHash=>{return fStageComplete=>{this.BehaviorInjection.runBehavior(pBehaviorHash,this,pRequest,tmpRequestState,fStageComplete);};};this.waterfall([fBehaviorInjector(`Schema-PreOperation`),fStageComplete=>{// If during the PreOperation this was set, we won't overwrite
if(!pRequest.JSONSchema){tmpRequestState.JSONSchema=this.extend({},this.DAL.jsonSchema);}return fStageComplete();},fBehaviorInjector(`Schema-PostOperation`),fStageComplete=>{pResponse.send(tmpRequestState.JSONSchema);this.log.requestCompletedSuccessfully(pRequest,tmpRequestState,`Delivered JSONSchema for ${this.DAL.scope}`);return fStageComplete();}],pError=>{return this.ErrorHandler.handleErrorIfSet(pRequest,tmpRequestState,pResponse,pError,fNext);});};module.exports=doAPIEndpointSchema;},{}],202:[function(require,module,exports){/**
* Meadow Endpoint - Validate a Record
*/const doAPIEndpointValidate=function(pRequest,pResponse,fNext){let tmpRequestState=this.initializeRequestState(pRequest,'Validate');let fBehaviorInjector=pBehaviorHash=>{return fStageComplete=>{this.BehaviorInjection.runBehavior(pBehaviorHash,this,pRequest,tmpRequestState,fStageComplete);};};this.waterfall([fBehaviorInjector(`Validate-PreOperation`),fStageComplete=>{if(typeof pRequest.body!=='object'){return fStageComplete(this.ErrorHandler.getError('Record validate failure - a valid JSON object is required.',500));}tmpRequestState.Record=pRequest.body;return fStageComplete();},fStageComplete=>{tmpRequestState.RecordValidation=this.DAL.schemaFull.validateObject(tmpRecord);return fStageComplete();},fBehaviorInjector(`Validate-PostOperation`),fStageComplete=>{pResponse.send(tmpRequestState.RecordValidation);this.log.requestCompletedSuccessfully(pRequest,tmpRequestState,`Validated Record for ${this.DAL.scope} - ${tmpRequestState.RecordValidation}`);return fStageComplete();}],pError=>{return this.ErrorHandler.handleErrorIfSet(pRequest,tmpRequestState,pResponse,pError,fNext);});};module.exports=doAPIEndpointValidate;},{}],203:[function(require,module,exports){/**
* Meadow Endpoint - Update a set of Records
*/const doUpdate=require('./Meadow-Operation-Update.js');const doAPIEndpointUpdate=function(pRequest,pResponse,fNext){let tmpRequestState=this.initializeRequestState(pRequest,'UpdateBulk');let fBehaviorInjector=pBehaviorHash=>{return fStageComplete=>{this.BehaviorInjection.runBehavior(pBehaviorHash,this,pRequest,tmpRequestState,fStageComplete);};};tmpRequestState.UpdatedRecords=[];this.waterfall([fStageComplete=>{if(!Array.isArray(pRequest.body)){return fStageComplete(this.ErrorHandler.getError('Record update failure - a valid record is required.',500));}pRequest.BulkRecords=pRequest.body;return fStageComplete();},fStageComplete=>{libAsync.eachSeries(pRequest.BulkRecords,(pRecord,fCallback)=>{doUpdate(pRecord,pRequest,tmpRequestState,pResponse,fCallback);},fStageComplete);},fStageComplete=>{return this.doStreamRecordArray(pResponse,pRequest.UpdatedRecords,fStageComplete);}],pError=>{return this.ErrorHandler.handleErrorIfSet(pRequest,tmpRequestState,pResponse,pError,fNext);});};module.exports=doAPIEndpointUpdate;},{"./Meadow-Operation-Update.js":205}],204:[function(require,module,exports){/**
* Meadow Endpoint - Update a Record
*/const doUpdate=require('./Meadow-Operation-Update.js');const doAPIEndpointUpdate=function(pRequest,pResponse,fNext){let tmpRequestState=this.initializeRequestState(pRequest,'Update');let fBehaviorInjector=pBehaviorHash=>{return fStageComplete=>{this.BehaviorInjection.runBehavior(pBehaviorHash,this,pRequest,tmpRequestState,fStageComplete);};};this.waterfall([fStageComplete=>{if(typeof pRequest.body!=='object'){return fStageComplete(this.ErrorHandler.getError('Record update failure - a valid record is required.',400));}if(pRequest.body[this.DAL.defaultIdentifier]<1){return fStageComplete(this.ErrorHandler.getError('Record update failure - a valid record ID is required in the passed-in record.',400));}tmpRequestState.Record=pRequest.body;return fStageComplete();},fStageComplete=>{doUpdate.call(this,pRequest.body,pRequest,tmpRequestState,pResponse,fStageComplete);},fStageComplete=>{if(tmpRequestState.RecordUpdateError){return fStageComplete(tmpRequestState.RecordUpdateErrorObject);}return fStageComplete();},fStageComplete=>{pResponse.send(tmpRequestState.Record);return fStageComplete();}],pError=>{return this.ErrorHandler.handleErrorIfSet(pRequest,tmpRequestState,pResponse,pError,fNext);});};module.exports=doAPIEndpointUpdate;},{"./Meadow-Operation-Update.js":205}],205:[function(require,module,exports){/**
* Meadow Operation - Update a record
*/const doUpdate=function(pRecordToModify,pRequest,pRequestState,pResponse,fCallback,pOptionalCachedUpdatingRecord){// This is a virtual operation
let tmpRequestState=cloneAsyncSafeRequestState(pRequestState,'doUpdate');let fBehaviorInjector=pBehaviorHash=>{return fStageComplete=>{this.BehaviorInjection.runBehavior(pBehaviorHash,this,pRequest,tmpRequestState,fStageComplete);};};// If there is not a default identifier or cached record, fail
if(pRecordToModify[this.DAL.defaultIdentifier]<1&&typeof pOptionalCachedUpdatingRecord==='undefined'){return fCallback('Record update failure - a valid record ID is required in the passed-in record.');}if(!Array.isArray(tmpRequestState.ParentRequestState.UpdatedRecords)){tmpRequestState.ParentRequestState.UpdatedRecords=[];}this.waterfall([fStageComplete=>{tmpRequestState.RecordToModify=pRecordToModify;if(typeof pOptionalCachedUpdatingRecord!=='undefined'){// Use the cached updating record instead of reading a record.
tmpRequestState.OriginalRecord=pOptionalCachedUpdatingRecord;return fStageComplete();}else{tmpRequestState.Query=this.DAL.query;tmpRequestState.Query.addFilter(this.DAL.defaultIdentifier,tmpRequestState.RecordToModify[this.DAL.defaultIdentifier]);// Load the record so we can do security checks on it
this.DAL.doRead(tmpRequestState.Query,(pError,pQuery,pRecord)=>{if(pError){return fStageComplete(pError);}if(!pRecord){return fStageComplete(this.ErrorHandler.getError('Record not Found',404));}tmpRequestState.OriginalRecord=pRecord;return fStageComplete();});}},fStageComplete=>{tmpRequestState.Query=this.DAL.query;return fStageComplete();},fStageComplete=>{tmpRequestState.Query.setIDUser(tmpRequestState.SessionData.UserID);tmpRequestState.Query.addRecord(tmpRequestState.RecordToModify);return fStageComplete();},fStageComplete=>{this.DAL.doUpdate(tmpRequestState.Query,(pError,pQuery,pReadQuery,pRecord)=>{if(pError){return fStageComplete(pError);}if(!pRecord){return fStageComplete('Error updating a record.');}tmpRequestState.Record=pRecord;return fStageComplete();});},fStageComplete=>{return this.BehaviorInjection.runBehavior(`Update-PostOperation`,this,pRequest,tmpRequestState,fStageComplete);},fStageComplete=>{tmpRequestState.ParentRequestState.UpdatedRecords.push(tmpRequestState.Record);this.log.requestCompletedSuccessfully(pRequest,tmpRequestState,`Updated record with ID ${tmpRequestState.Record[this.DAL.defaultIdentifier]}`);return fStageComplete();}],pError=>{if(pError){tmpRequestState.UpdatingRecord.Error=pError;tmpRequestState.ParentRequestState.RecordUpdateError=true;tmpRequestState.ParentRequestState.RecordUpdateErrorObject=pError;tmpRequestState.ParentRequestState.UpdatedRecords.push(tmpRequestState.RecordToCreate);}return fCallback();});};module.exports=doUpdate;},{}],206:[function(require,module,exports){/**
* Meadow Endpoint - Upsert a set of Records
*/const doUpsert=require('./Meadow-Operation-Upsert.js');const marshalLiteList=require('../read/Meadow-Marshal-LiteList.js');const doAPIEndpointUpserts=function(pRequest,pResponse,fNext){let tmpRequestState=this.initializeRequestState(pRequest,'UpsertBulk');let fBehaviorInjector=pBehaviorHash=>{return fStageComplete=>{this.BehaviorInjection.runBehavior(pBehaviorHash,this,pRequest,tmpRequestState,fStageComplete);};};tmpRequestState.CreatedRecords=[];tmpRequestState.UpdatedRecords=[];tmpRequestState.UpsertedRecords=[];this.waterfall([fStageComplete=>{if(!Array.isArray(pRequest.body)){return fStageComplete(this.ErrorHandler.getError('Record upsert failure - a valid record is required.',500));}tmpRequestState.BulkRecords=pRequest.body;return fStageComplete();},fStageComplete=>{libAsync.eachSeries(tmpRequestState.BulkRecords,(pRecord,fCallback)=>{doUpsert.call(this,pRecord,pRequest,tmpRequestState,pResponse,fCallback);},fStageComplete);},fStageComplete=>{return this.doStreamRecordArray(pResponse,marshalLiteList.call(this,pRequest.UpsertedRecords,pRequest),fStageComplete);}],pError=>{return this.ErrorHandler.handleErrorIfSet(pRequest,tmpRequestState,pResponse,pError,fNext);});};module.exports=doAPIEndpointUpserts;},{"../read/Meadow-Marshal-LiteList.js":199,"./Meadow-Operation-Upsert.js":208}],207:[function(require,module,exports){/**
* Meadow Endpoint - Upsert (Insert OR Update) a Record
*/var doUpsert=require('./Meadow-Operation-Upsert.js');var doAPIEndpointUpsert=function(pRequest,pResponse,fNext){let tmpRequestState=this.initializeRequestState(pRequest,'Upsert');let fBehaviorInjector=pBehaviorHash=>{return fStageComplete=>{this.BehaviorInjection.runBehavior(pBehaviorHash,this,pRequest,tmpRequestState,fStageComplete);};};// Configure the request for the generic create & update operations
tmpRequestState.CreatedRecords=[];tmpRequestState.UpdatedRecords=[];tmpRequestState.UpsertedRecords=[];this.waterfall([fStageComplete=>{//1. Validate request body to ensure it is a valid record
if(typeof tmpRequestState.body!=='object'){return fStageComplete(this.ErrorHandler.getError('Record upsert failure - a valid record is required.',500));}tmpRequestState.RecordToUpsert=pRequest.body;return fStageComplete();},fStageComplete=>{doUpsert.call(this,tmpRequestState.RecordToUpsert,pRequest,tmpRequestState,pResponse,fStageComplete);},fStageComplete=>{if(tmpRequestState.RecordUpsertError){return fStageComplete(tmpRequestState.RecordUpsertErrorMessage);}pResponse.send(tmpRequestState.Record);return fStageComplete();}],pError=>{return this.ErrorHandler.handleErrorIfSet(pRequest,tmpRequestState,pResponse,pError,fNext);});};module.exports=doAPIEndpointUpsert;},{"./Meadow-Operation-Upsert.js":208}],208:[function(require,module,exports){/**
* Meadow Operation - Upsert a record
*/const doCreate=require('../create/Meadow-Operation-Create.js');const doUpdate=require('../update/Meadow-Operation-Update.js');const doUpsert=function(pRecordToUpsert,pRequest,pRequestState,pResponse,fCallback){let tmpRequestState=this.cloneAsyncSafeRequestState(pRequest,'Upsert');let fBehaviorInjector=pBehaviorHash=>{return fStageComplete=>{this.BehaviorInjection.runBehavior(pBehaviorHash,this,pRequest,tmpRequestState,fStageComplete);};};this.waterfall([fStageComplete=>{tmpRequestState.Query=this.DAL.query;// Prepare to gather requirements for upserting
tmpRequestState.Record=pRecordToUpsert;// This operation will be create only if there is no GUID or ID in the record bundle
tmpRequestState.UpsertCreateOnly=true;// See if there is a default identifier or default GUIdentifier
if(typeof tmpRequestState.Record[this.DAL.defaultGUIdentifier]!=='undefined'&&tmpRequestState.Record[this.DAL.defaultGUIdentifier].length>0){tmpRequestState.Query.addFilter(this.DAL.defaultGUIdentifier,tmpRequestState.Record[this.DAL.defaultGUIdentifier]);tmpRequestState.UpsertCreateOnly=false;}if(typeof tmpRequestState.Record[this.DAL.defaultIdentifier]!=='undefined'&&tmpRequestState.Record[this.DAL.defaultIdentifier]>0){tmpRequestState.Query.addFilter(this.DAL.defaultIdentifier,tmpRequestState.Record[this.DAL.defaultIdentifier]);tmpRequestState.UpsertCreateOnly=false;}if(tmpRequestState.UpsertCreateOnly){doCreate.call(this,tmpRequestState.Record,pRequest,pResponse,fStageComplete);}else{this.DAL.doRead(tmpRequestState.Query,(pError,pQuery,pRecord)=>{if(pError){// Return the error, because there was an error.
return fStageComplete(pError);}else if(!pError&&!pRecord){// Record not found -- do a create.
doCreate.call(this,tmpRequestState.Record,pRequest,pResponse,fStageComplete);}else{// Set the default ID in the passed-in record if it doesn't exist..
if(!tmpRequestState.Record.hasOwnProperty(this.DAL.defaultIdentifier)){tmpRequestState.Record[this.DAL.defaultIdentifier]=pRecord[this.DAL.defaultIdentifier];}// If the found record does not match the passed ID --- what the heck?!
if(tmpRequestState.Record[this.DAL.defaultIdentifier]!=pRecord[this.DAL.defaultIdentifier]){return fStageComplete(this.ErrorHandler.getError('Record IDs do not match',500));}// Record found -- do an update.  Use the cached record, though.
doUpdate.call(this,tmpRequestState.Record,pRequest,pResponse,fStageComplete,pRecord);}});}},fStageComplete=>{// Now stuff the record into the upserted array
pRequest.UpsertedRecords.push(tmpRequestState.Record);return fStageComplete();}],pError=>{if(pError){pRecordToUpsert.Error='Error upserting record:'+pError;tmpRequestState.RecordUpsertError=true;tmpRequestState.RecordUpsertErrorMessage=pError;pRequest.UpsertedRecords.push(pRecordToUpsert);pRequest.CommonServices.log.error('Error upserting record:'+pError,{SessionID:pRequest.UserSession.SessionID,RequestID:pRequest.RequestUUID,RequestURL:pRequest.url,Action:this.DAL.scope+'-'+pRequest.MeadowOperation,Stack:pError.stack},pRequest);}return fCallback();});};module.exports=doUpsert;},{"../create/Meadow-Operation-Create.js":188,"../update/Meadow-Operation-Update.js":205}]},{},[175])(175);});