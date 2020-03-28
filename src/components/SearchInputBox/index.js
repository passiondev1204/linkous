import React from "react";
import Paper from "@material-ui/core/Paper";
import TextField from "@material-ui/core/TextField";
import Divider from "@material-ui/core/Divider";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import SearchIcon from "@material-ui/icons/Search";
import DirectionsIcon from "@material-ui/icons/Directions";
import CloseIcon from "@material-ui/icons/Close";
import Autocomplete from "@material-ui/lab/Autocomplete";
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';
import { List } from "react-virtualized";
import utils from "../../utils";
import {useStyles} from "./style";

const searchInputWidth = 250;

const ListboxComponent = React.forwardRef(function ListboxComponent(
  props,
  ref
) {
  const { children, role, ...other } = props;
  const itemCount = Array.isArray(children) ? children.length : 0;
  const itemSize = 36;

  return (
    <div ref={ref}>
      <div {...other}>
        <List
          height={250}
          width={searchInputWidth}
          rowHeight={itemSize}
          overscanCount={5}
          rowCount={itemCount}
          rowRenderer={props => {
            return React.cloneElement(children[props.index], {
              style: props.style
            });
          }}
          role={role}
        />
      </div>
    </div>
  );
});

export const SearchInputBox = props => {
  const { onSearch, searchList = [] } = props;
  const classes = useStyles({width: searchInputWidth});
  const [searchText, setSearchText] = React.useState("");
  
  return (    
    <Paper className={classes.root}>
      <Autocomplete
        className={classes.autocomplete}
        disableListWrap
        ListboxComponent={ListboxComponent}
        value={searchText}
        clearOnEscape
        disableClearable
        onChange={(evt, val) => {          
          onSearch(val);
          setSearchText("");
        }}
        onInputChange={(evt, val, reason) => setSearchText(val)}
        options={utils.filteredList(searchList, searchText).map(item => item.IP)}
        renderInput={params => (
          <TextField
            placeholder="search..."
            onKeyPress={evt => {
              if (evt.key === "Enter") {
                evt.preventDefault();
                onSearch(searchText);
                setSearchText("");                
              }
            }}
            {...params}
            size="small"
            className={classes.searchInput}
            fullWidth
          />
        )}
        renderOption={(option, { inputValue }) => {
          const matches = match(option, inputValue);
          const parts = parse(option, matches);
  
          return (
            <div>
              {parts.map((part, index) => (
                <span key={index} style={{ fontWeight: part.highlight ? 700 : 400 }}>
                  {part.text}
                </span>
              ))}
            </div>
          );
        }}
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
    </Paper>
  );
}
