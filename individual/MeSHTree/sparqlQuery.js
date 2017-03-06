// sparqlQuery.js

function makeQuery(desc) {
  let endpointUri = "https://id.nlm.nih.gov/mesh/sparql";
  let prefix = [
    "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>",
    "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>",
    "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>",
    "PREFIX owl: <http://www.w3.org/2002/07/owl#>",
    "PREFIX meshv: <http://id.nlm.nih.gov/mesh/vocab#>",
    "PREFIX mesh: <http://id.nlm.nih.gov/mesh/>",
    "PREFIX mesh2015: <http://id.nlm.nih.gov/mesh/2015/>",
    "PREFIX mesh2016: <http://id.nlm.nih.gov/mesh/2016/>",
    "PREFIX mesh2017: <http://id.nlm.nih.gov/mesh/2017/> "
  ].join(" ");
  var query = [
    "SELECT ?d ?dName ?c ?cName ",
    "FROM <http://id.nlm.nih.gov/mesh>",
    "WHERE {",
    "?d a meshv:Descriptor .",
    "?d meshv:concept ?c .",
    "?d rdfs:label ?dName .",
    "?c rdfs:label ?cName",
    "FILTER(REGEX(?dName,'"+desc+"','i') || REGEX(?cName,'"+desc+"','i'))",
    "}",
    "ORDER BY ?d"
  ].join(" ");

  var queryUri = endpointUri+'?query='+encodeURIComponent(prefix+query)+'&format=json&inference=true';
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
