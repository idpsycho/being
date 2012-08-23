
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

//////////////////
// radius stuff
// function chooseRadius(val)
// {
// 	if (notDef(val))	return 1.0;	// sameRatio
// 	if (!val.length)	return val;
// 	else				return rnd( val[0], val[1] );
// }
// function calcRadius(defRadius, parent)
// {
// 	var r = chooseRadius(defRadius);
// 	if (parent)
// 		r *= parent.radius;

// 	return r;
// }
///////////////
// 		defP.radius = calcRadius(defP.radius, t);
function overridePartDef(defP, def)
{
	defP.radius = defined(defP.radius, def.radius);

	// $.each(def, function(i, e)
	// {
	// 	defP[i] = defined(defP[i], e);
	// });
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











		//  ███    ███    █  █   █████   ███     ███    █
		// █      █   █   ██ █     █     █  █   █   █   █
		// █      █   █   █ ██     █     ███    █   █   █
		// █      █   █   █  █     █     █  █   █   █   █
		//  ███    ███    █  █     █     █  █    ███    ████

function PartControl(def, thing)
{
	var t = this;
	t.name = 'control';
	t.thing = thing;

	t.maxSpeed = defined(def.maxSpeed, 3);
	t.wantSpeed = t.maxSpeed;
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
			t.emitFootprint();
		}
	}

	t.lastFootprint = v2null();
	t.emitFootprint = function()
	{
		if (thing.getSpeed() < 0.5)
			return;

		if (v2isCloserThan(t.lastFootprint, thing.pos, 2))
			return;

		addThing('footprint', thing.pos);
		t.lastFootprint = v2c(thing.pos);
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

		var mx = t.wantSpeed;
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

	t.move = function(v, bFast)
	{
		if (!t.moveBy)
			t.moveBy = v2null();

		t.wantSpeed = bFast ? t.maxSpeed : 1;

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










		// █  █   █  █   █████   ███    █   █████   █    ███    █  █
		// ██ █   █  █     █     █  █   █     █     █   █   █   ██ █
		// █ ██   █  █     █     ███    █     █     █   █   █   █ ██
		// █  █   █  █     █     █  █   █     █     █   █   █   █  █
		// █  █   ████     █     █  █   █     █     █    ███    █  █

function PartNutrition(def, thing)
{
	var t=this;
	t.name = 'nutrition';
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

		if (t.now <= 0)
			thing.partAction('health', 'sub', 1/60);
	}
	t.eat = function(amount)
	{
		t.now -= amount;
	}
	t.get01 = function()
	{
		var f = rangeUnit(t.now, t.max);
		return minmax(f, 0, 1);
	}
}









		// █  █   ████    ██    █      █████   █  █
		// █  █   █      █  █   █        █     █  █
		// ████   ██     ████   █        █     ████
		// █  █   █      █  █   █        █     █  █
		// █  █   ████   █  █   ████     █     █  █

function PartHealth(def, thing)
{
	var t=this;
	t.name = 'health';
	t.thing = thing;

	t.max = 100;
	t.now = 100;
	t.smooth = t.now;

	t.healIdle = 0.1/60;
	t.nextBleed = 0;

	t.update = function()
	{
		t.add( t.healIdle );

		// this should return the same value, but be smoothly animated
		t.smooth += (t.now - t.smooth) * 0.3;

		var f = rangeConvert( t.get01(), 0.5, 0, 3, 0.4 );
		if (f)
			t.bleedEvery( f*1000 );
	}
	t.bleedEvery = function(ms)
	{
		if (ago(t.nextBleed) < 0)
			return;

		addThing('blood', thing.pos.x, thing.pos.y);

		// randomly half up/down
		t.nextBleed = time() + ms + rnd11(ms*0.8);
	}
	t.sub = function(f) { return t.add(-f); }
	t.add = function(f)
	{
		t.set( t.now + f );
	}
	t.set = function(f)
	{
		t.now = minmax(f, 0, t.max);
	}
	t.bite = function(f, attacker)
	{
		t.sub(f);

		if (!attacker)
			attacker = thing;

		var ratio = abRatio(thing.radius*0.5, attacker.radius);
		var v = v2lerp(thing.pos, attacker.pos, ratio);
		addThing('blood', v.x, v.y);
	}
	t.get01 = function()
	{
		var f = rangeUnit(t.smooth, t.max);
		return minmax(f, 0, 1);
	}
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
			thing.doWithParts('circle', function(p) {
				t.alpha = p.getAlpha();
				t.origAlpha = t.alpha;
			});
		}

		var secs = def.after / 1000;
		t.alpha -= t.origAlpha/(secs*60);

		if (t.alpha > 0)
			thing.doWithParts('circle', function(p) {
				p.setAlpha(t.alpha);
			});
		else
			thing.remove();
	}
}











		//  ██    █
		// █  █   █
		// ████   █
		// █  █   █
		// █  █   █

function PartAi(def, thing)
{
	var t=this;
	t.name = 'ai';
	t.thing = thing;

	t.update = function()
	{
		if (thing.name == 'wolf')
			t.updateWolf();
		else
			t.updateDeer();
	}

	t.updateDeer = function()
	{
		t.walkAround();
	}
	t.isNear = function(p, dist)
	{
		dist = defined(dist, 0);
		dist += thing.radius*1.1;
		return v2isCloserThan(thing.pos, p, dist);
	}
	t.isFar = function(p, dist)
	{
		dist = defined(dist, 0);
		dist += thing.radius*1.1;
		return v2isFurtherThan(thing.pos, p, dist);
	}
	t.walkAround = function()
	{
		if (!t.to || t.isNear(t.to))
			t.to = randomPointOnMap();

		t.turnByVelocity();
		t.moveTowards( t.to );
	}
	t.updateHuntHuman = function()
	{
		var to = g_player.pos;
		t.turnByVelocity();
		t.moveTowards( to, 'fast' );

		if (t.isNear(g_player.pos, g_player.radius))
		{
			g_player.partAction('health', 'bite', 10, thing);
			t.setHuntHuman(false);
		}
	}

	t.moveTowards = function(v, bFast)
	{
		thing.move( v2dirTo(thing.pos, v), bFast );
	}

	t.turnByVelocity = function()
	{
		var v = thing.getVel();
		if (v2len(v) > 0.1)
			thing.turn( v2angle(v) );
	}

	t.updateWolf = function()
	{
		if (t.huntHuman)
		{
			t.updateHuntHuman();

			if (t.isFar(g_player.pos, 6))
				t.setHuntHuman(false);
		}
		else
		{
			t.walkAround();

			if (t.isNear(g_player.pos, 4))
				t.setHuntHuman(true);
		}
	}
	t.setHuntHuman = function(b)
	{
		if (t.stoppedHunting && ago(t.stoppedHunting) < 1500)
			return;

		t.huntHuman = b;
		if (!b)
			t.stoppedHunting = time();

		t.thing.doWith('wolf-eye', function(eye) {
			eye.circle.setColor( !b ? 0xd2b071 : 'f11' );
		});
	}
}

