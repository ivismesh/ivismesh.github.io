var margin = {top: 200, right: 120, bottom: 20, left: 120},
    width = $("#visualization").width() - margin.right - margin.left,
    height = $("#visualization").height() - margin.top - margin.bottom;

var i = 0,
	duration = 750,
	root,
	descToPaths,
	searchText,			// The search term. This has to be updated when a new search is made.
	nodeSize = 4.5,		// The size of each node.
	goalNodeSize = 8;	// The size of the nodes representing the search term.

var doScaleAndCenter = true;	// Determines if the tree should be scaled and centered on screen.

// Tree with variable size.
var tree = d3.layout.tree()
	.nodeSize([25, 25]);

// Cureved lines generator.
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
	.attr("id", "container")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Zoom translate and scale.
function zoomed() {
	var tx = Math.min(15, d3.event.translate[0]),
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
	"Anatomy": "#BDBDBD",
	"Organisms": "#BF812D",
	"Diseases": "#D9D9D9",
	"Chemicals and Drugs": "#DFC27D",
	"Analytical, Diagnostic and Therapeutic Techniques, and Equipment": "#F6E8C3",
	"Psychiatry and Psychology": "#FE9929",
	"Phenomena and Processes": "#FEC44F",
	"Disciplines and Occupations": "#FEE391",
	"Anthropology, Education, Sociology, and Social Phenomena": "#41AB5D",
	"Technology, Industry, and Agriculture": "#74C476",
	"Humanities": "#A1D99B",
	"Information Science": "#C7E9C0",
	"Named Groups": "#6BAED6",
	"Health Care": "#9ECAE1",
	"Publication Characteristics": "#C6DBEF",
	"Geographicals": "#DEEBF7"
}





// The definitions.
var definitions;







// Load the tree structure.
d3.json("data.json", function(error, data) {
	if (error) throw error;

	root = data;
	root.x0 = height / 2;
	root.y0 = 0;

	//console.log(root);

	d3.json("descNodes.json", function(error, data) {
		if (error) throw error;

		descToPaths = data;

			// Load the definitions.
			d3.csv("definitions.csv", function(error, data) {
				definitions = data;

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
 	//else if(addr.length > d.address.length) {
	else {
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

	// Use timer to know when transitions are complete.
	var timer = null,
		timerFunc = function () {
			if(doScaleAndCenter === true)scaleAndCenter();					// When transitions completed scale and center.
    };



	// Create new nodes.

	// Compute the new tree layout.
	var nodes = tree.nodes(root).reverse(),
		links = tree.links(nodes);

	// Normalize for fixed-depth.
	nodes.forEach(function(d) {
		d.y = d.depth * 350;
	});

	// Update the nodes.
	var node = svg.selectAll("g.node")
		.data(nodes, function(d) { return d.id || (d.id = ++i); });

	// Enter any new nodes at the parent's previous position.
	var nodeEnter = node.enter().append("g")
		.attr("class", "node")
		.attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
		.on("click", function(d) {doScaleAndCenter = false; click(d)});

	// Use circles for all but first level.
	nodeEnter.filter(function(d) {
		if(d.depth === 1) return false;
		else return true;
	})
	.append("circle")
		.attr("r", function(d) {					// Searched nodes are larger than other nodes.
			if(d.name === searchText) {
				return goalNodeSize;
			} else {
				return nodeSize;
			}
		})
		.style("fill", function(d) {					// Nodes which can be expanded have colored fill. Other nodes have white fill.
			if(d._children) {
				return treeColor(d.address);
			} else {
				return "White";
			}
		})
		.style("filter", function(d) {					// Searched nodes have a glow.
			if(d.name === searchText) {
				return "url(#glow)";
			} else {
				return null;
			}

		})
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
		.attr("x", function(d) {
			if(d.depth === 1) {
				return -25;
			}
			else if(d.children || d._children) {
				return -10
			}
			else {
				return 10;
			}
		})
		.attr("dx", function(d) {					// Offset the text at searched nodes so it doesn't overlap the larger nodes.
			if(d.name === searchText) {
				if(d.children || d._children) {
					return "-0.5em";
				} else {
					return "0.5em";
				}
			} else {
				return "0em";
			}
		})
		.attr("dy", ".35em")
		.attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
		.attr('class', d => d.name.length < 18 ? 'fulltext' : 'shorttext')
		.text(function(d) {
			return d.name.length < 40 ? d.name : d.name.slice(0, 39);
		})
		.style("fill-opacity", 1e-6)
		.style("font-weight", function(d) {			// Make searched nodes have bold text.
			if(d.name === searchText) {
				return "bold";
			} else {
				return "normal";
			}
		})
		.attr("opacity", function(d) {if(d.depth === 0) return 0; else return 1;}) // Hide first level.
		.on('mouseover', function(d) {
			if(d.name.length > 40) {
				d3.select(this).text(d => d.name);
			}
		})
		.on('mouseout', function(d) {
			d3.select(this).text(d => d.name.slice(0, 39));
		})
		.on('click', function(d) {
			window.location.href = "/arbor/?searchtext=" + d.name;
		});



	// Update nodes.

	// Transition nodes to their new position.
	var nodeUpdate = node.transition()
		.duration(duration)
		.each("end", function() {					// Reset the timer.
			clearTimeout(timer);
			timer = setTimeout(timerFunc, 1);
		})
		.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

	nodeUpdate.select("circle")					// Searched nodes are larger than other nodes.
		.attr("r", function(d) {
			if(d.name === searchText) {
				return goalNodeSize;
			} else {
				return nodeSize;
			}
		})
		.style("fill", function(d) {					// Nodes which can be expanded have colored fill. Other nodes have white fill.
			if(d._children) {
				return treeColor(d.address);
			} else {
				return "White";
			}
		})
		.style("filter", function(d) {					// Searched nodes have glow.
			if(d.name === searchText) {
				return "url(#glow)";
			} else {
				return null;
			}

		});

	nodeUpdate.select("text")
		.style("fill-opacity", 1)
		.attr("dx", function(d) {					// Offset the text at searched nodes so it doesn't overlap the larger nodes.
			if(d.name === searchText) {
				if(d.children || d._children) {
					return "-0.5em";
				} else {
					return "0.5em";
				}
			} else {
				return "0em";
			}
		})
		.style("font-weight", function(d) {			// Make searched nodes have bold text.
			if(d.name === searchText) {
				return "bold";
			} else {
				return "normal";
			}
		});



	// Remove old nodes.

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
		.attr("opacity", function(d) { return d.source.depth == 0 ? 0 : 1 } )		// Hide first level.
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
	doScaleAndCenter = true;

	// Get the paths to the nodes.
	var paths = descToPaths[string.replace(/ /g, '').toLowerCase()];

	if(paths != undefined) {
		history.replaceState(null, "search", '?searchtext=' + encodeURIComponent(string));
	} else {
		history.replaceState(null, "search", '?searchtext=');
	}

	searchText = decodeURIComponent(window.location.href.split("?searchtext=")[1]).replace(/\+/, ' ');

	//console.log("Paths: ");
	//console.log(paths);

	// Expand the tree to the nodes.
	root.children.forEach(collapse);
	for(path in paths) {
		expand(root, paths[path]);
	}
	update(root);

	updateDescription();

	//Apply glow filter to searched nodes.
	d3.selectAll(".node")
		.filter(function(a){
			if(a.name === searchText) {
				return true;
			} else {
				return false;
			}
		})
		.selectAll("circle")
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





/*
 * Updates the "definition" panel to show the definition of the searched term. Also adds a link to pubmed.
 */
function updateDescription() {
	var ref = "https://www.ncbi.nlm.nih.gov/pubmed/?term=";					// The base url to pubmed.
	var kib = "https://mesh.kib.ki.se/term/";								// The base url to kib.
  var name = "";
	// Add the search term to the pubmed url and change whitespace to "+".
	for(var i = 0; i < searchText.length; i++) {
		ref = ref + searchText[i];
	}
	ref = ref.replace(/\s/g, "+");

	// Search for the definition of the search term and add it to the "definition" panel. Also, add the id to the kib url.
	for(var i = 0; i < definitions.length; i++) {
		if(definitions[i].mesh_eng.toUpperCase() === searchText.toUpperCase()) {
			document.getElementById("description").innerHTML = definitions[i].scope_note_eng;
			kib = kib.concat(definitions[i].uniqueID);
      name = definitions[i];
		}
	}

	// Update the DOM.
	document.getElementById("pubmed").href = ref;
	document.getElementById("synonyms").innerHTML = name.concat(" on PubMed");
	document.getElementById("kibki").href = kib;
	document.getElementById("kibki").innerHTML = "Link to Svensk MeSH";
}





/*
 * Scales and centers the tree on screen.
 */
function scaleAndCenter() {
	var bbox = svg.node().getBBox();
	var scale = 1.2 / Math.max((bbox.width - bbox.x) / width, (bbox.height - bbox.y) / height);
	var translate = [(- bbox.x - bbox.width / 2) * scale + (width/2), (- bbox.y - bbox.height / 2) * scale + (height/2)];

	/*
	d3.select("g")
		.transition()
		.duration(800)
		.attr("transform", "translate(" + translate + ")scale(" + scale + ")");
	*/

	d3.select("g")
		.transition()
		.duration(800)
		.call(zoom
			.translate(translate)
			.scale(scale).event
		);

}
