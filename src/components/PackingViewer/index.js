import React from "react";
import * as d3 from "d3";
import { makeStyles, Popover, MenuItem } from "@material-ui/core";
import { AlertDialog, NameDialog, ImpactDialog } from "../Dialogs";
import { Wrapper } from "../Wrapper";
import utils from "../../utils";
import global from "../../global";

const useStyles = makeStyles(theme => ({
  popover: {
    pointerEvents: "none",
    marginTop: theme.spacing(1)
  },
  paper: {
    padding: theme.spacing(1)
  },
  titleSection: {
    fontWeight: "bold",
    marginRight: theme.spacing(1)
  },
  descSection: {

  }
}));

export const PackingViewer = ({ data, width, height, config }) => {
  const classes = useStyles();

  const svgRef = React.useRef();
  const selectedCircleRef = React.useRef();
  const circleRangersRef = React.useRef([]);
  const confirmTypeRef = React.useRef();
  const dlgContentRef = React.useRef(null);
  const tooltipContentRef = React.useRef(null);

  const selectedNameRef = React.useRef("");
  const selectedImpactRef = React.useRef("");

  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const [tooltipAnchorEl, setTooltipAnchorEl] = React.useState(null);
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
      dragging = false,
      movable = false,
      cr_index = 0,
      cx = width / 2,
      cy = height / 2;

    data.links = data.links
      .map(link => ({
        ...link,
        source: data.nodes.find(({ id }) => id === link.node1),
        target: data.nodes.find(({ id }) => id === link.node2)
      }))
      .filter(link => link.source || link.target);

    d3.select(svgRef.current)
      .selectAll("*")
      .remove();

    const graph = d3.select(svgRef.current);
    const graphRanger = graph.append("g");
    graphRanger.call(
      d3
        .drag()
        .on("start", function() {
          if (movable) return;
          dragging = true;
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
            .attr("cx", d => (d.cx = m[0]))
            .attr("cy", d => (d.cy = m[1]))
            .attr("fill", config.rangerFillColor)
            .attr("stroke", config.rangerBorderColor)
            .attr("stroke-width", 3)
            .attr("r", d => (d.r = 0))
            .on("dblclick", function(d) {
              movable = true;
              selectedCircleRef.current = d;
              d3.select(this).attr("fill", config.rangerFillColor);
              d3.select(this).attr("cursor", "move");
            })
            .on("mouseover", function(d) {
              if (dragging) return;
              if (movable) return;
              d3.select(this).attr("fill", "rgba(255, 255, 255, 0.2)");
            })
            .on("mouseout", function(d) {
              d3.select(this).attr("fill", config.rangerFillColor);
            })
            .on("contextmenu", function(d) {
              d3.event.preventDefault();
              selectedCircleRef.current = d;
              setMenuAnchorEl(d3.event.currentTarget);
            });
        })
        .on("drag", function() {
          const m = d3.mouse(this);
          if (movable) {
            d3.select(`.rc-${selectedCircleRef.current.id}`)
              .attr("cx", d => (d.cx = m[0]))
              .attr("cy", d => (d.cy = m[1]));
            d3.select(`.rc-text-${selectedCircleRef.current.id}`)
              .attr("x", m[0])
              .attr("y", m[1]);
          } else {
            line.attr("x2", m[0]).attr("y2", m[1]);
            circle.attr(
              "r",
              d => (d.r = utils.distance(d.cx, d.cy, m[0], m[1]))
            );
          }
        })
        .on("end", function() {
          dragging = false;
          if (movable) {
            d3.select(`.rc-${selectedCircleRef.current.id}`).attr(
              "cursor",
              "normal"
            );
            movable = false;
          }
          line.remove();
          const cx = circle.attr("cx"),
            cy = circle.attr("cy"),
            radius = circle.attr("r");
          if (radius > config.nodeSize * 1.5) {
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
          } else {
            circleRangersRef.current = circleRangersRef.current.filter(
              cr => cr.id !== cr_index
            );
            circle.remove();
          }
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

    nodesWrapper
      .selectAll(".node")
      .data(data.nodes)
      .enter()
      .append("circle")
      .attr("class", d => `node node-circle-${d.id}`)
      .attr("fill", d => config.levelCircles["level" + d.level].nodeColor)
      .attr("stroke-width", config.thickness * 0.5)
      .attr("stroke", d => config.levelCircles["level" + d.level].nodeStroke)
      .style("cursor", "pointer")
      .attr("cx", 0)
      .attr("cy", 0)
      .style("opacity", 0)
      .on("mouseover", function(d) {
        if(dragging || movable) return;
        tooltipContentRef.current = d;
        setTooltipAnchorEl(d3.event.currentTarget);
      })
      .on("mouseout", () => {
        if(dragging || movable) return;
        setTooltipAnchorEl(null);
      })
      .call(
        d3
          .drag()
          .on("drag", function(d) {
            dragging = true;
            nodesWrapper
              .select(`.node-circle-${d.id}`)
              .attr("cx", d => (d.cx = d3.mouse(this)[0]))
              .attr("cy", d => (d.cy = d3.mouse(this)[1]));
            nodesWrapper
              .select(`.node-circle-text-${d.id}`)
              .attr("x", d.cx)
              .attr("y", d.cy - config.circleTextOffset);
            const links = data.links.filter(
              link => link.node1 === d.id || link.node2 === d.id
            );
            links.forEach(link => {
              linksWrapper
                .select(`.link-${link.node1}-${link.node2}`)
                .attr(
                  "d",
                  `M${link.source.cx} ${link.source.cy}L${link.target.cx} ${link.target.cy}`
                );
            });
          })
          .on("end", function(d) {
            dragging = false;
            d3.select(this).raise();
          })
      )
      .transition()
      .duration(config.duration)
      .style("opacity", 1)
      .attr("r", config.nodeSize)
      .attr("cx", (d, i) => (d.cx = getCenter(d, i).cx))
      .attr("cy", (d, i) => (d.cy = getCenter(d, i).cy));

    nodesWrapper
      .selectAll(".node-text")
      .data(data.nodes)
      .enter()
      .append("text")
      .attr("class", d => `node-text node-circle-text-${d.id}`)
      .attr("text-anchor", "middle")
      .style("opacity", 0)
      .style("font-size", 12)
      .attr("fill", "white")
      .style("pointer-events", "none")
      .raise()
      .transition()
      .duration(config.duration)
      .style("opacity", 1)
      .attr("x", d => d.cx)
      .attr("y", d => d.cy - config.circleTextOffset)
      .text(d => d.name);

    linksWrapper
      .selectAll(".link-g")
      .data(data.links)
      .enter()
      .append("path")
      .attr("class", d => `link link-${d.source.id}-${d.target.id}`)
      .attr("d", `M0 0L0 0`)
      .transition()
      .duration(config.duration)
      .style("pointer-events", "none")
      .attr(
        "d",
        d => `M${d.source.cx} ${d.source.cy}L${d.target.cx} ${d.target.cy}`
      )
      .attr("stroke", config.linkColor)
      .attr("stroke-width", config.thickness * 0.5);

    nodesWrapper.raise();
  }, [data, config, width, height]);

  return (
    <>
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
            <Wrapper height="auto" direction="column" className={classes.titleSection}>
              <span>Name</span>
              <span>IP</span>
              <span>Mask</span>
              <span>RS</span>
              <span>RCE</span>
              <span>LPE</span>
              <span>Config</span>
            </Wrapper>
            <Wrapper height="auto" direction="column" className={classes.descSection}>
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
    </>
  );
};
