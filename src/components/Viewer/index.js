import React from "react";
import * as d3 from "d3";
// import * as d3Fisheye from "d3-fisheye";
import fisheyer from "./fisheye";
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

const zoom = d3.zoom();
const fisheye = fisheyer
  .circular()
  .radius(80)
  .distortion(4);

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
  const [darkMode, setDarkMode] = React.useState(true);
  const [showType, setShowType] = React.useState("circle");  
  const [extendedView, setExtendedView] = React.useState(true);
  const [magifyMode, setMagnifyMode] = React.useState(false);
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
    d3.select(svgRef.current).call(
      zoom.on("zoom", function() {
        d3.select(".graph").attr("transform", d3.event.transform);
      })
    );
  }, []);

  React.useEffect(() => {
    let maxNodesOfLevel = Math.max(
      data.nodes.filter(n => n.Level === 1).length,
      data.nodes.filter(n => n.Level === 2).length,
      data.nodes.filter(n => n.Level === 3).length
    );
    const base_cx = width / 2,
      base_cy = height / 2;

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

    for (let i = config.levelCircles.length - 2; i > 0; i--) {
      let currentLinks = data.links.filter(
        link =>
          (link.source.Level === i && link.target.Level === i - 1) ||
          (link.target.Level === i && link.source.Level === i - 1)
      );
      pathArr.push(currentLinks);
    }
    const graph = d3.select(".graph");
    graph.selectAll("*").remove();
    
    // magnifier as circle
    const lens = graph
      .append("circle")
      .attr("class", "lens")
      .style("fill", "transparent")
      .style("stroke", "grey")
      .style("stroke-width", 3)
      .attr("r", fisheye.radius())
      .style("opacity", magifyMode ? 1 : 0);

    const circleWrapper = graph.append("g").attr("class", "circles-wrapper");
    const nodesWrapper = graph.append("g").attr("class", "nodes-wrapper");
    const linksWrapper = graph.append("g").attr("class", "links-wrapper");

    let levelCircleInfo = [];

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
          i > 0 ? (radius + levelCircleInfo[i - 1].radius) * 0.5 : 0;
        levelCircleInfo.push({ radius, distance });
        return radius;
      })
      .attr("fill", d => d.fill)
      .attr("stroke", d => d.stroke)
      .attr("stroke-width", config.thickness)
      .style("opacity", 0.5)
      .lower();

    for (let i = 0; i < config.levelCircles.length - 1; i++) {
      generateGroup(
        base_cx,
        base_cy,
        levelCircleInfo[i].distance,
        data.nodes.filter(node => node.Level === i),
        data.links,
        i
      );
    }

    //for ring 4
    const nodesHasRing4 = [];
    data.nodes.forEach(node => {
      if (hasRing4Nodes(node)) {
        nodesHasRing4.push(node);
      }
    });

    if (extendedView) {
      let childNodes;
      nodesHasRing4.forEach(pNode => {
        childNodes = data.links
          .filter(
            link =>
              link.target.id === pNode.id &&
              link.source.Level === config.levelCircles.length - 1
          )
          .map(d => d.source);

        const rad = childNodes.length * config.baseRadius * 0.3;
        const outer =
          levelCircleInfo[pNode.Level].radius -
          levelCircleInfo[pNode.Level].distance;
        generateGroup(
          pNode.cx + Math.cos(pNode.angle * 2) * (outer + rad) * 1.5,
          pNode.cy + Math.sin(pNode.angle * 2) * (outer + rad) * 1.5,
          rad,
          childNodes,
          data.links,
          config.levelCircles.length - 1,
          true
        );
      });
    } else {
      nodesWrapper
        .selectAll(`.nodes-${config.levelCircles.length - 1}`)
        .remove();
    }

    function generateGroup(
      cx,
      cy,
      distance,
      nodes,
      links,
      levelNo,
      patterned = false
    ) {
      const nodesG = nodesWrapper
        .selectAll("nodes")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", d => {
          d.hasRing4 = hasRing4Nodes(d);
          d.isRing4 = d.Level === config.levelCircles.length - 1 ? true : false;
          return `nodes-${levelNo} ind-node-${d.id} node-groups ${d.hasRing4 ? 'has-ring4-' + d.id : ''} ${d.isRing4 ? 'ring4-node' : ''}`;
        })
        .style("opacity", d =>
          d.Level === config.levelCircles.length - 1 ? 0.1 : 1
        );
      if (showType === "circle") {
        nodesG
          .append("circle")
          .attr("fill", config.levelCircles[levelNo].nodeColor)
          .attr("stroke-width", config.thickness * 2)
          .attr("stroke", config.levelCircles[levelNo].nodeStroke)
          .style("cursor", "pointer")
          .on("click", nodeClick)
          .on("mouseover", nodeMouseOver)
          .on("mouseout", nodeMouseOut)
          .attr("r", d => {
            const links_count = links.filter(
              link => d.id === link.node1 || d.id === link.node2
            ).length;
            d.r = config.nodeSize + links_count * config.nodeSizeStep;
            return d.r;
          })
          .attr("cx", (d, i) => {
            d.angle = (i / nodes.length) * Math.PI;
            let adjustedDistance = distance;
            if (patterned) {
              adjustedDistance = utils.pattern_distance(
                nodes.length,
                i + 1,
                distance
              );
            }
            d.cx = cx + getCenter(d.angle, adjustedDistance).cx;
            d.x = d.cx;
            return d.cx;
          })
          .attr("cy", (d, i) => {
            let adjustedDistance = distance;
            if (patterned) {
              adjustedDistance = utils.pattern_distance(
                nodes.length,
                i + 1,
                distance
              );
            }
            d.cy = cy + getCenter(d.angle, adjustedDistance).cy;
            d.y = d.cy;
            return d.cy;
          });
      } else {
        nodesG
          .append("svg:image")
          .style("cursor", "pointer")
          .on("click", nodeClick)
          .on("mouseover", nodeMouseOver)
          .on("mouseout", nodeMouseOut)
          .attr("xlink:href", d => {
            let iconName = d.Software[0].Icon || "ei-windows";
            iconName = iconName.replace("ei-", "");
            return require(`../../assets/icons/svg/${iconName}.svg`);
          })
          .attr("x", (d, i) => {
            const links_count = data.links.filter(
              link => d.id === link.node1 || d.id === link.node2
            ).length;
            d.r = config.nodeSize + links_count * config.nodeSizeStep;
            d.angle = (i / nodes.length) * Math.PI;
            let adjustedDistance = distance;
            if (patterned) {
              adjustedDistance = utils.pattern_distance(
                nodes.length,
                i + 1,
                distance
              );
            }
            d.cx = cx + getCenter(d.angle, adjustedDistance).cx;
            d.x = d.cx;
            return d.cx - d.r;
          })
          .attr("y", (d, i) => {
            d.angle = (i / nodes.length) * Math.PI;
            let adjustedDistance = distance;
            if (patterned) {
              adjustedDistance = utils.pattern_distance(
                nodes.length,
                i + 1,
                distance
              );
            }
            d.cy = cy + getCenter(d.angle, adjustedDistance).cy;
            d.y = d.cy;
            return d.cy - d.r;
          })
          .attr("width", d => {
            const links_count = data.links.filter(
              link => d.id === link.node1 || d.id === link.node2
            ).length;
            d.r = config.nodeSize + links_count * config.nodeSizeStep;
            return d.r * 2;
          })
          .attr("height", d => {
            const links_count = data.links.filter(
              link => d.id === link.node1 || d.id === link.node2
            ).length;
            d.r = config.nodeSize + links_count * config.nodeSizeStep;
            return d.r * 2;
          });
      }
      nodesG
        .append("text")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "ideographic")
        .style("font-size", d => d.fs = 12)
        .style("fill", config.nodeTextColor)
        .style("pointer-events", "none")
        .attr("x", d => d.x)
        .attr("y", d => d.y - d.r - 5)
        .text(d => d.name)
        .raise();
    }

    linksWrapper
      .selectAll(".links")
      .data(data.links)
      .enter()
      .append("path")
      .attr("class", d => `links link-${d.source.id}-${d.target.id}`)
      .style("pointer-events", "none")
      .attr(
        "d",
        d => `M${d.source.x} ${d.source.y}L${d.target.x} ${d.target.y}`
      )
      .style("stroke", config.linkColor)
      .attr("stroke-width", config.thickness * 0.5)
      .style("opacity", d =>
        d.source.Level === config.levelCircles.length - 1 ? 0.1 : 1
      );

    if (!extendedView) {
      linksWrapper.selectAll(".links").each(function(d) {
        if (d.source.Level === config.levelCircles.length - 1) {
          d3.select(this).remove();
        }
      });
    }
    nodesWrapper.raise();

    graph.on("mousemove", function() {
      if(!magifyMode) return;
      const m = d3.mouse(this);
      fisheye.focus(m);
      lens.attr("cx", m[0]).attr("cy", m[1]);
      if(showType === 'circle'){
        nodesWrapper
          .selectAll(".node-groups")
          .each(d => {
            d.fisheye = fisheye(d);
          })
          .select("circle")
          .attr("cx", d => d.fisheye.x)
          .attr("cy", d => d.fisheye.y)
          .attr("r", d => d.r * d.fisheye.z * 0.8);
      } else {
        nodesWrapper
          .selectAll(".node-groups")
          .each(d => {
            d.fisheye = fisheye(d);
          })
          .select("image")
          .attr("x", d => d.fisheye.x - d.r * d.fisheye.z * 0.8)
          .attr("y", d => d.fisheye.y - d.r * d.fisheye.z * 0.8)
          .attr("width", d => d.r * 2 * d.fisheye.z)
          .attr("height", d => d.r * 2 * d.fisheye.z)
      }
      nodesWrapper
        .selectAll(".node-groups")
        .select("text")
        .attr("x", d => d.fisheye.x)
        .attr("y", d => d.fisheye.y - d.r * d.fisheye.z - 5)
        .attr('font-size', d => d.fisheye.z * (d.fs) )
        .style('font-size', d => d.fisheye.z * (d.fs) )
      linksWrapper
        .selectAll(".links")
        .attr(
          "d",
          d =>
            `M${d.source.fisheye.x} ${d.source.fisheye.y}L${d.target.fisheye.x} ${d.target.fisheye.y}`
        );
    });

    function nodeClick(d) {
      if(!d.hasRing4 || !extendedView) return;
        let childNodes = [];
        nodesHasRing4.forEach(pNode => {
          childNodes = data.links
            .filter(
              link =>
                link.target.id === pNode.id &&
                link.source.Level === config.levelCircles.length - 1
            )
            .map(d => d.source);

          childNodes.forEach(child => {
            nodesWrapper.select(`.ind-node-${child.id}`).remove();
          })

          const rad = childNodes.length * config.baseRadius * 0.3;
          const outer =
            levelCircleInfo[pNode.Level].radius -
            levelCircleInfo[pNode.Level].distance;
          generateGroup(
            pNode.cx + Math.cos(pNode.angle * 2) * (outer + rad) * 1.5,
            pNode.cy + Math.sin(pNode.angle * 2) * (outer + rad) * 1.5,
            rad,
            childNodes,
            data.links,
            config.levelCircles.length - 1,
            true
          );
          childNodes.forEach(child => {
            nodesWrapper.select(`.ind-node-${child.id}`).style("opacity", 0.1);
          })
        });

      linksWrapper
        .selectAll(".links")
        .attr(
          "d",
          d => `M${d.source.x} ${d.source.y}L${d.target.x} ${d.target.y}`
        )        
        .style("opacity", d =>
          d.source.Level === config.levelCircles.length - 1 ? 0.1 : 1
        ).lower();
        
      const outer =
        levelCircleInfo[d.Level].radius -
        levelCircleInfo[d.Level].distance;
      let newChildNodes = data.links
        .filter(
          link =>
            link.target.id === d.id &&
            link.source.Level === config.levelCircles.length - 1
        )
        .map(d => d.source);

      const rad = newChildNodes.length * config.baseRadius;
      
      newChildNodes.forEach(child => {
        nodesWrapper.select(`.ind-node-${child.id}`).remove();
      })

      generateGroup(
        d.cx + Math.cos(d.angle * 2) * (outer + rad) * 1.5,
        d.cy + Math.sin(d.angle * 2) * (outer + rad) * 1.5,
        rad,
        newChildNodes,
        data.links,
        config.levelCircles.length - 1,
        true
      );
      newChildNodes.forEach(child => {
        nodesWrapper.select(`.ind-node-${child.id}`).style("opacity", 0.4);
      })
      linksWrapper
        .selectAll(".links")
        .attr(
          "d",
          d => `M${d.source.x} ${d.source.y}L${d.target.x} ${d.target.y}`
        )        
        .style("opacity", d => newChildNodes.map(e => e.id).includes(d.source.id) ? 0.4 : 'auto').lower();

      nodesWrapper.raise();
    }
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

      d3.select(this)
        .style("stroke", config.highlightColor)
        .attr("stroke-width", config.thickness);

      const childNodes = data.links.filter(
        link =>
          link.target.id === d.id &&
          link.source.Level === config.levelCircles.length - 1
      );
      if (childNodes) {
        nodesWrapper.selectAll(".node-groups").style("opacity", p =>
          childNodes
            .map(k => k.source)
            .map(e => e.id)
            .includes(p.id)
            ? 0.4
            : "auto"
        );
      }

      data.links
        .filter(link => link.node1 === d.id || link.node2 === d.id)
        .forEach(link => {
          linksWrapper
            .select(`.link-${link.source.id}-${link.target.id}`)
            .style("stroke", config.linkHighlightColor)
            .attr("stroke-width", config.thickness * 3)
            .style(
              "opacity",
              link.source.Level === config.levelCircles.length - 1 ? 0.4 : 1
            )
            .raise();
        });
      if(magifyMode) return;
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
      const childNodes = data.links.filter(
        link =>
          link.target.id === d.id &&
          link.source.Level === config.levelCircles.length - 1
      );
      if (childNodes) {
        nodesWrapper.selectAll(".node-groups").style("opacity", p =>
          childNodes
            .map(k => k.source)
            .map(e => e.id)
            .includes(p.id)
            ? 0.1
            : "auto"
        );
      }
      linksWrapper.selectAll(".effect-line").remove();
      data.links
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

    function getCenter(angle, distance) {
      return {
        cx: distance * Math.cos(angle * 2),
        cy: distance * Math.sin(angle * 2)
      };
    }
    function hasRing4Nodes(node) {
      return (
        data.links.filter(
          link =>
            link.target.id === node.id &&
            link.source.Level === config.levelCircles.length - 1
        ).length > 0
      );
    }
  }, [data, config, width, height, showType, extendedView, magifyMode]);
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
            label={darkMode ? 'Dark' : 'White'}
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
      {!magifyMode && <Popper
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
      </Popper>}
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
            setMagnifyMode(!magifyMode);
          }}
          className={classes.menuItem}
        >
          {magifyMode ? <CheckBoxIcon className={classes.checkItem} /> : <CheckBoxOutlineBlankIcon className={classes.checkItem} />}
          Magnifier
        </MenuItem>
      </Menu>
    </>
  );
};
