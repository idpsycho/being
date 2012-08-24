require([
	'js/math',
	'js/js-extension'
]);



function Thing(def, parent)
{
	assert(def, 'missing Thing def');

	var t=this;

	t.name		= def.name;
	t.parent	= parent;

	t.pos		= v2null();
	t.rot		= 0;//rnd11(50);
	t.radius	= def.radius;
	t.things	= [];
	t.parts		= [];
	t.sprite	= createSprite();

	function init()
	{
		addParts(def.parts);
		addThings(def.things);

		if (def.name == 'blood')
			var q = 4;

		var v = getDefPosition(def);
		t.setPos(v.x, v.y);
	}

	function addThings(arrDef)
	{
		if (!arrDef) return;
		for (var i=0; i < arrDef.length; i++)
		{
			var defT = arrDef[i];
			var name = defT.name;

			t.addThing(name, defT);
		}
	}

	function addParts(arrDef)
	{
		if (!arrDef) return;
		for (var i=0; i < arrDef.length; i++)
		{
			var defP = arrDef[i];
			var name = defP.name;

			t.addPart(name, defP);
		}
	}

	t.addPart = function(name, defP)
	{
		var className = 'Part' + name.capitalize();

		var c = classByName(className);
		if (!c)
			return;

		// hm, toto som si neni isty, ci to ma len radius doplnit alebo aj nieco ine..
		calcRadius(defP, t);
		var p = new c(defP, t);

		t.parts.push( p );
		t[name] = defined(t[name], p);
	}
	t.addThing = function(name, defCustom)
	{
		var thing = genThing(name, t, defCustom);
		t.things.push(thing);
		return thing;
	}

	function eachPart(fn)
	{
		for (var i=0; i < t.parts.length; i++)
			fn(i, t.parts[i]);
	}

	t.update = function()
	{
		eachPart(function(i,p) { p.bUpdate = true; });

		if (t.body)		t.body.update();
		t.applyPos(t.pos, t.rot);

		eachPart(function(i,p) {
			if (p.bUpdate && p.update)
				p.update();
		});

		for (var i=0; i < t.things.length; i++)
			t.things[i].update();
	}

	t.applyPos = function(pos, rot)
	{
		if (!t.sprite) {
			assert(t.bRemove, 'missing sprite, but the object is not being removed');
			return;
		}

		t.sprite.x = pos.x * g_ivankRatio;
		t.sprite.y = pos.y * g_ivankRatio;
		t.sprite.rotation = rot;
	}

	function createSprite()
	{
		var sp = new Sprite();
		var layer = parent ?
					parent.sprite :
					ikGetLayer(def.layer);

		layer.addChild(sp);
		return sp;
	}

	///////////////////////////////////////////////////

	// thing('eye.setRot', 15)
	// part('circle.setAlpha', 0.1)
	t.thingDo = function(name, action, v1, v2, v3)
	{
		// move params
		if (name.indexOf('.')!=-1) {
			var x = name.split('.');
			if (x.length != 2) return;
			v3=v2;
			v2=v1;
			v1=action;
			action = x[1];
			name = x[0];
		}
		return t._thingAction(name, action, v1, v2, v3);
	}
	t.partDo = function(name, action, v1, v2, v3)
	{
		// move params
		if (name.indexOf('.')!=-1) {
			var x = name.split('.');
			if (x.length != 2) return;
			v3=v2;
			v2=v1;
			v1=action;
			action = x[1];
			name = x[0];
		}
		return t._partAction(name, action, v1, v2, v3);
	}

	// action
	t._partAction = function(name, action, v1, v2, v3)
	{
		var firstVal;
		t.eachPart(name, function(p)
		{
			var val, fn = ifFn( p[action] );
			if (fn) val = fn(v1, v2, v3);
			firstVal = defined(firstVal, val);
		});
		return firstVal;
	}
	t._thingAction = function(name, action, v1, v2, v3)
	{
		var firstVal;
		t.eachThing(name, function(th)
		{
			var val, fn = ifFn( th[action] );
			if (fn) val = fn(v1, v2, v3);
			firstVal = defined(firstVal, val);
		});
		return firstVal;
	}

	// do with all that are named..
	t.eachPart = function(name, fn)
	{
		var arr = t.getPart(name);
		for (var i=0; i < arr.length; i++)
			fn(arr[i]);
	}
	t.eachThing = function(name, fn)
	{
		var arr = t.getThing(name);
		for (var i=0; i < arr.length; i++)
			fn( arr[i] );
	}

	function compare(val, val_or_array)
	{
		var x = val_or_array;
		if (x instanceof Array)
			return x.indexOf(val) !=- 1;

		return val == x;
	}

	// get by name
	t.getPart = function(names, searchSubthings)
	{
		if (isStr(names))
			names = names.split(',');

		var arr = [];
		for (var i=0; i < t.parts.length; i++)
		{
			var p = t.parts[i];
			if (compare(p.name, names))
				arr.push(p);
		}

		if (searchSubthings)
		{
			for (var i=0; i < t.things.length; i++)
				arr.append( t.things[i].getPart(names) );
		}
		return arr;
	}
	t.getThing = function(names)
	{
		if (isStr(names))
			names = names.split(',');

		var arr = [];
		for (var i=0; i < t.things.length; i++)
		{
			var th = t.things[i];
			if (compare(th.name, names))
				arr.push(th);

			arr.append( th.getThing(names) );
		}
		return arr;
	}



	t.getVel = function()
	{
		if (!t.body) return v2null();
		return t.body.body.GetLinearVelocity();
	}
	t.getSpeed = function()
	{
		return v2len( t.getVel() );
	}
	t.addPos = function(v)
	{
		t.setPos( v2add(t.pos, v) );
	}
	t.setPos = function(x, y)
	{
		var v = vxy(x, y);

		t.pos = v;
		if (t.body)		t.body.posChanged(v);
		if (t.anchor)	t.anchor.posChanged(v);
	}
	t.setRot = function(r)
	{
		var pos;
		t.rot = r;
		if (t.body)		t.body.posChanged(pos, r);
	}
	t.move = function(v, spd)
	{
		if (t.control)	t.control.move(v, spd);
	}
	t.turn = function(degs, spd)
	{
		if (t.control)	t.control.turn(degs, spd);
	}
	t.say = function(msg)
	{
		// zatial len takto jebnoducho
		var v = v2(t.pos.x-0.5, t.pos.y-t.radius);
		v = g_cam.toScreen(v);
		gui.drawText(msg, v.x, v.y, '000');

		//out( t.name.toUpperCase()+' says: '+msg );
	}
	t.getLookingAngle = function()
	{
		var eyeAng = t.partDo('looking.getLookingAngle');
		return defined(eyeAng, t.rot);
	}

	t.remove = function(bDestroy)
	{
		if (!bDestroy)
		{
			t.bRemove = true;
			return;
		}

		$.each(t.things, removeThing);
		$.each(t.parts, removePart);

		if (t.sprite)
		{
			t.sprite.parent.removeChild( t.sprite );
			t.sprite = null;
		}
	}
	function removePart(i, p)
	{
		if (p.remove) p.remove();
	}
	function removeThing(i, th)
	{
		th.remove();
	}
	///////////////////////////////////////////////////

	// collision detection
	t.isColliding = function()
	{
		for (var i=0; i < g_arrThings.length; i++)
		{
			if (t.collidesWith( g_arrThings[i] ))
				return true;
		}
	}
	t.collidesWith = function(a)
	{
		return doCirclesIntersect(t.pos, t.radius, a.pos, a.radius);
	}

	t.getBox2dBody = function()
	{
		if (t.body) return t.body.body;
	}


	init();
};













/////////////////////////////////////////////////////////////////////



/*
var thingsDef =
{
	'tree': {
		'circle':		{ clr: green, radius: 2 },
		'body':			{ density: 2 },
		'anchor':	{ frequency: 1, damping: 0, position: v2(0, 0) },
	}

	'human': {
		'circle':		{ clr: skin, radius: 0.8 },
		'body':			{ density: 1 },
		'movement':		{ acceleration: 1, damping: 6 },
		'heading':		{  }
		'eyes':			{ angle: 120, distance: 10 },
	}

	'animal': {
		'circle':		{ clr: green, radius: 2 },
		'body':			{ density: 2 },
		'movement':		{ acceleration: 1, damping: 6 },
		'anchor':	{ frequency: 1, damping: 0, position: v2(0, 0) },
	}
	'eyes':
	{
		// ma byt toto tu? alebo v classe toho objektu? ??
		'circle':		{ clr: 'grey', radius: 0.05 },
	}
};

player.action('up');

asi by som si mal spisat co robim s things
a podla toho pri kazdom prikaze si zadefinovat ako by to v novom systeme prebiehalo

vytvorim new Thing('tree')
vytvori sa pure Thing iba s nazvom tree
a zacnu sa donho po jednom doplnat objekty
vytvori sa circle, ktory sa prida do parts, a svoj sprite do sprite
vytvori sa body, ktory hodi svoj body do globalneho box2d
a vytvori sa anchor, ktory si z parenta vytiahne/vypyta body a anchorne sa
a je vytvoreny objekt
v update sa zobere pozicia z body, a nastavi sa na "tree"??
pozicia z tree sa afterUpdate nastavi na circle

na vsetko co maju parts by mal byt interface v thing?

	setColor
	setRadius
	getRadius - zatial akoze fyzika je vzdy len taka ista
	draw -> circle.draw
	setPos
	getPos
	addPos: setPos(getPos+add)
	update -> each.update
	afterUpdate
	beforeUpdate
	action/control('up'/'dn'/..) - toto by chcelo nejaku ai,
		take zakladne moze byt aj vo thing, ze to len tym hybe
		a v body bude potom vylepsene, ze to aj ide tym smerom..

	ai bude mat v update volaku vec co bude robit, a malo by nejak ovladat "move" resp. "controllery" (lol)

otazka je vlastne len ze aky interface to ma mat a ako sa ma rozisorvat interface


ALEBO sa na to cele vyjebat, a upravovat a oddelovat veci tak aby to zostavalo pojazdne z funkcnej verzie..
a ujasnit si co vlastne chcem

*/




////////////////////////////////////////////////////////////////
// name, parts
