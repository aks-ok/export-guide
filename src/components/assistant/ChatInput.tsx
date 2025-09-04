import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  useTheme,
  alpha,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Send as SendIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  AttachFile as AttachIcon
} from '@mui/icons-material';

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  voiceEnabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
  maxLength = 1000,
  voiceEnabled = true
}) => {
  const theme = useTheme();
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Handle message send
  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage('');
      
      // Refocus input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  // Handle input change
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value.length <= maxLength) {
      setMessage(value);
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition && voiceEnabled) {
      setIsVoiceSupported(true);
      
      // Initialize speech recognition
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      // Set up event handlers
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        
        setMessage(transcript);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setVoiceError(`Error: ${event.error}`);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      // Clean up
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
      }
    };
  }, [voiceEnabled]);
  
  // Toggle voice recognition
  const toggleVoiceRecognition = () => {
    if (!isVoiceSupported || disabled) return;
    
    if (isListening) {
      // Stop listening
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      // Start listening
      setVoiceError(null);
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        setVoiceError('Failed to start voice recognition');
      }
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        padding: '12px 16px',
        backgroundColor: theme.palette.background.paper,
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 0
      }}
    >
      {voiceError && (
        <Typography 
          variant="caption" 
          color="error" 
          sx={{ display: 'block', mb: 1, px: 1 }}
        >
          {voiceError}
        </Typography>
      )}
      
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1
        }}
      >
        {/* Voice Input Button */}
        {isVoiceSupported && voiceEnabled && (
          <Tooltip title={isListening ? "Stop recording" : "Voice input"}>
            <IconButton
              color={isListening ? "error" : "primary"}
              onClick={toggleVoiceRecognition}
              disabled={disabled}
              sx={{
                transition: 'all 0.2s ease',
                animation: isListening ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.1)' },
                  '100%': { transform: 'scale(1)' }
                }
              }}
            >
              {isListening ? (
                <>
                  <MicOffIcon />
                  <CircularProgress 
                    size={36} 
                    thickness={2} 
                    sx={{ 
                      position: 'absolute',
                      color: theme.palette.error.main,
                      opacity: 0.3
                    }} 
                  />
                </>
              ) : (
                <MicIcon />
              )}
            </IconButton>
          </Tooltip>
        )}
        
        {/* Message Input */}
        <TextField
          ref={inputRef}
          fullWidth
          multiline
          maxRows={3}
          value={message}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled || isListening}
          placeholder={isListening ? "Listening..." : placeholder}
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px',
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08)
              },
              '&.Mui-focused': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                  borderWidth: '2px'
                }
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha(theme.palette.primary.main, 0.2)
              }
            },
            '& .MuiInputBase-input': {
              padding: '12px 16px',
              fontSize: '0.875rem',
              lineHeight: 1.4,
              '&::placeholder': {
                color: alpha(theme.palette.text.secondary, 0.7),
                opacity: 1
              }
            }
          }}
        />

        {/* Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            gap: 0.5,
            alignItems: 'center'
          }}
        >
          {/* Send Button */}
          <IconButton
            onClick={handleSend}
            disabled={disabled || !message.trim()}
            sx={{
              backgroundColor: message.trim() && !disabled
                ? theme.palette.primary.main
                : alpha(theme.palette.action.disabled, 0.1),
              color: message.trim() && !disabled
                ? 'white'
                : theme.palette.action.disabled,
              width: 36,
              height: 36,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: message.trim() && !disabled
                  ? theme.palette.primary.dark
                  : alpha(theme.palette.action.disabled, 0.1),
                transform: message.trim() && !disabled ? 'scale(1.05)' : 'none'
              },
              '&:active': {
                transform: message.trim() && !disabled ? 'scale(0.95)' : 'none'
              }
            }}
          >
            <SendIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Character Counter */}
      {message.length > maxLength * 0.8 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 0.5
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: message.length >= maxLength
                ? theme.palette.error.main
                : theme.palette.text.secondary,
              fontSize: '0.7rem'
            }}
          >
            {message.length}/{maxLength}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};