import React from "react";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import { useStyles } from "./style";

export const AttackSuccessCard = ({successTimes}) => {
  const classes = useStyles();
  return (
    <Paper className={classes.container}>
      <Typography className={classes.field}>Attacker Success</Typography>
      <Typography className={classes.value}>{successTimes}%</Typography>
    </Paper>
  );
};
