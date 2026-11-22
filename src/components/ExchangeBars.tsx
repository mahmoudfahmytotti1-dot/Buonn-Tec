import React, { useEffect, useRef, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calculator,
  ChevronDown,
  ChevronUp,
  Globe,
  BarChart3,
} from 'lucide-react';
import { CurrencyCode, LocalTickerItem, UserRole } from '../types';
import { formatEgp, formatMoney } from '../utils/formatters';

interface ExchangeBarsProps {
  localTicker: LocalTickerItem[];
  activeRole: UserRole;
  currency: CurrencyCode;
}

interface FallbackQuote {
  symbol: string;
  label: string;
  price: string;
  unit: string;
  changePct: number;
  points: number[];
}

const FALLBACK_QUOTES: FallbackQuote[] = [
  {
    symbol: 'ICEUS:KC1!',
    label: 'أرابيكا نيويورك (KC1!)',
    price: '296.40',
    unit: 'سنت/رطل',
    changePct: 1.85,
    points: [284, 286, 285, 289, 292, 290, 294, 296.4],
  },
  {
    symbol: 'ICEEUR:RC1!',
    label: 'روبوستا لندن (RC1!)',
    price: '4,890',
    unit: 'دولار/طن',
    changePct: -0.62,
    points: [4940, 4930, 4915, 4925, 4905, 4895, 4900, 4890],
  },
  {
    symbol: 'FX_IDC:USDEGP',
    label: 'الدولار / الجنيه (USD/EGP)',
    price: '49.65',
    unit: 'ج.م',
    changePct: 0.18,
    points: [49.4, 49.45, 49.5, 49.48, 49.55, 49.6, 49.62, 49.65],
  },
  {
    symbol: 'FX_IDC:EURUSD',
    label: 'اليورو / الدولار (EUR/USD)',
    price: '1.064',
    unit: '$',
    changePct: -0.14,
    points: [1.072, 1.07, 1.068, 1.069, 1.066, 1.065, 1.063, 1.064],
  },
];

interface InternationalOriginPreset {
  id: string;
  region: 'أمريكا اللاتينية والكاريبي' | 'إفريقيا والجزيرة العربية' | 'آسيا والمحيط الهادئ';
  label: string;
  species: 'أرابيكا' | 'روبوستا';
  exchangeRef: string;
  exchangeCents: number;
  originDiff: number;
  freightPerKg: number;
}

const INTERNATIONAL_ORIGIN_PRESETS: InternationalOriginPreset[] = [
  // أمريكا اللاتينية والكاريبي
  {
    id: 'br-santos',
    region: 'أمريكا اللاتينية والكاريبي',
    label: 'البرازيل — سانتوس NY2 (17/18)',
    species: 'أرابيكا',
    exchangeRef: 'نيويورك أرابيكا (ICEUS:KC1!)',
    exchangeCents: 296.4,
    originDiff: -12,
    freightPerKg: 52,
  },
  {
    id: 'br-cerrado',
    region: 'أمريكا اللاتينية والكاريبي',
    label: 'البرازيل — سيرادو / موجيانا (Natural)',
    species: 'أرابيكا',
    exchangeRef: 'نيويورك أرابيكا (ICEUS:KC1!)',
    exchangeCents: 296.4,
    originDiff: -5,
    freightPerKg: 52,
  },
  {
    id: 'br-conilon',
    region: 'أمريكا اللاتينية والكاريبي',
    label: 'البرازيل — كونيلون (روبوستا)',
    species: 'روبوستا',
    exchangeRef: 'لندن روبوستا (ICEEUR:RC1!)',
    exchangeCents: 221.8,
    originDiff: -6,
    freightPerKg: 48,
  },
  {
    id: 'co-supremo',
    region: 'أمريكا اللاتينية والكاريبي',
    label: 'كولومبيا — سوبريمو هويلّا (Washed)',
    species: 'أرابيكا',
    exchangeRef: 'نيويورك أرابيكا (ICEUS:KC1!)',
    exchangeCents: 296.4,
    originDiff: 38,
    freightPerKg: 60,
  },
  {
    id: 'co-excelso',
    region: 'أمريكا اللاتينية والكاريبي',
    label: 'كولومبيا — إكسيلسو EP',
    species: 'أرابيكا',
    exchangeRef: 'نيويورك أرابيكا (ICEUS:KC1!)',
    exchangeCents: 296.4,
    originDiff: 26,
    freightPerKg: 58,
  },
  {
    id: 'gt-antigua',
    region: 'أمريكا اللاتينية والكاريبي',
    label: 'غواتيمالا — أنتيغوا بركاني SHB EP',
    species: 'أرابيكا',
    exchangeRef: 'نيويورك أرابيكا (ICEUS:KC1!)',
    exchangeCents: 296.4,
    originDiff: 45,
    freightPerKg: 64,
  },
  {
    id: 'hn-marcala',
    region: 'أمريكا اللاتينية والكاريبي',
    label: 'هندوراس — ماركالا HG / SHG',
    species: 'أرابيكا',
    exchangeRef: 'نيويورك أرابيكا (ICEUS:KC1!)',
    exchangeCents: 296.4,
    originDiff: 12,
    freightPerKg: 56,
  },
  {
    id: 'cr-tarrazu',
    region: 'أمريكا اللاتينية والكاريبي',
    label: 'كوستاريكا — تارازو SHB',
    species: 'أرابيكا',
    exchangeRef: 'نيويورك أرابيكا (ICEUS:KC1!)',
    exchangeCents: 296.4,
    originDiff: 52,
    freightPerKg: 65,
  },
  {
    id: 'sv-shg',
    region: 'أمريكا اللاتينية والكاريبي',
    label: 'السلفادور — باكامارا / SHG',
    species: 'أرابيكا',
    exchangeRef: 'نيويورك أرابيكا (ICEUS:KC1!)',
    exchangeCents: 296.4,
    originDiff: 30,
    freightPerKg: 60,
  },
  {
    id: 'ni-jinotega',
    region: 'أمريكا اللاتينية والكاريبي',
    label: 'نيكاراغوا — جينوتيغا / ماتاغالبا SHG',
    species: 'أرابيكا',
    exchangeRef: 'نيويورك أرابيكا (ICEUS:KC1!)',
    exchangeCents: 296.4,
    originDiff: 18,
    freightPerKg: 58,
  },
  {
    id: 'mx-chiapas',
    region: 'أمريكا اللاتينية والكاريبي',
    label: 'المكسيك — تشياباس / أواكساكا HG',
    species: 'أرابيكا',
    exchangeRef: 'نيويورك أرابيكا (ICEUS:KC1!)',
    exchangeCents: 296.4,
    originDiff: 15,
    freightPerKg: 57,
  },
  {
    id: 'pe-cusco',
    region: 'أمريكا اللاتينية والكاريبي',
    label: 'بيرو — كوسكو / تشانتشامايو جريد 1',
    species: 'أرابيكا',
    exchangeRef: 'نيويورك أرابيكا (ICEUS:KC1!)',
    exchangeCents: 296.4,
    originDiff: 14,
    freightPerKg: 58,
  },
  {
    id: 'pa-boquete',
    region: 'أمريكا اللاتينية والكاريبي',
    label: 'بنما — بوكيتي مختص (Boquete)',
    species: 'أرابيكا',
    exchangeRef: 'نيويورك أرابيكا (ICEUS:KC1!)',
    exchangeCents: 296.4,
    originDiff: 95,
    freightPerKg: 72,
  },
  {
    id: 'jm-bluemtn',
    region: 'أمريكا اللاتينية والكاريبي',
    label: 'جامايكا — بلو ماونتن (Blue Mountain)',
    species: 'أرابيكا',
    exchangeRef: 'نيويورك أرابيكا (ICEUS:KC1!)',
    exchangeCents: 296.4,
    originDiff: 320,
    freightPerKg: 95,
  },
  // إفريقيا والجزيرة العربية
  {
    id: 'et-harrar',
    region: 'إفريقيا والجزيرة العربية',
    label: 'إثيوبيا — هراري / ليكمبتي جريد 4',
    species: 'أرابيكا',
    exchangeRef: 'نيويورك أرابيكا (ICEUS:KC1!)',
    exchangeCents: 296.4,
    originDiff: 28,
    freightPerKg: 55,
  },
  {
    id: 'et-yirga',
    region: 'إفريقيا والجزيرة العربية',
    label: 'إثيوبيا — يرجاتشيف / سيدامو جريد 2',
    species: 'أرابيكا',
    exchangeRef: 'نيويورك أرابيكا (ICEUS:KC1!)',
    exchangeCents: 296.4,
    originDiff: 58,
    freightPerKg: 60,
  },
  {
    id: 'ye-haraz',
    region: 'إفريقيا والجزيرة العربية',
    label: 'اليمن — حراز / مخا إسماعيلي تقليدي',
    species: 'أرابيكا',
    exchangeRef: 'نيويورك أرابيكا (ICEUS:KC1!)',
    exchangeCents: 296.4,
    originDiff: 240,
    freightPerKg: 75,
  },
  {
    id: 'ke-aa',
    region: 'إفريقيا والجزيرة العربية',
    label: 'كينيا — AA مغسول فاخر',
    species: 'أرابيكا',
    exchangeRef: 'نيويورك أرابيكا (ICEUS:KC1!)',
    exchangeCents: 296.4,
    originDiff: 85,
    freightPerKg: 62,
  },
  {
    id: 'ug-robusta',
    region: 'إفريقيا والجزيرة العربية',
    label: 'أوغندا — روبوستا سكرين 18 / بوغيسو',
    species: 'روبوستا',
    exchangeRef: 'لندن روبوستا (ICEEUR:RC1!)',
    exchangeCents: 221.8,
    originDiff: 4,
    freightPerKg: 46,
  },
  {
    id: 'tz-kilimanjaro',
    region: 'إفريقيا والجزيرة العربية',
    label: 'تنزانيا — كليمنجارو AA',
    species: 'أرابيكا',
    exchangeRef: 'نيويورك أرابيكا (ICEUS:KC1!)',
    exchangeCents: 296.4,
    originDiff: 35,
    freightPerKg: 58,
  },
  {
    id: 'rw-bourbon',
    region: 'إفريقيا والجزيرة العربية',
    label: 'رواندا — بوربون مغسول جريد A',
    species: 'أرابيكا',
    exchangeRef: 'نيويورك أرابيكا (ICEUS:KC1!)',
    exchangeCents: 296.4,
    originDiff: 42,
    freightPerKg: 60,
  },
  {
    id: 'bi-kayanza',
    region: 'إفريقيا والجزيرة العربية',
    label: 'بوروندي — كايانزا مغسول',
    species: 'أرابيكا',
    exchangeRef: 'نيويورك أرابيكا (ICEUS:KC1!)',
    exchangeCents: 296.4,
    originDiff: 36,
    freightPerKg: 60,
  },
  {
    id: 'ci-robusta',
    region: 'إفريقيا والجزيرة العربية',
    label: 'ساحل العاج / الكاميرون — روبوستا جريد 1',
    species: 'روبوستا',
    exchangeRef: 'لندن روبوستا (ICEEUR:RC1!)',
    exchangeCents: 221.8,
    originDiff: -2,
    freightPerKg: 45,
  },
  // آسيا والمحيط الهادئ
  {
    id: 'vn-g1',
    region: 'آسيا والمحيط الهادئ',
    label: 'فيتنام — روبوستا G1 سكرين 18',
    species: 'روبوستا',
    exchangeRef: 'لندن روبوستا (ICEEUR:RC1!)',
    exchangeCents: 221.8,
    originDiff: 6,
    freightPerKg: 44,
  },
  {
    id: 'id-ek1',
    region: 'آسيا والمحيط الهادئ',
    label: 'إندونيسيا — لامبونج روبوستا EK1',
    species: 'روبوستا',
    exchangeRef: 'لندن روبوستا (ICEEUR:RC1!)',
    exchangeCents: 221.8,
    originDiff: 12,
    freightPerKg: 45,
  },
  {
    id: 'id-mandheling',
    region: 'آسيا والمحيط الهادئ',
    label: 'إندونيسيا — سومطرة ماندهلينج G1',
    species: 'أرابيكا',
    exchangeRef: 'نيويورك أرابيكا (ICEUS:KC1!)',
    exchangeCents: 296.4,
    originDiff: 48,
    freightPerKg: 58,
  },
  {
    id: 'in-cherry-aa',
    region: 'آسيا والمحيط الهادئ',
    label: 'الهند — تشيري روبوستا AA',
    species: 'روبوستا',
    exchangeRef: 'لندن روبوستا (ICEEUR:RC1!)',
    exchangeCents: 221.8,
    originDiff: 18,
    freightPerKg: 46,
  },
  {
    id: 'in-malabar',
    region: 'آسيا والمحيط الهادئ',
    label: 'الهند — بلانتيشن A / مونسوند مالابار',
    species: 'أرابيكا',
    exchangeRef: 'نيويورك أرابيكا (ICEUS:KC1!)',
    exchangeCents: 296.4,
    originDiff: 34,
    freightPerKg: 52,
  },
  {
    id: 'pg-sigri',
    region: 'آسيا والمحيط الهادئ',
    label: 'بابوا غينيا الجديدة — سيغري A/X',
    species: 'أرابيكا',
    exchangeRef: 'نيويورك أرابيكا (ICEUS:KC1!)',
    exchangeCents: 296.4,
    originDiff: 40,
    freightPerKg: 62,
  },
  {
    id: 'cn-yunnan',
    region: 'آسيا والمحيط الهادئ',
    label: 'الصين — يونّان أرابيكا كاتيمور',
    species: 'أرابيكا',
    exchangeRef: 'نيويورك أرابيكا (ICEUS:KC1!)',
    exchangeCents: 296.4,
    originDiff: 10,
    freightPerKg: 54,
  },
];

const ORIGIN_REGIONS: InternationalOriginPreset['region'][] = [
  'أمريكا اللاتينية والكاريبي',
  'إفريقيا والجزيرة العربية',
  'آسيا والمحيط الهادئ',
];

const TradingViewTickerWidget: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';
    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: 'ICEUS:KC1!', title: 'أرابيكا نيويورك' },
        { proName: 'ICEEUR:RC1!', title: 'روبوستا لندن' },
        { proName: 'FX_IDC:USDEGP', title: 'USD/EGP' },
        { proName: 'FX_IDC:EURUSD', title: 'EUR/USD' },
      ],
      showSymbolLogo: false,
      isTransparent: true,
      displayMode: 'compact',
      colorTheme: 'dark',
      locale: 'ar_AE',
    });

    script.onload = () => {
      setTimeout(() => {
        if (container.querySelector('iframe')) {
          setLoaded(true);
        }
      }, 1200);
    };
    script.onerror = () => setLoaded(false);

    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, []);

  return (
    <div className="bg-[#180E09] text-[#FBF9F6] border-b border-[#C89B3C]/30">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className={loaded ? 'block' : 'hidden'}>
          <div ref={containerRef} className="tradingview-widget-container min-h-[44px]" />
        </div>

        {!loaded && (
          <div className="py-2.5 flex flex-wrap items-center justify-between gap-x-8 gap-y-2 text-xs">
            <div className="flex items-center gap-2 text-[#C89B3C] font-bold tracking-tight">
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span>مؤشرات البورصة العالمية والعملات</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
              {FALLBACK_QUOTES.map((q) => {
                const isUp = q.changePct >= 0;
                return (
                  <div key={q.symbol} className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-[#FBF9F6]/75">{q.label}:</span>
                    <span className="font-mono tabular-nums font-semibold text-white">
                      {q.price} {q.unit}
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 font-mono tabular-nums font-medium ${
                        isUp ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isUp ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {isUp ? '+' : ''}
                      {q.changePct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TradingViewSymbolChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<FallbackQuote>(FALLBACK_QUOTES[0]);

  useEffect(() => {
    const container = chartRef.current;
    if (!container) return;

    container.innerHTML = '';
    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        ['أرابيكا نيويورك', 'ICEUS:KC1!|1M'],
        ['روبوستا لندن', 'ICEEUR:RC1!|1M'],
        ['USD/EGP', 'FX_IDC:USDEGP|1M'],
        ['EUR/USD', 'FX_IDC:EURUSD|1M'],
      ],
      chartOnly: false,
      width: '100%',
      height: 290,
      locale: 'ar_AE',
      colorTheme: 'light',
      autosize: false,
      showVolume: false,
      showMA: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
      scalePosition: 'right',
      scaleMode: 'Normal',
      fontFamily: 'Cairo, sans-serif',
      fontSize: '11',
      noTimeScale: false,
      valuesTracking: '1',
      changeMode: 'price-and-percent',
      chartType: 'area',
      lineColor: '#C89B3C',
      topColor: 'rgba(200, 155, 60, 0.22)',
      bottomColor: 'rgba(200, 155, 60, 0.01)',
      lineWidth: 2,
    });

    script.onload = () => {
      setTimeout(() => {
        if (container.querySelector('iframe')) {
          setChartLoaded(true);
        }
      }, 1400);
    };
    script.onerror = () => setChartLoaded(false);

    container.appendChild(script);
    return () => {
      container.innerHTML = '';
    };
  }, []);

  const minVal = Math.min(...selectedQuote.points);
  const maxVal = Math.max(...selectedQuote.points);
  const range = maxVal - minVal || 1;
  const width = 460;
  const height = 140;
  const coords = selectedQuote.points.map((pt, idx) => {
    const x = (idx / (selectedQuote.points.length - 1)) * width;
    const y = height - ((pt - minVal) / range) * (height - 24) - 12;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const polylinePoints = coords.join(' ');
  const areaPath = `M 0,${height} L ${coords.join(' L ')} L ${width},${height} Z`;

  return (
    <div className="bg-white border border-[#2A1A11]/12 rounded-xl p-5 flex flex-col justify-between h-full">
      <div className={chartLoaded ? 'block' : 'hidden'}>
        <div ref={chartRef} className="tradingview-widget-container w-full min-h-[290px]" />
      </div>

      {!chartLoaded && (
        <div className="flex flex-col h-full justify-between gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A1A11]/10 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#C89B3C]" />
              <h3 className="text-sm font-bold text-[#2A1A11]">الشارت الفوري للبورصة العالمية</h3>
            </div>
            <div className="flex items-center gap-1 bg-[#FBF9F6] p-1 rounded-lg border border-[#2A1A11]/10">
              {FALLBACK_QUOTES.map((q) => (
                <button
                  key={q.symbol}
                  type="button"
                  onClick={() => setSelectedQuote(q)}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    selectedQuote.symbol === q.symbol
                      ? 'bg-[#2A1A11] text-white'
                      : 'text-[#4E342E] hover:text-[#2A1A11]'
                  }`}
                >
                  {q.symbol.split(':')[1]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="text-xs text-[#4E342E]/75">{selectedQuote.label}</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#2A1A11] mt-0.5">
                {selectedQuote.price}{' '}
                <span className="text-xs font-sans font-normal text-[#4E342E]">
                  {selectedQuote.unit}
                </span>
              </p>
            </div>
            <div
              className={`inline-flex items-center gap-1 text-xs font-mono tabular-nums font-semibold px-2.5 py-1 rounded-md ${
                selectedQuote.changePct >= 0
                  ? 'bg-[#1E7E34]/10 text-[#1E7E34]'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {selectedQuote.changePct >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>
                {selectedQuote.changePct >= 0 ? '+' : ''}
                {selectedQuote.changePct}% (آخر 30 يوم)
              </span>
            </div>
          </div>

          <div className="w-full overflow-hidden rounded-lg bg-[#FBF9F6] border border-[#2A1A11]/8 p-3">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 overflow-visible">
              <defs>
                <linearGradient id="bunntechChartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C89B3C" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#C89B3C" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#bunntechChartGrad)" />
              <polyline
                fill="none"
                stroke="#C89B3C"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePoints}
              />
            </svg>
            <div className="flex items-center justify-between text-[11px] text-[#4E342E]/60 mt-1 font-mono">
              <span>-30D</span>
              <span>-15D</span>
              <span>اليوم</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ExchangeBars: React.FC<ExchangeBarsProps> = ({
  localTicker,
  activeRole,
  currency,
}) => {
  const [showToolsPanel, setShowToolsPanel] = useState(
    activeRole === 'b2b_marketplace' || activeRole === 'importer_portal'
  );

  useEffect(() => {
    if (activeRole === 'b2c_store' || activeRole === 'super_admin') {
      setShowToolsPanel(false);
    } else {
      setShowToolsPanel(true);
    }
  }, [activeRole]);

  // Landed cost calculator inputs
  const [selectedOriginId, setSelectedOriginId] = useState<string>('br-santos');
  const [exchangeCents, setExchangeCents] = useState<number>(296.4);
  const [originDiff, setOriginDiff] = useState<number>(-12);
  const [usdRate, setUsdRate] = useState<number>(49.65);
  const [freightPerKg, setFreightPerKg] = useState<number>(52);

  const selectedOriginPreset = INTERNATIONAL_ORIGIN_PRESETS.find(
    (o) => o.id === selectedOriginId
  );

  const handleSelectOrigin = (originId: string) => {
    setSelectedOriginId(originId);
    const preset = INTERNATIONAL_ORIGIN_PRESETS.find((o) => o.id === originId);
    if (preset) {
      setExchangeCents(preset.exchangeCents);
      setOriginDiff(preset.originDiff);
      setFreightPerKg(preset.freightPerKg);
    }
  };

  // Exact required formula: (((cents + diff) / 100) * 2.20462 * usdRate) + freight
  const estimatedCostPerKg =
    ((exchangeCents + originDiff) / 100) * 2.20462 * usdRate + freightPerKg;
  const estimatedCostPerTon = estimatedCostPerKg * 1000;

  return (
    <section aria-label="شريط الأسعار والبورصة العالمية">
      {/* 1. Global Commodity Ticker Tape */}
      <TradingViewTickerWidget />

      {/* 2. Spot Benchmark Market Price Ticker (Admin-Editable, Multi-Currency) */}
      <div className="bg-[#F3EDE4]/70 border-b border-[#2A1A11]/10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-xs font-bold text-[#2A1A11] whitespace-nowrap">
              مؤشر الأسعار الاسترشادي العالمي ({currency}):
            </span>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
              {localTicker.map((item) => {
                const isUp = item.changePct >= 0;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-1.5 text-xs whitespace-nowrap"
                  >
                    <span className="font-semibold text-[#2A1A11]">{item.name}</span>
                    <span className="text-[#4E342E]/70">({item.grade})</span>
                    <span className="font-mono tabular-nums font-bold text-[#2A1A11]">
                      {formatMoney(item.pricePerKgEgp, currency)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 font-mono tabular-nums font-semibold ${
                        isUp ? 'text-[#1E7E34]' : 'text-rose-700'
                      }`}
                    >
                      {isUp ? '▲' : '▼'} {Math.abs(item.changePct)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowToolsPanel((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4E342E] hover:text-[#2A1A11] px-2.5 py-1 rounded-md hover:bg-white/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-[#C89B3C]" />
            <span>{showToolsPanel ? 'إخفاء الشارت والحاسبة' : 'إظهار الشارت والحاسبة'}</span>
            {showToolsPanel ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* 3. Expandable Global Chart + Interactive Landed Cost Calculator */}
      {showToolsPanel && (
        <div className="bg-[#FBF9F6] border-b border-[#2A1A11]/10">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Global Chart */}
            <div className="lg:col-span-6">
              <TradingViewSymbolChart />
            </div>

            {/* Interactive Landed Cost Calculator */}
            <div className="lg:col-span-6 bg-white border border-[#2A1A11]/12 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="border-b border-[#2A1A11]/10 pb-3 mb-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-[#C89B3C]" />
                    <h3 className="text-sm font-bold text-[#2A1A11]">
                      حاسبة تسعير الكيلو (من البورصة العالمية إلى أرض الميناء / المخزن)
                    </h3>
                  </div>

                  {/* International Coffee Origins Dropdown */}
                  <label className="block">
                    <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                      اختر منشأ البن الدولي ({INTERNATIONAL_ORIGIN_PRESETS.length} منشأ ودرجة عالمية)
                    </span>
                    <select
                      value={selectedOriginId}
                      onChange={(e) => handleSelectOrigin(e.target.value)}
                      aria-label="اختيار منشأ البن الدولي"
                      className="w-full px-3 py-2 text-xs sm:text-sm font-semibold bg-[#FBF9F6] border border-[#2A1A11]/20 rounded-lg focus:outline-none focus:border-[#C89B3C] text-[#2A1A11]"
                    >
                      {ORIGIN_REGIONS.map((region) => (
                        <optgroup key={region} label={region}>
                          {INTERNATIONAL_ORIGIN_PRESETS.filter((o) => o.region === region).map(
                            (origin) => (
                              <option key={origin.id} value={origin.id}>
                                {origin.label} — ({origin.species})
                              </option>
                            )
                          )}
                        </optgroup>
                      ))}
                      <option value="custom">مخصص (إدخال يدوي للأسعار والفارق)</option>
                    </select>
                    {selectedOriginPreset && (
                      <span className="block text-[11px] text-[#4E342E]/80 mt-1">
                        المرجع القياسي: {selectedOriginPreset.exchangeRef} · الفصيلة:{' '}
                        <strong>{selectedOriginPreset.species}</strong>
                      </span>
                    )}
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block text-xs font-medium text-[#4E342E] mb-1">
                      سعر البورصة (سنت / رطل - cents/lb)
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      value={exchangeCents}
                      onChange={(e) => {
                        setExchangeCents(Number(e.target.value) || 0);
                        setSelectedOriginId('custom');
                      }}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-xs font-medium text-[#4E342E] mb-1">
                      فارق المنشأ / الديفرنشيال (+/- cents/lb)
                    </span>
                    <input
                      type="number"
                      step="1"
                      value={originDiff}
                      onChange={(e) => {
                        setOriginDiff(Number(e.target.value) || 0);
                        setSelectedOriginId('custom');
                      }}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-xs font-medium text-[#4E342E] mb-1">
                      سعر صرف الدولار الأساسي (ج.م / $)
                    </span>
                    <input
                      type="number"
                      step="0.05"
                      value={usdRate}
                      onChange={(e) => setUsdRate(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-xs font-medium text-[#4E342E] mb-1">
                      الشحن الدولي والتخليص (ج.م / كجم)
                    </span>
                    <input
                      type="number"
                      step="1"
                      value={freightPerKg}
                      onChange={(e) => {
                        setFreightPerKg(Number(e.target.value) || 0);
                        setSelectedOriginId('custom');
                      }}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                    />
                  </label>
                </div>
              </div>

              {/* Executive Result Strip */}
              <div className="mt-5 rounded-xl bg-[#1C110B] text-[#FBF9F6] p-4 border border-[#C89B3C]/25 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="block text-[11px] text-[#FBF9F6]/70">
                    التكلفة التقديرية للكيلو ({currency})
                  </span>
                  <span className="text-2xl font-black font-mono tabular-nums text-[#C89B3C]">
                    {formatMoney(Math.max(0, estimatedCostPerKg), currency, true)}
                  </span>
                  {currency !== 'EGP' && (
                    <span className="block text-[11px] font-mono text-[#FBF9F6]/65 mt-0.5">
                      يعادل {formatEgp(Math.max(0, estimatedCostPerKg), true)}
                    </span>
                  )}
                </div>
                <div className="text-left">
                  <span className="block text-[11px] text-[#FBF9F6]/70">
                    التكلفة التقديرية للطن المتري ({currency})
                  </span>
                  <span className="text-lg font-bold font-mono tabular-nums text-white">
                    {formatMoney(Math.max(0, estimatedCostPerTon), currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
