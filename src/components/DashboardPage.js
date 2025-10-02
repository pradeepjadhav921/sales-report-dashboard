// src/components/DashboardPage.js

import React, { useState, useEffect, useMemo } from 'react';
import { fetchTransactions } from '../api';
import SalesChart from './SalesChart';
import {
  AppBar, Toolbar, Typography, Container, Select, MenuItem, FormControl, InputLabel,
  Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
  Box, CircularProgress, Collapse, IconButton, Grid, useMediaQuery, useTheme
} from '@mui/material';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';


const TransactionRow = ({ row, sx }) => {
  const [open, setOpen] = useState(false);

  let parsedCartData = [];
  try {
    if (row.cart_data && typeof row.cart_data === 'string') {
      const validJsonString = row.cart_data.replace(/'/g, '"');
      parsedCartData = JSON.parse(validJsonString);
    }
  } catch (error) {
    console.error("Failed to parse cart_data:", row.cart_data, error);
  }
  
  const cartDataLength = parsedCartData.length;

  return (
    <>
      <TableRow
        sx={{ 
          '& > *': { borderBottom: 'unset' },
          cursor: 'pointer',
          '&:hover': { backgroundColor: '#f5f5f5' }
        }}
        onClick={() => setOpen(!open)}
      >
        <TableCell sx={sx}>{row.transactions_id}</TableCell>
        <TableCell sx={sx}>{row.payment_mode}</TableCell>
        <TableCell sx={sx}>{cartDataLength}</TableCell>
        <TableCell sx={sx}>₹{parseFloat(row.total_amount).toLocaleString()}</TableCell>
        <TableCell sx={sx}>
          {new Date(row.transaction_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </TableCell>
        <TableCell sx={sx}>{row.table_number}</TableCell>
        <TableCell sx={sx}>
          {row.hotel_name.replaceAll("_"," ")}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">Order Details</Typography>
              <Table size="small" aria-label="cart items">
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell><TableCell>Quantity</TableCell><TableCell align="right">Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parsedCartData.map((item, index) => (
                    <TableRow key={item.id || index}>
                      <TableCell>{item.name}</TableCell><TableCell>{item.qty}</TableCell><TableCell align="right">₹{parseFloat(item.sellPrice).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};


const DashboardPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState('All');
  const [timeFilter, setTimeFilter] = useState('Day');
  const [hotelsList, setHotelsList] = useState([]);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  });

  // --- CHANGE 1: Add theme and media query hooks to detect mobile screens ---
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));


  useEffect(() => {
    const loadData = async () => {
     const hotels = localStorage.getItem('hotels');
     const hotels_list = hotels.split(",");
     setHotelsList(hotels_list);
    };
    loadData();
  }, []);


  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchTransactions();
        setTransactions(data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const hotelNames = useMemo(() => ['All', ...new Set(transactions.map(t => t.hotel_name).filter(Boolean))], [transactions]);

  // const hotelNames = useMemo(() => {
  //   const uniqueHotels = [...new Set(transactions
  //     .map(t => t.hotel_name)
  //     .filter(name => name && hotelsList.includes(name))
  //   )];
  //   return ['All', ...uniqueHotels];
  // }, [transactions, hotelsList]);

  const chartData = useMemo(() => {
    const hotelFiltered = transactions.filter(t => selectedHotel === 'All' || t.hotel_name === selectedHotel);
    console.log("hotelFiltered",hotelFiltered)
    const now = new Date();
    const toLocalISOString = (date) => {
      if (!date) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    if (timeFilter === 'Day') {
      const last7Days = [...Array(7)].map((_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i)));
      return last7Days.map(day => {
        // --- 2. USE THE HELPER FUNCTION HERE ---
        const dayString = toLocalISOString(day);
        const totalSales = hotelFiltered
            .filter(t => toLocalISOString(new Date(t.transaction_time)) === dayString) // <-- AND HERE
            .reduce((acc, curr) => acc + parseFloat(curr.total_amount || 0), 0);
        return { name: day.toLocaleString('en-US', { weekday: 'short', day: 'numeric' }), Sales: totalSales };
      });
    }
    if (timeFilter === 'Month') {
      const last7Months = [...Array(7)].map((_, i) => new Date(now.getFullYear(), now.getMonth() - (6 - i), 1));
      return last7Months.map(monthDate => {
        const year = monthDate.getFullYear(); const month = monthDate.getMonth();
        const totalSales = hotelFiltered.filter(t => { const d = new Date(t.transaction_time); return d.getFullYear() === year && d.getMonth() === month; }).reduce((acc, curr) => acc + parseFloat(curr.total_amount || 0), 0);
        return { name: monthDate.toLocaleString('en-US', { month: 'short', year: '2-digit' }), Sales: totalSales };
      });
    }
    if (timeFilter === 'Year') {
      const last7Years = [...Array(7)].map((_, i) => new Date(now.getFullYear() - (6 - i), 0, 1));
      return last7Years.map(yearDate => {
        const year = yearDate.getFullYear();
        const totalSales = hotelFiltered.filter(t => new Date(t.transaction_time).getFullYear() === year).reduce((acc, curr) => acc + parseFloat(curr.total_amount || 0), 0);
        return { name: year.toString(), Sales: totalSales };
      });
    }
    return [];
  }, [transactions, selectedHotel, timeFilter]);
  
  const tableData = useMemo(() => {
    const effectiveEndDate = endDate ? new Date(endDate) : null;
    if (effectiveEndDate) effectiveEndDate.setHours(23, 59, 59, 999);
    return transactions.filter(t => {
      const hotelMatch = selectedHotel === 'All' || t.hotel_name === selectedHotel;
      if (!startDate && !endDate) return hotelMatch;
      const transactionDate = new Date(t.transaction_time);
      const startDateMatch = !startDate || transactionDate >= new Date(startDate);
      const endDateMatch = !effectiveEndDate || transactionDate <= effectiveEndDate;
      return hotelMatch && startDateMatch && endDateMatch;
    });
  }, [transactions, selectedHotel, startDate, endDate]);

  const tableTotals = useMemo(() => {
    return tableData.reduce((acc, curr) => {
        const amount = parseFloat(curr.total_amount) || 0;
        acc.totalSales += amount;
        if (curr.payment_mode === 'CASH') acc.cash += amount;
        if (curr.payment_mode === 'UPI') acc.upi += amount;
        return acc;
    }, { totalSales: 0, cash: 0, upi: 0 });
  }, [tableData]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;

  const mobileTableSx = {
    textAlign: 'center',
    whiteSpace: 'nowrap', 
    padding: { xs: '6px 4px', sm: '6px 16px' },
    fontSize: { xs: '0.75rem', sm: '0.875rem' },
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <AppBar position="static"><Toolbar><Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>Sales Dashboard</Typography></Toolbar></AppBar>
      <Container maxWidth="xl" sx={{ mt: {xs: 2, sm: 4}, mb: 4, px: { xs: 0, sm: 3 } }}>
        <Paper sx={{ p: { xs: 1, sm: 2 }, mb: { xs: 2, sm: 3 } }}>
          <Grid container spacing={{ xs: 1, sm: 3 }} alignItems="center">
            <Grid item xs={12} sm={6}><FormControl fullWidth size="small"><InputLabel>Hotel Name</InputLabel><Select value={selectedHotel} label="Hotel Name" onChange={(e) => setSelectedHotel(e.target.value)}>{hotelNames.map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12} sm={6}><FormControl fullWidth size="small"><InputLabel>Time Period</InputLabel><Select value={timeFilter} label="Time Period" onChange={(e) => setTimeFilter(e.target.value)}><MenuItem value="Day">Last 7 Days</MenuItem><MenuItem value="Month">Last 7 Months</MenuItem><MenuItem value="Year">Last 7 Years</MenuItem></Select></FormControl></Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: { xs: 1, sm: 2 }, mb: { xs: 2, sm: 3 } }}>
          <SalesChart data={chartData} timeFilter={timeFilter} />
        </Paper>

        {/* --- THIS ENTIRE SECTION HAS BEEN UPDATED FOR MOBILE --- */}
        <Paper sx={{ p: { xs: 1, sm: 2 }, mb: { xs: 0, sm: 3 } }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexDirection: { xs: 'row', md: 'row' } }}>
            <DatePicker
              label={isMobile ? "Start" : "Start Date"}
              value={startDate}
              onChange={setStartDate}
              // Use a more compact date format on mobile
              format={isMobile ? "dd/MM/yy" : "MM/dd/yyyy"}
              slotProps={{
                textField: {
                  size: 'small',
                  // Reduce font and padding for a tighter fit
                  sx: {
                    '& .MuiInputBase-input': {
                      fontSize: { xs: '0.8rem', sm: '1rem' },
                      padding: '8.5px 10px',
                    },
                  },
                },
              }}
            />
            <DatePicker 
              label={isMobile ? "End" : "End Date"}
              value={endDate}
              onChange={setEndDate}
              format={isMobile ? "dd/MM/yy" : "MM/dd/yyyy"}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: {
                    '& .MuiInputBase-input': {
                      fontSize: { xs: '0.8rem', sm: '1rem' },
                      padding: '8.5px 10px',
                    },
                  },
                },
              }}
            />
          </Box>
        </Paper>
                {/* --- THIS ENTIRE SECTION HAS BEEN UPDATED FOR MOBILE --- */}
        <Paper sx={{ p: { xs: 1, sm: 2 }, mb: { xs: 2, sm: 3 } ,margin: 'auto',Align: 'center',alignItems: 'center', }}>
          {/* --- CHANGE: Using a Flexbox Box instead of Grid for simpler alignment --- */}
          <Box sx={{ 
              display: 'flex', 
              gap: 3, 
              margin: 'auto', 
              alignItems: 'center', 
              justifyContent: 'center', 
              flexDirection: { xs: 'row', md: 'row' } 
            }}>
            <Grid item xs={5}>
              <Box sx={{ p: 1,gap: 3, Align: 'center', margin: 'auto',backgroundColor: '#f5f5f5', borderRadius: 1, height: '100%', display: 'flex',alignItems: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>
                    {isMobile ? "Trans" : "Transactions"}
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: { xs: '0.8rem', sm: '1.25rem' } }}>
                    {tableData.length}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>
                    {isMobile ? "Sales" : "Total Sales"}
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: { xs: '0.8rem', sm: '1.25rem' } }}>
                    ₹{tableTotals.totalSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Typography>
                </Box>
                {/* Cash and UPI remain hidden on mobile to save space */}
                <Box sx={{ textAlign: 'center', }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>
                    {isMobile ? "Cash" : "Cash"}
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#2e7d32',fontSize: { xs: '0.8rem', sm: '1.25rem' } }}>
                    ₹{tableTotals.cash.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>
                    {isMobile ? "UPI" : "UPI"}
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#1565c0', fontSize: { xs: '0.8rem', sm: '1.25rem' } }}>
                    ₹{tableTotals.upi.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Box>
        </Paper>

        <TableContainer component={Paper} sx={{ boxShadow: { xs: 'none', sm: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)' } }}>
          <Table aria-label="collapsible table" size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={mobileTableSx}>Bill No</TableCell>
                <TableCell sx={mobileTableSx}>Mode</TableCell>
                <TableCell sx={mobileTableSx}>Items</TableCell>
                <TableCell sx={mobileTableSx}>Total</TableCell>
                <TableCell sx={mobileTableSx}>Time</TableCell>
                <TableCell sx={mobileTableSx}>Table No</TableCell>
                <TableCell sx={mobileTableSx}>Hotel</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{tableData.map((row) => (<TransactionRow key={row.id} row={row} sx={mobileTableSx} />))}</TableBody>
          </Table>
        </TableContainer>
      </Container>
    </LocalizationProvider>
  );
};

export default DashboardPage;