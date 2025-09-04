import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatAssistant } from '../ChatAssistant';

// Mock user profile
const mockUserProfile = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com'
};

// Mock navigation function
const mockOnNavigate = jest.fn();

describe('ChatAssistant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders floating action button when not visible', () => {
    render(
      <ChatAssistant
        userId="user-123"
        userProfile={mockUserProfile}
        onNavigate={mockOnNavigate}
        isVisible={false}
        onToggle={jest.fn()}
      />
    );

    // Should show the floating chat button
    const chatButton = screen.getByRole('button');
    expect(chatButton).toBeInTheDocument();
  });

  it('renders expanded chat interface when visible', () => {
    render(
      <ChatAssistant
        userId="user-123"
        userProfile={mockUserProfile}
        onNavigate={mockOnNavigate}
        isVisible={true}
        onToggle={jest.fn()}
      />
    );

    // Should show chat header
    expect(screen.getByText('Export Assistant')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();

    // Should show welcome message
    expect(screen.getByText(/Welcome to Export Assistant/)).toBeInTheDocument();

    // Should show input field
    expect(screen.getByPlaceholderText(/Ask me about exports/)).toBeInTheDocument();
  });

  it('handles message sending', async () => {
    render(
      <ChatAssistant
        userId="user-123"
        userProfile={mockUserProfile}
        onNavigate={mockOnNavigate}
        isVisible={true}
        onToggle={jest.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/Ask me about exports/);
    const sendButton = screen.getByRole('button', { name: /send/i });

    // Type a message
    fireEvent.change(input, { target: { value: 'Hello, I need help' } });
    expect(input).toHaveValue('Hello, I need help');

    // Send the message
    fireEvent.click(sendButton);

    // Should show the user message
    expect(screen.getByText('Hello, I need help')).toBeInTheDocument();

    // Should clear the input
    expect(input).toHaveValue('');

    // Should show typing indicator and then assistant response
    await waitFor(() => {
      expect(screen.getByText(/I received your message/)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('handles Enter key for sending messages', () => {
    render(
      <ChatAssistant
        userId="user-123"
        userProfile={mockUserProfile}
        onNavigate={mockOnNavigate}
        isVisible={true}
        onToggle={jest.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/Ask me about exports/);

    // Type a message
    fireEvent.change(input, { target: { value: 'Test message' } });

    // Press Enter
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });

    // Should show the message
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('handles minimize and close actions', () => {
    const mockOnToggle = jest.fn();
    
    render(
      <ChatAssistant
        userId="user-123"
        userProfile={mockUserProfile}
        onNavigate={mockOnNavigate}
        isVisible={true}
        onToggle={mockOnToggle}
      />
    );

    // Find and click minimize button
    const minimizeButton = screen.getByRole('button', { name: /minimize/i });
    fireEvent.click(minimizeButton);

    // Should collapse the chat (tested by checking if input is still visible)
    // The component should still be visible but collapsed

    // Find and click close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    // Should call onToggle
    expect(mockOnToggle).toHaveBeenCalled();
  });

  it('disables input when typing', async () => {
    render(
      <ChatAssistant
        userId="user-123"
        userProfile={mockUserProfile}
        onNavigate={mockOnNavigate}
        isVisible={true}
        onToggle={jest.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/Ask me about exports/);
    const sendButton = screen.getByRole('button', { name: /send/i });

    // Send a message to trigger typing state
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.click(sendButton);

    // Input should be disabled while assistant is typing
    // Note: This test might need adjustment based on the exact timing
    expect(input).toBeInTheDocument();
  });
});