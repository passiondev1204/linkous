import React from "react";
import * as d3 from "d3";

export const Viewer = ({ data, width, height, config }) => {
  const svgRef = React.useRef();
  React.useEffect(() => {
    const cx = width / 2,
      cy = height / 2;
    d3.select(svgRef.current)
      .selectAll("*")
      .remove();

    const graph = d3
      .select(svgRef.current)
      .append("g")
      .attr("transform", `translate(${cx}, ${cy})`);
    const circleWrapper = graph.append("g").attr("class", "circles-wrapper");
    const nodesWrapper = graph.append("g").attr("class", "nodes-wrapper");
    const linksWrapper = graph.append("g").attr("class", "links-wrapper");

    circleWrapper
      .selectAll(".circle-separator")
      .data(Object.values(config.levelCircles))
      .enter()
      .append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => d.fill)
      .attr("stroke", d => d.stroke)
      .attr("stroke-width", 5)
      .lower();

    const nodes = nodesWrapper
      .selectAll(".node")
      .data(data.nodes)
      .enter()
      .append("g");
          
    nodes
      .append("circle")
      .attr("class", d => `node node-circle-${d.id}`)
      .attr("fill", "green")
      .attr("stroke-width", 4)
      .attr("stroke", "white")
      .style("cursor", "pointer")
      .attr("r", 20)
      .style("opacity", 0)
      .transition()
      .duration(config.duration)
      .style("opacity", 1)
      .attr("cx", function(d, i) {
        const angle =
          (i / data.nodes.filter(e => e.level === d.level).length) * Math.PI;
        return (
          config.levelCircles["level" + d.level].distance * Math.cos(angle * 2)
        );
      })
      .attr("cy", function(d, i) {
        const angle =
          (i / data.nodes.filter(e => e.level === d.level).length) * Math.PI;
        return (
          config.levelCircles["level" + d.level].distance * Math.sin(angle* 2)
        );
      });

    nodes
      .append("text")
      .attr("text-anchor", "middle")
      .style("opacity", 0)
      .transition()
      .duration(config.duration)
      .style("opacity", 1)
      .attr("x", function(d, i) {
        const angle =
          (i / data.nodes.filter(e => e.level === d.level).length) * Math.PI;
        return (
          config.levelCircles["level" + d.level].distance * Math.cos(angle)
        );
      })
      .attr("y", function(d, i) {
        const angle =
          (i / data.nodes.filter(e => e.level === d.level).length) * Math.PI;
        return (
          config.levelCircles["level" + d.level].distance * Math.sin(angle)
        );
      })
      .text(d => d.name);

    setTimeout(() => {
      linksWrapper
        .selectAll(".link")
        .data(data.links)
        .enter()
        .append("path")
        .attr(
          "d",
          d =>
            `M${d3.select(`.node-circle-${d.node1}`).attr("cx")} ${d3
              .select(`.node-circle-${d.node1}`)
              .attr("cy")}L${d3
              .select(`.node-circle-${d.node2}`)
              .attr("cx")} ${d3.select(`.node-circle-${d.node2}`).attr("cy")}`
        )
        .attr("stroke", "orange")
        .attr("stroke-width", 3);

      nodesWrapper.raise();
    }, config.duration);
  }, [data, config, width, height]);
  return (
    <div style={{ border: "1px solid grey", marginTop: 50 }}>
      <svg ref={svgRef} width={width} height={height} />
    </div>
  );
};
