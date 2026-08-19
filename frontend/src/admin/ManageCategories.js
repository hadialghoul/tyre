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
  Typography,
} from '@mui/material';
import { categoryAPI, resolveMediaUrl } from '../utils/api';
import { Edit, Delete, Visibility, OpenInNew } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { displayCategoryCover, isSingularTechStoreName } from '../utils/visuals';
import CategoryIcon from '../components/CategoryIcon';

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', icon: '', cover: '', iconImage: '' });
  const [coverFile, setCoverFile] = useState(null);
  const [iconFile, setIconFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryAPI.getAll();
      setCategories((res.data || []).filter((cat) => !isSingularTechStoreName(cat.name)));
    } catch (err) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category = null) => {
    setCoverFile(null);
    setIconFile(null);
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        icon: category.icon || '',
        cover: category.cover || '',
        iconImage: category.iconImage || '',
      });
      setEditingId(category._id);
    } else {
      setFormData({ name: '', description: '', icon: '', cover: '', iconImage: '' });
      setEditingId(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
    setCoverFile(null);
    setIconFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    try {
      setSaving(true);
      setError('');
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('description', formData.description);
      payload.append('icon', formData.icon);
      if (coverFile) payload.append('cover', coverFile);
      if (iconFile) payload.append('iconImage', iconFile);
      if (editingId) {
        const { data } = await categoryAPI.update(editingId, payload);
        setCategories((prev) =>
          prev.map((item) => (String(item._id) === String(editingId) ? data : item))
        );
      } else {
        const { data } = await categoryAPI.create(payload);
        setCategories((prev) => [...prev, data]);
      }
      handleCloseDialog();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      setDeletingId(id);
      setError('');
      await categoryAPI.delete(id);
      setCategories((prev) => prev.filter((item) => String(item._id) !== String(id)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <h2>Manage Categories</h2>
        <Button type="button" variant="contained" onClick={() => handleOpenDialog()}>
          + Add Category
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Icon</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category._id}>
                <TableCell>
                  <Box
                    component="img"
                    src={resolveMediaUrl(displayCategoryCover(category))}
                    alt=""
                    sx={{ width: 88, height: 56, objectFit: 'cover', borderRadius: 1, display: 'block' }}
                  />
                </TableCell>
                <TableCell>
                  <CategoryIcon category={category} size={44} />
                </TableCell>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.description}</TableCell>
                <TableCell>
                  <Button
                    type="button"
                    size="small"
                    onClick={() => handleOpenDialog(category)}
                    startIcon={<Edit />}
                  >
                    Edit
                  </Button>
                  <Button
                    component={Link}
                    to={`/admin/businesses?category=${encodeURIComponent(category._id)}`}
                    size="small"
                    startIcon={<Visibility />}
                  >
                    Businesses
                  </Button>
                  <Button
                    component={Link}
                    to={`/businesses?category=${encodeURIComponent(category._id)}`}
                    size="small"
                    startIcon={<OpenInNew />}
                  >
                    Site
                  </Button>
                  <Button
                    type="button"
                    size="small"
                    color="error"
                    disabled={deletingId === category._id}
                    onClick={() => handleDelete(category._id)}
                    startIcon={<Delete />}
                  >
                    {deletingId === category._id ? 'Deleting...' : 'Delete'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
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
            label="Icon (Emoji, optional)"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            margin="normal"
            placeholder="e.g., 🍽️, 🏨, etc."
          />
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>Category icon image</Typography>
            {(iconFile || formData.iconImage) && (
              <Box
                component="img"
                src={iconFile ? URL.createObjectURL(iconFile) : resolveMediaUrl(formData.iconImage)}
                alt=""
                sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 1, display: 'block', mb: 1, bgcolor: '#0b1c22' }}
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setIconFile(e.target.files?.[0] || null)}
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>Category image</Typography>
            {(coverFile || formData.cover) && (
              <Box
                component="img"
                src={coverFile ? URL.createObjectURL(coverFile) : resolveMediaUrl(formData.cover)}
                alt=""
                sx={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 1, display: 'block', mb: 1 }}
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" onClick={handleCloseDialog} disabled={saving}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ManageCategories;
