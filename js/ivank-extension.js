require([
	'js/math',
	'js/js-extension'
]);

var g_ivankRatio = 100;

// dbg = new DebugLayer(stage);
// dbg.afterFrame();





ivank_drawText = function(stage, s, x, y, clr)
{
	var fontSize = 20;

	var t = new TextField();
	clr = normalizeClr(clr);
	t.setTextFormat( new TextFormat("Arial", fontSize, clr) );
	stage.addChild(t);

	t.setText(s);
	t.x = defined(x, 10);
	t.y = defined(y, 10);
}


function DebugLayer(stage, applyRatio)
{
	var t=this;
	var g, dbgStage;
	var ivankRatio = applyRatio ? g_ivankRatio : 1;

	dbgStage = new Sprite();
	stage.addChild(dbgStage);
	g = dbgStage.graphics;
	t.g = g;

	t.onFrame = function()
	{
		removeDebugGraphics();

		// also, keep them on top of stage
		stage.removeChild(dbgStage);	// on top
		stage.addChild(dbgStage);
	}

	function removeDebugGraphics()
	{
		if (g) g.clear();					// lines, circles
		while (dbgStage.children.length)	// texts
			dbgStage.removeChildAt(0);
	}

	t.drawLinePP = function(p, p2, clr, w)
	{
		t.drawLine(p.x, p.y, p2.x, p2.y, clr, w);
	}
	t.drawLinePV = function(p, v, clr, w)
	{
		t.drawLine(p.x, p.y, p.x+v.x, p.y+v.y, clr, w);
	}
	t.drawLine = function(x, y, x2, y2, clr, w) // We Have to Draw the Line Somewhere
	{

		if (!w) w = 1;
		clr = normalizeClr(clr);

		x *= ivankRatio;
		y *= ivankRatio;
		x2 *= ivankRatio;
		y2 *= ivankRatio;
		//w *= ivankRatio;

		g.lineStyle(w, clr);
		g.moveTo(x, y);
		g.lineTo(x2, y2);
	}
	t.drawPoly = function(arrPoints, clr, w)
	{
		var last = arrPoints.length-1;
		for (var i=-1; i < arrPoints.length-1; i++)
		{
			var a = arrPoints[ i<0?last:i ];
			var b = arrPoints[ i+1 ];
			t.drawLine(a.x, a.y, b.x, b.y, clr, w);
		}
	}

	t.drawText = function(s, x, y, clr, fontSize)
	{
		if (isV2(x)) {
			fontSize = clr;
			clr = y;
			y = x.y;
			x = x.x;
		}
		fontSize = defined(fontSize, 20);

		x = defined(x, 10);
		y = defined(y, 10);
		x *= ivankRatio;
		y *= ivankRatio;
		//fontSize /= getCamera().zoom;

		var t = new TextField();
		clr = normalizeClr(clr);
		t.setTextFormat( new TextFormat("Arial", fontSize, clr) );
		dbgStage.addChild(t);

		t.setText(s);
		t.x = x;
		t.y = y;
	}
	t.drawRect = function(x, y, w, h, clr, alpha)
	{
		_drawRect(x, y, w, h, clr, alpha);
	}
	function _drawRect(x, y, w, h, clr, alpha)
	{
		alpha = defined(alpha, 1);
		clr = normalizeClr(clr);

		x *= ivankRatio;
		y *= ivankRatio;
		w *= ivankRatio;
		h *= ivankRatio;

		g.beginFill(clr, alpha);
		g.drawRect(x, y, w, h);
	}

	t.drawCircle = function(x, y, r, c, alpha)
	{
		alpha = alpha || 1;
		c = normalizeClr(c);

		x *= ivankRatio;
		y *= ivankRatio;
		r *= ivankRatio;

		g.beginFill(c, alpha);
		g.drawCircle(x, y, r);
	}

	t.drawBarBordered = function(x, y, w, h, clr, b, f01)
	{
		var bb = b*2;
		t.drawRect(x-b, y-b, w+bb, h+bb, 0);
		t.drawRect(x, y, w*f01, h, clr);
	}

	///////////////////////////////////
	// debug drawing tools
	/*

	function drawCircleO(x, y, r, clr, w, parts)
	{
		var xIsV = (typeof x.x != 'undefined');
		if (xIsV)
		{	// ak je to vektor..
			parts=w;
			w=clr;
			clr=r;
			r=y;
			y=x.y;
			x=x.x;
		}
		_drawCircleO(x, y, r, clr, w, parts);
	}

	function _drawCircleO(x, y, r, clr, w, parts)
	{
		parts = parts || 20;

		var arr = getCirclePoints(parts, r, x, y);
		var len = arr.length;
		for (var i=0; i < len; i++)
		{
			var a = arr[i];
			var b = arr[ (i+1)%len ];
			drawLine(a, b, clr, w);
		}
	}
	function getCirclePoints(parts, r, x, y)
	{
		var arr = [];
		x = x || 0;
		y = y || 0;
		r = r || 1;

		var start = v2(0, -r);
		for (var i=0; i <= parts; i++)
		{
			var n = v2rot(start, i * (360/parts));
			arr.push(n);
		}
		if (x || y)
		{
			for (var i=0; i < arr.length; i++)
				v2addMe( arr[i], v2(x, y) );
		}
		return arr;
	}


	function drawCross(v, r, clr, w)
	{
		drawLineN(v.x-r, v.y, r*2, 0, clr, w);
		drawLineN(v.x, v.y-r, 0, r*2, clr, w);
	}
	function drawCrossBW(v, r)
	{
		drawLineN(v.x-r, v.y, r*2, 0, '000');
		drawLineN(v.x, v.y-r, 0, r*2, 'fff');
	}

	// 		drawLineN(vA, vN, c, w)
	//		drawLineN(vA, nx, ny, c, w)
	function drawLineN(ax, ay, bx, by, c, w, perp)
	{
		var axIsV = (typeof ax.x != 'undefined');
		if (axIsV) {	// ak je to vektor..
			perp=w;
			w=c;		// vaha je uz v 'c', takze to treba posunut..
			c=by;
			by=bx;
			bx=ay;
			ay = ax.y;
			ax = ax.x;
		}
		var bxIsV = (typeof bx.x != 'undefined');
		if (bxIsV) {
			perp=w;
			w=c;
			c=by;
			by = bx.y;
			bx = bx.x;
		}

		// perpendicular
		if (perp)
		{
			var x = bx;
			var y = by;
			if (perp=='r' || perp==1) {
				bx = -y;	// right = 'r' OR 1
				by = x;
			}
			else {
				bx = y;		// left = anything else
				by = -x;
			}
		}

		_drawLine(ax, ay, ax+bx, ay+by, c, w);
	}

	// 		drawLine(vA, vB, c, w)
	//		drawLine(vA, bx, by, c, w)
	function drawLine(ax, ay, bx, by, c, w)
	{
		var axIsV = (typeof ax.x != 'undefined');
		if (axIsV) {	// ak je to vektor..
			w=c;		// vaha je uz v 'c', takze to treba posunut..
			c=by;
			by=bx;
			bx=ay;
			ay = ax.y;
			ax = ax.x;
		}
		var bxIsV = (typeof bx.x != 'undefined');
		if (bxIsV) {
			w=c;
			c=by;
			by = bx.y;
			bx = bx.x;
		}

		_drawLine(ax, ay, bx, by, c, w);
	}

	function drawRectAB(x, y, bx, by, clr, alpha)
	{
		var xIsV = (typeof x.x != 'undefined');
		if (xIsV) {	// ak je to vektor..
			alpha=clr;
			clr=by;
			by=bx;
			bx=y;
			y=x.y;
			x=x.x;
		}
		var bxIsV = (typeof bx.x != 'undefined');
		if (bxIsV) {
			alpha=clr;
			clr=by;
			by=bx.y;
			bx=bx.x;
		}

		_drawRect(x, y, bx-x, by-y, clr, alpha);
	}
	function drawRect(x, y, w, h, clr, alpha)
	{
		var xIsV = (typeof x.x != 'undefined');
		if (xIsV) {	// ak je to vektor..
			alpha=clr;
			clr=h;
			h=w;
			w=y;
			y=x.y;
			x=x.x;
		}
		var wIsV = (typeof w.x != 'undefined');
		if (wIsV) {
			alpha=clr;
			clr=h;
			h=w.y;
			w=w.x;
		}

		_drawRect(x, y, w, h, clr, alpha);
	}
	function drawRectO(ax, ay, bx, by, clr)
	{
		var axIsV = (typeof ax.x != 'undefined');
		if (axIsV) {	// ak je to vektor..
			clr=by;
			by=bx;
			bx=ay;
			ay=ax.y;
			ax=ax.x;
		}
		var bxIsV = (typeof bx.x != 'undefined');
		if (bxIsV) {
			clr=by;
			by=bx.y;
			bx=bx.x;
		}

		_drawRectO(ax, ay, bx, by, clr);
	}

	function _drawRectO(x, y, x2, y2, clr)
	{
		// A---|
		// |___B
		drawLine(x, y, x2, y, clr);
		drawLine(x, y2, x2, y2, clr);

		drawLine(x, y, x, y2, clr);
		drawLine(x2, y, x2, y2, clr);
	}
	function _drawRect(x, y, w, h, clr, alpha)
	{
		if (typeof alpha == 'undefined') alpha = 1;
		clr = normalizeClr(clr);

		dbg.beginFill(clr, alpha);
		dbg.drawRect(x, y, w, h);
	}



	function drawCircle(x, y, r, c, alpha)
	{
		var xIsV = (typeof x.x != 'undefined');
		if (xIsV)	// ak je to vektor..
		{
			alpha=c;
			c=r;
			r=y;
			y=x.y;
			x=x.x;
		}
		_drawCircle(x, y, r, c, alpha);
	}

	function _drawCircle(x, y, r, c, alpha)
	{
		alpha = alpha || 1;
		c = normalizeClr(c);

		dbg.beginFill(c, alpha);
		dbg.drawCircle(x, y, r);
	}



	*/
	///////////////////////////////////////////////////////////

	return this;
}
