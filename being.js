require([
	// main libraries
	'js/libs/ivank.js',
	'js/libs/Box2d.js',
	'js/libs/jquery.js',

	// modules
	'js/js-extension',
	'js/ivank-extension',
	'js/math',
	'js/camera',
	'js/things',

], setupBeing);

/////////////////////////////////////////
// tu by mala byt len najsamzakladnejsia logika, prip. docasne veci co su vo vyvoji

var cam;
var stage;
var dbg;

var
	b2Vec2			= Box2D.Common.Math.b2Vec2,
	b2BodyDef		= Box2D.Dynamics.b2BodyDef,
	b2Body			= Box2D.Dynamics.b2Body,
	b2FixtureDef	= Box2D.Dynamics.b2FixtureDef,
	b2World			= Box2D.Dynamics.b2World,
	b2PolygonShape	= Box2D.Collision.Shapes.b2PolygonShape;
	b2CircleShape	= Box2D.Collision.Shapes.b2CircleShape;


function createBox2dCircle(radius, density)
{
	var bodyDef = new b2BodyDef();
	bodyDef.type = b2Body.b2_dynamicBody;
	bodyDef.position.Set(0.0, 4.0);

	var circle = new b2CircleShape();
	circle.m_p.Set(2.0f, 3.0f);
	circle.m_radius = 0.5f;

	var fixDef = new b2FixtureDef();
	fixDef.density = 1.0;
	fixDef.shape = circle;

	var body = box2d.CreateBody(bodyDef);
	body.CreateFixture(fixDef);

	return body;
}

function setupBeing()
{
	setupIvank();

	cam = new Camera();

	bindOnMouseWheel(function(d) {
		var fZoom = 1.15;
		cam.zoomIn(d ? fZoom : 1/fZoom);
	});

	// box2d
	box2d = new b2World();
	if ('tmp')
	{
		var body = createBox2dCircle(0.5, 1);

		// get physic props
		var position = body.GetPosition();
		var angle = body.GetAngle()*inDegs;
	}

	//loadWorld('human and animal');
	addThing('human');
	addThing('animal');
}

function setupIvank()
{
	// stage
	stage = new Stage('c');
	//stage.mouseChildren = stage.eventChildren = false;	// wtf?

	dbg = new DebugLayer(stage);

	stage.addEventListener(Event.RESIZE, onRESIZE);
	stage.addEventListener(Event.ENTER_FRAME, onEF);

	// input stuff sa spracovava v inpute, a potom uz sa komunikuje s tym
	stage.addEventListener(KeyboardEvent.KEY_DOWN, onKD);
	stage.addEventListener(KeyboardEvent.KEY_UP  , onKU);
	stage.addEventListener(MouseEvent.MOUSE_MOVE, onMouseMove);
	stage.addEventListener(MouseEvent.MOUSE_DOWN, onMD);
	stage.addEventListener(MouseEvent.MOUSE_UP, onMU);
}

function onEF()
{
	dt = calcDeltaTime();

	dbg.afterFrame();
	drawNewDebugTexts();

	processInputs();
	processMouse();

	// timeStep, velocityIterations, positionIterations
	box2d.Step(1/60, 6, 2);

	cam.afterFrame();
	inputAfterFrame();
}


function drawNewDebugTexts()
{
	// draw fps into corner
}

function onRESIZE()
{

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

	if (pressed('P')) add_('player');

	if (kkd('W')) add_('water');
	if (kkd('O')) add_('oil');
	if (kkd('H')) add_('honey');
	if (kkd('Q')) add_('snow');
	if (kkd('A')) add_('air');

	if (kkd('T')) add_('tree');
	if (kkd('G')) add_('grass');
	if (kkd('L')) add_('leafs');
	if (kkd('V')) add_('lava');

	if (kkd('D')) add_('dirt');
	if (kkd('R')) add_('rocks');
	if (kkd('S')) add_('sand');
	if (kkd('I')) add_('iron');

		if (kd['NUM0']) g_timeMult = 0;
	if (kd['NUM1']) g_timeMult = 0.005;
	if (kd['NUM2']) g_timeMult = 0.02;
	if (kd['NUM3']) g_timeMult = 0.05;

	*/
}
