import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Minimize as MinimizeIcon,
  SmartToy as BotIcon,
  Circle as OnlineIcon
} from '@mui/icons-material';

export interface ChatHeaderProps {
  onMinimize: () => void;
  onClose: () => void;
  isOnline: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onMinimize,
  onClose,
  isOnline
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: theme.palette.primary.main,
        color: 'white',
        borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.1)}`
      }}
    >
      {/* Assistant Avatar */}
      <Avatar
        sx={{
          width: 36,
          height: 36,
          backgroundColor: alpha(theme.palette.common.white, 0.2),
          marginRight: 2
        }}
      >
        <BotIcon sx={{ fontSize: 20, color: 'white' }} />
      </Avatar>

      {/* Assistant Info */}
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            lineHeight: 1.2,
            marginBottom: 0.5
          }}
        >
          Export Assistant
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}
        >
          <OnlineIcon
            sx={{
              fontSize: 8,
              color: isOnline ? '#4caf50' : '#f44336'
            }}
          />
          <Typography
            variant="caption"
            sx={{
              opacity: 0.9,
              fontSize: '0.75rem'
            }}
          >
            {isOnline ? 'Online' : 'Offline'}
          </Typography>
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <IconButton
          onClick={onMinimize}
          size="small"
          sx={{
            color: 'white',
            padding: '4px',
            '&:hover': {
              backgroundColor: alpha(theme.palette.common.white, 0.1)
            }
          }}
        >
          <MinimizeIcon sx={{ fontSize: 18 }} />
        </IconButton>
        
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: 'white',
            padding: '4px',
            '&:hover': {
              backgroundColor: alpha(theme.palette.common.white, 0.1)
            }
          }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Box>
  );
};