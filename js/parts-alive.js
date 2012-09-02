



		//  ███    ███    █  █   █████   ███     ███    █
		// █      █   █   ██ █     █     █  █   █   █   █
		// █      █   █   █ ██     █     ███    █   █   █
		// █      █   █   █  █     █     █  █   █   █   █
		//  ███    ███    █  █     █     █  █    ███    ████

function PartControl(def, thing)
{
	var t = this;
	t.name = 'control';
	t.thing = thing;

	t.walkSpeed = defined(def.walkSpeed, 1);
	t.runSpeed = defined(def.runSpeed, t.walkSpeed*3);
	t.wantSpeed = t.runSpeed;
	t.maxRot = 25;

	t.update = function()
	{
		var partBody = thing.body;
		var b = thing.body ? thing.body.body : null;

		if (t.moveBy)	t.updatePosition(b);
		if (t.turnTo)	t.updateDirection(b);

		t.moveBy = null;
		t.turnTo = null;
	}

	t.updatePosition = function(b)
	{
		if (!b)
		{
			thing.addPos( t.moveBy );
		}
		else
		{
			v2multMe(t.moveBy, 1);
			b.ApplyImpulse( b2v(t.moveBy), b.GetWorldCenter() );

			t.limitSpeed();
			t.emitFootprint();
		}
	}

	// toto dat do samostatnej part, aj ked..
	t.lastFootprint = v2null();
	t.emitFootprint = function()
	{
		if (thing.getSpeed() < 0.5)
			return;

		if (v2isCloserThan(t.lastFootprint, thing.pos, t.wantSpeed))
			return;

		thing.emit('footprint');
		t.lastFootprint = v2c(thing.pos);
	}
	t.updateDirection = function(b)
	{
		t.turnTo = cycleIn180(t.turnTo);
		if (!b)
		{
			thing.setRot( t.turnTo );
		}
		else
		{
			var ang = b.GetAngle()*inDegs;
			ang = cycleIn180(ang);

			var diff = t.turnTo - ang;
			diff = cycleIn180(diff);

			diff *= 0.2;
			diff = absmin(diff, t.maxRot);

			b.SetAngle( (ang+diff)*inRads );
		}
	}

	t.limitSpeed = function()
	{
		var partBody = thing.body;
		if (!partBody) return;
		var b = partBody.body;

		var mx = t.wantSpeed;
		var vel = b.GetLinearVelocity();
		var len = v2len(vel);
		if (len > mx)
			v2multMe(vel, mx/len);

		b.SetLinearVelocity(vel);
	}

	t.turn = function(degs, spd)
	{
		degs = cycleIn180(degs);
		t.turnTo = degs;

		if (spd) t.rotSpeed = spd;
	}

	t.turnByVelocity = function()
	{
		var v = thing.getVel();
		if (v2len(v) > 0.1)
			thing.turn( v2angle(v) );
	}

	t.move = function(v, bRun, dontTurnByVelocity)
	{
		if (!dontTurnByVelocity)
			t.turnByVelocity();

		if (!t.moveBy)
			t.moveBy = v2null();

		t.wantSpeed = bRun ? t.runSpeed : t.walkSpeed;

		if (typeof v == 'string')
		{
			var f = 1;
			if (v == 'up') v = v2(0, -f)
			if (v == 'dn') v = v2(0, f)
			if (v == 'lt') v = v2(-f, 0)
			if (v == 'rt') v = v2(f, 0)
		}

		v2addMe(t.moveBy, v);
	}

}












		// █  █   █  █   █████   ███    █   █████   █    ███    █  █
		// ██ █   █  █     █     █  █   █     █     █   █   █   ██ █
		// █ ██   █  █     █     ███    █     █     █   █   █   █ ██
		// █  █   █  █     █     █  █   █     █     █   █   █   █  █
		// █  █   ████     █     █  █   █     █     █    ███    █  █

function PartNutrition(def, thing)
{
	var t=this;
	t.name = 'nutrition';
	t.thing = thing;
	t.clr = 0xc26d31;

	var pi_r2 = 3.14 * pow(thing.radius, 2);
	t.max = 100 * pi_r2;
	t.now = 50;

	t.burnIdle = 0.1/60;
	t.burnActive = 0.4/60;

	t.getClr = function()
	{
		return lerpClr('930', t.clr, t.get01());
	}

	t.update = function()
	{
		t.now -= t.burnIdle;
		t.now -= t.burnActive * thing.getSpeed();
		//out(t.now);

		if (t.now <= 0)
			thing.partDo('health.sub', 1/60);
	}
	t.sub = function(f) { return t.set(t.now-f); }
	t.add = function(f) { return t.set(t.now+f); }
	t.set = function(f)
	{
		var bef = t.now;

		t.now = minmax(f, 0, t.max);

		return bef-t.now;
	}
	t.get01 = function()
	{
		var f = rangeUnit(t.now, t.max);
		return minmax(f, 0, 1);
	}

	t.bite = function(food, amount)
	{
		amount = defined(amount, rnd(20, 30));

		var eaten = food.partDo('health.bitten', amount, thing);
		if (notDef(eaten)) return 0;
		return t.add(eaten);
	}
}











		// █  █   ████    ██    █      █████   █  █
		// █  █   █      █  █   █        █     █  █
		// ████   ██     ████   █        █     ████
		// █  █   █      █  █   █        █     █  █
		// █  █   ████   █  █   ████     █     █  █

function PartHealth(def, thing)
{
	var t=this;
	t.name = 'health';
	t.thing = thing;
	t.clr = 0xaa0000;

	t.max = defined(def.max, 100);
	t.now = t.max;
	t.smooth = t.now;

	t.healIdle = 2/60;
	t.nextBleed = 0;

	t.getClr = function()
	{
		var c = lerpClr('f00', '0f0', t.get01());
		return saturateClr(c);
	}

	t.update = function()
	{
		var f01 = t.get01();
		if (t.now > 0)
		{
			var fNutr = thing.partDo('nutrition.get01');
			if (fNutr)
				t.add( t.healIdle*fNutr );
		}

		t.smooth += (t.now - t.smooth) * 0.3;

		if (!def.shrink)
		{
			var f = rangeConvert( t.get01(), 0.5, 0, 3, 0.4 );
			if (f) t.bleedEvery( f*1000 );

			if (f01>0)	thing.thingDo('eye.setColor', lerpClr('f00', 'fff', f01));
			else		thing.thingDo('eye.setColor', 0);
		}

		if (def.shrink)
		{
			t.origRadius = defined(t.origRadius, thing.radius);
			var r = f01 * t.origRadius;
			if (r > 0.05)
				thing.setRadius(r);
			else
				thing.remove();
		}
	}
	t.bleedEvery = function(ms)
	{
		if (ago(t.nextBleed) < 0)
			return;

		thing.emit('blood');

		// randomly half up/down
		t.nextBleed = time() + ms + rnd11(ms*0.8);
	}
	t.sub = function(f) { return t.set(t.now-f); }
	t.add = function(f) { return t.set(t.now+f); }
	t.set = function(f)
	{
		var bef = t.now;

		t.now = minmax(f, 0, t.max);

		return bef-t.now;
	}
	t.bitten = function(f, attacker)
	{
		var dmg = t.sub(f);

		if (!attacker) attacker = thing;

		if (!def.shrink)
		{
			t.bleedEvery(100);
			thing.partDo('ai.addEvent', 'bitten',
				{dir: v2dirAng(thing.pos, attacker.pos)});
		}

		return dmg;
	}
	t.dead = function() { return !t.get01(); }
	t.get01 = function(bSmooth)
	{
		var f = bSmooth ? t.smooth : t.now;
		f = rangeUnit(f, t.max);
		return minmax(f, 0, 1);
	}
}





