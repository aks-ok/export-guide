import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Skeleton,
  Tooltip,
  Snackbar,
  Tabs,
  Tab,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Business as BusinessIcon,
  Public as PublicIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  Search as SearchIcon,
  ArrowForward as ArrowForwardIcon,
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  MoreHoriz as MoreHorizIcon,
} from '@mui/icons-material';
import { colorPalette, getGradientBackground, getBoxShadow } from '../theme/ExportGuideTheme';
import { dashboardService } from '../services/DashboardService';
import { DashboardStats, PerformanceMetrics } from '../services/types';
import { useErrorHandler } from '../services/ErrorHandler';
import { DataTransformUtils } from '../services/transformers';

interface EnhancedHomePageProps {
  onNavigate: (page: string) => void;
}

const EnhancedHomePage: React.FC<EnhancedHomePageProps> = ({ onNavigate }) => {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [topMarkets, setTopMarkets] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');
  const [activeSection, setActiveSection] = useState<string>('overview');
  const { handleApiError } = useErrorHandler();
  
  // References to section elements for smooth scrolling
  const overviewRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const marketsRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const activitiesRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all dashboard data in parallel
      const [statsResponse, metricsResponse, marketsData, activitiesData] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getPerformanceMetrics(),
        dashboardService.getTopExportMarkets(),
        Promise.resolve(dashboardService.getRecentActivities())
      ]);

      if (statsResponse.success) {
        setDashboardStats(statsResponse.data);
        setDataSource(statsResponse.source);
      }

      if (metricsResponse.success) {
        setPerformanceMetrics(metricsResponse.data);
      }

      setTopMarkets(marketsData);
      setRecentActivities(activitiesData);
      
      // Data refreshed silently

    } catch (err) {
      const errorMessage = 'Failed to load dashboard data';
      setError(errorMessage);
      handleApiError(err, 'EnhancedHomePage');
      
      // Show error message
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
    
    // Set up auto-refresh interval (every 5 minutes)
    const refreshInterval = setInterval(() => {
      loadDashboardData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [loadDashboardData]);

  const handleRefresh = () => {
    setLoading(true);
    loadDashboardData();
  };
  
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Transform dashboard stats to display format
  const getDisplayStats = () => {
    if (!dashboardStats) return [];

    return [
      {
        title: 'Active Leads',
        value: dashboardStats.activeLeads.toLocaleString(),
        change: `${dashboardStats.leadsChange > 0 ? '+' : ''}${dashboardStats.leadsChange.toFixed(1)}%`,
        trend: dashboardStats.leadsChange >= 0 ? 'up' : 'down',
        color: '#4CAF50', // Darker green for better contrast
        textColor: '#000000', // Black text for contrast
        icon: <SearchIcon />,
      },
      {
        title: 'Export Value',
        value: DataTransformUtils.formatLargeNumber(dashboardStats.exportValue),
        change: `${dashboardStats.exportChange > 0 ? '+' : ''}${dashboardStats.exportChange.toFixed(1)}%`,
        trend: dashboardStats.exportChange >= 0 ? 'up' : 'down',
        color: '#00838F', // Darker cyan for better contrast
        textColor: '#000000', // Black text for contrast
        icon: <PublicIcon />,
      },
      {
        title: 'Active Buyers',
        value: dashboardStats.activeBuyers.toLocaleString(),
        change: `${dashboardStats.buyersChange > 0 ? '+' : ''}${dashboardStats.buyersChange.toFixed(1)}%`,
        trend: dashboardStats.buyersChange >= 0 ? 'up' : 'down',
        color: '#0D47A1', // Darker blue for better contrast
        textColor: '#000000', // Black text for better readability
        icon: <BusinessIcon />,
      },
      {
        title: 'Compliance Score',
        value: `${Math.round(dashboardStats.complianceScore)}%`,
        change: `${dashboardStats.complianceChange > 0 ? '+' : ''}${dashboardStats.complianceChange.toFixed(1)}%`,
        trend: dashboardStats.complianceChange >= 0 ? 'up' : 'down',
        color: '#E65100', // Darker orange for better contrast
        textColor: '#000000', // Black text for contrast
        icon: <SecurityIcon />,
      },
    ];
  };

  const displayStats = getDisplayStats();

  const quickActions = [
    {
      title: 'Generate Leads',
      description: 'Find new export opportunities',
      icon: <SearchIcon />,
      color: colorPalette.accent.export,
      action: () => onNavigate('lead-generation'),
    },
    {
      title: 'Discover Buyers',
      description: 'Connect with potential buyers',
      icon: <BusinessIcon />,
      color: colorPalette.accent.success,
      action: () => onNavigate('buyer-discovery'),
    },
    {
      title: 'Market Research',
      description: 'Analyze market trends',
      icon: <AssessmentIcon />,
      color: colorPalette.accent.warning,
      action: () => onNavigate('market-research'),
    },
    {
      title: 'Create Quotation',
      description: 'Generate professional quotes',
      icon: <EmailIcon />,
      color: colorPalette.accent.import,
      action: () => onNavigate('quotation'),
    },
  ];

  // Helper function to get icon component from string
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ReactElement> = {
      'TrendingUpIcon': <TrendingUpIcon />,
      'SecurityIcon': <SecurityIcon />,
      'EmailIcon': <EmailIcon />,
      'AssessmentIcon': <AssessmentIcon />,
    };
    return iconMap[iconName] || <TrendingUpIcon />;
  };

  // Handle section change
  const handleSectionChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveSection(newValue);
    
    // Scroll to the selected section
    const sectionRefs: {[key: string]: React.RefObject<HTMLDivElement>} = {
      'overview': overviewRef,
      'stats': statsRef,
      'markets': marketsRef,
      'actions': actionsRef,
      'activities': activitiesRef,
      'metrics': metricsRef
    };
    
    const targetRef = sectionRefs[newValue];
    if (targetRef && targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Section navigation component
  const SectionNavigation = () => (
    <Paper 
      elevation={0}
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        borderRadius: 0,
        borderBottom: `1px solid ${colorPalette.neutral[200]}`,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        mb: 3,
      }}
    >
      <Tabs 
        value={activeSection}
        onChange={handleSectionChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          '& .MuiTabs-indicator': {
            backgroundColor: colorPalette.primary.main,
            height: 3,
          },
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.9rem',
            minWidth: 'auto',
            px: 3,
            py: 2,
            '&.Mui-selected': {
              color: colorPalette.primary.main,
              fontWeight: 600,
            },
          },
        }}
      >
        <Tab label="Overview" value="overview" icon={<AssessmentIcon fontSize="small" />} iconPosition="start" />
        <Tab label="Stats" value="stats" icon={<TrendingUpIcon fontSize="small" />} iconPosition="start" />
        <Tab label="Markets" value="markets" icon={<PublicIcon fontSize="small" />} iconPosition="start" />
        <Tab label="Quick Actions" value="actions" icon={<SearchIcon fontSize="small" />} iconPosition="start" />
        <Tab label="Activities" value="activities" icon={<NotificationsIcon fontSize="small" />} iconPosition="start" />
        <Tab label="Performance" value="metrics" icon={<BusinessIcon fontSize="small" />} iconPosition="start" />
      </Tabs>
    </Paper>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: colorPalette.background.default, minHeight: '100vh' }}>
      <SectionNavigation />
      {/* Error Alert */}
      {error && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh} startIcon={<RefreshIcon />}>
              Retry
            </Button>
          }
        >
          {error}. Using fallback data.
        </Alert>
      )}

      {/* Data Source Indicator */}
      {dataSource && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            size="small"
            icon={dataSource.includes('World Bank') ? <TrendingUpIcon /> : <WarningIcon />}
            label={`Data Source: ${dataSource}`}
            color={dataSource.includes('World Bank') ? 'success' : 'warning'}
            variant="outlined"
          />
        </Box>
      )}

      {/* Hero Section */}
      <Paper
        ref={overviewRef}
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 50%, #d0d0d0 100%)',
          color: '#000000',
          p: { xs: 3, md: 4 },
          borderRadius: 3,
          mb: 4,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(72, 72, 72, 0.15)',
          scrollMarginTop: '80px',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '40%',
            height: '100%',
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.3,
            backdropFilter: 'blur(10px)',
          },
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: 2,
                fontSize: { xs: '2rem', md: '2.5rem' },
                color: '#ffffff',
                textShadow: '0 2px 10px rgba(0,0,0,0.2)',
              }}
            >
              Welcome to ExportGuide
            </Typography>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 400, color: '#000000', fontSize: { xs: '1rem', md: '1.25rem' } }}>
              Advanced business intelligence tools including dashboards, reporting, and analytics tailored to export markets.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<SearchIcon />}
                onClick={() => onNavigate('lead-generation')}
                sx={{
                  backgroundColor: colorPalette.primary.main,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: colorPalette.primary.dark,
                  },
                }}
              >
                Start Generating Leads
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<AssessmentIcon />}
                onClick={() => onNavigate('market-research')}
                sx={{
                  borderColor: colorPalette.primary.main,
                  color: colorPalette.primary.main,
                  '&:hover': {
                    borderColor: colorPalette.primary.dark,
                    backgroundColor: colorPalette.primary.light,
                  },
                }}
              >
                View Market Insights
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  margin: '0 auto',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                <TrendingUpIcon sx={{ fontSize: 60, color: colorPalette.primary.main }} />
              </Avatar>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Dashboard Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }} ref={statsRef}>
        {loading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card elevation={0} sx={{ height: '100%', p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Skeleton variant="circular" width={48} height={48} />
                  <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
                </Box>
                <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 1 }} />
                <Skeleton variant="text" />
              </Card>
            </Grid>
          ))
        ) : (
          displayStats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                  border: `1px solid ${colorPalette.neutral[200]}`,
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 12px rgba(72, 72, 72, 0.08)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: getBoxShadow('high'),
                    borderColor: stat.color,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Avatar
                      sx={{
                        backgroundColor: stat.color,
                        color: stat.textColor,
                        width: 48,
                        height: 48,
                      }}
                    >
                      {stat.icon}
                    </Avatar>
                    <Chip
                      label={stat.change}
                      size="small"
                      icon={stat.trend === 'up' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                      sx={{
                        backgroundColor: stat.trend === 'up' ? `${colorPalette.accent.success}15` : `${colorPalette.accent.error}15`,
                        color: stat.trend === 'up' ? colorPalette.accent.success : colorPalette.accent.error,
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: colorPalette.primary.main, mb: 1 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colorPalette.neutral[600] }}>
                    {stat.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Grid container spacing={4}>
        {/* Quick Actions */}
        <Grid item xs={12} md={8} ref={actionsRef}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${colorPalette.neutral[200]}`,
              mb: 3,
              boxShadow: '0 2px 12px rgba(72, 72, 72, 0.08)',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(72, 72, 72, 0.1)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: colorPalette.primary.main }}>
                  Quick Actions
                </Typography>
                <Tooltip title="More actions">
                  <IconButton 
                    size="small" 
                    onClick={() => onNavigate('settings')}
                    sx={{ color: colorPalette.primary.main }}
                  >
                    <MoreHorizIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Grid container spacing={2}>
                {quickActions.map((action, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        border: `1px solid ${colorPalette.neutral[200]}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: action.color,
                          backgroundColor: `${action.color}05`,
                          transform: 'translateY(-2px)',
                        },
                      }}
                      onClick={action.action}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          sx={{
                            backgroundColor: `${action.color}15`,
                            color: action.color,
                            width: 40,
                            height: 40,
                            mr: 2,
                          }}
                        >
                          {action.icon}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colorPalette.primary.main }}>
                            {action.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: colorPalette.neutral[600] }}>
                            {action.description}
                          </Typography>
                        </Box>
                        <IconButton size="small" sx={{ color: action.color }}>
                          <ArrowForwardIcon />
                        </IconButton>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Top Export Markets */}
          <Card
            elevation={0}
            ref={marketsRef}
            sx={{
              borderRadius: 3,
              border: `1px solid ${colorPalette.neutral[200]}`,
              scrollMarginTop: '80px'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: colorPalette.primary.main }}>
                  Top Export Markets
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Tooltip title="Refresh market data">
                    <IconButton 
                      size="small" 
                      onClick={handleRefresh}
                      sx={{ mr: 1, color: colorPalette.primary.main }}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => onNavigate('market-research')}
                    sx={{ color: colorPalette.primary.main }}
                  >
                    View All
                  </Button>
                </Box>
              </Box>
              <List sx={{ p: 0 }}>
                {topMarkets.map((market, index) => (
                  <React.Fragment key={index}>
                    <ListItem sx={{ px: 0, py: 2 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Typography variant="h6">{market.flag}</Typography>
                      </ListItemIcon>
                      <ListItemText
                        primary={market.country}
                        secondary={`Export Value: ${market.value}`}
                        primaryTypographyProps={{
                          fontWeight: 500,
                          color: colorPalette.primary.main,
                        }}
                        secondaryTypographyProps={{
                          color: colorPalette.neutral[600],
                        }}
                      />
                      <Chip
                        label={market.growth}
                        size="small"
                        sx={{
                          backgroundColor: `${colorPalette.accent.success}15`,
                          color: colorPalette.accent.success,
                          fontWeight: 600,
                        }}
                      />
                    </ListItem>
                    {index < topMarkets.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities & Notifications */}
        <Grid item xs={12} md={4} ref={activitiesRef}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${colorPalette.neutral[200]}`,
              mb: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <NotificationsIcon sx={{ color: colorPalette.primary.main, mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: colorPalette.primary.main }}>
                    Recent Activities
                  </Typography>
                </Box>
              </Box>
              <List sx={{ p: 0 }}>
                {loading ? (
                  // Loading skeletons for activities
                  Array.from({ length: 4 }).map((_, index) => (
                    <React.Fragment key={index}>
                      <ListItem sx={{ px: 0, py: 2, alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                          <Skeleton variant="circular" width={32} height={32} />
                        </ListItemIcon>
                        <ListItemText
                          primary={<Skeleton variant="text" width="80%" />}
                          secondary={
                            <Box>
                              <Skeleton variant="text" width="100%" />
                              <Skeleton variant="text" width="40%" />
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < 3 && <Divider />}
                    </React.Fragment>
                  ))
                ) : (
                  recentActivities.map((activity, index) => (
                    <React.Fragment key={index}>
                      <ListItem sx={{ px: 0, py: 2, alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              backgroundColor: `${colorPalette.accent.info}15`,
                              color: colorPalette.accent.info,
                            }}
                          >
                            {getIconComponent(activity.icon)}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={activity.title}
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ color: colorPalette.neutral[600], mb: 0.5 }}>
                                {activity.description}
                              </Typography>
                              <Typography variant="caption" sx={{ color: colorPalette.neutral[500] }}>
                                {activity.time}
                              </Typography>
                            </Box>
                          }
                          primaryTypographyProps={{
                            fontWeight: 500,
                            fontSize: '0.9rem',
                            color: colorPalette.primary.main,
                          }}
                        />
                      </ListItem>
                      {index < recentActivities.length - 1 && <Divider />}
                    </React.Fragment>
                  ))
                )}
              </List>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card
            elevation={0}
            ref={metricsRef}
            sx={{
              borderRadius: 3,
              border: `1px solid ${colorPalette.neutral[200]}`,
              scrollMarginTop: '80px'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: colorPalette.primary.main }}>
                  Performance Metrics
                </Typography>
                <Tooltip title="Refresh metrics">
                  <IconButton 
                    size="small" 
                    onClick={handleRefresh}
                    sx={{ color: colorPalette.primary.main }}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              
              {loading ? (
                // Loading skeletons for performance metrics
                Array.from({ length: 3 }).map((_, index) => (
                  <Box key={index} sx={{ mb: index < 2 ? 3 : 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="20%" />
                    </Box>
                    <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 4 }} />
                  </Box>
                ))
              ) : performanceMetrics ? (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: colorPalette.neutral[600] }}>
                        Lead Conversion Rate
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: colorPalette.primary.main }}>
                        {Math.round(performanceMetrics.leadConversionRate)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={performanceMetrics.leadConversionRate}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: colorPalette.neutral[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: colorPalette.accent.success,
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: colorPalette.neutral[600] }}>
                        Market Coverage
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: colorPalette.primary.main }}>
                        {Math.round(performanceMetrics.marketCoverage)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={performanceMetrics.marketCoverage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: colorPalette.neutral[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: colorPalette.accent.export,
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: colorPalette.neutral[600] }}>
                        Compliance Score
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: colorPalette.primary.main }}>
                        {Math.round(performanceMetrics.complianceScore)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={performanceMetrics.complianceScore}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: colorPalette.neutral[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: colorPalette.accent.warning,
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Performance metrics unavailable
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EnhancedHomePage;