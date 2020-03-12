import React from "react";
import {
  makeStyles,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from "@material-ui/core";
import {Wrapper} from "../../Wrapper";

const useStyles = makeStyles(theme => ({
  contents: {
    display: 'flex',
    textAlign: 'center',
  },
  margin: {
    margin: theme.spacing(2)
  }
}));

export const AlertDialog = ({ title, contents, open, onYes, onNo }) => {
  const classes = useStyles();
  return (
    <Dialog
      open={open}
      onClose={onNo}
    >
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">        
          <span dangerouslySetInnerHTML={{ __html: contents }} className={classes.contents} />
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Wrapper justify="center">
          <Button onClick={onYes} color="primary" className={classes.margin}>
            Yes
          </Button>
          <Button onClick={onNo} color="primary" autoFocus className={classes.margin}>
            No
          </Button>
        </Wrapper>
      </DialogActions>
    </Dialog>
  );
};
