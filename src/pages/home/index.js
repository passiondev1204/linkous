import React from "react";
import { Viewer } from "../../components/Viewer";
import { PackingViewer } from "../../components/PackingViewer";
import data from "../../data/nightingale.json";

function HomePage() {
  return (
    <div
      className="HomePage"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: 'center'
      }}
    >
      <PackingViewer
        data={data}
        width={1600}
        height={900}
        config={{
          duration: 1000,
          nodeSize: 18,
          thickness: 3,
          linkColor: "rgba(255, 255, 255, 0.4)",
          backgroundColor: "#2f3d50",
          rangerBorderColor: "rgb(245, 245, 245, 0.7)",
          rangerFillColor: "rgba(245, 245, 245, 0.05)",
          circleTextOffset: 24,
          levelCircles: {
            level0: {
              range: 0,
              fill: "transparent",
              nodeColor: "yellow",
              stroke: "#bc464b",
              distance: 0
            },
            level1: {
              range: 100,
              fill: "rgba(223, 212, 208, 0.3)",
              nodeColor: "#aa302a",
              nodeStroke: "#bc403c",
              stroke: "#bc464b",
              distance: 100
            },
            level2: {
              range: 200,
              fill: "rgba(230, 232, 228, 0.3)",
              nodeColor: "#b58e2e",
              nodeStroke: "#d1aa39",
              stroke: "#d98f39",
              distance: 200
            },
            level3: {
              range: 300,
              fill: "rgba(231, 244, 251, 0.3)",
              nodeColor: "#233548",
              nodeStroke: "#37495c",
              stroke: "#35475a",
              distance: 300
            }
          }
        }}
      />
      {/* <Viewer
        data={data}
        width={800}
        height={800}
        config={{
          duration: 1000,
          nodeSize: 12,
          thickness: 4,
          linkColor: "rgba(255, 255, 255, 0.4)",
          backgroundColor: "#131f26",
          levelCircles: {
            level0: {
              range: 0,
              fill: "transparent",
              nodeColor: "none",
              stroke: "#bc464b",
              distance: 0
            },
            level1: {
              range: 100,
              fill: "rgba(223, 212, 208, 0.3)",
              nodeColor: "#aa302a",
              nodeStroke: "#bc403c",
              stroke: "#bc464b",
              distance: 70
            },
            level2: {
              range: 200,
              fill: "rgba(230, 232, 228, 0.3)",
              nodeColor: "#b58e2e",
              nodeStroke: "#d1aa39",
              stroke: "#d98f39",
              distance: 150
            },
            level3: {
              range: 300,
              fill: "rgba(231, 244, 251, 0.3)",
              nodeColor: "#233548",
              nodeStroke: "#37495c",
              stroke: "#35475a",
              distance: 250
            }
          }
        }}
      /> */}
    </div>
  );
}

export default HomePage;
