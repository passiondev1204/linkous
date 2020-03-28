import { makeStyles } from "@material-ui/core/styles";
export const useStyles = makeStyles(theme => ({
  container: {
    padding: theme.spacing(1),    
    boxShadow: "0px 0px 13px 0px rgba(0, 0, 0, 0.5)"
  },
  levelInfo: {
    display: "flex"
  },
  field: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#595D6E",
    fontFamily: "Poppins",
    width: "100%",
    fontWeight: "bold",
    marginRight: theme.spacing(1)
  },
  value: {
    color: "#5867DD",
    fontFamily: "Poppins",
    fontSize: 24,
    fontWeight: "bold",
    marginRight: theme.spacing(1)
  }
}));
