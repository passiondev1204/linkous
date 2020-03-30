import * as d3 from "d3";
import fisheyer from "./fisheye";
import global from "../../global";
import utils from "../../utils";

export const zoom = d3.zoom();
export const fisheye = fisheyer
  .circular()
  .radius(80)
  .distortion(4);

export const maxCountsOfLevel = nodes =>
  Math.max(
    nodes.filter(n => n.Level === 1).length,
    nodes.filter(n => n.Level === 2).length,
    nodes.filter(n => n.Level === 3).length
  );

export const getLinks = (nodes, links) =>
  links.map(link => {
    let source = nodes.find(({ id }) => id === link.node1);
    let target = nodes.find(({ id }) => id === link.node2);
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

export const forwardCenterPaths = (levelCounts, links) => {
  let paths = [];

  for (let i = levelCounts - 2; i > 0; i--) {
    let currentLinks = links.filter(
      link =>
        (link.source.Level === i && link.target.Level === i - 1) ||
        (link.target.Level === i && link.source.Level === i - 1)
    );
    paths.push(currentLinks);
  }
  return paths;
};

export const filteredPaths = (links, direction, idx) => {
  return direction === 0
    ? links.filter(link => link.source.id === idx)
    : links.filter(link => link.target.id === idx);
};

export const centeringPaths = (node, levelCounts, links) => {
  let filteredPathArr = [[], [], []];
  if (node.Level === 2) {
    filteredPathArr[0] = filteredPaths(
      forwardCenterPaths(levelCounts, links)[0],
      1,
      node.id
    );
    filteredPathArr[1] = filteredPaths(
      forwardCenterPaths(levelCounts, links)[1],
      0,
      node.id
    );
    for (let i = 0; i < filteredPathArr[1].length; i++)
      filteredPathArr[2] = [
        ...filteredPathArr[2],
        ...filteredPaths(
          forwardCenterPaths(levelCounts, links)[2],
          0,
          filteredPathArr[1][i].target.id
        )
      ];
  }
  if (node.Level === 3) {
    filteredPathArr[0] = filteredPaths(
      forwardCenterPaths(levelCounts, links)[0],
      0,
      node.id
    );
    for (let i = 0; i < filteredPathArr[0].length; i++)
      filteredPathArr[1] = [
        ...filteredPathArr[1],
        ...filteredPaths(
          forwardCenterPaths(levelCounts, links)[1],
          0,
          filteredPathArr[0][i].target.id
        )
      ];
    for (let i = 0; i < filteredPathArr[1].length; i++)
      filteredPathArr[2] = [
        ...filteredPathArr[2],
        ...filteredPaths(
          forwardCenterPaths(levelCounts, links)[2],
          0,
          filteredPathArr[1][i].target.id
        )
      ];
  }
  if (node.Level === 1) {
    filteredPathArr[2] = filteredPaths(
      forwardCenterPaths(levelCounts, links)[2],
      0,
      node.id
    );
    for (let i = 0; i < filteredPathArr[2].length; i++)
      filteredPathArr[1] = [
        ...filteredPathArr[1],
        ...filteredPaths(
          forwardCenterPaths(levelCounts, links)[1],
          1,
          filteredPathArr[2][i].source.id
        )
      ];
    for (let i = 0; i < filteredPathArr[1].length; i++)
      filteredPathArr[0] = [
        ...filteredPathArr[0],
        ...filteredPaths(
          forwardCenterPaths(levelCounts, links)[0],
          1,
          filteredPathArr[1][i].source.id
        )
      ];
  }
  filteredPathArr[0] = [...new Set(filteredPathArr[0])];
  filteredPathArr[1] = [...new Set(filteredPathArr[1])];
  filteredPathArr[2] = [...new Set(filteredPathArr[2])];
  return filteredPathArr;
};

export const center = (angle, distance) => {
  return {
    cx: distance * Math.cos(angle * 2),
    cy: distance * Math.sin(angle * 2)
  };
};

export const hasRing4Nodes = (node, links, level4 = 4) =>
  links.filter(
    link => link.target.id === node.id && link.source.Level === level4
  ).length > 0;

export const nodesHasRing4 = (nodes, links) =>
  nodes.filter(node => hasRing4Nodes(node, links));

export const donutCircle = (nodeGroup, node, config) => {
  const conditions = node.Conditions[0];
  let counts =
    Object.values(conditions).filter(con => con.toLowerCase() === "true")
      .length || 0;
  let colors = { NONE: config.Conditions["NONE"] },
    data = {};
  Object.entries(conditions).forEach(con => {
    if (con[1].toLowerCase() === "true") {
      colors[con[0]] = config.Conditions[con[0]];
      data[con[0]] = 1 / counts;
    }
  });
  if (counts === 0) {
    data = { NONE: 1 };
  }

  const pie = d3.pie().value(d => d.value);
  const data_ready = pie(d3.entries(data));
  const arc = d3
    .arc()
    .innerRadius(node.r * 0.65)
    .outerRadius(node.r * 0.85)
    .padAngle(counts > 1 ? 0.05 : 0);
  nodeGroup
    .selectAll("slices")
    .data(data_ready)
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", d => colors[d.data.key]);
  // hovering 
  nodeGroup
    .append("circle")
    .attr("class", "circle-hover")
    .attr("fill", config.node.hoverColor)
    .attr("stroke-width", config.node.thickness)
    .attr("stroke", config.node.hoverColor)
    .style("cursor", "pointer")
    .style("display", "none")
    .attr("r", d => d.r)
};

export const addNodes = (
  wrapper,
  cx,
  cy,
  distance,
  nodes,
  links,
  levelNo,
  config,
  nodeShape = "circle",
  theme = "dark",
  parentId = null
) => {
  const ring4Level = config.levelCounts - 1;

  const nodesG = wrapper
    .selectAll("nodes")
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", d => {
      d.hasRing4 = hasRing4Nodes(d, links);
      if (parentId) d.parentId = parentId;
      return `nodes ${
        config[theme].levelRings.length - 1 === d.Level
          ? `pnode-${parentId}`
          : ""
      }`;
    })
    .style("opacity", d =>
      d.Level === ring4Level ? config.node.finalRingDefaultOpacity : 1
    )
    .attr("transform", (d, i) => {
      d.angle = (i / nodes.length) * Math.PI;
      let adjustedDistance = utils.pattern_distance(
        nodes.length,
        i + 1,
        distance
      );
      d.x = cx + center(d.angle, adjustedDistance).cx;
      d.y = cy + center(d.angle, adjustedDistance).cy;
      const links_count = links.filter(
        link => d.id === link.node1 || d.id === link.node2
      ).length;
      d.icon_size = utils.getIconSize(links_count);
      d.r = config.node.size + links_count * config.node.sizeStep;
      return `translate(${d.x}, ${d.y})`;
    });

  nodesG
    .append("circle")
    .attr("class", "circle-main")
    .attr("fill", config[theme].node.color)
    .attr("stroke-width", config.node.thickness)
    .attr("stroke", config[theme].levelRings[levelNo].stroke)
    .style("cursor", "pointer")
    .style("opacity", 1)
    .attr("r", d => d.r);
  nodesG
    .append("text")
    .attr("class", 'ei ei-lg node-icon')
    .attr("text-anchor", "middle")
    .style("font-size", d => d.r * 0.6 + "px")
    .attr("y", d => d.r * 0.2 + "px")
    .style("fill", config[theme].node.iconColor)
    .style("cursor", "pointer")
    .style("opacity", nodeShape === "circle" ? 0 : 1)
    .text(d => global.icons[d.Software[0].Icon]);
  
  nodesG
    .append("text")
    .attr("class", d => `node-name ${d.icon_size}`)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "ideographic")
    .style("font-size", d => (d.fs = config.defaultFontSize) + "px")
    .style("fill", config[theme].node.textColor)
    .style("pointer-events", "none")
    .attr("dy", d => -(d.r + 10))
    .text(d => d.name)
    .raise();
  wrapper.raise();
};

export const addDonutCircles = (wrapper, nodes, config) => {
  wrapper.selectAll(".nodes").each(function(d) {
    donutCircle(d3.select(this), d, config);
  });
};

export const getFullPaths = filters => {
  let level3 = [],
    level2 = [],
    pathArrs = [],
    paths = [];
  if (filters[0].length > 0) {
    for (let i = 0; i < filters[0].length; i++) {
      level2 = filters[1].filter(e => e.source.id === filters[0][i].target.id);
      paths.push(filters[0][i]);
      for (let k = 0; k < level2.length; k++) {
        level3 = filters[2].filter(
          e => e.source.id === filters[1][k].target.id
        );
        paths.push(level2[k]);
        for (let p = 0; p < level3.length; p++) {
          paths.push(level3[p]);
        }
      }
      pathArrs.push(paths);
      paths = [];
    }
  } else if (filters[1].length > 0) {
    for (let k = 0; k < filters[1].length; k++) {
      level3 = filters[2].filter(e => e.source.id === filters[1][k].target.id);
      paths.push(filters[1][k]);
      for (let p = 0; p < level3.length; p++) {
        paths.push(level3[p]);
      }
    }
    pathArrs.push(paths);
    paths = [];
  } else if (filters[2].length > 0) {
    for (let p = 0; p < filters[2].length; p++) {
      paths.push(filters[2][p]);
    }
    pathArrs.push(paths);
    paths = [];
  }

  return pathArrs;
};

export const addNodesOfRing4 = (
  wrapper,
  nodes,
  links,
  config,
  levelInfo,
  nodeShape = "circle",
  theme = "dark"
) => {
  const ring4Level = config.levelCounts - 1;
  const nodesHasring4 = nodesHasRing4(nodes, links);
  nodesHasring4.forEach(pNode => {
    let childNodes = links
      .filter(
        link => link.target.id === pNode.id && link.source.Level === ring4Level
      )
      .map(d => d.source);

    let rad = childNodes.length * config.baseRadius * 0.3;
    const outer =
      levelInfo[pNode.Level].radius - levelInfo[pNode.Level].distance;

    addNodes(
      wrapper,
      pNode.x + Math.cos(pNode.angle * 2) * (outer + rad) * 1.5,
      pNode.y + Math.sin(pNode.angle * 2) * (outer + rad) * 1.5,
      rad,
      childNodes,
      links,
      ring4Level,
      config,
      nodeShape,
      theme,
      pNode.id,
      true
    );
  });
};

export const addLinks = (wrapper, links, config, theme = "dark") => {
  const ring4Level = config.levelCounts - 1;
  wrapper
    .selectAll("links")
    .data(links)
    .enter()
    .append("path")
    .attr("class", d => `links link-${d.source.id}-${d.target.id}`)
    .style("pointer-events", "none")
    .attr("d", d => `M${d.source.x} ${d.source.y}L${d.target.x} ${d.target.y}`)
    .style("stroke", config[theme].link.color)
    .style("stroke-width", config.link.thickness)
    .style("opacity", d =>
      d.source.Level === ring4Level ? config.node.finalRingDefaultOpacity : 1
    );
  
};

export const updateNodes = (
  wrapper,
  filteredPaths,
  nodes,
  links,
  config,
  levelInfo,
  nodeShape = "circle",
  theme = "dark",
  extended = true,
  actionObj
) => {
  const ring4Level = config.levelCounts - 1;
  const nodesHasring4 = nodesHasRing4(nodes, links);

  if(filteredPaths){       
    wrapper.selectAll(".nodes").each(function(d) {
      d.inPath = false;
    });
    wrapper.selectAll(".nodes").each(function(d) {
      let tmpPath = filteredPaths.paths.filter(path => path.node1 === d.id || path.node2 === d.id);
      if(tmpPath[0])
        d.inPath = true;
      else
        d.inPath = false;
    });
  }

  wrapper
    .selectAll(".nodes")
    .select(".circle-main")
    .attr("fill", d => config[theme].node.color)
    .attr("stroke", d => config[theme].levelRings[d.Level].stroke)
    .style("opacity", 1);

  wrapper
    .selectAll(".nodes")
    .select(".circle-hover")
    .attr("fill", config[theme].node.hoverColor)
    .attr("stroke", config[theme].node.hoverColor)

  wrapper
    .selectAll(".nodes")
    .select(".node-name")
    .style("fill", config[theme].node.textColor);

  wrapper
    .selectAll(".nodes")
    .select(".node-icon")
    .style("opacity", nodeShape === "circle" ? 0 : 1)
    .style("fill", config[theme].node.iconColor);

  if (extended) {
    wrapper
      .selectAll(".nodes")
      .style("pointer-events", "auto")
      .style("visibility", "visible");
  } else {
    wrapper
      .selectAll(".nodes")
      .style("pointer-events", d => (d.Level === ring4Level ? "none" : "auto"))
      .style("visibility", d =>
        d.Level === ring4Level ? "hidden" : "visible"
      );
  }
  if(actionObj){
    if (
      actionObj.action === global.MOUSE_EVENT_TYPE.EXPAND ||
      actionObj.action === global.MOUSE_EVENT_TYPE.CLICK
    ) {
      nodesHasring4.forEach(pNode => {
        let childNodes = links
          .filter(
            link =>
              link.target.id === pNode.id && link.source.Level === ring4Level
          )
          .map(d => d.source);

        let rad = childNodes.length * config.baseRadius * 0.3;
        if (
          actionObj.node.id === pNode.id &&
          actionObj.action === global.MOUSE_EVENT_TYPE.EXPAND
        ) {
          rad = childNodes.length * config.baseRadius;
        }

        const outer =
            levelInfo[pNode.Level].radius - levelInfo[pNode.Level].distance,
          new_cx = pNode.x + Math.cos(pNode.angle * 2) * (outer + rad) * 1.5,
          new_cy = pNode.y + Math.sin(pNode.angle * 2) * (outer + rad) * 1.5;

        wrapper
          .selectAll(`.pnode-${pNode.id}`)
          .attr("transform", (d, i) => {
            let adjustedDistance = utils.pattern_distance(
              childNodes.length,
              i + 1,
              rad
            );
            d.x = new_cx + center(d.angle, adjustedDistance).cx;
            d.y = new_cy + center(d.angle, adjustedDistance).cy;
            return `translate(${d.x}, ${d.y})`;
          })
          .style(
            "opacity",
            pNode.id === actionObj.node.id
              ? config.node.finalRingHoverOpacity
              : config.node.finalRingDefaultOpacity
          );
      });
    }
    if(actionObj.action === global.MOUSE_EVENT_TYPE.HOVER) {
      wrapper
      .selectAll(".nodes")
      .select(".circle-hover")
      .style("display", d => actionObj.node.id === d.id ? "block" : "none");
    }
    if(actionObj.action === global.MOUSE_EVENT_TYPE.OUT) {
      wrapper
      .selectAll(".nodes")
      .select(".circle-hover")
      .style("display", "none");
    }
  }

  if(filteredPaths){
    wrapper
    .selectAll(".nodes")
    .select(".circle-main")
    .attr("stroke", d =>
      d.inPath ? filteredPaths.color
        : config[theme].levelRings[d.Level].stroke
    )
    .attr("stroke-width", d =>
      d.selected ? config.node.highlightThickness : config.node.thickness
    );
  }else{
    wrapper
    .selectAll(".nodes")
    .select(".circle-main")
    .attr("stroke", d =>
      d.selected 
        ? config[theme].node.selectedColor
        : config[theme].levelRings[d.Level].stroke
    )
    .attr("stroke-width", d =>
      d.selected ? config.node.highlightThickness : config.node.thickness
    );
  }
  
};

export const updateLinks = (
  wrapper,
  filteredPaths,
  node,
  config,
  mouseAction,
  theme = "dark",
  extended = true,
  showLines = true
) => {
  const ring4Level = config.levelCounts - 1;
  if(mouseAction === global.MOUSE_EVENT_TYPE.SELECT) {    
    wrapper.selectAll(".links").each(function(d) {
      d.selected = false;
    });
    wrapper.selectAll(".links").each(function(d) {
      if (filteredPaths.paths.map(e => e.id).includes(d.id)) {
        d.selected = true;
        d.selected_color = filteredPaths.color;
      } else {
        d.selected = false;
        d.selected_color = config[theme].link.color;
      }
    });
  }

  wrapper
    .selectAll(".links")
    .attr("d", d => `M${d.source.x} ${d.source.y}L${d.target.x} ${d.target.y}`)
    .style("stroke", d =>
      d.keeped ? d.selected ? d.selected_color : config[theme].link.animColor : config[theme].link.color
    )
    .style("stroke-width", d =>
      d.keeped ? config.link.thickness * 2 : config.link.thickness
    )
    .style("opacity", d => {
      if (showLines) {
        return d.source.Level === ring4Level ? config.node.finalRingDefaultOpacity : 1;
      } else {
        if (d.keeped) {
          return d.source.Level === ring4Level ? config.node.finalRingDefaultOpacity : 1;
        }
        return 0;
      }
    });
    
  if (extended) {
    wrapper.selectAll(".links").style("visibility", "visible");
  } else {
    wrapper
      .selectAll(".links")
      .style("visibility", d =>
        d.source.Level === ring4Level || d.target.Level === ring4Level
          ? "hidden"
          : "visible"
      );
  }
  
  if (!node) return;

  if (mouseAction === global.MOUSE_EVENT_TYPE.CLICK) {
    const flatted = filteredPaths.flat().map(d => d.id);

    wrapper.selectAll(".links").each(function(d) {
      d.keeped = false;
      d.selected = false;
      d.selected_color = "transparent";
    });

    wrapper.selectAll(".links").each(function(d) {
      if (flatted.includes(d.id)) {
        d.keeped = true;
      } else {
        d.keeped = false;
      }
    });
  }

  wrapper
    .selectAll(".links")
    .style("stroke", d => {
      if( d.selected) return d.selected_color;
      if (d.keeped) return config[theme].link.animColor;
      if (d.node1 === node.id || d.node2 === node.id) {
        return config[theme].link.selectedColor;
      }
      return config[theme].link.color;
    })
    .style("stroke-width", d => {
      if (d.keeped) return config.link.thickness * 2;
      if (d.node1 === node.id || d.node2 === node.id) {
        return config.link.thickness * 2;
      } else {
        return config.link.thickness;
      }
    })
    .style("opacity", d => {
      if (d.keeped || d.selected)
        return d.source.Level === ring4Level ? config.node.finalRingDefaultOpacity : 1;
      if (d.node1 === node.id || d.node2 === node.id) {
        if (d.source.Level === ring4Level) {
          return config.node.finalRingHoverOpacity;
        }
        return 1;
      } else {
        if (d.source.Level === ring4Level) {
          return showLines ? config.node.finalRingDefaultOpacity : 0;
        } else {
          return showLines ? 1 : 0;
        }
      }
    });
};
