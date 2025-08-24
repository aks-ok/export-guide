import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  TrendingUp as TrendingUpIcon,
  Public as PublicIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Logout as LogoutIcon,
  Api as ApiIcon,
} from '@mui/icons-material';
import { colorPalette, getGradientBackground } from '../theme/ExportRightTheme';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const EnhancedNavigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const navigationItems = [
    { id: 'home', label: 'Dashboard', icon: <DashboardIcon />, color: colorPalette.accent.info },
    { id: 'lead-generation', label: 'Lead Generation', icon: <SearchIcon />, color: colorPalette.accent.export },
    { id: 'buyer-discovery', label: 'Buyer Discovery', icon: <BusinessIcon />, color: colorPalette.accent.success },
    { id: 'market-research', label: 'Market Research', icon: <AssessmentIcon />, color: colorPalette.accent.warning },
    { id: 'compliance', label: 'Compliance', icon: <SecurityIcon />, color: colorPalette.accent.error },
    { id: 'quotation', label: 'Quotations', icon: <EmailIcon />, color: colorPalette.accent.import },
    { id: 'indian-trade-orgs', label: 'Trade Organizations', icon: <PublicIcon />, color: colorPalette.primary.main },
    { id: 'free-api-demo', label: 'Free APIs', icon: <ApiIcon />, color: colorPalette.secondary.main },
    { id: 'enhanced-api-demo', label: '🔥 Live APIs', icon: <ApiIcon />, color: '#FF6B35' },
  ];

  const mockNotifications = [
    { id: 1, title: 'New Export Opportunity', message: 'Electronics to Germany - $2.5M potential', time: '2 hours ago', unread: true },
    { id: 2, title: 'Compliance Alert', message: 'New regulations for textile exports', time: '5 hours ago', unread: true },
    { id: 3, title: 'Market Update', message: 'India-UAE trade corridor expansion', time: '1 day ago', unread: false },
  ];

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchor(null);
  };

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const NavigationContent = () => (
    <List sx={{ width: isMobile ? 280 : 'auto' }}>
      {navigationItems.map((item) => (
        <ListItem key={item.id} disablePadding>
          <ListItemButton
            onClick={() => {
              onPageChange(item.id);
              if (isMobile) setMobileDrawerOpen(false);
            }}
            selected={currentPage === item.id}
            sx={{
              borderRadius: 2,
              margin: '4px 8px',
              '&.Mui-selected': {
                backgroundColor: `${item.color}15`,
                borderLeft: `4px solid ${item.color}`,
                '& .MuiListItemIcon-root': {
                  color: item.color,
                },
                '& .MuiListItemText-primary': {
                  color: item.color,
                  fontWeight: 600,
                },
              },
              '&:hover': {
                backgroundColor: `${item.color}08`,
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: currentPage === item.id ? 600 : 400,
              }}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );

  return (
    <>
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{
          background: getGradientBackground('90deg'),
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${colorPalette.neutral[200]}`,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 3 } }}>
          {/* Left Section - Logo and Mobile Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {isMobile && (
              <IconButton
                color="inherit"
                onClick={handleDrawerToggle}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon sx={{ fontSize: 32, color: '#ffffff' }} />
              <Typography
                variant="h5"
                component="div"
                sx={{
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '-0.5px',
                  background: 'linear-gradient(45deg, #ffffff 30%, #e3f2fd 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                ExportRight
              </Typography>
            </Box>
          </Box>

          {/* Center Section - Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {navigationItems.slice(0, 6).map((item) => (
                <Button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  startIcon={item.icon}
                  sx={{
                    color: currentPage === item.id ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
                    backgroundColor: currentPage === item.id ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    textTransform: 'none',
                    fontWeight: currentPage === item.id ? 600 : 400,
                    fontSize: '0.875rem',
                    backdropFilter: currentPage === item.id ? 'blur(10px)' : 'none',
                    border: currentPage === item.id ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          {/* Right Section - Notifications and Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton
                color="inherit"
                onClick={handleNotificationMenuOpen}
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <Badge badgeContent={2} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Profile */}
            <Tooltip title="Account">
              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{
                  p: 0.5,
                  ml: 1,
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    border: '2px solid rgba(255, 255, 255, 0.4)',
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    background: 'linear-gradient(45deg, #ffffff 30%, #e3f2fd 90%)',
                    color: colorPalette.primary.main,
                    fontWeight: 600,
                  }}
                >
                  ER
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileDrawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
            background: 'linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%)',
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${colorPalette.neutral[200]}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TrendingUpIcon sx={{ fontSize: 28, color: colorPalette.primary.main }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: colorPalette.primary.main,
                letterSpacing: '-0.5px',
              }}
            >
              ExportRight
            </Typography>
          </Box>
        </Box>
        <NavigationContent />
      </Drawer>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationMenuClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 400,
            mt: 1,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(72, 72, 72, 0.15)',
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${colorPalette.neutral[200]}` }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: colorPalette.primary.main }}>
            Notifications
          </Typography>
        </Box>
        {mockNotifications.map((notification) => (
          <MenuItem
            key={notification.id}
            onClick={handleNotificationMenuClose}
            sx={{
              flexDirection: 'column',
              alignItems: 'flex-start',
              py: 2,
              borderBottom: `1px solid ${colorPalette.neutral[100]}`,
              '&:last-child': { borderBottom: 'none' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 0.5 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: notification.unread ? 600 : 400,
                  color: colorPalette.primary.main,
                  flex: 1,
                }}
              >
                {notification.title}
              </Typography>
              {notification.unread && (
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: colorPalette.accent.error,
                  }}
                />
              )}
            </Box>
            <Typography
              variant="body2"
              sx={{ color: colorPalette.neutral[600], mb: 0.5 }}
            >
              {notification.message}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: colorPalette.neutral[500] }}
            >
              {notification.time}
            </Typography>
          </MenuItem>
        ))}
      </Menu>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        PaperProps={{
          sx: {
            width: 240,
            mt: 1,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(72, 72, 72, 0.15)',
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${colorPalette.neutral[200]}` }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colorPalette.primary.main }}>
            Export Manager
          </Typography>
          <Typography variant="body2" sx={{ color: colorPalette.neutral[600] }}>
            manager@exportright.com
          </Typography>
        </Box>
        
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon><AccountIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon><HelpIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Help & Support</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default EnhancedNavigation;