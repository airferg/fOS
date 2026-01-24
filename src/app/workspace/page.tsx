'use client'

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage, ChatMessageProps, AgentStep, Confirmation } from '@/components/workspace/ChatMessage';
import { ChatInput } from '@/components/workspace/ChatInput';
import { getAgentResponse, defaultSuggestions } from '@/components/workspace/agentResponses';

interface Message extends ChatMessageProps {
  id: string;
}

export default function WorkspacePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const simulateAgentResponse = async (userMessage: string) => {
    setIsLoading(true);
    
    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const response = getAgentResponse(userMessage);
    
    if (response) {
      // Add steps progressively
      const stepsToShow: AgentStep[] = [];
      
      for (let i = 0; i < response.steps.length; i++) {
        stepsToShow.push({ ...response.steps[i], status: 'running' });
        
        // Update message with current steps
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg?.role === 'assistant') {
            newMessages[newMessages.length - 1] = {
              ...lastMsg,
              steps: stepsToShow.map((s, idx) => ({
                ...s,
                status: idx < stepsToShow.length - 1 ? 'completed' : 'running'
              })),
            };
          } else {
            newMessages.push({
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: '',
              steps: stepsToShow.map((s, idx) => ({
                ...s,
                status: idx < stepsToShow.length - 1 ? 'completed' : 'running'
              })),
            });
          }
          return newMessages;
        });
        
        await new Promise(resolve => setTimeout(resolve, 600));
      }
      
      // Mark all steps complete and add content
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg?.role === 'assistant') {
          const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          newMessages[newMessages.length - 1] = {
            ...lastMsg,
            steps: response.steps.map(s => ({ ...s, status: 'completed' as const })),
            content: response.content,
            timestamp: currentTime,
            confirmations: response.confirmations?.map(conf => ({
              ...conf,
              timestamp: conf.type === 'slack' ? currentTime : conf.timestamp,
            })),
          };
        }
        return newMessages;
      });
    } else {
      // Generic response for unrecognized prompts
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: "I can help you with that. Try asking me about:\n\n- User interviews and roadmap impact\n- Funding and investor outreach priorities\n- Urgent legal tasks for your stage\n\nOr ask me anything else about managing your startup.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
    
    setIsLoading(false);
  };

  const handleSend = (message: string) => {
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Simulate agent response
    simulateAgentResponse(message);
  };

  const showSuggestions = messages.length === 0 && !isLoading;

  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />
        
        {/* Gradient orb accent */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Chat messages area */}
        <div className="flex-1 overflow-hidden relative">
          <ScrollArea className="h-full" ref={scrollRef}>
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
              <AnimatePresence>
                {messages.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="text-center py-16"
                  >
                    <motion.div 
                      animate={{ 
                        boxShadow: ['0 0 20px rgba(234,88,12,0.2)', '0 0 40px rgba(234,88,12,0.3)', '0 0 20px rgba(234,88,12,0.2)']
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="w-12 h-12 rounded-full border border-orange-500/30 bg-gradient-to-br from-orange-500/20 to-orange-500/5 flex items-center justify-center mx-auto mb-4"
                    >
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-3 h-3 rounded-full bg-orange-500" 
                      />
                    </motion.div>
                    <h2 className="text-xl font-semibold text-black dark:text-white mb-1.5 leading-tight">Hydra Workspace</h2>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                      Your AI-powered assistant for startup operations. Ask me about user research, funding strategy, legal tasks, and more.
                    </p>
                  </motion.div>
                ) : (
                  messages.map((message) => (
                    <ChatMessage key={message.id} {...message} />
                  ))
                )}
              </AnimatePresence>
              
              {/* Loading state */}
              <AnimatePresence>
                {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex gap-4"
                  >
                    <div className="w-8 h-8 rounded-full border border-orange-500/30 bg-gradient-to-br from-orange-500/20 to-orange-500/5 flex items-center justify-center shrink-0">
                      <motion.div 
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-orange-500" 
                      />
                    </div>
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3">
                      <div className="flex gap-1.5">
                        <motion.div 
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          className="w-2 h-2 rounded-full bg-orange-500/60" 
                        />
                        <motion.div 
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                          className="w-2 h-2 rounded-full bg-orange-500/60" 
                        />
                        <motion.div 
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                          className="w-2 h-2 rounded-full bg-orange-500/60" 
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
          
          {/* Gradient fade at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-zinc-950 via-white/80 dark:via-zinc-950/80 to-transparent pointer-events-none" />
        </div>

        {/* Input area - fixed at bottom */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 border-t border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl"
        >
          <div className="max-w-4xl mx-auto px-4 py-4">
            <ChatInput
              onSend={handleSend}
              isLoading={isLoading}
              suggestions={showSuggestions ? defaultSuggestions : []}
              placeholder="Ask me anything about your startup..."
            />
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
