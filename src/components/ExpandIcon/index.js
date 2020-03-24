import React from "react";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

const useStyles = makeStyles(theme => ({
  placeHolder: {
    display: "flex"
  },
  iconOpenNormal: {
    position: "absolute",
    transition: theme.transitions.create(["transform", "opacity"], {
      easing: theme.transitions.easing.sharp,
      duration: 150
    }),
    transform: "rotate(0)",
    opacity: 1
  },
  iconOpenRotate: {
    transition: theme.transitions.create(["transform", "opacity"], {
      easing: theme.transitions.easing.sharp,
      duration: 150
    }),
    transform: "rotate(90deg)",
    opacity: 0
  },
  iconCloseNormal: {
    position: "absolute",
    transition: theme.transitions.create("opacity", {
      easing: theme.transitions.easing.sharp,
      duration: 350
    }),
    opacity: 1
  },
  iconCloseHide: {
    transition: theme.transitions.create("opacity", {
      easing: theme.transitions.easing.sharp,
      duration: 50
    }),
    opacity: 0
  }
}));

export const ExpandableIcon = ({
  expanded = false,
  ExpandIcon = ChevronLeftIcon,
  CollapseIcon = ChevronRightIcon
}) => {
  const classes = useStyles();
  return (
    <div className={classes.placeHolder}>
      <ExpandIcon
        className={clsx({
          [classes.iconOpenRotate]: expanded,
          [classes.iconOpenNormal]: !expanded
        })}
      />
      <CollapseIcon
        className={clsx({
          [classes.iconCloseNormal]: expanded,
          [classes.iconCloseHide]: !expanded
        })}
      />
    </div>
  );
};