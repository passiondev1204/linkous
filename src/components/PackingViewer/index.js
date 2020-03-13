import React from "react";
import * as d3 from "d3";
import nextId from "react-id-generator";
import { makeStyles, Popover, MenuItem } from "@material-ui/core";
import { AlertDialog, NameDialog, ImpactDialog } from "../Dialogs";
import { SearchInputBox } from "../SearchInputBox";
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
    fontWeight: 500,
    marginRight: theme.spacing(1)
  },
  descSection: {}
}));

// const zoom = d3.zoom();

export const PackingViewer = React.memo(({ data, width, height, config }) => {
  const classes = useStyles();

  const svgRef = React.useRef();
  const selectedRangerRef = React.useRef();  
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

  const onSearch = searchText => {
    d3.selectAll(".node").each(function(d) {
      const finded = Object.values(d).find(
        value =>
          typeof value === "string" &&
          searchText &&
          value.toLowerCase().includes(searchText.toLowerCase())
      );
      if (finded) {
        d3.select(this)
          .style("stroke", "white")
          .attr("stroke-width", config.thickness);
      } else {
        d3.select(this)
          .style("stroke", config.levelCircles["level" + d.level].nodeStroke)
          .attr("stroke-width", config.thickness * 0.5);
      }
    });

    d3.selectAll(".range-circle").each(function(d) {
      const finded = Object.values(d).find(
        value =>
          typeof value === "string" &&
          searchText &&
          value.toLowerCase().includes(searchText.toLowerCase())
      );
      if (finded) {
        d3.select(this).style("stroke", "white");
      } else {
        d3.select(this).style(
          "stroke",
          d.impact ? global.color[d.impact].main : config.rangerBorderColor
        );
      }
    });
  };

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
      if (selectedRangerRef.current) {
        d3.select(`.rc-${selectedRangerRef.current.id}`).remove();
        d3.select(`.rc-text-${selectedRangerRef.current.id}`).remove();
        data.rangers = data.rangers.filter(
          e => e.id !== selectedRangerRef.current.id
        );
      }
    } else if (confirmTypeRef.current === "name") {
      data.rangers.find(({ id }) => id === selectedRangerRef.current.id).name =
        selectedNameRef.current;
      d3.select(`.rc-text-${selectedRangerRef.current.id}`).text(
        selectedNameRef.current
      );
      setShowNameDialog(false);
    } else if (confirmTypeRef.current === "impact") {
      data.rangers.find(
        ({ id }) => id === selectedRangerRef.current.id
      ).impact = selectedImpactRef.current;
      d3.select(`.rc-${selectedRangerRef.current.id}`)
        .style("stroke", global.color[selectedImpactRef.current].main)
        .style("fill", global.color[selectedImpactRef.current].light);

      d3.select(`.rc-text-${selectedRangerRef.current.id}`).attr(
        "fill",
        global.color[selectedImpactRef.current].main
      );
      setShowImpactDialog(false);
    }
    console.log(data.rangers, "changed data.rangers");
    setShowAlertDialog(false);
    setMenuAnchorEl(null);
  };

  // React.useEffect(() => {
  //   d3.select(svgRef.current).call(zoom.transform, d3.zoomIdentity);
  //   d3.select(svgRef.current).call(
  //     zoom.on("zoom", function() {
  //       d3.select(".graph").attr("transform", d3.event.transform);
  //     })
  //   );
  // }, []);

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
      moving = false,
      ranger_id = 0,
      cx = width / 2,
      cy = height / 2;

    //initial data loading
    data.links = data.links
      .map(link => ({
        ...link,
        source: data.nodes.find(({ id }) => id === link.node1),
        target: data.nodes.find(({ id }) => id === link.node2)
      }))
      .filter(link => link.source || link.target);

    const graph = d3.select(".graph");
    graph.selectAll("*").remove();

    const graphRanger = graph.append("g");
    graphRanger
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .style("fill", config.backgroundColor);

    graphRanger.call(
      d3
        .drag()
        .on("start", rangeDragStart)
        .on("drag", rangeDragging)
        .on("end", rangeDragEnd)
    );

    //initial ranger load
    graphRanger
      .selectAll(".range-circle")
      .data(data.rangers)
      .enter()
      .append("circle")
      .attr("class", d => `range-circle rc-${d.id}`)
      .attr("cx", d => d.cx)
      .attr("cy", d => d.cy)
      .style("stroke", d =>
        d.impact ? global.color[d.impact].main : config.rangerBorderColor
      )
      .attr("stroke-width", config.thickness)
      .style("fill", d =>
        d.impact ? global.color[d.impact].light : config.rangerFillColor
      )
      .attr("r", d => d.r)
      .on("dblclick", rangeDblClick)
      .on("mouseover", rangeMouseOver)
      .on("mouseout", rangeMouseOut)
      .on("contextmenu", rangeContextMenu);
    graphRanger
      .selectAll(".range-circle-text")
      .data(data.rangers)
      .enter()
      .append("text")
      .attr("class", d => `range-circle-text rc-text-${d.id}`)
      .attr("x", d => d.cx)
      .attr("y", d => d.cy)
      .attr("fill", d =>
        d.impact ? global.color[d.impact].main : config.rangerBorderColor
      )
      .attr("font-size", 18)
      .attr("font-weight", "bold")
      .style("pointer-events", "none")
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "center")
      .text(d => d.name || "");    

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
      .style("fill", d => config.levelCircles["level" + d.level].nodeColor)
      .attr("stroke-width", config.thickness * 0.5)
      .style("stroke", d => config.levelCircles["level" + d.level].nodeStroke)
      .style("cursor", "pointer")
      .attr("cx", 0)
      .attr("cy", 0)
      .style("opacity", 0)
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .call(
        d3
          .drag()
          .on("start", nodeDragStart)
          .on("drag", nodeDragging)
          .on("end", nodeDragEnd)
      )
      .transition()
      .duration(config.duration)
      .style("opacity", 1)
      .attr("r", config.nodeSize)
      .attr("cx", (d, i) => {
        if(!d.cx){
          if(d.level === 0){
            d.cx = 0;
          } else {
            d.cx = getCenter(d, i).cx;
          }
        }
        return d.cx;
      })
      .attr("cy", (d, i) => {
        if(!d.cy){
          if(d.level === 0){
            d.cy = 0;
          } else {
            d.cy = getCenter(d, i).cy;
          }
        }
        return d.cy;
      });

    nodesWrapper
      .selectAll(".node-text")
      .data(data.nodes)
      .enter()
      .append("text")
      .attr("class", d => `node-text node-circle-text-${d.id}`)
      .attr("text-anchor", "middle")
      .style("opacity", 0)
      .style("font-size", 12)
      .style("fill", "white")
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
      .style("stroke", config.linkColor)
      .attr("stroke-width", config.thickness * 0.5);
    
    nodesWrapper.raise();

    //ranger mouse events
    function rangeDragStart(d) {
      if (moving) return;
      dragging = true;
      const m = d3.mouse(this);
      line = graphRanger
        .append("line")
        .style("stroke", config.rangerBorderColor)
        .attr("x1", m[0])
        .attr("y1", m[1])
        .attr("x2", m[0])
        .attr("y2", m[1]);
      ranger_id = nextId("ranger-");
      data.rangers.push({ id: ranger_id });
      circle = graphRanger
        .selectAll(".range-circle")
        .data(data.rangers)
        .enter()
        .append("circle")
        .attr("class", `range-circle rc-${ranger_id}`)
        .attr("cx", d => (d.cx = m[0]))
        .attr("cy", d => (d.cy = m[1]))
        .style("stroke", config.rangerBorderColor)
        .attr("stroke-width", config.thickness)
        .style("fill", config.rangerFillColor)
        .attr("r", d => (d.r = 0))
        .on("dblclick", rangeDblClick)
        .on("mouseover", rangeMouseOver)
        .on("mouseout", rangeMouseOut)
        .on("contextmenu", rangeContextMenu);
    }
    function rangeDragging(d) {
      const m = d3.mouse(this);
      if (moving) {
        d3.select(`.rc-${selectedRangerRef.current.id}`)
          .attr("cx", d => (d.cx = m[0]))
          .attr("cy", d => (d.cy = m[1]));
        d3.select(`.rc-text-${selectedRangerRef.current.id}`)
          .attr("x", m[0])
          .attr("y", m[1]);
      } else {
        line.attr("x2", m[0]).attr("y2", m[1]);
        circle.attr("r", d => (d.r = utils.distance(d.cx, d.cy, m[0], m[1])));
      }
    }
    function rangeDragEnd(d) {
      d3.selectAll(".node").style("pointer-events", "auto");
      dragging = false;
      if (moving) {
        d3.select(`.rc-${selectedRangerRef.current.id}`).attr(
          "cursor",
          "normal"
        );
        moving = false;
      }
      line.remove();
      const cx = circle.attr("cx"),
        cy = circle.attr("cy"),
        radius = circle.attr("r");
      if (radius > config.nodeSize * 1.5) {
        graphRanger
          .append("text")
          .attr("class", `range-circle-text rc-text-${ranger_id}`)
          .attr("x", cx)
          .attr("y", cy)
          .attr("fill", config.rangerBorderColor)
          .attr("font-size", 18)
          .attr("font-weight", "bold")
          .style("pointer-events", "none")
          .attr("text-anchor", "middle")
          .attr("alignment-baseline", "center");
      } else {
        data.rangers = data.rangers.filter(cr => cr.id !== ranger_id);
        circle.remove();
      }
      graphRanger.on("mousemove", null);
    }
    function rangeDblClick(d) {
      moving = true;
      selectedRangerRef.current = d;
      d3.select(this).attr("cursor", "move");
    }
    function rangeMouseOver(d) {
      d3.select(this).style("stroke", "white");
    }
    function rangeMouseOut(d) {
      d3.select(this).style(
        "stroke",
        d.impact ? global.color[d.impact].main : config.rangerBorderColor
      );
    }
    function rangeContextMenu(d) {
      d3.event.preventDefault();
      selectedRangerRef.current = d;
      setMenuAnchorEl(d3.event.currentTarget);
    }
    //node mouse events
    function nodeDragStart(d) {
      setTooltipAnchorEl(null);
    }
    function nodeDragging(d) {
      dragging = true;
      nodesWrapper
        .select(`.node-circle-${d.id}`)
        .attr("cx", d => (d.cx = d3.mouse(this)[0]))
        .attr("cy", d => (d.cy = d3.mouse(this)[1]));
      nodesWrapper
        .select(`.node-circle-text-${d.id}`)
        .attr("x", d.cx)
        .attr("y", d.cy - config.circleTextOffset);

      data.links
        .filter(link => link.node1 === d.id || link.node2 === d.id)
        .forEach(link => {
          linksWrapper
            .select(`.link-${link.node1}-${link.node2}`)
            .attr(
              "d",
              `M${link.source.cx} ${link.source.cy}L${link.target.cx} ${link.target.cy}`
            );
        });
    }
    function nodeDragEnd(d) {
      dragging = false;
      d3.select(this).style("pointer-events", "auto");
      d3.select(this).raise();
    }
    function nodeMouseOver(d) {
      if (dragging || moving) {
        d3.select(this).style("pointer-events", "none");
        return;
      }
      tooltipContentRef.current = d;
      setTooltipAnchorEl(d3.event.currentTarget);
      d3.select(this)
        .style("stroke", "white")
        .attr("stroke-width", config.thickness);
      data.links
        .filter(link => link.node1 === d.id || link.node2 === d.id)
        .forEach(link => {
          linksWrapper
            .select(`.link-${link.node1}-${link.node2}`)
            // .transition()
            // .duration(config.duration / 2)
            .style("stroke", "white")
            .attr("stroke-width", config.thickness);
        });
    }
    function nodeMouseOut(d) {
      if (dragging || moving) return;
      setTooltipAnchorEl(null);
      d3.select(this)
        .style("stroke", config.levelCircles["level" + d.level].nodeStroke)
        .attr("stroke-width", 1);
      data.links
        .filter(link => link.node1 === d.id || link.node2 === d.id)
        .forEach(link => {
          linksWrapper
            .select(`.link-${link.node1}-${link.node2}`)
            .style("stroke", config.linkColor)
            .attr("stroke-width", config.thickness * 0.5);
        });
    }
  }, [data, config, width, height]);

  return (
    <>
      <SearchInputBox onSearch={onSearch} />
      <svg ref={svgRef} width={width} height={height}>
        <g className="graph" />
      </svg>
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
          content={selectedRangerRef.current.name || ""}
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
          content={selectedRangerRef.current.impact || ""}
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
});
