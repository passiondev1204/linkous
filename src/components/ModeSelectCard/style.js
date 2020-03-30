import { makeStyles } from "@material-ui/core/styles";
const cardWidth = 500;
export const useStyles = makeStyles(theme => ({
  container: {
    padding: theme.spacing(1),
    display: "flex",
    justifyContent: "center",
    pointerEvents: "auto",
    width: cardWidth,
    fontFamily: "Poppins !important",
    boxShadow: "0px 0px 13px 0px rgba(0, 0, 0, 0.5)"
  },
  opened: {
    display: 'flex'
  },
  closed: {
    display: 'none'
  },
  expandIcon: {
    position: 'absolute',
    boxShadow: "0px 0px 13px 0px rgb(255, 255, 255)"
  },
  expandOpened: {
    top: -15
  },
  expandClosed: {
    top: 6
  },
  controlLabel: {
    fontFamily: "Poppins",
    color: "#48465b",
    fontWeight: "bold"
  }
}));
