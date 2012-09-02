





//		 ██    █
//		█  █   █
//		████   █
//		█  █   █
//		█  █   █

function PartAi(def, thing)
{
	var t=this;
	t.name = 'ai';
	t.thing = thing;

	t.lastActionChange = time();
	t.biteTime = 0;
	t.action = 'idle';
	t.goal = v2null();
	t.eventStack = [];

	t.actions = ['idle', 'walk', 'run', 'check', 'dead'];

	t.update = function()
	{
		if (thing.name == 'deer')
		{
			on('idle afterSomeTime',	'walk goalRandom');
			on('walk nearGoal',			'idle');
			on('run nearGoal',			'check dirBehind');
			on('bitten',				'check dirBehind');
			on('seesDanger',			'run goalAwayFromDanger');
			on('died',					'dead');
		}
		else
		if (thing.name == 'wolf')
		{
			on('idle afterSomeTime',	'walk goalRandom');
			on('walk nearGoal',			'idle');
			on('seesPrey hungry',		'run goalPrey');
			on('lostPrey hungry',		'run goalPreyLast');
			on('run nearGoal biteTime',	'bite goalPrey');
			on('bitten',				'check dirBehind');
			on('died',					'dead');
		}

		updateAction();
		//thing.say(t.action);

		t.eventStack = [];
	}

	function drawTo()
	{
		//dbg.drawLineV(thing.pos, t.goal, '00f', 5);
	}

	function getGoal()
	{
		var g = t.goal;
		if (!g) return;

		if (g.pos) return g.pos;
		return g;
	}
	/////////////////////////////////////////////////////////
	// actions
	function walk()
	{
		var g = getGoal();
		if (!g) return true;

		thing.move( v2dir(thing.pos, g) );
		drawTo();
	}
	function run()
	{
		var g = getGoal();
		if (!g) return true;

		thing.move( v2dir(thing.pos, g), true );
		drawTo();
	}
	function check()
	{
		if (!t.dir) return true;
		thing.turn( t.dir );
		return angDiff(thing.rot, t.dir) < 5;
	}
	function bite()
	{
		if (!t.prey) return true;		// prey lost
		if (!biteTime()) return true;	// cant bite faster

		var eaten = thing.partDo('nutrition.bite', t.prey);
		t.biteTime = time();
		if (!eaten) return true;	// eaten all of it OR full stomach
	}

	/////////////////////////////////////////////
	// modifiers
	function goalRandom()
	{
		t.goal = v2add(thing.pos, v2rnd(5));
	}
	function goalPrey()
	{
		t.goal = t.prey;
	}
	function goalPreyLast()
	{
		t.goal = t.preyLast.pos;
	}
	function dirBehind()
	{
		t.dir = cycleIn180(thing.rot + 180);
	}
	function goalAwayFromDanger()
	{
		var a = v2dirAng(t.danger.pos, thing.pos) + rnd11(45);
		t.goal = v2add(thing.pos, v2fromAngle(a, 5));
	}

	function getNearDist()
	{
		var d = thing.radius;
		var target = (t.goal && t.goal.pos) ? t.goal : thing;

		d += target.radius;
		d *= 1.2;
		return d;
	}

	/////////////////////////////////////////////
	// events
	function nearGoal()
	{
		var g = getGoal();
		var dist = getNearDist();
		if (!g || !dist) return;

		return v2dist(thing.pos, g) < dist;
	}
	function afterSomeTime()
	{
		return ago(t.lastActionChange) > 1000;
	}
	function biteTime()
	{
		return ago(t.biteTime) > 500;
	}
	function seesDanger()
	{
		t.danger = thing.partDo('seeing.getSeenFirst', 'human,wolf');
		return t.danger;
	}
	function seesPrey()
	{
		t.preyLast = t.prey;
		t.prey = thing.partDo('seeing.getSeenFirst', 'human,deer');
		return t.prey;
	}
	function lostPrey()
	{
		return (t.preyLast && !t.prey);
	}
	function hungry()
	{
		return thing.partDo('nutrition.get01')<0.7;
	}
	function died()
	{
		if (t.action=='dead') return false;
		return thing.partDo('health.dead');
	}



	/////////////////////////////////////////////////////////
	// interface
	t.addEvent = function(name, params)
	{
		var ev = defined(params, {});
		ev.name = name;
		t.eventStack.push(params);
	}
	function findEvent(name)
	{
		return t.eventStack.findByAttr('name', name);
	}
	function updateAction()
	{
		var fn = getFn(t.action);
		if (!fn) return;

		// if (true) finished
		if (fn()) setAction('idle');
	}
	function isAction(s)
	{
		return t.action==s;
	}
	function setAction(s)
	{
		t.action = s;
		t.lastActionChange = time();
	}
	function on(cond, action_mod)
	{
		cond = cond.split(' ');
		for (var i = 0; i < cond.length; i++)
		{
			var c = cond[i];
			if (!checkCondition( c ))
				return;
		};

		// all conditions were met, set action and apply modifier
		ai.stimul(cond, 'in');
		processAction(action_mod);
	}
	function processAction(am)
	{
		var s = am.split(' ');
		var action	= s[0];
		var mod		= s[1];

		ai.stimul(action+'_'+(mod?mod:''), 'out');

		applyMod(mod);
		setAction(action);
	}
	function applyMod(mod)
	{
		var fn = getFn(mod);
		if (fn) fn();
	}
	function checkCondition(c)
	{
		if (t.actions.contains(c))
			return c == t.action;

		var fn = getFn(c);
		if (fn)
			return fn();

		return findEvent(c);
	}

	var arrFns = {};
	function getFn(f)
	{
		var fn = arrFns[f];
		if (!fn)
		{
			fn = eval('typeof '+f+'=="function"');
			if (fn) fn = eval(f);
			else fn = null;
			arrFns[f] = fn;
		}
		return fn;
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
	t.DBG = 0;

	t.fov		= defined(def.fov, 100);
	t.distance	= defined(def.distance, 10);
	t.refreshEvery = defined(def.refreshEvery, 1000+rndi(50, 100));

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
		var refreshCache = (ago(t.lastRefresh) > t.refreshEvery);
		if (refreshCache || t.DBG)
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
			if (bodyP && bodyP.thing!=thing) {
				arr.push(bodyP.thing);
				!t.DBG || dbg.drawLineV(thing.pos, bodyP.thing.pos, 0, 2);
			}

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
			!t.DBG || dbg.drawLineV(thing.pos, a.pos, '0f0', 4);
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

		!t.DBG || dbg.drawPoly(arr, 0, 2);

		var b2PolygonShape	= Box2D.Collision.Shapes.b2PolygonShape;
		var sh = new b2PolygonShape();
		sh.SetAsArray( b2vArr(arr), arr.length );

		return sh;
	}


}


function checkIgnore(t, ignoreThing)
{
	if (isArr(ignoreThing))
		return ignoreThing.contains(t.name);
	else
		return t == ignoreThing;
}

function QueryThingNearest(pos, radius, ignoreThing)
{
	var nearest;
	for (var i=0; i < g_arrThings.length; i++)
	{
		var t = g_arrThings[i];
		if (checkIgnore(t, ignoreThing))
			continue;

		if (!v2isCloserThan(t.pos, pos, t.radius+radius))
			continue;

		nearest = defined(nearest, t);
		var d1 = v2dist(pos, nearest.pos) - nearest.radius;
		var d2 = v2dist(pos, t.pos) - t.radius;
		if (d2 < d1)
			nearest = t;
	}
	return nearest;
}

function QueryBodyNearest(pos, radius, ignoreThing)
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
		t.lookAt(mousePos, true, g_held);
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
		diffAng = cycleIn180(diffAng);

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





