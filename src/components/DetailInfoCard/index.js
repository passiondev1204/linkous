import React from "react";
import clsx from 'clsx';
import Paper from "@material-ui/core/Paper";
import IconButton from "@material-ui/core/IconButton";
import { Wrapper } from "../Wrapper";
import { ExpandableIcon } from "../ExpandIcon";
import {useStyles} from "./style";

import utils from "../../utils";

export const DetailInfoCard = React.memo(({info, onExpand, open = false}) => {

  const classes = useStyles();

  return (
    <Wrapper
      width="auto"
      layout="absolute"
      pointerevents="none"
      direction="column"
      right="16"
      justify="center"
    >
      <Paper
        className={clsx(classes.container, {
          [classes.opened]: open,
          [classes.closed]: !open
        })}
      >
        <Wrapper align="center">
          <IconButton size="small" onClick={onExpand}>
            <ExpandableIcon expanded={open} />
          </IconButton>
          <Wrapper
            pl={8}
            className={clsx({
              [classes.contentOpened]: open,
              [classes.contentClosed]: !open
            })}
          >
            <Wrapper direction="column" className={classes.field}>
              <span>Name</span>
              <span>IP</span>
              <span>Mask</span>
              <span>Level</span>
              <span>AV</span>
              <span>OS</span>
              <span>Icon</span>
              <span>Browser</span>
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
              <span>{utils.checkInfoAvailable(info.Level)}</span>
              <span>{utils.checkInfoAvailable(info.Software[0].AV)}</span>
              <span>{utils.checkInfoAvailable(info.Software[0].OS)}</span>
              <span>{utils.checkInfoAvailable(info.Software[0].Icon)}</span>
              <span>{utils.checkInfoAvailable(info.Software[0].Browser)}</span>
              <span>{utils.checkInfoAvailable(info.RS)}</span>
              <span>{utils.checkInfoAvailable(info.Conditions[0].RCE)}</span>
              <span>{utils.checkInfoAvailable(info.Conditions[0].LPE)}</span>
              <span>{utils.checkInfoAvailable(info.Conditions[0].Config)}</span>
            </Wrapper>
          </Wrapper>
        </Wrapper>
      </Paper>
    </Wrapper>
  );
});
