import { cn } from '@/lib/utils';
import { User, ChevronRight, ExternalLink, Copy, Check } from '@/components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import IntegrationLogo from '@/components/IntegrationLogo';

export interface AgentStep {
  id: string;
  title: string;
  subtitle: string;
  source?: string;
  status: 'completed' | 'running' | 'pending';
}

export interface Confirmation {
  type: 'slack' | 'zoom';
  channel?: string;
  message?: string;
  title?: string;
  date?: string;
  time?: string;
  duration?: string;
  meetingId?: string;
  timestamp?: string;
}

export interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  steps?: AgentStep[];
  timestamp?: string;
  confirmations?: Confirmation[];
}

// Simple markdown-like renderer for structured content
function RenderContent({ content }: { content: string }) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Parse content into sections
  const lines = content.split('\n');
  const elements: React.ReactElement[] = [];
  let currentTable: string[][] = [];
  let inTable = false;
  let tableKey = 0;

  lines.forEach((line, index) => {
    // Table detection
    if (line.includes('|') && line.trim().startsWith('|')) {
      if (!inTable) {
        inTable = true;
        currentTable = [];
      }
      const cells = line.split('|').filter(cell => cell.trim() !== '' && !cell.match(/^[-:]+$/));
      if (cells.length > 0 && !line.match(/^\|[-:\s|]+\|$/)) {
        currentTable.push(cells.map(c => c.trim()));
      }
      return;
    } else if (inTable) {
      // End of table
      inTable = false;
      if (currentTable.length > 1) {
        const headers = currentTable[0];
        const rows = currentTable.slice(1);
        elements.push(
          <motion.div 
            key={`table-${tableKey++}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="my-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-900">
                  {headers.map((h, i) => (
                    <th key={i} className="px-4 py-2.5 text-left font-medium text-black dark:text-white border-b border-zinc-200 dark:border-zinc-800">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <motion.tr 
                    key={rowIndex}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * rowIndex }}
                    className="border-b border-zinc-200 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400">{cell}</td>
                    ))}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        );
      }
      currentTable = [];
    }

    // Headers
    if (line.startsWith('**') && line.endsWith('**') && !line.includes(':**')) {
      const text = line.replace(/\*\*/g, '');
      elements.push(
        <motion.h3 
          key={index}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-base font-semibold text-black dark:text-white mt-5 mb-3 first:mt-0 flex items-center gap-2"
        >
          <span className="w-1 h-4 bg-orange-500 rounded-full" />
          {text}
        </motion.h3>
      );
      return;
    }

    // Section headers with colons
    if (line.match(/^\*\*[^*]+:\*\*$/)) {
      const text = line.replace(/\*\*/g, '').replace(/:$/, '');
      elements.push(
        <motion.h4 
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm font-medium text-black dark:text-white mt-4 mb-2"
        >
          {text}
        </motion.h4>
      );
      return;
    }

    // Priority indicators with colors (replacing emojis)
    if (line.includes('URGENT') || line.includes('High Priority')) {
      const text = line.replace(/[🔴⚡⚠️📊💰📋✅🟡🟢]/g, '').replace(/\*\*/g, '');
      elements.push(
        <motion.div 
          key={index}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 my-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20"
        >
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-sm font-medium text-red-400">{text.trim()}</span>
        </motion.div>
      );
      return;
    }

    if (line.includes('Medium') || line.includes('IMPORTANT')) {
      const text = line.replace(/[🔴⚡⚠️📊💰📋✅🟡🟢]/g, '').replace(/\*\*/g, '');
      elements.push(
        <motion.div 
          key={index}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 my-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
        >
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-sm font-medium text-yellow-400">{text.trim()}</span>
        </motion.div>
      );
      return;
    }

    if (line.includes('Future') || line.includes('completed')) {
      const text = line.replace(/[🔴⚡⚠️📊💰📋✅🟡🟢]/g, '').replace(/\*\*/g, '');
      if (text.trim()) {
        elements.push(
          <motion.div 
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 my-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20"
          >
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-green-400">{text.trim()}</span>
          </motion.div>
        );
      }
      return;
    }

    // Numbered lists with enhanced styling
    const numberedMatch = line.match(/^(\d+)\.\s+\*\*(.+?)\*\*(.*)$/);
    if (numberedMatch) {
      const [, num, bold, rest] = numberedMatch;
      elements.push(
        <motion.div 
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: parseInt(num) * 0.05 }}
          className="flex gap-3 my-3 group"
        >
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/20 text-orange-500 text-xs font-medium shrink-0 mt-0.5 group-hover:bg-orange-500/30 transition-colors">
            {num}
          </span>
          <div className="flex-1">
            <span className="font-medium text-black dark:text-white">{bold}</span>
            <span className="text-zinc-600 dark:text-zinc-400">{rest.replace(/[⚡]/g, '')}</span>
          </div>
        </motion.div>
      );
      return;
    }

    // Bullet points with indentation
    if (line.match(/^\s*-\s+/)) {
      const text = line.replace(/^\s*-\s+/, '').replace(/[🔴⚡⚠️📊💰📋✅🟡🟢]/g, '');
      const isChecked = line.includes('[x]') || line.includes('completed');
      const isUnchecked = line.includes('[ ]');
      
      if (isChecked || isUnchecked) {
        elements.push(
          <motion.div 
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 my-1.5 ml-4"
          >
            <div className={cn(
              'w-4 h-4 rounded border flex items-center justify-center transition-colors',
              isChecked ? 'bg-green-500/20 border-green-500/50' : 'border-zinc-400 dark:border-zinc-600'
            )}>
              {isChecked && <Check className="w-3 h-3 text-green-400" />}
            </div>
            <span className={cn('text-sm', isChecked ? 'text-zinc-500 dark:text-zinc-400 line-through' : 'text-black dark:text-white')}>
              {text.replace(/\[x\]|\[ \]/g, '').trim()}
            </span>
          </motion.div>
        );
      } else {
        elements.push(
          <motion.div 
            key={index}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-2 my-1.5 ml-4"
          >
            <ChevronRight className="w-3 h-3 text-orange-500 mt-1 shrink-0" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">{text}</span>
          </motion.div>
        );
      }
      return;
    }

    // Status line with metrics
    if (line.includes('Status:') || line.includes('runway') || line.includes('Targeting')) {
      const text = line.replace(/[💰]/g, '').replace(/\*\*/g, '');
      elements.push(
        <motion.div 
          key={index}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-3 my-3 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
        >
          {text.split('|').map((segment, i) => (
            <span key={i} className="text-sm text-black dark:text-white flex items-center gap-1">
              {i > 0 && <span className="w-1 h-1 rounded-full bg-zinc-500 dark:bg-zinc-400 mr-2" />}
              {segment.trim()}
            </span>
          ))}
        </motion.div>
      );
      return;
    }

    // Cost estimate
    if (line.includes('Estimated') && line.includes('$')) {
      const text = line.replace(/\*\*/g, '');
      elements.push(
        <motion.div 
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 rounded-lg bg-orange-500/5 border border-orange-500/20 flex items-center justify-between"
        >
          <span className="text-sm text-zinc-600 dark:text-zinc-400">{text.split(':')[0]}</span>
          <span className="text-sm font-medium text-orange-500">{text.split(':')[1]?.trim()}</span>
        </motion.div>
      );
      return;
    }

    // Default paragraph
    if (line.trim() && !line.startsWith('|')) {
      const cleanLine = line.replace(/[🔴⚡⚠️📊💰📋✅🟡🟢]/g, '');
      if (cleanLine.trim()) {
        elements.push(
          <motion.p 
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-zinc-600 dark:text-zinc-400 my-1.5 leading-relaxed"
          >
            {cleanLine}
          </motion.p>
        );
      }
    }
  });

  return <div className="space-y-0.5">{elements}</div>;
}

function ConfirmationCard({ confirmation, index }: { confirmation: Confirmation; index: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (confirmation.type === 'slack') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: index * 0.25, duration: 0.4 }}
        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-lg overflow-hidden"
      >
        <div className="flex items-start gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.25 + 0.15, type: 'spring', stiffness: 150 }}
            className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-900 flex items-center justify-center flex-shrink-0 border border-zinc-200 dark:border-zinc-800"
          >
            <IntegrationLogo name="Slack" size="sm" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 'auto' }}
                transition={{ delay: index * 0.25 + 0.3, duration: 0.4 }}
                className="flex items-center gap-1.5"
              >
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Sent to</span>
                <span className="text-xs font-semibold text-black dark:text-white">{confirmation.channel}</span>
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.25 + 0.4, type: 'spring' }}
                className="w-1.5 h-1.5 rounded-full bg-green-500"
              />
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.25 + 0.35 }}
              className="text-sm text-zinc-600 dark:text-zinc-400 mb-2"
            >
              {confirmation.message}
            </motion.p>
            {confirmation.timestamp && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.25 + 0.45 }}
                className="text-xs text-zinc-500 dark:text-zinc-500"
              >
                {confirmation.timestamp}
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  if (confirmation.type === 'zoom') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: index * 0.25, duration: 0.4 }}
        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-lg overflow-hidden"
      >
        <div className="flex items-start gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.25 + 0.15, type: 'spring', stiffness: 150 }}
            className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-900 flex items-center justify-center flex-shrink-0 border border-zinc-200 dark:border-zinc-800"
          >
            <IntegrationLogo name="Zoom" size="sm" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.25 + 0.3 }}
              className="mb-3"
            >
              <h4 className="text-sm font-semibold text-black dark:text-white mb-2">{confirmation.title}</h4>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{confirmation.date}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{confirmation.time}</span>
                  {confirmation.duration && <span className="text-zinc-400 dark:text-zinc-500">• {confirmation.duration}</span>}
                </div>
              </div>
            </motion.div>
            {confirmation.meetingId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.25 + 0.45 }}
                className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Meeting ID</p>
                  <p className="text-xs font-mono text-black dark:text-white truncate">{confirmation.meetingId}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(confirmation.meetingId!)}
                  className="h-7 px-2 text-xs"
                >
                  {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
}

export function ChatMessage({ role, content, steps, timestamp, confirmations }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn('flex gap-4', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="w-8 h-8 rounded-full border border-orange-500/30 bg-gradient-to-br from-orange-500/20 to-orange-500/5 flex items-center justify-center shrink-0 mt-1"
        >
          <div className="w-2 h-2 rounded-full bg-orange-500" />
        </motion.div>
      )}
      
      <div className={cn('max-w-[80%] space-y-3 flex flex-col', isUser ? 'items-end' : 'items-start')}>
        {/* Agent steps timeline */}
        <AnimatePresence>
          {steps && steps.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-lg"
            >
              <div className="relative">
                {/* Animated vertical line */}
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: '100%' }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="absolute left-[5px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-orange-500 via-orange-500/50 to-orange-500/20" 
                />
                
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <motion.div 
                      key={step.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.2, duration: 0.4 }}
                      className="flex gap-4 relative group"
                    >
                      {/* Dot with glow effect */}
                      <div className="relative">
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.2 + 0.15, type: 'spring', stiffness: 150 }}
                          className={cn(
                            'w-3 h-3 rounded-full shrink-0 mt-1.5 z-10 transition-all duration-300',
                            step.status === 'completed' ? 'bg-orange-500 shadow-[0_0_10px_rgba(234,88,12,0.4)]' :
                            step.status === 'running' ? 'bg-orange-500/70 animate-pulse shadow-[0_0_15px_rgba(234,88,12,0.5)]' :
                            'bg-zinc-400 dark:bg-zinc-600'
                          )} 
                        />
                        {step.status === 'running' && (
                          <motion.div 
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 w-3 h-3 rounded-full bg-orange-500 mt-1.5"
                          />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 group-hover:translate-x-1 transition-transform duration-200">
                        <p className="text-sm text-black dark:text-white">
                          {step.title}
                          {step.source && (
                            <span className="text-orange-500 font-medium ml-1">{step.source}</span>
                          )}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{step.subtitle}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message content */}
        {content && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: steps ? 0.5 : 0, duration: 0.4 }}
            className={cn(
              'rounded-xl overflow-hidden',
              isUser 
                ? 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white px-4 py-3' 
                : 'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-5 py-4 shadow-lg'
            )}
          >
            {isUser ? (
              <p className="text-sm leading-relaxed">{content}</p>
            ) : (
              <RenderContent content={content} />
            )}
          </motion.div>
        )}

        {/* Confirmation Cards */}
        <AnimatePresence>
          {confirmations && confirmations.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: steps ? 0.8 : 0.3 }}
              className="space-y-3 mt-3"
            >
              {confirmations.map((confirmation, index) => (
                <ConfirmationCard key={index} confirmation={confirmation} index={index} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        
        {timestamp && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-zinc-500 dark:text-zinc-400 px-1"
          >
            {timestamp}
          </motion.p>
        )}
      </div>

      {isUser && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-1 border border-zinc-300 dark:border-zinc-700"
        >
          <User className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        </motion.div>
      )}
    </motion.div>
  );
}
