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
  maxCountsOfLevel,
  addNodes,
  addNodesOfRing4,
  addLinks,
  getLinks,
  updateNodes,
  updateLinks,
  centeringPaths
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
  const openedNode = React.useRef(null);

  const [tooltipAnchorEl, setTooltipAnchorEl] = React.useState(null);
  const [tooltipOpen, setTooltipOpen] = React.useState(false);
  const [theme, setTheme] = React.useState("dark");
  const [showType, setShowType] = React.useState("circle");
  const [extendedView, setExtendedView] = React.useState(true);
  const [magnifyMode, setMagnifyMode] = React.useState(false);
  const [contextPosition, setContextPosition] = React.useState({
    x: null,
    y: null
  });

  let nodes = data.nodes,
    links = getLinks(data.nodes, data.links);

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
    graph.selectAll("*").remove();
    // magnifier as circle
    graph
      .append("circle")
      .attr("class", "lens")
      .style("fill", "transparent")
      .style("stroke", config.lensBorderColor)
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
      .data(config[theme].levelCircles)
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
      .attr("stroke-width", config.nodeThickness)
      .style("opacity", config[theme].fillOpacity)
      .lower();

    for (let i = 0; i < config.levelCounts - 1; i++) {
      addNodes(
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
    addNodesOfRing4(nodesWrapper, nodes, links, config, levelInfos.current);
    addLinks(linksWrapper, links, config);
  }, [theme]);

  React.useEffect(() => {
    const ring4Level = config.levelCounts - 1;
    const graph = d3.select(".graph");

    const nodesWrapper = graph.select(".nodes-wrapper");
    const linksWrapper = graph.select(".links-wrapper");
    
    if(openedNode.current) {
      updateNodes(
        nodesWrapper,
        nodes,
        links,
        config,
        levelInfos.current,
        showType,
        theme,
        extendedView,
        openedNode.current
      )
    } else {
      updateNodes(
        nodesWrapper,
        nodes,
        links,
        config,
        levelInfos.current,
        showType,
        theme,
        extendedView
      );
    }
    updateLinks(linksWrapper, config, theme, extendedView);
    const lens = graph.select(".lens").style("opacity", magnifyMode ? 1 : 0);
    nodesWrapper
      .selectAll(".nodes")
      .on("click", nodeClick)
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut);

    graph.on("mousemove", function() {
      if (!magnifyMode) return;
      const m = d3.mouse(this);
      fisheye.focus(m);
      lens.attr("cx", m[0]).attr("cy", m[1]);
      
        nodesWrapper
          .selectAll(".nodes")
          .each(d => {
            d.fisheye = fisheye(d);
          })
          .attr("transform", d => `translate(${d.fisheye.x}, ${d.fisheye.y})scale(${d.fisheye.z})`);
      
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
      openedNode.current = d;
      updateNodes(
        nodesWrapper,
        nodes,
        links,
        config,
        levelInfos.current,
        showType,
        theme,
        extendedView,
        d
      );
      updateLinks(linksWrapper, config, theme);
      nodesWrapper.selectAll(`.pnode-${d.id}`).style("opacity", extendedView ? config.ring4HoverOpacity : 0);
      links
        .filter(link => link.node1 === d.id || link.node2 === d.id)
        .forEach(link => {
          linksWrapper
            .select(`.link-${link.source.id}-${link.target.id}`)
            .style("stroke", config[theme].linkHighlightColor)
            .attr("stroke-width", config.lineThickness)
            .style(
              "opacity",
              link.source.Level === ring4Level ? config.ring4HoverOpacity : 1
            );
        });
    }
    function nodeMouseOver(d) {
      // tooltipContentRef.current = d;
      // clearTimeout(timeoutRef.current);
      // setTooltipAnchorEl(d3.event.currentTarget);
      // setTooltipOpen(true);

      d3.select(this)
        .select("circle")
        .style("stroke", config[theme].highlightColor)
        .attr("stroke-width", config.nodeThickness);
      
      nodesWrapper.selectAll(`.pnode-${d.id}`).style("opacity", extendedView ? config.ring4HoverOpacity : 0);
      links
        .filter(link => link.node1 === d.id || link.node2 === d.id)
        .forEach(link => {
          linksWrapper
            .select(`.link-${link.source.id}-${link.target.id}`)
            .style("stroke", config[theme].linkHighlightColor)
            .attr("stroke-width", config.lineThickness * 2)
            .style(
              "opacity",
              link.source.Level === ring4Level ? extendedView ? config.ring4HoverOpacity : 0 : 1
            );
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
          .style("stroke", config[theme].linkEffectColor)
          .style("stroke-width", config.lineThickness * 2)
          .attr(
            "d",
            d => `M${d.source.x} ${d.source.y}L ${d.source.x} ${d.source.y}`
          )
          .transition()
          .delay(config.duration * i)
          .duration(config.duration)
          .attr(
            "d",
            d => `M${d.source.x} ${d.source.y}L ${d.target.x} ${d.target.y}`
          );
      });
    }
    function nodeMouseOut(d) {
      // timeoutRef.current = setTimeout(() => {
      //   setTooltipOpen(false);
      //   setTooltipAnchorEl(null);
      // }, config.duration);
      d3.select(this)
        .select("circle")
        .style("stroke", config[theme].levelCircles[d.Level].nodeStroke)
        .attr("stroke-width", config.nodeThickness);
      nodesWrapper.selectAll(`.pnode-${d.id}`).style("opacity", extendedView ? config.ring4DefaultOpacity : 0);
      linksWrapper.selectAll(".effect-line").remove();
      links
        .filter(link => link.node1 === d.id || link.node2 === d.id)
        .forEach(link => {
          linksWrapper
            .select(`.link-${link.source.id}-${link.target.id}`)
            .style("stroke", config[theme].linkHighlightColor)
            .attr("stroke-width", config.lineThickness)
            .style(
              "opacity",
              link.source.Level === ring4Level ? extendedView ? config.ring4DefaultOpacity : 0 : 1
            );
        });
    }
    
  }, [config, width, height, showType, theme, extendedView, magnifyMode, links, nodes]);
  return (
    <>
      <div className={classes.svgContainer} onContextMenu={onContextMenu}>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          style={{ backgroundColor: config[theme].backgroundColor }}
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
                checked={theme === "dark" ? true : false}
                onChange={evt =>
                  setTheme(evt.target.checked ? "dark" : "white")
                }
                color="primary"
              />
            }
            label={theme === "dark" ? "Dark" : "White"}
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
