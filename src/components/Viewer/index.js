import React from "react";
import * as d3 from "d3";

import { Wrapper } from "../Wrapper";
import { ExpandableIcon } from "../ExpandIcon";
import {
  makeStyles,
  Popper,
  Menu,
  MenuItem,
  Fade,
  Slide,
  Collapse,
  Paper,
  Typography,
  FormControlLabel,
  IconButton,
  Switch
} from "@material-ui/core";
import { ToggleButton, ToggleButtonGroup } from "@material-ui/lab";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import ImageIcon from "@material-ui/icons/Image";
import { SearchInputBox } from "../SearchInputBox";
import utils from "../../utils";
import global from "../../global";
import {
  zoom,
  fisheye,
  maxCountsOfLevel,
  addDonutCircles,
  addNodes,
  addNodesOfRing4,
  addLinks,
  getLinks,
  updateNodes,
  updateLinks,
  centeringPaths
} from "./functions";

const detailInfoHeight = 150;

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
  expandableIconButton: {
    position: "absolute",
    top: "50%",
    right: 0,
    color: "white"
  },
  detailInfoPaper: {
    position: "absolute",
    top: `calc(50% - ${detailInfoHeight / 2}px)`,
    right: 4,
    height: detailInfoHeight,
    padding: `${theme.spacing(2)}px ${theme.spacing(2)}px ${theme.spacing(
      2
    )}px ${theme.spacing(1)}px`
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
  const [showDetail, setShowDetail] = React.useState(null);
  const [detailInfo, setDetailInfo] = React.useState(null);
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

  const onCenter = () => {
    d3.select(svgRef.current).call(
      zoom.transform,
      d3.zoomIdentity.translate(0, 0).scale(1)
    );
    setContextPosition({ x: null, y: null });
  };

  const onSearch = searchText => {
    const filtered = utils.filteredList(
      data.nodes.map(node => ({
        id: node.id,
        name: node.name,
        IP: node.IP,
        Mask: node.Mask,
        RS: node.RS,
        Level: node.Level
      })),
      searchText
    );

    nodes.forEach(node => {
      if (searchText && filtered.map(d => d.id).includes(node.id)) {
        node.searched = true;
      } else {
        node.searched = false;
      }
    });

    const graph = d3.select(".graph");
    const nodesWrapper = graph.select(".nodes-wrapper");
    updateNodes(
      nodesWrapper,
      nodes,
      links,
      config,
      levelInfos.current,
      showType,
      theme,
      extendedView,
      {
        action: global.MOUSE_EVENT_TYPE.NONE,
        node: null
      }
    );
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
    addDonutCircles(nodesWrapper, nodes, config);
    addLinks(linksWrapper, links, config);
  }, [theme]);

  React.useEffect(() => {
    console.log("effect 2");
    const graph = d3.select(".graph");

    const nodesWrapper = graph.select(".nodes-wrapper");
    const linksWrapper = graph.select(".links-wrapper");

    if (openedNode.current) {
      updateNodes(
        nodesWrapper,
        nodes,
        links,
        config,
        levelInfos.current,
        showType,
        theme,
        extendedView,
        {
          action: global.MOUSE_EVENT_TYPE.CLICK,
          node: openedNode.current
        }
      );
    } else {
      updateNodes(
        nodesWrapper,
        nodes,
        links,
        config,
        levelInfos.current,
        showType,
        theme,
        extendedView,
        {
          action: global.MOUSE_EVENT_TYPE.NONE,
          node: null
        }
      );
    }
    updateLinks(linksWrapper, null, config, theme, extendedView);
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
        .attr(
          "transform",
          d => `translate(${d.fisheye.x}, ${d.fisheye.y})scale(${d.fisheye.z})`
        );

      linksWrapper
        .selectAll(".links")
        .attr(
          "d",
          d =>
            `M${d.source.fisheye.x} ${d.source.fisheye.y}L${d.target.fisheye.x} ${d.target.fisheye.y}`
        );
    });

    function nodeClick(d) {
      d3.event.stopPropagation();
      setDetailInfo(d);
      setShowDetail(true);

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
        {
          action: global.MOUSE_EVENT_TYPE.CLICK,
          node: d
        }
      );
      updateLinks(linksWrapper, d, config, theme, extendedView);
    }
    function nodeMouseOver(d) {
      d3.event.stopPropagation();
      tooltipContentRef.current = d;
      clearTimeout(timeoutRef.current);
      setTooltipAnchorEl(d3.event.currentTarget);
      setTooltipOpen(true);

      updateNodes(
        nodesWrapper,
        nodes,
        links,
        config,
        levelInfos.current,
        showType,
        theme,
        extendedView,
        {
          action: global.MOUSE_EVENT_TYPE.HOVER,
          node: d
        }
      );

      updateLinks(linksWrapper, d, config, theme, extendedView);

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
      timeoutRef.current = setTimeout(() => {
        setTooltipOpen(false);
        setTooltipAnchorEl(null);
      }, config.duration);
      updateNodes(
        nodesWrapper,
        nodes,
        links,
        config,
        levelInfos.current,
        showType,
        theme,
        extendedView,
        {
          action: global.MOUSE_EVENT_TYPE.OUT,
          node: null
        }
      );
      updateLinks(linksWrapper, null, config, theme, extendedView);
      linksWrapper.selectAll(".effect-line").remove();
    }
  }, [config, width, height, showType, theme, extendedView, magnifyMode]);
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
        <SearchInputBox
          onSearch={onSearch}
          searchList={data.nodes.map(node => ({
            name: node.name,
            IP: node.IP,
            Mask: node.Mask,
            RS: node.RS,
            Level: node.Level
          }))}
        />
        {showDetail !== null && (
          <IconButton
            className={classes.expandableIconButton}
            size="small"
            onClick={() => setShowDetail(!showDetail)}
          >
            <ExpandableIcon expanded={showDetail} />
          </IconButton>
        )}
        <Slide direction="left" in={showDetail} mountOnEnter unmountOnExit>
          <Paper className={classes.detailInfoPaper}>
            <Wrapper height="auto" align="center">
              <IconButton size="small" onClick={() => setShowDetail(!showDetail)}>
                <ExpandableIcon expanded={showDetail} />
              </IconButton>
              {detailInfo && (
              <Wrapper height="auto" pl={8}>
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
                  <span>{detailInfo.name}</span>
                  <span>{detailInfo.IP}</span>
                  <span>{detailInfo.Mask}</span>
                  <span>{detailInfo.RS}</span>
                  <span>{detailInfo.Conditions[0].RCE}</span>
                  <span>{detailInfo.Conditions[0].LPE}</span>
                  <span>{detailInfo.Conditions[0].Config}</span>
                </Wrapper>
              </Wrapper>)}
            </Wrapper>
          </Paper>
        </Slide>
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
        <MenuItem onClick={onCenter} className={classes.menuItem}>
          Center
        </MenuItem>
      </Menu>
    </>
  );
};
