var margin = {top: 20, right: 120, bottom: 20, left: 120},
    width = document.body.clientWidth - margin.right - margin.left,
    height = 800 - margin.top - margin.bottom;

var i = 0,
    duration = 750,
    root,
	csvdata,
	searchText;

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var zoom = d3.behavior.zoom()
    .translate([0, 0])
    .scale(1)
    .scaleExtent([0.5, 8])
    .on("zoom", zoomed);

var svg = d3.select("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
	.call(zoom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

function zoomed(){
	var tx = Math.min(150, d3.event.translate[0]),
		//ty = Math.min(0, d3.event.translate[1]);
		ty = d3.event.translate[1];
	svg.attr("transform", "translate(" + [tx, ty] + ")scale(" + d3.event.scale + ")");
}

//Container for the gradients
var defs = svg.append("defs");

//Filter for the outside glow
var filter = defs.append("filter")
	.attr("x", "-100%")
	.attr("y", "-100%")
	.attr("width", "300%")
	.attr("height", "300%")
	.attr("id","glow");

filter.append("feFlood")
	.attr("flood-color","green")
	.attr("flood-opacity","1")
	.attr("result","flood");

filter.append("feComposite")
	.attr("in","flood")
	.attr("in2","SourceGraphic")
	.attr("operator","in")
	.attr("result","mask");

filter.append("feMorphology")
	.attr("in","mask")
	.attr("radius","2")
	.attr("operator","dilate")
	.attr("result","dilated");
	
filter.append("feGaussianBlur")
	.attr("in","dilated")
	.attr("stdDeviation","3")
	.attr("result","blurred");
	
var feMerge = filter.append("feMerge");

feMerge.append("feMergeNode")
	.attr("in","blurred");
	
feMerge.append("feMergeNode")
	.attr("in","SourceGraphic");



	
	
d3.json("data.json", function(error, data) {
  if (error) throw error;

  root = data;
  root.x0 = height / 2;
  root.y0 = 0;

  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }
  
  d3.csv("data.csv", function(error, data) {
		if (error) throw error;

		csvdata = data;
		
		search();
	});

  root.children.forEach(collapse);
  update(root);
});





var colors = {
	"Anatomy": "#AA3939",
	"Organisms": "#FFAAAA",
	"Diseases": "#D46A6A",
	"Chemicals and Drugs": "#801515",
	"Analytical, Diagnostic and Therapeutic Techniques, and Equipment": "#550000",
	"Psychiatry and Psychology": "#226666",
	"Phenomena and Processes": "#669999",
	"Disciplines and Occupations": "#407F7F",
	"Anthropology, Education, Sociology, and Social Phenomena": "#0D4D4D",
	"Technology, Industry, and Agriculture": "#003333",
	"Humanities": "#7B9F35",
	"Information Science": "#D4EE9F",
	"Named Groups": "#A5C663",
	"Health Care": "#567714",
	"Publication Characteristics": "#354F00",
	"Geographicals": "#954505"	
}





d3.select(self.frameElement).style("height", "800px");

function update(source) {

  // Compute the new tree layout.
  var nodes = tree.nodes(root).reverse(),
      links = tree.links(nodes);

  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * 320; });

  // Update the nodes…
  var node = svg.selectAll("g.node")
      .data(nodes, function(d) { return d.id || (d.id = ++i); });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
      .on("click", click);
	
	
	
	//Use circles for all but first level.
  nodeEnter.filter(function(d) {
	  if(d.depth === 1) return false;
	  else return true;
	})
	.append("circle")
      .attr("r", 1e-6)
      .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; })
	  .attr("opacity", function(d) {if(d.depth === 0) return 0; else return 1;});		//Hide first level.
	
	
	
	//Use rectangles for first level.
	nodeEnter.filter(function(d) {
		if(d.depth === 1) return true;
		else return false;
	})
	.append("rect")
		.attr("width", 26)
		.attr("height", 26)
		.attr("x", -10)
		.attr("y", -14)
		.attr("fill", function(d) {return colors[d.name]})
		//.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; })
		.attr("opacity", function(d) {if(d.depth === 0) return 0; else return 1;});		//Hide first level.

		

  nodeEnter.append("text")
      //.attr("x", function(d) { return d.children || d._children ? -10 : 10; })
	  .attr("x", function(d) { if(d.depth === 1) return -25; else return d.children || d._children ? -10 : 10; })
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
      .text(function(d) { return d.name; })
      .style("fill-opacity", 1e-6)
	  .attr("opacity", function(d) {if(d.depth === 0) return 0; else return 1;});		//Hide first level.

  // Transition nodes to their new position.
  var nodeUpdate = node.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

  nodeUpdate.select("circle")
      .attr("r", function(d) {if(d.name === searchText) return 9; else return 4.5})
      .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  nodeUpdate.select("text")
      .style("fill-opacity", 1);

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
      .remove();

  nodeExit.select("circle")
      .attr("r", 1e-6);

  nodeExit.select("text")
      .style("fill-opacity", 1e-6);

  // Update the links…
  var link = svg.selectAll("path.link")
      .data(links, function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
  link.enter().insert("path", "g")
      .attr("class", "link")
	  .attr("opacity", function(d) {if(d.source.depth === 0) return 0; else return 1;}) //Hides first level.
      .attr("d", function(d) {
        var o = {x: source.x0, y: source.y0};
        return diagonal({source: o, target: o});
      });

  // Transition links to their new position.
  link.transition()
      .duration(duration)
      .attr("d", diagonal);

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
        var o = {x: source.x, y: source.y};
        return diagonal({source: o, target: o});
      })
      .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
  
  d3.selectAll(".node")
		.filter(function(a){
			if(a.name === "Geographicals") return true;
			else return false;
		})
		.attr("x", 0)
		.attr("x0", 0);
}





// Toggle children on click.
function click(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  update(d);
}





/*
 * Expands all paths to the searched nodes.
 */
function expand(root, paths) {
	
	var current = root;
	
	//Each path.
	for(var i = 0; i < paths.length; i++) {
		var path = paths[i].split(".");
		var treeletter = path[0].slice(0,1);
		
		//Get the correct tree.
		var tree;
		for(var j = 0; j < root.children.length; j++) {
			if(root.children[j].address === treeletter) tree = root.children[j];
		}
		
		//The current node is the first node in a tree.
		current = tree;
		
		console.log("Tree: " + treeletter);
		console.log("Path: " + path);
		
		//The path to each node in the path.
		//If the path is A.B.C then the nodes have paths
		//A, A.B and A.B.C.
		var nodesPaths = [];
		for(var j = 0; j < path.length; j++) {
			nodesPaths.push(path.slice(0, j+1).join("."));
		}
		
		console.log("Paths: ");
		console.log(nodesPaths);
		
		//Follow the path. At each node simulate a click.
		for(var j = 0; j < nodesPaths.length; j++) {
			console.log("Current node: " + current.name);
			
			//The path to the next node.
			var pathToNextNode = nodesPaths[j];
			
			//console.log("Path to next node: " + nodesPaths[j]);
			
			if(current._children != null) {
				//Hidden children. Look for a child with the correct path.
				
				for(var n = 0; n < current._children.length; n++) {
					if(current._children[n].address === nodesPaths[j]) {
						console.log("Next node: " + current._children[n].name);
						//Save the node to click.
						var nodeToClick = current;
						//Change current node to the correct child.
						current = current._children[n];
						//Click the previously current node.
						click(nodeToClick);
						break;
					}
				}
				
			} else if(current.children != null) {
				//Non hidden children. Look for a child with the correct path but don't click.
				
				for(var n = 0; n < current.children.length; n++) {
					if(current.children[n].address === nodesPaths[j]) {
						console.log("Next node (b): " + current.children[n].name);
						//Change current node to the correct child.
						current = current.children[n];
						break;
					}
				}
			}
		
		}
	}
}





function searchcsv(searchText) {
	console.log("Searching for paths to: " + searchText);
	var paths = [];
	csvdata.forEach(function(d) {
		if(d.name === searchText) {
			paths.push(d.address);
		}
	});
	return paths;
}





function search() {
	
	//var searchText = document.getElementById("searchForm").elements["searchText"].value;
	searchText = window.location.href.split("?searchtext=")[1];
	console.log(searchText);
	addresses = [];
	
	//Get the paths to the nodes.
	var paths = searchcsv(searchText);
	
	console.log("Paths: ");
	console.log(paths);
	
	//searchTree(root, searchText);
	//console.log(addresses);
	
	//Expand the tree to the nodes.
	expand(root, paths);
	
	
	
	
	
	//Apply filters.
	d3.selectAll(".node")
		.filter(function(a){
			if(a.name === searchText) return true;
			else return false;
		})
		.selectAll("circle")
		.attr("r", 18)
		.style("filter", function(d) {return "url(#glow)"});
}
