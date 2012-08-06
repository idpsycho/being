
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
			t.pos = v2b2(pos);

			// dont have any viewing angle, so this isnt necessary yet
			//var angle = t.body.GetAngle()*inDegs;
		}

		t.doAI();

		if (t.sprite)
		{
			t.sprite.x = t.pos.x;
			t.sprite.y = t.pos.y;
		}
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
	t.setStage = function(stage)
	{
		t.sprite = new Sprite();

		var g = t.sprite.graphics;
		g.beginFill(t.clr);
		g.drawCircle(0, 0, t.radius*10);

		stage.addChild(t.sprite);
	}
	t.setBox2d = function(box2d)
	{
		t.body = createBox2dCircle(t.radius, t.density);
	}
	function createBox2dCircle(radius, density)
	{
		var
			b2Vec2			= Box2D.Common.Math.b2Vec2,
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

function genThing(name, x, y)
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
	t.pos = (x&&y) ? v2(x, y) : v2rnd(100);
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
		clr:		0xeecc77,
		radius:		0.5,
	},
	{
		name:		'animal',
		clr:		0xdc801e,
		radius:		[0.5, 1],
	},
	{
		name:		'tree',
		clr:		0x327b0e,
		radius:		[0.3, 2],
		density:	50,		// should be static, or even better with joint, but for now..
	},
];
