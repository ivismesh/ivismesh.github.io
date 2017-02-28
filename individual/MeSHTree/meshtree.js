// meshtree.js

let meshTree = meshRoot(); // key: tnode, value: {name: desc., parent: tnode, children: [tnode]}
let descNodes = []; // key: desc., value: list of nodes

d3.tsv("./data/mtrees2017.tsv", function(error, data) {
  // console.log(data);
  data.forEach(function(d) {
    // descNode
    let descid = d.desc.replace(/ /g, '').toLowerCase();
    if(!descNodes[descid]) descNodes[descid] = [];
    descNodes[descid].push(d.tnode);

    // meshTree
    let path = d.tnode.split('.');

    function treePath(node, depth) {
      if(depth == path.length) {
        node.name = d.desc;
        return;
      }
      let subpath = path.slice(0, depth+1).join('.');
      if(!node.children) node["children"] = [];
      if(!node.children[subpath]) node.children[subpath] = {"name": ""};
      treePath(node.children[subpath], depth+1);
    }
    treePath(meshTree.children[path[0].charAt(0).toUpperCase()], 0);
  });
  console.log(descNodes);
  console.log(meshTree);
  let fTree = formatTree(meshTree, "root");
  console.log(fTree);
  drawSVG(fTree);
});

function formatTree(tNode, adress) {
  let retNode = {"name": tNode.name, "adress": adress};
  if(tNode.children) {
    retNode["children"] = [];
    for(child in tNode.children) {
      retNode.children.push(formatTree(tNode.children[child], child));
    }
  }
  return retNode;
}

function drawSVG(treeData) {
  // Set the dimensions and margins of the diagram
  var margin = {top: 20, right: 90, bottom: 30, left: 90},
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

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
      duration = 500,
      delay = 250,
      root;

  // declares a tree layout and assigns the size
  var treemap = d3.tree().size([height, width]);

  // Assigns parent, children, height, depth
  root = d3.hierarchy(treeData, function(d) { return d.children; });
  root.x0 = height / 2;
  root.y0 = 0;

  // Collapse after the second level
  root.children.forEach(collapse);

  update(root);

  // Collapse the node and all it's children
  function collapse(d) {
    if(d.children) {
      d._children = d.children
      d._children.forEach(collapse)
      d.children = null
    }
  }

  function update(source) {

    // Assigns the x and y position for the nodes
    var treeData = treemap(root);

    // Compute the new tree layout.
    var nodes = treeData.descendants(),
        links = treeData.descendants().slice(1);

    var rootOffset = 0;
    console.log(rootOffset);

    // Normalize for fixed-depth.
    //nodes.forEach(function(d){ d.y = d.depth * 180});

    // color function
    let cScale = d3.scaleOrdinal()
      .domain(["A","B","C","D","E","F","G","H","I","J","K","L","M","N","V","Z","root"])
      .range(d3.schemeCategory20);
    // ****************** Nodes section ***************************

    // Update the nodes...
    var node = svg.selectAll('g.node')
        .data(nodes, function(d) {return d.id || (d.id = ++i); });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", function(d) {
          return "translate(" + source.y0 + "," + source.x0 + ")";
      })
      .each(function(d) { // delete root from vis TODO: fix positions
        if (d.data.name == "MeSH")
          d3.select(this).remove();
        })
      .on('click', click);

    // Add Circle for the nodes
    nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', 1e-6)
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
      .attr('r', 10)
      .style("fill", function(d) {
          return d._children ? "lightsteelblue" : "#fff";
      })
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
        .data(links, function(d) { return d.id; });

    // Enter any new links at the parent's previous position.
    var linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr('stroke', d => cScale(d.data.adress.slice(0,1)))
        .attr('opacity', 0.5)
        .attr('d', function(d) {
          var o = {x: source.x0, y: source.y0}
          return diagonal(o, o)
        })
        .each(function(d) {
          if (d.data.adress.length < 3)
            d3.select(this).remove();
          });

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
}

function makeQuery(string) {
  var endpointUri = "https://id.nlm.nih.gov/mesh/sparql";
  var query = [
    "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>",
    "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>",
    "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>",
    "PREFIX owl: <http://www.w3.org/2002/07/owl#>",
    "PREFIX meshv: <http://id.nlm.nih.gov/mesh/vocab#>",
    "PREFIX mesh: <http://id.nlm.nih.gov/mesh/>",
    "PREFIX mesh2015: <http://id.nlm.nih.gov/mesh/2015/>",
    "PREFIX mesh2016: <http://id.nlm.nih.gov/mesh/2016/>",
    "PREFIX mesh2017: <http://id.nlm.nih.gov/mesh/2017/>",

    "SELECT ?d ?dName ?c ?cName ",
    "FROM <http://id.nlm.nih.gov/mesh>",
    "WHERE {",
    "?d a meshv:Descriptor .",
    "?d meshv:concept ?c .",
    "?d rdfs:label ?dName .",
    "?c rdfs:label ?cName",
    "FILTER(REGEX(?dName,'"+string+"','i') || REGEX(?cName,'"+string+"','i'))",
    "}",
    "ORDER BY ?d"
  ].join(" ");

  var queryUri = endpointUri+'?query='+encodeURIComponent(query)+'&format=json&inference=true';
  $.getJSON(queryUri,
    {},
    function(data) {
      console.log(data);
      let orderedRes = [];
      let binds = data.results.bindings;
      for(b in binds) {
        let id = binds[b].dName.value.replace(/ /g, '');
        if(orderedRes[id] == undefined) orderedRes[id] = {'title': binds[b].dName.value, 'cname': []};
        orderedRes[id].cname.push(binds[b].cName.value);
      }

      html = "";
      for(d in orderedRes) {
        html += "<ul style='list-style-type: none;'>";
        html += "<li><b>" + orderedRes[d].title + "</b></li>";
        for(c in orderedRes[d].cname) {
          html += "<li>" + orderedRes[d].cname[c] + "</li>";
        }
        html += "</ul>";
      }
      $('body').append(html);
    }
  );
}

function meshRoot() {
  let meshRoot = {"name": "MeSH", "children": []};
  meshRoot.children["A"] = {"name": "Anatomy", "children": []};
  meshRoot.children["B"] = {"name": "Organisms", "children": []};
  meshRoot.children["C"] = {"name": "Diseases", "children": []};
  meshRoot.children["D"] = {"name": "Chemicals and Drugs", "children": []};
  meshRoot.children["E"] = {"name": "Analytical, Diagnostic and Therapeutic Techniques, and Equipment", "children": []};
  meshRoot.children["F"] = {"name": "Psychiatry and Psychology", "children": []};
  meshRoot.children["G"] = {"name": "Phenomena and Processes", "children": []};
  meshRoot.children["H"] = {"name": "Disciplines and Occupations", "children": []};
  meshRoot.children["I"] = {"name": "Anthropology, Education, Sociology, and Social Phenomena", "children": []};
  meshRoot.children["J"] = {"name": "Technology, Industry, and Agriculture", "children": []};
  meshRoot.children["K"] = {"name": "Humanities", "children": []};
  meshRoot.children["L"] = {"name": "Information Science", "children": []};
  meshRoot.children["M"] = {"name": "Named Groups", "children": []};
  meshRoot.children["N"] = {"name": "Health Care", "children": []};
  meshRoot.children["V"] = {"name": "Publication Characteristics", "children": []};
  meshRoot.children["Z"] = {"name": "Geographicals", "children": []};
  return meshRoot;
}
