import React from "react";
import clsx from "clsx";
import Paper from "@material-ui/core/Paper";
import IconButton from "@material-ui/core/IconButton";
import { Wrapper } from "../Wrapper";
import { ExpandableIcon } from "../ExpandIcon";
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import { useStyles } from "./style";

import utils from "../../utils";
const markedFields = [
  {
    field: "rce",
    display: "Remote Code Execution"
  },
  {
    field: "lpe",
    display: "Local Privilege Exploit"
  },
  {
    field: "ea",
    display: "Exposed Asset"
  },
  {
    field: "dau",
    display: "Domain Account Update"
  },
  {
    field: "config",
    display: "Misconfigured System"
  }
];

const DetailInfoCard = ({ info, onExpand, config, open = false }) => {
  const classes = useStyles();
  return (
    <Wrapper
      width="auto"
      layout="absolute"
      pointerevents="none"
      direction="column"
      right="8"
      justify="center"
    >
      <Wrapper height="auto" align="center">
        <IconButton
          size="small"
          className={clsx(classes.expandIcon, {
            [classes.expandOpened]: open,
            [classes.expandClosed]: !open
          })}
          onClick={onExpand}
        >
          <ExpandableIcon expanded={open} />
        </IconButton>
        <Paper
          className={clsx(classes.container, {
            [classes.opened]: open,
            [classes.closed]: !open
          })}
        >
          {info && (
            <Wrapper direction="column" height="auto" align="center" pl={8}>
              <Wrapper height="auto">
                <Wrapper direction="column" className={classes.field}>
                  {Object.entries(info).map(
                    (entry, k) =>
                      !markedFields
                        .map(e => e.field)
                        .includes(entry[0].toLowerCase()) && (
                        <span key={k}>{entry[0]}</span>
                      )
                  )}
                </Wrapper>
                <Wrapper direction="column" className={classes.value}>
                  {Object.entries(info).map(
                    (entry, k) =>
                      !markedFields
                        .map(e => e.field)
                        .includes(entry[0].toLowerCase()) && (
                        <span key={k}>
                          {utils.checkInfoAvailable(entry[1])}
                        </span>
                      )
                  )}
                </Wrapper>
              </Wrapper>
              <Wrapper
                height="auto"
                direction="column"
                className={classes.value}
              >
                {Object.entries(info).map(
                  (entry, k) =>
                    markedFields
                      .map(e => e.field)
                      .includes(entry[0].toLowerCase()) &&
                    entry[1].toLowerCase() === "true" && (
                      <div key={k} className={classes.iconWith}>
                        <FiberManualRecordIcon
                          style={{
                            fontSize: 16,
                            color: config.Conditions[entry[0]],
                            marginRight: 4
                          }}
                        />
                        <span>
                          {
                            markedFields.find(
                              ({ field }) => field === entry[0].toLowerCase()
                            ).display
                          }
                        </span>
                      </div>
                    )
                )}
              </Wrapper>
            </Wrapper>
          )}
        </Paper>
      </Wrapper>
    </Wrapper>
  );
};

//return true if no need to re-render
function compareProps(prevProps, nextProps) {
  return (
    prevProps.open === nextProps.open &&
    JSON.stringify(prevProps.info) === JSON.stringify(nextProps.info)
  );
}

export const MemoDetailInfoCard = React.memo(DetailInfoCard, compareProps);
