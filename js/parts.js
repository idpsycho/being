
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
		g.clear();
		g.beginFill(def.clr);

		var v = getDefPosition(def);
		var x = g_ivankRatio * v.x;
		var y = g_ivankRatio * v.y;
		var r = g_ivankRatio * def.radius;
		g.drawCircle(x, y, r);
	}
	t.setColor = function(clr)
	{
		clr = normalizeClr(clr);
		def.clr = clr;

		t.redrawSprite();
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
	}

	t.posChanged = function(v, r)
	{
		if (isDef(v))
			t.body.SetPosition( b2v(v) );

		if (isDef(r))
			t.body.SetAngle( r*inRads );
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

function PartControl(def, thing)
{
	var t = this;
	t.thing = thing;

	t.maxSpeed = 3;
	t.maxRot = 25;

	t.update = function()
	{
		var partBody = thing.body;
		var b = thing.body ? thing.body.body : null;

		if (t.moveBy)	t.updatePosition(b);
		if (t.turnTo)	t.updateDirection(b);

		t.moveBy = null;
		t.turnTo = null;
	}

	t.updatePosition = function(b)
	{
		if (!b)
		{
			thing.addPos( t.moveBy );
		}
		else
		{
			v2multMe(t.moveBy, 1);
			b.ApplyImpulse( b2v(t.moveBy), b.GetWorldCenter() );

			t.limitSpeed();
		}
	}
	t.updateDirection = function(b)
	{
		if (!b)
		{
			thing.setRot( t.turnTo );
		}
		else
		{
			var ang = b.GetAngle()*inDegs;
			var diff = t.turnTo - ang;
			diff = cycleIn(diff, -180, 180);

			diff *= 0.2;
			diff = absmin(diff, t.maxRot);

			b.SetAngle( (ang+diff)*inRads );
		}
	}

	t.limitSpeed = function()
	{
		var partBody = thing.body;
		if (!partBody) return;
		var b = partBody.body;

		var mx = t.maxSpeed;
		var vel = b.GetLinearVelocity();
		var len = v2len(vel);
		if (len > mx)
			v2multMe(vel, mx/len);

		b.SetLinearVelocity(vel);
	}

	t.turn = function(degs, spd)
	{
		t.turnTo = degs;

		if (spd) t.rotSpeed = spd;
	}

	t.move = function(v, spd)
	{
		if (!t.moveBy)
			t.moveBy = v2null();

		t.maxSpeed = defined(spd, 3);

		if (typeof v == 'string')
		{
			var f = 1;
			if (v == 'up') v = v2(0, -f)
			if (v == 'dn') v = v2(0, f)
			if (v == 'lt') v = v2(-f, 0)
			if (v == 'rt') v = v2(f, 0)
		}

		v2addMe(t.moveBy, v);
	}

}



////////////////////////////////////////////////////////
////////////////////////////////////////////////////////


function PartAnchor(def, thing)
{
	var t=this;
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


function PartNutrition(def, thing)
{
	var t=this;
	t.thing = thing;

	t.max = 100;
	t.now = 50;

	t.burnIdle = 0.1/60;
	t.burnActive = 0.8/60;

	t.update = function()
	{
		t.now -= t.burnIdle;
		t.now -= t.burnActive * thing.getSpeed();
		//out(t.now);
	}
	t.eat = function(amount)
	{
		t.now -= amount;
	}
	t.getNutrition01 = function()
	{
		var f = rangeUnit(t.now, t.max);
		return minmax(f, 0, 1);
	}
}

function PartAI(def, thing)
{
	var t=this;
	t.thing = thing;

	t.nextT = 0;
	t.action = 'idle';

	t.update = function()
	{
		// treba sa obzerat okolo za vsetkymi ruchmi (predatory, praskania konarov)
		// zatial len simulacia
		var nowT = time();
		if (t.nextT > nowT)
		{
			if (t.action)
				t.doAction();
			return;
		}

		// decide action
		t.nextT = nowT + 1000;//rnd(500, 5000);

		t.action = 'go';
	}

	t.doAction = function()
	{
		if (!t.to) {
			t.to = rndi(7) ? v2rndxy(40, 20) : g_player;

			if (t.to==g_player)
			t.thing.doWith('eye', function(eye) {
				eye.circle.setColor('f11');
			});
		}

		thing.turn( v2angle(thing.getVel()) );

		var B = t.to==g_player;
		var maxSpeed = 1;
		var fr = thing.pos;
		var to;
		if (B)
		{
			to = g_player.pos;
			maxSpeed = 3.1;
		}
		else
			to = t.to;

		thing.move( v2dirTo(fr, to), maxSpeed );
		if (v2dist(fr, to) < thing.radius*2)
		{
			if (B) t.thing.doWith('eye', function(eye) {
					eye.circle.setColor('fff');
				});
			t.to = null;
			t.action = null;
		}
	}

}
