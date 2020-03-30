import React from "react";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import { useStyles } from "./style";
import utils from "../../utils";

export const AttackSuccessCard = ({successTimes}) => {
  const classes = useStyles({color: utils.successColor(successTimes)});
  return (
    <Paper className={classes.container}>
      <Typography className={classes.field}>Attacker Success</Typography>
      <Typography className={classes.value}>{successTimes}%</Typography>
    </Paper>
  );
};
