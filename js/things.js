require([
	'js/thing',
	'js/parts',
]);

/*
possible todo:
- zviera bude utekat od cloveka
- vrazdit sa bude dat klikanim zblizka na zviera
- jest sa bude dat kliknutim na mrtve zviera
- viditelny uhol
- prepinat farby a poslednu poziciu objektom podla viditelnosti

*/



var arrThingsDef =
[
	////////////////////////////////////////////////
	// ALIVE
	{
		name:		'human',
		radius:		0.5,
		parts: [
			{ name: 'circle', clr: 0xf2cba4 },
			{ name: 'body', density: 1 },
			{ name: 'control', walkSpeed: 1, runSpeed: 3 },
			{ name: 'nutrition' },
			{ name: 'health' },
			{ name: 'seeing' },
			{ name: 'looking', at: 'mouse' },
		],
		things: [
			{ name: 'eyes' },
		],
	},
	{
		name: 		'deer',
		radius: 	[0.5, 1],
		parts: [
			{ name: 'circle', clr: 0xc26d31 },
			{ name: 'body', density: 1 },
			{ name: 'control', walkSpeed: 0.7, runSpeed: 4.8 },
			{ name: 'health' },
			{ name: 'ai' },
			{ name: 'seeing' },
			{ name: 'looking' },
		],
		things: [
			{ name: 'eyes' },
		]
	},
	{
		name: 		'wolf',
		radius: 	0.4,
		parts: [
			{ name: 'circle', clr: 0xa6927d },
			{ name: 'body', density: 1 },
			{ name: 'control', walkSpeed: 2, runSpeed: 5 },
			{ name: 'health' },
			{ name: 'nutrition' },
			{ name: 'ai' },
			{ name: 'seeing' },
			{ name: 'looking', eyeMax: 15 },
		],
		things: [
			{ name: 'eyes' },
		]
	},

	////////////////////////////////////////////
	// NON-CONSCIOUS
	{
		name:		'tree',
		radius:		[0.3, 2],
		parts: [
			{ name: 'circle', clr: 0x327b0e },
			{ name: 'body', density: 2, damping: 5, radius: 0.6 },
			{ name: 'anchor', freq: 1.5 },
		],
	},
	{
		name:		'rock',
		radius:		[0.08, 0.12],
		parts: [
			{ name: 'circle', clr: 0xccccbb, layer: 'ground' },
			{ name: 'body', density: 5, damping: 5,  },
		],
	},

	///////////////////////////////////////////////
	// ON GROUND
	{
		name:		'blood',
		layer:		'ground',
		radius:		[0.05, 0.1],
		x:			'rnd',
		y:			'rnd',
		parts: [
			{ name: 'circle', clr: 0xdd0000 },
			{ name: 'disappears', after: 10000 },
		],
	},
	{
		name:		'footprint',
		layer:		'ground',
		radius:		0.05,
		parts: [
			{ name: 'circle', clr: 0, alpha: 0.1 },
			{ name: 'disappears', after: 10000 },
		],
	},

	////////////////////////////////////////////////
	// EYES
	{
		name:		'eyes',
		things: [
			{ name: 'eye', y: -0.3 },
			{ name: 'eye', y: 0.3 },
		],
	},
	{
		name:		'eye',
		radius:		0.15,
		x:			0.7,
		parts: [
			{ name: 'circle', clr: 0xffffff },
		],
		things: [
			{name: 'eye-inner'},
		],
	},
	{
		name:		'eye-inner',
		radius:		0.5,
		x:			0.4,
		parts: [
			{ name: 'circle', clr: 0x000000 },
		],
	},

	{
		name:		'wolf-eyes',
		things: [
			{ name: 'wolf-eye', y: -0.25 },
			{ name: 'wolf-eye', y: 0.25 },
		],
	},
	{
		name:		'wolf-eye',
		radius:		0.15,
		x:			0.7,
		parts: [
			{ name: 'circle', clr: 0xd2b071 },
		],
		things: [
			{ name: 'eye-inner', radius: 0.4 },
		],
	},
];


function genThing(name, defCustom, parentThing)
{
	var def = getThingDef(name);
	if (!def) return;

	def = clone(def);

	if (defCustom)
		$.extend(def, defCustom);

	calcRadius(def, parentThing);
	var t = new Thing( def, parentThing );
	t.setPos( getDefPosition(def) );

	return t;
}

function chooseRadius(val)
{
	if (notDef(val))	return 1.0;	// sameRatio
	if (!val.length)	return val;
	else				return rnd( val[0], val[1] );
}
function calcRadius(def, parent)
{
	def.radius = chooseRadius(def.radius);

	if (parent)
	{
		def.parentRadius = parent.radius;
		def.radius *= parent.radius;
	}
}


function getThingDef(name)
{
	return arrThingsDef.findByAttr('name', name);
}
