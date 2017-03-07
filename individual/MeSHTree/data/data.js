// data.js

let meshTree = meshRoot(); // key: tnode, value: {name: desc., address: <xxx.xxx...>, children: [tnode]}
let descNodes = {}; // key: desc., value: list of nodes

d3.tsv("./mtrees2017.tsv", function(error, data) {
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

  var files = [
    {"file": "MeSHTree.json", "data": JSON.stringify(fTree)},
    {"file": "descNodes.json", "data": JSON.stringify(descNodes)}
  ];

  makeTextFile = function (text) {
    var data = new Blob([text], {type: 'text/plain'});
    textFile = window.URL.createObjectURL(data);

    // returns a URL you can use as a href
    return textFile;
  };

  d3.select('body').selectAll('a').data(files).enter().append('a')
    .attr("href", d => makeTextFile(d.data))
    .attr("download", d => d.file)
    .html(d => d.file + '<br>');

});

function formatTree(tNode, address) {
  let retNode = {"name": tNode.name, "address": address};
  if(tNode.children) {
    retNode["children"] = [];
    for(child in tNode.children) {
      retNode.children.push(formatTree(tNode.children[child], child));
    }
  }
  return retNode;
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
