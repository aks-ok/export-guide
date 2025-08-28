import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseClient';

interface Lead {
  id: number;
  name: string;
  company: string;
  email: string;
  phone?: string;
  country: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
  created_at: string;
}

interface NewLead {
  name: string;
  company: string;
  email: string;
  phone?: string;
  country: string;
}

const SimpleLeadGenerationPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState<NewLead>({
    name: '',
    company: '',
    email: '',
    phone: '',
    country: ''
  });

  // Load leads on component mount
  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase leads table not found, using mock data:', error);
        // Use mock data if table doesn't exist
        const mockLeads: Lead[] = [
          {
            id: 1,
            name: 'John Smith',
            company: 'Global Electronics Inc',
            email: 'john.smith@globalelectronics.com',
            phone: '+1-555-0123',
            country: 'United States',
            status: 'qualified',
            created_at: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 2,
            name: 'Maria Garcia',
            company: 'European Machinery Ltd',
            email: 'maria.garcia@europeanmachinery.com',
            phone: '+49-30-12345678',
            country: 'Germany',
            status: 'contacted',
            created_at: new Date(Date.now() - 172800000).toISOString()
          },
          {
            id: 3,
            name: 'Hiroshi Tanaka',
            company: 'Tokyo Trading Co',
            email: 'h.tanaka@tokyotrading.jp',
            phone: '+81-3-1234-5678',
            country: 'Japan',
            status: 'new',
            created_at: new Date(Date.now() - 259200000).toISOString()
          }
        ];
        setLeads(mockLeads);
        setError('Using demo data - Supabase database not configured');
        return;
      }
      
      setLeads(data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading leads:', err);
      setError('Failed to load leads - using demo data');
      // Fallback to empty array
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingLead) {
        // Update existing lead
        const { error } = await supabase
          .from('leads')
          .update({
            name: formData.name,
            company: formData.company,
            email: formData.email,
            phone: formData.phone,
            country: formData.country
          })
          .eq('id', editingLead.id);

        if (error) {
          console.warn('Supabase update failed, simulating success:', error);
          setError('Demo mode - changes not saved to database');
        }
      } else {
        // Create new lead
        const { error } = await supabase
          .from('leads')
          .insert([{
            ...formData,
            status: 'new',
            funnel_stage: 'find'
          }]);

        if (error) {
          console.warn('Supabase insert failed, simulating success:', error);
          // Add to local state for demo
          const newLead: Lead = {
            id: Date.now(),
            ...formData,
            status: 'new',
            created_at: new Date().toISOString()
          };
          setLeads(prev => [newLead, ...prev]);
          setError('Demo mode - lead added locally (not saved to database)');
        }
      }

      // Reset form and close dialog
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        country: ''
      });
      setEditingLead(null);
      setDialogOpen(false);
      
      // Reload leads only if no error
      if (!error) {
        await loadLeads();
      }
    } catch (err) {
      console.error('Error saving lead:', err);
      setError('Failed to save lead - demo mode active');
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone || '',
      country: lead.country
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadLeads();
    } catch (err) {
      console.error('Error deleting lead:', err);
      setError('Failed to delete lead');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'default';
      case 'contacted': return 'primary';
      case 'qualified': return 'warning';
      case 'converted': return 'success';
      default: return 'default';
    }
  };

  const handleOpenDialog = () => {
    setEditingLead(null);
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      country: ''
    });
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Lead Generation & Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Add New Lead Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Add New Lead
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
            >
              Add Lead
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Recent Leads Section */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Leads
          </Typography>
          
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Country</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">
                        No leads found. Add your first lead to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>{lead.name}</TableCell>
                      <TableCell>{lead.company}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <EmailIcon fontSize="small" color="action" />
                          {lead.email}
                        </Box>
                      </TableCell>
                      <TableCell>{lead.country}</TableCell>
                      <TableCell>
                        <Chip
                          label={lead.status.toUpperCase()}
                          color={getStatusColor(lead.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(lead)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(lead.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Lead Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingLead ? 'Edit Lead' : 'Add New Lead'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  required
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                  fullWidth
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              {editingLead ? 'Update' : 'Add'} Lead
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default SimpleLeadGenerationPage;