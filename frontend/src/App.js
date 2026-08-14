import React, { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import BusinessList from './pages/BusinessList';
import BusinessDetail from './pages/BusinessDetail';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import './App.css';

function ThemedApp() {
  const { isAr } = useLanguage();

  const theme = useMemo(
    () =>
      createTheme({
        direction: isAr ? 'rtl' : 'ltr',
        palette: {
          primary: {
            main: '#0b1c22',
            light: '#16343c',
          },
          secondary: {
            main: '#c8a36a',
            contrastText: '#0b1c22',
          },
          background: {
            default: '#f6f0e6',
            paper: '#fbf7f0',
          },
          text: {
            primary: '#122026',
            secondary: '#5d6b70',
          },
        },
        typography: {
          fontFamily: isAr ? '"Cairo", "Segoe UI", sans-serif' : '"Outfit", "Segoe UI", sans-serif',
          h1: { fontWeight: 600 },
          h2: { fontWeight: 600 },
          h3: { fontWeight: 600 },
          h4: { fontWeight: 600 },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },
          overline: {
            letterSpacing: isAr ? 0 : '0.28em',
            fontWeight: 500,
          },
        },
        shape: {
          borderRadius: 4,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 0,
                letterSpacing: isAr ? 0 : '0.04em',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 0,
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 0,
              },
            },
          },
        },
      }),
    [isAr]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/businesses" element={<BusinessList />} />
            <Route path="/business/:id" element={<BusinessDetail />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

function App() {
  return (
    <LanguageProvider>
      <ThemedApp />
    </LanguageProvider>
  );
}

export default App;
