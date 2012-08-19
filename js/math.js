// some useful math stuff



////////////////////////////////////////////////////////
// call once per frame to get deltaTime
var calcDeltaTime_last;
function calcDeltaTime()
{
	var now = time();
	if (!calcDeltaTime_last)
		calcDeltaTime_last = now;

	var dt = now - calcDeltaTime_last;
	calcDeltaTime_last = now;

	return dt;
}
var lastAvgFps = 60;
var sumFps = 0;
var sumsFps = 0;
function calcAvgFps(dt)
{
	var fps = calcFpsFromDt(dt);
	sumFps += fps;
	sumsFps++;

	if (sumsFps > 10)
		lastAvgFps = to_i( sumFps/sumsFps );

	return lastAvgFps;
}
function calcFpsFromDt(dt)
{
	if (!dt) dt = 1000;
	var fps = 1000/dt;
	return to_i(fps);
}
// TODO
// - get fps
// - and get fps average few times per second to avoid unreadable numbers


///////////////////////////////////////////////////////

// geometry stuff
function doCirclesIntersect(p1, r1, p2, r2)
{
	return v2isCloserThan(p1, p2, r1+r2);
}



////////////////////////////////////////////////////////
// MIN and MAX
// mn = min(1, 2)
// mx = max(1, 2)
// mx = max(1, 2, 3, 4, ...)
// f = minmax(0.5, 0, 1)			// 'keepInRange'
// f = minmaxFix('qffwef', 0, 1)	// fixes wrong by giving average of min|max

function min(a, b)	{ return Math.min(a, b); }
function max2(a, b)	{ return Math.max(a, b); }
function max(a, b, c)
{
	if (typeof c == 'undefined')
		return max2(a, b);

	if (!arguments.length) return;
	var mx = arguments[0];
	for (var i=1; i < arguments.length; i++)
		mx = max(mx, arguments[i]);
	return mx;
}
function minmax01(f) { return minmax(f, 0, 1); }
function minmax(f, mn, mx)
{
	if (f > mx) return mx;
	if (f < mn) return mn;
	return f;
}
function minmaxFix(f, mn, mx)
{
	if (!isOk(f)) return (mn+mx)/2;
	return minmax(f, mn, mx);
}

// absmin(-5, 3) => 3		// returns number that is closer to zero
// absmax(-5, 3) => -5		// returns number that is further from zero
function absmin(a, b) { assert(b >= 0); return sign(a) * min( abs(a), b ); }
function absmax(a, b) { assert(b >= 0); return sign(a) * max( abs(a), b ); }
// abspow(-2, 2) => (-2)^2*sign => -4	// returns pow, but with original sign
function abspow(a, b) { assert(b >= 0); return sign(a) * pow( abs(a), b ); }



////////////////////////////////////////////////////////
// math stuff
function floor(f)	{ return Math.floor(f); }
function abs(f)		{ return Math.abs(f); }
function sqrt(f)	{ return Math.sqrt(f); }

function pow(f, e)	{ return Math.pow(f, e); }
function powe(f)	{ return pow(2.71828183, f); }
function pow10(f)	{ return pow(10, f); }

function loge(f)	{ return Math.log(f); }
function log10(f)	{ return loge(f) / Math.log(10); }
function logn(f, n)	{ return loge(f) / loge(n); }

function sign(f)	{ return f<0?-1:1; }



//////////////////////////////////////////////////////////////////
// randomness
// rnd()		=> <0, 1> any float between
// rnd(8)		=> <0, 8>
// rnd(3, 8)	=> <3, 8>
//
// rndi()		=> [0, 1] only whole numbers
// rndi(8)		=> [0, 1, 2, 3, 4, 5, 6, 7]
// rndi(3, 8)	=> [3, 4, 5, 6, 7]
//
// rndsign()	=> [-1, 1]
// rnd11()		=> <-1, 1> floating
// rnd11(5)		=> <-5, 5> floating
// rndclr()		=> 0x123456 random color
function rndsign()	{ return rndi()?1:-1; }		// -1 or 1, value*rndsign()
function rnd11(f)	{ return rnd(-f, f); }		// <-f, +f>
function rndclr()	{ return rndi(0xffffff); }	// random color
function rnd(x, mx)
{
	if (typeof x != 'number') x = 1;
	if (typeof mx == 'number')
		return x + rnd(mx-x);

	return Math.random()*x;
}
function rndi(x, mx)
{
	if (typeof x != 'number') x = 2;
	if (typeof mx == 'number')
		return x + rndi(mx-x);

	return Math.floor( rnd(x) );
}



///////////////////////////////////////////////////////////////////////
// CONVERT value to unit-value inside range
// rangeUnit(12, 10, 20) => 0.2
//
// ITERATE
// forRangeSteps(10, 20, 5, fn, [logarithmic?])
// - will call fn through 5 times inside range <10,20>: 10, 12, 14, 16, 18
//
// forRangeStepsLog(10, 1000, 3, fn) !!
// - will call 3 times logarithmically: 10, 100, 1000
// !! though i'm not sure if it works properly right now, got to do some tests
function rangeUnit(f, mn, mx)
{
	return (f-mn) / (mx-mn);
}
function forRangeStepsLog(mn, mx, steps, fn)
{
	forRangeSteps(mn, mx, steps, fn, 'log');
}
function forRangeSteps(mn, mx, steps, fn, log)
{
	if (log) {
		mn = loge(mn);
		mx = loge(mx);
	}

	var step = 0;
	if (steps > 1)
		step = (mx-mn) / (steps-1);

	for (var i=mn; i <= mx; i+=step)
	{
		var val = i;
		if (log)
			val = powe(val);

		var ru = rangeUnit(i, mn, mx).toFixed(4);
		var b = fn(val, ru);
		if (b == false || !step)
			break;
	}
}



////////////////////////////////////////////////////////////
// conversions
// to_i(0.5)		=> 0
// to_i255(0.5)		=> 128
// fixed(0.5)		=> 0
// fixed(0.5, 2)	=> 0.50
//
// frgb2clr(1, 1, 0)	=> 0xffff00
// heatclr(0.5)			=> some kind of heat color..
// normalizeClr('ff0')	=> 0xffff00
// normalizeClr(0xffff00)=> 0xffff00

function to_i(f)	{ return parseInt(f); }
function to_i255(f)	{ return parseInt( minmax(f,0,1)*255 ); }	// <0,1> => <0,255>
function fixed(f, dec) { return parseFloat( f.toFixed(dec) ); }
function frgb2clr(r, g, b)
{
	return to_i255(r)*256*256 +
			to_i255(g)*256 +
			to_i255(b);
}
function heatclr(f01, add)
{
	add = add || 0;
	// input is f=<0,1>
	var f = minmax(f01, 0, 1);
	f *= 2;

	var r=0,g=0,b=0;
	if (f<1)
	{
		g = f*2;
		b = 2-f*2;
	}
	else
	{
		f -= 1;
		r = f*2;
		g = 2-f*2;
	}
	var clr = frgb2clr(r+add, g+add, b+add);
	return clr;
}

function normalizeClr(c)	// accepts hexa color: 'fff'
{
	if (typeof c == 'string' && c.length==3)
	{
		function val(ch) {
			ch = parseInt(ch, 16);
			ch = minmax(ch, 0, 15) * 17;
			return parseInt( ch.toString(16), 16 );
		}
		var i = 0;
		i += val( c[0] ) * 256*256;
		i += val( c[1] ) * 256;
		i += val( c[2] );
		c = i;
	}
	return c;
}


////////////////////////////////////////////////////////////////
// 1. radians = degrees*inRads
// 2. radians = toRads(degrees)
var inRads = Math.PI / 180;
var inDegs = 180 / Math.PI;
function toRad(deg) { return deg * inRads; }
function toDeg(rad) { return deg * inDegs; }



/////////////////////////////////////////////////////////////////////
// Vector2D
// - Why not class? Because classes are slow as fuck.
//
// a = v2(1, 1)		=> a{1, 1}
// b = v2copy(a)	=> b{1, 1}
// c = v2add(a, b)	=> c{2, 2}
// d = v2mult(c, 3)	=> d{6, 6}
//
// also, everything has self-modifying function ending -Me:
// v2multMe(d, 2)
// v2normMe(d)

function vxy(x, y)
{
	if (typeof x.x!='undefined')
		return v2c(x);	// should be vector
	return v2(x, y);
}

function v2(x, y)		{ return {x:x,			y:y}; }
function v2c(v)			{ return {x:v.x,		y:v.y}; }
function v2copy(v)		{ return {x:v.x,		y:v.y}; }
function v2mult(v, f)	{ return {x:v.x*f,		y:v.y*f}; }
function v2m(v, f)		{ return {x:v.x*f,		y:v.y*f}; }
function v2multxy(v,x,y){ return {x:v.x*x,		y:v.y*y}; }
function v2multV(v, b)	{ return {x:v.x*b.x,	y:v.y*b.y}; }
function v2div(v, f)	{ return {x:v.x/f,		y:v.y/f}; }
function v2divV(v, b)	{ return {x:v.x/b.x,	y:v.y/b.y}; }
function v2add(v, b)	{ return {x:v.x+b.x,	y:v.y+b.y}; }
function v2sub(v, b)	{ return {x:v.x-b.x,	y:v.y-b.y}; }
function v2addxy(v, x,y){ return {x:v.x+x,		y:v.y+y}; }
function v2subxy(v, x,y){ return {x:v.x-x,		y:v.y-y}; }
function v2inv(v)		{ return {x:-v.x,		y:-v.y}; }
function v2len(t)		{ return Math.sqrt(t.x*t.x + t.y*t.y); }
function v2len2(t)		{ return t.x*t.x + t.y*t.y; }
function v2dist(t, v)	{ var x=t.x-v.x, y=t.y-v.y; return Math.sqrt(x*x+y*y); }
function v2dist2(t, v)	{ var x=t.x-v.x, y=t.y-v.y; return x*x+y*y; }
function v2dirTo(t, v)	{ return v2norm(v2sub(v, t)); }
function v2dot(t, v)	{ return t.x*v.x + t.y*v.y; }
function v2p(t)			{ return t.x.toFixed(2)+' '+t.y.toFixed(2); }
function v2null(v)		{ if (v) v.x=v.y=0; else return {x:0, y:0}; }
function v2min(a, b)	{ return v2( min(a.x,b.x), min(a.y,b.y) ); }
function v2max(a, b)	{ return v2( max(a.x,b.x), max(a.y,b.y) ); }
function v2center(a, b)	{ return v2add( a, v2mult( v2sub(b,a),0.5 ) ); }
function v2perp(a, f)	{ f=f||1; return v2(-a.y*f, a.x*f); }
function v2perpL(a)		{ return v2(a.y, -a.x); }
function v2perpMe(v, f)	{ f=f||1; var y=v.y; v.y=v.x*f; v.x=-y*f; }
function v2perpMeL(v)	{ var x=v.x; v.x=v.y; v.y=-x; }
function v2pow(v, f)	{ return v2( abspow(v.x, f), abspow(v.y, f) ); }
function v2powMe(v, f)	{ v.x = abspow(v.x, f); v.y = abspow(v.y, f); }
function v2norm(v)
{
	var len = Math.sqrt(v.x*v.x+v.y*v.y);
	if (len == 0) len = 1;
	len = 1/len;
	return {x: v.x*len, y: v.y*len};
}
function v2avg()
{
	var v = v2(0, 0);
	var num = arguments.length;

	for (var i=0; i < num; i++)
	{
		var a = arguments[i];
		v.x += a.x;
		v.y += a.y;
	}
	v2divMe(v, num);
	return v;
}
function v2rot(v, ang)
{
	var rad = toRad(ang);

	var c = Math.cos(rad);
	var s = Math.sin(rad);
	var x = v.x*c - v.y*s;
	var y = v.x*s + v.y*c;
	return v2(x, y);
}
// a,b - circles positions
// m - maxDist
function v2isCloserThan(a, b, m)
{
	var x = a.x-b.x;
	if (x > m || -x > m) return false;

	var y = a.y-b.y;
	if (y > m || -y > m) return false;

	var d2 = x*x + y*y;
	var m2 = m*m;

	return (d2 < m2);
}
function v2isFurtherThan(t, v, maxDist)
{
	return !v2isCloserThan(t, v, maxDist);
}
function v2rnd(mn, mx)
{
	return v2( rnd(mn, mx)*rndsign(), rnd(mn, mx)*rndsign() );
}
function v2rndxy(x, y)
{
	return v2( rnd11(x)*rndsign(), rnd11(y)*rndsign() );
}
// ***Me stuff
function v2multMe(v, f)		{ v.x*=f;	v.y*=f; }
function v2divMe(v, f)		{ v.x/=f;	v.y/=f; }
function v2addMe(v, b)		{ v.x+=b.x;	v.y+=b.y; }
function v2addMex(v, x)		{ v.x+=x; }
function v2addMey(v, y)		{ v.y+=y; }
function v2addMexy(v, x, y)	{ v.x+=x;	v.y+=y; }
function v2subMe(v, b)		{ v.x-=b.x;	v.y-=b.y; }
function v2normMe(v)
{
	var len = Math.sqrt(v.x*v.x+v.y*v.y);
	if (len == 0) len = 1;
	len = 1/len;
	v.x*=len;
	v.y*=len;
}



///////////////////////////////
// box2d vector

function b2null() { return new b2Vec2(0, 0); }
function b2v(x, y)
{
	var b2Vec2 = Box2D.Common.Math.b2Vec2;

	var v = vxy(x, y);
	return new b2Vec2(v.x, v.y);
}
