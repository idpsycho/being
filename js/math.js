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

function betweenCircles(p1, r1, p2, r2)
{
	var ratio = abRatio(r1*0.5, r2);
	var v = v2lerp(p1, p2, ratio);
	return v;
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
function absmin(a, b) { return sign(a) * min( abs(a), abs(b) ); }
function absmax(a, b) { return sign(a) * max( abs(a), abs(b) ); }
// abspow(-2, 2) => (-2)^2*sign => -4	// returns pow, but with original sign
function abspow(a, b) { return sign(a) * pow( abs(a), abs(b) ); }

// useful to get smallest angle.. btw its not safe, while might take forever..
function cycleIn180(f) { return cycleIn(f, -180, 180); }
function cycleIn(f, from, to)
{
	var range = to-from;

	var i = 0;
	while (f < from && i>99)
	{
		f += range;
		i++;
	}
	while (f > to && i<99)
	{
		f -= range;
		i++;
	}

	if (i>=99)
		assert(0, 'uneffective cycling');

	return f;
}

function angDiff(a, b)
{
	var d = cycleIn180(a-b)
	return abs(d);
}

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

function rangeConvert(f, fromMin, fromMax, toMin, toMax)
{
	f = rangeUnit(f, fromMin, fromMax);
	if (f < 0 || f > 1)
		return false;

	return toMin + f*(toMax-toMin);
}

function rangeUnit(f, mn, mx)
{
	if (notDef(mx)) {
		mx = mn;
		mn = 0;
	}
	mx = defined(mx, 1);	// toto moc nedava zmysel, ze? naco by som si pytal range unit medzi 0-1 ?

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

	for (var i=0; i < steps; i++)
	{
		var val = mn + i*step;
		if (log)
			val = powe(val);

		var ru = rangeUnit(i, mx).toFixed(4);
		var b = fn(val, ru);
		if (b == false || !step)
			break;
	}
}

function abRatio(a, b)
{
	var ab = a+b;
	if (!ab) return 0.5;
	return a/ab;
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

function HSLtoRGB(h,s,l)
{
	function h2v(hh,min,max)
	{
		hh = hh % 360;
		if (hh <	0) hh = hh + 360;
		if (hh <	60) return min + (max - min) * hh / 60;
		if (hh >= 60 && hh < 180) return max;
		if (hh >=180 && hh < 240) return min+(max-min)*(240-hh)/60;
		return min;
	}

	r = g = b = 0;
	if (s < 0) s = 0;
	if (s > 1) s = 1;
	if (l < 0) l = 0;
	if (l > 1) l = 1;
	h = h % 360;
	if (h < 0) h = h + 360;
	if (l <= 0.5)
	{
				cmin = l * ( 1 - s );
				cmax = 2 * l - cmin;
	}else{
				cmax = l * ( 1 - s ) + s;
				cmin = 2 * l - cmax;
	}
	r = h2v(h+120,cmin,cmax);
	g = h2v(h,cmin,cmax);
	b = h2v(h-120,cmin,cmax);

	r = to_i255(r);
	g = to_i255(g);
	b = to_i255(b);

	return {r:r, g:g, b:b};

	return "rgb("+r+", "+g+", "+b+")";
}

function HSLtoInt(h, s, l)
{
	var c = HSLtoRGB(h, s, l);
	return RGBtoInt(c.r, c.g, c.b);
}

function saturateClr(clr)
{
	var c = intToRGB255(clr);
	var mx = max(c.r, c.g, c.b);
	var x = 255/mx;
	c.r *= x;
	c.g *= x;
	c.b *= x;
	return RGB255toInt(c);
}

function lerpClr(c1, c2, f)
{
	f = minmax(f, 0, 1);
	c1 = normalizeClr(c1);
	c2 = normalizeClr(c2);

	c1 = intToRGB255(c1);
	c2 = intToRGB255(c2);

	var c = lerpRGB(c1, c2, f);
	return RGB255toInt(c);
}
function RGB255toInt(r, g, b)
{
	if (isObj(r) && isDef(r.r)) {
		b = r.b;
		g = r.g;
		r = r.r;
	}

	r = fixed(minmax(r, 0, 255));
	g = fixed(minmax(g, 0, 255));
	b = fixed(minmax(b, 0, 255));

	return (r*256*256) | (g*256) | b;
}

function isInt0255(x)
{
	if (x < 0 || x > 255) return false;
	if (x != Math.ceil(x)) return false;
	return true;
}

function intToRGB255(c)
{
	var r, g, b;
	r = (c & 0x00ff0000) /256/256;
	g = (c & 0x0000ff00) /256;
	b = (c & 0x000000ff);
	return {r:r, g:g, b:b}
}

function lerpRGB(c1, c2, f)
{
	var r, g, b;
	r = lerp0255(c1.r, c2.r, f);
	g = lerp0255(c1.g, c2.g, f);
	b = lerp0255(c1.b, c2.b, f);
	return {r:r, g:g, b:b};
}

function lerp0255(a, b, f)
{
	var c = a + (b-a)*f;
	c = Math.ceil(c);
	return minmax(c, 0, 255);
}
function p_clr(c)
{
	if (c && notDef(c.r))
		return p_clr( intToRGB255(c) );

	out('rgb: ', c.r, c.g, c.b);
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
	if (notDef(x, y))
		return;

	if (typeof x.x!='undefined')
		return v2c(x);	// should be vector
	return v2(x, y);
}

function isV2(v)
{
	return (v && isDef(v.x, v.y));
}

function v2ok(v)
{
	return v && !isNaN(v.x) && !isNaN(v.y);
}
function assertV2(v, msg)
{
	assert(v2ok(v), 'assert v2: '+msg?msg:'');
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
function v2dir(t, v, f)	{ f=defined(f, 1); return v2m(v2norm(v2sub(v, t)), f); }
function v2dirAng(t, v)	{ return v2angle(v2dir(t, v)); }
function v2dot(t, v)	{ return t.x*v.x + t.y*v.y; }
function v2p(t)			{ return t.x.toFixed(2)+' '+t.y.toFixed(2); }
function v2null(v)		{ if (v) v.x=v.y=0; else return {x:0, y:0}; }
function v2min(a, b)	{ return v2( min(a.x,b.x), min(a.y,b.y) ); }
function v2max(a, b)	{ return v2( max(a.x,b.x), max(a.y,b.y) ); }
function v2perp(a, f)	{ f=f||1; return v2(-a.y*f, a.x*f); }
function v2perpL(a)		{ return v2(a.y, -a.x); }
function v2perpMe(v, f)	{ f=f||1; var y=v.y; v.y=v.x*f; v.x=-y*f; }
function v2perpMeL(v)	{ var x=v.x; v.x=v.y; v.y=-x; }
function v2pow(v, f)	{ return v2( abspow(v.x, f), abspow(v.y, f) ); }
function v2powMe(v, f)	{ v.x = abspow(v.x, f); v.y = abspow(v.y, f); }
function v2lerp(a, b, f){ return v2add( a, v2mult( v2sub(b,a),f ) ); }
function v2center(a, b)	{ return v2lerp(a, b, 0.5); }

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
function v2angle(v)
{
	return Math.atan2(v.y, v.x) * inDegs;
}
function v2angle2(a, b)
{
	var v = v2dir(a, b);
	return Math.atan2(v.y, v.x) * inDegs;
}
function v2fromAngle(degs, dist)
{
	dist = defined(dist, 1);

	var v = v2(1, 0);
	v = v2rot(v, degs);
	return v2mult(v, dist);
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


function v2minmax(v, fMin, fMax)
{
	v = v2c(v);
	var d = v2len(v);
	if (d < fMin) v2multMe(v, fMin/d);
	if (d > fMax) v2multMe(v, fMax/d);
	return v;
}

function v2keepNearby(v, nearV, minDist, maxDist)
{
	v = v2sub(v, nearV);
	v = v2minmax(v, minDist, maxDist);
	return v2add(v, nearV);
}

function v2towards(a, b, len)
{
	var v = v2dir(a, b, len);
	return v2add(v, a);
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
function b2vArr(arr)
{
	var b2arr = [];
	for (var i=0; i < arr.length; i++)
	{
		b2arr.push( b2v(arr[i]) );
	}
	return b2arr;
}
