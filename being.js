require([
	// main libraries
	'js/libs/ivank.js',
	'js/libs/Box2d.js',
	//'js/libs/Box2d.min.js',
	'js/libs/jquery.js',

	// modules
	'js/js-extension',
	'js/ivank-extension',
	'js/math',
	'js/input',
	'js/camera',
	'js/parts',
	'js/thing',
	'js/things',

], initBeing);

var g_ikStage;
var g_ikWorld;
var g_ikLayers = {};
var g_cam;
var g_box2d;
var g_arrThings = [];
var g_dt;
var g_player;
var dbg;	// world-space debug
var gui;	// screen-space debug
var arrErrors = [];


function loadWorld(s)
{
	//g_cam.setZoom(1);

	g_player = addThing('human', 0, 0);
	g_cam.lockTo(g_player);

	addThingN(13, 'animal');
	addThingN(70, 'tree');
}
function addThingN(n, name)
{
	while (n--) addThing(name);
}
function addThing(name, x, y)
{
	var m = 3 / g_ivankRatio * 0.6;
	var w = m * g_ikStage.stageWidth;
	var h = m * g_ikStage.stageHeight;

	var t = genThing(name);
	if (!t) return;

	if (isDef(x, y))
		t.setPos(x, y);
	else
	{
		var tried=0;
		do
		{
			t.setPos( v2rndxy(w, h) );
		}
		while(t.isColliding() && tried++<100);
		//if (tried>1) out('tries', tried);
		//ivank_drawText(t.sprite, tried, 0, 0);
	}

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

	//var p = g_player.pos;
	//var vel = g_player.body.GetLinearVelocity();
	//dbg.drawText(nice(vel), p.x, p.y);

	//gui.drawText('n='+g_box2d.GetBodyCount()+' j='+g_box2d.GetJointCount()+' c='+g_box2d.GetContactCount());
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
	if (!g_player) return;

	sw = g_ikStage.stageWidth;
	sh = g_ikStage.stageHeight;
	w = -sw*0.2;
	h = -20;
	x = sw - sw*0.05;
	y = sh - sh*0.05;

	var n = g_player.nutrition;
	if (!n) return;

	var b = 1;	// border
	var f01 = n.getNutrition01();
	gui.drawRect(x+b, y+b, w-b*2, h-b*2, 0x331100);
	gui.drawRect(x, y, w*f01, h, 0xc26d31);
	//out(f01);
}

function processMouse()
{
	if (kd('SPACE'))
		g_cam.screenDrag(mouseScrChange);

	if (g_player)
	{
		// VIEWING ANGLE
		var v = v2sub(mousePos, g_player.pos);
		var lookAng = v2angle(v);

		var diffAng = lookAng - g_player.rot;
		diffAng = cycleIn(diffAng, -180, 180);

		// par stupnov sa natocia oci, zvysok cela bytost
		var eyeAng = absmin(diffAng, 45);

		//gui.drawText( nice(eyeAng, lookAng, diffAng) );
		g_player.doWith('eye', function(eye) {
			eye.setRot( eyeAng );
		});

		if (g_player.getSpeed() > 1.5)
			eyeAng = 0;
		g_player.turn( lookAng-eyeAng );

		//return;

		// VIEW CONE
		var fov = 100;
		var dist = 15;
		var v1 = g_player.pos;
		var r = lookAng;
		var viewCone = createFovShape(v1, r, fov, dist);

		var num = 0;
		g_box2d.QueryShape(function(e)
		{
			num++;
			var data = e.GetBody().GetUserData();
			if (data)
			{
				var p = data.thing.pos;
				var scr = g_cam.toScreen(p);
				//dbg.drawLine(v1.x, v1.y, p.x, p.y, 'fff');
			}
			return true;
		}, viewCone, null);

		//dbg.drawText(num, g_player.pos.x+0.5, g_player.pos.y);


	}

}
	// TODO HODIT NIEKAM
	function createFovShape(p1, rot, fov, dist)
	{
		var arr = [ v2(0, 0) ];

		// - scale sides (so that far point is at DIST, but sides are further)
		if ('cone')
		{
			forRangeSteps(-fov/2, fov/2, 3, function(val)
			{
				var vF = v2fromAngle(rot, dist);
				var p = v2rot(vF, val);
				arr.push( p );
			});
		}
		else
		// make polygon round, its more points, but its realistic cone
		{
			// scale distance, so that far point stays exactly away
			// (this actually scales vectors of side-boundaries)
			dist /= Math.cos(fov/2*inRads);

			var vF = v2fromAngle(rot, dist);
			var p2 = v2rot(vF, -fov/2);
			var p3 = v2rot(vF, fov/2);

			arr.push( p2 );
			arr.push( p3 );
		}

		for (var i=0; i < arr.length; i++)
			v2addMe( arr[i], p1 );

		//dbg.drawPoly(arr, 0, 2);

		var b2PolygonShape	= Box2D.Collision.Shapes.b2PolygonShape;
		var sh = new b2PolygonShape();
		sh.SetAsArray( b2vArr(arr), arr.length );

		return sh;
	}

function processInputs()
{
	if (kd('NUM*')) resetCam();
	if (kd('NUM+')) g_cam.zoomIn();
	if (kd('NUM-')) g_cam.zoomOut();

	if (g_player)
	{
		var spd = kd('SHIFT') ? 1 : 3;
		if (kd('UP,W')) g_player.move('up', spd);
		if (kd('DN,S')) g_player.move('dn', spd);
		if (kd('LT,A')) g_player.move('lt', spd);
		if (kd('RT,D')) g_player.move('rt', spd);
	}

	//out( kd('SHIFT')?1:0 );

	if (kd('UP,DN,LT,RT,W,A,S,D'))
	{
		if (g_player && g_player.pos)
		{
			var v = v2add(g_player.pos, v2rnd(g_player.radius/2));
			//if (!rndi(3)) addThing('blood', v.x, v.y);
		}

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
