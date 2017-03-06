
function drawTree(treeData, desc, offsetX, offsetY) {
  // append the svg object to the body of the page
  // appends a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  var descKey;
  if(desc) descKey = desc.replace(/ /g, '').toLowerCase();
  var paths = descNodes[descKey];
  if(!offsetX) offsetX = 0;
  if(!offsetY) offsetY = 0;
  var svg = svgInit.selectAll('g.'+treeData.adress.slice(0,1)).data([1]).enter()
    .append('g').attr('class', treeData.adress.slice(0,1));

  var i = 0,
  duration = 500,
  delay = 150,
  root;

  // Assigns parent, children, height, depth
  root = d3.hierarchy(treeData, function(d) { return d.children; });
  root.x0 = height/2;
  root.y0 = 0;

  // declares a tree layout and assigns the size
  var treemap = d3.tree().size([height-140, width]);

  console.log(root);

  collapse(root);
  if(descKey) {
    grow(root);
  }
  update(root);

  // Collapse the node and all it's children
  function collapse(d) {
    if(d.children) {
      d._children = d.children;
      d.children = null;
      d._children.forEach(collapse);
    }
  }

  // Grow to/reach all adresses of desc
  function grow(d) {
    // if hidden children
    let paths = descNodes[descKey];
    growHelper(d);
    function growHelper(d) {
      if(d._children) {
        if(!d.children) d["children"] = [];
        let cLength = d._children[0].data.adress.length;
        // check all d.data.adress against descNodes[desc] (paths)
        for(var addr in paths) {
          let pLength = paths[addr].length;

          if(pLength >= cLength) {
            let pAdress = paths[addr].slice(0, cLength);

            for(var child in d._children) {
              if(d._children[child].data.adress === pAdress) {
                d.children.push(d._children[child]);
                delete d._children[child];
              }
            }
          }
        }
        for(var child = 0; child < d._children.length; child++) {
          if(d._children[child] == null) {
            d._children.splice(child, child+1);
            child--;
          }
        }
        if(d._children.length == 0) d._children = null;
        if(d.children.length == 0) d.children = null;
        else d.children.forEach(growHelper);
      }
    }
  }

  function update(source) {
    console.log(source.data.name);
    var treeData = treemap(root);

    // Compute the new tree layout.
    var nodes = treeData.descendants(),
    links = treeData.descendants().slice(1);

    // Normalize for fixed-depth.
    nodes.forEach(function(d){ d.y = d.depth * 100 + offsetX});

    // color function
    let cScale = d3.scaleOrdinal()
    .domain(["A","B","C","E","D","F","G","H","I","J","K","L","M","N","V","Z"])
    .range(d3.schemeCategory10);

    // ****************** Nodes section ***************************
    // Update the nodes...
    var node = svg.attr("transform", "translate("
    + margin.left + "," + (margin.top + offsetY + 70) + ")")
    .selectAll('g.node')
    .data(nodes, function(d) { return d.data.adress; });

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
    .style('stroke', d => cScale(d.data.adress.slice(0,1)))
    .style("fill", function(d) {
      return d._children ? "lightsteelblue" : "#ccc";
    });

    // Add labels for the nodes
    /*nodeEnter.append('text')
    .attr("dy", ".35em")
    .attr("x", function(d) {
    return d.children || d._children ? -13 : 13;
    })
    .attr("text-anchor", function(d) {
    return d.children || d._children ? "end" : "start";
    })
    .text(function(d) { return d.data.name; });*/

    // UPDATE
    var nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
    .duration(duration)
    .delay(delay)
    .attr("transform", function(d) {
      return "translate(" + d.y + "," + d.x + ")";
    });

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
    .attr('r', 5)
    .style("fill", d => d._children ? cScale(d.data.adress.slice(0,1)) : "#fff")
    .style("fill-opacity", "1")
    .attr('cursor', 'pointer');


    // Remove any exiting nodes
    var nodeExit = node.exit().transition()
    .duration(duration)
    .delay(delay)
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
    .data(links, function(d) { return d.data.adress; });

    // Enter any new links at the parent's previous position.
    var linkEnter = link.enter().insert('path', "g")
    .attr("class", "link")
    .attr('stroke', d => cScale(d.data.adress.slice(0,1)))
    .attr('opacity', 0.3)
    .attr('d', function(d) {
      var o = {x: source.x0, y: source.y0}
      return diagonal(o, o)
    })
    /*.each(function(d) {
    if (d.data.adress.length < 3)
    d3.select(this).remove();
    })*/;

    // UPDATE
    var linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
    .duration(duration)
    .delay(delay)
    .attr('d', function(d){ return diagonal(d, d.parent) });

    // Remove any exiting links
    var linkExit = link.exit().transition()
    .duration(duration)
    .delay(delay)
    .attr('d', function(d) {
      var o = {x: source.x, y: source.y}
      return diagonal(o, o)
    })
    .remove();

    // Store the old positions for transition.
    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
      if(d.children) {
        //console.log(d.children);
        d.children.sort(function(a, b) { return a.data.adress.slice(a.data.adress.length-3,a.data.adress.length) > b.data.adress.slice(b.data.adress.length-3,b.data.adress.length) ? 1 : -1 })
        //console.log(d.children);
      }
    });

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
      if(d._children) {
        if(!d.children) d.children = d._children;
        else {
          for(child in d._children) {
            d.children.push(d._children[child]);
          }
        }
        d._children = null;
      } else if(d.children) {
        d._children = d.children;
        d.children = null;
      }
      update(d);
    }
  }
}
