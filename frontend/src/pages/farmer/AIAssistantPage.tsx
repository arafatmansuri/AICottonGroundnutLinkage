import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { aiApi, farmerApi, marketApi } from '../../api';
import type { AIQueryInput } from '../../api';
import type { AIQueryResult, AgentStep, Crop, FarmerCrop, MatchedBuyer } from '../../types';
import { formatCurrency, getDecisionColor, getDecisionLabel } from '../../utils';
import { Bot, Send, Loader2, ChevronDown, ChevronUp, Zap, CheckCircle2, TrendingUp, TrendingDown, Minus, Users, BarChart2 } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

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

/** Injected when AI needs a crop but user hasn't selected one */
interface CropSelectionMessage {
  role: 'crop_selection';
  pendingQuery: string;
  timestamp: Date;
  resolved: boolean;
}

type Message = UserMessage | AssistantMessage | CropSelectionMessage;

function isAssistantMessage(msg: Message): msg is AssistantMessage {
  return msg.role === 'assistant' && 'data' in msg;
}

function isCropSelectionMessage(msg: Message): msg is CropSelectionMessage {
  return msg.role === 'crop_selection';
}

/**
 * Returns true if the query likely needs a specific crop to be useful.
 * We intercept only when no cropId is set.
 */
function queryCropDependent(query: string): boolean {
  const lower = query.toLowerCase();
  return (
    /\btrend\b|\bmarket\b|\bprice\b|\bforecast\b|\bsell\b|\bbuyer\b|\bearning\b|\bincome\b|\bstore\b|\bhold\b|\bmandi\b|\brate\b/.test(lower)
  );
}

// ── Markdown → JSX renderer (no external dep) ────────────────────────────────

function RichText({ text }: { text: string }) {
  // Split on double newline for paragraphs
  const paragraphs = text.split(/\n{2,}/);

  return (
    <div className="space-y-2">
      {paragraphs.map((para, pi) => {
        const lines = para.split('\n');
        return (
          <div key={pi}>
            {lines.map((line, li) => {
              // Bullet points
              if (line.match(/^[-•*]\s/)) {
                return (
                  <div key={li} className="flex gap-1.5 text-sm leading-relaxed">
                    <span className="text-green-600 mt-0.5 flex-shrink-0">•</span>
                    <span>{renderInline(line.replace(/^[-•*]\s/, ''))}</span>
                  </div>
                );
              }
              // Numbered list
              if (line.match(/^\d+\.\s/)) {
                return (
                  <div key={li} className="flex gap-1.5 text-sm leading-relaxed">
                    <span className="text-green-600 mt-0.5 flex-shrink-0 font-semibold">
                      {line.match(/^(\d+)\./)?.[1]}.
                    </span>
                    <span>{renderInline(line.replace(/^\d+\.\s/, ''))}</span>
                  </div>
                );
              }
              return (
                <p key={li} className="text-sm leading-relaxed">
                  {renderInline(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/** Render inline markdown: **bold**, *italic*, `code`, ₹numbers */
function renderInline(text: string): React.ReactNode {
  // Split on bold (**...**), italic (*...*), or code (`...`)
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-gray-200 rounded px-1 font-mono text-xs">{part.slice(1, -1)}</code>;
    }
    return <span key={i}>{part}</span>;
  });
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

// ── Forecast Card ─────────────────────────────────────────────────────────────

function ForecastCard({ forecast }: { forecast: NonNullable<AIQueryResult['forecast']> }) {
  const { t } = useLanguage();
  const TrendIcon =
    forecast.trend === 'INCREASING' ? TrendingUp :
    forecast.trend === 'DECREASING' ? TrendingDown : Minus;

  const trendColor =
    forecast.trend === 'INCREASING' ? 'text-green-600' :
    forecast.trend === 'DECREASING' ? 'text-red-600' : 'text-gray-500';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 mt-2">
      <div className="flex items-center gap-1.5 mb-2">
        <BarChart2 className="w-3.5 h-3.5 text-blue-500" />
        <span className="text-xs font-semibold text-gray-700">{t('price_forecast_7day')}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-gray-400 mb-0.5">{t('current')}</p>
          <p className="font-bold text-gray-900">{formatCurrency(forecast.currentPrice)}</p>
          <p className="text-gray-400">/{t('qtl')}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-gray-400 mb-0.5">{t('forecast_range')}</p>
          <p className="font-semibold text-gray-800">
            {formatCurrency(forecast.forecastRange.min)}–{formatCurrency(forecast.forecastRange.max)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-gray-400 mb-0.5">{t('trend')}</p>
          <div className={`flex items-center justify-center gap-1 font-semibold ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            <span className="capitalize">{forecast.trend.toLowerCase()}</span>
          </div>
          <p className="text-gray-400 mt-0.5">{Math.round(forecast.confidence * 100)}% conf.</p>
        </div>
      </div>
      {forecast.explanation && (
        <p className="text-xs text-gray-500 mt-2 border-t border-gray-100 pt-2">{forecast.explanation}</p>
      )}
    </div>
  );
}

// ── Buyer Table ───────────────────────────────────────────────────────────────

function BuyerTable({ buyers }: { buyers: MatchedBuyer[] }) {
  const { t } = useLanguage();
  if (buyers.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 mt-2 overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-100">
        <Users className="w-3.5 h-3.5 text-purple-500" />
        <span className="text-xs font-semibold text-gray-700">{t('matched_buyers')} ({buyers.length})</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500">
              <th className="text-left px-3 py-2 font-medium">{t('buyers')}</th>
              <th className="text-right px-3 py-2 font-medium">{t('gross_price')}</th>
              <th className="text-right px-3 py-2 font-medium">{t('transport_cost')}</th>
              <th className="text-right px-3 py-2 font-medium">{t('net_price')}</th>
              <th className="text-center px-3 py-2 font-medium">{t('verified')}</th>
            </tr>
          </thead>
          <tbody>
            {buyers.map((b, i) => (
              <tr key={b.buyerOfferId} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-3 py-2">
                  <p className="font-medium text-gray-800 truncate max-w-[100px]">{b.companyName}</p>
                  <p className="text-gray-400">{b.district}</p>
                </td>
                <td className="px-3 py-2 text-right font-medium text-gray-800">
                  {formatCurrency(b.offeredPrice)}
                </td>
                <td className="px-3 py-2 text-right text-red-500">
                  -{formatCurrency(b.transportCostPerUnit)}
                </td>
                <td className="px-3 py-2 text-right font-bold text-green-600">
                  {formatCurrency(b.estimatedNetRealization)}
                </td>
                <td className="px-3 py-2 text-center">
                  {b.isVerified ? (
                    <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">✓ {t('verified')}</span>
                  ) : (
                    <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{t('pending')}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Agent Steps trace component ───────────────────────────────────────────────

interface AgentTraceProps {
  steps: AgentStep[];
  executionMs: number;
  provider: string;
}

function AgentTrace({ steps, executionMs, provider }: AgentTraceProps) {
  const { t } = useLanguage();
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
            {t('agentic_trace')} — {steps.length} {steps.length !== 1 ? t('tools_called_plural') : t('tools_called')}
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

// ── Inline crop-selection bubble ─────────────────────────────────────────────

interface CropSelectionBubbleProps {
  msg: CropSelectionMessage;
  crops: Crop[];
  onSelect: (cropId: string, cropName: string, pendingQuery: string) => void;
}

function CropSelectionBubble({ msg, crops, onSelect }: CropSelectionBubbleProps) {
  const { t } = useLanguage();
  return (
    <div className="bg-gray-50 text-gray-800 rounded-2xl px-4 py-3 max-w-[85%]">
      <p className="text-sm text-gray-700 mb-2">
        {t('crop_selection_prompt')}
      </p>
      <div className="flex flex-wrap gap-2">
        {crops.map(c => (
          <button
            key={c.id}
            disabled={msg.resolved}
            onClick={() => onSelect(c.id, c.name, msg.pendingQuery)}
            className={`text-sm px-3 py-1.5 rounded-full border font-medium transition-colors
              ${msg.resolved
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white hover:bg-green-50 text-green-700 border-green-300 hover:border-green-500 cursor-pointer'
              }`}
          >
            {c.name}
          </button>
        ))}
      </div>
      {msg.resolved && (
        <p className="text-xs text-gray-400 mt-2 italic">{t('selection_confirmed')}</p>
      )}
    </div>
  );
}

// ── Assistant message bubble ──────────────────────────────────────────────────

function AssistantBubble({ msg }: { msg: AssistantMessage }) {
  const { t } = useLanguage();
  const hasStructuredData = msg.data.agentSteps.length > 0;

  return (
    <div className="bg-gray-50 text-gray-800 rounded-2xl px-4 py-3 max-w-[85%]">
      {/* Rich text body */}
      <RichText text={msg.content || msg.data.explanation} />

      {hasStructuredData && (
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

          {/* Forecast card */}
          {msg.data.forecast && msg.data.forecast.currentPrice > 0 && (
            <ForecastCard forecast={msg.data.forecast} />
          )}

          {/* Net price comparison */}
          {msg.data.netPriceComparison && (
            <div className="bg-white rounded-xl border border-gray-200 p-3 text-xs">
              <p className="font-semibold text-gray-700 mb-2">{t('net_price_comparison')}</p>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">{t('mandi_price')}</span>
                  <span className="font-medium text-gray-800">
                    {formatCurrency(msg.data.netPriceComparison.mandiPrice)}/{t('qtl')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">{t('best_buyer_offered')}</span>
                  <span className="font-medium text-gray-800">
                    {formatCurrency(msg.data.netPriceComparison.bestBuyerGrossPrice)}/{t('qtl')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">{t('transport_cost')}</span>
                  <span className="text-red-500">
                    -{formatCurrency(msg.data.netPriceComparison.transportCostPerUnit)}/{t('qtl')}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-100 pt-1.5 mt-1">
                  <span className="font-semibold text-gray-700">{t('best_buyer_net')}</span>
                  <span className={`font-bold text-base ${msg.data.netPriceComparison.betterOption === 'BUYER' ? 'text-green-600' : 'text-gray-700'}`}>
                    {formatCurrency(msg.data.netPriceComparison.bestBuyerNetRealization)}/{t('qtl')}
                  </span>
                </div>
                <div className="mt-1.5 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    msg.data.netPriceComparison.betterOption === 'BUYER'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {t('better_option')}: {msg.data.netPriceComparison.betterOption}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Matched buyers table */}
          {msg.data.matchedBuyers && msg.data.matchedBuyers.length > 0 && (
            <BuyerTable buyers={msg.data.matchedBuyers} />
          )}

          {/* Reasoning bullets */}
          {(msg.data.recommendation?.reasoning?.length ?? 0) > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-3 text-xs">
              <p className="font-semibold text-gray-700 mb-1.5">{t('analysis_points')}</p>
              <div className="space-y-1 text-gray-600">
                {msg.data.recommendation!.reasoning.map((r, ri) => (
                  <div key={ri} className="flex gap-1.5">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
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
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AIAssistantPage() {
  const { t, language } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: t('ai_greeting'),
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
        content: t('ai_unavailable'),
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

  /** Build the last N turns as ConversationTurn[] to send with the request */
  const buildChatHistory = (currentMessages: Message[]): ConversationTurn[] => {
    // Skip the initial greeting (index 0), take up to last 6 turns; skip crop_selection messages
    return currentMessages
      .slice(1)
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-6)
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: isAssistantMessage(m)
          ? (m.data.explanation || m.content)
          : (m as UserMessage).content,
      }));
  };

  /** Fire the actual AI query */
  const fireQuery = (query: string, cropId?: string) => {
    queryMutation.mutate({
      query,
      language: language as 'en' | 'hi' | 'gu',
      cropId: cropId || selectedCropId || undefined,
      farmerCropId: selectedFarmerCropId || undefined,
      chatHistory: buildChatHistory(messages),
    });
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: UserMessage = { role: 'user', content: trimmed, timestamp: new Date() };

    // If no crop is selected and the query seems crop-dependent, show an inline selection
    if (!selectedCropId && !selectedFarmerCropId && queryCropDependent(trimmed)) {
      const selectionMsg: CropSelectionMessage = {
        role: 'crop_selection',
        pendingQuery: trimmed,
        timestamp: new Date(),
        resolved: false,
      };
      setMessages(prev => [...prev, userMsg, selectionMsg]);
      setInput('');
      return;
    }

    setMessages(prev => [...prev, userMsg]);
    fireQuery(trimmed);
    setInput('');
  };

  /**
   * Called when the user taps a crop pill inside a CropSelectionBubble.
   * Marks that bubble as resolved, sets the global cropId, and re-fires the query.
   */
  const handleCropSelection = (cropId: string, cropName: string, pendingQuery: string) => {
    // Mark the selection bubble as resolved (disable further clicks)
    setMessages(prev =>
      prev.map(m =>
        isCropSelectionMessage(m) && m.pendingQuery === pendingQuery && !m.resolved
          ? { ...m, resolved: true }
          : m,
      ),
    );
    // Persist the selection in the dropdown so subsequent messages reuse it
    setSelectedCropId(cropId);
    // Show a brief confirmation echo in the chat as a user bubble
    const confirmMsg: UserMessage = {
      role: 'user',
      content: `${cropName}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, confirmMsg]);
    fireQuery(pendingQuery, cropId);
  };

  const suggestions: string[] = [
    t('suggestion_1'),
    t('suggestion_2'),
    t('suggestion_3'),
    t('suggestion_4'),
  ];

  return (
    <div className="max-w-3xl space-y-4">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('ai_assistant')}</h1>
        <div className="flex items-center gap-2 flex-wrap">
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
        <p className="text-xs font-medium text-gray-500 mb-2">{t('select_context')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            className="input text-sm w-full"
            value={selectedCropId}
            onChange={e => setSelectedCropId(e.target.value)}
          >
            <option value="">{t('all_crops')}</option>
            {crops?.map((c: Crop) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            className="input text-sm w-full"
            value={selectedFarmerCropId}
            onChange={e => setSelectedFarmerCropId(e.target.value)}
          >
            <option value="">{t('no_specific_crop')}</option>
            {farmerCrops?.map((fc: FarmerCrop) => (
              <option key={fc.id} value={fc.id}>
                {fc.crop?.name} — {fc.quantity} qtl ({fc.district})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat window */}
      <div className="card p-0 overflow-hidden">
        <div className="h-[400px] sm:h-[520px] overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {(msg.role === 'assistant' || msg.role === 'crop_selection') && (
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-green-600" />
                </div>
              )}

              {msg.role === 'user' ? (
                <div className="max-w-[80%] bg-green-600 text-white rounded-2xl px-4 py-3">
                  <p className="text-sm leading-relaxed">{(msg as UserMessage).content}</p>
                </div>
              ) : isCropSelectionMessage(msg) ? (
                <CropSelectionBubble
                  msg={msg}
                  crops={crops ?? []}
                  onSelect={handleCropSelection}
                />
              ) : (
                isAssistantMessage(msg) && <AssistantBubble msg={msg} />
              )}
            </div>
          ))}

          {/* Thinking indicator */}
          {queryMutation.isPending && (
            <div className="flex justify-start">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                <Bot className="w-4 h-4 text-green-600" />
              </div>
              <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                <span className="text-sm text-gray-500">{t('agent_thinking')}</span>
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
        <div className="border-t border-gray-100 p-3 sm:p-4 flex gap-2 sm:gap-3">
          <input
            type="text"
            className="input flex-1 text-sm min-w-0"
            placeholder={t('type_message')}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={queryMutation.isPending || !input.trim()}
            className="btn-primary px-3 sm:px-4 disabled:opacity-50 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        {t('ai_disclaimer')}
      </p>
    </div>
  );
}
