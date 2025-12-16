import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Container, Box, TextField, Button, Typography, Paper, Grid,
  AppBar, Toolbar, IconButton, Accordion, AccordionSummary, AccordionDetails,
  Select, MenuItem, FormControl, InputLabel, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, ExpandMore as ExpandMoreIcon, AddPhotoAlternate as AddPhotoAlternateIcon } from '@mui/icons-material';
import { fetchMenu } from '../api';

const AddItemPage = () => {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const location = useLocation();
  const isEditing = Boolean(itemId);

  const [formState, setFormState] = useState({
    name: '',
    h_price: '',
    f_price: '',
    category: '',
    mrp: '',
    purchasePrice: '',
    acSellPrice: '',
    acSellPriceHalf: '',
    hsnCode: '',
    itemCode: '',
    barCode: '',
    adjustStock: '',
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  // State for categories and the add category dialog
  const [categories, setCategories] = useState([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (isEditing && location.state?.item) {
      const item = location.state.item;
      setFormState({
        name: item.name || '',
        submenu: item.submenu || '',
        h_price: item.h_price || '',
        f_price: item.f_price || '',
        category: item.category || '',
        mrp: item.mrp || '',
        purchasePrice: item.purchaseprice || '',
        acSellPrice: item.ac_price || '',
        acSellPriceHalf: item.ac_price_half || '',
        hsnCode: item.hsnCode || '',
        itemCode: item.itemCode || '',
        barCode: item.barCode || '',
        adjustStock: item.adjustStock || '0',
      });
      // In a real app, you would also handle loading the image URL
    }
  }, [isEditing, location.state]);

  useEffect(() => {
    const loadCategories = async () => {
      const hotelName = location.state?.hotelName;
      if (hotelName) {
        try {
          const menuItems = await fetchMenu(hotelName);
          if (menuItems && menuItems.length > 0) {
            const uniqueCategories = [...new Set(menuItems.map(item => item.menu).filter(Boolean))];
            setCategories(uniqueCategories.sort());
          }
        } catch (error) {
          console.error("Failed to load categories:", error);
          setSnackbar({ open: true, message: 'Could not load categories.' });
        }
      }
    };
    loadCategories();
  }, [location.state]);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCategoryChange = (e) => {
    const { value } = e.target;
    if (value === 'add_new_category') {
      setNewCategory('');
      setCategoryDialogOpen(true);
    } else {
      handleInputChange(e);
    }
  };

  const handleCloseCategoryDialog = () => {
    setCategoryDialogOpen(false);
  };

  const handleAddNewCategory = () => {
    const newCategoryTrimmed = newCategory.trim();
    if (newCategoryTrimmed && !categories.includes(newCategoryTrimmed)) {
      setCategories(prev => [...prev, newCategoryTrimmed].sort());
      setFormState(prev => ({ ...prev, category: newCategoryTrimmed }));
    }
    handleCloseCategoryDialog();
  };

  const handleSave = () => {
    // In a real application, you would have form validation here
    // and then send the data to your backend API.

    // Example:
    // const formData = new FormData();
    // Object.keys(formState).forEach(key => formData.append(key, formState[key]));
    // if (image) {
    //   formData.append('itemImage', image);
    // }
    // const endpoint = isEditing ? `/api/items/${itemId}` : '/api/items';
    // const method = isEditing ? 'PUT' : 'POST';
    // fetch(endpoint, { method, body: formData }).then(...);

    setSnackbar({ open: true, message: `✅ Item ${isEditing ? 'updated' : 'saved'} successfully!` });
    setTimeout(() => navigate(-1), 1500); // Go back after showing snackbar
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {isEditing ? 'Edit Item' : 'Add New Item'}
          </Typography>
          <Button color="inherit" onClick={handleSave}>Save</Button>
        </Toolbar>
      </AppBar>

      <Container component={Paper} sx={{ p: 3, mt: 3, mb: 3 }} maxWidth="md">
        <Grid container spacing={3}>
          {/* Image Upload */}
          <Grid item xs={12}>
            <Box
              sx={{
                border: '2px dashed grey',
                borderRadius: 2,
                p: 2,
                textAlign: 'center',
                cursor: 'pointer',
                height: 150,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                backgroundImage: imagePreview ? `url(${imagePreview})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              component="label"
              htmlFor="image-upload"
            >
              {!imagePreview && (
                <>
                  <AddPhotoAlternateIcon sx={{ fontSize: 40, color: 'grey.500' }} />
                  <Typography>Upload Item Image</Typography>
                </>
              )}
              <input id="image-upload" type="file" accept="image/*" hidden onChange={handleImageChange} />
            </Box>
          </Grid>

          {/* Main Fields */}
          <Grid item xs={12}>
            <TextField
              name="name"
              label="Product/Service Name"
              value={formState.submenu}
              onChange={handleInputChange}
              fullWidth
              required
            />
          </Grid>
          {/* <Grid item xs={12}>
            <TextField
              name="name"
              label="Product/Service Name"
              value={formState.MenuItem}
              onChange={handleInputChange}
              fullWidth
              required
            />
          </Grid> */}
          <Grid item xs={12} sm={6}>
            <TextField
              name="h_price"
              label="Half Price"
              value={formState.h_price}
              onChange={handleInputChange}
              type="number"
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="f_price"
              label="Full Price"
              value={formState.f_price}
              onChange={handleInputChange}
              type="number"
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={formState.category}
                label="Category"
                onChange={handleCategoryChange}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
                <MenuItem value="add_new_category" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  + Add New Category
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
            <Grid item xs={12} sm={6}>
            <TextField
              name="mrp"
              label="MRP"
              value={formState.mrp}
              onChange={handleInputChange}
              type="number"
              fullWidth
              required
            />
          </Grid>
            <Grid item xs={12} sm={6}>
            <TextField
              name="purchasePrice"
              label="Purchase Price"
              value={formState.purchasePrice}
              onChange={handleInputChange}
              type="number"
              fullWidth
              required
            />
          </Grid>

          {/* Optional Sections */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Product Details (Optional)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField name="hsnCode" label="HSN/SAC Code" value={formState.hsnCode} onChange={handleInputChange} fullWidth />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField name="itemCode" label="Item Code/SKU" value={formState.itemCode} onChange={handleInputChange} fullWidth />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField name="barCode" label="Barcode" value={formState.barCode} onChange={handleInputChange} fullWidth />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Inventory Details (Optional)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TextField
                  name="adjustStock"
                  label="Opening Stock"
                  value={formState.adjustStock}
                  onChange={handleInputChange}
                  type="number"
                  fullWidth
                />
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Alternate Prices (Optional)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField name="acSellPrice" label="AC Price" value={formState.acSellPrice} onChange={handleInputChange} fullWidth type="number" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField name="acSellPriceHalf" label="Half AC Price" value={formState.acSellPriceHalf} onChange={handleInputChange} fullWidth type="number" />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>
      </Container>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* Add New Category Dialog */}
      <Dialog open={categoryDialogOpen} onClose={handleCloseCategoryDialog}>
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter') { handleAddNewCategory(); } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCategoryDialog}>Cancel</Button>
          <Button onClick={handleAddNewCategory} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddItemPage;