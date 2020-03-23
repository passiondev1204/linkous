import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import InputBase from "@material-ui/core/InputBase";
import Divider from "@material-ui/core/Divider";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import SearchIcon from "@material-ui/icons/Search";
import DirectionsIcon from "@material-ui/icons/Directions";
import CloseIcon from "@material-ui/icons/Close";

const useStyles = makeStyles(theme => ({
  root: {
    position: "absolute",
    opacity: 0.8,
    top: theme.spacing(2),
    right: theme.spacing(2),
    padding: "2px 4px",
    display: "flex",
    alignItems: "center",
    width: 400
    // "& .MuiPaper-root:active": {
    //   opacity: 1
    // }
  },
  input: {
    marginLeft: theme.spacing(1),
    flex: 1
  },
  iconButton: {
    padding: 10
  },
  divider: {
    height: 28,
    margin: 4
  }
}));

export const SearchInputBox = props => {
  const { onSearch } = props;
  const classes = useStyles();
  const [searchText, setSearchText] = React.useState("");

  return (
    <Paper className={classes.root}>
      <IconButton className={classes.iconButton}>
        <MenuIcon />
      </IconButton>
      <InputBase
        className={classes.input}
        placeholder="Search"
        value={searchText}
        onKeyPress={evt => {
          if (evt.key === "Enter") {
            evt.preventDefault();
            onSearch(searchText);
          }
        }}
        onChange={evt => setSearchText(evt.target.value)}
      />
      {searchText.length > 0 && (
        <IconButton
          onClick={() => {
            setSearchText("");
            onSearch("");
          }}
          className={classes.iconButton}
        >
          <CloseIcon />
        </IconButton>
      )}
      <IconButton
        onClick={() => onSearch(searchText)}
        className={classes.iconButton}
      >
        <SearchIcon />
      </IconButton>
      <Divider className={classes.divider} orientation="vertical" />
      <IconButton color="primary" className={classes.iconButton}>
        <DirectionsIcon />
      </IconButton>
    </Paper>
  );
}
