require([
	'js/js-extension'
]);


var ai = new AI();

function AI()
{
	var t=this;
	t.neurons = [];
	t.links = [];


	t.stimul = function(name, attr)
	{
		if (notDef(name)) return;
		if (isArr(name))
			return t.stimulArr(name, attr);

		neuron(name, attr).activity = 1;
	}
	t.stimulArr = function(arrNames, attr)
	{
		for (var i=0; i < arrNames.length; i++)
			t.stimul(arrNames[i], attr);
	}

	t.calm = function()
	{
		eachNeuron(function(n) {
			n.activity *= 0;//.9;
		});
		eachLink(function(l) {
			l.activity = 0;
		});
	}
	t.learn = function()
	{
		eachLink(function(n) {
			n.activity = 0;
		});

		eachPair(function(a, b)
		{
			if (!a.activity || !b.activity)
				return;

			// inputs are not affected by other inputs (same with outputs)
			if (a.out || b.in)
				return;

			var l = link(a, b);
			var add = 0.1/60 * a.activity*b.activity;
			l.weight += add;
			l.activity += add;
		});
	}
	t.work = function()
	{
		eachNeuron(function(n) {
			if (!n.in) n.activity = 0;
		});

		eachNeuron(function(n) {
			n.propagate();
		});
	}

	t.getLinksFrom = function(n)
	{
		var arr=[];
		eachLink(function(l) {
			if (l.nA==n) arr.push(l);
		});
		return arr;
	}
	t.getInputs = function()
	{
		var arr = [];
		eachNeuron(function(n) {
			if (n.in) arr.push(n);
		});
		return arr;
	}
	t.getOutputs = function()
	{
		var arr = [];
		eachNeuron(function(n) {
			if (n.out) arr.push(n);
		});
		return arr;
	}

	t.createInputs = function(arr)
	{
		for (var i=0; i < arr.length; i++)
			createNeuron(arr[i], 'in');
	}
	t.createOutputs = function(arr)
	{
		for (var i=0; i < arr.length; i++)
			createNeuron(arr[i], 'out');
	}

	function createNeuron(name, attr)
	{
		n = new Neuron(name, attr);
		t.neurons.push(n);
		return n;
	}

	function Neuron(name, attr)
	{
		var n=this;
		n.name = name;
		n.activity = 0;
		if (attr=='in') n.in = 1;
		if (attr=='out') n.out = 1;

		n.propagate = function()
		{
			if (!n.activity) return;
			var arr = t.getLinksFrom(t);
			for (var i=0; i<arr.length; i++)
			{
				var l = arr[i];
				var add = n.activity * l.weight;
				l.activity += add;
				l.nB.activity += add;
			}
		}
	}
	function Link(nA, nB)
	{
		var t=this;
		t.nA = nA;
		t.nB = nB;
		t.weight = 0;
	}
	function neuron(name, attr)
	{
		if (isObj(name) && isDef(name.name))
			return name;

		var n = t.neurons.findByAttr('name', name);
		if (!n) n = createNeuron(name, attr);
		return n;
	}
	function link(nameA, nameB)
	{
		var nA = neuron(nameA);
		var nB = neuron(nameB);
		for (var i=0; i < t.links.length; i++)
		{
			var l = t.links[i];
			if (l.nA == nA && l.nB == nB)
				return l;
		}
		var l = new Link(nA, nB);
		t.links.push(l);
		return l;
	}
	function eachPair(fn)
	{
		var arr = t.neurons;
		for (var i=0; i < arr.length; i++)
		{
			var a = arr[i];
			for (var j=0; j < arr.length; j++)
			{
				var b = arr[j];
				fn(a, b);
			}
		}
	}
	function eachNeuron(fn)
	{
		for (var i=0; i < t.neurons.length; i++)
			fn( t.neurons[i] );
	}
	function eachLink(fn)
	{
		for (var i=0; i < t.links.length; i++)
			fn( t.links[i] );
	}


	// debug output
	t.printout = function()
	{
		var s = '';
		var ins = ai.getInputs();
		$.each(ins, function(i, e)
		{
			var lnks = ai.getLinksFrom(e);
			var sumW = 0;

			$.each(lnks, function(j, l){
				sumW += l.weight;
			});

			$.each(lnks, function(j, l){
				var nameA = l.nA.name.normalizeLength(15);
				s += '\n'+niceOut(nameA, l.weight, l.weight/sumW, l.nB.name);
			});
		});
		out(s);
	}
}
