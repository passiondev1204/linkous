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
    .innerRadius(node.r * 1.05)
    .outerRadius(node.r * 1.35)
    .padAngle(counts > 1 ? 0.05 : 0);
  nodeGroup
    .selectAll('slices')
    .data(data_ready)
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", d => colors[d.data.key]);
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
  showType = "circle",
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
        config[theme].levelCircles.length - 1 === d.Level
          ? `pnode-${parentId}`
          : ""
      }`;
    })
    .style("opacity", d =>
      d.Level === ring4Level ? config.ring4DefaultOpacity : 1
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
      d.r = config.nodeSize + links_count * config.nodeSizeStep;
      return `translate(${d.x}, ${d.y})`;
    });
  
  nodesG
    .append("circle")
    .attr("fill", config[theme].levelCircles[levelNo].nodeColor)
    .attr("stroke-width", config.lineThickness)
    .attr("stroke", config[theme].levelCircles[levelNo].nodeStroke)
    .style("cursor", "pointer")
    .style("opacity", showType === "circle" ? 1 : 0)
    .attr("r", d => d.r);
  nodesG
    .append("svg:image")
    .style("cursor", "pointer")
    .attr("xlink:href", d => {
      let iconName = d.Software[0].Icon || "ei-windows";
      iconName = iconName.replace("ei-", "");
      return require(`../../assets/icons/svg/${iconName}.svg`);
    })
    .style("opacity", showType === "icon" ? 1 : 0)
    .attr("x", d => -d.r)
    .attr("y", d => -d.r)
    .attr("width", d => d.r * 2)
    .attr("height", d => d.r * 2);
  nodesG
    .append("text")
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "ideographic")
    .style("font-size", d => (d.fs = config.defaultFontSize))
    .style("fill", config[theme].nodeTextColor)
    .style("pointer-events", "none")
    .attr("dy", d => -(d.r + 5))
    .text(d => d.name)
    .raise();
  wrapper.raise();
};

export const addDonutCircles = (wrapper, nodes, config) => {
  wrapper.selectAll(".nodes").each(function(d) {
    donutCircle(d3.select(this), d, config);
  });
}

export const addNodesOfRing4 = (
  wrapper,
  nodes,
  links,
  config,
  levelInfo,
  showType = "circle",
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
      showType,
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
    .style("stroke", config[theme].linkColor)
    .style("stroke-width", config.lineThickness)
    .style("opacity", d =>
      d.source.Level === ring4Level ? config.ring4DefaultOpacity : 1
    );
};

export const updateNodes = (
  wrapper,
  nodes,
  links,
  config,
  levelInfo,
  showType = "circle",
  theme = "dark",
  extended = true,
  actionObj
) => {
  const ring4Level = config.levelCounts - 1;
  const nodesHasring4 = nodesHasRing4(nodes, links);
  
  if (showType === "circle") {
    wrapper
      .selectAll(".nodes")
      .select("circle")
      .attr("fill", d => config[theme].levelCircles[d.Level].nodeColor)
      .attr("stroke", d => config[theme].levelCircles[d.Level].nodeStroke)
      .style("opacity", 1);
    wrapper
      .selectAll(".nodes")
      .select("image")
      .style("opacity", 0);
  } else {
    wrapper
      .selectAll(".nodes")
      .select("circle")
      .style("opacity", 0);
    wrapper
      .selectAll(".nodes")
      .select("image")
      .style("opacity", 1);
  }
  wrapper
    .selectAll(".nodes")
    .select("text")
    .style("fill", config[theme].nodeTextColor);
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

  if (actionObj.action === global.MOUSE_EVENT_TYPE.EXPAND) {
    nodesHasring4.forEach(pNode => {
      let childNodes = links
        .filter(
          link =>
            link.target.id === pNode.id && link.source.Level === ring4Level
        )
        .map(d => d.source);

      let rad = childNodes.length * config.baseRadius * 0.3;
      if (actionObj.node.id === pNode.id) {
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
            ? config.ring4HoverOpacity
            : config.ring4DefaultOpacity
        );
    });    
  } 
  wrapper
    .selectAll(".nodes")
    .select("circle")
    .attr("stroke", d => d.selected
        ? config[theme].highlightColor
        : config[theme].levelCircles[d.Level].nodeStroke
      )
    .attr("stroke-width", d => d.selected ? config.lineThickness * 5 : config.lineThickness)
  
};

export const updateLinks = (
  wrapper,
  node,
  config,
  theme = "dark",
  extended = true
) => {
  const ring4Level = config.levelCounts - 1;
  wrapper
    .selectAll(".links")
    .attr("d", d => `M${d.source.x} ${d.source.y}L${d.target.x} ${d.target.y}`)
    .style("stroke", config[theme].linkColor)
    .style("stroke-width", config.lineThickness)
    .style("opacity", d =>
      d.source.Level === ring4Level ? config.ring4DefaultOpacity : 1
    );
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
  wrapper
    .selectAll(".links")
    .style("stroke", d =>
      d.node1 === node.id || d.node2 === node.id
        ? config[theme].linkHighlightColor
        : config[theme].linkColor
    )
    .style("stroke-width", d =>
      d.node1 === node.id || d.node2 === node.id
        ? config.lineThickness * 2
        : config.lineThickness
    )
    .style("opacity", d => {
      if (d.source.Level === ring4Level) {
        if (d.node1 === node.id || d.node2 === node.id) {
          return config.ring4HoverOpacity;
        }
        return config.ring4DefaultOpacity;
      }
      return 1;
    });
};
