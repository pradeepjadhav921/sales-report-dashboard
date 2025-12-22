import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container, Typography, Paper, AppBar, Toolbar, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
  InputAdornment, TableSortLabel, Box, CircularProgress,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Sync as SyncIcon, Search as SearchIcon, PictureAsPdf as PdfIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { syncMenu } from '../api';

export const StockSummery = () => {
  const navigate = useNavigate();
  const { hotelName } = useParams();
  const [stockItems, setStockItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'available', direction: 'asc' });
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const loadStockData = () => {
    setLoading(true);
    try {
      if (hotelName) {
        const dateKey = format(selectedDate, 'yyyy-MM-dd');
        const historyKey = `stock_history_${hotelName}`;
        const storedHistory = localStorage.getItem(historyKey);
        
        let foundData = false;
        if (storedHistory) {
          try {
            const parsedHistory = JSON.parse(storedHistory);
            if (parsedHistory[dateKey] && Array.isArray(parsedHistory[dateKey])) {
              setStockItems(parsedHistory[dateKey]);
              foundData = true;
            }
          } catch (e) {
            console.error("Failed to parse history data", e);
          }
        }

        if (!foundData) {
          // Fallback: if today, try loading from the legacy/current key
          const todayKey = format(new Date(), 'yyyy-MM-dd');
          if (dateKey === todayKey) {
            const legacyKey = `menu_${hotelName}`;
            const legacyData = localStorage.getItem(legacyKey);
            if (legacyData) {
              try {
                const parsed = JSON.parse(legacyData);
                if (Array.isArray(parsed)) {
                  setStockItems(parsed);
                } else {
                  setStockItems([]);
                }
              } catch (e) {
                setStockItems([]);
              }
            } else {
              setStockItems([]);
            }
          } else {
            setStockItems([]);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStockData();
  }, [hotelName, selectedDate]);

  const handleSync = async () => {
    setLoading(true);
    try {
      const menuItems = await syncMenu(hotelName);
      setStockItems(menuItems);
      
      // Save to history map
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      const historyKey = `stock_history_${hotelName}`;
      const history = JSON.parse(localStorage.getItem(historyKey) || '{}');
      history[dateKey] = menuItems;
      localStorage.setItem(historyKey, JSON.stringify(history));

      // Update legacy key if it's today (to keep consistency with other pages)
      if (dateKey === format(new Date(), 'yyyy-MM-dd')) {
        localStorage.setItem(`menu_${hotelName}`, JSON.stringify(menuItems));
      }

    } catch (err) {
      console.error("Error syncing menu:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    doc.text(`Stock Summary - ${hotelName?.replaceAll("_", " ")}`, 14, 15);
    doc.text(`Date: ${dateStr}`, 14, 22);

    const tableColumn = ["ID", "Item Name", "Added Stock", "Sold Stock", "Available Stock"];
    const tableRows = sortedAndFilteredItems.map(item => {
      const added = parseFloat(item.morning_stock || 0);
      const sold = parseFloat(item.adjustStock || 0);
      const available = added - sold;
      return [item.id, item.submenu, added, sold, available];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });

    doc.save(`Stock_Summary_${hotelName}_${dateStr}.pdf`);
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredItems = useMemo(() => {
    let items = [...stockItems];

    if (searchQuery) {
      items = items.filter(item =>
        item.submenu && item.submenu.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortConfig.key) {
      items.sort((a, b) => {
        const getAvailable = (item) => parseFloat(item.morning_stock || 0) - parseFloat(item.adjustStock || 0);
        
        const valA = sortConfig.key === 'available' ? getAvailable(a) : (a[sortConfig.key] || 0);
        const valB = sortConfig.key === 'available' ? getAvailable(b) : (b[sortConfig.key] || 0);

        if (valA < valB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return items;
  }, [stockItems, searchQuery, sortConfig]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Stock Summary for {hotelName?.replaceAll("_", " ")}
          </Typography>
          <IconButton color="inherit" onClick={handleExportPDF} title="Export PDF">
            <PdfIcon />
          </IconButton>
          <IconButton color="inherit" onClick={handleSync} disabled={loading}>
            {loading ? <CircularProgress size={24} color="inherit" /> : <SyncIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
        <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <DatePicker
            label="Select Date"
            value={selectedDate}
            onChange={(newValue) => setSelectedDate(newValue)}
            slotProps={{ textField: { size: 'small' } }}
            format="yyyy-MM-dd"
          />
          <TextField
            sx={{ flexGrow: 1 }}
            variant="outlined"
            size="small"
            placeholder="Search by item name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Paper>
        <TableContainer component={Paper}>
          <Table aria-label="stock summary table">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                <TableCell>ID</TableCell>
                <TableCell>Item Name</TableCell>
                <TableCell align="right">Added Stock</TableCell>
                <TableCell align="right">Sold Stock</TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortConfig.key === 'available'}
                    direction={sortConfig.direction}
                    onClick={() => requestSort('available')}
                  >
                    Available Stock
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedAndFilteredItems.map((item, index) => {
                const added = parseFloat(item.morning_stock || 0);
                const sold = parseFloat(item.adjustStock || 0);
                const available = added - sold;

                return (
                  <TableRow key={item.id || index}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.submenu}</TableCell>
                    <TableCell align="right">{added}</TableCell>
                    <TableCell align="right">{sold}</TableCell>
                    <TableCell align="right">{available}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </LocalizationProvider>
  );
};

export default StockSummery;