import React from "react";
import { Viewer } from "../../components/Viewer";
import { PackingViewer } from "../../components/PackingViewer";
import global from "../../global";
import data from "../../data/sample_expanded.json";
import data2 from "../../data/nightingale_w4_icons.json";

function HomePage() {
  return (
    <div
      className="HomePage"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center"
      }}
    >
      {/* <PackingViewer
        data={data}
        width={1600}
        height={900}
        config={{
          duration: 1000,
          nodeSize: 18,
          thickness: 3,
          linkColor: "rgba(255, 255, 255, 0.4)",
          backgroundColor: "#2f3d50",
          groupBorderColor: "rgb(245, 245, 245, 0.7)",
          groupFillColor: "rgba(245, 245, 245, 0.05)",
          levelCircles: {
            level0: {
              radius: 0,
              fill: "transparent",
              nodeColor: "yellow",
              stroke: "#bc464b",
              distance: 0
            },
            level1: {
              radius: 100,
              fill: "rgba(223, 212, 208, 0.3)",
              nodeColor: "#aa302a",
              nodeStroke: "#bc403c",
              stroke: "#bc464b",
              distance: 100
            },
            level2: {
              radius: 200,
              fill: "rgba(230, 232, 228, 0.3)",
              nodeColor: "#b58e2e",
              nodeStroke: "#d1aa39",
              stroke: "#d98f39",
              distance: 200
            },
            level3: {
              radius: 300,
              fill: "rgba(231, 244, 251, 0.3)",
              nodeColor: "#233548",
              nodeStroke: "#37495c",
              stroke: "#35475a",
              distance: 300
            }
          }
        }}
      /> */}
      <Viewer
        data={data2}
        width={1600}
        height={900}
        config={{
          duration: 600,
          nodeSize: 10,
          thickness: 3,
          linkColor: "#888",
          highlightColor: "white",
          linkHighlightColor: "#888",
          linkEffectColor: "white",
          nodeSizeStep: 1,
          backgroundColor: "#131f26",
          nodeTextColor: "white",
          baseRadius: 15,
          levelCounts: 5,
          ring4DefaultOpacity: 0.1,
          ring4HoverOpacity: 0.5,
          defaultFontSize: 12,
          levelCircles: [
            {
              fill: global.color.MEDIUM.light,
              nodeColor: global.color.MEDIUM.main,
              nodeStroke: global.color.MEDIUM.light,
              stroke: global.color.MEDIUM.main
            },
            {
              fill: global.color.CRITICAL.light,
              nodeColor: global.color.CRITICAL.main,
              nodeStroke: global.color.CRITICAL.light,
              stroke: global.color.CRITICAL.main
            },
            {
              fill: global.color.HIGH.light,
              nodeColor: global.color.HIGH.main,
              nodeStroke: global.color.HIGH.light,
              stroke: global.color.HIGH.main
            },
            {
              fill: global.color.LOW.light,
              nodeColor: global.color.LOW.main,
              nodeStroke: global.color.LOW.light,
              stroke: global.color.LOW.main
            },
            {
              fill: 'transparent',
              nodeColor: "rgb(255, 0, 255)",
              nodeStroke: "rgb(255, 0, 255, 0.5)",
              stroke: 'none',
            }
          ]
        }}
      />
    </div>
  );
}

export default HomePage;
