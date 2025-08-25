import { createTheme, ThemeOptions } from '@mui/material/styles';

// Professional color palette based on #484848
const colorPalette = {
  // Primary - Sophisticated grays
  primary: {
    main: '#484848',      // Your base color
    light: '#6d6d6d',     // Lighter variant
    dark: '#2c2c2c',      // Darker variant
    contrastText: '#ffffff'
  },
  
  // Secondary - Complementary blue for trust and professionalism
  secondary: {
    main: '#2196F3',      // Professional blue
    light: '#64B5F6',     // Light blue
    dark: '#1976D2',      // Dark blue
    contrastText: '#ffffff'
  },
  
  // Accent colors for highlights and actions
  accent: {
    success: '#4CAF50',   // Green for success states
    warning: '#FF9800',   // Orange for warnings
    error: '#F44336',     // Red for errors
    info: '#2196F3',      // Blue for information
    export: '#00BCD4',    // Cyan for export-related actions
    import: '#9C27B0',    // Purple for import-related actions
  },
  
  // Neutral grays for backgrounds and surfaces
  neutral: {
    50: '#FAFAFA',        // Lightest gray
    100: '#F5F5F5',       // Very light gray
    200: '#EEEEEE',       // Light gray
    300: '#E0E0E0',       // Medium light gray
    400: '#BDBDBD',       // Medium gray
    500: '#9E9E9E',       // Base gray
    600: '#757575',       // Medium dark gray
    700: '#616161',       // Dark gray
    800: '#424242',       // Very dark gray
    900: '#212121',       // Darkest gray
  },
  
  // Background colors
  background: {
    default: '#FAFAFA',   // Main background
    paper: '#FFFFFF',     // Card/paper background
    dark: '#F5F5F5',      // Darker background sections
    gradient: 'linear-gradient(135deg, #484848 0%, #6d6d6d 100%)',
    heroGradient: 'linear-gradient(135deg, #2c2c2c 0%, #484848 50%, #6d6d6d 100%)',
  }
};

// Typography configuration with professional fonts
const typography = {
  fontFamily: [
    'Inter',              // Modern, clean sans-serif
    'Roboto',             // Fallback
    '-apple-system',      // Apple system font
    'BlinkMacSystemFont', // Chrome on macOS
    '"Segoe UI"',         // Windows
    'Arial',              // Universal fallback
    'sans-serif'
  ].join(','),
  
  // Heading fonts - slightly different for hierarchy
  h1: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    fontWeight: 700,
    fontSize: '2.5rem',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    color: colorPalette.primary.dark,
  },
  
  h2: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    fontWeight: 600,
    fontSize: '2rem',
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
    color: colorPalette.primary.dark,
  },
  
  h3: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    fontWeight: 600,
    fontSize: '1.5rem',
    lineHeight: 1.4,
    color: colorPalette.primary.main,
  },
  
  h4: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    fontWeight: 500,
    fontSize: '1.25rem',
    lineHeight: 1.4,
    color: colorPalette.primary.main,
  },
  
  h5: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    fontWeight: 500,
    fontSize: '1.125rem',
    lineHeight: 1.5,
    color: colorPalette.primary.main,
  },
  
  h6: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    fontWeight: 500,
    fontSize: '1rem',
    lineHeight: 1.5,
    color: colorPalette.primary.main,
  },
  
  // Body text
  body1: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    fontWeight: 400,
    fontSize: '1rem',
    lineHeight: 1.6,
    color: colorPalette.neutral[700],
  },
  
  body2: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    fontWeight: 400,
    fontSize: '0.875rem',
    lineHeight: 1.6,
    color: colorPalette.neutral[600],
  },
  
  // Button text
  button: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: 1.5,
    letterSpacing: '0.02em',
    textTransform: 'none' as const,
  },
  
  // Caption and small text
  caption: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    fontWeight: 400,
    fontSize: '0.75rem',
    lineHeight: 1.5,
    color: colorPalette.neutral[500],
  },
};

// Component customizations
const components = {
  // Button customizations
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: '10px 24px',
        boxShadow: 'none',
        textTransform: 'none' as const,
        fontWeight: 500,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(72, 72, 72, 0.15)',
          transform: 'translateY(-1px)',
        },
      },
      contained: {
        background: colorPalette.background.gradient,
        color: '#ffffff',
        '&:hover': {
          background: `linear-gradient(135deg, ${colorPalette.primary.dark} 0%, ${colorPalette.primary.main} 100%)`,
        },
      },
      outlined: {
        borderColor: colorPalette.primary.main,
        color: colorPalette.primary.main,
        '&:hover': {
          backgroundColor: `${colorPalette.primary.main}08`,
          borderColor: colorPalette.primary.dark,
        },
      },
    },
  },
  
  // Card customizations
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 2px 12px rgba(72, 72, 72, 0.08)',
        border: `1px solid ${colorPalette.neutral[200]}`,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(72, 72, 72, 0.12)',
          transform: 'translateY(-2px)',
        },
      },
    },
  },
  
  // AppBar customizations
  MuiAppBar: {
    styleOverrides: {
      root: {
        background: colorPalette.background.heroGradient,
        boxShadow: '0 2px 12px rgba(72, 72, 72, 0.1)',
        backdropFilter: 'blur(10px)',
      },
    },
  },
  
  // TextField customizations
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
          '& fieldset': {
            borderColor: colorPalette.neutral[300],
          },
          '&:hover fieldset': {
            borderColor: colorPalette.primary.main,
          },
          '&.Mui-focused fieldset': {
            borderColor: colorPalette.primary.main,
            borderWidth: 2,
          },
        },
      },
    },
  },
  
  // Chip customizations
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        fontWeight: 500,
      },
      filled: {
        backgroundColor: colorPalette.neutral[100],
        color: colorPalette.primary.main,
        '&:hover': {
          backgroundColor: colorPalette.neutral[200],
        },
      },
    },
  },
  
  // Table customizations
  MuiTableHead: {
    styleOverrides: {
      root: {
        backgroundColor: colorPalette.neutral[50],
        '& .MuiTableCell-head': {
          fontWeight: 600,
          color: colorPalette.primary.main,
          borderBottom: `2px solid ${colorPalette.neutral[200]}`,
        },
      },
    },
  },
  
  MuiTableRow: {
    styleOverrides: {
      root: {
        '&:hover': {
          backgroundColor: colorPalette.neutral[50],
        },
        '&:nth-of-type(even)': {
          backgroundColor: '#FCFCFC',
        },
      },
    },
  },
  
  // Paper customizations
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 2px 12px rgba(72, 72, 72, 0.06)',
      },
      elevation1: {
        boxShadow: '0 2px 8px rgba(72, 72, 72, 0.08)',
      },
      elevation2: {
        boxShadow: '0 4px 16px rgba(72, 72, 72, 0.1)',
      },
      elevation3: {
        boxShadow: '0 8px 24px rgba(72, 72, 72, 0.12)',
      },
    },
  },
  
  // Tab customizations
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: 'none' as const,
        fontWeight: 500,
        fontSize: '0.95rem',
        minHeight: 48,
        color: colorPalette.neutral[600],
        '&.Mui-selected': {
          color: colorPalette.primary.main,
          fontWeight: 600,
        },
      },
    },
  },
  
  MuiTabs: {
    styleOverrides: {
      indicator: {
        backgroundColor: colorPalette.primary.main,
        height: 3,
        borderRadius: '3px 3px 0 0',
      },
    },
  },
};

// Create the theme
export const exportGuideTheme = createTheme({
  palette: {
    primary: colorPalette.primary,
    secondary: colorPalette.secondary,
    background: {
      default: colorPalette.background.default,
      paper: colorPalette.background.paper,
    },
    text: {
      primary: colorPalette.neutral[800],
      secondary: colorPalette.neutral[600],
    },
    grey: colorPalette.neutral,
    success: {
      main: colorPalette.accent.success,
    },
    warning: {
      main: colorPalette.accent.warning,
    },
    error: {
      main: colorPalette.accent.error,
    },
    info: {
      main: colorPalette.accent.info,
    },
  },
  typography,
  components,
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
} as ThemeOptions);

// Export color palette for use in components
export { colorPalette };

// Custom theme extensions
declare module '@mui/material/styles' {
  interface Palette {
    accent: {
      success: string;
      warning: string;
      error: string;
      info: string;
      export: string;
      import: string;
    };
  }

  interface PaletteOptions {
    accent?: {
      success?: string;
      warning?: string;
      error?: string;
      info?: string;
      export?: string;
      import?: string;
    };
  }
}

// Utility functions for theme usage
export const getGradientBackground = (direction = '135deg') => 
  `linear-gradient(${direction}, ${colorPalette.primary.main} 0%, ${colorPalette.primary.light} 100%)`;

export const getBoxShadow = (elevation: 'low' | 'medium' | 'high' = 'medium') => {
  const shadows = {
    low: '0 2px 8px rgba(72, 72, 72, 0.08)',
    medium: '0 4px 16px rgba(72, 72, 72, 0.1)',
    high: '0 8px 24px rgba(72, 72, 72, 0.15)',
  };
  return shadows[elevation];
};

export const getHoverTransition = () => 'all 0.2s ease-in-out';