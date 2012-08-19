require([
	'js/thing',
	'js/parts',
]);

/*
possible todo:
- radius pod-objektov by mal byt pomerovy k parent radiusu

- nutrition + eat, etc
- simple ai

*/



var arrThingsDef =
[
	{
		name:		'tree',
		radius:		[0.3, 2],
		parts: [
			{ name: 'circle', clr: 0x327b0e },
			{ name: 'body', density: 2, damping: 5, radiusMult: 0.6, layer: 'trees' },
			{ name: 'anchor', freq: 1.5 },
		],
	},
	{
		name:		'human',
		radius:		0.5,
		parts: [
			{ name: 'circle', clr: 0xf2cba4 },
			{ name: 'body', density: 1 },
			{ name: 'control' },
		],
		things: [
			{ name: 'eyes' },
		],
	},
	{
		name: 		'animal',
		radius: 	[0.5, 1],
		parts: [
			{ name: 'circle', clr: 0xc26d31 },
			{ name: 'body', density: 1 },
		],
		things: [
			{ name: 'eyes' },
		]
	},
	{
		name:		'blood',
		layer:		'ground',
		radius:		[0.05, 0.1],
		pos:		'rnd',
		parts: [
			{ name: 'circle', clr: 0xdd0000 },
		],
	},
	{
		name:		'eyes',
		things: [
			{ name: 'eye', x: -0.2 },
			{ name: 'eye', x: 0.2 },
		],
	},
	{
		name:		'eye',
		radius:		0.1,
		y:			0.7,
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
		y:			0.5,
		parts: [
			{ name: 'circle', clr: 0x000000 },
		],
	},
];


function genThing(name, parentThing, defCustom)
{
	var def = getThingDef(name);
	if (!def) return;

	def = clone(def);

	if (defCustom)
		$.extend(def, defCustom);

	def.parentRadius =	parentThing ?
						parentThing.radius :
						1;

	def.radius = calcRadius(def.radius);	// calculate it right now
	def.radius *= def.parentRadius;			// ratio of parent

	var t = new Thing( def, parentThing );

	return t;
}


function calcRadius(val)
{
	if (notDef(val))	return 1.0;	// sameRatio
	if (!val.length)	return val;
	else				return rnd( val[0], val[1] );
}

function getThingDef(name)
{
	return arrThingsDef.findByAttr('name', name);
}
