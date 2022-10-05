import { createTheme } from '@mui/material/styles';
import { grey, purple } from '@mui/material/colors';

export default createTheme({
  palette: {
    primary: {
      main: purple[800],
    },
    secondary: {
      main: grey[200],
    },
  },
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
  },
});
