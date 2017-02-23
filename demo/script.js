var treeData = [
  {
    "name": "Digestive System",
    "definition": "Pathological processes of the PANCREAS.",
    "children": [
      {
        "name": "Pancreatic Cancer",
        "definition": "Tumors or cancer of the PANCREAS. Depending on the types of ISLET CELLS present in the tumors, various hormones can be secreted: GLUCAGON from PANCREATIC ALPHA CELLS; INSULIN from PANCREATIC BETA CELLS; and SOMATOSTATIN from the SOMATOSTATIN-SECRETING CELLS. Most are malignant except the insulin-producing tumors (INSULINOMA).",
        "children": [
          {
            "name": "Adenoma, Islet Cell",
            "definition": "A benign tumor of the pancreatic ISLET CELLS. Usually it involves the INSULIN-producing PANCREATIC BETA CELLS, as in INSULINOMA, resulting in HYPERINSULINISM."
          },
          {
            "name": "Carcinoma, Islet Cell",
            "definition": "A primary malignant neoplasm of the pancreatic ISLET CELLS. Usually it involves the non-INSULIN-producing cell types, the PANCREATIC ALPHA CELLS and the pancreatic delta cells (SOMATOSTATIN-SECRETING CELLS) in GLUCAGONOMA and SOMATOSTATINOMA, respectively."
          },
          {
            "name": "Carcinoma, Pancreatic Ductal",
            "definition": "Carcinoma that arises from the PANCREATIC DUCTS. It accounts for the majority of cancers derived from the PANCREAS."
          }
        ]
      }
    ]
  }
];


// ************** Generate the tree diagram  *****************
var margin = {top: 20, right: 120, bottom: 20, left: 120},
  width = 960 - margin.right - margin.left,
  height = 500 - margin.top - margin.bottom;

// Define the div for the tooltip
var div = d3.select("body").append("div") 
  .attr("class", "tooltip")       
  .style("opacity", 0);

  
var i = 0,
  duration = 750,
  root;

var tree = d3.layout.tree()
  .size([height, width]);

var diagonal = d3.svg.diagonal()
  .projection(function(d) { return [d.x, d.y]; });

var svg = d3.select("body").append("svg")
  .attr("width", width + margin.right + margin.left)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

root = treeData[0];
root.x0 = height / 2;
root.y0 = 0;
  
update(root);

d3.select(self.frameElement).style("height", "500px");

function update(source) {
  // Compute the new tree layout.
  var nodes = tree.nodes(root).reverse(),
    links = tree.links(nodes);

  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * 180; });

  // Update the nodes…
  var node = svg.selectAll("g.node")
    .data(nodes, function(d) { return d.id || (d.id = ++i); });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("g")
    .attr("class", "node")
    .attr("transform", function(d) { return "translate(" + source.x0 + "," + source.y0 + ")"; })
    .on("click", click)
    .on("mouseover", function(d) {    
      div.transition()
          .delay(1000)  
          .duration(500)    
          .style("opacity", .9);    
      div .html(d.definition)  
          .style("left", (d3.event.pageX) + "px")   
          .style("top", (d3.event.pageY - 28) + "px");  
      })          
    .on("mouseout", function(d) {   
      div.transition()    
          .duration(500)    
          .style("opacity", 0);
      }); 

  nodeEnter.append("circle")
    .attr("r", 1e-6)
    .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  nodeEnter.append("text")
    .attr("x", function(d) { return d.children || d._children ? -13 : 13; })
    .attr("dy", ".35em")
    .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
    .text(function(d) { return d.name; })
    .style("fill-opacity", 1e-6);

  // Transition nodes to their new position.
  var nodeUpdate = node.transition()
    .duration(duration)
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

  nodeUpdate.select("circle")
    .attr("r", 10)
    .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  nodeUpdate.select("text")
    .style("fill-opacity", 1);

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
    .duration(duration)
    .attr("transform", function(d) { return "translate(" + source.x + "," + source.y+ ")"; })
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
  if (d.children) {
  d._children = d.children;
  d.children = null;
  } else {
  d.children = d._children;
  d._children = null;
  }
  update(d);
}