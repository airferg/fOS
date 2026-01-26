import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Sparkles, Maximize2 } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import IntegrationLogo from '@/components/IntegrationLogo';

interface SuggestedPrompt {
  id: string;
  text: string;
  icon?: string;
}

interface Contact {
  id: string;
  name: string;
  email?: string | null;
  company?: string | null;
}

interface Integration {
  id: string;
  name: string;
  is_connected: boolean;
}

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  suggestions?: SuggestedPrompt[];
  placeholder?: string;
}

const SLACK_CHANNELS = ['product', 'finance', 'legal', 'officers'];

export function ChatInput({ onSend, isLoading, suggestions = [], placeholder = "Ask me anything about your startup..." }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [mentionMode, setMentionMode] = useState<{ active: boolean; startIndex: number; cursorPosition: number }>({ 
    active: false, 
    startIndex: 0, 
    cursorPosition: 0 
  });
  const [showSlackChannels, setShowSlackChannels] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loadingMentions, setLoadingMentions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionModalRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleSuggestionClick = (text: string) => {
    onSend(text);
  };

  useEffect(() => {
    if (mentionMode.active) {
      loadMentionData();
    }
  }, [mentionMode.active]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        mentionModalRef.current && 
        !mentionModalRef.current.contains(target) &&
        textareaRef.current && 
        !textareaRef.current.contains(target)
      ) {
        setMentionMode({ active: false, startIndex: 0, cursorPosition: 0 });
        setShowSlackChannels(false);
      }
    };

    if (mentionMode.active) {
      // Use a small delay to allow click events to process
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [mentionMode.active]);

  const loadMentionData = async () => {
    setLoadingMentions(true);
    try {
      // Load contacts
      const contactsRes = await fetch('/api/contacts');
      const contactsData = await contactsRes.json();
      setContacts(contactsData.contacts || []);

      // Static integrations list
      const staticIntegrations: Integration[] = [
        { id: 'notion', name: 'Notion', is_connected: true },
        { id: 'slack', name: 'Slack', is_connected: true },
        { id: 'gmail', name: 'Gmail', is_connected: true },
        { id: 'jira', name: 'Jira', is_connected: true },
        { id: 'mailchimp', name: 'Mailchimp', is_connected: true },
        { id: 'intercom', name: 'Intercom', is_connected: true },
        { id: 'zoom', name: 'Zoom', is_connected: true },
      ];

      setIntegrations(staticIntegrations);
    } catch (error) {
      console.error('Error loading mention data:', error);
    } finally {
      setLoadingMentions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    
    setInput(value);
    
    // Check if we're typing after "@"
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if there's no space between @ and cursor
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionMode({
          active: true,
          startIndex: lastAtIndex,
          cursorPosition: cursorPosition
        });
        setShowSlackChannels(false);
      } else {
        setMentionMode({ active: false, startIndex: 0, cursorPosition: 0 });
        setShowSlackChannels(false);
      }
    } else {
      setMentionMode({ active: false, startIndex: 0, cursorPosition: 0 });
      setShowSlackChannels(false);
    }
  };

  // Debug: Log when mention mode changes
  useEffect(() => {
    if (mentionMode.active) {
      console.log('Mention mode active:', mentionMode);
    }
  }, [mentionMode.active]);

  const insertMention = (text: string) => {
    const beforeMention = input.substring(0, mentionMode.startIndex);
    const afterMention = input.substring(mentionMode.cursorPosition);
    const newValue = `${beforeMention}${text} ${afterMention}`;
    setInput(newValue);
    setMentionMode({ active: false, startIndex: 0, cursorPosition: 0 });
    setShowSlackChannels(false);
    
    // Set cursor position after the mention
    setTimeout(() => {
      if (textareaRef.current) {
        const cursorPos = beforeMention.length + text.length + 1;
        textareaRef.current.setSelectionRange(cursorPos, cursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleContactClick = (contact: Contact) => {
    insertMention(`@${contact.name}`);
  };

  const handleIntegrationClick = (integration: Integration) => {
    if (integration.id === 'slack') {
      setShowSlackChannels(true);
    } else {
      insertMention(`@${integration.name}`);
    }
  };

  const handleChannelClick = (channel: string) => {
    insertMention(`#${channel}`);
  };

  return (
    <div className="space-y-4">
      {/* Floating suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-wrap gap-2 justify-center"
          >
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSuggestionClick(suggestion.text)}
                className="px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300"
              >
                {suggestion.text}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="relative">
        <form onSubmit={handleSubmit} className="relative">
          <motion.div 
            animate={{ 
              borderColor: isFocused ? 'rgba(234, 88, 12, 0.5)' : 'rgba(0, 0, 0, 0.1)',
              boxShadow: isFocused ? '0 0 30px -10px rgba(234, 88, 12, 0.3)' : '0 0 0 0 transparent'
            }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-zinc-950 border rounded-xl overflow-visible"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onFocus={() => setIsFocused(true)}
              onBlur={(e) => {
                // Don't close if clicking on mention modal
                const relatedTarget = e.relatedTarget as HTMLElement;
                if (mentionModalRef.current && mentionModalRef.current.contains(relatedTarget)) {
                  return;
                }
                setIsFocused(false);
              }}
              placeholder={placeholder}
              rows={1}
              className="w-full bg-transparent text-black dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-500 px-4 py-4 pr-32 resize-none focus:outline-none text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !mentionMode.active) {
                  e.preventDefault();
                  handleSubmit(e);
                } else if (e.key === 'Escape' && mentionMode.active) {
                  e.preventDefault();
                  setMentionMode({ active: false, startIndex: 0, cursorPosition: 0 });
                  setShowSlackChannels(false);
                }
              }}
            />
            
            {/* Bottom toolbar */}
            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="sm" className="h-8 gap-2 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white">
                  <div className="w-4 h-4 rounded-full border border-orange-500/50 flex items-center justify-center">
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full bg-orange-500" 
                    />
                  </div>
                  <span className="text-xs">Hydra AI</span>
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                  <Sparkles className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="h-8 w-8 rounded-lg bg-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white disabled:opacity-20 disabled:hover:bg-orange-500/20 disabled:hover:text-orange-500 transition-all duration-300"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </form>
        
        {/* Mention Modal - Outside form to avoid overflow issues */}
        <AnimatePresence>
          {mentionMode.active && (
            <motion.div
              ref={mentionModalRef}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: '8px', zIndex: 1000 }}
              className="w-96 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden"
            >
                  {loadingMentions ? (
                    <div className="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                      Loading...
                    </div>
                  ) : showSlackChannels ? (
                    <div className="max-h-80 overflow-y-auto">
                      <div className="px-3 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                        <button
                          onClick={() => setShowSlackChannels(false)}
                          className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Back
                        </button>
                      </div>
                      <div className="p-3">
                        {SLACK_CHANNELS.map((channel) => (
                          <button
                            key={channel}
                            onClick={() => handleChannelClick(channel)}
                            className="w-full text-left px-3 py-2 text-sm text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <span className="text-zinc-500 dark:text-zinc-400">#</span>
                            <span>{channel}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {/* Contacts Section */}
                      <div className="p-3">
                        <div className="px-3 py-2 mb-2">
                          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                            Contacts
                          </div>
                        </div>
                        {contacts.length > 0 ? (
                          <div className="space-y-1">
                            {contacts.slice(0, 5).map((contact) => (
                              <button
                                key={contact.id}
                                onClick={() => handleContactClick(contact)}
                                className="w-full text-left px-3 py-2 text-sm text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg transition-colors flex items-center gap-3"
                              >
                                <div className="w-6 h-6 rounded-full bg-zinc-800 dark:bg-zinc-800 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                  {contact.name.charAt(0)}
                                </div>
                                <span className="truncate">{contact.name}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="px-3 py-2 text-xs text-zinc-400 dark:text-zinc-500">
                            No contacts
                          </div>
                        )}
                      </div>

                      {/* Integrations Section */}
                      {integrations.length > 0 && (
                        <>
                          <div className="px-3 py-2 border-t border-zinc-200 dark:border-zinc-800">
                            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                              Integrations
                            </div>
                          </div>
                          <div className="p-3 space-y-1">
                            {integrations.map((integration) => (
                              <button
                                key={integration.id}
                                onClick={() => handleIntegrationClick(integration)}
                                className="w-full text-left px-3 py-2 text-sm text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg transition-colors flex items-center gap-3"
                              >
                                <div className="w-6 h-6 flex-shrink-0 overflow-hidden rounded flex items-center justify-center">
                                  <IntegrationLogo name={integration.name} size="sm" />
                                </div>
                                <span className="truncate">{integration.name}</span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
      </div>
    </div>
  );
}
