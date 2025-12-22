import React, { useState, useEffect, useMemo } from 'react';
import {
  AppBar, Toolbar, Typography, Container, TextField, IconButton, Card, CardContent,
  Grid, Box, CircularProgress, Fab, Dialog, DialogActions, DialogContent,
  DialogTitle, Button, Snackbar
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Clear as ClearIcon, Check as CheckIcon, Image as ImageIcon, ArrowBack as ArrowBackIcon, Sync as SyncIcon, TimerOutlined } from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { fetchMenu, syncMenu } from '../api';

export const InventoryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hotelName } = useParams(); // Get hotelName from URL
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  // State for Adjust Stock Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [stockToAdd, setStockToAdd] = useState(0);
  const [lastid, setLastId] = useState(0);

  useEffect(() => {
    const loadMenu = async () => {
      setLoading(true);
      try {
        const menuItems = await fetchMenu(hotelName);
        if (menuItems && menuItems.length > 0) {
          const lastItem = menuItems[menuItems.length - 1];
          const numericPart = String(lastItem.id).replace(/\D/g, '');
          setLastId(numericPart ? parseInt(numericPart, 10) : menuItems.length);
        }
        setItems(menuItems);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching menu:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, [hotelName, location.state?.itemUpdated]); // Re-run effect if hotelName changes or an item was updated

  const handleSync = async () => {
    setLoading(true);
    try {
      const menuItems = await syncMenu(hotelName);
      setItems(menuItems);
      setSnackbar({ open: true, message: 'Menu synced successfully!' });
    } catch (err) {
      setError(err.message);
      console.error("Error syncing menu:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery) {
      return items;
    }
    return items.filter(item =>
      item.submenu && typeof item.submenu === 'string' && item.submenu.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const handleOpenDialog = (e, item) => {
    // Stop the card's onClick from firing when the button is clicked.
    e.stopPropagation(); 

    setCurrentItem(item);
    setStockToAdd(0);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentItem(null);

  };


  const saveItemQTY = async (id, name, qty) => {
    const localStorageKey = `qty_${hotelName}`;
    let storedMenuItems = JSON.parse(localStorage.getItem(localStorageKey) || '[]');

    const existingItemIndex = storedMenuItems.findIndex(item => item.id === id);

    if (existingItemIndex !== -1) {
      storedMenuItems[existingItemIndex] = {
        ...storedMenuItems[existingItemIndex],
        adjustStock: qty
      };
    } else {
      storedMenuItems.push({ id, name, adjustStock: qty });
    }
    localStorage.setItem(localStorageKey, JSON.stringify(storedMenuItems));
  };


 const handleAdjustStock = async () => {

    const stockValue = stockToAdd; // STRING

    // strict validation (digits only)
    if (stockValue < 0) {
      setSnackbar({ open: true, message: 'Please enter a valid stock number.' });
      return;
    }

    // strict validation (digits only)
    if (!/^\d+$/.test(stockValue)) {
      setSnackbar({ open: true, message: 'Please enter a valid stock number.' });
      return;
    }

    try {
      const response = await fetch(
        'https://api2.nextorbitals.in/api/add_item.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            hotel_name: hotelName,
            issingle: true,
            ovweridestock: true,
            menuItems: [
              {
                id: currentItem.id,
                // menu: currentItem.menu,
                // submenu: currentItem.submenu,
                // purchaseprice: currentItem.purchaseprice || 0,
                // mrp: currentItem.mrp || 0,

                // ✅ ABSOLUTE OVERWRITE AS STRING
                morning_stock: stockValue,
                stock: stockValue
              }
            ]
          })
        }
      );
      console.log("response",response);
      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Failed to update stock');
      }

      // ✅ Update UI AFTER backend success
      setTimeout(() => {
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === currentItem.id
              ? { ...item, stock: stockValue, adjustStock: stockValue }
              : item
          )
        );
      }, 100); // 100ms delay to ensure UI refresh

      // Update localStorage as well
      const localStorageKey = `menu_${hotelName}`;
      const storedMenuItems = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
      const updatedMenuItems = storedMenuItems.map(item => {
        if (item.id === currentItem.id) {
          return {
            ...item,
            stock: stockValue, // Update the 'stock' property
            adjustStock: stockValue // Also update 'adjustStock' for consistency with UI display
          };
        }
        return item;
      });
      localStorage.setItem(localStorageKey, JSON.stringify(updatedMenuItems));

      setSnackbar({
        open: true,
        message: `✅ Stock updated for ${currentItem.submenu}`
      });

      // saveItemQTY(currentItem.id,currentItem.name,stockValue);

      handleCloseDialog();

    } catch (error) {
      console.error(error);
      setSnackbar({
        open: true,
        message: `❌ ${error.message}`
      });
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="back" onClick={() => navigate(-1)} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          {isSearching ? (
            <TextField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              fullWidth
              placeholder="Search Items..."
              variant="standard"
              InputProps={{
                disableUnderline: true,
                style: { color: 'white', fontSize: 18 },
              }}
            />
          ) : (
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Inventory ({filteredItems.length})
            </Typography>
          )}
          <IconButton color="inherit" onClick={handleSync}>
            <SyncIcon />
          </IconButton>
          {isSearching ? (
            <IconButton color="inherit" onClick={() => { setSearchQuery(''); setIsSearching(false); }}>
              <ClearIcon />
            </IconButton>
          ) : (
            <IconButton color="inherit" onClick={() => setIsSearching(true)}>
              <SearchIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 12 }}>
        {filteredItems.length === 0 ? (
          <Typography sx={{ textAlign: 'center', mt: 6 }}>
            {searchQuery ? 'No items match your search.' : 'No items found.'}
          </Typography>
        ) : (
          <Grid container spacing={3} justifyContent="center">
            {filteredItems.map((item) => (
              <Grid item key={item.id}>
                <Card
                  sx={{ width: 350, display: 'flex', flexDirection: 'column', height: '100%', cursor: 'pointer' }}
                  onClick={() => navigate(`/edit-item/${item.id}`, { state: { item, hotelName } })}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', mb: 2 }}>
                       <Box sx={{ width: 60, height: 60, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2, borderRadius: 1 }}>
                          <ImageIcon color="disabled" />
                       </Box>
                      <Box sx={{ minWidth: 0 }}> {/* Allow this box to shrink and text to wrap */}
                        <Typography 
                          variant="h6" 
                          component="div" 
                          sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, wordWrap: 'break-word', fontWeight: 'bold' }}
                        >
                          {item.submenu || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ wordWrap: 'break-word' }}>Barcode: {item.barCode || 'N/A'}</Typography>
                        {item.h_price > 0 && (
                          <Typography variant="body1">Half ₹ {item.h_price}</Typography>
                        )}
                          <Typography variant="body1">Full ₹ {item.f_price || 0}</Typography>
                      </Box>
                    </Box>
                    <Typography variant="h6">Current Stock: {item.adjustStock || 0}</Typography>
                  </CardContent>
                  <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <Button variant="contained" size="small" onClick={(e) => handleOpenDialog(e, item)}>
                       Adjust Stock
                     </Button>
                     <CheckIcon color="success" />
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => navigate('/add-item', { state: { hotelName , lastid } })}
      >
        <AddIcon />
      </Fab>

      {/* Adjust Stock Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Adjust Stock for {currentItem?.submenu}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Quantity to Add"
            type="number"
            fullWidth
            variant="outlined"
            value={stockToAdd}
            onChange={(e) => setStockToAdd( e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter') { handleAdjustStock(); } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleAdjustStock} variant="contained">OK</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </>
  );
};

export default InventoryPage;