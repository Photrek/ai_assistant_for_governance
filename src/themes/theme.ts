import { createTheme } from "@mui/material/styles";
import grey from "@mui/material/colors/grey";

export const lightTheme = createTheme({

});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export default {
  darkTheme,
  lightTheme,
};
