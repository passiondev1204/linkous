import { makeStyles } from "@material-ui/core/styles";
const minHeight = 30;
const cardHeight = 90;
const parentCardWidth = 500;

export const useStyles = makeStyles(theme => ({
  container: {
    display: "flex",
    overflowY: "auto",
    width: parentCardWidth,
    maxHeight: '100%',
    pointerEvents: "auto",
    padding: theme.spacing(1),
    boxShadow: "0px 0px 13px 0px rgba(0, 0, 0, 0.5)"
  },
  opened: {    
  },
  closed: {
    height: minHeight,
    overflowY: "hidden"
  },
  contentOpened: {
    display: "flex"
  },
  contentClosed: {
    display: "none",
    height: 0
  },
  gridContainer: {
    display: 'flex',
    overflowY: 'auto',
    maxHeight: cardHeight * 2 + 20
  },
  cardTile: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  card: props => ({
    width: '100%',    
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'flex-end',
    backgroundColor: props.selected ? 'rgba(180, 180, 180, 0.45)' : 'white',
    fontFamily: "Poppins",
    fontWeight: "bold",
    '&:hover': {
      backgroundColor: '#ddd'
    },    
  })
}));
