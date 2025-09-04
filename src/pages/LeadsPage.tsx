import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { colorPalette, getGradientBackground } from '../theme/ExportGuideTheme';

interface Lead {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  industry: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  dateAdded: string;
  source: string;
  notes?: string;
}

const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, statusFilter, searchTerm]);

  const loadLeads = () => {
    try {
      const savedLeads = JSON.parse(localStorage.getItem('exportguide_leads') || '[]');
      setLeads(savedLeads);
    } catch (error) {
      console.error('Error loading leads:', error);
      setLeads([]);
    }
  };

  const saveLeads = (updatedLeads: Lead[]) => {
    try {
      localStorage.setItem('exportguide_leads', JSON.stringify(updatedLeads));
      setLeads(updatedLeads);
    } catch (error) {
      console.error('Error saving leads:', error);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLeads(filtered);
  };

  const handleStatusChange = (leadId: number, newStatus: Lead['status']) => {
    const updatedLeads = leads.map(lead =>
      lead.id === leadId ? { ...lead, status: newStatus } : lead
    );
    saveLeads(updatedLeads);
  };

  const handleDeleteLead = (leadId: number) => {
    const updatedLeads = leads.filter(lead => lead.id !== leadId);
    saveLeads(updatedLeads);
  };

  const handleUpdateLead = (updatedLead: Lead) => {
    const updatedLeads = leads.map(lead =>
      lead.id === updatedLead.id ? updatedLead : lead
    );
    saveLeads(updatedLeads);
    setEditOpen(false);
    setSelectedLead(null);
  };

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'new': return 'info';
      case 'contacted': return 'warning';
      case 'qualified': return 'primary';
      case 'converted': return 'success';
      case 'lost': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: Lead['status']) => {
    switch (status) {
      case 'new': return 'New';
      case 'contacted': return 'Contacted';
      case 'qualified': return 'Qualified';
      case 'converted': return 'Converted';
      case 'lost': return 'Lost';
      default: return status;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: getGradientBackground('135deg') }}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: 'white',
              mb: 1,
              textAlign: 'center'
            }}
          >
            My Leads
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center',
              fontWeight: 400
            }}
          >
            Manage your export leads and track progress
          </Typography>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Search leads"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status Filter</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Status Filter"
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    <MenuItem value="new">New</MenuItem>
                    <MenuItem value="contacted">Contacted</MenuItem>
                    <MenuItem value="qualified">Qualified</MenuItem>
                    <MenuItem value="converted">Converted</MenuItem>
                    <MenuItem value="lost">Lost</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={5}>
                <Typography variant="body2" color="text.secondary">
                  Total Leads: {leads.length} | Filtered: {filteredLeads.length}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Leads List */}
        {filteredLeads.length === 0 ? (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <BusinessIcon sx={{ fontSize: 64, color: colorPalette.neutral[400], mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {leads.length === 0 ? 'No leads yet' : 'No leads match your filters'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {leads.length === 0 
                  ? 'Start discovering buyers to build your leads database'
                  : 'Try adjusting your search or filter criteria'
                }
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {filteredLeads.map((lead) => (
              <Grid item xs={12} md={6} lg={4} key={lead.id}>
                <Card 
                  sx={{ 
                    borderRadius: 3,
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar sx={{ bgcolor: colorPalette.primary.main, mr: 2 }}>
                        <BusinessIcon />
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {lead.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {lead.company}
                        </Typography>
                      </Box>
                      <Chip
                        label={getStatusLabel(lead.status)}
                        color={getStatusColor(lead.status)}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <EmailIcon sx={{ fontSize: 16, color: colorPalette.neutral[500], mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          {lead.email}
                        </Typography>
                      </Box>
                      {lead.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <PhoneIcon sx={{ fontSize: 16, color: colorPalette.neutral[500], mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            {lead.phone}
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationIcon sx={{ fontSize: 16, color: colorPalette.neutral[500], mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          {lead.country}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value as Lead['status'])}
                          size="small"
                        >
                          <MenuItem value="new">New</MenuItem>
                          <MenuItem value="contacted">Contacted</MenuItem>
                          <MenuItem value="qualified">Qualified</MenuItem>
                          <MenuItem value="converted">Converted</MenuItem>
                          <MenuItem value="lost">Lost</MenuItem>
                        </Select>
                      </FormControl>

                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedLead(lead);
                            setDetailsOpen(true);
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedLead(lead);
                            setEditOpen(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteLead(lead.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Added: {new Date(lead.dateAdded).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Lead Details Dialog */}
        <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Lead Details</DialogTitle>
          <DialogContent>
            {selectedLead && (
              <Box>
                <Typography variant="h6" gutterBottom>{selectedLead.name}</Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {selectedLead.company}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{selectedLead.email}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1">{selectedLead.phone || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Country</Typography>
                    <Typography variant="body1">{selectedLead.country}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Industry</Typography>
                    <Typography variant="body1">{selectedLead.industry}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip
                      label={getStatusLabel(selectedLead.status)}
                      color={getStatusColor(selectedLead.status)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Source</Typography>
                    <Typography variant="body1">{selectedLead.source}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Date Added</Typography>
                    <Typography variant="body1">
                      {new Date(selectedLead.dateAdded).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Lead Dialog */}
        <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Lead</DialogTitle>
          <DialogContent>
            {selectedLead && (
              <Box component="form" sx={{ mt: 1 }}>
                <TextField
                  fullWidth
                  label="Name"
                  value={selectedLead.name}
                  onChange={(e) => setSelectedLead({ ...selectedLead, name: e.target.value })}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Company"
                  value={selectedLead.company}
                  onChange={(e) => setSelectedLead({ ...selectedLead, company: e.target.value })}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Email"
                  value={selectedLead.email}
                  onChange={(e) => setSelectedLead({ ...selectedLead, email: e.target.value })}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Phone"
                  value={selectedLead.phone}
                  onChange={(e) => setSelectedLead({ ...selectedLead, phone: e.target.value })}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Country"
                  value={selectedLead.country}
                  onChange={(e) => setSelectedLead({ ...selectedLead, country: e.target.value })}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Notes"
                  value={selectedLead.notes || ''}
                  onChange={(e) => setSelectedLead({ ...selectedLead, notes: e.target.value })}
                  margin="normal"
                  multiline
                  rows={3}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => selectedLead && handleUpdateLead(selectedLead)}
              variant="contained"
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default LeadsPage;