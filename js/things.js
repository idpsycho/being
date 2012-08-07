
function b2v(v, y)
{
	var b2Vec2 = Box2D.Common.Math.b2Vec2;

	if (typeof y == 'undefined')
		return new b2Vec2(v.x, v.y);
	else
		return new b2Vec2(v, y);
}

function Thing()
{
	var t=this;

	t.name		= null;
	t.clr		= null;
	t.pos		= null;
	t.radius	= null;

	t.density	= null;		// toto by stacilo hodit pri create do box2d a nemat to tu
	t.sprite	= null;		// ivank
	t.body		= null;		// box2d

	t.remove = function()
	{
		//box2d.removeChild( body );
		//stage.removeChild( sprite );
	}
	t.update = function()
	{
		if (t.body)
		{
			var pos = t.body.GetPosition();
			t.pos = v2copy(pos);

			// dont have any viewing angle, so this isnt necessary yet
			//var angle = t.body.GetAngle()*inDegs;
		}

		t.doAI();
		t.updateSmoothMove();

		if (t.sprite)
		{
			t.sprite.x = t.pos.x * g_ivankRatio;
			t.sprite.y = t.pos.y * g_ivankRatio;
		}
	}
	t.action = function(a)
	{
		var f = 1;
		if (0) {}
		else if (a == 'up') t.move( v2(0, -f) );
		else if (a == 'dn') t.move( v2(0, f) );
		else if (a == 'lt') t.move( v2(-f, 0) );
		else if (a == 'rt') t.move( v2(f, 0) );
		else
			t.currAction = null;
	}
	t.updateSmoothMove = function()
	{
		var b = t.body;

		b.SetLinearDamping(7);

		if (t.currAction)
		{
			v2multMe(t.currAction, 1);
			b.ApplyImpulse( b2v(t.currAction), b2v(0, 0) );
			var vel = b.GetLinearVelocity();
			var len = v2len(vel);

			t.currAction = null;

			if ('limit speed')
			{
				var mx = 3;
				if (len > mx) v2multMe(vel, mx/len);
				b.SetLinearVelocity(vel);
				//gui.drawText(nice(len), 0, 0);
			}
		}
	}

	t.move = function(v)
	{
		if (t.body)
		{
			if (!t.currAction)
				t.currAction = v2null();
			v2addMe(t.currAction, v);
		}
		else
		{
			t.addPos(v);
		}
	}
	t.addPos = function(v)
	{
		t.setPos( v2add(t.pos, v) );
	}
	t.setPos = function(v)
	{
		t.pos = v2copy(v);
		if (t.body)
			t.body.SetPosition( b2v(v) );
	}
	t.doAI = function()
	{
		return;

		if (t.name == 'animal')
		{
			if (t.ai.action == 'idle')
			{
				if (chanceInSeconds(10))
				{
					t.ai.goal = v2add(t.pos, v2rnd(100));
					t.ai.action = 'goto';
				}
			}
			else if (t.ai.action == 'goto')
			{
				var d = v2dir(t.pos, t.ai.goal);
				d *= t.ai.speed;
				t.body.setVelocity(d);
			}
		}
	}
	t.setWorld = function(ikWorld)
	{
		t.sprite = new Sprite();

		var g = t.sprite.graphics;
		g.beginFill(t.clr);
		g.drawCircle(0, 0, t.radius * g_ivankRatio);

		ikWorld.addChild(t.sprite);
	}
	t.setBox2d = function(box2d)
	{
		t.body = createBox2dCircle(box2d, t.radius, t.density);
		if (!t.body) return;

		//t.body.setPosition( b2v(t.pos) );
	}

	function createBox2dCircle(box2d, radius, density)
	{
		var
			b2Vec2			= Box2D.Common.Math.b2Vec2,
			b2Body			= Box2D.Dynamics.b2Body,
			b2BodyDef		= Box2D.Dynamics.b2BodyDef,
			b2FixtureDef	= Box2D.Dynamics.b2FixtureDef,
			b2CircleShape	= Box2D.Collision.Shapes.b2CircleShape;

		var bodyDef = new b2BodyDef();
		bodyDef.type = b2Body.b2_dynamicBody;
		//bodyDef.position.Set(0.0, 0);

		var circle = new b2CircleShape();
		//circle.m_p.Set(0, 0);
		circle.m_radius = radius;

		var fixDef = new b2FixtureDef();
		fixDef.density = density;
		fixDef.shape = circle;

		var body = box2d.CreateBody(bodyDef);
		body.CreateFixture(fixDef);

		return body;
	}

}

function genThing(name)
{
	function chooseRadius(val)
	{
		if (!val.length)
			return val;
		else
			return rnd( val[0], val[1] );
	}

	var def = getThingDef(name);
	if (!def) return;0

	var t = new Thing();
	t.name = name;
	t.pos = v2rnd(100);
	t.clr = def.clr;
	t.radius = chooseRadius(def.radius);	// might be '1' or [1, 2] range
	t.density = def.density;

	return t;
}
function getThingDef(name)
{
	for (var i=0; i < arrThingsDef.length; i++)
	{
		var a = arrThingsDef[i];
		if (a.name == name)
			return a;
	}
}

var arrThingsDef =
[
	{
		name:		'default',
		clr:		0xffffff,
		radius:		1,
		density:	1,
	},
	{
		name:		'human',
		clr:		0xf2cba4,
		radius:		0.5,
	},
	{
		name:		'animal',
		clr:		0xc26d31,
		radius:		[0.5, 1],
	},
	{
		name:		'tree',
		clr:		0x327b0e,
		radius:		[0.3, 2],
		density:	10,		// should be static, or even better with joint, but for now..
	},
];
