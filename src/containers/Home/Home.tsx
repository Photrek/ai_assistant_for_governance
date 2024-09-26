import React from "react";
import { ThemeProvider, AppBar, Toolbar, Typography, IconButton, Tooltip, CssBaseline } from "@mui/material";
import Grid from '@mui/material/Grid';
import { useDarkMode } from "../../hooks/useDarkMode";
import Brightness3Icon from "@mui/icons-material/Brightness3";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import { lightTheme, darkTheme } from "../../themes/theme";
import { useTranslation } from "react-i18next";
import MenuBar from "../MenuBar";
import LanguageMenu from "../LanguageMenu";


import "./Home.css";

const Home: React.FC = () => {
  const [ darkMode, setDarkMode ]: any = useDarkMode();
  const { t, i18n } = useTranslation();
  const theme = darkMode ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <MenuBar />
      <div>
        <CssBaseline />
        <Grid container alignContent="center" alignItems="center" justifyContent="center" direction="column">
          <img className="logo" alt="logo" src={darkMode
            ? "assets/images/640px-Made20bacon.png" //tslint:disable-line
            : "assets/images/640px-Made20bacon.png" //tslint:disable-line
          } style={{ paddingTop: "10%" }} />
          <Typography variant="caption" style={{ position: "absolute", bottom: "10px" }}>
            {t("Date", { date: new Date() })}
          </Typography>
        </Grid>
      </div>
    </ThemeProvider >
  );
};

export default Home;
