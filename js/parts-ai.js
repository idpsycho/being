






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

	t.prey = null;		// wolf sees: human or deer
	t.danger = null;	// deer sees: human or wolf
	t.lastDangerName = '';

	t.update = function()
	{
		if (thing.partDo('health.dead'))
		{
			thing.eachThing('eye,wolf-eye', function(eye) {
				eye.circle.setColor( 0 );
			});
			return;
		}

		if (thing.name == 'wolf')
			t.updateWolf();
		else
			t.updateDeer();
	}

	t.updateDeer = function()
	{
		t.danger = thing.partDo('seeing.getSeenFirst', 'human,wolf');
		if (t.danger)
			t.lastDangerName = t.danger.name;

		if (t.danger || t.fleeing)
		{
			if (t.danger)
			{
				var away = v2dirTo(t.danger.pos, thing.pos);
				away = v2rot(away, rnd11(10));
				v2multMe(away, 10);
				t.to = v2add(thing.pos, away);
			}

			t.flee(t.to, true);

			//thing.say('fleeing');
		}
		else
		if (t.checkPos)
		{
			//thing.say('checking');
			t.checkOut();
		}
		else
		{
			t.walkAround();
		}
	}
	t.checkOut = function(pos)
	{
		if (isV2(pos))
		{
			t.checkPos = pos;
			//thing.say( nice('checkout: ', pos) );
		}

		//if (!t.checkPos)
		//	return;

		// if (t.isNear(t.checkPos))
		// {
		// 	t.checkPos = false;
		// 	return;
		// }

		//t.walkAround(t.checkPos);
		thing.partDo('looking.lookAt', t.checkPos, true);
	}
	t.flee = function()
	{
		if (!t.to || t.isNear(t.to))
			t.fleeing = false;
		else
		{
			t.checkPos = false;
			t.fleeing = true;

			t.moveTowards(t.to, 'run');
			t.turnByVelocity();

			var p = thing.pos;
			if (t.lastDangerName)
				thing.say('Watch out, '+t.lastDangerName.toUpperCase()+'!');
		}
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
	t.walkAround = function(to, bFast)
	{
		if (!t.to || t.isNear(t.to))
			t.to = randomPointOnMap();

		if (to)
			t.to = isDef(to.pos) ? to.pos : to;

		t.turnByVelocity();
		t.moveTowards( t.to, bFast );
	}
	t.updateHunt = function()
	{
		if (!t.prey) {
			t.setHunt(false);
			return;
		}

		var to = t.prey.pos;
		t.turnByVelocity();
		t.moveTowards( to, 'fast' );

		if (t.isNear(t.prey.pos, t.prey.radius))
		{
			t.prey.partDo('health.bitten', rnd(10, 20), thing);
			t.setHunt(false);
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
		t.prey = thing.partDo('seeing.getSeenFirst', 'human,deer');

		if (t.prey)
			thing.say('I see you, '+t.prey.name.toUpperCase()+'!');

		thing.eachThing('wolf-eye', function(eye) {
			eye.circle.setColor( !t.prey ? 0xd2b071 : 'f11' );
		});

		thing.partDo('looking.lookAt', t.prey, 'turnToSee');

		if (t.hunt)
		{
			t.updateHunt();

			if (!t.prey || t.isFar(t.prey.pos, 6.5))
				t.setHunt(false);
		}
		else
		{
			var walk = true;
			if (t.prey)
			{
				if (t.isNear(t.prey.pos, 6))
					return t.setHunt(true);
			}

			if (walk)
				t.walkAround(t.prey);
		}
	}

	t.setHunt = function(b)
	{
		if (t.stoppedHunting && ago(t.stoppedHunting) < 800)
			return;

		t.hunt = b;
		if (!b)
			t.stoppedHunting = time();

		// t.thing.eachThing('wolf-eye', function(eye) {
		// 	eye.circle.setColor( !b ? 0xd2b071 : 'f11' );
		// });
		t.to = null;
	}
}









//		 ███    ████   ████   █   █  █    ███
//		█       █      █      █   ██ █   █
//		 ███    ██     ██     █   █ ██   █ ██
//		    █   █      █      █   █  █   █  █
//		 ███    ████   ████   █   █  █    ███

function PartSeeing(def, thing)
{
	var t=this;
	t.name = 'seeing';
	t.thing = thing;

	t.fov		= defined(def.fov, 100);
	t.distance	= defined(def.distance, 10);
	t.refreshEvery = defined(def.refreshEvery, 500);

	t.lastRefresh = 0;
	t.arrLast	= [];

	t.getSeenFirst = function(filterName)
	{
		var arr = t.getSeen(filterName);
		for (var i=0; i < arr.length; i++)
		{
			var a = arr[i];
			if (!a.partDo('health.dead'))
				return a;
		}
	}
	t.getSeen = function(filterName)
	{
		var arr = t.getCachedSeen();

		if (isDef(filterName))
			arr = arr.filterByAttr('name', filterName.split(','));

		return arr;
	}
	t.getCachedSeen = function()
	{
		if (ago(t.lastRefresh) > t.refreshEvery)
		{
			t.arrLast = t.calcSeen();
			t.lastRefresh = time();
		}

		return t.arrLast;
	}

	t.calcSeen = function()
	{
		var arr = [];
		var v1 = thing.pos;
		var r = thing.rot;
		var viewCone = createFovShape(v1, r, t.fov, t.distance);

		g_box2d.QueryShape(function(e)
		{
			var bodyP = e.GetBody().GetUserData();
			if (bodyP && bodyP.thing!=thing)
				arr.push(bodyP.thing);

			return true;
		}, viewCone, null);

		arr = t.filterByOcclusion(arr);

		arr.sortByAttr('_seenAtDistance');

		return arr;
	}

	t.filterByOcclusion = function(arr)
	{
		var visible = [];
		// all items
		for (var i=0; i < arr.length; i++)
		{
			var a = arr[i];
			if (rayCastIsBetween(a, thing))
				continue;

			a._seenAtDistance = v2dist(a.pos, thing.pos);
			visible.push(a);
		}
		return visible;
	}

	function rayCastIsBetween(a, b)
	{
		var occluded = false;
		function cb(fxt, pt, normal, fraction)
		{
			var c = fxt.GetBody().GetUserData();
			if (!c) return true;
			c = c.thing;

			if (c == a || c == b)
				return true;

			occluded = true;
			return false;
		}
		g_box2d.RayCast(cb, a.pos, b.pos);
		return occluded;
	}

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


}


function QueryCircleNearest(pos, radius, ignoreThing)
{
	var circle = createCircleShape(pos, radius);

	var nearest;
	g_box2d.QueryShape(function(e)
	{
		var b = e.GetBody().GetUserData();
		if (b && b.thing!=ignoreThing)
		{
			if (!nearest)
				nearest = b.thing;
			else
			{
				var d1 = v2dist2(pos, b.thing.pos);
				var d2 = v2dist2(pos, nearest.pos);
				if (d1 < d2)
					nearest = b.thing;
			}
		}

		return true;
	}, circle, null);

	return nearest;
}

function createCircleShape(pos, radius)
{
	radius = defined(radius, 0.1);

	var b2CircleShape	= Box2D.Collision.Shapes.b2CircleShape;
	var sh = new b2CircleShape();
	sh.m_radius = radius;
	sh.SetLocalPosition( b2v(pos) );

	return sh;
}
















//		█       ███     ███    █  █   █   █  █    ███
//		█      █   █   █   █   █ █    █   ██ █   █
//		█      █   █   █   █   ██     █   █ ██   █ ██
//		█      █   █   █   █   █ █    █   █  █   █  █
//		████    ███     ███    █  █   █   █  █    ███

function PartLooking(def, thing)
{
	var t=this;
	t.name = 'looking';
	t.thing = thing;
	def.at = defined(def.at, '');
	def.eyeMax = defined(def.eyeMax, 45);

	t.update = function()
	{
		// kazdych par sekund sa pozriet na nejaky iny z blizkych objektov

		if (def.at == 'mouse')
			return t.lookAtMouse();

		if (thing.name == 'wolf')
			return;

		var focus = thing.partDo('seeing.getSeenFirst', 'human') ||
					thing.partDo('seeing.getSeenFirst', 'wolf') ||
					thing.partDo('seeing.getSeenFirst', 'deer') ||
					thing.partDo('seeing.getSeenFirst');
		if (focus)
			t.lookAt(focus, false);
	}

	t.getLookingAngle = function()
	{
		return t.lastLookingAngle;
	}

	t.lookAtMouse = function()
	{
		var spd = thing.getSpeed();
		var turnTow = (spd > 1.5 || spd < 0.01);
		t.lookAt(mousePos, true, 0);
	}
	t.lookAt = function(o, turnToSee, turnTowards)
	{
		var lookAng;
		if (isNum(o))
			lookAng = parseFloat(o);
		else
		if (o && isDef(o.x, o.y))
			lookAng = v2angle( v2sub(o, thing.pos) );
		else
		if (o && isDef(o.pos))
			lookAng = v2angle( v2sub(o.pos, thing.pos) );
		else
			lookAng = null;

		// anything else will make it look straight forward
		t.setLookAng(lookAng, turnToSee, turnTowards);
	}

	t.setLookAng = function(a, turnToSee, turnTowards)
	{
		// ak neni zadane, tak sa pozeraj dopredu
		if (!a)
			a = thing.rot;

		t.lastLookingAngle = a;

		var diffAng = a - thing.rot;
		diffAng = cycleIn(diffAng, -180, 180);

		// par stupnov sa natocia oci, zvysok cela bytost
		var eyeAng = absmin(diffAng, def.eyeMax);

		thing.thingDo('eye.setRot', eyeAng);
		thing.thingDo('wolf-eye.setRot', eyeAng);

		if (turnToSee)
		{
			if (turnTowards)
				thing.turn( a );
			else
				thing.turn( a-eyeAng );
		}
	}
}





