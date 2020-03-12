import React from "react";
import * as d3 from "d3";
import crown from "../../assets/crown-solid.svg";
import "./index.css";

const getTooltipContent = item => {
  return `
    <div class="tooltip-content">
      <div class="title">
        <span>Name</span>
        <span>IP</span>
        <span>Mask</span>
        <span>RS</span>
        <span>RCE</span>
        <span>LPE</span>
        <span>Config</span>    
      </div>
      <div class="desc">
        <span>${item.name}</span>
        <span>${item.IP}</span>
        <span>${item.Mask}</span>
        <span>${item.RS}</span>
        <span>${item.Conditions[0].RCE}</span>
        <span>${item.Conditions[0].LPE}</span>
        <span>${item.Conditions[0].Config}</span>
      </div>
    </div>`;
};

export const Viewer = ({ data, width, height, config }) => {
  const svgRef = React.useRef();

  const getCenter = (node, index) => {
    const angle =
      (index / data.nodes.filter(e => e.level === node.level).length) * Math.PI;
    return {
      cx:
        config.levelCircles["level" + node.level].distance *
        Math.cos(angle * 2),
      cy:
        config.levelCircles["level" + node.level].distance * Math.sin(angle * 2)
    };
  };

  React.useEffect(() => {
    const cx = width / 2,
      cy = height / 2;
    d3.select(svgRef.current)
      .selectAll("*")
      .remove();

    d3.select(svgRef.current)
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", config.backgroundColor);

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
      .attr("r", d => d.range)
      .attr("fill", d => d.fill)
      .attr("stroke", d => d.stroke)
      .attr("stroke-width", config.thickness)
      .lower();

    const nodes = nodesWrapper
      .selectAll(".node")
      .data(data.nodes)
      .enter()
      .append("g");

    // add crown node
    nodesWrapper
      .append("image")
      .attr("xlink:href", crown)
      .style("cursor", "pointer")
      .attr("x", -config.nodeSize * 1.5)
      .attr("y", -config.nodeSize * 1.5)
      .attr("width", config.nodeSize * 3)
      .attr("height", config.nodeSize * 3)
      .on("mouseover", () => {
        const strHtmlInnter = getTooltipContent(
          data.nodes.find(({ level }) => level === 0)
        );
        const tooltip = d3
          .select(".tooltip")
          .style("display", "flex")
          .html(strHtmlInnter);
        const tooltipWidth = Math.ceil(parseFloat(tooltip.style("width")));
        tooltip
          .style("left", width / 2 - tooltipWidth / 2 + "px")
          .style("top", height / 2 + config.nodeSize * 2 + "px");
      })
      .on("mouseout", () => {
        d3.select(".tooltip").style("display", "none");
      });

    nodes
      .append("circle")
      .attr("class", d => `node node-circle-${d.id}`)
      .attr("fill", d => config.levelCircles["level" + d.level].nodeColor)
      .attr("stroke-width", config.thickness * 0.5)
      .attr("stroke", d => config.levelCircles["level" + d.level].nodeStroke)
      .on("mouseover", function(d, i) {
        const strHtmlInnter = getTooltipContent(d);
        const tooltip = d3
          .select(".tooltip")
          .style("display", "flex")
          .html(strHtmlInnter);
        const tooltipWidth = Math.ceil(parseFloat(tooltip.style("width")));
        tooltip
          .style(
            "left",
            getCenter(d, i).cx + width / 2 - tooltipWidth / 2 + "px"
          )
          .style(
            "top",
            getCenter(d, i).cy + height / 2 + config.nodeSize * 2 + "px"
          );
      })
      .on("mouseout", () => {
        d3.select(".tooltip").style("display", "none");
      })
      .style("cursor", "pointer")
      .attr("r", config.nodeSize)
      .style("opacity", 0)
      .transition()
      .duration(config.duration)
      .style("opacity", 1)
      .attr("cx", (d, i) => getCenter(d, i).cx)
      .attr("cy", (d, i) => getCenter(d, i).cy);

    // nodes
    //   .append("text")
    //   .attr("text-anchor", "middle")
    //   .style("opacity", 0)
    //   .raise()
    //   .transition()
    //   .duration(config.duration)
    //   .style("opacity", 1)
    //   .attr("x", function(d, i) {
    //     const angle =
    //       (i / data.nodes.filter(e => e.level === d.level).length) * Math.PI;
    //     return (
    //       config.levelCircles["level" + d.level].distance * Math.cos(angle * 2)
    //     );
    //   })
    //   .attr("y", function(d, i) {
    //     const angle =
    //       (i / data.nodes.filter(e => e.level === d.level).length) * Math.PI;
    //     return (
    //       config.levelCircles["level" + d.level].distance * Math.sin(angle * 2)
    //     );
    //   })
    //   .text(d => d.name);

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
        .attr("stroke", config.linkColor)
        .attr("stroke-width", config.thickness * 0.5);

      nodesWrapper.raise();
    }, config.duration);
  }, [data, config, width, height]);
  return (
    <div style={{ border: "1px solid grey", marginTop: 50}}>
      <div style={{ position: "absolute" }}>
        <svg ref={svgRef} width={width} height={height} className="viewer" />
        <div className="tooltip"></div>
      </div>
    </div>
  );
};
