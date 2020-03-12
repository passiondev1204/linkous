import React from "react";
import {
  makeStyles,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar
} from "@material-ui/core";
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import { Wrapper } from "../../Wrapper";
import global from "../../../global";

const useStyles = makeStyles(theme => ({
  margin: {
    margin: theme.spacing(2)
  }
}));

const impactMap = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export const ImpactDialog = ({ content, open, onSave, onCancel }) => {
  const classes = useStyles();
  const [selectedImpact, setSelectedImpact] = React.useState(content);

  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle id="name-dialog-title">Impact</DialogTitle>
      <DialogContent>
        <List>
          {impactMap.map((impact, i) => (
            <ListItem
              button
              selected={impact === selectedImpact}
              onClick={() => setSelectedImpact(impact)}
              key={i}
            >
              <ListItemAvatar>
                {/* <Avatar className={classes.avatar}> */}
                  <FiberManualRecordIcon style={{color: global.color.impact[impact]}}/>
                {/* </Avatar> */}
              </ListItemAvatar>
              <ListItemText primary={impact} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Wrapper justify="center">
          <Button
            onClick={() => onSave(selectedImpact)}
            color="primary"
            className={classes.margin}
          >
            Save
          </Button>
          <Button
            onClick={onCancel}
            color="primary"
            autoFocus
            className={classes.margin}
          >
            Cancel
          </Button>
        </Wrapper>
      </DialogActions>
    </Dialog>
  );
};
