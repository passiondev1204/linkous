import React from "react";
import {
  makeStyles,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField
} from "@material-ui/core";
import { Wrapper } from "../../Wrapper";

const useStyles = makeStyles(theme => ({
  margin: {
    margin: theme.spacing(2)
  }
}));

export const NameDialog = ({ content, open, onSave, onCancel }) => {
  const classes = useStyles();

  const [name, setName] = React.useState(content);
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle id="name-dialog-title">Name</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="Circle Name"
          value={name}
          onChange={evt => setName(evt.target.value)}
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Wrapper justify="center">
          <Button onClick={() => onSave(name)} color="primary" className={classes.margin}>
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
