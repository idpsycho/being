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
		var thing = genThing(name, defCustom, t);
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
		if (!t.parent)
		{
			var b = g_cam.circleVisible(t.pos, t.radius);
			t.sprite.visible = !!b;
			if (!b)
				return;
		}

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

	t.setColor = function(c)
	{
		if (!t.circle) return;
		t.circle.setColor(c);
	}

	t.setRadius = function(r)
	{
		t.radius = r;
		if (!t.circle) return;
		t.circle.setRadius(r);
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
	t.move = function(v, spd, dontTurnByVelocity)
	{
		if (!t.control) return;

		t.control.move(v, spd, dontTurnByVelocity);
	}
	t.turn = function(degs, spd)
	{
		if (!t.control) return;

		t.control.turn(degs, spd);
	}
	t.say = function(msg)
	{
		// zatial len takto jebnoducho
		var v = v2(t.pos.x-0.5, t.pos.y-t.radius);
		v = g_cam.toScreen(v);
		gui.drawText(msg, v.x, v.y, '000');

		//out( t.name.toUpperCase()+' says: '+msg );
	}
	t.emit = function(name, def)
	{
		if (notDef(def) && name && isStr(name.name)) {
			def = name;
			name = def.name;
		}
		def = defined(def, {});

		def.x = defined(def.x, t.pos.x);
		def.y = defined(def.y, t.pos.y);

		// globally added object to map
		newThing(name, def);
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

	t.drawStats = function(bGui)
	{
		if (bGui) {
			t.drawBarGui(t.health);
			t.drawBarGui(t.nutrition, 1);
		} else {
			t.drawBar(t.health);
			t.drawBar(t.nutrition, 1);
		}
	}
	t.drawBar = function(part, order)
	{
		if (!part || !part.get01 || !part.thing) return;
		order = defined(order, 0);
		var f01 = part.get01('smooth');
		var th = part.thing;

		var r = th.radius;
		var w = r*2;
		var h = r/10;
		var b = r/50;
		var x = th.pos.x - r;
		var y = th.pos.y - r - h*2;
		y -= order*(h*2);

		dbg.drawBarBordered(x, y, w, h, part.getClr(), b, f01);
	}
	t.drawBarGui = function(part, order)
	{
		if (!part || !part.get01 || !part.thing) return;
		order = defined(order, 0);
		var f01 = part.get01('smooth');

		var sw = g_ikStage.stageWidth;
		var sh = g_ikStage.stageHeight;
		var w = sw*0.2;
		var h = sh*0.02;
		var x = sw - w*1.2;
		var y = sh - h*2;
		y -= order*(h*2);

		gui.drawBarBordered(x, y, w, h, part.getClr(), 2, f01);
	}


	// collision detection
	t.isColliding = function()
	{
		return isCollision(t.pos, t.radius);
	}

	t.getBox2dBody = function()
	{
		if (t.body) return t.body.body;
	}

	init();
};

function isCollision(pos, r)
{
	for (var i=0; i < g_arrThings.length; i++)
	{
		var a = g_arrThings[i];
		var b = doCirclesIntersect(pos, r, a.pos, a.radius);
		if (b)
			return true;
	}
}








