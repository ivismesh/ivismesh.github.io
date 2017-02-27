var margin = {top: 20, right: 10, bottom: 20, left: 10};
var width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.scaleLinear()
    .range([0, width]);

var y = d3.scaleLinear()
    .range([height, 0]);

var svg = d3.select("#chartDiv").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
	.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");





function draw() {
	
	//Start timer to measure loading time.
	console.time("Data file load time");
	
	d3.csv("data.csv", function(error, data) {
		if(error) {
			throw error;
		} else {
			console.log("Data file successfully loaded")
		}
		
		//Print loading time.
		console.timeEnd("Data file load time");
		
		/*
		data.forEach(function(d) {
			console.log(d);
		});
		*/
		
		//Get elements.
		var circle = svg.selectAll("circle")
			.data(data);
		
		//Remove surplus elements.
		circle.exit().remove();
		
		//Add new elements.
		circle.enter().append("circle")
				.attr("r", 2.5)
			.merge(circle)
				.attr("cx", function(d) { return Math.random()*900; })
				.attr("cy", function(d) { return Math.random()*480; });

	});
}

draw();