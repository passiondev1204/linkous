import { makeStyles } from "@material-ui/core/styles";

export const useStyles = makeStyles(theme => ({
  root: {
    position: "absolute",
    top: theme.spacing(1),
    right: theme.spacing(1),
    padding: '2px 4px',
    display: "flex",
    alignItems: "center",
    fontFamily: "Poppins !importants",
    boxShadow: "0px 0px 13px 0px rgba(0, 0, 0, 0.5)"
  },
  autocomplete: props => ({
    marginLeft: theme.spacing(1),
    width: props.width,
    fontFamily: "Poppins !importants"
  }),
  searchInput: {
    fontFamily: "Poppins !importants"
  },
  iconButton: {
    padding: 10
  },
  divider: {
    height: 28,
    margin: 4
  }
}));
