import React from "react";
import * as d3 from "d3";
import {
  Popper,
  Menu,
  MenuItem,
  Fade,
  Paper
} from "@material-ui/core";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import { SearchInputBox } from "../SearchInputBox";
import { ZoneInfoCard } from "../ZoneInfoCard";
import { AttackSuccessCard } from "../AttackSuccessCard";
import { DetailInfoCard } from "../DetailInfoCard";
import { PathsInfoCard } from "../PathsInfoCard";
import { ModeSelectCard } from "../ModeSelectCard";
import { Tooltip } from "../Tooltip";
import { Wrapper } from "../Wrapper";
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
  centeringPaths,
  getFullPaths
} from "./functions";
import {useStyles} from "./style";

export const Viewer = ({ data, width, height, config }) => {
  const classes = useStyles();
  const svgRef = React.useRef();
  const timeoutRef = React.useRef();
  const tooltipContentRef = React.useRef();
  const levelInfos = React.useRef([]);
  const clickedNode = React.useRef(null);

  const [tooltipAnchorEl, setTooltipAnchorEl] = React.useState(null);
  const [tooltipOpen, setTooltipOpen] = React.useState(false);
  const [magnifyMode, setMagnifyMode] = React.useState(false);
  const [disableTooltip, setDisableTooltip] = React.useState(false);
  const [contextPosition, setContextPosition] = React.useState({
    x: null,
    y: null
  });
  const [selectedPath, setSelectedPath] = React.useState(null);

  const [theme, setTheme] = React.useState("dark");
  const [nodeShape, setNodeShape] = React.useState("circle");
  const [extended, setExtended] = React.useState(true);
  const [showLines, setShowLines] = React.useState(false);  

  const [showModeCard, setShowModeCard] = React.useState(true);
  const [detailInfo, setDetailInfo] = React.useState({show: null, info: null});
  const [pathsInfo, setPathsInfo] = React.useState({show: null, info: null});  

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

  const onDisableTooltip = () => {
    setDisableTooltip(!disableTooltip);
    setContextPosition({ x: null, y: null });
  }

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
    )[0];    
    
    nodes.forEach(node => {
      if (searchText && filtered.id === node.id) {
        node.selected = true;
      } else {
        node.selected = false;
      }
    });
    
    setDetailInfo({show: true, info: nodes.filter(node => node.id === filtered.id)[0]});

    const graph = d3.select(".graph");
    const nodesWrapper = graph.select(".nodes-wrapper");
    updateNodes(
      nodesWrapper,
      selectedPath,
      nodes,
      links,
      config,
      levelInfos.current,
      nodeShape,
      theme,
      extended,
      {
        action: global.MOUSE_EVENT_TYPE.NONE,
        node: null
      }
    );
  };

  const onSelectPath = (pathsInfo, pathColor) => {
    const graph = d3.select(".graph");
    const linksWrapper = graph.select(".links-wrapper");
    const nodesWrapper = graph.select(".nodes-wrapper");
    setSelectedPath({paths: pathsInfo.paths, color: pathColor});
    updateNodes(
      nodesWrapper,
      {paths: pathsInfo.paths, color: pathColor},
      nodes,
      links,
      config,
      levelInfos.current,
      nodeShape,
      theme,
      extended,
      null
    );      
    updateLinks(linksWrapper, {paths: pathsInfo.paths, color: pathColor}, null, config, global.MOUSE_EVENT_TYPE.SELECT, theme, extended, showLines);
  }  

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
      .data(config[theme].levelRings)
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
      .style("opacity", config[theme].levelRingOpacity)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const graph = d3.select(".graph");

    const nodesWrapper = graph.select(".nodes-wrapper");
    const linksWrapper = graph.select(".links-wrapper");

    if (clickedNode.current) {
      updateNodes(
        nodesWrapper,
        selectedPath,
        nodes,
        links,
        config,
        levelInfos.current,
        nodeShape,
        theme,
        extended,
        {
          action: clickedNode.current.hasRing4 ? global.MOUSE_EVENT_TYPE.EXPAND : global.MOUSE_EVENT_TYPE.CLICK,
          node: clickedNode.current
        }
      );
    } else {
      updateNodes(
        nodesWrapper,
        selectedPath,
        nodes,
        links,
        config,
        levelInfos.current,
        nodeShape,
        theme,
        extended,
        {
          action: global.MOUSE_EVENT_TYPE.NONE,
          node: null
        }
      );
    }
    updateLinks(linksWrapper, null, null, config, global.MOUSE_EVENT_TYPE.NONE, theme, extended, showLines);
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
      setDetailInfo({show: true, info: d});
      setSelectedPath(null);
      
      nodes.forEach(node => {node.selected = false});
      d.selected = true;

      let filteredPathArr = centeringPaths(d, config.levelCounts, links);

      clickedNode.current = d;
      updateNodes(
        nodesWrapper,
        selectedPath,
        nodes,
        links,
        config,
        levelInfos.current,
        nodeShape,
        theme,
        extended,
        {
          action: !d.hasRing4 || !extended ? global.MOUSE_EVENT_TYPE.CLICK : global.MOUSE_EVENT_TYPE.EXPAND,
          node: d
        }
      );      
       
      updateLinks(linksWrapper, filteredPathArr, d, config, global.MOUSE_EVENT_TYPE.CLICK, theme, extended, showLines); 
      setPathsInfo({show: true, info: getFullPaths(filteredPathArr)});
    }
    function nodeMouseOver(d) {
      d3.event.stopPropagation();
      if(!disableTooltip) {
        tooltipContentRef.current = d;
        clearTimeout(timeoutRef.current);
        setTooltipAnchorEl(d3.event.currentTarget);
        setTooltipOpen(true);
      }
      updateNodes(
        nodesWrapper,
        selectedPath,
        nodes,
        links,
        config,
        levelInfos.current,
        nodeShape,
        theme,
        extended,
        {
          action: global.MOUSE_EVENT_TYPE.HOVER,
          node: d
        }
      );   
      updateLinks(linksWrapper, null, d, config, global.MOUSE_EVENT_TYPE.HOVER, theme, extended, showLines);

      if (magnifyMode) return;
      let filteredPathArr = centeringPaths(d, config.levelCounts, links);
      
      filteredPathArr.forEach((fpaths, i) => {
        linksWrapper
          .selectAll(`.level${i}-paths`)
          .data(fpaths)
          .enter()
          .append("path")
          .attr("class", `animation-line level${i}-paths`)
          .style("stroke", config[theme].link.animColor)
          .style("stroke-width", config.link.thickness * 2)
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
      if(!disableTooltip) {
        timeoutRef.current = setTimeout(() => {
          setTooltipOpen(false);
          setTooltipAnchorEl(null);
        }, config.duration);
      }
      updateNodes(
        nodesWrapper,
        selectedPath,
        nodes,
        links,
        config,
        levelInfos.current,
        nodeShape,
        theme,
        extended,
        {
          action: global.MOUSE_EVENT_TYPE.OUT,
          node: null
        }
      );
      updateLinks(linksWrapper, null, null, config, global.MOUSE_EVENT_TYPE.OUT, theme, extended, showLines);
      linksWrapper.selectAll(".animation-line").remove();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, width, height, nodeShape, theme, extended, magnifyMode, disableTooltip, showLines, selectedPath]);
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
        <ModeSelectCard 
          open={showModeCard} 
          onExpand={() => setShowModeCard(!showModeCard)} 
          nodeShape={nodeShape}
          changeNodeShape={val => setNodeShape(val)}
          theme={theme}
          changeTheme={val => setTheme(val)}
          extended={extended}
          changeExtend={val => setExtended(val)}
          showLines={showLines}
          changeShowLines={val => setShowLines(val)}
        />
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
        <div className={classes.bottomArea}>          
          <AttackSuccessCard successTimes={78} />
          <ZoneInfoCard nodes={data.nodes} />
        </div>
        {detailInfo.show !== null && 
          <DetailInfoCard open={detailInfo.show} onExpand={() => setDetailInfo({...detailInfo, show: !detailInfo.show})} info={detailInfo.info} />
        }
        {pathsInfo.show !== null && 
          <PathsInfoCard open={pathsInfo.show} onExpand={() => setPathsInfo({...pathsInfo, show: !pathsInfo.show})} pathGroups={pathsInfo.info} onCardClick={onSelectPath}/>
        }
      </div>
      {!magnifyMode && !disableTooltip && (        
        // <Tooltip
        //   open={tooltipOpen}
        //   anchorEl={tooltipAnchorEl}
        //   onOver={() => clearTimeout(timeoutRef.current)}
        //   onOut={() => {
        //     timeoutRef.current = setTimeout(() => {
        //       setTooltipOpen(false);
        //       setTooltipAnchorEl(null);
        //     }, config.duration);
        //   }}
        //   info={tooltipContentRef.current}
        // />
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
              <Paper className={classes.tooltipContainer}>
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
        <MenuItem onClick={onDisableTooltip} className={classes.menuItem}>
          {disableTooltip ? (
            <CheckBoxIcon className={classes.checkItem} />
          ) : (
            <CheckBoxOutlineBlankIcon className={classes.checkItem} />
          )}
          Disable Tooltip
        </MenuItem>
        <MenuItem onClick={onCenter} className={classes.menuItem}>
          Center
        </MenuItem>
      </Menu>
    </>
  );
};
