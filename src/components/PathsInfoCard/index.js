import React from "react";
import * as d3 from "d3";
import clsx from "clsx";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import Paper from "@material-ui/core/Paper";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import { ExpandableIcon } from "../ExpandIcon";
import { Wrapper } from "../Wrapper";
import { useStyles } from "./style";

const svgWidth = 110,
  svgHeight = 90;
const PathCard = ({
  cardIndex,
  color,
  attackSuccess = 0,
  selected = false
}) => {
  const classes = useStyles({ selected: selected });

  return (
    <Paper elevation={4} className={classes.card}>
      <svg width={svgWidth} height={svgHeight}>
        <rect
          x={svgWidth * 0.5}
          y={svgHeight * 0.71}
          width={svgWidth}
          height={svgHeight / 4}
          rx={10}
          ry={10}
          fill={color}
        />
        <path stroke={color} strokeWidth={2} d="M12 12L28 25" />
        <path stroke={color} strokeWidth={2} d="M28 25L12 38" />
        <text
          x={svgWidth - 6}
          y={34}
          textAnchor="end"
          fontSize={32}
          fontWeight="bold"
          fill={color}
        >
          {cardIndex}
        </text>
        <text
          x={svgWidth - 4}
          y={svgHeight - 9}
          textAnchor="end"
          fill={"white"}
          fontSize={18}
          fontWeight="bold"
        >
          {attackSuccess > 100 ? 100 : attackSuccess.toFixed(1)}%
        </text>
        <circle
          cx={12}
          cy={12}
          r={5}
          fill="white"
          stroke={color}
          strokeWidth={3}
        />
        <circle
          cx={28}
          cy={25}
          r={5}
          fill="white"
          stroke={color}
          strokeWidth={3}
        />
        <circle
          cx={12}
          cy={38}
          r={5}
          fill="white"
          stroke={color}
          strokeWidth={3}
        />
      </svg>
    </Paper>
  );
};

export const PathsInfoCard = ({ open, onExpand, pathGroups, onCardClick }) => {
  const classes = useStyles();
  const [selected, setSelected] = React.useState(null);
  const colors = d3
    .scaleLinear()
    .domain([0, 30, 100])
    .range(["blue", "orange", "red"]);
  React.useEffect(() => {
    setSelected(null);
  }, [pathGroups]);

  return (
    <Wrapper
      height="auto"
      layout="absolute"
      pointerevents="none"
      align="flex-end"
      bottom="8"
      justify="center"
    >
      <Paper
        className={clsx(classes.container, {
          [classes.opened]: open,
          [classes.closed]: !open
        })}
      >
        <Wrapper height="auto" direction="column" align="center">
          <IconButton size="small" onClick={onExpand}>
            <ExpandableIcon
              expanded={open}
              ExpandIcon={ExpandLessIcon}
              CollapseIcon={ExpandMoreIcon}
            />
          </IconButton>
          <Grid container spacing={1} className={clsx(classes.gridContainer, {
            [classes.contentOpened]: open,
            [classes.contentClosed]: !open
          })}>
            {pathGroups
              .sort((a, b) =>
                a.reduce((a, c) => a * c.Prob, 1) >
                b.reduce((a, c) => a * c.Prob, 1)
                  ? -1
                  : 1
              )
              .map(paths => ({
                paths: paths,
                success: paths.reduce((a, c) => a * c.Prob, 1) / 1000
              }))
              .map((paths, k) => (
                <Grid
                  item
                  xs={3}
                  key={k}
                  onClick={() => {
                    onCardClick(paths, colors(paths.success));
                    setSelected(k + 1);
                  }}
                  className={classes.cardTile}
                >
                  <PathCard
                    cardIndex={k + 1}
                    color={colors(paths.success)}
                    attackSuccess={paths.success}
                    selected={k + 1 === selected}
                  />
                </Grid>
              ))}
          </Grid>
        </Wrapper>
      </Paper>
    </Wrapper>
  );
};
