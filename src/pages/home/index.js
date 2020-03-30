import React from "react";
import { Viewer } from "../../components/Viewer";
import { PackingViewer } from "../../components/PackingViewer";
import global from "../../global";
// import data from "../../data/sample_expanded.json";
import data2 from "../../data/nightingale_w45_icons .json";

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
          baseRadius: 15,
          levelCounts: 5,
          defaultFontSize: 13,
          lensBorderColor: "grey",
          Conditions: {
            NONE: "rgb(204, 204, 204)",
            RCE: "rgb(214, 77, 5)",
            LPE: "rgb(242, 193, 0)",
            Exposed: "rgb(14, 6, 15)",
            Domain: "rgb(5, 87, 221)",
            Config: "rgb(0, 151, 246)",
          },
          node: {
            size: 15,
            thickness: 1,
            highlightThickness: 3,
            sizeStep: 1,
            finalRingDefaultOpacity: 0.1,
            finalRingHoverOpacity: 0.5,            
          },
          link: {
            thickness: 1.5,
          },
          dark: {
            backgroundColor: "rgb(19, 31, 38)",
            levelRingOpacity: 0.5,
            node: {
              color: "rgb(30, 30, 44)",
              hoverColor: 'rgba(255, 255, 255, 0.1)',
              selectedColor: 'rgb(255, 255, 255)',
              iconColor: "rgb(255, 255, 255)",
              textColor: "rgb(255, 255, 255)",
            },
            link: {
              color: "rgba(255, 255, 255, 0.25)",
              selectedColor: "rgba(255, 255, 255, 0.25)",
              animColor: "rgba(255, 255, 255, 0.7)"
            },
            levelRings: [
              {
                fill: "rgba(0, 113, 188, 0.1)",                
                stroke: "rgb(0, 113, 188)"
              },
              {
                fill: "rgba(229, 7, 7, 0.1)",
                stroke: "rgb(229, 7, 7)"
              },
              {
                fill: "rgba(247, 147, 30, 0.1)",
                stroke: "rgb(247, 147, 30)"
              },
              {
                fill: "rgba(0, 113, 188, 0.1)",
                stroke: "rgb(0, 113, 188)"
              },
              {
                fill: "transparent",
                stroke: "none"
              }
            ]
          },
          white: {
            backgroundColor: "rgb(249, 249, 249)",
            levelRingOpacity: 0.5,
            node: {
              color: "rgb(255, 255, 255)",
              hoverColor: 'rgba(0, 0, 0, 0.1)',
              selectedColor: 'rgba(0, 0, 0, 0.3)',
              iconColor: "rgba(0, 0, 0, 0.75)",
              textColor: "rgb(72, 70, 91)",
            },
            link: {
              color: "rgb(255, 255, 255)",
              selectedColor: "rgb(0, 0, 0, 0.15)",
              animColor: "rgba(0, 0, 0, 0.15)"
            },
            levelRings: [
              {
                fill: "rgba(0, 113, 188, 0.1)",                
                stroke: "rgb(0, 113, 188)"
              },
              {
                fill: "rgba(229, 7, 7, 0.1)",
                stroke: "rgb(229, 7, 7)"
              },
              {
                fill: "rgba(247, 147, 30, 0.1)",
                stroke: "rgb(247, 147, 30)"
              },
              {
                fill: "rgba(0, 113, 188, 0.1)",
                stroke: "rgb(0, 113, 188)"
              },
              {
                fill: "transparent",
                stroke: "none"
              }
            ]
          }
        }}
      />
    </div>
  );
}

export default HomePage;
