// extending basic javascript objects and some functionality



////////////////////////////////////////////////////////
// milliseconds since X
function time()
{
	return new Date().getTime();
}

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
		console.log(s);

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
