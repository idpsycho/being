require(['js/math', 'js/js-extension']);


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
	t.zoomWanted = 1;
	t.lockedOn	= null;	// object with (.pos, or .x .y) inside
	t.w			= 800;	// screen width
	t.h			= 480;	// and height

	t.onRESIZE = function(w, h)
	{
		t.w = w;
		t.h = h;
	}
	t.updateWorld = function(ikWorld)
	{
		t.leapZoom();

		t.calcAabb();

		t.updateLocking();

		ikWorld.scaleX = t.zoom;
		ikWorld.scaleY = t.zoom;

		ikWorld.x = t.w/2 - t.pos.x * t.zoom * g_ivankRatio;
		ikWorld.y = t.h/2 - t.pos.y * t.zoom * g_ivankRatio;
	}
	t.fromScreen = function(x, y)
	{
		var v = vxy(x, y);
		var z = t.zoom * g_ivankRatio;
		var x = (v.x-t.w/2)/z + t.pos.x;
		var y = (v.y-t.h/2)/z + t.pos.y;
		return v2(x, y);
	}
	t.toScreen = function(x,y)
	{
		var v = vxy(x, y);
		var z = t.zoom * g_ivankRatio;
		var x = (v.x - t.pos.x)*z + t.w/2;
		var y = (v.y - t.pos.y)*z + t.h/2;
		return v2(x, y);
	}
	t.updateLocking = function()
	{
		if (!t.lockedOn) return;

		function getPos(o) {
			if (isDef(o.x, o.y))							return v2(o.x, o.y);
			if (isDef(o.pos) && isDef(o.pos.x, o.pos.y) )	return v2c(o.pos);
			out('fuu' + wtf_pos);
		}

		var vC = getPos(t.lockedOn);
		if (t.lockedOn.getVel) {
			//var ahead = v2m(t.lockedOn.getVel(), 0.1);
			//v2addMe(vC, ahead);
		}

		t.leapTo(vC, 0.07);
	}
	t.leapTo = function(v, f01)
	{
		var vTowards = v2m( v2sub(v, t.pos), f01 );
		var v = v2add(t.pos, vTowards)
		t.setPos( v, 1 );
	}
	t.leapZoom = function()
	{
		var add = (t.zoomWanted - t.zoom) * 0.1;
		assertNum(add, 'leapZoom')
		t.zoom += add;
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
	//t.setZoom = function(f)	{ t.zoom = f; }
	t.setZoom = function(f)	{ t.zoomWanted = f; }
	t.zoomIn = function(f)	{ if (!f) f=10; f=1+f/60; t.setZoom(t.zoomWanted * f); }
	t.zoomOut = function(f)	{ if (!f) f=10; f=1+f/60; t.setZoom(t.zoomWanted / f); }
	t.zoomWheel = function(d) { d>0 ? t.zoomIn() : t.zoomOut(); }

	t.screenDrag = function(scrPixels)
	{
		var v = v2m(scrPixels, -1/t.zoom/g_ivankRatio);
		t.move(v);
	}

	t.calcAabb = function(reserveRatio)
	{
		var w = g_ikStage.stageWidth;
		var h = g_ikStage.stageHeight;
		var mn = t.fromScreen(0, 0);
		var mx = t.fromScreen(w, h);

		t.aabb = {mn:mn, mx:mx};

		scaleAabb(t.aabb, reserveRatio);

		return t.aabb;
	}
	t.metersToPixels = function(m)
	{
		return m * t.zoom * g_ivankRatio;
	}

	t.circleVisible = function(pos, radius)
	{
		if (!t.aabb) return true;
		if (t.metersToPixels(radius*2) < 3)
			return;

		var r = radius;
		var x = pos.x;
		var y = pos.y;
		var mx = t.aabb.mx;
		var mn = t.aabb.mn;

		if (x-r > mx.x) return;
		if (y-r > mx.y) return;

		if (x+r < mn.x) return;
		if (y+r < mn.y) return;

		return true;
	}
}

function scaleAabb(aabb, ratio)
{
	ratio = defined(ratio, 1);
	if (ratio == 1)
		return;

	var vR = v2sub(aabb.mx, aabb.mn);
	v2multMe(vR, ratio);

	v2subMe(aabb.mn, vR);
	v2addMe(aabb.mx, vR);
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
/*
if ('test screen-world conversion')
{
	gui.drawText('100', 100, 100);
	var v = g_cam.fromScreen(v2(100, 100));
	dbg.drawText('100', v.x, v.y);
	dbg.drawText('  ..xx', 4, 2);

	var s = mouseScr;
	var p = mousePos;
	var sx = g_cam.toScreen(p);
	var px = g_cam.fromScreen(s);

	gui.drawText(nice(s)+' S', s.x-150, s.y-20);
	gui.drawText(nice(p)+' W', s.x-150, s.y);
	//gui.drawText(nice(px)+'SX', sx.x+50, sx.y);

	dbg.drawText('P', p.x, p.y);
	dbg.drawText('..  PX', px.x, px.y);
}
*/
