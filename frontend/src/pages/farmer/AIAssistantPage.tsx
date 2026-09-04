import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { aiApi, farmerApi, marketApi } from '../../api';
import type { AIQueryInput } from '../../api';
import type { AIQueryResult, AgentStep, Crop, FarmerCrop } from '../../types';
import { formatCurrency, getDecisionColor, getDecisionLabel } from '../../utils';
import { Bot, Send, Loader2, ChevronDown, ChevronUp, Zap, CheckCircle2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { t } from '../../i18n';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserMessage {
  role: 'user';
  content: string;
  timestamp: Date;
}

interface AssistantMessage {
  role: 'assistant';
  content: string;
  timestamp: Date;
  data: AIQueryResult;
}

type Message = UserMessage | AssistantMessage;

function isAssistantMessage(msg: Message): msg is AssistantMessage {
  return msg.role === 'assistant' && 'data' in msg;
}

// ── Tool name → human-readable label ─────────────────────────────────────────

const TOOL_LABELS: Record<string, string> = {
  get_price_forecast: '📈 Fetching price forecast',
  find_buyers: '🤝 Finding best buyers',
  storage_advisor: '📦 Running storage analysis',
};

function toolLabel(name: string): string {
  return TOOL_LABELS[name] ?? `🔧 ${name}`;
}

// ── Agent Steps trace component ───────────────────────────────────────────────

interface AgentTraceProps {
  steps: AgentStep[];
  executionMs: number;
  provider: string;
}

function AgentTrace({ steps, executionMs, provider }: AgentTraceProps) {
  const [expanded, setExpanded] = useState(false);

  if (steps.length === 0) return null;

  return (
    <div className="mt-2 rounded-xl border border-gray-100 bg-gray-50 text-xs">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-gray-500 hover:text-gray-700"
      >
        <span className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-purple-500" />
          <span className="font-medium text-purple-700">
            Agentic trace — {steps.length} tool{steps.length !== 1 ? 's' : ''} called
          </span>
          <span className="text-gray-400">· {executionMs}ms · {provider}</span>
        </span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-gray-100 pt-2">
          {steps.map((step, i) => (
            <div key={step.toolCallId} className="flex gap-2">
              <div className="flex flex-col items-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                {i < steps.length - 1 && (
                  <div className="w-px flex-1 bg-gray-200 mt-1" />
                )}
              </div>
              <div className="pb-1">
                <p className="font-medium text-gray-700">{toolLabel(step.toolName)}</p>
                <p className="text-gray-500 mt-0.5">{step.outputSummary}</p>
                <p className="text-gray-400 mt-0.5">{step.durationMs}ms</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AIAssistantPage() {
  const { language } = useSelector((s: RootState) => s.ui);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your AI market advisor. Ask me anything about your crops, market prices, when to sell, or which buyers to choose. I analyze real-time data to give you personalized recommendations.',
      timestamp: new Date(),
      data: {
        intent: 'GENERAL',
        agentsUsed: [],
        agentSteps: [],
        explanation: '',
        dataTimestamp: new Date().toISOString(),
        executionMs: 0,
        provider: '',
      },
    },
  ]);

  const [input, setInput] = useState('');
  const [selectedCropId, setSelectedCropId] = useState('');
  const [selectedFarmerCropId, setSelectedFarmerCropId] = useState('');

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const { data: crops } = useQuery({
    queryKey: ['allCrops'],
    queryFn: () => marketApi.getCrops().then(r => r.data.data),
  });

  const { data: farmerCrops } = useQuery({
    queryKey: ['farmerCrops'],
    queryFn: () => farmerApi.getCrops().then(r => r.data.data),
  });

  const queryMutation = useMutation({
    mutationFn: (data: AIQueryInput) => aiApi.query(data).then(r => r.data.data),
    onSuccess: (result: AIQueryResult) => {
      const assistantMsg: AssistantMessage = {
        role: 'assistant',
        content: result.explanation,
        timestamp: new Date(),
        data: result,
      };
      setMessages(prev => [...prev, assistantMsg]);
    },
    onError: () => {
      toast.error('AI service temporarily unavailable');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I\'m having trouble connecting to the AI service right now. Please try again in a moment.',
        timestamp: new Date(),
        data: {
          intent: 'ERROR',
          agentsUsed: [],
          agentSteps: [],
          explanation: '',
          dataTimestamp: new Date().toISOString(),
          executionMs: 0,
          provider: '',
        },
      } satisfies AssistantMessage]);
    },
  });

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: UserMessage = { role: 'user', content: trimmed, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    queryMutation.mutate({
      query: trimmed,
      language: language as 'en' | 'hi' | 'gu',
      cropId: selectedCropId || undefined,
      farmerCropId: selectedFarmerCropId || undefined,
    });
    setInput('');
  };

  const suggestions: string[] = [
    'Should I sell my cotton now or wait?',
    'Find me the best buyer for my groundnut',
    'What is the current market trend?',
    'How much can I earn from selling now?',
  ];

  return (
    <div className="max-w-3xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{t('ai_assistant', language)}</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full border border-purple-200 font-medium">
            Agentic AI — ReAct Loop
          </span>
          <span className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200">
            Tool Calling
          </span>
        </div>
      </div>

      {/* Context selectors */}
      <div className="card p-4">
        <p className="text-xs font-medium text-gray-500 mb-2">Select context for better AI analysis:</p>
        <div className="flex gap-3 flex-wrap">
          <select
            className="input text-sm max-w-[200px]"
            value={selectedCropId}
            onChange={e => setSelectedCropId(e.target.value)}
          >
            <option value="">All crops</option>
            {crops?.map((c: Crop) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            className="input text-sm max-w-[200px]"
            value={selectedFarmerCropId}
            onChange={e => setSelectedFarmerCropId(e.target.value)}
          >
            <option value="">No specific crop</option>
            {farmerCrops?.map((fc: FarmerCrop) => (
              <option key={fc.id} value={fc.id}>
                {fc.crop?.name} — {fc.availableQuantity} qtl ({fc.district})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat window */}
      <div className="card p-0 overflow-hidden">
        <div className="h-[480px] overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-green-600" />
                </div>
              )}

              <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-green-600 text-white' : 'bg-gray-50 text-gray-800'} rounded-2xl px-4 py-3`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>

                {/* Structured AI results for assistant messages */}
                {isAssistantMessage(msg) && msg.data.agentSteps.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {/* Recommendation badge */}
                    {msg.data.recommendation && (
                      <div className={`px-3 py-2 rounded-xl text-sm font-semibold ${getDecisionColor(msg.data.recommendation.decision)}`}>
                        📊 {getDecisionLabel(msg.data.recommendation.decision)}
                        {msg.data.recommendation.sellNowQuantity > 0 && (
                          <span className="ml-2 text-xs font-normal">
                            Sell: {msg.data.recommendation.sellNowQuantity} qtl
                            {' '}| Hold: {msg.data.recommendation.holdQuantity} qtl
                          </span>
                        )}
                      </div>
                    )}

                    {/* Net price comparison */}
                    {msg.data.netPriceComparison && (
                      <div className="bg-white rounded-xl p-3 text-xs space-y-1">
                        <p className="font-semibold text-gray-700 mb-1">Net Price Comparison:</p>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Mandi Price:</span>
                          <span className="font-medium">
                            {formatCurrency(msg.data.netPriceComparison.mandiPrice)}/qtl
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Best Buyer (Net):</span>
                          <span className={`font-bold ${msg.data.netPriceComparison.betterOption === 'BUYER' ? 'text-green-600' : ''}`}>
                            {formatCurrency(msg.data.netPriceComparison.bestBuyerNetRealization)}/qtl
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Better option:</span>
                          <span className="font-semibold text-blue-600">
                            {msg.data.netPriceComparison.betterOption}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Reasoning bullets */}
                    {(msg.data.recommendation?.reasoning?.length ?? 0) > 0 && (
                      <div className="text-xs text-gray-600 space-y-0.5">
                        {msg.data.recommendation!.reasoning.map((r, ri) => (
                          <p key={ri}>• {r}</p>
                        ))}
                      </div>
                    )}

                    {/* Agentic trace — collapsible */}
                    <AgentTrace
                      steps={msg.data.agentSteps}
                      executionMs={msg.data.executionMs}
                      provider={msg.data.provider}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Thinking indicator — shows per-step label when agent is running */}
          {queryMutation.isPending && (
            <div className="flex justify-start">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                <Bot className="w-4 h-4 text-green-600" />
              </div>
              <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                <span className="text-sm text-gray-500">Agent is reasoning & calling tools…</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion chips — only on first message */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 flex gap-2 flex-wrap">
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-full border border-green-200"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="border-t border-gray-100 p-4 flex gap-3">
          <input
            type="text"
            className="input flex-1 text-sm"
            placeholder={t('type_message', language)}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={queryMutation.isPending || !input.trim()}
            className="btn-primary px-4 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        ★ AI-assisted analysis — not a guaranteed financial outcome. Always verify with market experts.
      </p>
    </div>
  );
}
