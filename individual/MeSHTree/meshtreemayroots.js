// meshtree.js
var meshTree;// = localStorage.getItem('MeSHTree'); // {name: 'MeSH', address: 'root', children: [16]}
var descNodes; // key: name.replace(/ /g, '').toLowerCase(), value: list of addresses
var trees = {}; // Key: A, B, C, ..., Z Value: treeRoot
var lastSearch;

// Svg dimensions and margins
var margin = {top: 20, right: 20, bottom: 20, left: 20},
width = Math.floor(screen.availWidth*0.7) - margin.right - margin.left,
height = Math.floor(screen.availHeight*0.8) - margin.top - margin.bottom;

d3.select('.input-group').style('width', Math.floor(screen.availWidth*0.7) + 'px');

var svgInit = d3.select("body").append("svg")
.attr("width", width + margin.right + margin.left)
.attr("height", height + margin.top + margin.bottom)
.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

//Container for the gradients
var defs = svgInit.append("defs");

// color function
let cScale = d3.scaleOrdinal()
.domain(["A","C","B","E","D","F","G","H","I","J","K","L","M","N","V","Z"])
.range(d3.schemeCategory10);

/*var svgHeart = svgInit.append('g').attr('class', 'heart')
        .attr('transform', 'translate(150, 150) rotate(45)');

svgHeart.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 150)
        .attr('height', 150)
        .style('fill', '#b0ca3b');
svgHeart.selectAll('circle').data([0, 1]).enter().append('circle').attr('class', 'heart')
        .attr('cx', (d,i) => i == 0 ? 0 : 75)
        .attr('cy', (d,i) => i == 0 ? 75 : 0)
        .attr('r', 75)
        .style('fill', (d,i) => i == 0 ? '#b0ca3b' : '#ffffff')
        .style('stroke', (d, i) => i == 0 ? ' none' : '#b0ca3b')
        .style('stroke-width', 1);*/

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

/********************* ASYNC WITH DATALOAD ***********************/

/******************* END ASYNC WITH DATALOAD *********************/

/************************* DATA READY ****************************/
function dataReady() {
  console.log(meshTree);

  // search form button onClick
  $("#searchButton").click(function(e) {
    e.preventDefault();
    search($("#searchText").val());
  });
  // search form onEnter
  $("#searchText").bind('keydown', e => enterKey(e));
  function enterKey(e) {
    if(e.keyCode == 13) {
      e.preventDefault();
      search($("#searchText").val());
    }
  }

  // Welcome tree setup
  for(child in meshTree.children) {
    let treeName = meshTree.children[child].address.slice(0,1);
    trees[treeName] = new treeRoot(
      meshTree.children[child], // treeData
      null, // search term (hopefully descriptor or null)
      width-150,  // tree height (expand direction)
      height/2, // tree width (perpendicular to expand direction)
      150, // offset in width (tree height)
      height/3+(child - 8) * 22, // offset in height (tree width)
      0, // tree rotation
      180, // main tags rotation
      160); // tags rotation
    trees[treeName].collapse(trees[treeName].root); // collapse all
    trees[treeName].update(trees[treeName].root); // enter/update/exit
  }

  // focus on search bar
  $("#searchText").focus();
}

/**************************** SEARCH *****************************/
function search(string) {
  // search result trees
  lastSearch = string;

  let descKey = string.replace(/ /g, '').toLowerCase();
  let growNodes = descNodes[descKey];
  let nodeResult = {};

  for(node in growNodes) {
    let tKey = growNodes[node].slice(0,1);
    if(!nodeResult[tKey]) nodeResult[tKey] = [];
    nodeResult[tKey].push(growNodes[node]);
  }
  // collapse
  for(tree in trees) {
    trees[tree].collapse(trees[tree].root);
  }
  // grow
  for(treeKey in nodeResult) {
    trees[treeKey].expand(nodeResult[treeKey]);
  }
  // update
  for(tree in trees) {
    trees[tree].update(trees[tree].root);
  }

  // search result query
  makeQuery(string);
}

function treeRoot(treeData, gNodes, w, h, offsetw, offseth, treeRotate, mTagRotate, tagRotate) {
  // append the svg object to the body of the page
  // appends a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  this.w = w ? w : width;
  this.h = h ? h : height;
  this.offseth = offseth ? offseth : 0;
  this.offsetw = offsetw ? offsetw : 0;
  this.mainTagRotation = mTagRotate ? mTagRotate : 0;
  this.tagRotation = tagRotate ? tagRotate : 0;
  this.treeRotation = treeRotate ? treeRotate : 0;
  this.growNodes = gNodes;
  this.i = 0, // not used
  this.duration = 400,
  this.delay = 400;

  // Assigns parent, children, height, depth
  this.root = d3.hierarchy(treeData, function(d) { return d.children; });
  this.root.x0 = this.h/2;
  this.root.y0 = 0;

  // declares a tree layout and assigns the size
  this.treemap = d3.tree().size([this.h, this.w]);

	// Add new tree group
  svgInit.selectAll('g.root.'+treeData.address.slice(0,1)).data([1]).enter()
    .append('g').attr('class', 'root ' + treeData.address.slice(0,1))
    .attr('transform', 'translate(' + this.offsetw + ', ' + this.offseth
      + '), rotate(' + this.treeRotation +' '+ 0 +' '+ this.h/2 + ')' );

	// Add glow-filter
	//Filter for the outside glow
	this.filter = defs.append("filter")
		.attr("x", "-100%")
		.attr("y", "-100%")
		.attr("width", "300%")
		.attr("height", "300%")
		.attr('id', 'glow' + treeData.address.slice(0,1));

	this.filter.append("feFlood")
		.attr("flood-color", cScale(treeData.address.slice(0,1)))
		.attr("flood-opacity","1")
		.attr("result","flood");

	this.filter.append("feComposite")
		.attr("in","flood")
		.attr("in2","SourceGraphic")
		.attr("operator","in")
		.attr("result","mask");

	this.filter.append("feMorphology")
		.attr("in","mask")
		.attr("radius","2")
		.attr("operator","dilate")
		.attr("result","dilated");

	this.filter.append("feGaussianBlur")
		.attr("in","dilated")
		.attr("stdDeviation","3")
		.attr("result","blurred");

	this.feMerge = this.filter.append("feMerge");

	this.feMerge.append("feMergeNode")
		.attr("in","blurred");

	this.feMerge.append("feMergeNode")
		.attr("in","SourceGraphic");

// TREEROOT FUNCTIONS

  this.expand = function(arr) {
    for(addr in arr) {
      this.grow(this.root, arr[addr]);
    }
  }

  // Collapse the node and all it's children
  this.collapse = function(d) {
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
  this.grow = function(d, addr) {
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

  this.textPos = function(d) {
    if(d.depth < 1) {
      let angle = (this.mainTagRotation+this.treeRotation)%360;
      let ret = (angle <= 90 || angle >= 270) ?
      'translate(10, 5), rotate(' + this.mainTagRotation + ' -10 -5)' :
      'rotate(180), translate(-10, 5), rotate(' + this.mainTagRotation + ' 10 -5)';
      return ret;
    }
    let angle = (this.tagRotation+this.treeRotation)%360;
    let ret = (angle <= 90 || angle >= 270) ?
    'translate(12, 5), rotate(' + this.tagRotation + ' -12 -5)' :
    'rotate(180), translate(-12, 5), rotate(' + this.tagRotation + ' 12 -5)';
    return ret;
  }

  this.textAnchor = function(d) {
    if(d.depth < 1) {
      let angle = (this.mainTagRotation+this.treeRotation)%360;
      return (angle <= 90 || angle >= 270) ? 'start' : 'end';
    }
    let angle = (this.tagRotation+this.treeRotation)%360;
    return (angle <= 90 || angle >= 270) ? 'start' : 'end';
  }

  this.update = function(source) {
    /*console.log("updating " + source.data.address + ":");
    console.log(source);*/
    // set x, y, depth, parent
    var treeData = this.treemap(this.root);

    // Compute the new tree layout.
    var nodes = treeData.descendants(),
    links = treeData.descendants().slice(1);

    nodes.forEach(function(d) {
      // Normalize for fixed-depth.
      //d.y = d.depth * 95;
    });

    // root in place
    this.root.x = this.root.x0;

    // ****************** Nodes section ***************************
    // Update the nodes...
    var node = svgInit.select('g.'+treeData.data.address.slice(0,1)).selectAll('g.node')
    .data(nodes, function(d) { return d.data.address; });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append('g')
    .attr('class', 'node')
    .attr("transform", function(d) {
      return "translate(" + source.y0 + "," + source.x0 + ")";
    })
    .on('click', click)
		.on('mouseover', dimAll)
		.on('mouseout', unDimAll);

    // Add label frame
    nodeEnter.append('rect')
    .attr('transform', 'translate(-10, -10), rotate(' + (this.mainTagRotation) + ' 10 10)')
    .attr('rx', "10")
    .style('fill', 'white')
    .style('fill-opacity', 0.6)
    .style('stroke', d => cScale(d.data.address.slice(0,1)))
    .style('stroke-width', 1)
    .attr('visibility', d => (d.depth == 0) ? "show" : "hidden")
    .attr("width", 20)
    .attr("height", "20")
    .attr('cursor', 'pointer')
    .transition()
      .duration(this.duration)
      .delay(this.delay)
      .attr("width", d => (d.data.name.length > 15 ? 130 : 20+d.data.name.length*9));

    // Add Circle for the nodes
    nodeEnter.append('circle')
    .attr('class', 'node')
    .attr('r', 1e-6)
    .style('stroke', d => cScale(d.data.address.slice(0,1)))
    .style("fill", d => d._children ? cScale(d.data.address.slice(0,1)) : "#fff");

    // Add labels text
    nodeEnter.append('text')
    .attr('transform', d => this.textPos(d))
    .style('font-family', 'monospace')
    .style('text-anchor', d => this.textAnchor(d))
    .style('fill', d => (d.depth < 1) ? cScale(d.data.address.slice(0,1)) : '#0f0f0f')
    .style('stroke', d => (d.depth < 1) ? cScale(d.data.address.slice(0,1)): 'none')
    .style('stroke-width', 0.5)
    .attr('visibility', d => (d.depth > -1) ? "show" : "hidden")
    .text(function(d) {
      if(d.depth == 0 && d.data.name.length > 13) {
        return d.data.name.slice(0, 13);
      } else if(d.depth > 0 && d.data.name.length > 13) {
        return d.data.name.slice(0, 13);
      }
      return d.data.name;
    })
    .attr('cursor', 'pointer')
    .attr('opacity', 0)
    .style('font-size', d => (d.depth > 0) ? "11px" : "13px")
    .attr('textLength', 0)
    .transition()
      .duration(this.duration-50)
      .delay(this.delay+50)
      .attr('opacity', 1)
      .attr('textLength', d => (d.depth < 1) ? ((d.data.name.length > 13) ? 100 : d.data.name.length*7.5) : ((d.data.name.length > 13) ? 70 : d.data.name.length*6));

    // UPDATE
    var nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
    .duration(this.duration)
    .delay(this.delay)
    .attr("transform", function(d) {
      return "translate(" + d.y + "," + d.x + ")";
    });

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
    .attr('r', 3)
    .style("fill", d => d._children ? cScale(d.data.address.slice(0,1)) : "#fff")
    .style("fill-opacity", "1")
    .attr('cursor', 'pointer')
    .transition()
    .delay(this.delay)
      .duration(this.duration)
      .attr('r', d => d.data.name == lastSearch ? 7.5 : 3)
      .style('filter', d => d.data.name == lastSearch ? 'url(#glow' + d.data.address.slice(0,1) + ')' : 'none');

    // Remove any exiting nodes
    var nodeExit = node.exit().transition()
    .duration(this.duration)
    .delay(this.delay)
    .attr("transform", function(d) {
      return "translate(" + source.y + "," + source.x + ")";
    })
    .remove();

    // On exit reduce the node circles size to 0AbsorptionAbsorptionAbsorption
    nodeExit.select('circle')
    .attr('r', 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
    .style('fill-opacity', 1e-6);

    // ****************** links section ***************************

    // Update the links...
    var link = svgInit.select('g.'+treeData.data.address.slice(0,1)).selectAll('path.link')
    .data(links, function(d) { return d.data.address; });

    // Enter any new links at the parent's previous position.
    var linkEnter = link.enter().insert('path', "g")
    .attr("class", "link")
    .attr('stroke', d => cScale(d.data.address.slice(0,1)))
    .attr('opacity', 0.2)
    .attr('d', function(d) {
      var o = {x: source.x0, y: source.y0}
      return diagonal(o, o)
    })

    // UPDATE
    var linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
    .duration(this.duration)
    .delay(this.delay)
    .attr('d', function(d){ return diagonal(d, d.parent) });

    // Remove any exiting links
    var linkExit = link.exit().transition()
    .duration(this.duration)
    .delay(this.delay)
    .attr('d', function(d) {
      var o = {x: source.x, y: source.y}
      return diagonal(o, o)
    })
    .remove();

    // Store the old positions for transition.
    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  // Creates a curved (diagonal) path from parent to the child nodes
  function diagonal(s, d) {

    path = `M ${s.y} ${s.x}
    C ${(s.y + d.y) / 2} ${s.x},
    ${(s.y + d.y) / 2} ${d.x},
    ${d.y} ${d.x}`

    return path;
  }

  // Toggle children on click.
  function click(d) {
    console.log(d.data.name, d.data.address, d);
    if(d._children) {
      if(!d.children) d.children = d._children;
      else {
        for(child in d._children) {
          d.children.push(d._children[child]);
        }
      }
      d.children.sort(function(a, b) { return a.data.address.slice(a.data.address.length-3,a.data.address.length) > b.data.address.slice(b.data.address.length-3,b.data.address.length) ? 1 : -1 });
      d._children = null;
    } else if(d.children) {
      d._children = d.children;
      d.children = null;
    }
    trees[d.data.address.slice(0,1)].update(d);
  }

	function dimAll(d) {
		svgInit.selectAll('g.root').style('opacity', 0.2)
		svgInit.select('g.root.' + d.data.address.slice(0,1)).style('opacity', 1)
	}

	function unDimAll(d) {
		svgInit.selectAll('g.root').style('opacity', 1);
	}

}
