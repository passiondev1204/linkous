import React from "react";
import clsx from "clsx";
import Paper from "@material-ui/core/Paper";
import IconButton from "@material-ui/core/IconButton";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import Typography from "@material-ui/core/Typography";
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import ImageIcon from "@material-ui/icons/Image";
import { Wrapper } from "../Wrapper";
import { ExpandableIcon } from "../ExpandIcon";
import { useStyles } from "./style";

export const ModeSelectCard = props => {
  const classes = useStyles();
  const { onExpand, open = false, nodeShape, changeNodeShape, theme, changeTheme, extended, changeExtend, showLines, changeShowLines} = props;

  return (
    <Wrapper
      height="auto"
      layout="absolute"
      pointerevents="none"
      top="8"
      justify="center"
    >
      <Wrapper width="auto" height="auto" align="center" direction="column">        
        <Paper
          className={clsx(classes.container, {
            [classes.opened]: open,
            [classes.closed]: !open
          })}
        >          
          <div
            height="auto"
            align="center"
          >
            <ToggleButtonGroup
              value={nodeShape}
              exclusive
              onChange={(evt, val) => changeNodeShape(val)}
            >
              <ToggleButton value="circle">
                <FiberManualRecordIcon />
              </ToggleButton>
              <ToggleButton value="icon">
                <ImageIcon />
              </ToggleButton>
            </ToggleButtonGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={theme === "dark" ? true : false}
                  onChange={evt => changeTheme(evt.target.checked ? "dark" : "white")}
                  color="primary"
                />
              }
              label={
                theme === "dark" ? (
                  <Typography className={classes.controlLabel}>
                    Dark
                  </Typography>
                ) : (
                  <Typography className={classes.controlLabel}>
                    White
                  </Typography>
                )
              }
              labelPlacement="top"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={extended}
                  onChange={evt => changeExtend(evt.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography className={classes.controlLabel}>
                  Show Edges
                </Typography>
              }
              labelPlacement="top"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showLines}
                  onChange={evt => changeShowLines(evt.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography className={classes.controlLabel}>
                  Show All Paths
                </Typography>
              }
              labelPlacement="top"
            />
          </div>
        </Paper>
        <Wrapper height="auto" justify="center">
          <IconButton size="small" onClick={onExpand} className={clsx(classes.expandIcon, {
            [classes.expandOpened]: open,
            [classes.expandClosed]: !open
          })}>
            <ExpandableIcon
              expanded={open}
              ExpandIcon={ExpandMoreIcon}
              CollapseIcon={ExpandLessIcon}
            />
          </IconButton>
        </Wrapper>
      </Wrapper>
    </Wrapper>
  );
};
