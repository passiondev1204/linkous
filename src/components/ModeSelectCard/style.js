import { makeStyles } from "@material-ui/core/styles";
const cardWidth = 500, minHeight = 30;
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
  opened: {},
  closed: {
    height: minHeight,
    overflowY: "hidden",
  },
  controlLabel: {
    fontFamily: "Poppins",
    color: "#48465b",
    fontWeight: "bold"
  },
  contentContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  contentOpened: {
    display: "flex"
  },
  contentClosed: {
    display: "none"
  }
}));
