var margin = {top: 20, right: 10, bottom: 20, left: 10};
var width = 960 - margin.left - margin.right,
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
		
		//The search term.
		var string = "Rhinitis";
		
		//The paths we have to check.
		var paths = [];
		
		//All ancestors to the searched term. These are the nodes we want to draw.
		var nodes = [];
		
		//All edges between nodes. These are the edges we want to draw. 
		var links = [];
		data.forEach(function(d) {
			if(d.name === string) {
				console.log("Added to paths: " + d.name + " " + d.address);
				paths.push(d.address.split("."));
				//nodes.push(d.name);
			}
		});
		
		console.log(paths);
		
		
		
		
		
		//This commented out part is crap. Use it at your own risk.
		/*
		var checkedNodes = [];
		while(true) {
			if(paths.length === 0) break;
			
			//Get one of the paths.
			var path = paths.pop();
			if(path.length > 0) {
				
				//Remove the last component.
				var pathString = path.join(".");
				var nodeName;
				
				//Get the node name.
				data.forEach(function(d) {
					if(d.address === pathString) {
						nodeName = d.name;
					}
				});
				
				//Get all paths to new node.
				data.forEach(function(d) {
					if(d.name === nodeName && d.address.split(".").length > 1) {
						var newPath = d.address;
						paths.push(newPath.split("."));
					}
				});
			}	
		}
		*/
		
		
		
		
		
		//Follow all paths to get the name of the nodes.
		paths.forEach(function(d) {
			path = d;
			console.log("Checking path: " + path.join("."));
			
			//Iterate all nodes in path.
			//If the path is A-B-C-D-E then we first check A-B, then B-C, then C-D, then D-E.
			//In each step the first node is called A and the second node is called B.
			for(i = 0; i < path.length-1; i++) {
				
				//The paths to node A and B.
				var pathToNodeA = path.slice(0,i+1).join(".");
				var pathToNodeB = path.slice(0,i+2).join(".");
				console.log(pathToNodeA + " -> " + pathToNodeB);
				
				//Get names of node A and B.
				var nodeA;
				var nodeB;
				data.forEach(function(d) {
					if(d.address === pathToNodeA) {
						nodeA = d.name;
					}
					if(d.address === pathToNodeB) {
						nodeB = d.name;
					}
				});
				
				//Add node name if not already in the list.
				if(nodes.indexOf(nodeA) === -1) {
					nodes.push(nodeA);
					console.log("Added node: " + nodeA);
				}
				if(nodes.indexOf(nodeB) === -1) {
					nodes.push(nodeB);
					console.log("Added node: " + nodeB);
				}
				
				//Add the edge from node A to B if not already in the list.
				if(links.indexOf({"from":nodeA, "to":nodeB}) === -1) {
					links.push({"from":nodeA, "to":nodeB});
					console.log("Added link: " + nodeA + " -> " + nodeB);
				}
				
				//Add the goal node if not already in the list.
				if(i === path.length-2) {
					var goalNode;
					data.forEach(function(d) {
						if(d.address === path.join(".")) {
							goalNode = d.name;
						}
					});
					
					if(nodes.indexOf(goalNode) === -1) {
						nodes.push(goalNode);
						console.log("Added node: " + goalNode);
					}
				}
				
			}
			
		});
		
		
		
		
		
		// Create the input graph
		var g = new dagreD3.graphlib.Graph().setGraph({});
		
		//Create a circle for each node.
		nodes.forEach(function(d) {
			console.log(d);
			g.setNode(d, {shape: "circle", style: "fill: white"});
		});
		
		//Create a line for each edge. This part still works like crap.
		links.forEach(function(d) {
			console.log(d.from + " -> " + d.to);
			g.setEdge(d.from, d.to, {});
		});
		
		var svg = d3.select("svg"),
			inner = svg.select("g");
		
		// Create the renderer
		var render = new dagreD3.render();
		
		render(inner, g);
		
		//Old code from trying to use d3 to render nodes.
		/*
		//Get elements.
		var circle = svg.selectAll("circle")
			.data(data);
		
		//Remove surplus elements.
		circle.exit().remove();
		
		//Add new elements.
		circle.enter().append("circle")
				.attr("r", 2.5)
			.merge(circle)
				.attr("cx", function(d) { return g.node(d).x; })
				.attr("cy", function(d) { return g.node(d).y; });
		*/
	});
}

draw();