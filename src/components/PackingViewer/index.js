import React from "react";
import * as d3 from "d3";
import { makeStyles, Popover, MenuItem } from "@material-ui/core";
import { AlertDialog, NameDialog, ImpactDialog } from "../Dialogs";

import utils from "../../utils";
import global from "../../global";
import "./index.css";

const getTooltipContent = item => {
  return `
    <div class="tooltip-content">
      <div class="title">
        <span>Name</span>
        <span>IP</span>
        <span>Mask</span>
        <span>RS</span>
        <span>RCE</span>
        <span>LPE</span>
        <span>Config</span>    
      </div>
      <div class="desc">
        <span>${item.name}</span>
        <span>${item.IP}</span>
        <span>${item.Mask}</span>
        <span>${item.RS}</span>
        <span>${item.Conditions[0].RCE}</span>
        <span>${item.Conditions[0].LPE}</span>
        <span>${item.Conditions[0].Config}</span>
      </div>
    </div>`;
};

const useStyles = makeStyles(theme => ({}));

export const PackingViewer = ({ data, width, height, config }) => {
  const classes = useStyles();

  const svgRef = React.useRef();
  const selectedCircleRef = React.useRef();
  const circleRangersRef = React.useRef([]);
  const confirmTypeRef = React.useRef();
  const dlgContentRef = React.useRef(null);

  const selectedNameRef = React.useRef("");
  const selectedImpactRef = React.useRef("");

  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  // const [tooltipAnchorEl, setTooltipAnchorEl] = React.useState(null);
  const [showAlertDialog, setShowAlertDialog] = React.useState(false);
  const [showNameDialog, setShowNameDialog] = React.useState(false);
  const [showImpactDialog, setShowImpactDialog] = React.useState(false);

  const onDeleteItem = () => {
    confirmTypeRef.current = "delete";
    dlgContentRef.current = "Are you sure you want to delete this circle?";
    setShowAlertDialog(true);
  };

  const onNameItem = () => {
    confirmTypeRef.current = "name";
    dlgContentRef.current = "Are you sure you want to rename this circle?";
    setShowNameDialog(true);
  };

  const onSaveName = newName => {
    selectedNameRef.current = newName;
    setShowAlertDialog(true);
  };

  const onAssignItem = () => {
    confirmTypeRef.current = "impact";
    dlgContentRef.current = "Are you sure you want to assign this impact?";
    setShowImpactDialog(true);
  };

  const onSaveImpact = impact => {
    selectedImpactRef.current = impact;
    setShowAlertDialog(true);
  };

  const onInfoItem = () => {
    setMenuAnchorEl(null);
  };

  const onConfirm = () => {
    if (confirmTypeRef.current === "delete") {
      if (selectedCircleRef.current) {
        d3.select(`.rc-${selectedCircleRef.current.id}`).remove();
        d3.select(`.rc-text-${selectedCircleRef.current.id}`).remove();
        circleRangersRef.current = circleRangersRef.current.filter(
          e => e.id !== selectedCircleRef.current.id
        );
      }
    } else if (confirmTypeRef.current === "name") {
      circleRangersRef.current.find(
        ({ id }) => id === selectedCircleRef.current.id
      ).name = selectedNameRef.current;
      d3.select(`.rc-text-${selectedCircleRef.current.id}`).text(
        selectedNameRef.current
      );
      setShowNameDialog(false);
    } else if (confirmTypeRef.current === "impact") {
      circleRangersRef.current.find(
        ({ id }) => id === selectedCircleRef.current.id
      ).impact = selectedImpactRef.current;
      d3.select(`.rc-${selectedCircleRef.current.id}`).attr(
        "stroke",
        global.color.impact[selectedImpactRef.current]
      );
      d3.select(`.rc-text-${selectedCircleRef.current.id}`).style(
        "fill",
        global.color.impact[selectedImpactRef.current]
      );
      setShowImpactDialog(false);
    }
    console.log(circleRangersRef.current, "changed circleRangersRef.current");
    setShowAlertDialog(false);
    setMenuAnchorEl(null);
  };

  React.useEffect(() => {
    const getCenter = (node, index) => {
      const angle =
        (index / data.nodes.filter(e => e.level === node.level).length) *
        Math.PI;
      return {
        cx:
          config.levelCircles["level" + node.level].distance *
          Math.cos(angle * 2),
        cy:
          config.levelCircles["level" + node.level].distance *
          Math.sin(angle * 2)
      };
    };
    let line,
      circle,
      cr_index = 0,
      cx = width / 2,
      cy = height / 2;

    d3.select(svgRef.current)
      .selectAll("*")
      .remove();

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip");

    const graph = d3.select(svgRef.current);
    const graphRanger = graph.append("g");
    graphRanger.call(
      d3
        .drag()
        .on("start", function() {
          tooltip.style("opacity", 0);
          const m = d3.mouse(this);
          line = graphRanger
            .append("line")
            .attr("stroke", "white")
            .attr("x1", m[0])
            .attr("y1", m[1])
            .attr("x2", m[0])
            .attr("y2", m[1]);
          circleRangersRef.current.push({ id: cr_index });
          circle = graphRanger
            .selectAll(".range-circle")
            .data(circleRangersRef.current)
            .enter()
            .append("circle")
            .attr("class", `range-circle rc-${cr_index}`)
            .attr("cx", m[0])
            .attr("cy", m[1])
            .attr("fill", config.rangerFillColor)
            .attr("stroke", config.rangerBorderColor)
            .attr("stroke-width", 3)
            .attr("r", 0)
            .on("contextmenu", function(d) {
              d3.event.preventDefault();
              selectedCircleRef.current = d;
              setMenuAnchorEl(d3.event.currentTarget);
            });
        })
        .on("drag", function() {
          tooltip.style("opacity", 0);
          const m = d3.mouse(this);
          line.attr("x2", m[0]).attr("y2", m[1]);
          const cx = circle.attr("cx"),
            cy = circle.attr("cy");
          circle.attr("r", utils.distance(cx, cy, m[0], m[1]));
        })
        .on("end", function() {
          line.remove();
          const cx = circle.attr("cx"),
            cy = circle.attr("cy");
          graphRanger
            .append("text")
            .attr("class", `rc-text-${cr_index}`)
            .attr("x", cx)
            .attr("y", cy)
            .attr("font-size", 18)
            .attr("font-weight", "bold")
            .style("fill", config.rangerBorderColor)
            .style("pointer-events", "none")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "center");
          cr_index++;
          graphRanger.on("mousemove", null);
        })
    );

    graphRanger
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", config.backgroundColor);

    const chainGraph = graph
      .append("g")
      .attr("transform", `translate(${cx}, ${cy})`);

    const nodesWrapper = chainGraph.append("g").attr("class", "nodes-wrapper");
    const linksWrapper = chainGraph.append("g").attr("class", "links-wrapper");

    const nodes = nodesWrapper
      .selectAll(".node")
      .data(data.nodes)
      .enter()
      .append("g")
      .call(
        d3
          .drag()
          .on("start", function(d) {
            const m = d3.mouse(this);
            nodesWrapper
              .select(`.node-circle-${d.id}`)
              .attr("cx", m[0])
              .attr("cy", m[1]);
            tooltip.style("opacity", 0);
          })
          .on("drag", function(d) {
            tooltip.style("opacity", 0);
            const m = d3.mouse(this);
            nodes
              .select(`.node-circle-${d.id}`)
              .attr("cx", m[0])
              .attr("cy", m[1]);

            const links = data.links.filter(
              link => link.node1 === d.id || link.node2 === d.id
            );
            links.forEach(link => {
              const node1Center = {
                cx: d3.select(`.node-circle-${link.node1}`).attr("cx"),
                cy: d3.select(`.node-circle-${link.node1}`).attr("cy")
              };
              const node2Center = {
                cx: d3.select(`.node-circle-${link.node2}`).attr("cx"),
                cy: d3.select(`.node-circle-${link.node2}`).attr("cy")
              };
              linksWrapper
                .select(`.link-${link.node1}-${link.node2}`)
                .attr(
                  "d",
                  `M${node1Center.cx} ${node1Center.cy}L${node2Center.cx} ${node2Center.cy}`
                );
            });
          })
          .on("end", function(d) {
            d3.select(this).raise();
          })
      );

    nodes
      .append("circle")
      .attr("class", d => `node node-circle-${d.id}`)
      .attr("fill", d => config.levelCircles["level" + d.level].nodeColor)
      .attr("stroke-width", config.thickness * 0.5)
      .attr("stroke", d => config.levelCircles["level" + d.level].nodeStroke)
      .style("cursor", "pointer")
      .attr("r", config.nodeSize)
      .style("opacity", 0)
      .on("mouseover", function(d, i) {
        const cx = d3.select(this).attr("cx"),
          cy = d3.select(this).attr("cy");
        tooltip.style("opacity", 1).html(getTooltipContent(d));
        const tooltipWidth = Math.ceil(parseFloat(tooltip.style("width")));
        const marginLeftFromScreen = document.getElementsByClassName(
          "svgWrapper"
        )[0];
        tooltip
          .style(
            "left",
            marginLeftFromScreen.offsetLeft +
              parseFloat(cx) +
              width / 2 -
              tooltipWidth / 2 +
              "px"
          )
          .style(
            "top",
            parseFloat(cy) + height / 2 + config.nodeSize * 2 + "px"
          );
      })
      .on("mouseout", () => {
        d3.select(".tooltip").style("opacity", 0);
      })
      .transition()
      .duration(config.duration)
      .style("opacity", 1)
      .attr("cx", (d, i) => getCenter(d, i).cx)
      .attr("cy", (d, i) => getCenter(d, i).cy);

    setTimeout(() => {
      linksWrapper
        .selectAll(".link")
        .data(data.links)
        .enter()
        .append("path")
        .attr("class", d => `link link-${d.node1}-${d.node2}`)
        .attr(
          "d",
          d =>
            `M${d3.select(`.node-circle-${d.node1}`).attr("cx")} ${d3
              .select(`.node-circle-${d.node1}`)
              .attr("cy")}L${d3
              .select(`.node-circle-${d.node2}`)
              .attr("cx")} ${d3.select(`.node-circle-${d.node2}`).attr("cy")}`
        )
        .attr("stroke", config.linkColor)
        .attr("stroke-width", config.thickness * 0.5);

      nodesWrapper.raise();
    }, config.duration);
  }, [data, config, width, height]);

  return (
    <div className="svgWrapper" style={{ border: "1px solid grey" }}>
      <svg ref={svgRef} width={width} height={height} className="viewer" />
      <Popover
        id="menu-popover"
        anchorOrigin={{
          vertical: "center",
          horizontal: "center"
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center"
        }}
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
      >
        <MenuItem onClick={onNameItem}>Name</MenuItem>
        <MenuItem onClick={onAssignItem}>Assign</MenuItem>
        <MenuItem onClick={onInfoItem}>Info</MenuItem>
        <MenuItem onClick={onDeleteItem}>Delete</MenuItem>
      </Popover>
      {/* <Popover
        id="tooltip-popover"
        className={classes.popover}
        classes={{
          paper: classes.paper,
        }}
        open={Boolean(tooltipAnchorEl)}
        anchorEl={tooltipAnchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        onClose={() => setTooltipAnchorEl(null)}
        disableRestoreFocus
      >
        <Typography>I use Popover.</Typography>
      </Popover> */}
      {showAlertDialog && (
        <AlertDialog
          open={showAlertDialog}
          title="Are you sure?"
          contents={dlgContentRef.current}
          onYes={onConfirm}
          onNo={() => {
            setMenuAnchorEl(null);
            setShowAlertDialog(false);
            setShowNameDialog(false);
          }}
        />
      )}
      {showNameDialog && (
        <NameDialog
          content={selectedCircleRef.current.name || ""}
          open={showNameDialog}
          onSave={onSaveName}
          onCancel={() => {
            setMenuAnchorEl(null);
            setShowNameDialog(false);
          }}
        />
      )}
      {showImpactDialog && (
        <ImpactDialog
          content={selectedCircleRef.current.impact || ""}
          open={showImpactDialog}
          onSave={onSaveImpact}
          onCancel={() => {
            setMenuAnchorEl(null);
            setShowImpactDialog(false);
          }}
        />
      )}
    </div>
  );
};
