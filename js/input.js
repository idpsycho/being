require([
	'js/math',
	'js/camera'
], initInput);

// NEW - this is used in onMouseMove, and rest is updated by it every frame
var mouseScrNew, mousePosNew;
var mouseScr, mouseScrLast, mouseScrChange;
var mousePos, mousePosLast, mousePosChange;
var mouseDownFor = 0;	// time elapsed from last MOUSE_DOWN to MOUSE_UP
var mouseDownSince = 0;

var keysEvent;		// keydown or keyup
var keysDown;		// keydown (no keyup yet)		// eg. SHIFT=running

/*
	HOW ABOUT:
		if (PressedA)
		if (holdsNUMP)

	HOW ABOUT:
		if ('SHIFT A')
		if ('UP,W')
*/



//////////////////////////////////////////////////////////////////
// init & callback

function initInput()
{
	mouseScrNew		= v2null();
	mousePosNew		= v2null();

	mouseScr		= v2null();
	mouseScrLast	= v2null();
	mouseScrChange	= v2null();
	mousePos		= v2null();
	mousePosLast	= v2null();
	mousePosChange	= v2null();

	keysDown = [];
	keysEvent = [];
}

function inputAfterFrame()
{
	// keys
	keysEvent = [];

	// mouse
	mouseScrLast = v2copy(mouseScr);
	mousePosLast = v2copy(mousePos);

	mouseScr = v2copy(mouseScrNew);
	mousePos = getCamera().fromScreen(mouseScr);

	mouseScrChange = v2sub(mouseScr, mouseScrLast);
	mousePosChange = v2sub(mousePos, mousePosLast);

	// mouse button
	mouseDownFor = time() - mouseDownSince;
}



////////////////////////////////////////////////////////////
// KEYS:
//
// if (keyDown('A'))
// if (keyDown('0'))
// if (kd('UP'))
// if (kd('NUM1'))
//
// if (keyPressed('ENTER'))
// if (kp('ESC'))
// if (kp('MOUSE'))
//
// use these keys:
//		ABCDEFGHIJKLMNOPQRSTUWVXYZ 0123456789
//		UP DN LT RT (arrows)
//		ENTER SPACE ESC TAB, SHIFT CTRL ALT
//		NUM+ NUM- NUM* NUM0 NUM1..
//		MOUSE
//

function kClick()		{ return kr('MOUSE'); }
function kd(c)			{ return keyDown(c); }
function kp(c)			{ return keyPressed(c); }
function kr(c)			{ return keyReleased(c); }
function keyDown(c)
{
	var k = c.split(',');	// if (keyDown('UP,W'))
	if (k.length > 1)
	{
		for (var i=0; i < k.length; i++)
			if (keyDown(k[i])) return true;

		return false;
	}

	return keysDown[c];
}
function keyPressed(c)
{
	var k = c.split(',');	// if (keyPressed('UP,W'))
	if (k.length > 1)
	{
		for (var i=0; i < k.length; i++)
			if (keyPressed(k[i])) return true;

		return false;
	}

	return keysDown[c] && keysEvent[c];
}
function keyReleased(c)
{
	var k = c.split(',');
	if (k.length > 1)
	{
		for (var i=0; i < k.length; i++)
			if (keyReleased(k[i])) return true;

		return false;
	}

	return !keysDown[c] && keysEvent[c];
}


function onKeyDown(e)	// call this event
{
	var c = e.keyCode;
	keysDown[c] = true;
	keysEvent[c] = true;

	var ch = getAlternativeCode(c);
	if (!ch) return;
	keysDown[ch] = true;
	keysEvent[ch] = true;
}

function onKeyUp(e)	// call this event
{
	var c = e.keyCode;
	keysDown[c] = false;
	keysEvent[c] = true;

	var ch = getAlternativeCode(c);
	if (!ch) return;

	keysDown[ch] = false;
	keysEvent[ch] = true;
}



////////////////////////////////////////////////////////////
// MOUSE
//

function onMouseDown(e)
{
	keysDown['MOUSE'] = true;
	keysEvent['MOUSE'] = true;
	mouseDownSince = time();
	mouseDownFor = 0;
}
function onMouseUp()
{
	keysDown['MOUSE'] = false;
	keysEvent['MOUSE'] = true;
	mouseDownFor = time() - mouseDownSince;
}

function onMouseMove(e)
{
	var t = e.target;

	// this will be aplied in inputAfterFrame()
	mouseScrNew = v2(t.mouseX, t.mouseY);
}
/*
	i dont relly remember what's this for
	var of = $('#c').offset();
	var c = $('#c');
	var w = $(window);
	of = v2( of.left, of.top );
	c = v2( c.width(), c.height() );
	w = v2( w.width(), w.height() );
	// mscr = (m-of) * (w/c);
	mouseScr = v2multV( v2sub(m, of), v2divV(w, c) );
*/

function toCharCode(char)
{
	return char.charCodeAt(0);
}
// event testing page: http://javascript.info/tutorial/keyboard-events
function getAlternativeCode(c)
{
	var _A = toCharCode('A');
	var _Z = toCharCode('Z');
	var _0 = toCharCode('0');
	var _9 = toCharCode('9');

	var ch = String.fromCharCode(c);
	//out('ch=',ch, '  c=',c);
	if (c >= _A && c <= _Z ||
		c >= _0 && c <= _9)
		return ch;

	if (c==106) return 'NUM*';
	if (c==107) return 'NUM+';
	if (c==109) return 'NUM-';
	if (c==96) return 'NUM0';
	if (c==97) return 'NUM1';
	if (c==98) return 'NUM2';
	if (c==99) return 'NUM3';
	if (c==100) return 'NUM4';
	if (c==101) return 'NUM5';
	if (c==102) return 'NUM6';
	if (c==103) return 'NUM7';
	if (c==104) return 'NUM8';
	if (c==105) return 'NUM9';

	// must be CAPS cos native 'shift' value
	if (c==16) return 'SHIFT';
	if (c==17) return 'CTRL';
	if (c==18) return 'ALT';

	if (c==9) return 'TAB';
	if (c==13) return 'ENTER';
	if (c==27) return 'ESC';
	if (c==32) return 'SPACE';

	if (c==37) return 'LT';
	if (c==38) return 'UP';
	if (c==39) return 'RT';
	if (c==40) return 'DN';
}
