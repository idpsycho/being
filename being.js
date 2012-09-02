require([
	// main libraries
	'js/libs/ivank',
	'js/libs/Box2d',
	//'js/libs/Box2d.min',
	'js/libs/jquery',

	// modules
	'js/js-extension',
	'js/ivank-extension',
	'js/math',
	'js/input',
	'js/camera',
	'js/parts-base',
	'js/parts-alive',
	'js/parts-ai',
	'js/parts',
	'js/thing',
	'js/things',
	'js/neurons',

], initBeing);

var g_ikStage;
var g_ikWorld;
var g_ikLayers = {};
var g_cam;
var g_box2d;
var g_arrThings = [];
var g_dt;
var g_player;
var g_wolf;
var dbg;	// world-space debug
var gui;	// screen-space debug
var arrErrors = [];


function loadWorld(s)
{
	//g_cam.setZoom(1);

	g_player = newThing('human', {x:0,y:0});
	g_cam.lockTo(g_player);

	g_wolf = newThingN(1, 'wolf');
	newThingN(5, 'deer');
	newThingN(60, 'tree');
	//newThingN(20, 'rock');
}
function newThingN(n, name, def)
{
	var x;
	while (n--) x=newThing(name, def);
	return x;
}
function newThing(name, def)
{
	def = defined(def, {});
	if (notDef(def.x, def.y))
		def.rnd = 1;

	var t = genThing(name, def);
	if (!t) return;

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
function drawDebugTexts()
{
	// draw fps into corner
	var fps = calcAvgFps(g_dt);
	//gui.drawText(fps, 0, 0);

	var sw = g_ikStage.stageWidth;
	var sh = g_ikStage.stageHeight;

	if (0)
	if (ai)
	{

		if (kd('1')) ai.stimul('1', 'in');
		if (kd('2')) ai.stimul('2', 'in');
		if (kd('3')) ai.stimul('3', 'in');
		if (kd('4')) ai.stimul('4', 'in');
		if (kd('5')) ai.stimul('5', 'out');
		if (kd('6')) ai.stimul('6', 'out');
		if (kd('7')) ai.stimul('7', 'out');

		ai.learn();
		//ai.work();

		var w = sw/3;
		var x = sw-w;

		gui.drawRect(x, 0, w, sh, '222', 0.5);

		var r = 30;
		var arr, yStep;

		function clrA(act) {
			return lerpClr('fff', '0f0', act)
		}

		// inputs
		arr = ai.getInputs();
		yStep = 0.8 / arr.length;
		$.each(arr, function(i, e)
		{
			e.x = x+w/3;
			e.y = (0.1+i*yStep)*sh;
			gui.drawCircle(e.x, e.y, r, clrA(e.activity));
			gui.drawText(e.name, e.x, e.y-20);
			gui.drawText(nice(e.activity), e.x, e.y);
		});

		// outputs
		arr = ai.getOutputs();
		yStep = 0.8 / arr.length;
		$.each(arr, function(i, e)
		{
			e.x = x+w/3*2;
			e.y = (0.1+i*yStep)*sh;
			gui.drawCircle(e.x, e.y, r, clrA(e.activity));
			gui.drawText(e.name, e.x, e.y-20);
			gui.drawText(nice(e.activity), e.x, e.y);
		});

		// links
		arr = ai.links;
		$.each(arr, function(i, e)
		{
			if (e.nA.in || e.nA.out || e.nB.in || e.nB.out)
			{
				var wLine = 1+log10(e.weight*150);
				var ctr = v2center(e.nA, e.nB);

				gui.drawLineV(e.nA, e.nB, clrA(e.activity), wLine);
				//gui.drawText( nice(e.weight), ctr.x, ctr.y );
			}
		});

		ai.calm();
	}
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
		g_arrThings[i].update();

	var bRemove = 0;
	for (var i=0; i < g_arrThings.length; i++)
	{
		var a = g_arrThings[i];
		if (a.bRemove)
			a.remove('destroy');

		bRemove |= a.bRemove;
	}
	if (bRemove)
		g_arrThings = g_arrThings.filterByAttr('bRemove', true, 'not');
}

var framecount = 0;
function onEnterFrame()
{
	framecount++;
	g_dt = calcDeltaTime();

	dbg.onFrame();
	gui.onFrame();
	drawDebugTexts();

	processInputs();

	// timeStep, velocityIterations, positionIterations
	if (g_box2d) g_box2d.Step(1/60, 6, 2);

	updateThings();

	g_cam.updateWorld(g_ikWorld);

	inputAfterFrame();

	drawPlayerGui();
	drawConsoleErrors();
}

function drawConsoleErrors()
{
	if (!arrErrors.length) return;

	gui.g.beginFill(0, 0.5);
	gui.g.drawRect(10, 10, 500, arrErrors.length*20+20);
	$.each(arrErrors, function(i, e)
	{
		gui.drawText(e, 20, 20+i*20, 'f00');
	});
}

function drawPlayerGui()
{
//	if (g_player)
//		g_player.drawStats('gui');
}

function processInputs()
{
	////////////////////////////////////////////////////
	// mouse

	var hovered = QueryCircleNearest(mousePos);
	if (hovered)
	{
		hovered.drawStats();
		if (kd('C'))
			g_cam.lockTo(hovered);
	}
	if (g_cam.lockedOn)
		g_cam.lockedOn.drawStats('gui');

	if (kd('SPACE'))
		g_cam.screenDrag(mouseScrChange);

	if (g_player)
	{
		if (kp('MOUSE'))
		{
			var obj = QueryCircleNearest(mousePos, 0.1, g_player);
			if (obj)
			{
				var maxDist = obj.radius + g_player.radius;
				if (v2isCloserThan(obj.pos, g_player.pos, maxDist*1.2))
					g_player.partDo('nutrition.bite', obj);
			}
		}
	}

	////////////////////////////////////////////////////
	// keyboard

	if (kd('NUM*')) resetCam();
	if (kd('NUM+')) g_cam.zoomIn();
	if (kd('NUM-')) g_cam.zoomOut();

	if (g_player)
	{
		var bFast = !kd('SHIFT');
		if (kd('UP,W')) g_player.move('up', bFast);
		if (kd('DN,S')) g_player.move('dn', bFast);
		if (kd('LT,A')) g_player.move('lt', bFast);
		if (kd('RT,D')) g_player.move('rt', bFast);

		if (kp('B'))	g_player.partDo('health.bitten', 10);
	}

	if (kd('UP,DN,LT,RT,W,A,S,D'))
	{
		g_cam.lockTo(g_player);
	}
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
	window.onerror = function(err) { arrErrors.push(err); }

	initIvank();

	g_cam = getCamera();
	onRESIZE();	// it has init stuff in it
	initBox2d();
	//g_cam.setZoom(1);

	bindOnMouseWheel( g_cam.zoomWheel );

	loadWorld('human in forest');

}

function initBox2d()
{
	var b2Vec2 = Box2D.Common.Math.b2Vec2;
	var b2World = Box2D.Dynamics.b2World;

	g_box2d = new b2World( new b2Vec2(0, 0), false );
	g_box2d.Step(1/60, 6, 2);
}

function ikAddLayer(name)
{
	var layer = new Sprite();
	g_ikWorld.addChild(layer);
	g_ikLayers[name] = layer;
}
function ikGetLayer(name)
{
	var l = g_ikLayers[name];
	return l ? l : g_ikLayers['world'];
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

	// WORLD and LAYERS
	g_ikWorld = new Sprite();
	g_ikStage.addChild(g_ikWorld);

	ikAddLayer('ground');
	ikAddLayer('world');
	ikAddLayer('trees');
	ikAddLayer('sky');

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
