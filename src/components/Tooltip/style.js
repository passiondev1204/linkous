import { makeStyles } from "@material-ui/core/styles";

export const useStyles = makeStyles(theme => ({
  container: {
    padding: theme.spacing(1),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    fontSize: 12,
    boxShadow: "0px 0px 13px 0px rgba(0, 0, 0, 0.5)"
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
  }
}));
