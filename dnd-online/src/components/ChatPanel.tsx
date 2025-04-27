import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { Database } from '../types/supabase';

type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];

interface ChatPanelProps {
  campaignId: string;
}

const ChatPanel = ({ campaignId }: ChatPanelProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'OOC' | 'IC'>('OOC');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        if (!campaignId) return;

        setLoading(true);

        // Get chat messages for this campaign
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*, users:sender_id(name)')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: true })
          .limit(100);

        if (error) throw error;

        setMessages(data || []);
      } catch (error) {
        console.error('Error fetching chat messages:', error);
        setError('Failed to load chat messages.');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Set up realtime subscription
    const chatSubscription = supabase
      .channel(`chat:${campaignId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `campaign_id=eq.${campaignId}`
      }, (payload) => {
        // Add new message to state
        setMessages(prev => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();

    // Clean up subscription
    return () => {
      chatSubscription.unsubscribe();
    };
  }, [campaignId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send a new message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !user || !campaignId) return;

    try {
      // Add message to database
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          campaign_id: campaignId,
          sender_id: user.id,
          type: messageType,
          content: newMessage.trim(),
        });

      if (error) throw error;

      // Clear input
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>Chat</h3>
        <div className="chat-type-toggle">
          <button
            type="button"
            className={`chat-type-btn ${messageType === 'OOC' ? 'active' : ''}`}
            onClick={() => setMessageType('OOC')}
            aria-pressed={messageType === 'OOC'}
          >
            OOC
          </button>
          <button
            type="button"
            className={`chat-type-btn ${messageType === 'IC' ? 'active' : ''}`}
            onClick={() => setMessageType('IC')}
            aria-pressed={messageType === 'IC'}
          >
            IC
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {loading ? (
          <div className="chat-loading">Loading messages...</div>
        ) : error ? (
          <div className="chat-error">{error}</div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`chat-message ${message.type.toLowerCase()} ${
                message.sender_id === user?.id ? 'own-message' : ''
              }`}
            >
              <div className="message-header">
                <span className="message-sender">
                  {message.sender_id === user?.id ? 'You' : (message as any).users?.name || 'Unknown'}
                </span>
                <span className="message-time">
                  {formatTime(message.created_at)}
                </span>
              </div>
              <div className="message-content">{message.content}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="chat-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={`Type ${messageType} message...`}
        />
        <button type="submit" disabled={!newMessage.trim()} aria-label="Send message">
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
