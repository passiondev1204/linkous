import React from "react";
import Popper from "@material-ui/core/Popover";
import Fade from "@material-ui/core/Fade";
import Paper from "@material-ui/core/Paper";
import { Wrapper } from "../Wrapper";
import { useStyles } from "./style";
import utils from "../../utils";

export const Tooltip = ({ open = false, info, anchorEl, onOver, onOut }) => {
  const classes = useStyles();

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement={"bottom-start"}
      onMouseOver={onOver}
      onMouseOut={onOut}
      transition
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps}>
          <Paper className={classes.container}>
            <Wrapper height="auto">
              <Wrapper
                height="auto"
                direction="column"
                className={classes.field}
              >
                <span>Name</span>
                <span>IP</span>
                <span>Mask</span>
                <span>RS</span>
                <span>RCE</span>
                <span>LPE</span>
                <span>Config</span>
              </Wrapper>
              <Wrapper
                height="auto"
                direction="column"
                className={classes.value}
              >
                <span>{utils.checkInfoAvailable(info.name)}</span>
                <span>{utils.checkInfoAvailable(info.IP)}</span>
                <span>{utils.checkInfoAvailable(info.Mask)}</span>
                <span>{utils.checkInfoAvailable(info.RS)}</span>
                <span>{utils.checkInfoAvailable(info.Conditions[0].RCE)}</span>
                <span>{utils.checkInfoAvailable(info.Conditions[0].LPE)}</span>
                <span>{utils.checkInfoAvailable(info.Conditions[0].Config)}</span>
              </Wrapper>
            </Wrapper>
          </Paper>
        </Fade>
      )}
    </Popper>
  );
};
