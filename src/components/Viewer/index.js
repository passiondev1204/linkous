import React from "react";
import * as d3 from "d3";
import { Wrapper } from "../Wrapper";
import { makeStyles, Popover } from "@material-ui/core";
// import crown from "../../assets/crown-solid.svg";

const useStyles = makeStyles(theme => ({
  popover: {
    pointerEvents: "none",
    marginTop: theme.spacing(1),
    fontSize: 12
  },
  paper: {
    padding: theme.spacing(1)
  },
  titleSection: {
    fontWeight: 500,
    marginRight: theme.spacing(1)
  },
  descSection: {
    "& span": {
      whiteSpace: "nowrap"
    }
  }
}));

// const zoom = d3.zoom();

export const Viewer = ({ data, width, height, config }) => {
  const classes = useStyles();
  const svgRef = React.useRef();
  const tooltipContentRef = React.useRef();
  const timeoutRef = React.useRef();
  const [tooltipAnchorEl, setTooltipAnchorEl] = React.useState(null);
  

  // React.useEffect(() => {
  //   d3.select(".graph").call(zoom.transform, `translate(${width / 2}, ${height / 2})scale(1)`);
  //   // d3.select(".graph")
  //   //   .attr("transform", `translate(${width / 2}, ${height / 2})`);
  //   d3.select(svgRef.current).call(
  //     zoom.on("zoom", function() {
  //       d3.select(".graph").attr("transform", d3.event.transform);
  //     })
  //   );
  // }, []);

  React.useEffect(() => {
    const getCenter = (node, index, lcInfo) => {
      const angle =
        (index / data.nodes.filter(e => e.Level === node.Level).length) *
        Math.PI;
      return {
        cx: lcInfo.distance * Math.cos(angle * 2),
        cy: lcInfo.distance * Math.sin(angle * 2)
      };
    };

    data.links = data.links
      .map(link => ({
        ...link,
        source: data.nodes.find(({ id }) => id === link.node1),
        target: data.nodes.find(({ id }) => id === link.node2)
      }))
      .filter(link => link.source || link.target);

    const graph = d3
      .select(".graph")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);
    graph.selectAll("*").remove();

    const circleWrapper = graph.append("g").attr("class", "circles-wrapper");
    const nodesWrapper = graph.append("g").attr("class", "nodes-wrapper");
    const linksWrapper = graph.append("g").attr("class", "links-wrapper");

    let levelCircleInfo = [];
    circleWrapper
      .selectAll("circle")
      .data(Object.values(config.levelCircles))
      .enter()
      .append("circle")
      .attr("r", (d, i) => {
        const nodesOfLevel = data.nodes.filter(n => n.Level === i).length;
        const radius =
          i === 0
            ? 0
            : levelCircleInfo[i - 1].radius +
              (nodesOfLevel * config.baseRadius) / (i + 1);
        const distance =
          i === 0
            ? 0
            : levelCircleInfo[i - 1].radius +
              (radius - levelCircleInfo[i - 1].radius) * 0.6;
        levelCircleInfo.push({ radius, distance });
        return radius;
      })
      .attr("fill", d => d.fill)
      .attr("stroke", d => d.stroke)
      .attr("stroke-width", config.thickness)
      .style("opacity", 0.5)
      .lower();

    for (
      let level = 0;
      level < Object.keys(config.levelCircles).length;
      level++
    ) {
      const nodes = nodesWrapper
        .selectAll(".node" + level)
        .data(data.nodes.filter(d => d.Level === level))
        .enter()
        .append("g");

      nodes
        .append("circle")
        // .attr("class", d => `node node-circle-${d.id}`)
        .attr("fill", d => config.levelCircles["Level" + d.Level].nodeColor)
        .attr("stroke-width", config.thickness * 2)
        .attr("stroke", d => config.levelCircles["Level" + d.Level].nodeStroke)
        .style("cursor", "pointer")
        .style("opacity", 0)
        .on("mouseover", nodeMouseOver)
        .on("mouseout", nodeMouseOut)
        .transition()
        .duration(config.duration)
        .style("opacity", 1)
        .attr("r", config.nodeSize)
        .attr(
          "cx",
          (d, i) => (d.cx = getCenter(d, i, levelCircleInfo[level]).cx)
        )
        .attr(
          "cy",
          (d, i) => (d.cy = getCenter(d, i, levelCircleInfo[level]).cy)
        );

      nodes
        .append("text")
        .attr("text-anchor", "middle")
        .style("opacity", 0)
        .style("font-size", 11)
        .style("fill", config.nodeTextColor)
        .style("pointer-events", "none")
        .raise()
        .transition()
        .duration(config.duration)
        .style("opacity", 1)
        .attr("x", d => d.cx)
        .attr("y", d => d.cy - config.nodeSize * 1.5)
        .text(d => d.name);
    }

    linksWrapper
      .selectAll(".link")
      .data(data.links)
      .enter()
      .append("path")
      .attr("class", d => `link link-${d.source.id}-${d.target.id}`)
      .attr("d", `M0 0L0 0`)
      .transition()
      .duration(config.duration)
      .style("pointer-events", "none")
      .attr(
        "d",
        d => `M${d.source.cx} ${d.source.cy}L${d.target.cx} ${d.target.cy}`
      )
      .style("stroke", config.linkColor)
      .attr("stroke-width", config.thickness * 0.5);

    nodesWrapper.raise();

    function nodeMouseOver(d) {
      clearTimeout(timeoutRef.current);
      tooltipContentRef.current = d;
      setTooltipAnchorEl(d3.event.currentTarget);
      timeoutRef.current = setTimeout(() => {
        setTooltipAnchorEl(null);
      }, 2000);

      d3.select(this)
        .style("stroke", config.highlightColor)
        .attr("stroke-width", config.thickness);
      data.links
        .filter(link => link.node1 === d.id || link.node2 === d.id)
        .forEach(link => {
          linksWrapper
            .append("path")
            .attr("class", "effect-rect")
            .attr(
              "d",
              `M${link.source.cx} ${link.source.cy}L${link.source.cx} ${link.source.cy}`
            )
            .style("stroke", config.highlightColor)
            .style("stroke-width", config.thickness)
            .transition()
            .duration(config.duration)
            .attr(
              "d",
              `M${link.source.cx} ${link.source.cy}L${link.target.cx} ${link.target.cy}`
            );
        });
    }
    function nodeMouseOut(d) {
      setTooltipAnchorEl(null);
      d3.select(this)
        .style("stroke", config.levelCircles["Level" + d.Level].nodeStroke)
        .attr("stroke-width", config.thickness * 2);
      linksWrapper.selectAll(".effect-rect").remove();
    }
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [data, config, width, height]);
  return (
    <>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ backgroundColor: config.backgroundColor }}
      >
        <g className="graph" />
      </svg>
      <Popover
        id="tooltip-popover"
        className={classes.popover}
        classes={{
          paper: classes.paper
        }}
        open={Boolean(tooltipAnchorEl)}
        anchorEl={tooltipAnchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left"
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left"
        }}
        onClose={() => setTooltipAnchorEl(null)}
        disableRestoreFocus
      >
        {tooltipContentRef.current && (
          <Wrapper height="auto">
            <Wrapper
              height="auto"
              direction="column"
              className={classes.titleSection}
            >
              <span>Name</span>
              <span>IP</span>
              <span>Mask</span>
              <span>RS</span>
              <span>RCE</span>
              <span>LPE</span>
              <span>Config</span>
            </Wrapper>
            <Wrapper
              height="auto"
              direction="column"
              className={classes.descSection}
            >
              <span>{tooltipContentRef.current.name}</span>
              <span>{tooltipContentRef.current.IP}</span>
              <span>{tooltipContentRef.current.Mask}</span>
              <span>{tooltipContentRef.current.RS}</span>
              <span>{tooltipContentRef.current.Conditions[0].RCE}</span>
              <span>{tooltipContentRef.current.Conditions[0].LPE}</span>
              <span>{tooltipContentRef.current.Conditions[0].Config}</span>
            </Wrapper>
          </Wrapper>
        )}
      </Popover>
    </>
  );
};
