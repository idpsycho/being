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
	t.rot		= rnd11(50);
	t.radius	= def.radius;
	t.sprite	= null;
	t.things	= [];
	t.sprite	= createSprite();

	function init()
	{
		t.body		= addPart('body', PartBody);
		t.control	= addPart('control', PartControl);
		t.anchor	= addPart('anchor', PartAnchor);
		t.circle	= addPart('circle', PartCircle);

		addThings(def.things);

		if (def.name == 'blood')
			var q = 4;
		var v = getDefPosition(def);
		t.setPos(v.x, v.y);
	}

	function addThings()
	{
		if (!def.things) return;
		for (var i=0; i < def.things.length; i++)
		{
			var defT = def.things[i];
			var name = defT.name;

			t.addThing(name, defT);
		}
	}

	function addPart(name, className)
	{
		if (!(def.parts instanceof Array))
			return;

		// part definition
		var d = def.parts.findByAttr('name', name);
		if (!d) return;

		d.radius = defined(d.radius, t.radius);
		if (isDef(d.radiusMult))
			d.radius = d.radius * d.radiusMult;

		return new className(d, t);
	}

	t.update = function()
	{
		if (t.body)		t.body.update();

		t.applyPos(t.pos, t.rot);

		if (t.control)	t.control.update();
		if (t.circle)	t.circle.update();

		for (var i=0; i < t.things.length; i++)
			t.things[i].update();
	}

	t.applyPos = function(pos, rot)
	{
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
	// interface
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

	t.move = function(v)
	{
		if (t.control)	t.control.move(v);
	}

	t.addThing = function(name, defCustom)
	{
		var thing = genThing(name, t, defCustom);
		t.things.push(thing);
		return thing;
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
