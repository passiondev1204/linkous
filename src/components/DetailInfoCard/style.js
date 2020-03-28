import { makeStyles } from "@material-ui/core/styles";
const minWidth = 30;
export const useStyles = makeStyles(theme => ({
  container: {
    display: "flex",
    pointerEvents: "auto",
    padding: theme.spacing(1),
    boxShadow: "0px 0px 13px 0px rgba(0, 0, 0, 0.5)"
  },
  opened: {
    // width: 'auto',
    // transition: theme.transitions.create("width", {
    //   easing: theme.transitions.easing.sharp,
    //   duration: 3550
    // }),
  },
  closed: {
    width: minWidth,
    // transition: theme.transitions.create("width", {
    //   easing: theme.transitions.easing.sharp,
    //   duration: 3550
    // }),
    overflowX: "hidden"
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
