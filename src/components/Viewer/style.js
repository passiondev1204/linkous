import { makeStyles } from "@material-ui/core/styles";
export const useStyles = makeStyles(theme => ({
  tooltipContainer: {
    padding: theme.spacing(1),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    fontSize: 12
  },
  titleSection: {
    fontFamily: "Poppins",
    color: "#595D6E",
    textAlign: "center",
    width: "100%",
    margin: "auto",
    fontWeight: 500,
    marginRight: theme.spacing(1)
  },
  descSection: {
    fontFamily: "Poppins",
    color: "#646C9A",
    "& span": {
      whiteSpace: "nowrap"
    }
  },
  svgContainer: {
    position: "absolute",
    display: "flex",
    justifyContent: "center"
  },
  menuItem: {
    fontFamily: "Poppins",
    fontSize: 14
  },
  checkItem: {
    marginRight: theme.spacing(1)
  },
  bottomArea: {
    display: 'flex',
    position: 'absolute',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    width: 'auto',
    height: 'auto',
    right: theme.spacing(1),
    bottom: theme.spacing(1)
  }
}));
