var width = 2000,
    height = 1000,
    active = d3.select(null);

var projection = d3.geoMercator()
.scale(1200).center([90.195396, 45.861660]);

var path = d3.geoPath() // updated for d3 v4
    .projection(projection);

// var zoom = d3.zoom()
//     .scaleExtent([1, 8])
//     .on("zoom", zoomed);

var svg = d3.select("#canvas").append("svg")
    .attr("width", width)
    .attr("height", height)
    // .on("click", stopped, true);

svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    // .on("click", reset);

var g = svg.append("g");

// svg
//     .call(zoom); // delete this line to disable free zooming
//     // .call(zoom.event); // not in d3 v4

d3.json("data/world.json")
.then(function(world) {
    g.selectAll("path")
        .data(topojson.feature(world,world.objects.countries).features)
      .enter().append("path")
        .attr("d", path)
        .attr("class", "feature")
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut);
})

Promise.all([
  d3.csv("data/time_series_19-covid-Confirmed.csv"),
  d3.csv("data/time_series_19-covid-Deaths.csv"),
  d3.csv("data/time_series_19-covid-Recovered.csv"),
]).then((responseData) => {
  const data = {
    confirmed: responseData[0],
    deaths: responseData[1],
    recovered: responseData[2],
  }
  const china = {data:[],meta:[]};

  Object.entries(data).forEach(function(dataset, i) {
    let highest = 0;
    let count = 0;
      Object.values(dataset[1]).forEach(function(value) {
        if(value['Country/Region'] == 'China'){
          const total = countTotal(value);
          count += total;
          if(total > highest){
            highest = total
          }
          if(typeof china['data'][value['Province/State']] === 'object'){
            china['data'][value['Province/State']][dataset[0]] = total;
            china['data'][value['Province/State']]['location'] = [value['Long'],value['Lat']];
          } else{
            china['data'][value['Province/State']] = {};
            china['data'][value['Province/State']][dataset[0]] = total;
            china['data'][value['Province/State']]['location'] = [value['Long'],value['Lat']];
          }
        }
      });

      // console.log(total);
      china['meta'][dataset[0]] = count;
  });
  const color = {
    red:'rgba(214, 52, 72)',
    green:'rgb(140, 187, 81)',
    orange:'RGB(255, 172, 65)',
  };
  svg.selectAll('recovered')
  .data(d3.entries(china.data)).enter()
  .append('circle')
  .attr('class', 'recovered')
  .attr('cx', function(d){return projection(d.value.location)[0];})
  .attr('cy', function(d){return projection(d.value.location)[1];})
  .attr('r', function(d){
    const scale = d3.scaleLinear()
    .domain([0, china.meta.recovered])
    .range([1,10]);

    const recoveredScale = scale(d.value.recovered);
    const confirmedScale = scale(d.value.confirmed);
    const deathScale = scale(d.value.deaths);

    return recoveredScale + confirmedScale + deathScale;
  })
  .attr('fill', 'RGB( 140, 187, 81)')
  .style('pointer-events', 'none');

  svg.selectAll('confirmed')
  .data(d3.entries(china.data)).enter()
  .append('circle')
  .attr('class', 'confirmed')
  .attr('cx', function(d){return projection(d.value.location)[0];})
  .attr('cy', function(d){return projection(d.value.location)[1];})
  .attr('r', function(d){
    const scale = d3.scaleLinear()
    .domain([0, china.meta.confirmed])
    .range([1,10]);

    const recoveredScale = scale(d.value.recovered);
    const confirmedScale = scale(d.value.confirmed);
    const deathScale = scale(d.value.deaths);

    return confirmedScale + deathScale;
  })
  .attr('fill', 'RGB( 255, 172, 65)')
  .style('pointer-events', 'none');

  svg.selectAll('deaths')
  .data(d3.entries(china.data)).enter()
  .append('circle')
  .attr('class', 'deaths')
  .attr('cx', function(d){return projection(d.value.location)[0];})
  .attr('cy', function(d){return projection(d.value.location)[1];})
  .attr('r', function(d){
    const scale = d3.scaleLinear()
    .domain([0, china.meta.deaths])
    .range([1,10]);

    const recoveredScale = scale(d.value.recovered);
    const confirmedScale = scale(d.value.confirmed);
    const deathScale = scale(d.value.deaths);

    return deathScale;
  })
  .attr('fill', 'RGB( 214, 52, 72)')
  .style('pointer-events', 'none');

}); //promise.all.then()

function clicked(d) {
  if (active.node() === this) return reset();
  active.classed("active", false);
  active = d3.select(this).classed("active", true);

  var bounds = path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height))),
      translate = [width / 2 - scale * x, height / 2 - scale * y];

  svg.transition()
      .duration(750)
      // .call(zoom.translate(translate).scale(scale).event); // not in d3 v4
      // .call( zoom.transform, d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale) ); // updated for d3 v4
}

function reset() {
  active.classed("active", false);
  active = d3.select(null);

  svg.transition()
      .duration(750)
      // .call( zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1) ); // not in d3 v4
      .call( zoom.transform, d3.zoomIdentity ); // updated for d3 v4
}

function zoomed() {
  g.style("stroke-width", 1.5 / d3.event.transform.k + "px");
  // g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")"); // not in d3 v4
  g.attr("transform", d3.event.transform); // updated for d3 v4
}

function handleMouseOver() {
  d3.select(this).style('fill', 'purple');
}

function handleMouseOut() {
  d3.select(this).style('fill', '#ccc');
}

function stopped() {
  if (d3.event.defaultPrevented) d3.event.stopPropagation();
}

function countTotal(data){
  let total = 0;
  Object.entries(data).forEach(function(entry) {
    if(entry[0] != 'Province/State' && entry[0] != 'Country/Region' && entry[0] != 'Lat' && entry[0] != 'Long'){
      total += parseInt(entry[1]);
    }
  });
  return total;
}

function drawCircles(data, fill, nodeClass, range){
  svg.selectAll(nodeClass)
  .data(data).enter()
  .append("circle")
  .attr('class', nodeClass)
  .attr('cx', function(d){return projection([d.Long,d.Lat])[0];})
  .attr('cy', function(d){return projection([d.Long,d.Lat])[1];})
  .attr('r', function(d){
    const scale = d3.scaleLinear()
    .domain([0, data.highest.amount])
    .range(range);

    return scale(d.total);
  })
  // .attr('fill', fill)
  .attr('stroke', fill)
  .attr('stroke-wheight', function(d){
    const scale = d3.scaleLinear()
    .domain([0, data.highest.amount])
    .range(range);

    return scale(d.total);
  })
  .style('pointer-events', 'none');
}
