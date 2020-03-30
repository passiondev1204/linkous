import { makeStyles } from "@material-ui/core/styles";
export const useStyles = makeStyles(theme => ({
  container: {
    display: "flex",
    padding: theme.spacing(1),
    marginRight: theme.spacing(1),    
    height: '100%',
    boxShadow: "0px 0px 13px 0px rgba(0, 0, 0, 0.5)"
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
  value: props => ({
    color: props.color,
    fontFamily: "Poppins",
    fontSize: 24,
    fontWeight: "bold",
  })
}));
