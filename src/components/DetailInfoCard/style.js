import { makeStyles } from "@material-ui/core/styles";
export const useStyles = makeStyles(theme => ({
  container: {
    display: "flex",
    pointerEvents: "auto",
    padding: theme.spacing(1),
    boxShadow: "0px 0px 13px 0px rgba(0, 0, 0, 0.5)"
  },
  expandIcon: {
    position: 'absolute',
    boxShadow: "0px 0px 13px 0px rgb(255, 255, 255)"
  },
  expandOpened: {
    left: -15,
  },
  expandClosed: {
    left: -34
  },
  opened: {
  },
  closed: {
    display: "none",
  },
  field: {
    fontFamily: "Poppins",
    color: "#595D6E",
    textAlign: "center",
    width: "100%",
    margin: "auto",
    fontWeight: 500,
    marginRight: theme.spacing(1)
  },
  value: {
    fontFamily: "Poppins",
    color: "#646C9A",
    "& span": {
      whiteSpace: "nowrap"
    }
  },
  contentOpened: {
    opacity: 0.9,
    transition: theme.transitions.create("opacity", {
      duration: 550
    })
  },
  contentClosed: {
    opacity: 0,
    transition: theme.transitions.create("opacity", {
      duration: 150
    })
  }
}));
