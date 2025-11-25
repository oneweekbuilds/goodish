import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Lightbulb, TrendingUp, TrendingDown, Lock, ChevronDown, Calendar as CalendarIcon, Sparkles, ArrowRight, Info } from 'lucide-react';
import { Card } from './ui/Card';
import { Switch } from './ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Button } from './ui/Button';
import { FeatureGate } from './FeatureGate';
import { Calendar } from './ui/calendar';
import { DateRange } from 'react-day-picker';
import {
  PieChart as RechartPie,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Area,
} from 'recharts';

interface DashboardPageProps {
  onNavigate: (page: string, params?: any) => void;
  currentPlan: 'free' | 'premium';
  onUpgrade: () => void;
}

export function DashboardPage({ onNavigate, currentPlan, onUpgrade }: DashboardPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [showComparison, setShowComparison] = useState(false);
  const [dateRange, setDateRange] = useState<'7days' | '30days' | 'custom'>('7days');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['all']);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);
  const dateRangeRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const isPremium = currentPlan === 'premium';

  // Platform data
  const platforms = [
    { id: 'instagram', name: 'Instagram', abbr: 'IG', color: '#E4405F' },
    { id: 'tiktok', name: 'TikTok', abbr: 'TT', color: '#000000' },
    { id: 'youtube', name: 'YouTube', abbr: 'YT', color: '#FF0000' },
    { id: 'twitter', name: 'X', abbr: 'X', color: '#1DA1F2' },
    { id: 'linkedin', name: 'LinkedIn', abbr: 'IN', color: '#0A66C2' },
  ];

  const handleDateRangeChange = (range: '7days' | '30days' | 'custom') => {
    if (!isPremium) return;
    if (range === 'custom') {
      setDateRange('custom');
      setIsDateRangeOpen(false);
      setShowCalendar(true);
    } else {
      setIsUpdating(true);
      setDateRange(range);
      setIsDateRangeOpen(false);
      setShowCalendar(false);
      setTimeout(() => setIsUpdating(false), 800);
    }
  };

  const handleCustomDateSelect = (range: DateRange | undefined) => {
    setCustomDateRange(range);
    if (range?.from && range?.to) {
      setIsUpdating(true);
      setTimeout(() => setIsUpdating(false), 800);
      setShowCalendar(false);
    }
  };

  const handleComparisonToggle = (checked: boolean) => {
    console.log('Toggle clicked:', checked, 'isPremium:', isPremium);
    if (!isPremium) {
      console.log('Not premium, toggle disabled');
      return;
    }
    console.log('Setting showComparison to:', checked);
    setShowComparison(checked);
  };

  // Handle click outside to close date range dropdown and calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateRangeRef.current && !dateRangeRef.current.contains(event.target as Node)) {
        setIsDateRangeOpen(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    if (isDateRangeOpen || showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isDateRangeOpen, showCalendar]);

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case '7days':
        return 'Last 7 Days';
      case '30days':
        return 'Last 30 Days';
      case 'custom':
        if (customDateRange?.from && customDateRange?.to) {
          const formatDate = (date: Date) => {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          };
          return `${formatDate(customDateRange.from)} - ${formatDate(customDateRange.to)}`;
        }
        return 'Custom Range';
      default:
        return 'Last 7 Days';
    }
  };

  const handlePlatformToggle = (platformId: string) => {
    if (!isPremium) return;
    setIsUpdating(true);
    if (platformId === 'all') {
      setSelectedPlatforms(['all']);
    } else {
      const newSelection = selectedPlatforms.includes(platformId)
        ? selectedPlatforms.filter(p => p !== platformId)
        : [...selectedPlatforms.filter(p => p !== 'all'), platformId];
      setSelectedPlatforms(newSelection.length === 0 ? ['all'] : newSelection);
    }
    setTimeout(() => setIsUpdating(false), 800);
  };

  // Mock Data - ALL REALISTIC, NO PLACEHOLDERS
  const topTopics = [
    { name: 'Wellness', value: 28, color: '#8b5cf6' },
    { name: 'Politics', value: 24, color: '#ef4444' },
    { name: 'Technology', value: 20, color: '#34D1BF' },
    { name: 'Entertainment', value: 15, color: '#f59e0b' },
    { name: 'Lifestyle', value: 13, color: '#ec4899' },
  ];

  const connectionData = [
    { name: 'Friends & Family', value: 15, color: '#ec4899' },
    { name: 'Other Content', value: 85, color: '#94a3b8' },
  ];

  const politicalLean = [
    { name: 'Left', value: 58, color: '#3b82f6' },
    { name: 'Neutral', value: 22, color: '#94a3b8' },
    { name: 'Right', value: 20, color: '#ef4444' },
  ];

  const contentTone = [
    { tone: 'Balanced', value: 14, color: '#34D1BF' },
    { tone: 'Analytical', value: 28, color: '#94a3b8' },
    { tone: 'Outrage', value: 38, color: '#ef4444' },
    { tone: 'Empathetic', value: 20, color: '#8b5cf6' },
  ];

  const topicSentiment = [
    { topic: 'Wellness', positive: 60, neutral: 25, negative: 15 },
    { topic: 'Politics', positive: 25, neutral: 15, negative: 60 },
    { topic: 'Tech', positive: 65, neutral: 20, negative: 15 },
    { topic: 'Sustainability', positive: 70, neutral: 20, negative: 10 },
    { topic: 'Finance', positive: 35, neutral: 30, negative: 35 },
    { topic: 'Mental Health', positive: 55, neutral: 25, negative: 20 },
    { topic: 'Lifestyle', positive: 50, neutral: 30, negative: 20 },
    { topic: 'Sports', positive: 45, neutral: 30, negative: 25 },
  ];

  const creatorConcentration = [
    { name: 'Top 10 Creators', value: 68, color: '#ef4444' },
    { name: 'All Others', value: 32, color: '#94a3b8' },
  ];

  const geographicData = [
    { region: 'North America', value: 78, color: '#34D1BF' },
    { region: 'Europe', value: 10, color: '#8b5cf6' },
    { region: 'Asia', value: 8, color: '#f59e0b' },
    { region: 'Other', value: 4, color: '#94a3b8' },
  ];

  const productCategories = [
    { category: 'Wellness & Fitness', value: 32 },
    { category: 'Tech & Gadgets', value: 28 },
    { category: 'Fashion & Beauty', value: 18 },
    { category: 'Food & Dining', value: 14 },
    { category: 'Home & Living', value: 8 },
  ];

  const topProducts = [
    { name: 'Fitness Tracker', count: 284 },
    { name: 'Yoga Mat', count: 231 },
    { name: 'Protein Powder', count: 198 },
    { name: 'Running Shoes', count: 176 },
    { name: 'Meditation App', count: 152 },
    { name: 'Smart Watch', count: 134 },
    { name: 'Meal Prep Kit', count: 108 },
    { name: 'Workout Clothes', count: 89 },
  ];

  // 7-Day Trends Data
  const sevenDayTrends = [
    { day: 'Mon', wellness: 24, politics: 28, tech: 18, entertainment: 16, lifestyle: 14 },
    { day: 'Tue', wellness: 26, politics: 26, tech: 19, entertainment: 15, lifestyle: 14 },
    { day: 'Wed', wellness: 25, politics: 25, tech: 21, entertainment: 15, lifestyle: 14 },
    { day: 'Thu', wellness: 27, politics: 24, tech: 20, entertainment: 16, lifestyle: 13 },
    { day: 'Fri', wellness: 28, politics: 23, tech: 20, entertainment: 17, lifestyle: 12 },
    { day: 'Sat', wellness: 29, politics: 22, tech: 19, entertainment: 18, lifestyle: 12 },
    { day: 'Sun', wellness: 28, politics: 24, tech: 20, entertainment: 15, lifestyle: 13 },
  ];

  const topicDeltas = [
    { topic: 'Wellness', change: 4, direction: 'up' },
    { topic: 'Entertainment', change: -1, direction: 'down' },
    { topic: 'Tech', change: 2, direction: 'up' },
    { topic: 'Politics', change: -4, direction: 'down' },
    { topic: 'Lifestyle', change: -1, direction: 'down' },
  ];

  // Per-Platform Insights Data
  const platformComparison = [
    {
      platform: 'Instagram',
      wellness: 35,
      politics: 18,
      tech: 15,
      entertainment: 20,
      lifestyle: 12
    },
    {
      platform: 'TikTok',
      wellness: 28,
      politics: 15,
      tech: 22,
      entertainment: 25,
      lifestyle: 10
    },
    {
      platform: 'Twitter',
      wellness: 15,
      politics: 45,
      tech: 25,
      entertainment: 8,
      lifestyle: 7
    },
    {
      platform: 'YouTube',
      wellness: 25,
      politics: 20,
      tech: 30,
      entertainment: 15,
      lifestyle: 10
    },
  ];

  // Topic Sentiment Data (for Plus users)
  const topicSentimentData = [
    { topic: 'Wellness', positive: 75, neutral: 15, negative: 10 },
    { topic: 'Politics', positive: 25, neutral: 15, negative: 60 },
    { topic: 'Tech', positive: 65, neutral: 25, negative: 10 },
    { topic: 'Entertainment', positive: 70, neutral: 20, negative: 10 },
    { topic: 'Lifestyle', positive: 60, neutral: 25, negative: 15 },
  ];

  // Brand Tracking Data
  const topBrands = [
    { name: 'Nike', mentions: 142, sentiment: 85, category: 'Athletic' },
    { name: 'Apple', mentions: 128, sentiment: 90, category: 'Tech' },
    { name: 'Lululemon', mentions: 98, sentiment: 88, category: 'Athletic' },
    { name: 'Whole Foods', mentions: 86, sentiment: 75, category: 'Food' },
    { name: 'Peloton', mentions: 74, sentiment: 80, category: 'Fitness' },
    { name: 'Tesla', mentions: 68, sentiment: 72, category: 'Tech' },
    { name: 'Glossier', mentions: 54, sentiment: 82, category: 'Beauty' },
    { name: 'Patagonia', mentions: 48, sentiment: 92, category: 'Outdoor' },
  ];

  const TakeawayBox = ({ text }: { text: string }) => (
    <motion.div
      className="p-6 rounded-2xl bg-card border border-teal-200"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <div className="flex gap-3">
        <Lightbulb size={20} className="text-teal-600 flex-shrink-0 mt-1" />
        <div>
          <h4
            className="mb-2"
            style={{
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: 'var(--font-headline)',
            }}
          >
            Your Takeaway
          </h4>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
            {text}
          </p>
        </div>
      </div>
    </motion.div>
  );

  const ChartTooltipIcon = ({ freeMessage, premiumMessage }: { freeMessage: string; premiumMessage: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex ml-2 opacity-60 hover:opacity-100 transition-opacity">
            <Info size={16} style={{ color: 'var(--foreground-tertiary)' }} />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{isPremium ? premiumMessage : freeMessage}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const UpgradeBannerInline = () => (
    <motion.div
      className="p-6 rounded-2xl border-2 my-8"
      style={{
        background: 'var(--card-bg)',
        borderColor: 'var(--border)',
      }}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--primary)' }}>
            <Sparkles size={20} style={{ color: 'white' }} />
          </div>
          <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--foreground)' }}>
            Want to explore deeper insights and multi-platform trends?
          </p>
        </div>
        <Button
          onClick={onUpgrade}
          className="flex-shrink-0 rounded-lg"
          style={{
            background: 'var(--primary)',
            borderRadius: '8px',
            paddingLeft: '24px',
            paddingRight: '24px',
            height: '44px',
            color: 'white',
          }}
        >
          Upgrade to Premium
          <ArrowRight className="ml-2" size={16} />
        </Button>
      </div>
    </motion.div>
  );

  const PremiumBadge = () => (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-white ml-2"
      style={{
        background: '#4F9FA9',
        fontSize: '10px',
        fontWeight: 800,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}
    >
      Premium
    </span>
  );

  const LockedOverlay = ({ message }: { message: string }) => (
    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
      <div className="text-center px-6">
        <Lock size={32} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground-secondary)' }}>
          {message}
        </p>
        <button
          onClick={onUpgrade}
          className="mt-4 px-4 py-2 rounded-lg text-sm transition-all hover:scale-105"
          style={{ background: 'var(--primary)', color: 'white', borderRadius: '8px' }}
        >
          Unlock with Premium
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background" style={{ paddingTop: '80px', paddingBottom: '64px' }}>
      {/* Header Ribbon */}
      {!isPremium ? (
        <div
          className="w-full border-b"
          style={{
            height: '36px',
            background: 'var(--muted)',
            borderColor: 'rgba(125, 102, 230, 0.15)',
          }}
        >
          <div className="max-w-[1200px] mx-auto px-6 md:px-8 h-full flex items-center justify-center gap-3">
            <span style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>
              Upgrade to Premium for full insights and multi-platform tracking.
            </span>
            <button
              onClick={onUpgrade}
              className="flex items-center gap-1 transition-opacity hover:opacity-80"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--primary)',
                backgroundClip: 'text',
              }}
            >
              Upgrade Now <ArrowRight size={12} />
            </button>
          </div>
        </div>
      ) : (
        <div
          className="w-full border-b"
          style={{
            height: '36px',
            background: 'var(--background)',
            borderColor: 'rgba(79, 159, 169, 0.15)',
          }}
        >
          <div className="max-w-[1200px] mx-auto px-6 md:px-8 h-full flex items-center justify-center">
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#4F9FA9' }}>
              Premium Dashboard Active
            </span>
          </div>
        </div>
      )}

      <div className="px-6 md:px-8" style={{ paddingTop: '40px' }}>
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <h1
              className="mb-3 tracking-tight"
              style={{
                fontSize: 'clamp(36px, 5vw, 56px)',
                fontWeight: 800,
                lineHeight: '1.1',
                fontFamily: 'var(--font-headline)',
              }}
            >
              Your Algorithmic Reality
            </h1>
            <p className="text-lg" style={{ color: 'var(--foreground-secondary)' }}>
              Hi Justin, here's a clear look at what shapes your digital world.
            </p>
          </motion.div>

          {/* Date Filter & Controls Bar */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div
              className={`rounded-2xl p-4 border transition-all ${isPremium
                ? 'bg-white border-gray-200 shadow-md'
                : 'bg-gray-50 border-gray-300 opacity-75'
                }`}
              style={{
                cursor: isPremium ? 'default' : 'not-allowed',
              }}
            >
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                {/* Left: Date Range Selector */}
                <div className="flex items-center gap-3">
                  <div className="relative" ref={dateRangeRef}>
                    <button
                      onClick={() => {
                        if (!isPremium) return;
                        if (dateRange === 'custom') {
                          setShowCalendar(true);
                          setIsDateRangeOpen(false);
                        } else {
                          setIsDateRangeOpen(!isDateRangeOpen);
                        }
                      }}
                      disabled={!isPremium}
                      className={`relative flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${isPremium
                        ? 'bg-white border-gray-200 cursor-pointer hover:border-gray-300'
                        : 'bg-gray-100 border-gray-300 cursor-not-allowed'
                        }`}
                    >
                      <CalendarIcon size={16} style={{ color: isPremium ? 'var(--foreground-secondary)' : '#9CA3AF' }} />
                      <span style={{ fontSize: '14px', fontWeight: 500, color: isPremium ? 'var(--foreground)' : '#9CA3AF' }}>
                        {getDateRangeLabel()}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${isDateRangeOpen ? 'rotate-180' : ''}`}
                        style={{ color: isPremium ? 'var(--foreground-secondary)' : '#9CA3AF' }}
                      />
                      {!isPremium && (
                        <Lock size={14} className="ml-2" style={{ color: '#9CA3AF' }} />
                      )}
                    </button>

                    {isDateRangeOpen && isPremium && (
                      <div className="absolute top-full left-0 mt-2 w-48 rounded-xl bg-white border border-gray-200 shadow-xl overflow-hidden z-50">
                        <div className="p-1">
                          <button
                            onClick={() => handleDateRangeChange('7days')}
                            className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-left transition-all ${dateRange === '7days'
                              ? 'bg-gray-100 font-semibold'
                              : 'hover:bg-gray-50'
                              }`}
                            style={{ fontSize: '14px', color: 'var(--foreground)' }}
                          >
                            Last 7 Days
                          </button>
                          <button
                            onClick={() => handleDateRangeChange('30days')}
                            className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-left transition-all ${dateRange === '30days'
                              ? 'bg-gray-100 font-semibold'
                              : 'hover:bg-gray-50'
                              }`}
                            style={{ fontSize: '14px', color: 'var(--foreground)' }}
                          >
                            Last 30 Days
                          </button>
                          <button
                            onClick={() => handleDateRangeChange('custom')}
                            className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-left transition-all ${dateRange === 'custom'
                              ? 'bg-gray-100 font-semibold'
                              : 'hover:bg-gray-50'
                              }`}
                            style={{ fontSize: '14px', color: 'var(--foreground)' }}
                          >
                            Custom Range
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Calendar Popup for Custom Range */}
                    {showCalendar && isPremium && (
                      <div
                        ref={calendarRef}
                        className="absolute top-full left-0 mt-2 rounded-xl bg-white border border-gray-200 shadow-xl overflow-hidden z-50"
                        style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)', minWidth: '320px' }}
                      >
                        <div className="p-6">
                          <Calendar
                            mode="range"
                            selected={customDateRange}
                            onSelect={handleCustomDateSelect}
                            numberOfMonths={1}
                            className="calendar-custom"
                            classNames={{
                              months: "flex flex-col gap-4",
                              month: "flex flex-col gap-4",
                              caption: "flex justify-center pt-1 relative items-center w-full mb-4",
                              caption_label: "text-base font-semibold text-gray-900",
                              nav: "flex items-center gap-1",
                              nav_button: "h-8 w-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center justify-center active:scale-95",
                              nav_button_previous: "absolute left-1",
                              nav_button_next: "absolute right-1",
                              table: "w-full border-collapse",
                              head_row: "flex mb-2",
                              head_cell: "text-gray-500 rounded-md w-10 font-medium text-xs uppercase tracking-wider",
                              row: "flex w-full mt-1",
                              cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                              day: "h-10 w-10 rounded-lg font-medium transition-all duration-200 hover:bg-gray-100 hover:scale-105 active:scale-95 text-gray-900",
                              day_range_start: "!bg-primary !text-white rounded-l-lg font-semibold shadow-md",
                              day_range_end: "!bg-primary !text-white rounded-r-lg font-semibold shadow-md",
                              day_selected: "!bg-primary !text-white font-semibold shadow-md",
                              day_today: "bg-gray-100 text-gray-900 font-semibold border-2 border-gray-300",
                              day_outside: "text-gray-400 opacity-50",
                              day_disabled: "text-gray-300 opacity-30 cursor-not-allowed",
                              day_range_middle: "!bg-primary/20 text-gray-900",
                              day_hidden: "invisible",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Compare Toggle */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            if (isPremium) {
                              handleComparisonToggle(!showComparison);
                            }
                          }}
                          disabled={!isPremium}
                          className="group relative"
                          style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            background: isPremium
                              ? (showComparison ? 'var(--primary)' : 'var(--muted)')
                              : '#F3F4F6',
                            color: isPremium && showComparison ? 'white' : isPremium ? 'var(--foreground)' : '#9CA3AF',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: isPremium ? 'pointer' : 'not-allowed',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            position: 'relative',
                            zIndex: 100,
                          }}
                          onMouseEnter={(e) => {
                            if (isPremium && showComparison) {
                              e.currentTarget.style.background = 'var(--brand-blue)';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.3)';
                            } else if (isPremium && !showComparison) {
                              e.currentTarget.style.background = 'var(--muted-foreground)';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (isPremium && showComparison) {
                              e.currentTarget.style.background = 'var(--primary)';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            } else if (isPremium && !showComparison) {
                              e.currentTarget.style.background = 'var(--muted)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }
                          }}
                        >
                          <span>Compare to Average</span>
                          {showComparison && isPremium && (
                            <span style={{
                              fontSize: '16px',
                              display: 'inline-block',
                              animation: 'pulse 2s ease-in-out infinite'
                            }}>✓</span>
                          )}
                          {!isPremium && <Lock size={14} />}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">
                          {isPremium
                            ? 'See how your feed differs from the average user'
                            : 'Available in Premium. See how your feed differs from the average user.'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Right: Platform Filters (Premium only) */}
                {isPremium && (
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground-tertiary)' }}>
                      Platforms:
                    </span>
                    {platforms.map(platform => (
                      <TooltipProvider key={platform.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handlePlatformToggle(platform.id)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${selectedPlatforms.includes(platform.id) || selectedPlatforms.includes('all')
                                ? 'text-white shadow-md'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                              style={{
                                background: selectedPlatforms.includes(platform.id) || selectedPlatforms.includes('all')
                                  ? platform.color
                                  : undefined,
                                fontWeight: 700,
                              }}
                            >
                              {platform.abbr}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">{platform.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                )}
              </div>

              {/* Premium Insight Banner (when compare is active) */}
              {isPremium && showComparison && (
                <motion.div
                  className="mt-4 p-3 rounded-xl"
                  style={{ background: 'var(--accent)' }}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground-secondary)' }}>
                    32% of your promoted content is wellness-related — making you valuable to advertisers.
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Updating Overlay */}
          <AnimatePresence>
            {isUpdating && (
              <motion.div
                className="fixed inset-0 bg-white/40 backdrop-blur-sm z-50 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="bg-white rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#7D66E6' }} />
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>Updating dashboard...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 1. Content Composition */}
          <section className="mb-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <h2
                className="mb-8 tracking-tight"
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  lineHeight: '1.1',
                  fontFamily: 'var(--font-headline)',
                }}
              >
                Content Composition
              </h2>

              {!isPremium && (
                <p className="mb-6 text-sm italic" style={{ color: 'var(--foreground-tertiary)' }}>
                  Premium unlocks time filters and multi-platform comparison.
                </p>
              )}

              <div className="grid md:grid-cols-2 gap-8 mb-6">
                {/* Top Topics Donut */}
                <Card className="p-8 relative" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '16px' }}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="flex items-center" style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
                      Top Content Topics
                      <ChartTooltipIcon
                        freeMessage="Premium users can filter this chart by date and platform."
                        premiumMessage="Your data updates automatically when you adjust filters."
                      />
                    </h3>
                    {isPremium && <PremiumBadge />}
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <RechartPie>
                      <Pie
                        data={topTopics}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={50}
                        paddingAngle={2}
                        label={({ name, value }) => `${name} ${value}%`}
                      >
                        {topTopics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </RechartPie>
                  </ResponsiveContainer>
                </Card>

                {/* Friends & Family vs Other */}
                <Card className="p-8" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '16px' }}>
                  <h3 className="flex items-center mb-6" style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
                    Time with Connections
                    <ChartTooltipIcon
                      freeMessage="Premium users can filter this chart by date and platform."
                      premiumMessage="Your data updates automatically when you adjust filters."
                    />
                  </h3>
                  <div className="space-y-6 pt-8">
                    {connectionData.map((item, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between items-baseline">
                          <span style={{ fontSize: '14px', color: 'var(--foreground-secondary)' }}>
                            {item.name}
                          </span>
                          <span style={{ fontSize: '16px', fontWeight: 700 }}>
                            {item.value}%
                          </span>
                        </div>
                        <div className="h-12 bg-gray-100 rounded-xl overflow-hidden">
                          <motion.div
                            className="h-full rounded-xl"
                            style={{ backgroundColor: item.color }}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${item.value}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: i * 0.2, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    ))}
                    {showComparison && (
                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                          Average user: 28% Friends & Family
                        </p>
                        <p className="text-sm mt-1" style={{ fontWeight: 600, color: '#ef4444' }}>
                          You're -13% below average
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {showComparison && (
                <div className="mb-6">
                  <p className="text-base p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center" style={{ color: 'var(--foreground-tertiary)' }}>
                    Most users discover they spend far less time connecting than they thought.
                  </p>
                </div>
              )}

              <TakeawayBox text={showComparison
                ? "You spend only 15% of feed time with friends and family—nearly half the average. The algorithm prioritizes media over connections."
                : "You spend only 15% of feed time with friends and family. The algorithm prioritizes media over connections."
              } />
            </motion.div>
          </section>

          {/* Upgrade Banner (Free tier only) */}
          {!isPremium && <UpgradeBannerInline />}

          {/* 2. Bias & Emotion */}
          <section className="mb-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <h2
                className="mb-8 tracking-tight"
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  lineHeight: '1.1',
                  fontFamily: 'var(--font-headline)',
                }}
              >
                Bias & Emotion
              </h2>

              {!isPremium && (
                <p className="mb-6 text-sm italic" style={{ color: 'var(--foreground-tertiary)' }}>
                  In Premium, you'll see bias by topic and platform.
                </p>
              )}

              <div className="grid md:grid-cols-2 gap-8 mb-6">
                {/* Political Lean */}
                <Card className="p-8" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '16px' }}>
                  <h3 className="flex items-center mb-6" style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
                    Political Distribution
                    <ChartTooltipIcon
                      freeMessage="Premium users can filter this chart by date and platform."
                      premiumMessage="Your data updates automatically when you adjust filters."
                    />
                  </h3>
                  <div className="space-y-6">
                    {politicalLean.map((item, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between items-baseline">
                          <span style={{ fontSize: '14px', color: 'var(--foreground-secondary)' }}>
                            {item.name}
                          </span>
                          <span style={{ fontSize: '16px', fontWeight: 700 }}>
                            {item.value}%
                          </span>
                        </div>
                        <div className="h-10 bg-gray-100 rounded-xl overflow-hidden">
                          <motion.div
                            className="h-full rounded-xl"
                            style={{ backgroundColor: item.color }}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${item.value}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: i * 0.15, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Content Tone */}
                <Card className="p-8" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '16px' }}>
                  <h3 className="flex items-center mb-2" style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
                    Content Tone
                    <ChartTooltipIcon
                      freeMessage="Premium users can filter this chart by date and platform."
                      premiumMessage="Your data updates automatically when you adjust filters."
                    />
                  </h3>
                  <p className="mb-6 text-sm" style={{ color: 'var(--foreground-tertiary)' }}>
                    Percentage of your feed by emotional tone
                  </p>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={contentTone} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis
                        type="number"
                        label={{ value: '% of Feed', position: 'insideBottom', offset: -5, style: { fontSize: '14px', fill: 'var(--foreground-secondary)' } }}
                      />
                      <YAxis dataKey="tone" type="category" width={90} style={{ fontSize: '14px' }} />
                      <RechartsTooltip
                        formatter={(value: number) => `${value}%`}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5' }}
                      />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                        {contentTone.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {showComparison && (
                <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                  <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                    Your feed balances analytical content but features more outrage than average.
                  </p>
                </div>
              )}

              {/* Positive/Negative Topics - Stacked Horizontal Bars */}
              <Card className="p-8 mb-6" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '16px' }}>
                <h3 className="mb-6" style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
                  How Topics Are Framed
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {topicSentiment.map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-2">
                        <span style={{ fontSize: '16px', lineHeight: '22px', fontWeight: 500, color: '#1A1A1A' }}>
                          {item.topic}
                        </span>
                      </div>
                      {/* Single stacked horizontal bar */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="h-10 rounded-lg overflow-hidden cursor-pointer flex"
                              style={{ background: '#F5F7FC' }}
                            >
                              {/* Positive portion (teal) */}
                              <motion.div
                                className="h-full flex items-center justify-center"
                                style={{
                                  background: '#3ED6B2',
                                  width: `${item.positive}%`,
                                }}
                                initial={{ width: 0 }}
                                whileInView={{ width: `${item.positive}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: i * 0.06, ease: 'easeOut' }}
                              >
                                {item.positive >= 5 && (
                                  <span style={{ fontSize: '14px', lineHeight: '18px', color: '#FFF', fontWeight: 600 }}>
                                    {item.positive}%
                                  </span>
                                )}
                              </motion.div>
                              {/* Neutral portion (gray) */}
                              <motion.div
                                className="h-full flex items-center justify-center"
                                style={{
                                  background: '#94a3b8',
                                  width: `${item.neutral}%`,
                                }}
                                initial={{ width: 0 }}
                                whileInView={{ width: `${item.neutral}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: i * 0.06 + 0.1, ease: 'easeOut' }}
                              >
                                {item.neutral >= 5 && (
                                  <span style={{ fontSize: '14px', lineHeight: '18px', color: '#FFF', fontWeight: 600 }}>
                                    {item.neutral}%
                                  </span>
                                )}
                              </motion.div>
                              {/* Negative portion (purple) */}
                              <motion.div
                                className="h-full flex items-center justify-center"
                                style={{
                                  background: '#7B61FF',
                                  width: `${item.negative}%`,
                                }}
                                initial={{ width: 0 }}
                                whileInView={{ width: `${item.negative}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: i * 0.06 + 0.2, ease: 'easeOut' }}
                              >
                                {item.negative >= 5 && (
                                  <span style={{ fontSize: '14px', lineHeight: '18px', color: '#FFF', fontWeight: 600 }}>
                                    {item.negative}%
                                  </span>
                                )}
                              </motion.div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">Positive: {item.positive}% | Neutral: {item.neutral}% | Negative: {item.negative}%</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ))}
                </div>
                {/* Legend - Enlarged */}
                <div className="mt-8 flex items-center justify-center gap-8">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ background: '#3ED6B2' }} />
                    <span style={{ fontSize: '16px', lineHeight: '22px', fontWeight: 600, color: '#1A1A1A' }}>Positive</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ background: '#94a3b8' }} />
                    <span style={{ fontSize: '16px', lineHeight: '22px', fontWeight: 600, color: '#1A1A1A' }}>Neutral</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ background: '#7B61FF' }} />
                    <span style={{ fontSize: '16px', lineHeight: '22px', fontWeight: 600, color: '#1A1A1A' }}>Negative</span>
                  </div>
                </div>
              </Card>

              <TakeawayBox text="38% of political content uses outrage-driven language. This reinforces beliefs and makes compromise feel impossible." />
            </motion.div>
          </section>

          {/* 3. Voices You Hear From */}
          <section className="mb-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <h2
                className="mb-8 tracking-tight"
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  lineHeight: '1.1',
                  fontFamily: 'var(--font-headline)',
                }}
              >
                Voices You Hear From
              </h2>

              <div className="grid md:grid-cols-2 gap-8 mb-6">
                {/* Creator Concentration */}
                <Card className="p-8" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '16px' }}>
                  <h3 className="mb-4" style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
                    Creator Concentration
                  </h3>
                  <p className="text-sm mb-6" style={{ color: 'var(--foreground-tertiary)' }}>
                    Shows how concentrated your feed is among a small number of creators
                  </p>
                  <div className="space-y-6">
                    {creatorConcentration.map((item, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between items-baseline">
                          <span style={{ fontSize: '14px', color: 'var(--foreground-secondary)' }}>
                            {item.name}
                          </span>
                          <span style={{ fontSize: '16px', fontWeight: 700 }}>
                            {item.value}%
                          </span>
                        </div>
                        <div className="h-10 bg-gray-100 rounded-xl overflow-hidden">
                          <motion.div
                            className="h-full rounded-xl"
                            style={{ backgroundColor: item.color }}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${item.value}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: i * 0.2, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Geographic Diversity */}
                <Card className="p-8" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '16px' }}>
                  <h3 className="mb-6" style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
                    Geographic Diversity
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <RechartPie>
                      <Pie
                        data={geographicData}
                        dataKey="value"
                        nameKey="region"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ name, value }) => `${name} ${value}%`}
                      >
                        {geographicData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </RechartPie>
                  </ResponsiveContainer>
                </Card>
              </div>

              <div className="mb-6 p-4 rounded-2xl bg-violet-50 border border-violet-200 text-center">
                <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                  The more balanced this distribution, the broader the perspectives you see.
                </p>
              </div>

              <TakeawayBox text="68% from just 10 creators means your worldview is shaped by a very small group. This affects understanding of culture, economics, and more." />
            </motion.div>
          </section>

          {/* Premium Gated: 7-Day Trends */}
          <section className="mb-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <h2
                className="mb-8 tracking-tight"
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  lineHeight: '1.1',
                  fontFamily: 'var(--font-headline)',
                }}
              >
                7-Day Trends & Deltas
              </h2>

              <FeatureGate
                minPlan="premium"
                currentPlan={currentPlan}
                featureName="7-Day Trends & Deltas"
                benefits={[
                  'Track how your feed composition changes over the past week',
                  'See which topics are trending up or down in your algorithm',
                  'Identify sudden shifts in content type or creator focus',
                  'Compare daily snapshots to spot patterns',
                ]}
                onUpgrade={onUpgrade}
                onLearnMore={() => onNavigate('about')}
              >
                <div className="space-y-6">
                  {/* Trend Lines Chart */}
                  <Card className="p-8" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '16px' }}>
                    <h3 className="mb-6" style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
                      Topic Volume Over Time
                    </h3>
                    <ResponsiveContainer width="100%" height={320}>
                      <ComposedChart data={sevenDayTrends} stackOffset="expand">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis dataKey="day" style={{ fontSize: '14px' }} />
                        <YAxis
                          label={{ value: '% of Feed', angle: -90, position: 'insideLeft', style: { fontSize: '14px' } }}
                          tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                        />
                        <RechartsTooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5' }}
                          formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="wellness" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.8} name="Wellness" />
                        <Area type="monotone" dataKey="politics" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.8} name="Politics" />
                        <Area type="monotone" dataKey="tech" stackId="1" stroke="#34D1BF" fill="#34D1BF" fillOpacity={0.8} name="Tech" />
                        <Area type="monotone" dataKey="entertainment" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.8} name="Entertainment" />
                        <Area type="monotone" dataKey="lifestyle" stackId="1" stroke="#ec4899" fill="#ec4899" fillOpacity={0.8} name="Lifestyle" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Week-over-Week Deltas */}
                  <Card className="p-8" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '16px' }}>
                    <h3 className="mb-6" style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
                      Week-over-Week Changes
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {topicDeltas.map((item, i) => (
                        <motion.div
                          key={i}
                          className="p-4 rounded-xl border"
                          style={{ borderColor: item.direction === 'up' ? '#34D1BF' : '#ef4444', background: item.direction === 'up' ? 'rgba(52, 209, 191, 0.05)' : 'rgba(239, 68, 68, 0.05)' }}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.05, duration: 0.3 }}
                        >
                          <div className="flex items-center justify-between">
                            <span style={{ fontSize: '16px', fontWeight: 600 }}>{item.topic}</span>
                            <div className="flex items-center gap-2">
                              {item.direction === 'up' ? (
                                <TrendingUp size={18} style={{ color: '#34D1BF' }} />
                              ) : (
                                <TrendingDown size={18} style={{ color: '#ef4444' }} />
                              )}
                              <span
                                style={{
                                  fontSize: '18px',
                                  fontWeight: 700,
                                  color: item.direction === 'up' ? '#34D1BF' : '#ef4444'
                                }}
                              >
                                {item.direction === 'up' ? '+' : ''}{item.change}%
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </Card>

                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center">
                    <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                      Sudden spikes or drops can reveal how algorithms react to your behavior—or external events.
                    </p>
                  </div>
                </div>
              </FeatureGate>
            </motion.div>
          </section>

          {/* Premium Gated: Per-Platform Insights */}
          <section className="mb-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <h2
                className="mb-8 tracking-tight"
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  lineHeight: '1.1',
                  fontFamily: 'var(--font-headline)',
                }}
              >
                Per-Platform Insights
              </h2>

              <FeatureGate
                minPlan="premium"
                currentPlan={currentPlan}
                featureName="Per-Platform Insights"
                benefits={[
                  'Break down your feed by platform (Instagram, TikTok, Twitter, YouTube)',
                  'See how each platform\'s algorithm differs',
                  'Discover which platform shows the most personalized content',
                  'Export platform-specific data',
                ]}
                onUpgrade={onUpgrade}
                onLearnMore={() => onNavigate('about')}
              >
                <div className="space-y-6">
                  {/* Stacked Bar Chart by Platform */}
                  <Card className="p-8" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '16px' }}>
                    <h3 className="mb-6" style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
                      Content Distribution by Platform
                    </h3>
                    <ResponsiveContainer width="100%" height={340}>
                      <BarChart data={platformComparison}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis dataKey="platform" style={{ fontSize: '14px' }} />
                        <YAxis label={{ value: '% of Content', angle: -90, position: 'insideLeft', style: { fontSize: '14px' } }} />
                        <RechartsTooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5' }}
                          formatter={(value: number) => `${value}%`}
                        />
                        <Legend />
                        <Bar dataKey="wellness" stackId="a" fill="#8b5cf6" name="Wellness" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="politics" stackId="a" fill="#ef4444" name="Politics" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="tech" stackId="a" fill="#34D1BF" name="Tech" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="entertainment" stackId="a" fill="#f59e0b" name="Entertainment" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="lifestyle" stackId="a" fill="#ec4899" name="Lifestyle" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Platform Comparison Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {platformComparison.map((platform, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1, duration: 0.4 }}
                      >
                        <Card className="p-6" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '16px' }}>
                          <h4 className="mb-4" style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
                            {platform.platform}
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>Wellness</span>
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>{platform.wellness}%</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div style={{ width: `${platform.wellness}%`, height: '100%', background: '#8b5cf6', borderRadius: '9999px' }} />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>Politics</span>
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>{platform.politics}%</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div style={{ width: `${platform.politics}%`, height: '100%', background: '#ef4444', borderRadius: '9999px' }} />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>Tech</span>
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>{platform.tech}%</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div style={{ width: `${platform.tech}%`, height: '100%', background: '#34D1BF', borderRadius: '9999px' }} />
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-center">
                    <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                      Each platform's algorithm optimizes differently—Twitter prioritizes engagement, Instagram emphasizes visuals, TikTok focuses on watch time.
                    </p>
                  </div>
                </div>
              </FeatureGate>
            </motion.div>
          </section>

          {/* Premium Gated: Topic Sentiment & Brand Tracking */}
          <section className="mb-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <h2
                className="mb-8 tracking-tight"
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  lineHeight: '1.1',
                  fontFamily: 'var(--font-headline)',
                }}
              >
                Topic Sentiment & Brand Tracking
              </h2>

              <FeatureGate
                minPlan="premium"
                currentPlan={currentPlan}
                featureName="Topic Sentiment & Brand Tracking"
                benefits={[
                  'Analyze the emotional tone of each topic in your feed',
                  'Track which brands and products appear most frequently',
                  'See how commercial content is woven into your experience',
                  'Get weekly email digests with your commercial profile',
                  'Priority support for questions',
                ]}
                onUpgrade={onUpgrade}
                onLearnMore={() => onNavigate('about')}
              >
                <div className="space-y-6">
                  {/* Topic Sentiment Breakdown */}
                  <Card className="p-8" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '16px' }}>
                    <h3 className="mb-6" style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
                      Sentiment by Topic
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={topicSentimentData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis type="category" dataKey="topic" style={{ fontSize: '14px' }} />
                        <YAxis type="number" label={{ value: '% of Content', angle: -90, position: 'insideLeft', style: { fontSize: '14px' } }} />
                        <RechartsTooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5' }}
                          formatter={(value: number) => `${value}%`}
                        />
                        <Legend />
                        <Bar dataKey="positive" stackId="a" fill="#34D1BF" name="Positive" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="neutral" stackId="a" fill="#94a3b8" name="Neutral" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="negative" stackId="a" fill="#ef4444" name="Negative" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="text-sm mt-4 text-center" style={{ color: 'var(--foreground-tertiary)' }}>
                      Negative sentiment in Politics is 60%—algorithms may be prioritizing divisive content for engagement
                    </p>
                  </Card>

                  {/* Brand Tracking */}
                  <Card className="p-8" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '16px' }}>
                    <h3 className="mb-6" style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
                      Brand Exposure Tracker
                    </h3>
                    <div className="space-y-4">
                      {topBrands.map((brand, i) => (
                        <motion.div
                          key={i}
                          className="border rounded-xl p-4"
                          style={{ borderColor: '#e5e5e5' }}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.05, duration: 0.3 }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 style={{ fontSize: '16px', fontWeight: 600 }}>{brand.name}</h4>
                              <p style={{ fontSize: '12px', color: 'var(--foreground-muted)' }}>{brand.category}</p>
                            </div>
                            <div className="text-right">
                              <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-teal)' }}>
                                {brand.mentions}
                              </p>
                              <p style={{ fontSize: '12px', color: 'var(--foreground-muted)' }}>mentions</p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span style={{ fontSize: '12px', color: 'var(--foreground-secondary)' }}>Sentiment Score</span>
                              <span style={{ fontSize: '12px', fontWeight: 600 }}>{brand.sentiment}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                style={{
                                  height: '100%',
                                  background: brand.sentiment >= 80 ? '#34D1BF' : brand.sentiment >= 60 ? '#f59e0b' : '#ef4444',
                                  borderRadius: '9999px'
                                }}
                                initial={{ width: 0 }}
                                whileInView={{ width: `${brand.sentiment}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: i * 0.05 }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </Card>

                  <div className="p-4 rounded-2xl bg-violet-50 border border-violet-200 text-center">
                    <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                      142 Nike mentions in 7 days means athletic brands dominate your feed—this shapes your purchasing decisions subconsciously.
                    </p>
                  </div>
                </div>
              </FeatureGate>
            </motion.div>
          </section>

          {/* 4. What You're Being Sold (Always visible) */}
          <section className="mb-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <h2
                className="mb-8 tracking-tight"
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  lineHeight: '1.1',
                  fontFamily: 'var(--font-headline)',
                }}
              >
                What You're Being Sold
              </h2>

              {/* Product Categories */}
              <Card className="p-8 mb-8 relative" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '16px' }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="flex items-center" style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
                    Top Product Categories
                    <ChartTooltipIcon
                      freeMessage="Premium users can filter this chart by date and platform."
                      premiumMessage="Ad frequency +12% since last week"
                    />
                  </h3>
                  {isPremium && <PremiumBadge />}
                </div>
                {!isPremium && (
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-white/90 to-transparent rounded-b-2xl flex items-end justify-center pb-8 z-10">
                    <div className="text-center">
                      <Lock size={20} style={{ color: '#94a3b8', margin: '0 auto 8px' }} />
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground-secondary)' }}>
                        Unlock full ad analysis and targeting data
                      </p>
                    </div>
                  </div>
                )}
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={productCategories} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis type="number" />
                    <YAxis dataKey="category" type="category" width={140} style={{ fontSize: '14px' }} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#34D1BF" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Top Brands */}
              <Card className="p-8 mb-8" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '16px' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="flex items-center" style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
                    Top Brands
                    <ChartTooltipIcon
                      freeMessage="Premium users can filter this by date and platform."
                      premiumMessage="Your data updates automatically when you adjust filters."
                    />
                  </h3>
                  {isPremium && <PremiumBadge />}
                </div>
                <p className="text-sm mb-6" style={{ color: 'var(--foreground-tertiary)' }}>
                  Most frequently appearing brands in your feed over the past 7 days
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {topBrands.slice(0, 8).map((brand, i) => (
                    <motion.div
                      key={i}
                      className="p-4 rounded-xl border text-center"
                      style={{ borderColor: '#e5e5e5', background: 'linear-gradient(135deg, rgba(52, 209, 191, 0.03) 0%, rgba(139, 110, 248, 0.03) 100%)' }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                    >
                      <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{brand.name}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--foreground-muted)', marginBottom: '8px' }}>{brand.category}</p>
                      <div className="pt-2 border-t" style={{ borderColor: '#e5e5e5' }}>
                        <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand-teal)' }}>{brand.mentions}</p>
                        <p style={{ fontSize: '11px', color: 'var(--foreground-muted)' }}>appearances</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>

              {/* Top Products */}
              <Card className="p-8 mb-6 relative" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', borderRadius: '16px' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="flex items-center" style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-headline)' }}>
                    Top Products
                    <ChartTooltipIcon
                      freeMessage="Premium users can track product exposure over time."
                      premiumMessage="Your data updates automatically when you adjust filters."
                    />
                  </h3>
                  {isPremium && <PremiumBadge />}
                </div>
                {!isPremium && <LockedOverlay message="Unlock complete product exposure tracking" />}
                <p className="text-sm mb-6" style={{ color: 'var(--foreground-tertiary)' }}>
                  Total number of times each product has been promoted in your feed
                </p>
                <div className="space-y-4">
                  {topProducts.map((product, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{product.name}</span>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand-teal)' }}>
                          {product.count} times
                        </span>
                      </div>
                      <div className="h-6 bg-gray-100 rounded-xl overflow-hidden">
                        <motion.div
                          className="h-full rounded-xl"
                          style={{
                            background: 'linear-gradient(90deg, #34D1BF 0%, #8B6EF8 100%)',
                          }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${(product.count / 284) * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: i * 0.05, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="mb-6 p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center">
                <p className="text-sm" style={{ color: 'var(--foreground-tertiary)' }}>
                  Commercial transparency helps reveal how algorithms monetize your attention.
                </p>
              </div>

              <TakeawayBox text="32% of promoted content is wellness-related. Every interaction reinforces this commercial identity, making you valuable to wellness advertisers." />
            </motion.div>
          </section>

          {/* Upgrade Banner (Free tier only) */}
          {!isPremium && <UpgradeBannerInline />}

          {/* Footer Message */}
          {!isPremium && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <p style={{ fontSize: '16px', color: 'var(--foreground-secondary)', marginBottom: '12px' }}>
                Upgrade anytime for $9.99/month to unlock all insights.
              </p>
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowRight
                  size={20}
                  style={{
                    color: '#7D66E6',
                    transform: 'rotate(-90deg)',
                    margin: '0 auto',
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
