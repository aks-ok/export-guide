import React from 'react';
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
  useTheme,
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
  Star as StarIcon,
  Timeline as TimelineIcon,
  Language as LanguageIcon,
  LocalShipping as ShippingIcon,
  AccountBalance as BankIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { colorPalette, getGradientBackground, getBoxShadow } from '../theme/ExportGuideTheme';

interface EnhancedHomePageProps {
  onNavigate: (page: string) => void;
}

const EnhancedHomePage: React.FC<EnhancedHomePageProps> = ({ onNavigate }) => {
  const theme = useTheme();

  // Mock data for dashboard
  const dashboardStats = [
    {
      title: 'Active Leads',
      value: '1,247',
      change: '+12.5%',
      trend: 'up',
      color: colorPalette.accent.success,
      icon: <SearchIcon />,
    },
    {
      title: 'Export Value',
      value: '$2.8M',
      change: '+8.3%',
      trend: 'up',
      color: colorPalette.accent.export,
      icon: <PublicIcon />,
    },
    {
      title: 'Active Buyers',
      value: '342',
      change: '+15.2%',
      trend: 'up',
      color: colorPalette.accent.info,
      icon: <BusinessIcon />,
    },
    {
      title: 'Compliance Score',
      value: '94%',
      change: '-2.1%',
      trend: 'down',
      color: colorPalette.accent.warning,
      icon: <SecurityIcon />,
    },
  ];

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

  const recentActivities = [
    {
      title: 'New export opportunity identified',
      description: 'Electronics to Germany - $500K potential',
      time: '2 hours ago',
      type: 'opportunity',
      icon: <TrendingUpIcon />,
    },
    {
      title: 'Compliance check completed',
      description: 'All textile exports cleared for EU',
      time: '4 hours ago',
      type: 'compliance',
      icon: <SecurityIcon />,
    },
    {
      title: 'Quotation sent to buyer',
      description: 'ABC Corp - Pharmaceutical products',
      time: '6 hours ago',
      type: 'quotation',
      icon: <EmailIcon />,
    },
    {
      title: 'Market analysis updated',
      description: 'India-UAE trade corridor report',
      time: '1 day ago',
      type: 'research',
      icon: <AssessmentIcon />,
    },
  ];

  const topMarkets = [
    { country: 'United States', value: '$1.2M', growth: '+15%', flag: '🇺🇸' },
    { country: 'Germany', value: '$890K', growth: '+12%', flag: '🇩🇪' },
    { country: 'United Kingdom', value: '$650K', growth: '+8%', flag: '🇬🇧' },
    { country: 'Japan', value: '$540K', growth: '+22%', flag: '🇯🇵' },
    { country: 'Australia', value: '$420K', growth: '+18%', flag: '🇦🇺' },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: colorPalette.background.default, minHeight: '100vh' }}>
      {/* Hero Section */}
      <Paper
        elevation={0}
        sx={{
          background: getGradientBackground('135deg'),
          color: 'white',
          p: 4,
          borderRadius: 3,
          mb: 4,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '40%',
            height: '100%',
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.3,
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
                background: 'linear-gradient(45deg, #ffffff 30%, #e3f2fd 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Welcome to ExportGuide
            </Typography>
            <Typography variant="h6" sx={{ mb: 3, opacity: 0.9, fontWeight: 400, color: 'white' }}>
              Advanced business intelligence tools including dashboards, reporting, and analytics tailored to export markets.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<SearchIcon />}
                onClick={() => onNavigate('lead-generation')}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.8)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
                <TrendingUpIcon sx={{ fontSize: 60, color: 'white' }} />
              </Avatar>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Dashboard Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {dashboardStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                border: `1px solid ${colorPalette.neutral[200]}`,
                borderRadius: 3,
                transition: 'all 0.3s ease',
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
                      backgroundColor: `${stat.color}15`,
                      color: stat.color,
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
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* Quick Actions */}
        <Grid item xs={12} md={8}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${colorPalette.neutral[200]}`,
              mb: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: colorPalette.primary.main, mb: 3 }}>
                Quick Actions
              </Typography>
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
            sx={{
              borderRadius: 3,
              border: `1px solid ${colorPalette.neutral[200]}`,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: colorPalette.primary.main }}>
                  Top Export Markets
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => onNavigate('market-research')}
                  sx={{ color: colorPalette.primary.main }}
                >
                  View All
                </Button>
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
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${colorPalette.neutral[200]}`,
              mb: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <NotificationsIcon sx={{ color: colorPalette.primary.main, mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: colorPalette.primary.main }}>
                  Recent Activities
                </Typography>
              </Box>
              <List sx={{ p: 0 }}>
                {recentActivities.map((activity, index) => (
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
                          {activity.icon}
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
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${colorPalette.neutral[200]}`,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: colorPalette.primary.main, mb: 3 }}>
                Performance Metrics
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: colorPalette.neutral[600] }}>
                    Lead Conversion Rate
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: colorPalette.primary.main }}>
                    68%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={68}
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
                    85%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={85}
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
                    94%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={94}
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
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedHomePage;