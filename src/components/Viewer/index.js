import React from "react";
import * as d3 from "d3";
import { Wrapper } from "../Wrapper";
import { makeStyles, Popper, Fade, Paper, Typography } from "@material-ui/core";
import { ToggleButton, ToggleButtonGroup } from "@material-ui/lab";
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import ImageIcon from "@material-ui/icons/Image";

const useStyles = makeStyles(theme => ({
  paper: {
    padding: theme.spacing(1),
    marginTop: theme.spacing(1),
    fontSize: 12
  },
  titleSection: {
    fontWeight: 500,
    marginRight: theme.spacing(1)
  },
  descSection: {
    "& span": {
      whiteSpace: "nowrap"
    }
  },
  toggleContainer: {
    margin: theme.spacing(2, 0),
    position: "absolute"
  },
  ringInfo: {
    padding: theme.spacing(1),
    position: 'absolute',
    right: theme.spacing(2),
    bottom: theme.spacing(2)
  },
  svgContainer: {
    position: 'absolute'
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
  const timeoutRef = React.useRef();
  const tooltipContentRef = React.useRef();
  const [tooltipAnchorEl, setTooltipAnchorEl] = React.useState(null);
  const [tooltipOpen, setTooltipOpen] = React.useState(false);
  const [showType, setShowType] = React.useState("circle");

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
      if (showType === "circle") {
        nodes
          .append("circle")
          .attr("fill", d => config.levelCircles["Level" + d.Level].nodeColor)
          .attr("stroke-width", config.thickness * 2)
          .attr(
            "stroke",
            d => config.levelCircles["Level" + d.Level].nodeStroke
          )
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
      } else {
        nodes
          .append("svg:image")
          .attr("color", d => config.levelCircles["Level" + d.Level].nodeColor)
          .attr("x", cx)
          .attr("y", cy)
          .style("cursor", "pointer")
          .on("mouseover", nodeMouseOver)
          .on("mouseout", nodeMouseOut)
          .style("opacity", 0)
          .attr("xlink:href", d => {
            let iconName = d.Software[0].Icon || 'ei-windows';
            iconName = iconName.replace('ei-', '');
            return require(`../../assets/icons/svg/${iconName}.svg`);
          })
          .transition()
          .duration(config.duration)
          .style("opacity", 1)
          .attr("x", (d, i) => {
            d.cx = cx + getCenter(d, i, levelCircleInfo[level]).cx;
            return d.cx - 20;
          })
          .attr("y", (d, i) => {
            d.cy = cy + getCenter(d, i, levelCircleInfo[level]).cy;
            return d.cy - 20;
          })
          .attr("width", 40)
          .attr("height", 40);
      }

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
      clearTimeout(timeoutRef.current);
      setTooltipAnchorEl(d3.event.currentTarget);
      setTooltipOpen(true);

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
      // console.log(filteredPathArr, "paths");
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

      filteredPathArr.forEach((fpaths, i) => {
        linksWrapper
          .selectAll(`.level${i}-paths`)
          .data(fpaths)
          .enter()
          .append("path")
          .attr("class", `effect-line level${i}-paths`)
          .style("stroke", config.linkEffectColor)
          .style("stroke-width", config.thickness)
          .attr(
            "d",
            d => `M${d.source.cx} ${d.source.cy}L ${d.source.cx} ${d.source.cy}`
          )
          .transition()
          .delay(config.duration * i)
          .duration(config.duration)
          .attr(
            "d",
            d => `M${d.source.cx} ${d.source.cy}L ${d.target.cx} ${d.target.cy}`
          );
      });
    }
    function nodeMouseOut(d) {
      timeoutRef.current = setTimeout(() => {
        setTooltipOpen(false);
        setTooltipAnchorEl(null);
      }, config.duration);
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
  }, [data, config, width, height, showType]);
  return (
    <>
      <div className={classes.svgContainer}>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          style={{ backgroundColor: config.backgroundColor }}
        >
          <g className="graph" />
        </svg>
        <Paper className={classes.ringInfo}>
          <Typography>Ring 1: {data.nodes.filter(d => d.Level === 1).length}</Typography>
          <Typography>Ring 2: {data.nodes.filter(d => d.Level === 2).length}</Typography>
          <Typography>Ring 3: {data.nodes.filter(d => d.Level === 3).length}</Typography>
        </Paper>
      </div>
      <div className={classes.toggleContainer}>
        <ToggleButtonGroup
          value={showType}
          exclusive
          onChange={(evt, val) =>setShowType(val)}
        >
          <ToggleButton value="circle">
            <FiberManualRecordIcon />
          </ToggleButton>
          <ToggleButton value="icon">
            <ImageIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
      <Popper
        open={tooltipOpen}
        anchorEl={tooltipAnchorEl}
        placement={"bottom-start"}
        onMouseOver={() => {
          clearTimeout(timeoutRef.current);
        }}
        onMouseOut={() => {
          timeoutRef.current = setTimeout(() => {
            setTooltipOpen(false);
            setTooltipAnchorEl(null);
          }, config.duration);
        }}
        transition
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps}>
            <Paper className={classes.paper}>
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
                    <span>
                      {tooltipContentRef.current.Conditions[0].Config}
                    </span>
                  </Wrapper>
                </Wrapper>
              )}
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  );
};
