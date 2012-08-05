require(['math'], setupInput);

var mousePos, mousePosLast;
var mouseScr, mouseScrLast;

// volake funkcie by tu mali byt, ktore budu volane z onEF, onKD, atd..

function setupInput()
{
	mousePos		= v2null();
	mousePosLast	= v2null();
	mouseScr		= v2null();
	mouseScrLast	= v2null();
}

function kd(c)	// isKeyDown
{
	return arrKd[c];
}
function ke(c)	// isKeyEvent
{
	return arrKe[c];
}
function kc(c)	// isKeyPressed ci co
{
	return arrKc[c];
}
function kp(c)
{
	return arrKd[c] && arrKc[c];
}

function inputAfterFrame()
{
	arrKc = [];
	arrKx = [];
}

function onMouseMove()
{
	/*
		var of = $('#c').offset();
	var c = $('#c');
	var w = $(window);
	of = v2( of.left, of.top );
	c = v2( c.width(), c.height() );
	w = v2( w.width(), w.height() );

	var m = v2( e.target.mouseX, e.target.mouseY );

	// mousePos = (m-of) * (w/c);
	mouseScrLast = mouseScr;
	mouseScr = v2multV(
				v2sub(m, of),
				v2divV(w, c)
				);

	mouseLast = mousePos;
	mousePos = screenToWorld(mouseScr);

	if (kd['SPACE'])
	{
		var diff = v2sub(mouseScr, mouseScrLast);
		lockCam = false;

		var z = g_camZoom;
		addCamPosition(-diff.x/z, -diff.y/z);
	}
	*/
}
function onMouseDown(e)
{
	/*
	if (!kd['mouse']) kx['mouse'] = true;
	kd['mouse'] = true;
	kc['mouse'] = true;

	// grasping
	grasped = [];

	var bAllowGraspingOne = 1;
	var g = 0;
	if (bAllowGraspingOne)
		g = getCircleAtMouse();
	if (g)
	{
		grasped = g;
		g_lastUsedObj = g;
	}

	if (grasped)
		$('#sliders').hide();
	*/
}
function onMouseUp()
{
	/*
	if (kd['mouse']) kx['mouse'] = true;
	kd['mouse'] = false;
	kc['mouse'] = true;

	$('#sliders').show();
	*/
}

function onKeyDown(e)
{
	/*
	var c = e.keyCode;
	if (!kd[c]) kx[c] = true;
	kd[c] = true;
	kc[c] = true;

	var ch = getAlternativeCode(c);
	if (ch)
	{
		kd[ch] = true;
		kc[ch] = true;
	}

	logKey(c, 'down');
	*/
}

function onKeyUp(e)
{
	/*
	var c = e.keyCode;
	if (kd[c]) kx[c] = true;
	kd[c] = false;
	kc[c] = true;

	var ch = getAlternativeCode(c);
	if (ch)
	{
		kd[ch] = false;
		kc[ch] = true;
	}

	logKey(c);
	*/
}

// tymto by som inak nemusel zapratavat global
function getAlternativeCode(c)
{
	var ch = String.fromCharCode(c);
	if (ch >= 'A' && ch <= 'Z' ||
		ch >= '0' && ch <= '9')
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

	if (c==13) return 'ENTER';
	if (c==27) return 'ESC';
	if (c==32) return 'SPACE';

	if (c==37) return 'LT';
	if (c==38) return 'UP';
	if (c==39) return 'RT';
	if (c==40) return 'DN';
}
