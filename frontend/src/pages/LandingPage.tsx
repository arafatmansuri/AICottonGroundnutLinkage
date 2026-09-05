import { Link } from 'react-router-dom';
import {
  Leaf,
  TrendingUp,
  Users,
  BrainCircuit,
  BarChart2,
  Star,
  ArrowRight,
  Globe,
  Sprout,
  PackageSearch,
  Warehouse,
} from 'lucide-react';

/* ─── tiny reusable pieces ─── */
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full uppercase tracking-wide">
      {children}
    </span>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">
        {step}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
        <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function TestimonialCard({
  quote,
  name,
  role,
}: {
  quote: string;
  name: string;
  role: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
      <div className="flex gap-0.5 text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-current" />
        ))}
      </div>
      <p className="text-gray-700 text-sm leading-relaxed italic">"{quote}"</p>
      <div>
        <p className="font-semibold text-gray-900 text-sm">{name}</p>
        <p className="text-gray-400 text-xs">{role}</p>
      </div>
    </div>
  );
}

/* ─── main page ─── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">KisanMitra AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-green-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-green-600 transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-green-600 transition-colors">Stories</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="btn-primary text-sm px-4 py-2"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-green-50 via-white to-emerald-50 py-24 px-4">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
          <Badge>
            <BrainCircuit className="w-3 h-3" />
            Powered by IBM Granite AI
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Smarter Decisions for
            <span className="text-green-600"> Every Farmer</span>
          </h1>

          <p className="text-lg text-gray-500 max-w-2xl leading-relaxed">
            KisanMitra AI combines real-time mandi prices, agentic AI pipelines, and direct
            buyer‑farmer matching so you always know <strong className="text-gray-700">where to sell,
            to whom, and when</strong>.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link to="/register" className="btn-primary flex items-center gap-2 px-6 py-3 text-base">
              Start for Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="btn-secondary flex items-center gap-2 px-6 py-3 text-base">
              Try Demo
            </Link>
          </div>

          <p className="text-xs text-gray-400">
            Supports <span className="font-medium">English · हिंदी · ગુજરાતી</span>
          </p>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-green-600 py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {[
            { value: '5+', label: 'Gujarat Mandis' },
            { value: '3', label: 'AI Agents' },
            { value: '31 days', label: 'Price History' },
            { value: '3 langs', label: 'Multilingual' },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className="text-3xl font-bold text-white">{s.value}</span>
              <span className="text-green-100 text-sm text-center">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge><Sprout className="w-3 h-3" /> Features</Badge>
            <h2 className="text-3xl font-bold mt-4 mb-3">Everything you need to sell smarter</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
              From live mandi prices to AI‑powered recommendations — all in one place,
              available in your language.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={<TrendingUp className="w-5 h-5" />}
              title="Live Mandi Price Forecasting"
              description="AI analyses 30-day historical trends across Ahmedabad, Rajkot, Surendranagar and more to predict where prices are heading."
            />
            <FeatureCard
              icon={<Users className="w-5 h-5" />}
              title="Verified Buyer Marketplace"
              description="Browse admin-verified buyers ranked by net realization after transport cost — not just the headline price."
            />
            <FeatureCard
              icon={<Warehouse className="w-5 h-5" />}
              title="Sell vs Store Advisor"
              description="Get a data-backed SELL NOW / STORE / SELL PARTIALLY recommendation with risk analysis and confidence score."
            />
            <FeatureCard
              icon={<PackageSearch className="w-5 h-5" />}
              title="AI Quality Grading"
              description="Upload a crop photo and receive an instant AI quality assessment for Cotton and Groundnut to negotiate better prices."
            />
            <FeatureCard
              icon={<BarChart2 className="w-5 h-5" />}
              title="Income Dashboard"
              description="Track your crop portfolio value, income history, and upcoming transaction summaries in one clean view."
            />
            <FeatureCard
              icon={<Globe className="w-5 h-5" />}
              title="Multilingual AI Assistant"
              description='Ask your question in Gujarati — "મારો કપાસ અત્યારે વેચવો?" — and get a clear AI answer in your language.'
            />
          </div>
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">Why KisanMitra AI?</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-gray-500 font-semibold">Traditional Approach</th>
                  <th className="text-left px-5 py-3 text-green-700 font-semibold">KisanMitra AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ['Check one mandi price', 'AI compares all mandis + buyers'],
                  ['No transport cost awareness', 'Net realization calculated automatically'],
                  ['No sell/store guidance', 'Sell vs Store advisor with risk analysis'],
                  ['No quality guidance', 'AI-assisted visual quality assessment'],
                  ['Language barrier', 'Gujarati, Hindi, English support'],
                  ['Manual buyer search', 'Verified buyer marketplace with ranking'],
                ].map(([old, ai]) => (
                  <tr key={old}>
                    <td className="px-5 py-3 text-gray-500">{old}</td>
                    <td className="px-5 py-3 text-gray-900 font-medium flex items-center gap-2">
                      <span className="text-green-500">✓</span> {ai}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <Badge><BrainCircuit className="w-3 h-3" /> How It Works</Badge>
            <h2 className="text-3xl font-bold mt-4">From question to action in seconds</h2>
          </div>
          <div className="flex flex-col gap-8">
            <StepCard
              step={1}
              title="Register & add your crops"
              description="Create a farmer account, add your Cotton or Groundnut inventory with quantity and district."
            />
            <StepCard
              step={2}
              title="Ask the AI Assistant"
              description='Type or speak your query — "Should I sell my cotton now?" — in English, Hindi, or Gujarati.'
            />
            <StepCard
              step={3}
              title="AI agents analyse the market"
              description="MandiForecasting, BuyerMatching, and StorageAdvisor agents run in parallel to give you a ranked recommendation."
            />
            <StepCard
              step={4}
              title="Connect with a verified buyer"
              description="Browse the marketplace, see net price after transport, and initiate a transaction directly from the platform."
            />
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="bg-green-50 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge><Star className="w-3 h-3" /> Farmer Stories</Badge>
            <h2 className="text-3xl font-bold mt-4">Trusted by farmers across Gujarat</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <TestimonialCard
              quote="I used to sell at Ahmedabad mandi without knowing Rajkot was paying ₹200 more per quintal. KisanMitra AI showed me in seconds."
              name="Ramesh Patel"
              role="Cotton Farmer, Surendranagar"
            />
            <TestimonialCard
              quote="The Sell vs Store advisor told me to wait 2 weeks. Prices rose exactly as predicted and I earned 15% more than my neighbours."
              name="Suresh Desai"
              role="Groundnut Farmer, Rajkot"
            />
            <TestimonialCard
              quote="I can ask questions in Gujarati and get clear answers. No more middlemen telling me what to do."
              name="Maniben Solanki"
              role="Cotton Farmer, Bhavnagar"
            />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 bg-gradient-to-br from-green-600 to-emerald-700 text-white text-center">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-6">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <Leaf className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Information → Intelligence → Action
          </h2>
          <p className="text-green-100 leading-relaxed max-w-lg">
            Join farmers across Gujarat who are using AI to make better decisions every harvest season.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/register"
              className="bg-white text-green-700 hover:bg-green-50 font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
            >
              Create Free Account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="bg-white/20 hover:bg-white/30 text-white font-semibold px-6 py-3 rounded-xl transition-colors border border-white/30"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-white">KisanMitra AI</span>
          </div>
          <p className="text-gray-500 text-xs text-center">
            Built for farmers, powered by{' '}
            <span className="text-green-400 font-medium">IBM Granite AI</span>, trusted through transparency.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
