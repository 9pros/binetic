import React, { useState, useRef, useEffect } from 'react';
import { useOrchestrateChat } from '@/hooks/use-nexus-api';
import { Send, Bot, BrainCircuit, Code, Terminal, Cpu, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  thought?: string;
  agentResponses?: { agent: string; content: string }[];
}

export function OrchestrationChat() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { mutate: sendMessage, isPending } = useOrchestrateChat();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const userMsg: Message = { role: 'user', content: input };
    setHistory(prev => [...prev, userMsg]);
    setInput('');

    sendMessage({ 
      message: userMsg.content, 
      history: history.map(h => ({ role: h.role, content: h.content })) 
    }, {
      onSuccess: (data) => {
        const assistantMsg: Message = {
          role: 'assistant',
          content: '', // The main content is distributed among agents
          thought: data.thought,
          agentResponses: data.responses
        };
        setHistory(prev => [...prev, assistantMsg]);
      },
      onError: (err) => {
        setHistory(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
      }
    });
  };

  const getAgentIcon = (name: string) => {
    switch (name) {
      case 'SWE_AGENT': return <Code className="w-4 h-4 text-blue-400" />;
      case 'SWE_MINI': return <Terminal className="w-4 h-4 text-green-400" />;
      case 'SWE_REX': return <BrainCircuit className="w-4 h-4 text-purple-400" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-card border rounded-lg overflow-hidden shadow-sm">
      <div className="p-4 border-b bg-muted/30 flex items-center gap-2">
        <Cpu className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Orchestration Team</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
        {history.length === 0 && (
          <div className="text-center text-muted-foreground mt-20">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Ready to orchestrate tasks across the agent team.</p>
          </div>
        )}

        {history.map((msg, idx) => (
          <div key={idx} className={cn("flex flex-col gap-2", msg.role === 'user' ? "items-end" : "items-start")}>
            
            {/* User Message */}
            {msg.role === 'user' && (
              <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg max-w-[80%]">
                {msg.content}
              </div>
            )}

            {/* Assistant Response */}
            {msg.role === 'assistant' && (
              <div className="w-full max-w-[90%] space-y-4">
                
                {/* Orchestrator Thought */}
                {msg.thought && (
                  <div className="bg-muted/50 p-3 rounded-md border text-sm text-muted-foreground italic">
                    <div className="flex items-center gap-2 mb-1 not-italic font-semibold text-xs uppercase tracking-wider">
                      <BrainCircuit className="w-3 h-3" /> Orchestrator Plan
                    </div>
                    {msg.thought}
                  </div>
                )}

                {/* Agent Responses */}
                {msg.agentResponses && msg.agentResponses.length > 0 && (
                  <div className="grid grid-cols-1 gap-3">
                    {msg.agentResponses.map((resp, i) => (
                      <div key={i} className="border rounded-md bg-card overflow-hidden">
                        <div className="bg-muted/30 px-3 py-2 border-b flex items-center gap-2 text-xs font-medium">
                          {getAgentIcon(resp.agent)}
                          {resp.agent.replace('_', ' ')}
                        </div>
                        <div className="p-3 text-sm whitespace-pre-wrap font-mono bg-black/5 dark:bg-black/20">
                          {resp.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fallback if no structured data */}
                {!msg.thought && !msg.agentResponses && (
                  <div className="bg-muted px-4 py-2 rounded-lg">
                    {msg.content}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isPending && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            Orchestrating agents...
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t bg-background flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the team to build something..."
          className="flex-1 bg-muted/50 border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button 
          type="submit" 
          disabled={isPending || !input.trim()}
          className="bg-primary text-primary-foreground p-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
