// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import InventoryPage from './components/InventoryPage.js';
import ProfitPage from './components/ProfitPage.js'; // Import the new page
import AddItemPage from './components/AddItemPage.js'; // Import the new page
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inventory/:hotelName" element={<InventoryPage />} />
          <Route path="/profit-report/:hotelName" element={<ProfitPage />} />
          <Route path="/add-item" element={<AddItemPage />} />
          <Route path="/edit-item/:itemId" element={<AddItemPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;