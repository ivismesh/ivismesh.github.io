// meshtree.js
var meshTree; // key: tnode, value: {name: desc., parent: tnode, children: [tnode]}
var descNodes; // key: desc., value: list of nodes
var trees = {};

// Svg dimensions and margins
var margin = {top: 20, right: 20, bottom: 20, left: 60},
width = 1000 - margin.right - margin.left,
height = 580 - margin.top - margin.bottom;

var svgInit = d3.select("body").append("svg")
.attr("width", width + margin.right + margin.left)
.attr("height", height + margin.top + margin.bottom);

// data load
$.getJSON('./data/MeSHTree.json', function(data) {
  // TODO ? load indicator that exits in dataReady()
  meshTree = data;
  $.getJSON('./data/descNodes.json', function(data2) {
    descNodes = data2;
    dataReady();
  });
});

/********************* ASYNC WITH DATALOAD **********************/

/******************* END ASYNC WITH DATALOAD *********************/

function dataReady() {
  console.log(meshTree);

  // input form button
  $("#searchButton").click(function(e) {
    e.preventDefault();
    search($("#searchText").val());
  });
  // input form
  $("#searchForm").bind('keydown', e => enterKey(e));
  function enterKey(e) {
    if(e.keyCode == 13) {
      e.preventDefault();
      search($("#searchText").val());
    }
  }

  // Welcome tree
  for(child in meshTree.children) {
    let treeName = meshTree.children[child].address.slice(0,1);
    trees[treeName] = new treeRoot(
      meshTree.children[child], // treeData
      null, // search term (hopefully descriptor or null)
      width-360-200*Math.cos(Math.PI/2+child*Math.PI/8),  // tree width
      height-Math.abs(200*Math.PI/2+child*Math.PI/8), // tree height
      180+100*Math.cos(Math.PI/2+child*Math.PI/8), // offset in width position
      100*Math.sin(Math.PI/2+child*Math.PI/8), // offset in height
      child*(360/meshTree.children.length));
    trees[treeName].collapse(trees[treeName].root);
    trees[treeName].update(trees[treeName].root);
  }

  // focus on search bar
  $("#searchText").focus();
}

function search(string) {
  // search result trees
  let descKey = string.replace(/ /g, '').toLowerCase();
  let growNodes = descNodes[descKey];
  let nodeResult = {};

  for(node in growNodes) {
    let tKey = growNodes[node].slice(0,1);
    if(!nodeResult[tKey]) nodeResult[tKey] = [];
    nodeResult[tKey].push(growNodes[node]);
  }

  // collapse all
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

function treeRoot(treeData, gNodes, w, h, offsetX, offsetY, rotate) {
  // append the svg object to the body of the page
  // appends a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  this.w = w;
  this.h = h;
  this.offsetX = offsetX;
  this.offsetY = offsetY;
  this.growNodes = gNodes;
  if(!h) this.h = 0;
  if(!w) this.w = 0;
  if(!offsetX) this.offsetX = 0;
  if(!offsetY) this.offsetY = 0;

  this.svg = svgInit.selectAll('g.'+treeData.address.slice(0,1)).data([1]).enter()
    .append('g').attr('class', treeData.address.slice(0,1))
    .attr('transform', 'translate(' + (margin.left+this.offsetX) + ',' + (margin.top+this.offsetY+(height-this.h)/2) + ')');

  this.i = 0, // not used
  this.duration = 500,
  this.delay = 150;

  // Assigns parent, children, height, depth
  this.root = d3.hierarchy(treeData, function(d) { return d.children; });
  this.root.x0 = this.h/2;
  this.root.y0 = 0;

  // declares a tree layout and assigns the size
  this.treemap = d3.tree().size([h, w]);

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
      for(var child in d._children) {
        this.collapse(d._children[child]);
      }
      d.children = null;
    }
  };

  // Grow to/reach addr
  this.grow = function(d, addr) {
    /*console.log("growing: " + d.data.address + ' to ' + addr);
    console.log(d);*/
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

    else if(addr.length > d.data.address.length) {
      let subPath = addr.slice(0, d.data.address.length);
      if(d._children) {
        if(!d.children) d.children = [];
        for(var child in d._children) {
          if(d._children[child].data.address == addr.slice(0, d._children[child].data.address.length)) {
            d.children.push(d._children[child]);
            delete d._children[child];
          }
        }
      }
      if(d._children == []) d._children = null;
      if(d.children) {
        for(var child in d.children) {
          if(d.children[child].data.address == addr.slice(0, d.children[child].data.address.length)) {
            this.grow(d.children[child], addr);
          }
        }
      }
    }
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
      //d.y = d.depth * 100;
      if(d.depth == 0) {
        d.x = d.x0; // root in place
      }
    });

    // color function
    let cScale = d3.scaleOrdinal()
    .domain(["A","B","C","E","D","F","G","H","I","J","K","L","M","N","V","Z"])
    .range(d3.schemeCategory10);

    // ****************** Nodes section ***************************
    // Update the nodes...
    var node = this.svg.selectAll('g.node')
    .data(nodes, function(d) { return d.data.address; });

    // Enter any new nodes at the parent's previous position.
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
    .style('stroke', d => cScale(d.data.address.slice(0,1)))
    .style("fill", function(d) {
      return d._children ? "lightsteelblue" : "#ccc";
    });

    // Add labels for the nodes
    nodeEnter.append('rect')
    .attr('transform', 'translate(-15, -15), rotate(130 15 15)')
    .attr('rx', "15")
    .style('stroke', d => cScale(d.data.address.slice(0,1)))
    .style('stroke-width', 2)
    .style('fill', 'none')
    .attr('opacity', 0.2)
    .attr('visibility', d => (d.depth == 0) ? "show" : "hidden")
    .attr("width", "30")
    .attr("height", "150")
    .text(d => d.data.name);

    // Add labels for the nodes
    nodeEnter.append('text')
    .attr('transform', 'translate(-130, 7), rotate(40, 130, 7)')
    .attr('opacity', 1)
    .attr('visibility', d => (d.depth == 0) ? "show" : "hidden")
    .text(function(d) { return d.data.name.slice(0, 17); });

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
    .attr('cursor', 'pointer');


    // Remove any exiting nodes
    var nodeExit = node.exit().transition()
    .duration(this.duration)
    .delay(this.delay)
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
    var link = this.svg.selectAll('path.link')
    .data(links, function(d) { return d.data.address; });

    // Enter any new links at the parent's previous position.
    var linkEnter = link.enter().insert('path', "g")
    .attr("class", "link")
    .attr('stroke', d => cScale(d.data.address.slice(0,1)))
    .attr('opacity', 0.3)
    .attr('d', function(d) {
      var o = {x: source.x0, y: source.y0}
      return diagonal(o, o)
    })
    /*.each(function(d) {
    if (d.data.address.length < 3)
    d3.select(this).remove();
    })*/;

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
    console.log(d.data.name + ':');
    console.log(d);
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
}
