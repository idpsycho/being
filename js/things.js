
function Thing()
{
	var t=this;

	var name;
	var clr;
	var pos;
	var vel;
	var radius;
	var density;
	var graphic;
	var physic;

	t.init = function()
	{
		//graphic = new Bitmap();
		//physic = new Box2d.item.circle;
	}
	t.update = function()
	{
		// update by physics
		pos.x = physic.x;
		pos.y = physic.y;

		// update graphics
		graphic.x = pos.x - offsetRadius;
		graphic.y = pos.y - offsetRadius;
	}
	t.remove = function()
	{
		//box2d.removeChild( physics );
		//stage.removeChild( graphic );
	}
}

function addThing(name, x, y)
{
	// ... x,y are optional, and random if not given
}
