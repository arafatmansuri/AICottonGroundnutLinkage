import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Leaf, Globe, ChevronDown } from 'lucide-react';
import { setLanguage } from '../../store/uiSlice';
import type { RootState } from '../../store';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'hi', label: 'हिंदी' },
] as const;

/**
 * Shared top navigation bar for all unauthenticated pages.
 * Includes the language picker so individual pages don't need to duplicate it.
 */
export default function Navbar() {
  const dispatch = useDispatch();
  const language = useSelector((s: RootState) => s.ui.language);
  const [langOpen, setLangOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">KisanMitra AI</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <a href="/#features" className="hover:text-green-600 transition-colors">Features</a>
          <a href="/#how-it-works" className="hover:text-green-600 transition-colors">How It Works</a>
          <a href="/#testimonials" className="hover:text-green-600 transition-colors">Stories</a>
        </nav>

        {/* Right side: language picker + auth CTAs */}
        <div className="flex items-center gap-3">
          {/* Language picker */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(o => !o)}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 bg-white border border-gray-200 rounded-xl px-3 py-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{LANGUAGES.find(l => l.code === language)?.label}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {langOpen && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-10 min-w-[120px]">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { dispatch(setLanguage(lang.code)); setLangOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-green-50 hover:text-green-700 ${
                      language === lang.code ? 'bg-green-50 text-green-700 font-medium' : ''
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

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
  );
}
