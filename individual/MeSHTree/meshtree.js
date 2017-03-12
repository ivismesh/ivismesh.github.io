var meshTree;// = localStorage.getItem('MeSHTree'); // {name: 'MeSH', address: 'root', children: [16]}
var descNodes; // key: name.replace(/ /g, '').toLowerCase(), value: list of addresses

// Set the dimensions and margins of the diagram
var margin = {top: 20, right: 90, bottom: 30, left: 90},
	width = Math.floor(screen.availWidth*0.7) - margin.right - margin.left,
	height = Math.floor(screen.availHeight*0.8) - margin.top - margin.bottom;

// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
  	.append("g")
    .attr("transform", "translate("
          + margin.left + "," + margin.top + ")");

var i = 0,
		delay = 500,
    duration = 750,
    root;

// declares a tree layout and assigns the size
var treemap = d3.tree().size([height, width]);

var root;

// color function
let cScale = d3.scaleOrdinal()
.domain(["A","C","B","E","D","F","G","H","I","J","K","L","M","N","V","Z"])
.range(d3.schemeCategory10);

/************************* DATA LOAD ***************************/
if(meshTree) {
  console.log("MeSHTree from localStorage");
  meshTree = JSON.parse(meshTree);
  $.getJSON('./data/descNodes.json', function(data2) {
    descNodes = data2;
    dataReady();
  });
}
else {
  $.getJSON('./data/MeSHTree.json', function(data) {
    // TODO ? load indicator that exits in dataReady()
    //localStorage.setItem('MeSHTree', data);
    console.log("MeSHTree from server");
    meshTree = data;
    $.getJSON('./data/descNodes.json', function(data2) {
      descNodes = data2;
      dataReady();
    });
  });
}

function dataReady() {
	// search form button onClick
	$("#searchButton").click(function(e) {
		e.preventDefault();
		search($("#searchText").val());
	});
	// search form onEnter
	$("#searchForm").bind('keydown', e => enterKey(e));
	function enterKey(e) {
		if(e.keyCode == 13) {
			e.preventDefault();
			search($("#searchText").val());
		}
	}

	// Assigns parent, children, height, depth
	root = d3.hierarchy(meshTree, function(d) { return d.children; });
	root.x0 = height / 2;
	root.y0 = 0;

	// Collapse after the second level
	root.children.forEach(collapse);

	update(root);

  // focus on search bar
  $("#searchText").focus();
}

// Collapse the node and all it's children
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

// Grow to/reach addr
function grow(d, addr) {
	/*console.log("growing: " + d.data.address + ' to ' + addr);
	console.log(d);*/

	// if this d has address == addr
	if(d.data.address == addr) {
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
	else if(addr.length > d.data.address.length) {
		let subPath = addr.slice(0, d.data.address.length);
		if(d._children) {
			if(!d.children) d.children = [];
			for(var child in d._children) {
				if(d._children[child].data.address == addr.slice(0, d._children[child].data.address.length)) {
					d.children.push(d._children.splice(child, 1)[0]);
					break;
				}
			}
			if(d._children.length == 0) d._children = null;
		}
		if(d.children) {
			for(var child in d.children) {
				if(d.children[child].data.address == addr.slice(0, d.children[child].data.address.length)) {
					this.grow(d.children[child], addr);
				}
			}
		}
	}
}

function update(source) {

  // Assigns the x and y position for the nodes
  var treeData = treemap(root);

  // Compute the new tree layout.
  var nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);

  // Normalize for fixed-depth.
  nodes.forEach(function(d){ d.y = d.depth * 180});

  // ****************** Nodes section ***************************

  // Update the nodes...
  var node = svg.selectAll('g.node')
      .data(nodes, function(d) {return d.id || (d.id = ++i); });

  // Enter any new modes at the parent's previous position.
  var nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr("transform", function(d) {
        return "translate(" + source.y0 + "," + source.x0 + ")";
    })
    .on('click', click);

  // Add Circle for the nodes
  nodeEnter.append('circle')
      .attr('class', 'node')
      .attr('r', 1e-6)
      .style("fill", function(d) {
          return d._children ? "lightsteelblue" : "#fff";
      });

  // Add labels for the nodes
  nodeEnter.append('text')
      .attr("dy", ".35em")
      .attr("x", function(d) {
          return d.children || d._children ? -13 : 13;
      })
      .attr("text-anchor", function(d) {
          return d.children || d._children ? "end" : "start";
      })
      .text(function(d) { return d.data.name; });

  // UPDATE
  var nodeUpdate = nodeEnter.merge(node);

  // Transition to the proper position for the node
  nodeUpdate.transition()
    .duration(duration)
    .attr("transform", function(d) {
        return "translate(" + d.y + "," + d.x + ")";
     });

  // Update the node attributes and style
  nodeUpdate.select('circle.node')
    .attr('r', 10)
    .style("fill", function(d) {
        return d._children ? "lightsteelblue" : "#fff";
    })
    .attr('cursor', 'pointer');


  // Remove any exiting nodes
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) {
          return "translate(" + source.y + "," + source.x + ")";
      })
      .remove();

  // On exit reduce the node circles size to 0
  nodeExit.select('circle')
    .attr('r', 1e-6);

  // On exit reduce the opacity of text labels
  nodeExit.select('text')
    .style('fill-opacity', 1e-6);

  // ****************** links section ***************************

  // Update the links...
  var link = svg.selectAll('path.link')
      .data(links, function(d) { return d.id; });

  // Enter any new links at the parent's previous position.
  var linkEnter = link.enter().insert('path', "g")
      .attr("class", "link")
      .attr('d', function(d){
        var o = {x: source.x0, y: source.y0}
        return diagonal(o, o)
      });

  // UPDATE
  var linkUpdate = linkEnter.merge(link);

  // Transition back to the parent element position
  linkUpdate.transition()
      .duration(duration)
      .attr('d', function(d){ return diagonal(d, d.parent) });

  // Remove any exiting links
  var linkExit = link.exit().transition()
      .duration(duration)
      .attr('d', function(d) {
        var o = {x: source.x, y: source.y}
        return diagonal(o, o)
      })
      .remove();

  // Store the old positions for transition.
  nodes.forEach(function(d){
    d.x0 = d.x;
    d.y0 = d.y;
  });

  // Creates a curved (diagonal) path from parent to the child nodes
  function diagonal(s, d) {

    path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`

    return path
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
}
