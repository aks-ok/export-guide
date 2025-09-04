import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  useTheme,
  alpha,
  Skeleton
} from '@mui/material';
import {
  SmartToy as BotIcon,
  Person as UserIcon
} from '@mui/icons-material';
import { ConversationMessage } from '../../services/assistant/types';
import { AssistantUtils } from '../../services/assistant/utils';

export interface ChatMessagesProps {
  messages: ConversationMessage[];
  isTyping: boolean;
  userId: string;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isTyping,
  userId
}) => {
  const theme = useTheme();

  // Render typing indicator
  const TypingIndicator = () => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        padding: '8px 16px',
        animation: 'fadeIn 0.3s ease-in'
      }}
    >
      <Avatar
        sx={{
          width: 32,
          height: 32,
          backgroundColor: theme.palette.primary.main,
          marginTop: 0.5
        }}
      >
        <BotIcon sx={{ fontSize: 16, color: 'white' }} />
      </Avatar>
      
      <Paper
        elevation={1}
        sx={{
          padding: '12px 16px',
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          borderRadius: '18px 18px 18px 4px',
          maxWidth: '70%'
        }}
      >
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Skeleton variant="text" width={20} height={16} animation="wave" />
          <Skeleton variant="text" width={30} height={16} animation="wave" />
          <Skeleton variant="text" width={25} height={16} animation="wave" />
        </Box>
      </Paper>
    </Box>
  );

  // Render individual message
  const MessageBubble: React.FC<{ message: ConversationMessage }> = ({ message }) => {
    const isUser = message.type === 'user';
    const isOwn = message.userId === userId;

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
          padding: '8px 16px',
          flexDirection: isUser ? 'row-reverse' : 'row',
          animation: 'slideIn 0.3s ease-out'
        }}
      >
        {/* Avatar */}
        <Avatar
          sx={{
            width: 32,
            height: 32,
            backgroundColor: isUser 
              ? theme.palette.secondary.main 
              : theme.palette.primary.main,
            marginTop: 0.5
          }}
        >
          {isUser ? (
            <UserIcon sx={{ fontSize: 16, color: 'white' }} />
          ) : (
            <BotIcon sx={{ fontSize: 16, color: 'white' }} />
          )}
        </Avatar>

        {/* Message Content */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '70%',
            alignItems: isUser ? 'flex-end' : 'flex-start'
          }}
        >
          <Paper
            elevation={1}
            sx={{
              padding: '12px 16px',
              backgroundColor: isUser
                ? theme.palette.primary.main
                : alpha(theme.palette.primary.main, 0.1),
              color: isUser ? 'white' : theme.palette.text.primary,
              borderRadius: isUser
                ? '18px 18px 4px 18px'
                : '18px 18px 18px 4px',
              wordBreak: 'break-word'
            }}
          >
            <Typography
              variant="body2"
              sx={{
                lineHeight: 1.4,
                fontSize: '0.875rem'
              }}
            >
              {message.content}
            </Typography>
          </Paper>

          {/* Timestamp */}
          <Typography
            variant="caption"
            sx={{
              marginTop: 0.5,
              opacity: 0.6,
              fontSize: '0.75rem',
              paddingX: 1
            }}
          >
            {AssistantUtils.formatTimestamp(message.timestamp)}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.default,
        '&::-webkit-scrollbar': {
          width: '4px'
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent'
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: alpha(theme.palette.primary.main, 0.3),
          borderRadius: '2px'
        }
      }}
    >
      {/* Welcome Message */}
      {messages.length === 0 && (
        <Box
          sx={{
            padding: '24px 16px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Avatar
            sx={{
              width: 48,
              height: 48,
              backgroundColor: theme.palette.primary.main
            }}
          >
            <BotIcon sx={{ fontSize: 24, color: 'white' }} />
          </Avatar>
          
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                marginBottom: 1,
                color: theme.palette.text.primary
              }}
            >
              Welcome to Export Assistant! 👋
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                lineHeight: 1.4
              }}
            >
              I'm here to help you with export guidance, market research, and platform navigation. Ask me anything!
            </Typography>
          </Box>
        </Box>
      )}

      {/* Messages */}
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {/* Typing Indicator */}
      {isTyping && <TypingIndicator />}

      {/* Add some CSS animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideIn {
            from { 
              opacity: 0; 
              transform: translateY(10px); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
        `}
      </style>
    </Box>
  );
};