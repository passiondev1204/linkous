import React from "react";
import * as d3 from "d3";

import { Wrapper } from "../Wrapper";
import {
  makeStyles,
  Popper,
  Menu,
  MenuItem,
  Fade,
  Paper,
  Typography,
  FormControlLabel,
  Switch
} from "@material-ui/core";
import { ToggleButton, ToggleButtonGroup } from "@material-ui/lab";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import ImageIcon from "@material-ui/icons/Image";
import utils from "../../utils";
import {
  zoom,
  fisheye,
  filteredPaths,
  maxCountsOfLevel,
  getLinks,
  forwardCenterPaths,
  centeringPaths,
  reLinking,
  nodesHasRing4,
  hasRing4Nodes,
  center,
  nodeGrouping,
  linking,
  nodeReGrouping,
  nodesGroupingRing4
} from "./functions";
const useStyles = makeStyles(theme => ({
  paper: {
    padding: theme.spacing(1),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
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
    top: theme.spacing(2),
    position: "absolute",
    padding: theme.spacing(1),
    display: "flex",
    alignItems: "center"
  },
  ringInfo: {
    padding: theme.spacing(1),
    position: "absolute",
    right: theme.spacing(2),
    bottom: theme.spacing(2)
  },
  svgContainer: {
    position: "absolute",
    display: "flex",
    justifyContent: "center"
  },
  menuItem: {
    // '&:focus': {
    //   backgroundColor: theme.palette.primary.main,
    //   '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
    //     color: theme.palette.common.white,
    //   },
    // }
  },
  checkItem: {
    marginRight: theme.spacing(2)
  }
}));

export const Viewer = ({ data, width, height, config }) => {
  const classes = useStyles();
  const svgRef = React.useRef();
  const timeoutRef = React.useRef();
  const tooltipContentRef = React.useRef();
  const levelInfos = React.useRef([]);

  const [tooltipAnchorEl, setTooltipAnchorEl] = React.useState(null);
  const [tooltipOpen, setTooltipOpen] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(true);
  const [showType, setShowType] = React.useState("circle");
  const [extendedView, setExtendedView] = React.useState(true);
  const [magnifyMode, setMagnifyMode] = React.useState(false);
  const [contextPosition, setContextPosition] = React.useState({
    x: null,
    y: null
  });

  const onContextMenu = evt => {
    evt.preventDefault();
    setContextPosition({
      x: evt.clientX - 2,
      y: evt.clientY - 4
    });
  };

  React.useEffect(() => {
    const base_cx = width / 2,
      base_cy = height / 2;

    d3.select(svgRef.current).call(
      zoom.on("zoom", function() {
        d3.select(".graph").attr("transform", d3.event.transform);
      })
    );
    const graph = d3.select(".graph");
    // magnifier as circle
    graph
      .append("circle")
      .attr("class", "lens")
      .style("fill", "transparent")
      .style("stroke", "grey")
      .style("stroke-width", 3)
      .attr("cx", base_cx)
      .attr("cy", base_cy)
      .attr("r", fisheye.radius());

    const circleWrapper = graph.append("g").attr("class", "circles-wrapper");
    const nodesWrapper = graph.append("g").attr("class", "nodes-wrapper");
    const linksWrapper = graph.append("g").attr("class", "links-wrapper");

    let maxNodesOfLevel = maxCountsOfLevel(data.nodes);
    circleWrapper
      .selectAll("circle")
      .data(config.levelCircles)
      .enter()
      .append("circle")
      .attr("cx", base_cx)
      .attr("cy", base_cy)
      .attr("r", (d, i) => {
        const radius = i * maxNodesOfLevel * config.baseRadius;
        const distance =
          i > 0 ? (radius + levelInfos.current[i - 1].radius) * 0.5 : 0;
        levelInfos.current.push({ radius, distance });
        return radius;
      })
      .attr("fill", d => d.fill)
      .attr("stroke", d => d.stroke)
      .attr("stroke-width", config.thickness)
      .style("opacity", 0.5)
      .lower();

    let nodes = data.nodes,
      links = getLinks(data.nodes, data.links);

    // nodesWrapper.selectAll("g").remove();
    for (let i = 0; i < config.levelCounts - 1; i++) {
      nodeGrouping(
        nodesWrapper,
        base_cx,
        base_cy,
        levelInfos.current[i].distance,
        nodes.filter(node => node.Level === i),
        links,
        i,
        config
      );
    }
    nodesGroupingRing4(nodesWrapper, nodes, links, config, levelInfos.current);
    linking(linksWrapper, links, config);
  }, [width, height, config, data]);

  React.useEffect(() => {
    const graph = d3.select(".graph");

    let maxNodesOfLevel = maxCountsOfLevel(data.nodes);
    let ring4Level = config.levelCounts - 1;
    const base_cx = width / 2,
      base_cy = height / 2;

    let nodes = data.nodes,
      links = getLinks(data.nodes, data.links);

    const nodesWrapper = graph.select(".nodes-wrapper");
    const linksWrapper = graph.select(".links-wrapper");

    const lens = graph.select(".lens").style("opacity", magnifyMode ? 1 : 0);

    if (extendedView) {
      nodesWrapper.selectAll("*").remove();
      for (let i = 0; i < config.levelCounts - 1; i++) {
        nodeGrouping(
          nodesWrapper,
          base_cx,
          base_cy,
          levelInfos.current[i].distance,
          nodes.filter(node => node.Level === i),
          links,
          i,
          config,
          showType
        );
      }
      nodesWrapper
        .selectAll(".nodes")
        .select("circle")
        .on("click", nodeClick)
        .on("mouseover", nodeMouseOver)
        .on("mouseout", nodeMouseOut);
      nodesWrapper
        .selectAll(".nodes")
        .select("image")
        .on("click", nodeClick)
        .on("mouseover", nodeMouseOver)
        .on("mouseout", nodeMouseOut);
      nodesGroupingRing4(
        nodesWrapper,
        nodes,
        links,
        config,
        levelInfos.current,
        showType
      );
      reLinking(linksWrapper, config);
    } else {
      nodesWrapper.selectAll(`.nodes-${config.levelCounts - 1}`).remove();
      linksWrapper.selectAll(".links").each(function(d) {
        if (d.source.Level === config.levelCounts - 1) {
          d3.select(this).style("opacity", 0);
        }
      });
    }

    graph.on("mousemove", function() {
      if (!magnifyMode) return;
      const m = d3.mouse(this);
      fisheye.focus(m);
      lens.attr("cx", m[0]).attr("cy", m[1]);
      if (showType === "circle") {
        nodesWrapper
          .selectAll(".nodes")
          .each(d => {
            d.fisheye = fisheye(d);
          })
          .select("circle")
          .attr("cx", d => d.fisheye.x)
          .attr("cy", d => d.fisheye.y)
          .attr("r", d => d.r * d.fisheye.z * 0.8);
      } else {
        nodesWrapper
          .selectAll(".nodes")
          .each(d => {
            d.fisheye = fisheye(d);
          })
          .select("image")
          .attr("x", d => d.fisheye.x - d.r * d.fisheye.z * 0.8)
          .attr("y", d => d.fisheye.y - d.r * d.fisheye.z * 0.8)
          .attr("width", d => d.r * 2 * d.fisheye.z)
          .attr("height", d => d.r * 2 * d.fisheye.z);
      }
      nodesWrapper
        .selectAll(".nodes")
        .select("text")
        .attr("x", d => d.fisheye.x)
        .attr("y", d => d.fisheye.y - d.r * d.fisheye.z - 5)
        .attr("font-size", d => d.fisheye.z * d.fs)
        .style("font-size", d => d.fisheye.z * d.fs);
      linksWrapper
        .selectAll(".links")
        .attr(
          "d",
          d =>
            `M${d.source.fisheye.x} ${d.source.fisheye.y}L${d.target.fisheye.x} ${d.target.fisheye.y}`
        );
    });

    function nodeClick(d) {
      if (!d.hasRing4 || !extendedView) return;
      nodesGroupingRing4(
        nodesWrapper,
        nodes,
        links,
        config,
        levelInfos.current,
        showType,
        d
      );
      reLinking(linksWrapper, config);
    }
    function nodeMouseOver(d) {
      tooltipContentRef.current = d;
      clearTimeout(timeoutRef.current);
      setTooltipAnchorEl(d3.event.currentTarget);
      setTooltipOpen(true);

      d3.select(this)
        .style("stroke", config.highlightColor)
        .attr("stroke-width", config.thickness);

      const childNodes = links.filter(
        link =>
          link.target.id === d.id &&
          link.source.Level === config.levelCircles.length - 1
      );
      if (childNodes) {
        nodesWrapper.selectAll(".nodes").style("opacity", p =>
          childNodes
            .map(k => k.source)
            .map(e => e.id)
            .includes(p.id)
            ? config.ring4HoverOpacity
            : "auto"
        );
      }

      links
        .filter(link => link.node1 === d.id || link.node2 === d.id)
        .forEach(link => {
          linksWrapper
            .select(`.link-${link.source.id}-${link.target.id}`)
            .style("stroke", config.linkHighlightColor)
            .attr("stroke-width", config.thickness * 3)
            .style(
              "opacity",
              link.source.Level === ring4Level ? config.ring4HoverOpacity : 1
            )
            .raise();
        });
      if (magnifyMode) return;
      let filteredPathArr = centeringPaths(d, config.levelCounts, links);
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
        .style("stroke", config.levelCircles[d.Level].nodeStroke)
        .attr("stroke-width", config.thickness * 2);
      const childNodes = links.filter(
        link =>
          link.target.id === d.id &&
          link.source.Level === config.levelCircles.length - 1
      );
      if (childNodes) {
        nodesWrapper.selectAll(".nodes").style("opacity", p =>
          childNodes
            .map(k => k.source)
            .map(e => e.id)
            .includes(p.id)
            ? 0.1
            : "auto"
        );
      }
      linksWrapper.selectAll(".effect-line").remove();
      links
        .filter(link => link.node1 === d.id || link.node2 === d.id)
        .forEach(link => {
          linksWrapper
            .select(`.link-${link.source.id}-${link.target.id}`)
            .style("stroke", config.linkColor)
            .attr("stroke-width", config.thickness * 0.5)
            .style(
              "opacity",
              link.source.Level === config.levelCircles.length - 1 ? 0.1 : 1
            )
            .lower();
        });
    }
  }, [data, config, width, height, showType, extendedView, magnifyMode]);
  return (
    <>
      <div className={classes.svgContainer} onContextMenu={onContextMenu}>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          style={{ backgroundColor: config.backgroundColor }}
        >
          <g className="graph" />
        </svg>
        <Paper className={classes.toggleContainer}>
          <ToggleButtonGroup
            value={showType}
            exclusive
            onChange={(evt, val) => {
              clearTimeout(timeoutRef.current);
              setTooltipOpen(false);
              setShowType(val);
            }}
          >
            <ToggleButton value="circle">
              <FiberManualRecordIcon />
            </ToggleButton>
            <ToggleButton value="icon">
              <ImageIcon />
            </ToggleButton>
          </ToggleButtonGroup>
          <FormControlLabel
            control={
              <Switch
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
                color="primary"
              />
            }
            label={darkMode ? "Dark" : "White"}
            labelPlacement="top"
          />
          <FormControlLabel
            control={
              <Switch
                checked={extendedView}
                onChange={() => setExtendedView(!extendedView)}
                color="primary"
              />
            }
            label="ExtendedView"
            labelPlacement="top"
          />
        </Paper>
        <Paper className={classes.ringInfo}>
          <Typography>
            Ring 1: {data.nodes.filter(d => d.Level === 1).length}
          </Typography>
          <Typography>
            Ring 2: {data.nodes.filter(d => d.Level === 2).length}
          </Typography>
          <Typography>
            Ring 3: {data.nodes.filter(d => d.Level === 3).length}
          </Typography>
        </Paper>
      </div>
      {!magnifyMode && (
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
      )}
      <Menu
        keepMounted
        open={contextPosition.y !== null}
        onClose={() => setContextPosition({ x: null, y: null })}
        anchorReference="anchorPosition"
        anchorPosition={
          contextPosition.y !== null && contextPosition.x !== null
            ? { top: contextPosition.y, left: contextPosition.x }
            : undefined
        }
      >
        <MenuItem
          onClick={() => {
            setContextPosition({ x: null, y: null });
            setMagnifyMode(!magnifyMode);
          }}
          className={classes.menuItem}
        >
          {magnifyMode ? (
            <CheckBoxIcon className={classes.checkItem} />
          ) : (
            <CheckBoxOutlineBlankIcon className={classes.checkItem} />
          )}
          Magnifier
        </MenuItem>
      </Menu>
    </>
  );
};
