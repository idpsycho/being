// extending basic javascript objects and some functionality


function assert()
{
	var args = arguments;
	var last = args.length-1;
	var msg = args[last];

	for (var i=0; i < last; i++)
	{
		if (typeof args[i] == 'undefined')
			console.log('Assert Failed: '+msg);
	}
}

function clone(x)
{
	// requires jquery to use this..
	return $.extend(true, {}, x);
}

////////////////////////////////////////////////////////
function isDef()
{
	if (arguments.length == 1)
		return typeof arguments[0] != 'undefined';

	for (var i=0; i < arguments.length; i++)
		if ( !isDef(arguments[i]) )
			return false;

	return true;	// all was defined
}
function notDef()
{
	if (arguments.length == 1)
		return typeof arguments[0] == 'undefined';

	for (var i=0; i < arguments.length; i++)
		if ( !notDef(arguments[i]) )
			return false;

	return true;	// all was undefined
}
// x = defined(x, 5);
function defined(value, default_value)
{
	if (typeof value == 'undefined')
		return default_value;

	return value;
}

//////////////////////////////////////////////////////

// milliseconds since X
function time()
{
	return new Date().getTime();
}
function ago(t)
{
	return time() - t;
}

function sinT01(fps, mult)
{
	var x = sinT(fps)/2 + 0.5;
	return x * mult;
}

function sinT(fps, mult)
{
	mult = defined(mult, 1);
	fps = defined(fps, 1);

	var t = time()*fps/1000;
	return Math.sin(t) * mult;
}


///////////////////////////////////////////////////////
// Array

Array.prototype.append = function(arr)
{
	if (!arr) return;
	for (var i=0; i < arr.length; i++)
		this.push( arr[i] );
}
Array.prototype.last = function()
{
	return this[ this.length-1 ];
}
Array.prototype.removeAt = function(at)
{
	return this.splice(at, 1);
}
Array.prototype.removeObj = function(obj)	// must be exactly the same object
{
	for (var i=0; i < this.length; i++)
	{
		if (this[i] === obj)
			return this.splice(i, 1);
	}
}
Array.prototype.findByAttr = function(name, value)
{
	for (var i=0; i < this.length; i++)
	{
		if (this[i][name] == value)
			return this[i];
	}
}
Array.prototype.filterByAttr = function(name, value, ifNot)
{
	var arr = [];
	for (var i=0; i < this.length; i++)
	{
		var b = (this[i][name] == value);
		if (ifNot)
			b = !b;
		if (b)
			arr.push(this[i]);
	}
	return arr;
}

/* TEST:
var arr = [{i:0,w:5}, {i:1,w:1}, {i:2,w:2}]; hits=[0, 0, 0]; var q=99999; while(q--) hits[arr.weightedRnd().i]++; hits;
*/
Array.prototype.weightedRnd = function(weight_name)
{
	var w = defined(weight_name, 'w');
	var sum = 0;
	for (var i=0; i < this.length; i++)
	{
		sum += this[i][w];
	}

	var at = rndi( sum );
	for (var i=0; i < this.length; i++)
	{
		at -= this[i][w];
		if (at < 0)
			return this[i];
	}

	assert('something went wrong..');
	return this[0];
}

//////////////////////////////////////////////////////
// String

String.prototype.n = function(times)
{
	return (new Array(times + 1)).join(this);
}
String.prototype.normalizeLength = function(a)
{
	if (this.length > a) return this.substr(0, a);
	if (this.length < a) return this + " ".n(a-this.length);
	return this;
}
String.prototype.capitalize = function()
{
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
}


function classByName(name)
{
	var type = eval('typeof '+name);
	if (type == 'function')
		return eval(name);
}
function ifFn(possibleFn)
{
	if (typeof possibleFn == 'function')
		return possibleFn;
}

////////////////////////////////////////////////////
// misc stuff

function bindOnMouseWheel(fn)
{
	if (!fn) return;

	function extractDelta(e)
	{
		if (e.wheelDelta)	return e.wheelDelta;
		if (e.detail)		return e.detail * -40;
		if (e.originalEvent && e.originalEvent.wheelDelta)
							return e.originalEvent.wheelDelta;
	}

	$(document).bind('mousewheel DOMMouseScroll', function (e)
	{
		var d = extractDelta(e);
		fn(d);
	});
}



///////////////////////////////////////////
// output errors, but at most 10 times per second
// useful to prevent console freezing from huge amount of errors
// such as in realtime game, where thousands of errors happen every frame 60x/second
var err_lastTime;
function err(s, ret)
{
	var now = time();
	if (err_lastTime && now-err_lastTime>100)
		out(s);

	err_lastTime = now;
	return ret;
}
// TODO: encapsulate that global variable inside scope


// nicely formatted number, nobody likes 1.5528350973420397532
function nice(f)
{
	if (!arguments.length) return;
	if (arguments.length > 1)
	{
		var s = '';
		for (var i=0; i < arguments.length; i++)
			s += nice( arguments[i] )+' ';

		return s;
	}

	if (f && isDef(f.x, f.y))
		return nice(f.x)+' '+nice(f.y);

	if (typeof f != 'number')
		return f;

	function fixed(f, dec) { return parseFloat( f.toFixed(dec) ); }

	var a = Math.abs(f);
	if (a>=10)	return fixed(f);
	if (a>=1)	return fixed(f, 1);
	if (a>=0.1)	return fixed(f, 2);
	return fixed(f, 3);
}


function out()
{
	var s = '';
	for (var i=0; i < arguments.length; i++)
	{
		var a = arguments[i];

		if (notDef(a))
			s += 'undefined';
		else
		if (a === null)
			s += 'null';
		else
		if (a===true || a===false)
			s += a?'true':'false';
		else
		if (isDef(a.x, a.y))
			s += nice(a.x)+' '+nice(a.y);
		else
			s += nice(a)

		s+=' ';
	}
	console.log(s);
}



///////////////////////////////////////////////////////////////////
/*
function nicelog()
{
	var arr = arguments;

	var s = '';
	var len = 0;
	for (var i=0; i < arr.length; i++)
	{
		if (typeof arr[i] != 'undefined')
			len = i+1;
	}

	for (var i=0; i < len; i++)
	{
		var a = arr[i];
		var notFirst = i>0;
		var isNumber = (typeof a == 'number');
		var previousWasString = notFirst && (typeof arr[i-1] == 'string');

		if (isNumber)
		{
			a = nice(a);
			a = (a+'').normalizeLength(10);
		}

		// vector
		if (typeof a.x != 'undefined')
			a = a.x+' '+a.y;

		if (!(isNumber && previousWasString))
			a = ' '+a;

		s += a;
	}

	console.log(s);
}
function nice(f)
{
	var a = abs(f);
	if (a>=10)	return fixed(f);
	if (a>=1)	return fixed(f, 1);
	if (a>=0.1)	return fixed(f, 2);
	return fixed(f, 3);
}
*/
