import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container, Box, Typography, Paper, Grid, AppBar, Toolbar, IconButton,
  CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fetchTransactions } from '../api';

const ProfitPage = () => {
  const navigate = useNavigate();
  const { hotelName } = useParams();
  const [transactions, setTransactions] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Default date range to today
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

  useEffect(() => {
    const fetchData = async () => {
      if (!hotelName) {
        setError("Hotel name not provided.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Fetch both transactions and menu items
        const [transData, menuDataResponse] = await Promise.all([
          fetchTransactions(),
          fetch(`https://api2.nextorbitals.in/api/get_menu.php?hotel_name=${hotelName}&menutype=ac`)
        ]);

        // Filter transactions for the current hotel
        const hotelTransactions = transData.filter(t => t.hotel_name === hotelName);
        setTransactions(hotelTransactions);

        if (menuDataResponse.ok) {
          const menuJson = await menuDataResponse.json();
          if (menuJson.data && Array.isArray(menuJson.data)) {
            setMenuItems(menuJson.data);
          } else {
            throw new Error("Menu data is not in the expected format.");
          }
        } else {
          throw new Error(`Failed to fetch menu: ${menuDataResponse.statusText}`);
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching profit data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hotelName]);

  const profitData = useMemo(() => {
    if (!transactions.length || !menuItems.length) {
      return { itemProfits: [], totalProfit: 0 };
    }

    const menuMap = new Map(menuItems.map(item => [item.submenu, item]));
    const itemProfits = new Map();

    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.transaction_time);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    filteredTransactions.forEach(t => {
      try {
        if (t.cart_data && typeof t.cart_data === 'string') {
          const cart = JSON.parse(t.cart_data.replace(/'/g, '"'));
          cart.forEach(cartItem => {
            const isHalf = cartItem.name.includes('(Half)');
            // Find the base menu item, whether it's a half or full item.
            const baseItemName = isHalf ? cartItem.name.replace(/\s*\(Half\)/, '').trim() : cartItem.name;
            const menuItem = menuMap.get(baseItemName);

            if (menuItem) {
              let purchasePrice = parseFloat(menuItem.purchasePrice) || 0;
              const sellingPrice = parseFloat(cartItem.sellPrice) || 0;
              const quantity = parseInt(cartItem.qty, 10) || 0;

              // If it's a half item, use half the purchase price.
              if (isHalf) {
                purchasePrice = purchasePrice / 2;
              }
              const profit = (sellingPrice - purchasePrice) * quantity;

              if (itemProfits.has(cartItem.name)) {
                const existing = itemProfits.get(cartItem.name);
                existing.qtySold += quantity;
                existing.totalProfit += profit;
              } else {
                itemProfits.set(cartItem.name, {
                  name: cartItem.name,
                  qtySold: quantity,
                  sellingPrice,
                  purchasePrice,
                  totalProfit: profit,
                });
              }
            }
          });
        }
      } catch (e) {
        console.error("Error parsing cart data for profit calculation:", t.cart_data, e);
      }
    });

    const profitArray = Array.from(itemProfits.values());
    const totalProfit = profitArray.reduce((acc, item) => acc + item.totalProfit, 0);

    return { itemProfits: profitArray, totalProfit };
  }, [transactions, menuItems, startDate, endDate]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Box sx={{ textAlign: 'center', mt: 4 }}><Typography color="error">{error}</Typography></Box>;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Profit Report for {hotelName.replaceAll("_", " ")}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <DatePicker label="Start Date" value={startDate} onChange={setStartDate} slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker label="End Date" value={endDate} onChange={setEndDate} slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper elevation={3} sx={{ p: 2, textAlign: 'center', backgroundColor: 'primary.main', color: 'white' }}>
                <Typography variant="h6">Total Profit</Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  ₹{profitData.totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        <TableContainer component={Paper}>
          <Table aria-label="profit report table">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                <TableCell>Item Name</TableCell>
                <TableCell align="right">Qty Sold</TableCell>
                <TableCell align="right">Selling Price</TableCell>
                <TableCell align="right">Purchase Price</TableCell>
                <TableCell align="right">Profit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {profitData.itemProfits.map((item) => (
                <TableRow key={item.name}>
                  <TableCell component="th" scope="row">{item.name}</TableCell>
                  <TableCell align="right">{item.qtySold}</TableCell>
                  <TableCell align="right">₹{item.sellingPrice.toFixed(2)}</TableCell>
                  <TableCell align="right">₹{item.purchasePrice.toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    ₹{item.totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </LocalizationProvider>
  );
};

export default ProfitPage;