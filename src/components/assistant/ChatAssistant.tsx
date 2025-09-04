import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Fade,
  Zoom,
  useTheme,
  alpha
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Minimize as MinimizeIcon,
  SmartToy as BotIcon
} from '@mui/icons-material';
import { ConversationMessage, UserContext } from '../../services/assistant/types';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';

export interface ChatAssistantProps {
  userId: string;
  userProfile: any; // Will be typed properly when integrated with auth
  onNavigate: (page: string, params?: any) => void;
  isVisible: boolean;
  onToggle: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  userId,
  userProfile,
  onNavigate,
  isVisible,
  onToggle,
  position = 'bottom-right'
}) => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Position styles based on prop
  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 1400, // Higher than MUI modal backdrop (1300)
      transition: 'all 0.3s ease-in-out'
    };

    switch (position) {
      case 'bottom-right':
        return { ...baseStyles, bottom: 24, right: 24 };
      case 'bottom-left':
        return { ...baseStyles, bottom: 24, left: 24 };
      case 'top-right':
        return { ...baseStyles, top: 24, right: 24 };
      case 'top-left':
        return { ...baseStyles, top: 24, left: 24 };
      default:
        return { ...baseStyles, bottom: 24, right: 24 };
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle widget toggle
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onToggle();
  };

  // Handle minimize (collapse but keep visible)
  const handleMinimize = () => {
    setIsExpanded(false);
  };

  // Handle message send
  const handleSendMessage = (content: string) => {
    const newMessage: ConversationMessage = {
      id: `msg_${Date.now()}`,
      userId,
      conversationId: 'current', // Will be managed properly in message handler
      timestamp: new Date(),
      type: 'user',
      content
    };

    setMessages(prev => [...prev, newMessage]);
    
    // Simulate assistant typing
    setIsTyping(true);
    setTimeout(() => {
      const assistantResponse: ConversationMessage = {
        id: `msg_${Date.now() + 1}`,
        userId,
        conversationId: 'current',
        timestamp: new Date(),
        type: 'assistant',
        content: `I received your message: "${content}". This is a placeholder response. The actual AI processing will be implemented in the next tasks.`
      };
      
      setMessages(prev => [...prev, assistantResponse]);
      setIsTyping(false);
    }, 1500);
  };

  // Always render the widget container
  return (
    <Box sx={getPositionStyles()}>
      {!isExpanded ? (
        // Collapsed state - floating action button
        <Zoom in={true} timeout={300}>
          <IconButton
            onClick={handleToggle}
            sx={{
              width: 56,
              height: 56,
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              boxShadow: theme.shadows[6],
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
                transform: 'scale(1.05)',
                boxShadow: theme.shadows[8]
              },
              '&:active': {
                transform: 'scale(0.95)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <ChatIcon sx={{ fontSize: 24 }} />
          </IconButton>
        </Zoom>
      ) : (
        // Expanded state - full chat widget
        <Fade in={isExpanded} timeout={300}>
          <Paper
            elevation={12}
            sx={{
              width: { xs: 'calc(100vw - 32px)', sm: 380 },
              height: { xs: 'calc(100vh - 100px)', sm: 500 },
              maxWidth: 400,
              borderRadius: 3,
              overflow: 'hidden',
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              display: 'flex',
              flexDirection: 'column',
              // Responsive positioning
              ...(window.innerWidth < 600 && {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                bottom: 'auto',
                right: 'auto'
              })
            }}
          >
            <ChatHeader
              onMinimize={handleMinimize}
              onClose={handleToggle}
              isOnline={true}
            />
            
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <ChatMessages
                messages={messages}
                isTyping={isTyping}
                userId={userId}
              />
              <div ref={messagesEndRef} />
              
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={isTyping}
                placeholder="Ask me about exports, markets, or platform features..."
              />
            </Box>
          </Paper>
        </Fade>
      )}
    </Box>
  );


};