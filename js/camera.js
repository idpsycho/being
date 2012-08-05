require([
	'math'
]);

function Camera()
{
	var t = this;
	var pos = v2(0, 0);
	var zoom = 1;
	var lockedOn;

	t.reset = function()
	{
		pos = v2(0, 0);
		zoom = 1;

		// apply??
	}

	t.afterFrame = function()
	{
		t.updateGraphics();
	}
	t.updateGraphics = function()
	{
		/*
		var w = stage.stageWidth;
		var h = stage.stageHeight;

		var z = g_camZoom;
		stage.scaleX = z;
		stage.scaleY = z;

		g_camY = min(g_camY, currentMaxY());

		var x, y;
		x = w/2 - g_camX * z;
		y = h/2 - g_camY * z;

		stage.x = x;
		stage.y = y;
		*/
	}
	t.move = function(v)
	{
		v2addMe(pos, v);
	}
	t.center = function(v)
	{
		pos = v2copy(v);
	}
	t.setZoom = function(f)
	{
		zoom = f;
	}
	t.zoomIn = function(f)
	{
		zoom *= f;
	}

	t.fromScreen = function(v, y)
	{
		v = useV2(v, y);
		/*
			var w2 = stage.stageWidth/2;
			var h2 = stage.stageHeight/2;
			var z = g_camZoom;

			x = (x-w2)/z + g_camX;
			y = (y-h2)/z + g_camY;

			return v2(x, y);
		*/
	}
	t.toScreen = function(v, y)
	{
		v = useV2(v, y);
		/*
			var w = stage.stageWidth;
			var h = stage.stageHeight;

			x = (x - g_camX)*z + w2;
			y = (y - g_camY)*z + h2;

			return v2(x, y);
		*/
	}

function screenToWorld(x, y)
{
	if (x.x) {
		y = x.y;
		x = x.x;
	}

	var w2 = stage.stageWidth/2;
	var h2 = stage.stageHeight/2;
	var z = g_camZoom;

	x = (x-w2)/z + g_camX;
	y = (y-h2)/z + g_camY;

	return v2(x, y);
}

function worldToScreen(x, y)
{
	if (x.x) {
		y = x.y;
		x = x.x;
	}

	var w = stage.stageWidth;
	var h = stage.stageHeight;

	x = (x - g_camX)*z + w2;
	y = (y - g_camY)*z + h2;

	return v2(x, y);
}

	// sem pojde co sa s nou moze diat
	// plus nejake binds aby to aj ovplyvnilo grafiku
	// t.onResize
	// t.zoomIn, t.zoomOut
	// t.centerOn(pos|obj)
	// t.updateGraphics
	//

	return t;
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
