import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Divider
} from '@mui/material';
import {
  Business as BusinessIcon,
  Event as EventIcon,
  TrendingUp as TrendingUpIcon,
  Public as PublicIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  Launch as LaunchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';

interface TradeEvent {
  id: number;
  title: string;
  organization: 'CII' | 'FICCI' | 'EEPC' | 'FIEO';
  date: string;
  location: string;
  type: 'trade_fair' | 'delegation' | 'seminar' | 'networking';
  sectors: string[];
  countries: string[];
  registration_deadline: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

interface TradeOpportunity {
  id: number;
  title: string;
  organization: 'CII' | 'FICCI' | 'EEPC' | 'FIEO';
  country: string;
  sector: string;
  value_range: string;
  deadline: string;
  requirements: string[];
  contact_person: string;
  contact_email: string;
}

const IndianTradeOrgsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [tradeEvents, setTradeEvents] = useState<TradeEvent[]>([]);
  const [opportunities, setOpportunities] = useState<TradeOpportunity[]>([]);

  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Mock trade events data
    const mockEvents: TradeEvent[] = [
      {
        id: 1,
        title: 'India-Germany Business Summit 2025',
        organization: 'CII',
        date: '2025-03-15',
        location: 'New Delhi',
        type: 'delegation',
        sectors: ['Engineering', 'Automotive', 'IT'],
        countries: ['Germany'],
        registration_deadline: '2025-02-28',
        status: 'upcoming'
      },
      {
        id: 2,
        title: 'FICCI Global Skills Summit',
        organization: 'FICCI',
        date: '2025-02-20',
        location: 'Mumbai',
        type: 'seminar',
        sectors: ['Education', 'IT Services', 'Healthcare'],
        countries: ['Global'],
        registration_deadline: '2025-02-15',
        status: 'upcoming'
      },
      {
        id: 3,
        title: 'Engineering Export Promotion Fair',
        organization: 'EEPC',
        date: '2025-04-10',
        location: 'Chennai',
        type: 'trade_fair',
        sectors: ['Engineering', 'Machinery', 'Auto Components'],
        countries: ['USA', 'UK', 'Japan'],
        registration_deadline: '2025-03-25',
        status: 'upcoming'
      },
      {
        id: 4,
        title: 'FIEO Export Excellence Awards',
        organization: 'FIEO',
        date: '2025-05-05',
        location: 'Bangalore',
        type: 'networking',
        sectors: ['All Sectors'],
        countries: ['Global'],
        registration_deadline: '2025-04-20',
        status: 'upcoming'
      }
    ];

    // Mock trade opportunities
    const mockOpportunities: TradeOpportunity[] = [
      {
        id: 1,
        title: 'Electronics Components Export to Germany',
        organization: 'CII',
        country: 'Germany',
        sector: 'Electronics',
        value_range: '$500K - $2M',
        deadline: '2025-03-01',
        requirements: ['ISO 9001 Certification', 'CE Marking', 'Minimum 5 years experience'],
        contact_person: 'Rajesh Kumar',
        contact_email: 'rajesh.kumar@cii.in'
      },
      {
        id: 2,
        title: 'Textile Export Opportunity - UAE',
        organization: 'FICCI',
        country: 'UAE',
        sector: 'Textiles',
        value_range: '$1M - $5M',
        deadline: '2025-02-25',
        requirements: ['GOTS Certification', 'Export License', 'Quality Assurance'],
        contact_person: 'Priya Sharma',
        contact_email: 'priya.sharma@ficci.com'
      },
      {
        id: 3,
        title: 'Engineering Goods - USA Market',
        organization: 'EEPC',
        country: 'USA',
        sector: 'Engineering',
        value_range: '$2M - $10M',
        deadline: '2025-03-15',
        requirements: ['ASME Certification', 'FDA Approval (if applicable)', 'UL Listing'],
        contact_person: 'Amit Patel',
        contact_email: 'amit.patel@eepcindia.org'
      }
    ];

    setTradeEvents(mockEvents);
    setOpportunities(mockOpportunities);
  };

  const getOrgColor = (org: string) => {
    switch (org) {
      case 'CII': return 'primary';
      case 'FICCI': return 'secondary';
      case 'EEPC': return 'success';
      case 'FIEO': return 'warning';
      default: return 'default';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'trade_fair': return <BusinessIcon />;
      case 'delegation': return <GroupIcon />;
      case 'seminar': return <AssignmentIcon />;
      case 'networking': return <PublicIcon />;
      default: return <EventIcon />;
    }
  };

  const organizations = [
    {
      name: 'CII',
      fullName: 'Confederation of Indian Industry',
      description: 'Premier business association in India with over 9,000 members',
      website: 'https://www.cii.in',
      phone: '+91-11-2462-9994',
      email: 'info@cii.in',
      address: 'The Mantosh Sondhi Centre, 23, Institutional Area, Lodi Road, New Delhi',
      services: [
        'Trade Delegations',
        'Business Matching',
        'Policy Advocacy',
        'Industry Reports',
        'Export Promotion'
      ]
    },
    {
      name: 'FICCI',
      fullName: 'Federation of Indian Chambers of Commerce & Industry',
      description: 'Apex business organization in India established in 1927',
      website: 'https://www.ficci.in',
      phone: '+91-11-2373-8760',
      email: 'ficci@ficci.com',
      address: 'Federation House, Tansen Marg, New Delhi',
      services: [
        'Global Trade Facilitation',
        'Sector Expertise',
        'Government Relations',
        'International Partnerships',
        'Business Intelligence'
      ]
    },
    {
      name: 'EEPC',
      fullName: 'Engineering Export Promotion Council',
      description: 'Apex body for promoting engineering exports from India',
      website: 'https://www.eepcindia.org',
      phone: '+91-33-2290-7851',
      email: 'eepccal@eepcindia.net',
      address: 'Vanijya Bhawan, International Trade Facilitation Centre, Kolkata',
      services: [
        'Engineering Exports',
        'Market Development',
        'Trade Fairs',
        'Buyer-Seller Meets',
        'Export Statistics'
      ]
    },
    {
      name: 'FIEO',
      fullName: 'Federation of Indian Export Organisations',
      description: 'Apex body of Indian exporters with 25,000+ members',
      website: 'https://www.fieo.org',
      phone: '+91-11-2331-4171',
      email: 'fieo@fieo.com',
      address: 'PHD House, 4th Floor, 4/2 Siri Institutional Area, New Delhi',
      services: [
        'Export Promotion',
        'Trade Policy',
        'Market Intelligence',
        'Export Awards',
        'Training Programs'
      ]
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Indian Trade Organizations
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Connect with India's premier trade organizations to access global markets, 
        trade delegations, and export opportunities.
      </Alert>

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Organizations" />
        <Tab label="Trade Events" />
        <Tab label="Export Opportunities" />
        <Tab label="Membership Benefits" />
      </Tabs>

      {/* Organizations Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {organizations.map((org) => (
            <Grid item xs={12} md={6} key={org.name}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      {org.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{org.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {org.fullName}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" paragraph>
                    {org.description}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Key Services:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {org.services.map((service) => (
                        <Chip key={service} label={service} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>

                  <List dense>
                    <ListItem>
                      <ListItemIcon><LocationIcon fontSize="small" /></ListItemIcon>
                      <ListItemText 
                        primary={org.address}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><PhoneIcon fontSize="small" /></ListItemIcon>
                      <ListItemText 
                        primary={org.phone}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><EmailIcon fontSize="small" /></ListItemIcon>
                      <ListItemText 
                        primary={org.email}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  </List>

                  <Button
                    variant="outlined"
                    startIcon={<LaunchIcon />}
                    href={org.website}
                    target="_blank"
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Visit Website
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Trade Events Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          {tradeEvents.map((event) => (
            <Grid item xs={12} md={6} key={event.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getEventTypeIcon(event.type)}
                      <Typography variant="h6">{event.title}</Typography>
                    </Box>
                    <Chip 
                      label={event.organization} 
                      color={getOrgColor(event.organization) as any}
                      size="small"
                    />
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Date</Typography>
                      <Typography variant="body2">{new Date(event.date).toLocaleDateString()}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Location</Typography>
                      <Typography variant="body2">{event.location}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Registration Deadline</Typography>
                      <Typography variant="body2">{new Date(event.registration_deadline).toLocaleDateString()}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Status</Typography>
                      <Chip 
                        label={event.status.toUpperCase()} 
                        color={event.status === 'upcoming' ? 'success' : 'default'}
                        size="small"
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Sectors:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {event.sectors.map((sector) => (
                        <Chip key={sector} label={sector} size="small" />
                      ))}
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Target Countries:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {event.countries.map((country) => (
                        <Chip key={country} label={country} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>

                  <Button variant="contained" fullWidth>
                    Register for Event
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Export Opportunities Tab */}
      {activeTab === 2 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Opportunity</TableCell>
                <TableCell>Organization</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Sector</TableCell>
                <TableCell>Value Range</TableCell>
                <TableCell>Deadline</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {opportunities.map((opp) => (
                <TableRow key={opp.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {opp.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Contact: {opp.contact_person}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={opp.organization} 
                      color={getOrgColor(opp.organization) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{opp.country}</TableCell>
                  <TableCell>{opp.sector}</TableCell>
                  <TableCell>{opp.value_range}</TableCell>
                  <TableCell>{new Date(opp.deadline).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined">
                      Apply
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Membership Benefits Tab */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  CII Membership Benefits
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><TrendingUpIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Trade Delegations"
                      secondary="Access to high-level business delegations to 50+ countries"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><BusinessIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Business Matching"
                      secondary="Connect with verified international buyers and partners"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><AssignmentIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Industry Reports"
                      secondary="Access to exclusive market research and industry insights"
                    />
                  </ListItem>
                </List>
                <Typography variant="body2" color="text.secondary">
                  Membership: ₹25,000 - ₹5,00,000 annually
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="secondary">
                  FICCI Membership Benefits
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><PublicIcon color="secondary" /></ListItemIcon>
                    <ListItemText 
                      primary="Global Network"
                      secondary="Access to FICCI's global network of chambers and partners"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><GroupIcon color="secondary" /></ListItemIcon>
                    <ListItemText 
                      primary="Policy Advocacy"
                      secondary="Influence policy making through FICCI's government relations"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><EventIcon color="secondary" /></ListItemIcon>
                    <ListItemText 
                      primary="Premium Events"
                      secondary="Exclusive access to high-profile business events and summits"
                    />
                  </ListItem>
                </List>
                <Typography variant="body2" color="text.secondary">
                  Membership: ₹50,000 - ₹10,00,000 annually
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Alert severity="success">
              <Typography variant="body2">
                <strong>Pro Tip:</strong> Many exporters find that CII and FICCI memberships 
                pay for themselves through a single successful business connection or trade delegation. 
                Consider starting with associate membership to test the benefits.
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default IndianTradeOrgsPage;