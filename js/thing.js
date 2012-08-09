


////////////////////////////////////////////////////////////////
// name, parts

function Thing()
{
	var t=this;

	t.name		= null;
	t.parts		= null;
	// teoreticky by tu mohol byt aj sprite, ktory sa pouzije ked su childy viditelne?

	t.init = function(name, parts)
	{
		t.name = name;
		t.parts = [];
		if (!parts) parts = getThingDef(name);
		$.each(parts, addPart);
	}
	function addPart(name, parts)
	{
		// co vsetko potrebujem mat spracovane z childov okrem toho co sa initnu?
		var obj = new Thing(name, parts);
		if (obj.sprite) t.sprite.addChild(obj.sprite);
		// body - neviem co vsetko, teoreticky by to chcelo initBox2d
		//		kde by sa vytoril joint a spojil
		// inheritInterface: setposition, action
		//		tak v podstate vsetky funkcie co su public members
		//		tie private su schovane..
		//		okrem tych co zacinaju after_ a before_, tie sa budu volat vo funkciach
		//	aj ked je otazne co s funkciami after_X, ked X ani nemam definovane este
		//	chcelo by to priklad, kde by taky problem vznikol
		t.parts.push(obj);
	}

	// extension
	t.update = function()
	{
		$.each(t.parts, function(i, e) { e.beforeUpdate(); });
		$.each(t.parts, function(i, e) { e.update(); });
	}
}

/*
	TAKZE AKO TO POUZIVAT??
		- potrebujem do veci doplnit zoznam nastavitelnych properties
			pripadne sa mozu nastavenia poslat do init(props)
			a nech si s tym spravi kazdy objekt co chce

var thingsDef =
{
	'tree': {
		'circle':		{ clr: green, radius: 2 },
		'body':			{ density: 2 },
		'springAnchor':	{ frequency: 1, damping: 0, position: v2(0, 0) },
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
		'springAnchor':	{ frequency: 1, damping: 0, position: v2(0, 0) },
	}
	'eyes':
	{
		// ma byt toto tu? alebo v classe toho objektu? ??
		'circle':		{ clr: 'grey', radius: 0.05 },
	}
};

	input by mal byt presmerovany do g_player
	vlastne by tam mali byt nejake binds
	teda moze to byt aj v tom objekte
	a potom sa do g_player poslu vsetky inputy
	a g_player si cez binding objekt vyberie aku akciu ma vykonat a vykona ju
	alebo zatial moze byt binding spraveny rucne
	cize klasicky tak jak je to teraz: if (kd('UP')) g_player.action('up');

*/

////////////////////////////////////////////////////////////////
// clr, pos, radius, sprite

function Circle(parent)
{
	var t=this;

	t.clr		= null;
	t.pos		= null;
	t.radius	= null;
	t.sprite	= null;

	// extension
	t.init = function()
	{
		setWorld();
	}
	t.update = function()
	{
		applyPosToIvank();
	}
	t.addPos = function(v)
	{
		t.setPos( v2add(t.pos, v) );
	}
	t.setPos = function(v)
	{
		t.pos = v2copy(v);
	}

	// internal
	function applyPosToIvank()
	{
		if (t.sprite)
			t.sprite = b2v( v2m(t.pos, g_ivankRatio) );
	}
	function setWorld()		// ak to neni global object, ma to riesit parent?
	{
		t.sprite = new Sprite();

		var g = t.sprite.graphics;
		g.beginFill(t.clr);
		g.drawCircle(0, 0, t.radius * g_ivankRatio);

		if (parent)
			parent.sprite.addChild(t.sprite);
		else
			g_ikWorld.addChild(t.sprite);
	}


////////////////////////////////////////////////////////////////
function Body()
{
	// extends (or is subpart) Thing
	t.body		= null;
	t.density	= null;

	// extension
	t.beforeUpdate = function()
	{
		if (t.body)
			t.pos = v2copy( t.body.GetPosition() );
	}
	t.afterSetPos = function()
	{
		t.applyPosToBox2d();
	}

	// internal
	t.setBox2d = function()		// ak to neni global object, ma to riesit parent?
	{
		t.body = createBox2dCircle(t.radius, t.density);
		if (!t.body) return;

		if (t.name == 'tree')
			t.createSpringAnchor();

		t.setPos( v2(0, 0) );
	}



////////////////////////////////////////////////////////////////
function Movement()
{
	var t = this;

	t.acc	= null;		// acceleration value

	// extension
	t.init = function()
	{
		if (t.body)
			t.body.SetLinearDamping(7);
	}
	t.update = function()
	{
		applyAcceleration();
		limitSpeed();
	}
	t.action = function(a)
	{
		if (a == 'up') move( {y:-1} );
		if (a == 'dn') move( {y:+1} );
		if (a == 'lt') move( {x:-1} );
		if (a == 'rt') move( {x:+1} );
	}

	// internal
	function applyAcceleration()
	{
		if (!t.acc) return;
		b.ApplyImpulse( b2v(t.acc), b2null() );
		t.acc = null;
	}
	function limitSpeed()
	{
		if (!t.body) return;

		var mx = 3;
		var vel = t.body.GetLinearVelocity();
		var len = v2len(vel);

		if (len < mx) return;

		v2multMe(vel, mx/len);
		t.body.SetLinearVelocity(vel);
	}
	function move(v)
	{
		v.x = def(v.x, 0);
		v.y = def(v.y, 0);

		if (t.body)
		{
			t.acc = def(t.acc, v2null());
			v2addMe(t.acc, v);
		}
		else
		{
			t.addPos(v);
		}
	}


////////////////////////////////////////////////////////////
function SpringAnchor()
{
	var t=this;

	t.joint		= null;
	t.bodyAnchor= null;

	// extension
	t.afterSetPos = function()
	{
		centerSpringAnchor();
	}

	// internal
	function createSpringAnchor(freq, damp)
	{
		t.bodyAnchor = createBox2dStaticAnchor();

		// vetvy sa daju hybat, pomaly sa vratia na miesto
		t.bodyJoint = b2DistJointInit(t.body, t.bodyAnchor);
		t.bodyJoint.frequencyHz = isDef(freq) ? freq : 1;
		t.bodyJoint.dampingRatio = isDef(damp) ? damp : 0.5;

		g_box2d.CreateJoint(t.bodyJoint);

		t.centerSpringAnchor();
	}
	function centerSpringAnchor()
	{
		if (!t.bodyAnchor) return;
		t.bodyAnchor.SetPosition( b2v(t.pos) );
	}
