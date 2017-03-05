var margin = {top: 20, right: 10, bottom: 20, left: 10};
var width = 1500 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.scale.linear()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var svg = d3.select("#chartDiv").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
	.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");





function draw(searchTerm) {
	
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
		
		//The search term.
		var string = searchTerm;
		
		//The paths we have to check.
		var paths = [];
		
		//Lists of nodes. Each list is a path.
		var nodes = [];
		
		data.forEach(function(d) {
			if(d.name === string) {
				console.log("Added path: " + d.address);
				paths.push(d.address.split("."));
			}
		});
		
		
		
		
		
		//Follow all paths to get the names of the nodes.
		paths.forEach(function(d) {
			var path = d;
			console.log("Checking path: " + path.join("."));
			
			var nodesInPath = [];
			
			for(i = 0; i < path.length; i++) {
				var node = path.slice(0,i+1).join(".");
				console.log("Node at: " + node);
				
				data.forEach(function(d) {
					if(d.address === node) {
						console.log(" " + d.name);
						nodesInPath.push(d.name);
					}
				});
			}
			
			nodes.push(nodesInPath);
			
			console.log("Added list of nodes: " + nodesInPath);
			
		});
		
		
		//The number of paths to draw.
		var nPaths = nodes.length;
		
		//Horizontal padding.
		var horPadding = width / (nPaths + 1);
		
		//Vertical padding.
		var vertPadding = 50;
		
		//Delete old elements.
		svg.selectAll("*").remove();
		
		//Draw every path.
		for(i = 0; i < nPaths; i++) {
			var path = paths[i];
			
			//Starting height.
			var startingHeight = height;
			
			//Horizontal position of path.
			horPos = (i * horPadding) + margin.left;
			
			//Add edges for the path.
			svg.append("line")
				.attr("x1", horPos)
				.attr("x2", horPos)
				.attr("y1", startingHeight)
				.attr("y2", (startingHeight - ((path.length-1) * vertPadding)))
			
			//Add nodes for the path.
			for(j = 0; j < path.length; j++) {
				svg.append("circle")
					.attr("r", 15)
					.attr("cx", function(d) { return horPos; })
					.attr("cy", function(d) { return startingHeight - j * vertPadding; })
				
				svg.append("text")
					.attr("x", function(d) { return horPos + 35; })
					.attr("y", function(d) { return (startingHeight - j * vertPadding) + 5; })
					.text(function (d) {return nodes[i].pop()});
			}
			
		}
		
	});
}

function search() {
	var searchTerm = document.getElementById("textbox").value;
	draw(searchTerm);
}