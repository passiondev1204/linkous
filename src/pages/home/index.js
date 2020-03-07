import React from "react";
import { Viewer } from "../../components/Viewer";
import data from "../../data/relation.json";

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
      <Viewer
        data={data}
        width={1000}
        height={800}
        config={{
          duration: 1000,
          nodeSize: 20,
          levelCircles: {
            level1: {
              radius: 100,
              fill: "#dfd4d0",
              stroke: "#bc464b",
              distance: 0
            },
            level2: {
              radius: 200,
              fill: "#e6e8e4",
              stroke: "#d98f39",
              distance: 150
            },
            level3: {
              radius: 300,
              fill: "#e7f4fb",
              stroke: "#49ade0",
              distance: 250
            }
          }
        }}
      />
    </div>
  );
}

export default HomePage;
