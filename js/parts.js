
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

function PartCircle(def, thing)
{
	assert(def.clr, thing, 'Circle init');
	var t = this;

	function init()
	{
		t.sprite = t.createSprite();
	}

	t.createSprite = function()
	{
		var sp = new Sprite();

		var g = sp.graphics;
		g.beginFill(def.clr);

		var v = getDefPosition(def);
		var x = g_ivankRatio * v.x;
		var y = g_ivankRatio * v.y;
		var r = g_ivankRatio * def.radius;
		g.drawCircle(x, y, r);

		assert(thing && thing.sprite,
				"parent must have sprite");

		thing.sprite.addChild(sp);
		return sp;
	}

	t.update = function()
	{
		//t.posChanged(thing.pos);
	}

	init();
}


function PartBody(def, thing)	// def: radius, density
{
	var t = this;

	function init()
	{
		t.body = createBox2dCircle(def.radius, def.density, def.damping);
	}

	t.update = function()
	{
		var b2 = t.body.GetPosition();
		thing.pos = v2c(b2);

		// dont have any viewing angle, so this isnt necessary yet
		thing.rot = t.body.GetAngle()*inDegs;
	}

	t.posChanged = function(v)
	{
		t.body.SetPosition( b2v(v) );
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
		body.SetAngle( rnd(360) );

		return body;
	}

	init();
}

function PartControl(def, thing)
{
	var t = this;

	t.update = function()
	{
		var partBody = thing.body;
		if (!partBody) return;
		var b = partBody.body;

		if (!b)
		{
			thing.addPos( t.currAction );
			//v2addMe( thing.pos, t.currAction );
		}
		else
		{
			b.SetLinearDamping(7);
			if (!t.currAction) return;

			v2multMe(t.currAction, 1);
			b.ApplyImpulse( b2v(t.currAction), b.GetWorldCenter() );

			t.limitSpeed(3);
		}

		t.currAction = null;
	}
	t.limitSpeed = function(maxSpeed)
	{
		var partBody = thing.body;
		if (!partBody) return;
		var b = partBody.body;

		var vel = b.GetLinearVelocity();
		var len = v2len(vel);
		if (len > maxSpeed)
			v2multMe(vel, maxSpeed/len);

		b.SetLinearVelocity(vel);
	}

	t.move = function(v)
	{
		if (!t.currAction)
			t.currAction = v2null();

		if (typeof v == 'string')
		{
			var f = 1;
			if (v == 'up') v = v2(0, -f)
			if (v == 'dn') v = v2(0, f)
			if (v == 'lt') v = v2(-f, 0)
			if (v == 'rt') v = v2(f, 0)
		}

		v2addMe(t.currAction, v);
	}

}



////////////////////////////////////////////////////////
////////////////////////////////////////////////////////


function PartAnchor(def, thing)
{
	var t=this;

	function init()
	{
		var b = thing.getBox2dBody();

		t.anchor = createBox2dStaticAnchor( def.radius*0.2 );
		t.joint = createBox2dJoint(b, t.anchor, def.freq, def.damp);
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
