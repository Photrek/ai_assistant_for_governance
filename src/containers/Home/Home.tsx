import React from "react";
import { ThemeProvider, Typography, CssBaseline } from "@mui/material";
import Grid from '@mui/material/Grid';
import { useDarkMode } from "../../hooks/useDarkMode";
import { lightTheme, darkTheme } from "../../themes/theme";
import { useTranslation } from "react-i18next";
import MenuBar from "../MenuBar";
import { PromptInputInterface } from "../../components/PromptInputInterface/PromptInputInterface";
import "./Home.css";

const Home: React.FC = () => {
  const [ darkMode, setDarkMode ]: any = useDarkMode();
  const { t, i18n } = useTranslation();
  const theme = darkMode ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <MenuBar />
      <div style={{
        backgroundImage: `url(${"assets/images/640px-Made20bacon.png"})`,
        backgroundSize: 'cover', // Makes sure the image covers the entire container
        backgroundPosition: 'center', // Centers the image
        backgroundRepeat: 'no-repeat', // Prevents the image from tiling
        height: '100vh', // Full viewport height
        width: '100vw', // Full viewport width
        display: 'flex', // To center the content vertically and horizontally
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'auto', // Allows scrolling if content exceeds viewport
      }}>
        <CssBaseline />
        
        <Grid container alignContent="center" alignItems="center" justifyContent="center" direction="column">
        <PromptInputInterface />
        </Grid>
      </div>
    </ThemeProvider >
  );
};

export default Home;