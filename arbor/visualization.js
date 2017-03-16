var margin = {top: 200, right: 120, bottom: 20, left: 120},
    width = $("#visualization").width() - margin.right - margin.left,
    height = $("#visualization").height() - margin.top - margin.bottom;

var i = 0,
	duration = 750,
	root,
	descToPaths,
	searchText;

// Tree with variable size.
var tree = d3.layout.tree()
	.nodeSize([25, 25]);

// Cureved lines.
var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

// Zoom control.
var zoom = d3.behavior.zoom()
    .translate([0, 0])
    .scale(1)
    .scaleExtent([0.05, 8])
    .on("zoom", zoomed);

// Main canvas.
var svg = d3.select("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
	.call(zoom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

function zoomed() {
	var tx = Math.min(150, d3.event.translate[0]),
		ty = d3.event.translate[1];
	svg.attr("transform", "translate(" + [tx, ty] + ") scale(" + d3.event.scale + ")");
}

// Container for the gradients.
var defs = svg.append("defs");

// Filter for the outside glow.
var filter = defs.append("filter")
	.attr("x", "-100%")
	.attr("y", "-100%")
	.attr("width", "300%")
	.attr("height", "300%")
	.attr("id","glow");

filter.append("feFlood")
	.attr("flood-color", "#FF0000")
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





// Tree and node colors.
var colors = {
	"Anatomy": "#C189C4",
	"Organisms": "#C8457F",
	"Diseases": "#795548",
	"Chemicals and Drugs": "#FFA500",
	"Analytical, Diagnostic and Therapeutic Techniques, and Equipment": "#A63603",
	"Psychiatry and Psychology": "#E6550D",
	"Phenomena and Processes": "#FD8D3C",
	"Disciplines and Occupations": "#FDBE85",
	"Anthropology, Education, Sociology, and Social Phenomena": "#006D2C",
	"Technology, Industry, and Agriculture": "#31A354",
	"Humanities": "#74C476",
	"Information Science": "#BAE4B3",
	"Named Groups": "#08519C",
	"Health Care": "#3182BD",
	"Publication Characteristics": "#6BAED6",
	"Geographicals": "#BDD7E7"
}





d3.json("data.json", function(error, data) {
	if (error) throw error;

	root = data;
	root.x0 = height / 2;
	root.y0 = 0;

	console.log(root);

	d3.json("descNodes.json", function(error, data) {
		if (error) throw error;

		descToPaths = data;

		searchText = decodeURIComponent(window.location.href.split("?searchtext=")[1]).replace(/\+/, ' ');
		
		root.children.forEach(collapse);
		if(searchText.length > 0) {
			search(searchText);
		}
		else {
			update(root);
		}
	
		// Search form button on-click function.
		$("#searchButton").click(function(e) {
			e.preventDefault();
			search($("#searchText").val());
		});
		// Search form on-enter function.
		$("#searchText").bind('keydown', e => enterKey(e));
		function enterKey(e) {
			if(e.keyCode == 13) {
				e.preventDefault();
				search($("#searchText").val());
			}
		}
	});

	$('#searchText').focus();
	
});





d3.select(self.frameElement).style("height", "800px");





function collapse(d) {
  //console.log("collapsing: " + d.data.address);
	if(d.children) {
		if(!d._children) d._children = d.children;
		else {
			for(var child in d.children) {
				d._children.push(d.children[child]);
			}
		}
		if(d._children.length == 0) d._children = null;
		d.children = null;
		for(var child in d._children) {
			this.collapse(d._children[child]);
		}
	}
}





/*
 * Expands all paths to the searched nodes.
 */
 function expand(d, addr) {
 	/*console.log("growing: " + d.data.address + ' to ' + addr);
 	console.log(d);*/

 	// if this d has address == addr
 	if(d.address == addr) {
 		if(d._children) {
 			if(!d.children) d.children = d._children;
 			else {
 				for(var child in d._children) {
 					d.children.push(d._children[child]);
 				}
 			}
 		}
 		d._children = null;
 		return;
 	}

 	// else if thid d has address shorter than addr
 	else if(addr.length > d.address.length) {
 		let subPath = addr.slice(0, d.address.length);
 		if(d._children) {
 			if(!d.children) d.children = [];
 			for(var child in d._children) {
 				if(d._children[child].address == addr.slice(0, d._children[child].address.length)) {
 					d.children.push(d._children.splice(child, 1)[0]);
 					break;
 				}
 			}
 			if(d._children.length == 0) d._children = null;
 		}
 		if(d.children) {
 			for(var child in d.children) {
 				if(d.children[child].address == addr.slice(0, d.children[child].address.length)) {
 					expand(d.children[child], addr);
 				}
 			}
 		}
 	}
}





function update(source) {

	// Compute the new tree layout.
	var nodes = tree.nodes(root).reverse(),
		links = tree.links(nodes);

	// Normalize for fixed-depth.
	nodes.forEach(function(d) {
		d.y = d.depth * 500;
	});

	// Update the nodes.
	var node = svg.selectAll("g.node")
		.data(nodes, function(d) { return d.id || (d.id = ++i); });

	// Enter any new nodes at the parent's previous position.
	var nodeEnter = node.enter().append("g")
		.attr("class", "node")
		.attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
		.on("click", click);
	
	// Use circles for all but first level.
	nodeEnter.filter(function(d) {
		if(d.depth === 1) return false;
		else return true;
	})
	.append("circle")
		.attr("r", function(d) {
			if(d.name === searchText) {
				return 19;
			} else {
				return 1e-6;
			}
		})
		.style("fill", d => d._children ? treeColor(d.address) : "#FFF")
		.style("stroke", d => treeColor(d.address))
		.attr("opacity", function(d) {if(d.depth === 0) return 0; else return 1;});		// Hide first level.
	
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
		.attr("opacity", function(d) {if(d.depth === 0) return 0; else return 1;});		// Hide first level.
	
	// Add labels.
	nodeEnter.append("text")
		.attr("x", function(d) { if(d.depth === 1) return -25; else return d.children || d._children ? -10 : 10; })
		.attr("dy", ".35em")
		.attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
		.attr('class', d => d.name.length < 18 ? 'fulltext' : 'shorttext')
		.text(function(d) {
			return d.name.length < 40 ? d.name : d.name.slice(0, 39);
		})
		.style("fill-opacity", 1e-6)
		.attr("opacity", function(d) {if(d.depth === 0) return 0; else return 1;}) // Hide first level.
		.on('mouseover', function(d) {
			if(d.name.length > 40) {
				d3.select(this).text(d => d.name);
			}
		})
		.on('mouseout', function(d) {
			d3.select(this).text(d => d.name.slice(0, 39));
		});

	// Transition nodes to their new position.
	var nodeUpdate = node.transition()
		.duration(duration)
		.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

	nodeUpdate.select("circle")
		.attr("r", function(d) {if(d.name === searchText) return 19; else return 4.5})

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

	// Update the links.
	var link = svg.selectAll("path.link")
		.data(links, function(d) { return d.target.id; });

	// Enter any new links at the parent's previous position.
	link.enter().insert("path", "g")
		.attr("class", "link")
		.style("stroke", function(d) { return treeColor(d.target.address) } )
		.attr("opacity", function(d) { return d.source.depth == 0 ? 0 : 0.6 } )		// Hide first level.
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
	
}





// Toggle children on click.
function click(d) {
  if(d._children) {
    if(!d.children) d.children = d._children;
    else {
      for(child in d._children) {
        d.children.push(d._children[child]);
      }
    }
    d.children.sort(function(a, b) { return a.address.slice(a.address.length-3,a.address.length) > b.address.slice(b.address.length-3,b.address.length) ? 1 : -1 });
    d._children = null;
  } else if(d.children) {
    d._children = d.children;
    d.children = null;
  }
  update(d);
}





function search(string) {
	// Get the paths to the nodes.
	var paths = descToPaths[string.replace(/ /g, '').toLowerCase()];

	if(paths != undefined) {
		history.replaceState(null, "search", '?searchtext=' + encodeURIComponent(string));
	} else {
		history.replaceState(null, "search", '?searchtext=');
	}

	console.log("Paths: ");
	console.log(paths);

	// Expand the tree to the nodes.
	root.children.forEach(collapse);
	for(path in paths) {
		expand(root, paths[path]);
	}
	update(root);

	//Apply filters.
	d3.selectAll(".node")
		.filter(function(a){
			if(a.name === searchString) {
				return true;
			} else {
				return false;
			}
		})
		.selectAll("circle")
		.attr("r", 18)
		.style("filter", function(d) {return "url(#glow)"});
}





/*
 * Returns the color for a tree corresponding to a tree letter.
 */
function treeColor(path) {
	var treeName = path.slice(0,1);
	if(treeName === "A") return colors["Anatomy"];
	if(treeName === "B") return colors["Organisms"];
	if(treeName === "C") return colors["Diseases"];
	if(treeName === "D") return colors["Chemicals and Drugs"];
	if(treeName === "E") return colors["Analytical, Diagnostic and Therapeutic Techniques, and Equipment"];
	if(treeName === "F") return colors["Psychiatry and Psychology"];
	if(treeName === "G") return colors["Phenomena and Processes"];
	if(treeName === "H") return colors["Disciplines and Occupations"];
	if(treeName === "I") return colors["Anthropology, Education, Sociology, and Social Phenomena"];
	if(treeName === "J") return colors["Technology, Industry, and Agriculture"];
	if(treeName === "K") return colors["Humanities"];
	if(treeName === "L") return colors["Information Science"];
	if(treeName === "M") return colors["Named Groups"];
	if(treeName === "N") return colors["Health Care"];
	if(treeName === "V") return colors["Publication Characteristics"];
	if(treeName === "Z") return colors["Geographicals"];
}
