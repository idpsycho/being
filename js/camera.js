require(['js/math']);

function isDef()
{
	if (arguments.length == 1)
		return typeof arguments[0] != 'undefined';

	for (var i=0; i < arguments.length; i++)
		if ( !isDef(arguments[i]) )
			return false;

	return true;	// all was defined
}

var cameraJS_camera;	// might get this out of global

function getCamera()
{
	if (!cameraJS_camera)
		cameraJS_camera = new Camera();

	return cameraJS_camera;
}

function Camera()
{
	var t		= this;
	t.pos		= v2(0, 0);		// centered on screen
	t.zoom		= 1;
	t.lockedOn	= null;	// .pos, or .x .y
	t.w			= 800;	// screen width
	t.h			= 480;	// and height

	t.onRESIZE = function(w, h)
	{
		t.w = w;
		t.h = h;
	}
	t.reset = function()
	{
		t.pos = v2(0, 0);
		t.zoom = 1;

		// apply??
	}
	t.updateWorld = function(ikWorld)
	{
		t.updateLocking();

		ikWorld.scaleX = t.zoom;
		ikWorld.scaleY = t.zoom;

		ikWorld.x = t.w/2 - t.pos.x * t.zoom * g_ivankRatio;
		ikWorld.y = t.h/2 - t.pos.y * t.zoom * g_ivankRatio;
	}
	t.updateLocking = function()
	{
		if (!t.lockedOn) return;
		var o = t.lockedOn;

		// setPos could be goTowardsPos() for smoothness

		var vTarget;
		if (isDef(o.x, o.y))
			vTarget = v2(o.x, o.y);

		if ( isDef(o.pos) && isDef(o.pos.x, o.pos.y) )
			vTarget = v2c(o.pos);

		t.leapTo(vTarget, 0.05);
	}
	t.leapTo = function(v, f01)
	{
		var vTowards = v2m( v2sub(v, t.pos), f01 );
		var v = v2add(t.pos, vTowards)
		t.setPos( v, 1 );
	}
	t.setPos = function(v, dontUnlock)
	{
		t.pos = v2copy(v);

		if (dontUnlock) return;
		t.unlock();
	}

	t.move = function(v)
	{
		var f = 5/t.zoom;
		if (v=='up') v = v2(0, -f);
		if (v=='dn') v = v2(0, f);
		if (v=='lt') v = v2(-f, 0);
		if (v=='rt') v = v2(f, 0);
		t.setPos( v2add(t.pos, v) );
	}
	t.lockTo = function(obj){ t.lockedOn = obj; }
	t.unlock = function()	{ t.lockedOn = null; }
	t.setZoom = function(f)	{ t.zoom = f; }
	t.zoomIn = function(f)	{ if (!f) f = 1.05; t.setZoom(t.zoom * f); }
	t.zoomOut = function(f)	{ if (!f) f = 1.05; t.setZoom(t.zoom / f); }
	t.zoomWheel = function(d) { d>0 ? t.zoomIn() : t.zoomOut(); }

	t.fromScreen = function(v)
	{
		var x = (v.x-t.w/2)/t.zoom + t.pos.x;
		var y = (v.y-t.h/2)/t.zoom + t.pos.y;
		return v2(x, y);
	}
	t.toScreen = function(v)
	{
		var x = (v.x - t.pos.x)*t.zoom + t.w/2;
		var y = (v.y - t.pos.y)*t.zoom + t.h/2;
		return v2(x, y);
	}
	t.screenDrag = function(scrPixels)
	{
		var v = v2m(scrPixels, -1/t.zoom/g_ivankRatio);
		t.move(v);
	}

}

/*

function getScreenAABB(reserveRatio)
{
	var w = stage.stageWidth;
	var h = stage.stageHeight;

	var mn = screenToWorld(0, 0);
	var mx = screenToWorld(w, h);

	var vR = v2sub(mx, mn);
	v2multMe(vR, reserveRatio);

	v2subMe(mn, vR);
	//if (vR.y < 0) vR.y = 0;		// if testing with smaller rect, i want it to touch the bottom
	v2addMe(mx, vR);

	return {mn:mn, mx:mx};
}

*/