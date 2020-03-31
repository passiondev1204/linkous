import React from "react";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import { useStyles } from "./style";

export const ZoneInfoCard = ({ nodes, config }) => {
  const classes = useStyles();
  return (
    <Paper className={classes.container}>
      <div className={classes.levelInfo}>
        <Typography className={`${classes.field} ${classes.lastZone}`}>Last Line</Typography>
        <Typography className={classes.value}>
          {nodes.filter(d => d.Level === 1).length}
        </Typography>
      </div>
      <div className={classes.levelInfo}>
        <Typography className={`${classes.field} ${classes.dangerZone}`}>Danger Zone</Typography>
        <Typography className={classes.value}>
          {nodes.filter(d => d.Level === 2).length}
        </Typography>
      </div>
      <div className={classes.levelInfo}>
        <Typography className={`${classes.field} ${classes.warningZone}`}>Warning Zone</Typography>
        <Typography className={classes.value}>
          {nodes.filter(d => d.Level === 3).length}
        </Typography>
      </div>
    </Paper>
  );
};
