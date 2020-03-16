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

const zoom = d3.zoom();
const filterPath = (links, direction, idx) => {
  return direction === 0
    ? links.filter(link => link.source.id === idx)
    : links.filter(link => link.target.id === idx);
};

export const Viewer = ({ data, width, height, config }) => {
  const classes = useStyles();
  const svgRef = React.useRef();
  const tooltipContentRef = React.useRef();
  const [tooltipAnchorEl, setTooltipAnchorEl] = React.useState(null);

  React.useEffect(() => {
    d3.select(svgRef.current).call(
      zoom.on("zoom", function() {
        d3.select(".graph").attr("transform", d3.event.transform);
      })
    );
  }, []);

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

    const cx = width / 2,
      cy = height / 2;

    data.links = data.links.map(link => {
      let source = data.nodes.find(({ id }) => id === link.node1);
      let target = data.nodes.find(({ id }) => id === link.node2);
      let tmpNode = null;
      if (source.Level < target.Level) {
        tmpNode = source;
        source = target;
        target = tmpNode;
      }
      return {
        ...link,
        source: source,
        target: target
      };
    });

    let pathArr = [];

    for (let i = config.levelCounts - 1; i > 0; i--) {
      let currentLinks = data.links.filter(
        link =>
          (link.source.Level === i && link.target.Level === i - 1) ||
          (link.target.Level === i && link.source.Level === i - 1)
      );
      pathArr.push(currentLinks);
    }

    console.log(pathArr, "pathArr");
    const graph = d3.select(".graph");
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
      .attr("cx", cx)
      .attr("cy", cy)
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
        .attr("cx", cx)
        .attr("cy", cy)
        .on("mouseover", nodeMouseOver)
        .on("mouseout", nodeMouseOut)
        .transition()
        .duration(config.duration)
        .style("opacity", 1)
        .attr("r", d => {
          const links_count = data.links.filter(
            link => d.id === link.node1 || d.id === link.node2
          ).length;
          d.r = config.nodeSize + links_count * config.nodeSizeStep;
          return d.r;
        })
        .attr(
          "cx",
          (d, i) => (d.cx = cx + getCenter(d, i, levelCircleInfo[level]).cx)
        )
        .attr(
          "cy",
          (d, i) => (d.cy = cy + getCenter(d, i, levelCircleInfo[level]).cy)
        );

      nodes
        .append("text")
        .attr("text-anchor", "middle")
        .style("opacity", 0)
        .style("font-size", 11)
        .style("fill", config.nodeTextColor)
        .style("pointer-events", "none")
        .attr("x", cx)
        .attr("y", cy)
        .raise()
        .transition()
        .duration(config.duration)
        .style("opacity", 1)
        .attr("x", d => d.cx)
        .attr("y", d => d.cy - d.r - 5)
        .text(d => d.name);
    }

    linksWrapper
      .selectAll(".link")
      .data(data.links)
      .enter()
      .append("path")
      .attr("class", d => `link link-${d.source.id}-${d.target.id}`)
      .attr("d", `M${cx} ${cy}L${cx} ${cy}`)
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
      tooltipContentRef.current = d;
      setTooltipAnchorEl(d3.event.currentTarget);

      let filteredPathArr = [[], [], []];
      if (d.Level === 2) {
        filteredPathArr[0] = filterPath(pathArr[0], 1, d.id);
        filteredPathArr[1] = filterPath(pathArr[1], 0, d.id);
        for (let i = 0; i < filteredPathArr[1].length; i++)
          filteredPathArr[2] = [
            ...filteredPathArr[2],
            ...filterPath(pathArr[2], 0, filteredPathArr[1][i].target.id)
          ];
      }
      if (d.Level === 3) {
        filteredPathArr[0] = filterPath(pathArr[0], 0, d.id);
        for (let i = 0; i < filteredPathArr[0].length; i++)
          filteredPathArr[1] = [
            ...filteredPathArr[1],
            ...filterPath(pathArr[1], 0, filteredPathArr[0][i].target.id)
          ];
        for (let i = 0; i < filteredPathArr[1].length; i++)
          filteredPathArr[2] = [
            ...filteredPathArr[2],
            ...filterPath(pathArr[2], 0, filteredPathArr[1][i].target.id)
          ];
      }
      if (d.Level === 1) {
        filteredPathArr[2] = filterPath(pathArr[2], 0, d.id);
        for (let i = 0; i < filteredPathArr[2].length; i++)
          filteredPathArr[1] = [
            ...filteredPathArr[1],
            ...filterPath(pathArr[1], 1, filteredPathArr[2][i].source.id)
          ];
        for (let i = 0; i < filteredPathArr[1].length; i++)
          filteredPathArr[0] = [
            ...filteredPathArr[0],
            ...filterPath(pathArr[0], 1, filteredPathArr[1][i].source.id)
          ];
      }
      filteredPathArr[0] = [...new Set(filteredPathArr[0])];
      filteredPathArr[1] = [...new Set(filteredPathArr[1])];
      filteredPathArr[2] = [...new Set(filteredPathArr[2])];
      console.log(filteredPathArr, 'paths')
      d3.select(this)
        .style("stroke", config.highlightColor)
        .attr("stroke-width", config.thickness);
      data.links
        .filter(link => link.node1 === d.id || link.node2 === d.id)
        .forEach(link => {
          linksWrapper
            .select(`.link-${link.node1}-${link.node2}`)
            .style("stroke", config.linkHighlightColor)
            .attr("stroke-width", config.thickness * 3)
            .raise();
        });

      linksWrapper
        .selectAll(".level3-paths")
        .data(filteredPathArr[0])
        .enter()
        .append("path")
        .attr("class", "effect-line level3-paths")
        .style("stroke", config.linkEffectColor)
        .style("stroke-width", config.thickness)
        .attr(
          "d",
          d => `M${d.source.cx} ${d.source.cy}L ${d.source.cx} ${d.source.cy}`
        )
        .transition().duration(config.duration)
        .attr(
          "d",
          d => `M${d.source.cx} ${d.source.cy}L ${d.target.cx} ${d.target.cy}`
        )

      linksWrapper
        .selectAll(".level2-paths")
        .data(filteredPathArr[1])
        .enter()
        .append("path")
        .attr("class", "effect-line level2-paths")
        .style("stroke", config.linkEffectColor)
        .style("stroke-width", config.thickness)
        .attr(
          "d",
          d => `M${d.source.cx} ${d.source.cy}L ${d.source.cx} ${d.source.cy}`
        )
        .transition().delay(config.duration).duration(config.duration * 2)
        .attr(
          "d",
          d => `M${d.source.cx} ${d.source.cy}L ${d.target.cx} ${d.target.cy}`
        );
      linksWrapper
        .selectAll(".level1-paths")
        .data(filteredPathArr[2])
        .enter()
        .append("path")
        .attr("class", "effect-line level1-paths")
        .style("stroke", config.linkEffectColor)
        .style("stroke-width", config.thickness)
        .attr(
          "d",
          d => `M${d.source.cx} ${d.source.cy}L ${d.source.cx} ${d.source.cy}`
        )
        .transition().delay(config.duration * 2).duration(config.duration * 2)
        .attr(
          "d",
          d => `M${d.source.cx} ${d.source.cy}L ${d.target.cx} ${d.target.cy}`
        );
    }
    function nodeMouseOut(d) {
      setTooltipAnchorEl(null);
      d3.select(this)
        .style("stroke", config.levelCircles["Level" + d.Level].nodeStroke)
        .attr("stroke-width", config.thickness * 2);
      linksWrapper.selectAll(".effect-line").remove();
      data.links
        .filter(link => link.node1 === d.id || link.node2 === d.id)
        .forEach(link => {
          linksWrapper
            .select(`.link-${link.node1}-${link.node2}`)
            .style("stroke", config.linkColor)
            .attr("stroke-width", config.thickness * 0.5)
            .lower();
        });
    }
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
