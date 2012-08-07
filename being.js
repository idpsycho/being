require([
	// main libraries
	'js/libs/ivank.js',
	//'js/libs/Box2d.js',
	'js/libs/Box2d.min.js',
	'js/libs/jquery.js',

	// modules
	'js/js-extension',
	'js/ivank-extension',
	'js/math',
	'js/input',
	'js/camera',
	'js/things',

], initBeing);

var g_ikStage;
var g_ikWorld;
var g_cam;
var g_box2d;
var g_arrThings = [];
var g_dt;
var g_player;
var dbg;	// world-space debug
var gui;	// screen-space debug


function loadWorld(s)
{
	g_cam.setZoom(0.5);

	g_player = addThing('human', 0, 0);
	g_cam.lockTo(g_player);

	addThingN(3, 'animal');
	addThingN(100, 'tree');
}
function addThingN(n, name)
{
	while (n--) addThing(name);
}
function addThing(name, x, y)
{
	var m = 3 / g_ivankRatio;
	var w = m * g_ikStage.stageWidth;
	var h = m * g_ikStage.stageHeight;

	var t = genThing(name, x, y);
	if (!t) return;

	t.setWorld(g_ikWorld);
	t.setBox2d(g_box2d);

	var v = v2rndxy(w, h);
	if (isDef(x, y))
		v = v2(x, y);

	t.setPos( v );
	out('adding', name, 'at', v);

	g_arrThings.push(t);
	return t;
}

/*
		███    ████   ███    █  █    ███
		█  █   █      █  █   █  █   █
		█  █   ██     ███    █  █   █ ██
		█  █   █      █  █   █  █   █  █
		███    ████   ███    ████    ███
*/
function drawNewDebugTexts()
{
	// draw fps into corner
	var fps = calcAvgFps(g_dt);
	//gui.drawText(fps, 0, 0);
	//gui.drawText(nice(g_cam.pos, ':', g_cam.zoom), 0, 30);

	var p = g_player.pos;
	var vel = g_player.body.GetLinearVelocity();
	//dbg.drawText(nice(vel), p.x, p.y);
}




/*
		████   ███     ██    █   █   ████
		█      █  █   █  █   ██ ██   █
		██     ███    ████   █ █ █   ██
		█      █  █   █  █   █   █   █
		█      █  █   █  █   █   █   ████
*/
function updateThings()
{
	for (var i=0; i < g_arrThings.length; i++)
	{
		var a = g_arrThings[i];
		a.update();

		//dbg.drawLine(0, 0, a.pos.x, a.pos.y)
	}
}

var framecount = 0;
function onEnterFrame()
{
	framecount++;
	g_dt = calcDeltaTime();

	dbg.onFrame();
	gui.onFrame();
	drawNewDebugTexts();

	processInputs();
	processMouse();

	// timeStep, velocityIterations, positionIterations
	if (g_box2d) g_box2d.Step(1/60, 6, 2);

	updateThings();

	g_cam.updateWorld(g_ikWorld);

	inputAfterFrame();
}

function processMouse()
{
	if (kd('SPACE'))
		g_cam.screenDrag(mouseScrChange);
}

function processInputs()
{
	if (kd('NUM*')) resetCam();
	if (kd('NUM+')) g_cam.zoomIn();
	if (kd('NUM-')) g_cam.zoomOut();

	if (0)
	{
		if (kd('UP,W')) g_cam.move('up');
		if (kd('DN,S')) g_cam.move('dn');
		if (kd('LT,A')) g_cam.move('lt');
		if (kd('RT,D')) g_cam.move('rt');
	}
	else
	if (g_player)
	{
		if (kd('UP,W')) g_player.action('up');
		if (kd('DN,S')) g_player.action('dn');
		if (kd('LT,A')) g_player.action('lt');
		if (kd('RT,D')) g_player.action('rt');

		if (kd('UP,DN,LT,RT,W,A,S,D'))
			g_cam.lockTo(g_player);
	}

	//if (kp('C')) lockCam = !lockCam;
}



/*

		█   █  █   █   █████
		█   ██ █   █     █
		█   █ ██   █     █
		█   █  █   █     █
		█   █  █   █     █
*/

function initBeing()
{
	initIvank();

	g_cam = getCamera();
	onRESIZE();	// it has init stuff in it
	initBox2d();
	bindOnMouseWheel( g_cam.zoomWheel );

	g_cam.setZoom(0.5);

	loadWorld('human in forest');
}

function initBox2d()
{
	var b2Vec2 = Box2D.Common.Math.b2Vec2;
	var b2World = Box2D.Dynamics.b2World;

	g_box2d = new b2World( new b2Vec2(0, 0), false );
}

function initIvank()
{
	// STAGE = WORLD + GUI
	g_ikStage = new Stage('c');

	var w = g_ikStage.stageWidth;
	var h = g_ikStage.stageHeight;

	// BACKGROUND LAYER
	ikBg = new Sprite();	// see onRESIZE
	g_ikStage.addChild(ikBg);

	// WORLD LAYER
	g_ikWorld = new Sprite();
	g_ikStage.addChild(g_ikWorld);

	// DEBUG LAYER
	dbg = new DebugLayer(g_ikWorld, 'apply ratio');
	gui = new DebugLayer(g_ikStage);

	// GUI LAYER
	// ...

	// events
	g_ikStage.addEventListener(Event.RESIZE,			onRESIZE);
	g_ikStage.addEventListener(Event.ENTER_FRAME,		onEnterFrame);
	g_ikStage.addEventListener(KeyboardEvent.KEY_DOWN,	onKeyDown);
	g_ikStage.addEventListener(KeyboardEvent.KEY_UP,	onKeyUp);
	g_ikStage.addEventListener(MouseEvent.MOUSE_MOVE,	onMouseMove);
	g_ikStage.addEventListener(MouseEvent.MOUSE_DOWN,	onMouseDown);
	g_ikStage.addEventListener(MouseEvent.MOUSE_UP,		onMouseUp);
}

function onRESIZE()
{
	var w = g_ikStage.stageWidth;
	var h = g_ikStage.stageHeight;
	g_cam.onRESIZE(w, h);

	ikBg.graphics.clear();
	ikBg.graphics.beginFill(0x6dae42);
	ikBg.graphics.drawRect(0, 0, w, h);
}
