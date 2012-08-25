



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
		if (!b)
		{
			thing.setRot( t.turnTo );
		}
		else
		{
			var ang = b.GetAngle()*inDegs;
			var diff = t.turnTo - ang;
			diff = cycleIn(diff, -180, 180);

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
		t.turnTo = degs;

		if (spd) t.rotSpeed = spd;
	}

	t.move = function(v, bFast)
	{
		if (!t.moveBy)
			t.moveBy = v2null();

		t.wantSpeed = bFast ? t.runSpeed : t.walkSpeed;

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

	t.max = 100;
	t.now = 50;

	t.burnIdle = 0.1/60;
	t.burnActive = 0.8/60;

	t.update = function()
	{
		t.now -= t.burnIdle;
		t.now -= t.burnActive * thing.getSpeed();
		//out(t.now);

		if (t.now <= 0)
			thing.partDo('health.sub', 1/60);
	}
	t.eat = function(amount)
	{
		t.now -= amount;
	}
	t.get01 = function()
	{
		var f = rangeUnit(t.now, t.max);
		return minmax(f, 0, 1);
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

	t.max = 100;
	t.now = 100;
	t.smooth = t.now;

	t.healIdle = 0;//0.1/60;
	t.nextBleed = 0;

	t.update = function()
	{
		t.add( t.healIdle );

		if (!'SHOW HEALTH')
			dbg.drawText( to_i(t.get01()*100), thing.pos.x, thing.pos.y+0.5);

		// this should return the same value, but be smoothly animated
		t.smooth += (t.now - t.smooth) * 0.3;

		var f = rangeConvert( t.get01(), 0.5, 0, 3, 0.4 );
		if (f)
			t.bleedEvery( f*1000 );
	}
	t.bleedEvery = function(ms)
	{
		if (ago(t.nextBleed) < 0)
			return;

		thing.emit('blood');

		// randomly half up/down
		t.nextBleed = time() + ms + rnd11(ms*0.8);
	}
	t.sub = function(f) { return t.add(-f); }
	t.add = function(f)
	{
		t.set( t.now + f );
	}
	t.set = function(f)
	{
		t.now = minmax(f, 0, t.max);
	}
	t.bitten = function(f, attacker)
	{
		t.sub(f);

		if (!attacker)
			attacker = thing;

		var ratio = abRatio(thing.radius*0.5, attacker.radius);
		var v = v2lerp(thing.pos, attacker.pos, ratio);
		thing.emit('blood');

		thing.partDo('ai.checkOut', attacker.pos);
	}
	t.dead = function() { return !t.get01(); }
	t.get01 = function(bSmooth)
	{
		var f = bSmooth ? t.smooth : t.now;
		f = rangeUnit(f, t.max);
		return minmax(f, 0, 1);
	}
}





