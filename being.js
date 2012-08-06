require([
	// main libraries
	'js/libs/ivank.js',
	'js/libs/Box2d.js',
	'js/libs/jquery.js',

	// modules
	'js/js-extension',
	'js/ivank-extension',
	'js/math',
	'js/input',
	'js/camera',
	'js/things',

], initBeing);

/////////////////////////////////////////
// tu by mala byt len najsamzakladnejsia logika, prip. docasne veci co su vo vyvoji

// nie ze by to malo byt global, ale nechcem mat vsetko v Engine.Factory.*
var cam;	// from camera.js
var stage;
var bg;
var dbg;
var box2d;
var arrThings = [];
var dt;



function updateThings()
{
	for (var i=0; i < arrThings.length; i++)
	{
		var a = arrThings[i];
		a.update();

		dbg.drawLine(0, 0, a.pos.x, a.pos.y)
	}
}

function addThing(name, x, y)
{
	var t = genThing(name, x, y);
	if (!t) return;

	t.setStage(stage);
	arrThings.push(t);
}

function initBeing()
{
	initIvank();

	cam = getCamera();
	onRESIZE();	// it has init stuff in it

	bindOnMouseWheel(function(d) {
		var fZoom = 1.15;
		cam.zoomIn(d ? fZoom : 1/fZoom);
	});

	initBox2d();

	//loadWorld('human and animal');
	//addThing('human');
	//addThing('animal');

	inputSetFnAfterMM(afterMouseMove);
}

function afterMouseMove()
{
	if (kd('SPACE'))
		cam.move( v2m(mousePosChange, -cam.zoom*0.5) );
}

function initBox2d()
{
	box2d = new Box2D.Dynamics.b2World();
}

function initIvank()
{
	// stage
	stage = new Stage('c');
	//stage.mouseChildren = stage.eventChildren = false;	// wtf?

	dbg = new DebugLayer(stage);

	bg = new Sprite();
	bg.graphics.beginFill(0x6dae42);
	var w = stage.stageWidth;
	var h = stage.stageHeight;
	bg.graphics.drawRect(-w/2, -h/2, w, h);
	stage.addChild(bg);

	stage.addEventListener(Event.RESIZE, onRESIZE);
	stage.addEventListener(Event.ENTER_FRAME, onEnterFrame);

	// input stuff sa spracovava v inpute, a potom uz sa komunikuje s tym
	stage.addEventListener(KeyboardEvent.KEY_DOWN, onKeyDown);
	stage.addEventListener(KeyboardEvent.KEY_UP  , onKeyUp);
	stage.addEventListener(MouseEvent.MOUSE_MOVE, onMouseMove);
	stage.addEventListener(MouseEvent.MOUSE_DOWN, onMouseDown);
	stage.addEventListener(MouseEvent.MOUSE_UP, onMouseUp);
}

function onEnterFrame()
{
	dt = calcDeltaTime();

	dbg.onFrame();
	drawNewDebugTexts();

	processInputs();
	processMouse();

	// timeStep, velocityIterations, positionIterations
	if (box2d) box2d.Step(1/60, 6, 2);

	updateThings();

	cam.updateStage(stage);
	inputAfterFrame();
}

function out()
{
	var s = '';
	for (var i=0; i < arguments.length; i++)
	{
		var a = arguments[i];

		s += nice(a)+' ';
	}
	console.log(s);
}

function drawNewDebugTexts()
{
	// draw fps into corner
	var fps = calcAvgFps(dt);
	dbg.drawText(fps, 0, 0);

	out('pos', mousePos.x, mousePos.y);
	out('diff', mousePosChange.x, mousePosChange.y);

	// dbg.drawText(mousePosChange.x+' '+mousePosChange.y, 50, 50);
	// dbg.drawText(cam.zoom, -50, 50);
}

function onRESIZE()
{
	var w = stage.stageWidth;
	var h = stage.stageHeight;
	cam.onRESIZE(w, h);
}

function processInputs()
{
	/*
	var w = stage.stageWidth;
	var h = stage.stageHeight;

	var fZoom = 1.05;

	if (kd['NUM*']) resetCam();
	if (kd['NUM+']) camZoomIn(fZoom);
	if (kd['NUM-']) camZoomOut(fZoom);

	if (pressed('C')) lockCam = !lockCam;
	if (lockCam && g_lastUsedObj)
	{
		var p = g_lastUsedObj.p;
		setCamPosition(p.x, p.y);
	}

	*/
}
function processMouse()
{

}
