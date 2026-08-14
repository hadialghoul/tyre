import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import { categoryAPI } from '../utils/api';
import { Edit, Delete } from '@mui/icons-material';

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', icon: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryAPI.getAll();
      setCategories(res.data);
    } catch (err) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category = null) => {
    if (category) {
      setFormData(category);
      setEditingId(category._id);
    } else {
      setFormData({ name: '', description: '', icon: '' });
      setEditingId(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await categoryAPI.update(editingId, formData);
      } else {
        await categoryAPI.create(formData);
      }
      fetchCategories();
      handleCloseDialog();
    } catch (err) {
      setError('Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await categoryAPI.delete(id);
        fetchCategories();
      } catch (err) {
        setError('Failed to delete category');
      }
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <h2>Manage Categories</h2>
        <Button variant="contained" onClick={() => handleOpenDialog()}>
          + Add Category
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Icon</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category._id}>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.description}</TableCell>
                <TableCell>{category.icon}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => handleOpenDialog(category)}
                    startIcon={<Edit />}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleDelete(category._id)}
                    startIcon={<Delete />}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <Box sx={{ p: 2 }}>
          <h3>{editingId ? 'Edit Category' : 'Add Category'}</h3>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            placeholder="e.g., Restaurants, Hotels, etc."
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Icon (Emoji)"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            margin="normal"
            placeholder="e.g., 🍽️, 🏨, etc."
          />
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button variant="contained" onClick={handleSubmit}>
              Save
            </Button>
            <Button onClick={handleCloseDialog}>Cancel</Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ManageCategories;
