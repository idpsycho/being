
function getDefPosition(def)
{
	var r = def.parentRadius;
	if (!r) r = 0;

	if (def.pos == 'rnd')	def.pos = v2rnd(0.66);
	if (def.x == 'rnd')		def.x = rnd11(0.66);
	if (def.y == 'rnd')		def.y = rnd11(0.66);

	var x = defined(def.x, 0);
	var y = defined(def.y, 0);
	var v = defined(def.pos, v2(x, y));

	v2multMe(v, r);
	return v;
}

function randomPointOnMap()
{
	return v2rndxy(20, 10);
}









		//  ███   █   ███     ███   █      ████
		// █      █   █  █   █      █      █
		// █      █   ███    █      █      ██
		// █      █   █  █   █      █      █
		//  ███   █   █  █    ███   ████   ████

function PartCircle(def, thing)
{
	assert(def.clr, thing, 'Circle init');
	var t = this;
	t.name = 'circle';
	t.thing = thing;

	function init()
	{
		t.createSprite();
	}

	t.createSprite = function()
	{
		t.sprite = new Sprite();

		t.redrawSprite();

		assert(thing && thing.sprite,
				"parent must have sprite");

		thing.sprite.addChild(t.sprite);
	}
	t.redrawSprite = function()
	{
		var sp = t.sprite;
		var g = sp.graphics;

		def.alpha = defined(def.alpha, 1);

		g.clear();
		g.beginFill(def.clr, def.alpha);

		var v = getDefPosition(def);
		var x = g_ivankRatio * v.x;
		var y = g_ivankRatio * v.y;
		var r = g_ivankRatio * def.radius;
		g.drawCircle(x, y, r);
	}
	t.getColor = function() { return def.clr; }
	t.getAlpha = function() { return def.alpha; }
	t.setColor = function(clr)
	{
		clr = normalizeClr(clr);
		if (clr == def.clr) return;
		def.clr = clr;

		t.redrawSprite();
	}
	t.setAlpha = function(a01)
	{
		var diff = abs(a01, def.alpha);
		if (diff < 0.015)
			return;

		def.alpha = a01;

		t.redrawSprite();
	}

	t.update = function()
	{
		//t.posChanged(thing.pos);
	}

	t.remove = function()
	{
		return;// teoreticky staci parent sprite zrusit
		if (!t.sprite || !t.sprite.stage)
			return 'wtf';

		t.sprite.stage.removeChild( t.sprite );
		t.sprite = null;
	}
	init();
}











		// ███     ███    ███    █   █
		// █  █   █   █   █  █    █ █
		// ███    █   █   █  █     █
		// █  █   █   █   █  █     █
		// ███     ███    ███      █

function PartBody(def, thing)	// def: radius, density
{
	var t = this;
	t.name = 'body';
	t.thing = thing;

	function init()
	{
		t.body = createBox2dCircle(def.radius, def.density, def.damping);
		t.body.SetUserData(t);
	}

	t.update = function()
	{
		var b2 = t.body.GetPosition();
		thing.pos = v2c(b2);

		// dont have any viewing angle, so this isnt necessary yet
		thing.rot = t.body.GetAngle()*inDegs;

		t.bUpdate = false;
	}

	t.posChanged = function(v, r)
	{
		if (isDef(v))
			t.body.SetPosition( b2v(v) );

		if (isDef(r))
			t.body.SetAngle( r*inRads );
	}

	t.remove = function()
	{
		g_box2d.DestroyBody(t.body)
	}
	////////////////////////////////////////////////////////////

	function createBox2dCircle(radius, density, damping)
	{
		assert(radius, density, 'createbox2dcircle problem');

		var	b2Vec2			= Box2D.Common.Math.b2Vec2,
			b2Body			= Box2D.Dynamics.b2Body,
			b2BodyDef		= Box2D.Dynamics.b2BodyDef,
			b2FixtureDef	= Box2D.Dynamics.b2FixtureDef,
			b2CircleShape	= Box2D.Collision.Shapes.b2CircleShape;

		var bodyDef	= new b2BodyDef();
		var circle	= new b2CircleShape();
		var fixDef	= new b2FixtureDef();

		if (density) {
			fixDef.density = density;
			bodyDef.type = b2Body.b2_dynamicBody;
		}
		circle.m_radius = radius;
		fixDef.shape = circle;

		damping = defined(damping, 5);

		var body = g_box2d.CreateBody(bodyDef);
		body.CreateFixture(fixDef);
		body.SetLinearDamping( damping );
		body.SetAngularDamping( damping );
		//body.SetAngle( rnd(360)*inRads );

		return body;
	}

	init();
}









		//  ██    █  █    ███   █  █    ███    ███
		// █  █   ██ █   █      █  █   █   █   █  █
		// ████   █ ██   █      ████   █   █   ███
		// █  █   █  █   █      █  █   █   █   █  █
		// █  █   █  █    ███   █  █    ███    █  █

function PartAnchor(def, thing)
{
	var t=this;
	t.name = 'anchor';
	t.thing = thing;

	function init()
	{
		var b = thing.getBox2dBody();

		t.anchor = createBox2dStaticAnchor( def.radius*0.2 );
		t.joint = createBox2dJoint(b, t.anchor, def.freq, def.damp);
		t.anchor.SetUserData(t);

		t.posChanged( thing.pos );

		assert(t.anchor, 'anchor - body init')
		assert(t.joint, 'anchor - joint init')
	}

	t.posChanged = function(v)
	{
		t.anchor.SetPosition( b2v(v) );
	}

	function createBox2dJoint(b1, b2, freq, damp)
	{
		var j = b2DistJointInit(b1, b2);
		j.frequencyHz = defined(freq, 1);
		j.dampingRatio = defined(damp, 0.5);

		g_box2d.CreateJoint(j);

		return j;
	}

	function b2DistJointInit(b1, b2)
	{
		var j = new Box2D.Dynamics.Joints.b2DistanceJointDef();
		j.Initialize(b1, b2, b1.GetWorldCenter(), b2.GetWorldCenter());
		return j;
	}

	function createBox2dStaticAnchor(radius)
	{
		var b2Body			= Box2D.Dynamics.b2Body,
			b2BodyDef		= Box2D.Dynamics.b2BodyDef,
			b2FixtureDef	= Box2D.Dynamics.b2FixtureDef,
			b2CircleShape	= Box2D.Collision.Shapes.b2CircleShape;

		var bodyDef		= new b2BodyDef();
		var circle		= new b2CircleShape();
		var fixDef		= new b2FixtureDef();
		bodyDef.type	= b2Body.b2_staticBody;
		circle.m_radius	= radius ? radius : 0.001;
		fixDef.shape	= circle;
		//fixDef.isSensor = true;

		var b = g_box2d.CreateBody(bodyDef);
		b.CreateFixture(fixDef);

		return b;
	}

	init();
}









		// ███    █    ███     ██    ███    ███    ████    ██    ███     ███
		// █  █   █   █       █  █   █  █   █  █   █      █  █   █  █   █
		// █  █   █    ███    ████   ███    ███    ██     ████   ███     ███
		// █  █   █       █   █  █   █      █      █      █  █   █  █       █
		// ███    █    ███    █  █   █      █      ████   █  █   █  █    ███

function PartDisappears(def, thing)
{
	var t=this;
	t.name = 'disappears';
	t.thing = thing;

	t.created = time();

	t.update = function()
	{
		if (!t.disappearing)
		{
			t.disappearing = true;
			t.alpha = thing.partDo('circle.getAlpha');
			t.origAlpha = t.alpha;
		}

		var secs = def.after / 1000;
		t.alpha -= t.origAlpha/(secs*60);

		if (t.alpha > 0)
			thing.partDo('circle.setAlpha', t.alpha);
		else
			thing.remove();
	}
}








