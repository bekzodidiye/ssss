
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Role, AppState, User, CheckIn, SimSale, DailyReport } from '../types';
import { 
  Users, TrendingUp, Search, MapPin, Activity, 
  Phone, X, Clock, 
  ChevronRight, Smartphone, ExternalLink,
  ChevronDown,
  CheckCircle, FileText, UserPlus, Award, BarChart2,
  ArrowLeft, CalendarDays,
  Plus,
  PlusCircle,
  Image as ImageIcon,
  LogIn as LogInIcon,
  LogOut as LogOutIcon,
  Navigation2,
  AlertTriangle,
  Trophy,
  ChevronLeft,
  PackageSearch,
  RotateCcw,
  Calendar,
  Maximize2,
  Quote,
  LayoutGrid,
  Edit,
  Check,
  Send
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, LabelList, Cell } from 'recharts';
import L from 'leaflet';
import { getTodayStr, isDateMatch, getLatenessStatus, getEarlyDepartureStatus, getUzTime, formatUzTime, formatUzDateTime } from '../utils';
import MapPicker from './MapPicker';
import StaffMap from './StaffMap';
import { t, Language, translations } from '../translations';

interface ManagerPanelProps {
  state: AppState;
  approveUser: (userId: string) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  updateCheckIn: (userId: string, date: string, updates: Partial<CheckIn>) => void;
  updateReport: (userId: string, date: string, updates: Partial<DailyReport>) => void;
  addMessage: (text: string, recipientId?: string) => void;
  markMessageAsRead: (messageId: string) => void;
  activeTab: 'overview' | 'users' | 'reports' | 'approvals' | 'messages' | 'simcards' | 'monitoring' | 'rating';
  setActiveTab: (tab: 'overview' | 'users' | 'reports' | 'approvals' | 'messages' | 'simcards' | 'monitoring' | 'rating') => void;
  addSimInventory: (company: string, count: number) => void;
  setMonthlyTarget: (month: string, targets: Record<string, number>, officeCounts?: Record<string, number>, mobileOfficeCounts?: Record<string, number>) => void;
  addTariff: (company: string, tariff: string) => void;
  removeTariff: (company: string, tariff: string) => void;
  setRatingThresholds?: (thresholds: any) => void;
  isDarkMode: boolean;
  language: 'uz' | 'ru' | 'en';
  calculateAchievements: (force?: boolean) => void;
}


const getFormattedDateStr = (d: Date) => {
  const uzDate = getUzTime(d);
  const y = uzDate.getFullYear();
  const m = String(uzDate.getMonth() + 1).padStart(2, '0');
  const day = String(uzDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const SingleLocationMap: React.FC<{ location: { lat: number; lng: number } | null, initials: string, isDarkMode: boolean, language: Language }> = ({ location, initials, isDarkMode, language }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (mapRef.current && !leafletMap.current && location) {
      leafletMap.current = L.map(mapRef.current, { 
        scrollWheelZoom: true, 
        dragging: true, 
        zoomControl: false,
        attributionControl: false
      }).setView([location.lat, location.lng], 16);
      
      const tileUrl = isDarkMode 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        
      L.tileLayer(tileUrl, { 
        maxZoom: 20 
      }).addTo(leafletMap.current);

      L.control.zoom({ position: 'bottomright' }).addTo(leafletMap.current);
      
      const customIcon = L.divIcon({
        className: 'custom-staff-icon-pin',
        html: `<div class="map-marker-pin-tear"><div class="pin-initials">${initials}</div></div>`,
        iconSize: [40, 48], iconAnchor: [20, 48]
      });

      markerRef.current = L.marker([location.lat, location.lng], { icon: customIcon }).addTo(leafletMap.current);
      
      setTimeout(() => {
        leafletMap.current?.invalidateSize();
      }, 100);
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        markerRef.current = null;
      }
    };
  }, [location === null]);

  useEffect(() => {
    if (leafletMap.current) {
      leafletMap.current.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          leafletMap.current?.removeLayer(layer);
        }
      });
      const tileUrl = isDarkMode 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      L.tileLayer(tileUrl, { maxZoom: 20 }).addTo(leafletMap.current);
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (leafletMap.current && location) {
      leafletMap.current.setView([location.lat, location.lng], 16);
      if (markerRef.current) {
        markerRef.current.setLatLng([location.lat, location.lng]);
      } else {
        const customIcon = L.divIcon({
          className: 'custom-staff-icon-pin',
          html: `<div class="map-marker-pin-tear"><div class="pin-initials">${initials}</div></div>`,
          iconSize: [40, 48], iconAnchor: [20, 48]
        });
        markerRef.current = L.marker([location.lat, location.lng], { icon: customIcon }).addTo(leafletMap.current);
      }
      leafletMap.current.invalidateSize();
    }
  }, [location, initials]);

  if (!location) return (
    <div className="h-56 flex flex-col items-center justify-center text-white/20 italic font-black text-xs uppercase tracking-widest bg-brand-black rounded-[2rem] border-2 border-dashed border-white/10 p-8 text-center">
      <div className="w-16 h-16 bg-brand-dark rounded-full flex items-center justify-center shadow-sm mb-4 border border-white/10">
        <MapPin className="w-8 h-8 opacity-20" />
      </div>
      Joylashuv ma'lumotlari topilmadi
    </div>
  );

  return (
    <div className="h-56 rounded-[2rem] overflow-hidden border border-white/10 shadow-inner relative group">
      <div ref={mapRef} className="w-full h-full z-0" />
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <a 
          href={`https://www.google.com/maps?q=${location.lat},${location.lng}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-brand-black/95 backdrop-blur-md p-2.5 rounded-xl shadow-lg border border-white/10 text-brand-gold hover:text-brand-gold/80 transition-all block hover:scale-105"
          title="Google Maps'da ko'rish"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
      <div className="absolute bottom-4 left-6 z-10 bg-brand-gold text-brand-black px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl ring-4 ring-brand-gold/30">
        {t(language, 'live_location')}
      </div>
    </div>
  );
};

const PhotoViewer: React.FC<{ photo: string; onClose: () => void }> = ({ photo, onClose }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
    <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose}></div>
    <div className="relative z-10 max-w-[95vw] max-h-[90vh] flex flex-col items-center justify-center animate-in zoom-in-95">
      <button 
        onClick={onClose} 
        className="absolute -top-14 right-0 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all border border-white/20 z-50"
      >
        <X className="w-6 h-6" />
      </button>
      <img 
        src={photo} 
        className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" 
        alt="Full view" 
      />
      <div className="mt-4 bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full border border-white/10">
        Yopish uchun ekranga bosing
      </div>
    </div>
  </div>
);



const ManagerPanel: React.FC<ManagerPanelProps> = ({ state, approveUser, updateUser, updateCheckIn, updateReport, addMessage, markMessageAsRead, activeTab, setActiveTab, addSimInventory, setMonthlyTarget, addTariff, removeTariff, isDarkMode, language, calculateAchievements }) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [mapSelectedUserId, setMapSelectedUserId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [editingTime, setEditingTime] = useState<{ type: 'checkIn' | 'checkOut', current: string } | null>(null);
  const [newTime, setNewTime] = useState('');
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [tempStartTime, setTempStartTime] = useState('');
  const [tempEndTime, setTempEndTime] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingTimeframe, setRatingTimeframe] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [ratingMonthOffset, setRatingMonthOffset] = useState(0);
  const [ratingCustomStart, setRatingCustomStart] = useState(getTodayStr());
  const [ratingCustomEnd, setRatingCustomEnd] = useState(getTodayStr());
  const [ratingMode, setRatingMode] = useState('overall');
  const [isLeagueModalOpen, setIsLeagueModalOpen] = useState(false);
  const [isLeagueDropdownOpen, setIsLeagueDropdownOpen] = useState(false);
  const [isOperatorDropdownOpen, setIsOperatorDropdownOpen] = useState(false);
  const [leagueForm, setLeagueForm] = useState<{ league: 'gold' | 'silver' | 'bronze', userId: string }>({ league: 'gold', userId: '' });
  const [chartTimeframe, setChartTimeframe] = useState<'week' | 'month' | 'year'>('week');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [monthOffset, setMonthOffset] = useState<number>(0);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplyingTo, setIsReplyingTo] = useState<string | null>(null);
  const [isSendMessageModalOpen, setIsSendMessageModalOpen] = useState(false);
  const [isRecipientDropdownOpen, setIsRecipientDropdownOpen] = useState(false);
  const [messageRecipientId, setMessageRecipientId] = useState<string>('all');
  const [messageText, setMessageText] = useState('');
  
  // Monitoring Tab State
  const [monitoringTimeframe, setMonitoringTimeframe] = useState<'week' | 'month' | 'year'>('week');
  const [monitoringWeekOffset, setMonitoringWeekOffset] = useState(0);
  const [monitoringMonthOffset, setMonitoringMonthOffset] = useState(0);
  const [monitoringYear, setMonitoringYear] = useState(new Date().getFullYear());
  const [monitoringSelectedDay, setMonitoringSelectedDay] = useState<string | null>(null);
  const [isWorkPointModalOpen, setIsWorkPointModalOpen] = useState(false);
  const [workPointForm, setWorkPointForm] = useState<{ userId: string, location: { lat: number, lng: number } | null, radius: number, workType: 'office' | 'mobile' | 'desk' }>({ userId: '', location: null, radius: 200, workType: 'office' });
  const [isWorkPointOperatorDropdownOpen, setIsWorkPointOperatorDropdownOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  const [targetMonth, setTargetMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showTargetForm, setShowTargetForm] = useState(false);
  const [targetForm, setTargetForm] = useState<Record<string, string>>({
    'Ucell': '0',
    'Mobiuz': '0',
    'Beeline': '0',
    'Uztelecom': '0'
  });
  const [showOfficeForm, setShowOfficeForm] = useState(false);
  const [officeForm, setOfficeForm] = useState<Record<string, string>>({
    'Ucell': '0',
    'Mobiuz': '0',
    'Beeline': '0',
    'Uztelecom': '0'
  });
  const [mobileOfficeForm, setMobileOfficeForm] = useState<Record<string, string>>({
    'Ucell': '0',
    'Mobiuz': '0',
    'Beeline': '0',
    'Uztelecom': '0'
  });
  const [showTariffForm, setShowTariffForm] = useState(false);
  const [newTariff, setNewTariff] = useState({ company: 'Ucell', name: '' });
  const [openDropdown, setOpenDropdown] = useState<'tariffCompany' | null>(null);

  const formatLargeNumber = (val: any) => {
    const num = Number(val);
    if (isNaN(num)) return '0';
    if (num > 999999999) return '999M+';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    return Math.round(num).toLocaleString('uz-UZ');
  };

  const [inventoryModalUser, setInventoryModalUser] = useState<User | null>(null);
  const [inventoryForm, setInventoryForm] = useState<Record<string, string>>({
    'Ucell': '0',
    'Mobiuz': '0',
    'Beeline': '0',
    'Uztelecom': '0'
  });

  const monthInputRef = useRef<HTMLInputElement>(null);

  const today = getTodayStr();
  const approvedUsers = useMemo(() => state.users.filter(u => u.isApproved), [state.users]);
  const operators = useMemo(() => approvedUsers.filter(u => u.role !== Role.MANAGER), [approvedUsers]);
  const pendingUsers = useMemo(() => state.users.filter(u => !u.isApproved), [state.users]);
  const unreadMessagesCount = useMemo(() => state.messages.filter(m => !m.isRead && m.senderId !== state.currentUser?.id).length, [state.messages, state.currentUser]);
  const selectedUser = useMemo(() => state.users.find(u => u.id === selectedUserId) || null, [state.users, selectedUserId]);

  const getUserSalesCount = (userId: string, timeframe: string) => {
    let sales = state.sales.filter(s => s.userId === userId);
    if (timeframe === 'today') sales = sales.filter(s => s.date === today);
    if (timeframe === 'month') sales = sales.filter(s => s.date.startsWith(today.substring(0, 7)));
    if (timeframe === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      sales = sales.filter(s => new Date(s.date) >= weekAgo);
    }
    return sales.reduce((sum, s) => sum + s.count + s.bonus, 0);
  };

  const getSalesChartData = (userId: string, timeframe: 'week' | 'month' | 'year', targetYear: number, wOffset: number, mOffset: number) => {
    const data = [];
    
    if (timeframe === 'week') {
      const d = new Date();
      const currentDayIndex = d.getDay(); 
      const diffToMonday = (currentDayIndex === 0 ? -6 : 1 - currentDayIndex);
      const targetMonday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday + (wOffset * 7));
      const uzDays = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan'];
      
      for (let i = 0; i < 7; i++) {
        const current = new Date(targetMonday);
        current.setDate(targetMonday.getDate() + i);
        const dateStr = getFormattedDateStr(current);
        const daySales = state.sales.filter(s => s.userId === userId && s.date === dateStr);
        const simcards = daySales.reduce((sum, s) => sum + s.count, 0);
        const bonuses = daySales.reduce((sum, s) => sum + s.bonus, 0);
        data.push({ 
          name: uzDays[current.getDay()], 
          fullDate: dateStr, 
          simcards,
          bonuses
        });
      }
    } else if (timeframe === 'month') {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() + mOffset);
      const year = d.getFullYear();
      const month = d.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= lastDay; i++) {
        const current = new Date(year, month, i);
        const dateStr = getFormattedDateStr(current);
        const daySales = state.sales.filter(s => s.userId === userId && s.date === dateStr);
        const simcards = daySales.reduce((sum, s) => sum + s.count, 0);
        const bonuses = daySales.reduce((sum, s) => sum + s.bonus, 0);
        data.push({ name: i.toString(), fullDate: dateStr, simcards, bonuses });
      }
    } else if (timeframe === 'year') {
      for (let m = 0; m < 12; m++) {
        const monthNum = m + 1;
        const monthPrefix = `${targetYear}-${String(monthNum).padStart(2, '0')}`;
        const monthSales = state.sales.filter(s => s.userId === userId && s.date.startsWith(monthPrefix));
        const simcards = monthSales.reduce((sum, s) => sum + s.count, 0);
        const bonuses = monthSales.reduce((sum, s) => sum + s.bonus, 0);
        const monthNames = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
        data.push({ name: monthNames[m], fullDate: `${targetYear}-${String(monthNum).padStart(2, '0')}-01`, simcards, bonuses });
      }
    }
    return data;
  };

  const currentChartData = useMemo(() => {
    if (!selectedUserId) return [];
    return getSalesChartData(selectedUserId, chartTimeframe, selectedYear, weekOffset, monthOffset);
  }, [selectedUserId, chartTimeframe, selectedYear, weekOffset, monthOffset, state.sales]);

  const userChartTotals = useMemo(() => {
    const totalSimcards = currentChartData.reduce((sum, item) => sum + (item.simcards || 0), 0);
    const totalBonuses = currentChartData.reduce((sum, item) => sum + (item.bonuses || 0), 0);
    return { totalSimcards, totalBonuses };
  }, [currentChartData]);

  const chartTitleLabel = useMemo(() => {
    if (chartTimeframe === 'week') return 'Haftalik';
    if (chartTimeframe === 'month') {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() + monthOffset);
      const monthName = translations[language].month_names[d.getMonth()];
      return `${monthName} ${d.getFullYear()}`;
    }
    if (chartTimeframe === 'year') return `${t(language, 'yearly')} - ${selectedYear}`;
    return '';
  }, [chartTimeframe, monthOffset, selectedYear]);

  const activeReferencePoint = useMemo(() => {
    if (!selectedDay) return null;
    return currentChartData.find(d => d.fullDate === selectedDay);
  }, [selectedDay, currentChartData]);

  const filteredUsers = useMemo(() => {
    return approvedUsers.filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [approvedUsers, searchTerm]);

  const handleResetChart = () => {
    setSelectedDay(null);
    setWeekOffset(0);
    setMonthOffset(0);
    setSelectedYear(new Date().getFullYear());
  };

  useEffect(() => {
    setWeekOffset(0);
    setMonthOffset(0);
    setSelectedYear(new Date().getFullYear());
  }, [chartTimeframe, selectedUserId]);

  const periodTotals = useMemo(() => {
    if (!selectedUserId) return { 'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0 };
    
    let filteredSales = state.sales.filter(s => s.userId === selectedUserId);

    if (chartTimeframe === 'week') {
      const d = new Date();
      const currentDayIndex = d.getDay();
      const diffToMonday = (currentDayIndex === 0 ? -6 : 1 - currentDayIndex);
      const targetMonday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday + (weekOffset * 7));
      targetMonday.setHours(0,0,0,0);
      const targetSunday = new Date(targetMonday);
      targetSunday.setDate(targetMonday.getDate() + 6);
      targetSunday.setHours(23,59,59,999);
      
      filteredSales = filteredSales.filter(s => {
        const sd = new Date(s.date);
        return sd >= targetMonday && sd <= targetSunday;
      });
    } else if (chartTimeframe === 'month') {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() + monthOffset);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
      filteredSales = filteredSales.filter(s => s.date.startsWith(monthPrefix));
    } else if (chartTimeframe === 'year') {
      const yearPrefix = selectedYear.toString();
      filteredSales = filteredSales.filter(s => s.date.startsWith(yearPrefix));
    }

    const totals: Record<string, number> = { 'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0 };
    filteredSales.forEach(s => {
      if (totals[s.company] !== undefined) {
        totals[s.company] += s.count + s.bonus;
      }
    });
    return totals;
  }, [selectedUserId, chartTimeframe, weekOffset, monthOffset, selectedYear, state.sales]);

  // Reset selected day when timeframe changes
  useEffect(() => {
    setMonitoringSelectedDay(null);
  }, [monitoringTimeframe, monitoringWeekOffset, monitoringMonthOffset, monitoringYear]);

  // Get all sales for the current monitoring period
  const monitoringPeriodSales = useMemo(() => {
    let filteredSales = state.sales;

    if (monitoringTimeframe === 'week') {
      const d = new Date();
      const currentDayIndex = d.getDay();
      const diffToMonday = (currentDayIndex === 0 ? -6 : 1 - currentDayIndex);
      const targetMonday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday + (monitoringWeekOffset * 7));
      targetMonday.setHours(0,0,0,0);
      const targetSunday = new Date(targetMonday);
      targetSunday.setDate(targetMonday.getDate() + 6);
      targetSunday.setHours(23,59,59,999);
      
      filteredSales = filteredSales.filter(s => {
        const sd = new Date(s.date);
        return sd >= targetMonday && sd <= targetSunday;
      });
    } else if (monitoringTimeframe === 'month') {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() + monitoringMonthOffset);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
      filteredSales = filteredSales.filter(s => s.date.startsWith(monthPrefix));
    } else if (monitoringTimeframe === 'year') {
      const yearPrefix = monitoringYear.toString();
      filteredSales = filteredSales.filter(s => s.date.startsWith(yearPrefix));
    }
    return filteredSales;
  }, [monitoringTimeframe, monitoringWeekOffset, monitoringMonthOffset, monitoringYear, state.sales]);

  const monitoringChartData = useMemo(() => {
    const data = [];
    if (monitoringTimeframe === 'week') {
      const d = new Date();
      const currentDayIndex = d.getDay();
      const diffToMonday = (currentDayIndex === 0 ? -6 : 1 - currentDayIndex);
      const targetMonday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday + (monitoringWeekOffset * 7));
      const uzDays = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan'];
      
      for (let i = 0; i < 7; i++) {
        const current = new Date(targetMonday);
        current.setDate(targetMonday.getDate() + i);
        const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
        
        const daySales = monitoringPeriodSales.filter(s => s.date === dateStr);
        const simcards = daySales.reduce((sum, s) => sum + s.count, 0);
        const bonuses = daySales.reduce((sum, s) => sum + s.bonus, 0);
        data.push({ name: uzDays[current.getDay()], simcards, bonuses, fullDate: dateStr });
      }
    } else if (monitoringTimeframe === 'month') {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() + monitoringMonthOffset);
      const year = d.getFullYear();
      const month = d.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= lastDay; i++) {
        const current = new Date(year, month, i);
        const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
        const daySales = monitoringPeriodSales.filter(s => s.date === dateStr);
        const simcards = daySales.reduce((sum, s) => sum + s.count, 0);
        const bonuses = daySales.reduce((sum, s) => sum + s.bonus, 0);
        data.push({ name: i.toString(), simcards, bonuses, fullDate: dateStr });
      }
    } else if (monitoringTimeframe === 'year') {
      for (let m = 0; m < 12; m++) {
        const monthNum = m + 1;
        const monthPrefix = `${monitoringYear}-${String(monthNum).padStart(2, '0')}`;
        const monthSales = monitoringPeriodSales.filter(s => s.date.startsWith(monthPrefix));
        const simcards = monthSales.reduce((sum, s) => sum + s.count, 0);
        const bonuses = monthSales.reduce((sum, s) => sum + s.bonus, 0);
        const monthNames = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
        data.push({ name: monthNames[m], simcards, bonuses, fullDate: monthPrefix });
      }
    }
    return data;
  }, [monitoringTimeframe, monitoringWeekOffset, monitoringMonthOffset, monitoringYear, monitoringPeriodSales]);

  const monitoringTotals = useMemo(() => {
    const totalSimcards = monitoringPeriodSales.reduce((sum, s) => sum + s.count, 0);
    const totalBonuses = monitoringPeriodSales.reduce((sum, s) => sum + s.bonus, 0);
    
    // Calculate company totals for the chart period
    const companyTotals: Record<string, number> = { 'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0 };
    monitoringPeriodSales.forEach(s => {
      if (companyTotals[s.company] !== undefined) {
        companyTotals[s.company] += s.count + s.bonus;
      }
    });

    return { totalSimcards, totalBonuses, companyTotals };
  }, [monitoringPeriodSales]);

  // Sales data for the table (filtered by selected day if any)
  const tableSales = useMemo(() => {
    if (monitoringSelectedDay) {
      if (monitoringSelectedDay.length === 7) {
        return monitoringPeriodSales.filter(s => s.date.startsWith(monitoringSelectedDay));
      }
      return monitoringPeriodSales.filter(s => s.date === monitoringSelectedDay);
    }
    return monitoringPeriodSales;
  }, [monitoringPeriodSales, monitoringSelectedDay]);

  const tableTotals = useMemo(() => {
    const companyTotals: Record<string, number> = { 'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0 };
    tableSales.forEach(s => {
      if (companyTotals[s.company] !== undefined) {
        companyTotals[s.company] += s.count + s.bonus;
      }
    });
    const totalAll = Object.values(companyTotals).reduce((a, b) => a + b, 0);
    return { companyTotals, totalAll };
  }, [tableSales]);

  return (
    <div className="space-y-6">
      {viewingPhoto && <PhotoViewer photo={viewingPhoto} onClose={() => setViewingPhoto(null)} />}
      
      {isSendMessageModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsSendMessageModalOpen(false)}></div>
          <div className="bg-brand-dark w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-brand-black">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-gold text-brand-black rounded-2xl shadow-lg">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Xabar yuborish</h3>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-0.5">Yangi xabar yaratish</p>
                </div>
              </div>
              <button onClick={() => setIsSendMessageModalOpen(false)} className="p-2 bg-brand-black rounded-xl text-white/40 hover:text-white transition shadow-sm border border-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="relative">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2 ml-1">Qabul qiluvchi</label>
                <div 
                  onClick={() => setIsRecipientDropdownOpen(!isRecipientDropdownOpen)}
                  className="w-full p-4 bg-brand-black border border-white/10 rounded-2xl text-sm font-bold text-white focus:border-brand-gold outline-none transition shadow-inner flex items-center justify-between cursor-pointer"
                >
                  <span>
                    {messageRecipientId === 'all' 
                      ? 'Barchaga (Hamma xodimlar)' 
                      : operators.find(op => op.id === messageRecipientId)?.firstName + ' ' + operators.find(op => op.id === messageRecipientId)?.lastName}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isRecipientDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                
                {isRecipientDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-brand-dark border border-white/10 rounded-2xl shadow-2xl z-[160] overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    <div className="max-h-60 overflow-y-auto no-scrollbar">
                      <div 
                        onClick={() => {
                          setMessageRecipientId('all');
                          setIsRecipientDropdownOpen(false);
                        }}
                        className={`p-4 text-sm font-bold cursor-pointer transition-colors ${messageRecipientId === 'all' ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5'}`}
                      >
                        Barchaga (Hamma xodimlar)
                      </div>
                      {operators.map(op => (
                        <div 
                          key={op.id}
                          onClick={() => {
                            setMessageRecipientId(op.id);
                            setIsRecipientDropdownOpen(false);
                          }}
                          className={`p-4 text-sm font-bold cursor-pointer transition-colors border-t border-white/5 ${messageRecipientId === op.id ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5'}`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{op.firstName} {op.lastName}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/30">{op.role.replace('_', ' ')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2 ml-1">Xabar matni</label>
                <textarea 
                  className="w-full p-6 bg-brand-black border border-white/10 rounded-[2rem] text-sm font-medium text-white focus:border-brand-gold outline-none transition shadow-inner"
                  rows={4}
                  placeholder="Xabaringizni yozing..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  autoFocus
                />
              </div>
              
              <button 
                onClick={() => {
                  if (!messageText.trim()) return alert("Xabar matnini kiriting");
                  addMessage(messageText, messageRecipientId);
                  setIsSendMessageModalOpen(false);
                  setMessageText('');
                  alert("Xabar muvaffaqiyatli yuborildi!");
                }}
                className="w-full py-5 gold-gradient text-brand-black rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-brand-gold/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Xabarni yuborish <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Ucell" value={state.sales.filter(s => s.date === today && s.company === 'Ucell').reduce((sum, s) => sum + s.count + (s.bonus || 0), 0)} icon={<Smartphone />} color="bg-[#9b51e0]" />
            <StatCard label="Uztelecom" value={state.sales.filter(s => s.date === today && s.company === 'Uztelecom').reduce((sum, s) => sum + s.count + (s.bonus || 0), 0)} icon={<Smartphone />} color="bg-[#009ee0]" />
            <StatCard label="Mobiuz" value={state.sales.filter(s => s.date === today && s.company === 'Mobiuz').reduce((sum, s) => sum + s.count + (s.bonus || 0), 0)} icon={<Smartphone />} color="bg-[#eb1c24]" />
            <StatCard label="Beeline" value={state.sales.filter(s => s.date === today && s.company === 'Beeline').reduce((sum, s) => sum + s.count + (s.bonus || 0), 0)} icon={<Smartphone />} color="bg-[#fdb913]" />
          </div>

          <section className="bg-brand-dark rounded-[2.5rem] border border-white/10 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-brand-black">
              <div className="p-2.5 bg-brand-gold/10 rounded-xl text-brand-gold"><Trophy className="w-5 h-5" /></div>
              <h3 className="text-lg font-black text-white tracking-tight">{t(language, 'staff_efficiency')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-brand-black text-[9px] font-black text-white/30 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4 w-16 text-center">#</th>
                    <th className="px-8 py-4">{t(language, 'employee')}</th>
                    <th className="px-8 py-4">{t(language, 'position')}</th>
                    <th className="px-8 py-4 text-center">{t(language, 'today_sales')}</th>
                    <th className="px-8 py-4 text-center">{t(language, 'monthly_sales')}</th>
                    <th className="px-8 py-4 text-right">{t(language, 'status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[...operators]
                    .sort((a, b) => getUserSalesCount(b.id, 'month') - getUserSalesCount(a.id, 'month'))
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((op, idx) => {
                    const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                    const todayCount = getUserSalesCount(op.id, 'today');
                    const monthCount = getUserSalesCount(op.id, 'month');
                    const todayCheckIn = state.checkIns.find(ci => ci.userId === op.id && isDateMatch(ci.timestamp, today));
                    const workingHours = todayCheckIn?.workingHours || op.workingHours;
                    const lateness = todayCheckIn ? getLatenessStatus(todayCheckIn.timestamp, workingHours) : null;
                    
                    return (
                      <tr 
                        key={op.id} 
                        className={`transition group cursor-pointer ${lateness?.isLate ? 'bg-red-500/5 hover:bg-red-500/10' : (lateness?.isEarly ? 'bg-brand-gold/5 hover:bg-brand-gold/10' : 'hover:bg-white/5')}`}
                        onClick={() => {
                          setSelectedUserId(op.id);
                          setSelectedDay(null); // Defaults to today
                          setChartTimeframe('week');
                        }}
                      >
                        <td className="px-8 py-5 text-center">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
                            globalIdx === 0 ? 'bg-brand-gold text-brand-black shadow-lg shadow-brand-gold/20' :
                            globalIdx === 1 ? 'bg-white/20 text-white' :
                            globalIdx === 2 ? 'bg-white/10 text-white/60' :
                            'bg-brand-black text-white/20'
                          }`}>
                            {globalIdx + 1}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs border ${lateness?.isLate ? 'bg-red-600 text-white border-red-700 shadow-sm' : (lateness?.isEarly ? 'bg-brand-gold text-brand-black border-brand-gold shadow-sm' : 'bg-brand-black text-brand-gold border-white/10')} overflow-hidden`}>
                              {op.photo ? (
                                <img src={op.photo} alt={op.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <>{op.firstName?.[0]}{op.lastName?.[0]}</>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-white">{op.firstName} {op.lastName}</span>
                              {lateness?.isLate && <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">{t(language, 'late')}: {lateness.durationStr}</span>}
                              {lateness?.isEarly && <span className="text-[8px] font-black text-brand-gold uppercase tracking-widest">{t(language, 'early_arrival')}: {lateness.durationStr}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-[10px] font-black text-white/30 uppercase tracking-tighter bg-white/5 px-2 py-1 rounded-md">
                            {op.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className="inline-flex flex-col">
                            <span className="text-xl font-black text-brand-gold">{todayCount}</span>
                            <span className="text-[8px] font-black text-white/20 uppercase">dona</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className="inline-flex flex-col">
                            <span className="text-xl font-black text-white">{monthCount}</span>
                            <span className="text-[8px] font-black text-white/20 uppercase">dona</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <div key={star} className={`w-1.5 h-1.5 rounded-full ${monthCount > (star * 20) ? 'bg-brand-gold' : 'bg-white/10'}`}></div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {operators.length > itemsPerPage && (
                <div className="flex items-center justify-center gap-2 p-4 border-t border-white/5">
                  <button 
                    onClick={() => {
                      setCurrentPage(p => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-white/60" />
                  </button>
                  <span className="text-xs font-bold text-white/60">
                    {currentPage} / {Math.ceil(operators.length / itemsPerPage)}
                  </span>
                  <button 
                    onClick={() => {
                      setCurrentPage(p => Math.min(Math.ceil(operators.length / itemsPerPage), p + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === Math.ceil(operators.length / itemsPerPage)}
                    className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-white/60" />
                  </button>
                </div>
              )}
            </div>
          </section>

          <div className="bg-brand-dark p-4 rounded-3xl shadow-sm border border-white/10 h-[650px] flex gap-4">
            <div className="w-64 border-r border-white/5 overflow-y-auto p-2 scrollbar-hide no-scrollbar">
              <h3 className="text-base font-black text-white mb-4">Operatorlar</h3>
              <div className="space-y-3">
                {operators.map(op => (
                  <div
                    key={op.id}
                    onClick={() => setMapSelectedUserId(op.id)}
                    className={`group w-full text-left p-4 rounded-2xl text-sm font-medium transition-all duration-300 border cursor-pointer flex justify-between items-center ${mapSelectedUserId === op.id ? 'bg-brand-gold text-brand-black border-brand-gold shadow-lg shadow-brand-gold/20' : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:border-white/20'}`}
                  >
                    <span className="truncate font-semibold">{op.firstName} {op.lastName}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedUserId(op.id); }}
                      className={`p-2 rounded-xl transition-all ${mapSelectedUserId === op.id ? 'bg-brand-black/10 hover:bg-brand-black/20 text-brand-black' : 'bg-white/5 hover:bg-white/10 text-white/60 group-hover:text-white'}`}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-2 mb-2 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-2"><MapPin className="w-4 h-4 text-brand-gold" /> Jonli Monitoring</h3>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{new Date().toISOString().slice(0, 10)}</span>
                  <button 
                    onClick={() => setIsWorkPointModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-brand-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-brand-gold/20"
                  >
                    <PlusCircle className="w-4 h-4" /> Ish nuqtasini kiritish
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden"><StaffMap className="h-full" checkIns={state.checkIns} reports={state.reports} users={state.users} today={today} onUserSelect={setMapSelectedUserId} selectedUserId={mapSelectedUserId || undefined} isDarkMode={isDarkMode} language={language} /></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'monitoring' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <Activity className="w-8 h-8 text-brand-gold" /> 
                Monitoring
              </h2>
              <p className="text-white/40 font-medium mt-1">Barcha operatorlarning savdo ko'rsatkichlari</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex p-1 bg-brand-black rounded-xl border border-white/10">
                <button 
                  onClick={() => setMonitoringTimeframe('week')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${monitoringTimeframe === 'week' ? 'bg-brand-gold text-brand-black shadow-sm' : 'text-white/40 hover:text-white'}`}
                >
                  Hafta
                </button>
                <button 
                  onClick={() => setMonitoringTimeframe('month')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${monitoringTimeframe === 'month' ? 'bg-brand-gold text-brand-black shadow-sm' : 'text-white/40 hover:text-white'}`}
                >
                  {t(language, 'month')}
                </button>
                <button 
                  onClick={() => setMonitoringTimeframe('year')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${monitoringTimeframe === 'year' ? 'bg-brand-gold text-brand-black shadow-sm' : 'text-white/40 hover:text-white'}`}
                >
                  {t(language, 'yearly')}
                </button>
              </div>

              <div className="flex items-center gap-1 bg-brand-black p-1 rounded-xl border border-white/10">
                <button 
                  onClick={() => {
                    if (monitoringTimeframe === 'week') setMonitoringWeekOffset(prev => prev - 1);
                    else if (monitoringTimeframe === 'month') setMonitoringMonthOffset(prev => prev - 1);
                    else if (monitoringTimeframe === 'year') setMonitoringYear(prev => prev - 1);
                  }}
                  className="p-2 hover:bg-white/5 hover:shadow-sm rounded-lg transition-all text-white/40 hover:text-brand-gold"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-black text-brand-gold px-3 uppercase tracking-widest min-w-[120px] text-center">
                  {(() => {
                    if (monitoringTimeframe === 'week') {
                      const d = new Date();
                      const currentDayIndex = d.getDay();
                      const diffToMonday = (currentDayIndex === 0 ? -6 : 1 - currentDayIndex);
                      const targetMonday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday + (monitoringWeekOffset * 7));
                      const targetSunday = new Date(targetMonday);
                      targetSunday.setDate(targetMonday.getDate() + 6);
                      const monthNames = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
                      return `${targetMonday.getDate()} ${monthNames[targetMonday.getMonth()]} - ${targetSunday.getDate()} ${monthNames[targetSunday.getMonth()]}`;
                    } else if (monitoringTimeframe === 'month') {
                      const d = new Date();
                      d.setDate(1);
                      d.setMonth(d.getMonth() + monitoringMonthOffset);
                      const monthNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
                      return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
                    } else {
                      return monitoringYear.toString();
                    }
                  })()}
                </span>
                <button 
                  onClick={() => {
                    if (monitoringTimeframe === 'week') setMonitoringWeekOffset(prev => prev + 1);
                    else if (monitoringTimeframe === 'month') setMonitoringMonthOffset(prev => prev + 1);
                    else if (monitoringTimeframe === 'year') setMonitoringYear(prev => prev + 1);
                  }}
                  className="p-2 hover:bg-white/5 hover:shadow-sm rounded-lg transition-all text-white/40 hover:text-brand-gold"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Aggregated Chart */}
          <div className="bg-brand-dark p-8 rounded-[3rem] shadow-xl border border-white/10">
            <div className="h-[400px] w-full chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={monitoringChartData}
                  margin={{ top: 30, right: 10, left: 0, bottom: 0 }}
                  onClick={(data) => {
                    if (data && data.activePayload && data.activePayload.length > 0) {
                      const clickedDate = data.activePayload[0].payload.fullDate;
                      if (clickedDate) {
                        setMonitoringSelectedDay(prev => prev === clickedDate ? null : clickedDate);
                      }
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" opacity={0.1} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                    dy={10}
                  />
                  <YAxis hide axisLine={false} tickLine={false} />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#1A1A1A] p-4 rounded-2xl shadow-2xl border border-white/10">
                            <p className="text-white font-bold mb-2 text-sm">{label}</p>
                            <div className="flex flex-col gap-1">
                              {payload.filter((p: any) => p.dataKey === 'simcards').map((p: any) => (
                                <div key={p.dataKey} className="flex items-center justify-between gap-4 text-xs font-bold text-brand-gold">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-brand-gold"></div>
                                    <span>Simkartalar:</span>
                                  </div>
                                  <span>{p.value}</span>
                                </div>
                              ))}
                              {payload.filter((p: any) => p.dataKey === 'bonuses').map((p: any) => (
                                <div key={p.dataKey} className="flex items-center justify-between gap-4 text-xs font-bold text-[#10B981]">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
                                    <span>Bonuslar:</span>
                                  </div>
                                  <span>{p.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 4 }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={60}
                    content={() => (
                      <div className="flex flex-col items-center justify-center gap-4 mb-8">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-brand-gold"></div>
                            <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Simkartalar: {monitoringTotals.totalSimcards}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
                            <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Bonuslar: {monitoringTotals.totalBonuses}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  />
                  <Bar 
                    name="Simkartalar"
                    dataKey="simcards" 
                    fill="var(--theme-gold)" 
                    radius={[4, 4, 0, 0]}
                    barSize={monitoringTimeframe === 'week' ? 20 : undefined}
                    onClick={(data, index, e) => {
                      if (e && e.stopPropagation) e.stopPropagation();
                      if (data && data.fullDate) {
                        setMonitoringSelectedDay(prev => prev === data.fullDate ? null : data.fullDate);
                      }
                    }}
                  >
                    {monitoringChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fullDate === monitoringSelectedDay ? '#fff' : 'var(--theme-gold)'} />
                    ))}
                    <LabelList dataKey="simcards" position="top" fill="var(--theme-gold)" fontSize={10} fontWeight={900} formatter={(val: number) => val > 0 ? val : ''} />
                  </Bar>
                  <Bar 
                    name="Bonuslar"
                    dataKey="bonuses" 
                    fill="#10B981" 
                    radius={[4, 4, 0, 0]}
                    barSize={monitoringTimeframe === 'week' ? 20 : undefined}
                    onClick={(data, index, e) => {
                      if (e && e.stopPropagation) e.stopPropagation();
                      if (data && data.fullDate) {
                        setMonitoringSelectedDay(prev => prev === data.fullDate ? null : data.fullDate);
                      }
                    }}
                  >
                    {monitoringChartData.map((entry, index) => (
                      <Cell key={`cell-bonus-${index}`} fill={entry.fullDate === monitoringSelectedDay ? '#a7f3d0' : '#10B981'} />
                    ))}
                    <LabelList dataKey="bonuses" position="top" fill="#10B981" fontSize={10} fontWeight={900} formatter={(val: number) => val > 0 ? val : ''} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Operator Breakdown Table */}
          <div className="bg-brand-dark rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
            <div className="px-8 py-6 bg-brand-black border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="p-3 bg-brand-gold/10 rounded-2xl text-brand-gold shadow-sm"><Smartphone className="w-6 h-6" /></div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  {monitoringSelectedDay ? `${monitoringSelectedDay} Kunlik Sotuvlar` : "Operatorlar bo'yicha hisobot"}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-center md:justify-end">
                {['Ucell', 'Uztelecom', 'Mobiuz', 'Beeline'].map(company => {
                  const count = tableTotals.companyTotals[company] || 0;
                  const styles: any = {
                    'Ucell': 'bg-[#9b51e0]/10 text-[#9b51e0] border-[#9b51e0]/20',
                    'Uztelecom': 'bg-[#009ee0]/10 text-[#009ee0] border-[#009ee0]/20',
                    'Mobiuz': 'bg-[#eb1c24]/10 text-[#eb1c24] border-[#eb1c24]/20',
                    'Beeline': 'bg-[#fdb913]/10 text-[#fdb913] border-[#fdb913]/20'
                  }[company];
                  return (
                    <div key={company} className={`px-4 py-2 rounded-xl border ${styles} text-[10px] font-black uppercase tracking-widest shadow-sm`}>
                      {company}: <span className="ml-1">{count}</span>
                    </div>
                  );
                })}
                
                 {monitoringSelectedDay && (
                  <button 
                    onClick={() => setMonitoringSelectedDay(null)}
                    className="ml-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-white/60 hover:text-white uppercase tracking-wider transition-colors"
                  >
                    Filtrni tozalash
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-brand-black text-[9px] font-black text-white/30 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4">Xodim</th>
                    <th className="px-8 py-4 text-center">Ucell</th>
                    <th className="px-8 py-4 text-center">Uztelecom</th>
                    <th className="px-8 py-4 text-center">Mobiuz</th>
                    <th className="px-8 py-4 text-center">Beeline</th>
                    <th className="px-8 py-4 text-center text-brand-gold">Jami</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {state.users.filter(u => u.role !== 'manager').map(u => {
                    // Calculate sales for this user in the selected timeframe or day
                    const getUserSales = () => {
                      const userSales = tableSales.filter(s => s.userId === u.id);
                      
                      const totals: Record<string, number> = { 'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0 };
                      userSales.forEach(s => {
                        if (totals[s.company] !== undefined) {
                          totals[s.company] += s.count + s.bonus;
                        }
                      });
                      return totals;
                    };

                    const sales = getUserSales();
                    const total = Object.values(sales).reduce((a, b) => a + b, 0);

                    return (
                      <tr 
                        key={u.id} 
                        className="hover:bg-white/5 transition group cursor-pointer"
                        onClick={() => setSelectedUserId(u.id)}
                      >
                        <td className="px-8 py-5 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-brand-black border border-white/10 flex items-center justify-center font-black text-white/20 overflow-hidden">
                            {u.photo ? (
                              <img src={u.photo} alt={u.firstName} className="w-full h-full object-cover" />
                            ) : (
                              <>{u.firstName?.[0]}{u.lastName?.[0]}</>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-white">{u.firstName} {u.lastName}</p>
                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{u.phone}</p>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center font-bold text-[#9b51e0]">{sales['Ucell']}</td>
                        <td className="px-8 py-5 text-center font-bold text-[#009ee0]">{sales['Uztelecom']}</td>
                        <td className="px-8 py-5 text-center font-bold text-[#eb1c24]">{sales['Mobiuz']}</td>
                        <td className="px-8 py-5 text-center font-bold text-[#fdb913]">{sales['Beeline']}</td>
                        <td className="px-8 py-5 text-center font-black text-lg text-brand-gold">{total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-white">{t(language, 'staff_team')}</h2>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="text" placeholder="Xodimni qidirish..." className="w-full pl-10 pr-4 py-3 border border-white/10 rounded-2xl bg-brand-black focus:border-brand-gold transition outline-none text-white font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredUsers.map(u => {
              const todayCheckIn = state.checkIns.find(ci => ci.userId === u.id && isDateMatch(ci.timestamp, today));
              const lateness = todayCheckIn ? getLatenessStatus(todayCheckIn.timestamp, u.workingHours) : null;
              
              return (
                <div key={u.id} onClick={() => { setSelectedUserId(u.id); setChartTimeframe('week'); setSelectedDay(null); }} className={`p-6 rounded-[2.5rem] border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group text-center relative overflow-hidden ${lateness?.isLate ? 'bg-red-500/10 border-red-500/20' : (lateness?.isEarly ? 'bg-brand-gold/10 border-brand-gold/20' : 'bg-brand-dark border-white/10')}`}>
                  {lateness?.isLate && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter shadow-md animate-pulse z-10">LATE</div>
                  )}
                  {lateness?.isEarly && (
                    <div className="absolute top-4 right-4 bg-brand-gold text-brand-black text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter shadow-md animate-pulse z-10">EARLY</div>
                  )}
                  <div className={`w-20 h-20 rounded-[1.8rem] flex items-center justify-center mx-auto mb-4 font-black text-2xl group-hover:scale-110 transition-transform ${lateness?.isLate ? 'bg-red-600 text-white shadow-lg shadow-red-200' : (lateness?.isEarly ? 'bg-brand-gold text-brand-black shadow-lg shadow-brand-gold/20' : 'bg-brand-black text-brand-gold border border-white/10')} overflow-hidden`}>
                    {u.photo ? (
                      <img src={u.photo} alt={u.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <>{u.firstName?.[0]}{u.lastName?.[0]}</>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-white">{u.firstName} {u.lastName}</h3>
                  <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mt-1">{u.role.replace('_', ' ')}</p>
                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-around">
                    <div className="text-center"><p className="text-[10px] font-black text-white/30 uppercase">{t(language, 'today')}</p><p className={`font-black ${lateness?.isLate ? 'text-red-600' : 'text-brand-gold'}`}>{getUserSalesCount(u.id, 'today')}</p></div>
                    <div className="text-center"><p className="text-[10px] font-black text-white/30 uppercase">{t(language, 'month')}</p><p className="font-black text-white">{getUserSalesCount(u.id, 'month')}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-300">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => { setSelectedUserId(null); setSelectedDay(null); }}></div>
              <div className="bg-brand-black w-full h-full md:h-[92vh] md:w-[92vw] md:rounded-[3rem] shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in slide-in-from-bottom-12 border border-white/10">
                <div className="p-6 md:p-8 border-b border-white/10 flex items-center justify-between bg-brand-dark sticky top-0 z-50">
                  <div className="flex items-center gap-6">
                    <button onClick={() => { setSelectedUserId(null); setSelectedDay(null); }} className="p-3 bg-brand-black rounded-2xl text-white/40 hover:text-white transition shadow-sm border border-white/10"><ArrowLeft className="w-6 h-6" /></button>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-brand-gold text-brand-black rounded-[1.5rem] flex items-center justify-center font-black text-2xl uppercase shadow-xl ring-4 ring-brand-gold/10 overflow-hidden">
                        {selectedUser.photo ? (
                          <img src={selectedUser.photo} alt={selectedUser.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <>{selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}</>
                        )}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white leading-none mb-2">{selectedUser.firstName} {selectedUser.lastName}</h2>
                        <div className="flex items-center gap-2">
                          <span className="bg-brand-gold text-brand-black text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">{selectedUser.role.replace('_', ' ')}</span>
                          <span className="text-white/40 text-[10px] font-bold">● {selectedUser.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <button
                        onClick={() => {
                          setIsTimeDropdownOpen(!isTimeDropdownOpen);
                          if (!isTimeDropdownOpen && selectedUser.workingHours) {
                            const [start, end] = selectedUser.workingHours.split('-');
                            setTempStartTime(start || '');
                            setTempEndTime(end || '');
                          } else if (!isTimeDropdownOpen) {
                            setTempStartTime('');
                            setTempEndTime('');
                          }
                        }}
                        className="appearance-none bg-brand-gold/10 text-brand-gold pl-10 pr-10 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none focus:border-brand-gold cursor-pointer hover:bg-brand-gold/20 active:scale-[0.98] transition-all border border-white/10 flex items-center gap-2 min-w-[180px]"
                      >
                        <span>{selectedUser.workingHours || "Vaqtni tanlang"}</span>
                      </button>
                      <Clock className="w-4 h-4 text-brand-gold absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200" style={{ transform: isTimeDropdownOpen ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)' }}>
                        <ChevronRight className="w-3 h-3 text-brand-gold rotate-90" />
                      </div>

                      {isTimeDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-72 bg-brand-dark rounded-2xl shadow-xl border border-white/10 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 p-4">
                          <style>{`
                            .time-picker-input::-webkit-calendar-picker-indicator {
                              position: absolute;
                              top: 0;
                              left: 0;
                              right: 0;
                              bottom: 0;
                              width: 100%;
                              height: 100%;
                              opacity: 0;
                              cursor: pointer;
                            }
                          `}</style>
                          <div className="space-y-4">
                            <div>
                              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1.5">Ish boshlash</label>
                              <input 
                                type="time" 
                                value={tempStartTime}
                                onClick={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) {} }}
                                onChange={(e) => setTempStartTime(e.target.value)}
                                className="time-picker-input w-full p-3 bg-brand-black rounded-xl text-sm font-bold text-white border border-white/10 focus:border-brand-gold outline-none relative"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1.5">Ish tugatish</label>
                              <input 
                                type="time" 
                                value={tempEndTime}
                                onClick={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) {} }}
                                onChange={(e) => setTempEndTime(e.target.value)}
                                className="time-picker-input w-full p-3 bg-brand-black rounded-xl text-sm font-bold text-white border border-white/10 focus:border-brand-gold outline-none relative"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1.5">Bo'lim (Department)</label>
                              <select 
                                value={selectedUser.department || ''}
                                onChange={(e) => updateUser(selectedUser.id, { department: e.target.value })}
                                className="w-full p-3 bg-brand-black rounded-xl text-sm font-bold text-white border border-white/10 focus:border-brand-gold outline-none mb-4"
                              >
                                <option value="">Bo'lim tanlang</option>
                                <option value="Sotuv bo'limi">Sotuv bo'limi</option>
                                <option value="Call markaz">Call markaz</option>
                                <option value="Dilerlik">Dilerlik</option>
                                <option value="B2B">B2B</option>
                              </select>

                              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1.5">Ish nuqtasi (Xaritadan tanlang)</label>
                              <MapPicker 
                                lat={selectedUser.workLocation?.lat || 0} 
                                lng={selectedUser.workLocation?.lng || 0} 
                                onChange={(lat, lng) => {
                                  updateUser(selectedUser.id, { 
                                    workLocation: { lat, lng } 
                                  });
                                }} 
                              />
                              <div className="mt-2 mb-4 text-[10px] text-white/40 font-medium">
                                {selectedUser.workLocation?.lat ? `${selectedUser.workLocation.lat.toFixed(6)}, ${selectedUser.workLocation.lng.toFixed(6)}` : 'Nuqta tanlanmagan'}
                              </div>

                              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1.5">Liga (Reyting)</label>
                              <select 
                                value={selectedUser.league || 'bronze'}
                                onChange={(e) => updateUser(selectedUser.id, { league: e.target.value as 'gold' | 'silver' | 'bronze' })}
                                className="w-full p-3 bg-brand-black rounded-xl text-sm font-bold text-white border border-white/10 focus:border-brand-gold outline-none"
                              >
                                <option value="gold">Gold</option>
                                <option value="silver">Silver</option>
                                <option value="bronze">Bronze</option>
                              </select>
                            </div>
                            <button
                              onClick={() => {
                                if (tempStartTime && tempEndTime) {
                                  updateUser(selectedUser.id, { workingHours: `${tempStartTime}-${tempEndTime}` });
                                  setIsTimeDropdownOpen(false);
                                } else {
                                  alert('Iltimos, vaqtlarni to\'liq kiriting');
                                }
                              }}
                              className="w-full py-3 gold-gradient text-brand-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition shadow-md shadow-brand-gold/20"
                            >
                              Saqlash
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => {
                        setMessageRecipientId(selectedUser.id);
                        setIsSendMessageModalOpen(true);
                        setMessageText('');
                      }}
                      className="p-3 bg-brand-gold/10 text-brand-gold rounded-2xl hover:bg-brand-gold hover:text-brand-black transition-all shadow-sm flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-brand-gold/20"
                    >
                      <Phone className="w-4 h-4" />
                      Xabar yuborish
                    </button>
                    <button onClick={() => { setSelectedUserId(null); setSelectedDay(null); }} className="p-3 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-500/20"><X className="w-6 h-6" /></button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar no-scrollbar bg-brand-black">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <RefinedStatCard 
                      label={t(language, 'today_sales')} 
                      value={getUserSalesCount(selectedUser.id, 'today')} 
                      icon={<Clock />} 
                      color="bg-brand-gold" 
                      isActive={chartTimeframe === 'week'}
                      onClick={() => setChartTimeframe('week')}
                    />
                    <RefinedStatCard 
                      label={t(language, 'this_month')} 
                      value={getUserSalesCount(selectedUser.id, 'month')} 
                      icon={<CalendarDays />} 
                      color="bg-white/10" 
                      isActive={chartTimeframe === 'month'}
                      onClick={() => setChartTimeframe('month')}
                    />
                    <RefinedStatCard 
                      label={t(language, 'phone')} 
                      value={selectedUser.phone} 
                      icon={<Phone />} 
                      color="bg-brand-gold" 
                    />
                    <RefinedStatCard 
                      label={t(language, 'total')} 
                      value={getUserSalesCount(selectedUser.id, 'total')} 
                      icon={<Award />} 
                      color="bg-white/10" 
                      isActive={chartTimeframe === 'year'}
                      onClick={() => setChartTimeframe('year')}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      <div className="bg-brand-dark rounded-[2rem] p-6 shadow-sm overflow-hidden border border-white/10 outline-none select-none no-outline-container">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-1">
                              <h3 className="text-lg font-black text-white flex items-center gap-2">
                                <BarChart2 className="w-5 h-5 text-brand-gold" /> 
                                Sotuvlar Dinamikasi ({chartTitleLabel})
                              </h3>
                              <div className="flex flex-wrap gap-2 pl-7">
                                {['Ucell', 'Uztelecom', 'Mobiuz', 'Beeline'].map(company => {
                                  const count = periodTotals[company] || 0;
                                  const styles: any = {
                                    'Ucell': 'text-[#9b51e0] bg-[#9b51e0]/10 border-[#9b51e0]/20',
                                    'Uztelecom': 'text-[#009ee0] bg-[#009ee0]/10 border-[#009ee0]/20',
                                    'Mobiuz': 'text-[#eb1c24] bg-[#eb1c24]/10 border-[#eb1c24]/20',
                                    'Beeline': 'text-[#fdb913] bg-[#fdb913]/10 border-[#fdb913]/20'
                                  }[company];
                                  return (
                                    <span key={company} className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${styles}`}>
                                      {company}: {count}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 bg-brand-black p-1 rounded-xl border border-white/10 shadow-inner">
                              <button 
                                onClick={() => {
                                  if (chartTimeframe === 'week') setWeekOffset(prev => prev - 1);
                                  else if (chartTimeframe === 'month') setMonthOffset(prev => prev - 1);
                                  else if (chartTimeframe === 'year') setSelectedYear(prev => prev - 1);
                                }}
                                className="p-1.5 hover:bg-white/5 hover:shadow-sm rounded-lg transition-all text-white/30 hover:text-brand-gold focus:outline-none"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <span className="text-[10px] font-black text-brand-gold px-2 uppercase tracking-tighter whitespace-nowrap min-w-[120px] text-center">
                                {chartTimeframe === 'week' ? (
                                  currentChartData.length === 7 ? (() => {
                                    const s = new Date(currentChartData[0].fullDate);
                                    const e = new Date(currentChartData[6].fullDate);
                                    const fmt = (d: Date) => `M${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getDate()).padStart(2, '0')}`;
                                    return `${fmt(s)} — ${fmt(e)}`;
                                  })() : '...'
                                ) : chartTimeframe === 'month' ? (
                                  chartTitleLabel
                                ) : (
                                  selectedYear
                                )}
                              </span>
                              <button 
                                onClick={() => {
                                  if (chartTimeframe === 'week') setWeekOffset(prev => prev + 1);
                                  else if (chartTimeframe === 'month') setMonthOffset(prev => prev + 1);
                                  else if (chartTimeframe === 'year') setSelectedYear(prev => prev + 1);
                                }}
                                className="p-1.5 hover:bg-white/5 hover:shadow-sm rounded-lg transition-all text-white/30 hover:text-brand-gold focus:outline-none"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {(selectedDay || weekOffset !== 0 || monthOffset !== 0 || (chartTimeframe === 'year' && selectedYear !== new Date().getFullYear())) && (
                              <button 
                                onClick={handleResetChart}
                                className="px-4 py-2 bg-brand-gold/10 text-brand-gold rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-gold/20 transition shadow-sm focus:outline-none border border-brand-gold/20"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> {t(language, 'back_to_today')}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="h-72 border-none outline-none bg-brand-dark focus:outline-none focus:ring-0 chart-wrapper">
                          <ResponsiveContainer width="100%" height="100%" style={{ border: 'none', outline: 'none' }}>
                            <BarChart 
                              data={currentChartData} 
                              onClick={(e: any) => {
                                if (e && e.activePayload && e.activePayload.length > 0) {
                                  const payload = e.activePayload[0].payload;
                                  if (payload && payload.fullDate) {
                                    setSelectedDay(payload.fullDate);
                                  }
                                } else if (e && e.activeTooltipIndex !== undefined) {
                                  const payload = currentChartData[e.activeTooltipIndex];
                                  if (payload && payload.fullDate) {
                                    setSelectedDay(payload.fullDate);
                                  }
                                }
                              }}
                              margin={{ top: 30, right: 10, left: 0, bottom: 0 }}
                              style={{ border: 'none', outline: 'none' }}
                            >
                              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.05)" />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 11, fill: 'rgba(255,255,255,0.3)', fontWeight: 700}} 
                                interval={0}
                              />
                              <YAxis hide axisLine={false} tickLine={false} />
                              <Tooltip 
                                content={({ active, payload, label }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-[#1A1A1A] p-4 rounded-2xl shadow-2xl border border-white/10">
                                        <p className="text-white font-bold mb-2 text-sm">{label}</p>
                                        <div className="flex flex-col gap-1">
                                          {payload.filter((p: any) => p.dataKey === 'simcards').map((p: any) => (
                                            <div key={p.dataKey} className="flex items-center justify-between gap-4 text-xs font-bold text-brand-gold">
                                              <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-brand-gold"></div>
                                                <span>Simkartalar:</span>
                                              </div>
                                              <span>{p.value}</span>
                                            </div>
                                          ))}
                                          {payload.filter((p: any) => p.dataKey === 'bonuses').map((p: any) => (
                                            <div key={p.dataKey} className="flex items-center justify-between gap-4 text-xs font-bold text-[#10B981]">
                                              <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
                                                <span>Bonuslar:</span>
                                              </div>
                                              <span>{p.value}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                                cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 4 }} 
                              />
                              <Legend 
                                verticalAlign="top" 
                                height={60}
                                content={() => (
                                  <div className="flex items-center justify-center gap-6 mb-8">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-brand-gold"></div>
                                      <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Simkartalar: {userChartTotals.totalSimcards}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
                                      <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Bonuslar: {userChartTotals.totalBonuses}</span>
                                    </div>
                                  </div>
                                )}
                              />
                              {activeReferencePoint && (
                                <ReferenceLine x={activeReferencePoint.name} stroke="var(--theme-gold)" strokeWidth={2} strokeDasharray="3 3" />
                              )}
                              <Bar 
                                name="Simkartalar"
                                dataKey="simcards" 
                                fill="var(--theme-gold)" 
                                radius={[4, 4, 0, 0]}
                                barSize={chartTimeframe === 'week' ? 20 : undefined}
                              >
                                <LabelList dataKey="simcards" position="top" fill="var(--theme-gold)" fontSize={10} fontWeight={900} formatter={(val: number) => val > 0 ? val : ''} />
                              </Bar>
                              <Bar 
                                name="Bonuslar"
                                dataKey="bonuses" 
                                fill="#10B981" 
                                radius={[4, 4, 0, 0]}
                                barSize={chartTimeframe === 'week' ? 20 : undefined}
                              >
                                <LabelList dataKey="bonuses" position="top" fill="#10B981" fontSize={10} fontWeight={900} formatter={(val: number) => val > 0 ? val : ''} />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="bg-brand-dark rounded-[2rem] border border-white/10 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-white/5 relative flex flex-col md:flex-row items-center justify-between bg-brand-dark gap-4">
                          <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="p-2.5 bg-brand-gold/10 rounded-xl text-brand-gold"><Smartphone className="w-5 h-5" /></div>
                            <h3 className="text-lg font-black text-white tracking-tight">
                              {selectedDay ? (chartTimeframe === 'year' ? `${(() => {
                                const d = new Date(selectedDay);
                                const monthName = translations[language].month_names[d.getMonth()];
                                return `${monthName} ${d.getFullYear()}`;
                              })()} ${t(language, 'monthly_sales_title')}` : `${selectedDay} ${t(language, 'daily_sales_title')}`) : (chartTimeframe === 'month' ? `${chartTitleLabel} ${t(language, 'monthly_sales_title')}` : `${today} ${t(language, 'daily_sales_title')}`)}
                            </h3>
                          </div>
                          
                          <div className="flex flex-wrap justify-center items-center gap-2 w-full md:w-auto md:absolute md:left-1/2 md:-translate-x-1/2">
                            {(() => {
                              const targetDate = selectedDay || today;
                              let daySales = [];
                              if (selectedDay) {
                                if (chartTimeframe === 'year') {
                                  const monthPrefix = selectedDay.substring(0, 7);
                                  daySales = state.sales.filter(s => s.userId === selectedUser.id && s.date.startsWith(monthPrefix));
                                } else {
                                  daySales = state.sales.filter(s => s.userId === selectedUser.id && s.date === selectedDay);
                                }
                              } else if (chartTimeframe === 'month') {
                                const d = new Date();
                                d.setDate(1);
                                d.setMonth(d.getMonth() + monthOffset);
                                const monthPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                                daySales = state.sales.filter(s => s.userId === selectedUser.id && s.date.startsWith(monthPrefix));
                              } else {
                                daySales = state.sales.filter(s => s.userId === selectedUser.id && s.date === today);
                              }

                              const companies = [
                                { name: 'Ucell', color: 'border-[#9b51e0]/20 text-[#9b51e0] bg-[#9b51e0]/10' },
                                { name: 'Uztelecom', color: 'border-[#009ee0]/20 text-[#009ee0] bg-[#009ee0]/10' },
                                { name: 'Mobiuz', color: 'border-[#eb1c24]/20 text-[#eb1c24] bg-[#eb1c24]/10' },
                                { name: 'Beeline', color: 'border-[#fdb913]/20 text-[#fdb913] bg-[#fdb913]/10' }
                              ];
                              
                              return companies.map(c => {
                                const count = daySales.filter(s => s.company === c.name).reduce((acc, s) => acc + s.count + s.bonus, 0);
                                return (
                                  <div key={c.name} className={`px-3 py-1.5 rounded-lg border ${c.color} font-bold text-xs flex items-center gap-2`}>
                                    <span className="uppercase text-[10px] opacity-70">{c.name}:</span>
                                    <span className="text-sm">{count}</span>
                                  </div>
                                );
                              });
                            })()}
                          </div>

                          <div className="w-full md:w-auto flex justify-end">
                            {selectedDay && (
                              <div className="flex items-center gap-2 text-[9px] font-black text-brand-gold bg-brand-gold/10 px-3 py-1 rounded-full uppercase tracking-widest shadow-sm border border-brand-gold/20">
                                <Calendar className="w-3 h-3" /> Tanlangan kun
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="bg-brand-black text-[9px] font-black text-white/30 uppercase tracking-widest">
                              <tr>
                                <th className="px-8 py-4">Kompaniya</th>
                                <th className="px-8 py-4">Tarif</th>
                                <th className="px-8 py-4 text-center">Soni</th>
                                <th className="px-8 py-4 text-center">Bonus</th>
                                <th className="px-8 py-4 text-center">{t(language, 'total')}</th>
                                <th className="px-8 py-4 text-right">Vaqt</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {(() => {
                                let daySales = [];
                                if (selectedDay) {
                                  if (chartTimeframe === 'year') {
                                    const monthPrefix = selectedDay.substring(0, 7);
                                    daySales = state.sales.filter(s => s.userId === selectedUser.id && s.date.startsWith(monthPrefix));
                                  } else {
                                    daySales = state.sales.filter(s => s.userId === selectedUser.id && s.date === selectedDay);
                                  }
                                } else if (chartTimeframe === 'month') {
                                  const d = new Date();
                                  d.setDate(1);
                                  d.setMonth(d.getMonth() + monthOffset);
                                  const monthPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                                  daySales = state.sales.filter(s => s.userId === selectedUser.id && s.date.startsWith(monthPrefix));
                                } else {
                                  daySales = state.sales.filter(s => s.userId === selectedUser.id && s.date === today);
                                }

                                if (daySales.length === 0) {
                                  return (
                                    <tr>
                                      <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/10">
                                            <PackageSearch className="w-10 h-10" />
                                          </div>
                                          <p className="text-sm font-black text-white/20 italic">Bu davrda hech nima sotilmagan</p>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                }
                                return daySales.sort((a, b) => {
                                  const order = { 'Ucell': 1, 'Uztelecom': 2, 'Mobiuz': 3, 'Beeline': 4 };
                                  return (order[a.company as keyof typeof order] || 99) - (order[b.company as keyof typeof order] || 99) || b.timestamp.localeCompare(a.timestamp);
                                }).map(sale => (
                                  <tr key={sale.id} className="hover:bg-white/5 transition group">
                                    <td className="px-8 py-5">
                                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-colors border ${
                                        sale.company === 'Ucell' ? 'bg-[#9b51e0]/10 text-[#9b51e0] border-[#9b51e0]/20 group-hover:bg-[#9b51e0] group-hover:text-white' :
                                        sale.company === 'Uztelecom' ? 'bg-[#009ee0]/10 text-[#009ee0] border-[#009ee0]/20 group-hover:bg-[#009ee0] group-hover:text-white' :
                                        sale.company === 'Mobiuz' ? 'bg-[#eb1c24]/10 text-[#eb1c24] border-[#eb1c24]/20 group-hover:bg-[#eb1c24] group-hover:text-white' :
                                        sale.company === 'Beeline' ? 'bg-[#fdb913]/10 text-[#fdb913] border-[#fdb913]/20 group-hover:bg-[#fdb913] group-hover:text-black' :
                                        'bg-brand-gold/10 text-brand-gold border-brand-gold/20 group-hover:bg-brand-gold group-hover:text-brand-black'
                                      }`}>
                                        {sale.company}
                                      </span>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-bold text-white/70">{sale.tariff}</td>
                                    <td className="px-8 py-5 text-center font-black text-lg text-brand-gold">{sale.count}</td>
                                    <td className="px-8 py-5 text-center font-black text-lg text-white/70">{sale.bonus.toLocaleString()}</td>
                                    <td className="px-8 py-5 text-center font-black text-lg text-brand-gold">{(sale.count + sale.bonus).toLocaleString()}</td>
                                    <td className="px-8 py-5 text-right text-[10px] font-bold text-white/20">
                                      <div className="flex flex-col items-end">
                                        <span>{formatUzTime(sale.timestamp)}</span>
                                        <span className="text-[8px] text-white/10">{new Date(sale.timestamp).toLocaleDateString()}</span>
                                      </div>
                                    </td>
                                  </tr>
                                ));
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* OPTIMIZED DAILY REPORT DISPLAY MATCHING SCREENSHOT */}
                      <div className="bg-brand-dark rounded-[2rem] border border-white/10 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-white/5 bg-brand-dark">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-brand-gold/10 rounded-xl text-brand-gold"><FileText className="w-5 h-5" /></div>
                            <h3 className="text-lg font-black text-white tracking-tight">
                              {t(language, 'daily_report')} {selectedDay ? `(${selectedDay})` : `(${t(language, 'today')})`}
                            </h3>
                          </div>
                        </div>
                        <div className="p-8">
                          {(() => {
                            const targetDate = selectedDay || today;
                            const dailyReport = state.reports.find(r => r.userId === selectedUser.id && r.date === targetDate);
                            
                            if (!dailyReport) {
                              return (
                                <div className="flex flex-col items-center py-10 text-center gap-4">
                                  <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-white/10">
                                    <AlertTriangle className="w-8 h-8" />
                                  </div>
                                  <p className="text-sm font-black text-white/20 italic">Bu kun uchun hisobot yuborilmagan</p>
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-10">
                                {dailyReport.photos && dailyReport.photos.length > 0 && (
                                  <div className="space-y-5">
                                    <div className="flex items-center gap-3 px-2">
                                      <div className="w-7 h-7 bg-brand-gold/10 rounded-lg flex items-center justify-center">
                                        <LayoutGrid className="w-4 h-4 text-brand-gold" />
                                      </div>
                                      <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">ILOVA QILINGAN RASMLAR ({dailyReport.photos.length})</p>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                      {dailyReport.photos.map((photo, idx) => (
                                        <div 
                                          key={idx}
                                          className="relative group cursor-pointer overflow-hidden rounded-[2.2rem] border-4 border-white/10 shadow-xl aspect-square transition-all hover:scale-[1.02]"
                                          onClick={() => setViewingPhoto(photo)}
                                        >
                                          <img src={photo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30 text-white scale-75 group-hover:scale-100 transition-all">
                                              <Maximize2 className="w-6 h-6" />
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="bg-brand-black rounded-[2rem] border border-white/10 p-8 shadow-sm flex flex-col gap-6">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-brand-gold"></div>
                                      <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Kunlik Xulosa</span>
                                    </div>
                                    <span className="text-[10px] font-black text-brand-gold bg-brand-gold/10 px-3 py-1 rounded-full border border-brand-gold/20">
                                      {formatUzTime(dailyReport.timestamp)}
                                    </span>
                                  </div>
                                  <p className="text-white font-bold text-2xl leading-relaxed tracking-tight">
                                    {dailyReport.summary}
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="bg-brand-dark rounded-[2rem] border border-white/10 overflow-hidden shadow-sm focus:outline-none">
                        <h3 className="p-5 text-[10px] font-black text-white/30 uppercase tracking-widest border-b border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-brand-gold" /> {selectedDay || today} DAVOMAT</div>
                          {(() => {
                             const date = selectedDay || today;
                             const ci = state.checkIns.find(c => c.userId === selectedUser.id && isDateMatch(c.timestamp, date));
                             const workingHours = ci?.workingHours || selectedUser.workingHours;
                             return workingHours ? <span className="bg-brand-black px-2 py-1 rounded-md text-white/50 border border-white/10">{workingHours}</span> : null;
                          })()}
                        </h3>
                        <div className="p-6 space-y-4">
                          {(() => {
                            const date = selectedDay || today;
                            const ci = state.checkIns.find(c => c.userId === selectedUser.id && isDateMatch(c.timestamp, date));
                            const co = state.reports.find(r => r.userId === selectedUser.id && r.date === date);
                            const workingHours = ci?.workingHours || selectedUser.workingHours;
                            const lateness = ci ? getLatenessStatus(ci.timestamp, workingHours) : null;
                            const earlyDeparture = co ? getEarlyDepartureStatus(co.timestamp, workingHours) : null;
                            
                            const arrivalCardStyle = ci 
                              ? (lateness ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/20') 
                              : 'bg-red-500/5 border-red-500/10';

                            const departureCardStyle = co
                              ? (earlyDeparture ? 'bg-orange-500/10 border-orange-500/30' : 'bg-blue-500/10 border-blue-500/20')
                              : 'bg-white/5 border-white/10 opacity-60';
                            
                            return (
                              <>
                                <div className={`p-6 rounded-[2rem] border-2 transition-all duration-300 flex flex-col gap-2 shadow-sm ${arrivalCardStyle}`}>
                                  <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl shadow-md ${ci ? (lateness ? 'bg-red-600 text-white' : 'bg-green-600 text-white') : 'bg-red-600 text-white'}`}><LogInIcon className="w-5 h-5" /></div>
                                    <div className="flex-1">
                                      <div className="flex justify-between items-start">
                                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Kelish</p>
                                        <div className="flex items-center gap-2">
                                          {lateness && (
                                            <div className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse shadow-md ring-2 ring-white">LATE</div>
                                          )}
                                        </div>
                                      </div>
                                      {editingTime?.type === 'checkIn' ? (
                                        <div className="flex items-center gap-2 mt-1">
                                          <input 
                                            type="time" 
                                            value={newTime} 
                                            onChange={e => setNewTime(e.target.value)}
                                            className="bg-brand-black border border-white/10 rounded-lg px-2 py-1 text-lg font-bold w-32 outline-none focus:border-brand-gold text-white"
                                            autoFocus
                                          />
                                          <button 
                                            onClick={() => {
                                              if (newTime) {
                                                const [h, m] = newTime.split(':').map(Number);
                                                const d = new Date(ci!.timestamp);
                                                d.setHours(h, m);
                                                updateCheckIn(selectedUser.id, date, { timestamp: d.toISOString() });
                                                setEditingTime(null);
                                              }
                                            }}
                                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition shadow-sm"
                                          >
                                            <Check className="w-4 h-4" />
                                          </button>
                                          <button onClick={() => setEditingTime(null)} className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition shadow-sm border border-white/10"><X className="w-4 h-4" /></button>
                                        </div>
                                      ) : (
                                        <p className={`text-2xl font-black leading-none mt-1 ${ci ? (lateness ? 'text-red-500' : 'text-white') : 'text-red-500/40'}`}>
                                          {ci ? formatUzTime(ci.timestamp) : t(language, 'not_come')}
                                        </p>
                                      )}
                                      {lateness && editingTime?.type !== 'checkIn' && (
                                        <div className="mt-2 pt-2 border-t border-red-500/20 flex items-center gap-1.5 text-red-500 font-black text-[10px] uppercase tracking-wider animate-in fade-in slide-in-from-top-2 duration-500">
                                          <AlertTriangle className="w-3.5 h-3.5" />
                                          <span>{lateness.durationStr} kechikish</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className={`p-6 rounded-[2rem] border-2 flex flex-col gap-2 shadow-sm transition-all ${departureCardStyle}`}>
                                  <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl shadow-md ${co ? (earlyDeparture ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white') : 'bg-white/10 text-white/30'}`}><LogOutIcon className="w-5 h-5" /></div>
                                    <div className="flex-1">
                                      <div className="flex justify-between items-start">
                                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Ketish</p>
                                        <div className="flex items-center gap-2">
                                          {earlyDeparture && (
                                            <div className="bg-orange-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse shadow-md ring-2 ring-white">EARLY</div>
                                          )}
                                        </div>
                                      </div>
                                      {editingTime?.type === 'checkOut' ? (
                                        <div className="flex items-center gap-2 mt-1">
                                          <input 
                                            type="time" 
                                            value={newTime} 
                                            onChange={e => setNewTime(e.target.value)}
                                            className="bg-brand-black border border-white/10 rounded-lg px-2 py-1 text-lg font-bold w-32 outline-none focus:border-brand-gold text-white"
                                            autoFocus
                                          />
                                          <button 
                                            onClick={() => {
                                              if (newTime) {
                                                const [h, m] = newTime.split(':').map(Number);
                                                const d = new Date(co!.timestamp);
                                                d.setHours(h, m);
                                                updateReport(selectedUser.id, date, { timestamp: d.toISOString() });
                                                setEditingTime(null);
                                              }
                                            }}
                                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition shadow-sm"
                                          >
                                            <Check className="w-4 h-4" />
                                          </button>
                                          <button onClick={() => setEditingTime(null)} className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition shadow-sm border border-white/10"><X className="w-4 h-4" /></button>
                                        </div>
                                      ) : (
                                        <p className={`text-2xl font-black leading-none mt-1 ${co ? (earlyDeparture ? 'text-orange-500' : 'text-white') : 'text-white/20'}`}>
                                          {co ? formatUzTime(co.timestamp) : 'Hali ketmagan'}
                                        </p>
                                      )}
                                      {earlyDeparture && editingTime?.type !== 'checkOut' && (
                                        <div className="mt-2 pt-2 border-t border-orange-500/20 flex items-center gap-1.5 text-orange-500 font-black text-[10px] uppercase tracking-wider animate-in fade-in slide-in-from-top-2 duration-500">
                                          <AlertTriangle className="w-3.5 h-3.5" />
                                          <span>{earlyDeparture.durationStr} erta ketish</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="bg-brand-dark rounded-[2rem] border border-white/10 p-6 shadow-sm">
                        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-brand-gold" /> {selectedDay ? 'KUNDAGI FOTO' : 'OXIRGI FOTO'}
                        </h3>
                        {(() => {
                          const targetDate = selectedDay || today;
                          const dayCi = state.checkIns.find(c => c.userId === selectedUser.id && isDateMatch(c.timestamp, targetDate));
                          return dayCi ? (
                            <div 
                              className="relative group cursor-pointer overflow-hidden rounded-[1.5rem]"
                              onClick={() => setViewingPhoto(dayCi.photo)}
                            >
                              <img src={dayCi.photo} className="w-full h-40 object-cover shadow-sm border border-white/5 group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30 text-white scale-90 group-hover:scale-100 transition-transform">
                                  <Maximize2 className="w-5 h-5" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="h-40 flex items-center justify-center text-white/20 italic font-black text-xs uppercase tracking-widest bg-brand-black rounded-[1.5rem] border-2 border-dashed border-white/10">
                              {selectedDay ? 'Bu kunda foto yo\'q' : 'Hali foto yo\'q'}
                            </div>
                          );
                        })()}
                      </div>

                      <div className="bg-brand-dark rounded-[2rem] border border-white/10 p-6 shadow-sm">
                        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-brand-gold" /> {selectedDay ? 'KUNDAGI JOYLAHUV' : 'OXIRGI JOYLAHUV'}
                        </h3>
                        {(() => {
                          const targetDate = selectedDay || today;
                          const dayCi = state.checkIns.find(c => c.userId === selectedUser.id && isDateMatch(c.timestamp, targetDate));
                          const initials = `${selectedUser.firstName?.[0] || ''}${selectedUser.lastName?.[0] || ''}`.toUpperCase();
                          return <SingleLocationMap location={dayCi?.location || null} initials={initials} isDarkMode={isDarkMode} language={language} />;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

      {activeTab === 'messages' && (
        <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white">{t(language, 'message_center')}</h2>
            <button 
              onClick={() => {
                setMessageRecipientId('all');
                setIsSendMessageModalOpen(true);
                setMessageText('');
              }}
              className="flex items-center gap-2 bg-brand-gold px-6 py-3 rounded-2xl hover:bg-brand-gold/90 transition-all active:scale-95 shadow-lg shadow-brand-gold/20"
            >
              <Send className="w-4 h-4 text-brand-black" />
              <span className="text-[10px] font-black text-brand-black uppercase tracking-widest">Xabar yuborish</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {state.messages.length > 0 ? (
              state.messages.map(m => (
                <div 
                  key={m.id} 
                  className={`p-6 rounded-[2rem] border transition-all relative group ${m.isRead ? 'bg-brand-dark border-white/10' : 'bg-brand-gold/10 border-brand-gold/30 shadow-lg shadow-brand-gold/5'}`}
                  onClick={() => !m.isRead && markMessageAsRead(m.id)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${m.senderName.includes('MENEJER') ? 'bg-brand-gold text-brand-black' : 'bg-brand-black text-brand-gold border border-brand-gold/20'}`}>
                        {m.senderName[0]}
                      </div>
                      <div>
                        <h4 className="font-black text-white text-sm">
                          {m.senderName} 
                          {m.recipientId && (
                            <span className="text-white/30 font-medium ml-2">
                              → {m.recipientId === 'all' ? 'Barchaga' : (state.users.find(u => u.id === m.recipientId)?.firstName || 'Xodim')}
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-white/30 font-bold">{formatUzDateTime(m.timestamp)}</p>
                      </div>
                    </div>
                    {!m.isRead && <span className="px-2 py-1 bg-brand-gold text-brand-black text-[8px] font-black rounded-md uppercase tracking-widest">Yangi</span>}
                  </div>
                  <p className="text-white/70 font-medium leading-relaxed mb-4 pl-1">{m.text}</p>
                  
                  {!m.senderName.includes('MENEJER') && (
                    <div className="flex justify-end">
                      {isReplyingTo === m.id ? (
                        <div className="w-full space-y-3 animate-in slide-in-from-top-2">
                          <textarea 
                            className="w-full p-4 border border-white/10 rounded-2xl bg-brand-black text-sm focus:border-brand-gold outline-none transition shadow-inner text-white"
                            rows={3}
                            placeholder="Javobingizni yozing..."
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={() => {
                                if (!replyText.trim()) return;
                                addMessage(`MENEJERDAN JAVOB: ${replyText}`);
                                setReplyText('');
                                setIsReplyingTo(null);
                                alert("Javob yuborildi!");
                              }}
                              className="px-6 py-2.5 bg-brand-gold text-brand-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-gold/90 transition shadow-md"
                            >
                              Yuborish
                            </button>
                            <button 
                              onClick={() => setIsReplyingTo(null)}
                              className="px-6 py-2.5 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition border border-white/10"
                            >
                              Bekor qilish
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsReplyingTo(m.id);
                          }}
                          className="px-6 py-2.5 bg-brand-black border border-brand-gold/20 text-brand-gold rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-gold hover:text-brand-black transition-all shadow-sm"
                        >
                          Javob berish
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-brand-dark rounded-[3rem] p-20 text-center border border-white/10 shadow-sm">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-white/10">
                  <Phone className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">{t(language, 'no_messages')}</h3>
                <p className="text-white/30 font-medium">{t(language, 'no_messages_desc')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'simcards' && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="bg-brand-dark p-10 rounded-[3rem] shadow-xl border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black text-white flex items-center gap-3"><Smartphone className="w-8 h-8 text-brand-gold" /> {t(language, 'monthly_plan_sales')}</h2>
                <div className="relative">
                  <div 
                    onClick={() => setShowMonthPicker(!showMonthPicker)}
                    className="flex items-center gap-3 bg-brand-black pl-3 pr-6 py-2 rounded-2xl border border-white/10 shadow-sm hover:border-brand-gold/30 transition-all cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold group-hover:scale-110 transition-transform">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-black text-white capitalize leading-none">
                      {(() => {
                        if (!targetMonth) return t(language, 'select_month');
                        const [y, m] = targetMonth.split('-');
                        const monthNames = translations[language].month_names;
                        return `${monthNames[parseInt(m) - 1]} ${y}`;
                      })()}
                    </span>
                  </div>

                  {showMonthPicker && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowMonthPicker(false)}></div>
                      <div className="absolute top-full left-0 mt-4 bg-brand-dark rounded-3xl shadow-2xl border border-white/10 p-6 z-50 w-80 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const [y, m] = (targetMonth || new Date().toISOString().slice(0, 7)).split('-');
                              setTargetMonth(`${parseInt(y) - 1}-${m}`);
                            }}
                            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/30"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <span className="text-lg font-black text-white">
                            {targetMonth.split('-')[0]}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const [y, m] = (targetMonth || new Date().toISOString().slice(0, 7)).split('-');
                              setTargetMonth(`${parseInt(y) + 1}-${m}`);
                            }}
                            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/30"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {translations[language].month_names_short.map((mName, i) => {
                            const monthNum = String(i + 1).padStart(2, '0');
                            const currentYear = (targetMonth || new Date().toISOString().slice(0, 7)).split('-')[0];
                            const isSelected = targetMonth === `${currentYear}-${monthNum}`;
                            
                            return (
                              <button
                                key={i}
                                onClick={() => {
                                  setTargetMonth(`${currentYear}-${monthNum}`);
                                  setShowMonthPicker(false);
                                }}
                                className={`py-3 rounded-xl text-sm font-bold transition-all ${
                                  isSelected 
                                    ? 'bg-brand-gold text-brand-black shadow-lg shadow-brand-gold/20 scale-105' 
                                    : 'bg-brand-black text-white/30 hover:bg-brand-gold/10 hover:text-brand-gold'
                                }`}
                              >
                                {mName}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {!showTargetForm && (
                  <>
                    <button 
                      onClick={() => {
                        const currentTargets = state.monthlyTargets?.find(t => t.month === targetMonth)?.targets || {
                          'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0
                        };
                        setTargetForm({
                          'Ucell': String(currentTargets['Ucell'] || 0),
                          'Mobiuz': String(currentTargets['Mobiuz'] || 0),
                          'Beeline': String(currentTargets['Beeline'] || 0),
                          'Uztelecom': String(currentTargets['Uztelecom'] || 0)
                        });
                        setShowTargetForm(true);
                      }}
                      className="bg-brand-gold text-brand-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-gold/90 active:scale-95 transition-all shadow-lg shadow-brand-gold/20"
                    >
                      <Plus className="w-4 h-4" /> {t(language, 'enter_plan')}
                    </button>
                    <button 
                      onClick={() => {
                        const currentMonthData = state.monthlyTargets?.find(t => t.month === targetMonth);
                        const currentOfficeCounts = currentMonthData?.officeCounts || {
                          'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0
                        };
                        const currentMobileOfficeCounts = currentMonthData?.mobileOfficeCounts || {
                          'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0
                        };
                        
                        setOfficeForm({
                          'Ucell': String(currentOfficeCounts['Ucell'] || 0),
                          'Mobiuz': String(currentOfficeCounts['Mobiuz'] || 0),
                          'Beeline': String(currentOfficeCounts['Beeline'] || 0),
                          'Uztelecom': String(currentOfficeCounts['Uztelecom'] || 0)
                        });
                        
                        setMobileOfficeForm({
                          'Ucell': String(currentMobileOfficeCounts['Ucell'] || 0),
                          'Mobiuz': String(currentMobileOfficeCounts['Mobiuz'] || 0),
                          'Beeline': String(currentMobileOfficeCounts['Beeline'] || 0),
                          'Uztelecom': String(currentMobileOfficeCounts['Uztelecom'] || 0)
                        });
                        
                        setShowOfficeForm(true);
                      }}
                      className="bg-brand-black text-brand-gold border border-brand-gold/20 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-gold/10 active:scale-95 transition-all shadow-sm"
                    >
                      <LayoutGrid className="w-4 h-4" /> {t(language, 'enter_office')}
                    </button>
                    <button 
                      onClick={() => setShowTariffForm(true)}
                      className="bg-brand-black text-white border border-white/10 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/5 active:scale-95 transition-all shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> {t(language, 'enter_tariff')}
                    </button>
                  </>
                )}
              </div>
            </div>

            {showOfficeForm && (
              <div className="mb-10 p-8 bg-brand-black rounded-[2.5rem] border border-white/10 animate-in slide-in-from-top duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-white">{targetMonth} uchun ofis va mobil ofis sotuvlarini kiritish</h3>
                  <button onClick={() => setShowOfficeForm(false)} className="p-2 text-white/30 hover:text-red-500 transition"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  {['Ucell', 'Uztelecom', 'Mobiuz', 'Beeline'].map(company => (
                    <div key={company} className="space-y-4 bg-brand-dark p-4 rounded-2xl border border-white/5 shadow-sm">
                      <h4 className="font-black text-white text-center border-b border-white/10 pb-2 mb-2">{company}</h4>
                      
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-white/30 uppercase tracking-widest pl-2">{t(language, 'office')} ({t(language, 'pcs')})</label>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-full p-3 border border-white/10 rounded-xl bg-brand-black text-white text-sm font-bold outline-none focus:border-brand-gold transition"
                          value={officeForm[company as keyof typeof officeForm]}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '' || (/^\d+$/.test(val) && val.length <= 7)) {
                              setOfficeForm({...officeForm, [company]: val});
                            }
                          }}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-white/30 uppercase tracking-widest pl-2">{t(language, 'mobile_office')} ({t(language, 'pcs')})</label>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-full p-3 border border-white/10 rounded-xl bg-brand-black text-white text-sm font-bold outline-none focus:border-brand-gold transition"
                          value={mobileOfficeForm[company as keyof typeof mobileOfficeForm]}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '' || (/^\d+$/.test(val) && val.length <= 7)) {
                              setMobileOfficeForm({...mobileOfficeForm, [company]: val});
                            }
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      const currentTargets = state.monthlyTargets?.find(t => t.month === targetMonth)?.targets || {
                        'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0
                      };
                      
                      const parsedOfficeForm: Record<string, number> = {};
                      Object.keys(officeForm).forEach(key => {
                        parsedOfficeForm[key] = parseInt(officeForm[key]) || 0;
                      });

                      const parsedMobileOfficeForm: Record<string, number> = {};
                      Object.keys(mobileOfficeForm).forEach(key => {
                        parsedMobileOfficeForm[key] = parseInt(mobileOfficeForm[key]) || 0;
                      });

                      setMonthlyTarget(targetMonth, currentTargets, parsedOfficeForm, parsedMobileOfficeForm);
                      setShowOfficeForm(false);
                    }}
                    className="flex-1 bg-brand-gold text-brand-black py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-gold/20 hover:bg-brand-gold/90 transition-all"
                  >
                    Saqlash
                  </button>
                  <button 
                    onClick={() => setShowOfficeForm(false)}
                    className="px-10 py-5 bg-white/5 border border-white/10 text-white/50 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 hover:text-white transition-all"
                  >
                    Bekor qilish
                  </button>
                </div>
              </div>
            )}

            {showTargetForm && (
              <div className="mb-10 p-8 bg-brand-black rounded-[2.5rem] border border-white/10 animate-in slide-in-from-top duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-white">{targetMonth} uchun {t(language, 'enter_plan').toLowerCase()}</h3>
                  <button onClick={() => setShowTargetForm(false)} className="p-2 text-white/30 hover:text-red-500 transition"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  {['Ucell', 'Uztelecom', 'Mobiuz', 'Beeline'].map(company => (
                    <div key={company} className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-2">{company} (dona)</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-full p-4 border border-white/10 rounded-2xl bg-brand-dark text-white text-sm font-bold outline-none focus:border-brand-gold transition"
                        value={targetForm[company as keyof typeof targetForm]}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '' || (/^\d+$/.test(val) && val.length <= 7)) {
                            setTargetForm({...targetForm, [company]: val});
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      const parsedTargetForm: Record<string, number> = {};
                      Object.keys(targetForm).forEach(key => {
                        parsedTargetForm[key] = parseInt(targetForm[key]) || 0;
                      });
                      setMonthlyTarget(targetMonth, parsedTargetForm);
                      setShowTargetForm(false);
                    }}
                    className="flex-1 bg-brand-gold text-brand-black py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-gold/20 hover:bg-brand-gold/90 transition-all"
                  >
                    Saqlash
                  </button>
                  <button 
                    onClick={() => setShowTargetForm(false)}
                    className="px-10 py-5 bg-white/5 border border-white/10 text-white/50 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 hover:text-white transition-all"
                  >
                    Bekor qilish
                  </button>
                </div>
              </div>
            )}

            {showTariffForm && (
              <div className="mb-10 p-8 bg-brand-black rounded-[2.5rem] border border-white/10 animate-in slide-in-from-top duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-white">Tariflar Kiritish</h3>
                  <button onClick={() => setShowTariffForm(false)} className="p-2 text-white/30 hover:text-red-500 transition"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div>
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-2 mb-1 block">Kompaniya</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenDropdown(openDropdown === 'tariffCompany' ? null : 'tariffCompany')}
                        className="w-full p-4 pr-10 border border-white/10 rounded-2xl bg-brand-dark text-sm font-bold outline-none focus:border-brand-gold transition text-white text-left flex items-center justify-between"
                      >
                        <span>{newTariff.company}</span>
                        <ChevronDown className={`w-5 h-5 text-white/40 transition-transform ${openDropdown === 'tariffCompany' ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {openDropdown === 'tariffCompany' && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)}></div>
                          <div className="absolute top-full left-0 right-0 mt-2 bg-brand-dark border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            {['Ucell', 'Uztelecom', 'Mobiuz', 'Beeline'].map((c) => (
                              <button
                                type="button"
                                key={c}
                                onClick={() => {
                                  setNewTariff({...newTariff, company: c});
                                  setOpenDropdown(null);
                                }}
                                className={`w-full text-left p-4 text-sm font-bold hover:bg-white/5 transition-colors ${newTariff.company === c ? 'text-brand-gold bg-brand-gold/10' : 'text-white'}`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-2 mb-1 block">Tarif Nomi</label>
                    <input 
                      type="text" 
                      className="w-full p-4 border border-white/10 rounded-2xl bg-brand-dark text-white text-sm font-bold outline-none focus:border-brand-gold transition"
                      placeholder="Masalan: 20GB"
                      value={newTariff.name}
                      onChange={e => setNewTariff({...newTariff, name: e.target.value})}
                    />
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={() => {
                        if (newTariff.name.trim()) {
                          addTariff(newTariff.company, newTariff.name.trim());
                          setNewTariff({...newTariff, name: ''});
                        }
                      }}
                      className="w-full bg-brand-gold text-brand-black p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-gold/20 hover:bg-brand-gold/90 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Qo'shish
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {['Ucell', 'Uztelecom', 'Mobiuz', 'Beeline'].map(company => (
                    <div key={company} className="bg-brand-dark p-4 rounded-2xl border border-white/5 shadow-sm">
                      <h4 className="font-black text-white text-center border-b border-white/10 pb-2 mb-4">{company}</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                        {state.tariffs?.[company]?.map((tariff, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-brand-black p-3 rounded-xl border border-white/5 group hover:border-white/10 transition-colors">
                            <span className="text-xs font-bold text-white/80">{tariff}</span>
                            <button 
                              onClick={() => removeTariff(company, tariff)}
                              className="text-white/20 hover:text-red-500 transition-colors p-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {(!state.tariffs?.[company] || state.tariffs[company].length === 0) && (
                          <p className="text-[10px] text-white/20 text-center italic py-4">Tariflar yo'q</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inventoryModalUser && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-brand-black rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-white">
                      {inventoryModalUser.firstName} {inventoryModalUser.lastName} - {t(language, 'sim_inventory')}
                    </h3>
                    <button onClick={() => setInventoryModalUser(null)} className="p-2 hover:bg-white/5 rounded-full transition"><X className="w-5 h-5 text-white/30" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {['Ucell', 'Uztelecom', 'Mobiuz', 'Beeline'].map(company => (
                      <div key={company} className="space-y-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-2">{company} (mavjud)</label>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-full p-4 border border-white/10 rounded-2xl bg-brand-dark text-white text-lg font-bold outline-none focus:border-brand-gold transition"
                          value={inventoryForm[company as keyof typeof inventoryForm]}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '' || (/^\d+$/.test(val) && val.length <= 7)) {
                              setInventoryForm({...inventoryForm, [company]: val});
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        const parsedInventoryForm: Record<string, number> = {};
                        Object.keys(inventoryForm).forEach(key => {
                          parsedInventoryForm[key] = parseInt(inventoryForm[key]) || 0;
                        });
                        updateUser(inventoryModalUser.id, { inventory: parsedInventoryForm });
                        setInventoryModalUser(null);
                      }}
                      className="flex-1 bg-brand-gold text-brand-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-brand-gold/20 hover:bg-brand-gold/90 transition-all"
                    >
                      Saqlash
                    </button>
                    <button 
                      onClick={() => setInventoryModalUser(null)}
                      className="px-8 py-4 bg-white/5 border border-white/10 text-white/50 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 hover:text-white transition-all"
                    >
                      Bekor qilish
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Ucell', color: 'bg-[#9b51e0]', textColor: 'text-[#9b51e0]' },
                { name: 'Uztelecom', color: 'bg-[#009ee0]', textColor: 'text-[#009ee0]' },
                { name: 'Mobiuz', color: 'bg-[#eb1c24]', textColor: 'text-[#eb1c24]' },
                { name: 'Beeline', color: 'bg-[#fdb913]', textColor: 'text-[#fdb913]' }
              ].map(company => {
                const target = state.monthlyTargets?.find(t => t.month === targetMonth)?.targets?.[company.name] || 0;
                const officeCount = state.monthlyTargets?.find(t => t.month === targetMonth)?.officeCounts?.[company.name] || 0;
                const mobileOfficeCount = state.monthlyTargets?.find(t => t.month === targetMonth)?.mobileOfficeCounts?.[company.name] || 0;
                const sales = state.sales.filter(s => s.company === company.name && s.date.startsWith(targetMonth)).reduce((sum, s) => sum + s.count + s.bonus, 0);
                const rawPercentage = target > 0 ? (sales / target) * 100 : 0;
                const percentage = Math.min(100, rawPercentage);
                
                return (
                  <div key={company.name} className="p-8 bg-brand-dark rounded-[2.5rem] border border-white/10 shadow-sm hover:border-brand-gold/30 hover:-translate-y-1 transition-all duration-500 group">
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-14 h-14 ${company.color} rounded-2xl shadow-lg flex items-center justify-center text-white keep-white group-hover:rotate-12 transition-transform`}>
                        <Smartphone className="w-7 h-7" />
                      </div>
                      <div className="text-right">
                        <p className={`text-3xl font-black ${company.textColor}`}>{formatLargeNumber(sales)}</p>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{t(language, 'sold')}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-white text-lg">{company.name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${sales >= target && target > 0 ? 'text-green-400 bg-green-400/10' : 'text-brand-gold bg-brand-gold/10'}`}>
                          {sales >= target && target > 0 ? 'Bajarildi' : t(language, 'in_progress')}
                        </span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full ${company.color} rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[9px] font-black text-white/30 uppercase tracking-widest">
                        <span>{formatLargeNumber(sales)} / {formatLargeNumber(target)}</span>
                        <span>{Math.round(rawPercentage)}%</span>
                      </div>
                      
                      <div className="pt-4 mt-4 border-t border-white/5 grid grid-cols-2 gap-2">
                        <div className="bg-brand-black p-2 rounded-xl text-center border border-white/5">
                          <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-0.5">{t(language, 'office')}</p>
                          <p className="text-sm font-black text-white">{formatLargeNumber(officeCount)}</p>
                        </div>
                        <div className="bg-brand-black p-2 rounded-xl text-center border border-white/5">
                          <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-0.5">{t(language, 'mobile_office')}</p>
                          <p className="text-sm font-black text-white">{formatLargeNumber(mobileOfficeCount)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-brand-dark p-10 rounded-[3rem] shadow-xl border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-white">{t(language, 'available_simcards')}</h3>
              <div className="bg-brand-gold/10 text-brand-gold px-4 py-2 rounded-xl font-black text-sm uppercase tracking-widest border border-brand-gold/20">
                {t(language, 'total')}: {formatLargeNumber(operators.reduce((acc: number, user: User) => acc + Object.values(user.inventory || {}).reduce((sum: number, count: any) => sum + Number(count), 0), 0))} {t(language, 'pcs')}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {operators.map(user => {
                const counts = user.inventory || {
                  'Ucell': 0,
                  'Mobiuz': 0,
                  'Beeline': 0,
                  'Uztelecom': 0
                };

                const totalSims = Object.values(counts).reduce((a: number, b: any) => a + Number(b), 0);

                return (
                  <div 
                    key={user.id} 
                    onClick={() => {
                      setInventoryModalUser(user);
                      setInventoryForm({
                        'Ucell': counts['Ucell'] || 0,
                        'Mobiuz': counts['Mobiuz'] || 0,
                        'Beeline': counts['Beeline'] || 0,
                        'Uztelecom': counts['Uztelecom'] || 0
                      });
                    }}
                    className="bg-brand-black p-6 rounded-[2rem] border border-white/10 shadow-sm hover:border-brand-gold/30 transition-all cursor-pointer group active:scale-95"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center font-black text-white overflow-hidden text-xl shadow-inner">
                          {user.photo ? (
                            <img src={user.photo} alt={user.firstName} className="w-full h-full object-cover" />
                          ) : (
                            <>{user.firstName?.[0]}{user.lastName?.[0]}</>
                          )}
                        </div>
                        <div>
                          <h4 className="text-2xl font-black text-white leading-none mb-1 group-hover:text-brand-gold transition-colors">{user.firstName} {user.lastName}</h4>
                          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{t(language, 'operator')}</p>
                        </div>
                      </div>
                      <div className="text-right bg-brand-gold/10 px-4 py-2 rounded-2xl border border-brand-gold/20 group-hover:bg-brand-gold group-hover:text-brand-black transition-colors">
                        <p className="text-2xl font-black text-brand-gold group-hover:text-brand-black">{formatLargeNumber(totalSims)}</p>
                        <p className="text-[8px] font-black text-brand-gold/70 uppercase tracking-widest group-hover:text-brand-black/70">{t(language, 'total')}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { name: 'Ucell', color: 'text-[#9b51e0]', bg: 'bg-[#9b51e0]/10', border: 'border-[#9b51e0]/20' },
                        { name: 'Uztelecom', color: 'text-[#009ee0]', bg: 'bg-[#009ee0]/10', border: 'border-[#009ee0]/20' },
                        { name: 'Mobiuz', color: 'text-[#eb1c24]', bg: 'bg-[#eb1c24]/10', border: 'border-[#eb1c24]/20' },
                        { name: 'Beeline', color: 'text-[#fdb913]', bg: 'bg-[#fdb913]/10', border: 'border-[#fdb913]/20' }
                      ].map(provider => (
                        <div key={provider.name} className={`p-4 rounded-2xl ${provider.bg} border ${provider.border}`}>
                          <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-2">{provider.name}</p>
                          <p className={`text-2xl font-black ${provider.color}`}>{formatLargeNumber(counts[provider.name as keyof typeof counts])} <span className="text-[10px] text-white/30 font-bold">dona</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
          {pendingUsers.map(u => (
            <div key={u.id} className="bg-brand-dark p-6 rounded-[2rem] border border-white/10 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-brand-gold/10 text-brand-gold rounded-2xl flex items-center justify-center font-black text-xl">{u.firstName?.[0]}</div>
                <div><h4 className="text-lg font-black text-white leading-none mb-1">{u.firstName} {u.lastName}</h4><p className="text-xs text-white/30 font-bold">{u.phone} • {u.role.replace('_', ' ')}</p></div>
              </div>
              <button onClick={() => approveUser(u.id)} className="p-4 bg-brand-gold text-brand-black rounded-2xl shadow-xl shadow-brand-gold/20 transition hover:bg-brand-gold/90"><CheckCircle className="w-6 h-6" /></button>
            </div>
          ))}
          {pendingUsers.length === 0 && <div className="text-center py-20 bg-brand-dark rounded-[2rem] border border-white/10 italic text-white/30 font-bold uppercase tracking-widest text-[10px]">Yangi so'rovlar mavjud emas</div>}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-brand-dark rounded-[2rem] border border-white/10 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-8 border-b border-white/5"><h2 className="text-xl font-black text-white">{t(language, 'all_daily_reports')}</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-brand-black text-white/30 text-[10px] font-black uppercase tracking-widest"><tr><th className="px-8 py-4">{t(language, 'employee')}</th><th className="px-8 py-4">{t(language, 'date')}</th><th className="px-8 py-4">{t(language, 'summary')}</th><th className="px-8 py-4 text-right">{t(language, 'time')}</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {state.reports.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((rep, idx) => {
                  const u = state.users.find(user => user.id === rep.userId);
                  return (
                    <tr 
                      key={idx} 
                      className="hover:bg-white/5 transition cursor-pointer group"
                      onClick={() => {
                        setSelectedUserId(rep.userId);
                        setSelectedDay(rep.date);
                        setChartTimeframe('week');
                      }}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-white/30 group-hover:bg-brand-gold group-hover:text-brand-black transition-colors">
                            {u?.firstName?.[0]}{u?.lastName?.[0]}
                          </div>
                          <span className="font-bold text-white">{u?.firstName} {u?.lastName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm text-white/30 font-medium">{rep.date}</td>
                      <td className="px-8 py-6 text-sm text-white/70 italic leading-relaxed truncate max-w-xs">"{rep.summary}"</td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className="text-[10px] font-black text-brand-gold bg-brand-gold/10 px-3 py-1 rounded-lg">
                            {formatUzTime(rep.timestamp)}
                          </span>
                          <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-brand-gold transition-colors" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'rating' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-[1400px] mx-auto py-8 px-4">
          {/* Header & Filters */}
          <div className="flex flex-col gap-6 border-b border-white/10 pb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-brand-gold font-bold text-[10px] uppercase tracking-[0.2em]">
                  <Trophy className="w-4 h-4" />
                  <span>Reyting</span>
                </div>
                <h2 className="text-4xl font-extrabold text-white tracking-tight">
                  Operatorlar <span className="text-brand-gold">Reytingi</span>
                </h2>
              </div>
              
              {/* Timeframe Filters */}
              <div className="flex flex-col gap-3 items-end">
                <div className="flex items-center gap-2 bg-brand-black p-1.5 rounded-2xl border border-white/10 overflow-x-auto">
                  {[
                    { id: 'today', label: 'Bugun' },
                    { id: 'week', label: 'Hafta' },
                    { id: 'month', label: 'Oy' },
                    { id: 'custom', label: 'Oraliq' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setRatingTimeframe(t.id as any)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${ratingTimeframe === t.id ? 'bg-brand-gold text-brand-black shadow-md' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Only show Saralash button if viewing current month or a non-month view */}
                  {/* If viewing a past month (offset < 0), hide or disable it */}
                  {(ratingTimeframe !== 'month' || ratingMonthOffset === 0) && (
                    <button 
                      onClick={() => setIsLeagueModalOpen(true)}
                      className="px-4 py-2 bg-brand-dark border border-white/10 rounded-xl text-white/60 hover:text-brand-gold hover:border-brand-gold/30 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                    >
                      <Trophy className="w-3 h-3" />
                      Saralash
                    </button>
                  )}

                  <button 
                    onClick={() => {
                      console.log("Recalculate button clicked");
                      if (calculateAchievements) {
                        calculateAchievements(true);
                      } else {
                        alert("Xatolik: Hisoblash funksiyasi topilmadi.");
                      }
                    }}
                    className="px-4 py-2 bg-brand-dark border border-white/10 rounded-xl text-white/60 hover:text-green-500 hover:border-green-500/30 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer"
                    title="O'tgan oy yutuqlarini qayta hisoblash"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Qayta hisoblash
                  </button>

                  {ratingTimeframe === 'month' && (
                    <div className="flex items-center gap-1 bg-brand-dark p-1 rounded-xl border border-white/5 shadow-sm">
                      <button 
                        onClick={() => {
                          const d = new Date();
                          d.setMonth(d.getMonth() + ratingMonthOffset - 1);
                          // Limit: Site started in Feb 2026
                          if (d.getFullYear() < 2026 || (d.getFullYear() === 2026 && d.getMonth() < 1)) return;
                          setRatingMonthOffset(prev => prev - 1);
                        }} 
                        className={`p-2 rounded-lg transition-colors ${(() => {
                          const d = new Date();
                          d.setMonth(d.getMonth() + ratingMonthOffset - 1);
                          const isDisabled = d.getFullYear() < 2026 || (d.getFullYear() === 2026 && d.getMonth() < 1);
                          return isDisabled ? 'text-white/10 cursor-not-allowed' : 'text-white/40 hover:text-brand-gold hover:bg-white/5';
                        })()}`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-black text-white/60 px-4 uppercase tracking-widest min-w-[120px] text-center">
                        {(() => {
                          const d = new Date();
                          d.setMonth(d.getMonth() + ratingMonthOffset);
                          const monthName = translations[language].month_names[d.getMonth()];
                          return `${monthName} ${d.getFullYear()}`;
                        })()}
                      </span>
                      <button 
                        onClick={() => {
                          if (ratingMonthOffset >= 0) return; // Limit: Cannot go to future months
                          setRatingMonthOffset(prev => prev + 1);
                        }} 
                        className={`p-2 rounded-lg transition-colors ${ratingMonthOffset >= 0 ? 'text-white/10 cursor-not-allowed' : 'text-white/40 hover:text-brand-gold hover:bg-white/5'}`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {ratingTimeframe === 'custom' && (
                    <div className="flex items-center gap-2">
                      <input type="date" value={ratingCustomStart} onChange={e => setRatingCustomStart(e.target.value)} className="bg-brand-black border border-white/10 text-white text-xs p-2 rounded-lg outline-none focus:border-brand-gold" />
                      <span className="text-white/40">-</span>
                      <input type="date" value={ratingCustomEnd} onChange={e => setRatingCustomEnd(e.target.value)} className="bg-brand-black border border-white/10 text-white text-xs p-2 rounded-lg outline-none focus:border-brand-gold" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {['overall', 'Ucell', 'Uztelecom', 'Mobiuz', 'Beeline'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setRatingMode(mode as any)}
                  className={`px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest whitespace-nowrap transition-all border ${ratingMode === mode ? 'bg-brand-gold/10 border-brand-gold text-brand-gold shadow-[0_0_15px_rgba(255,215,0,0.1)]' : 'bg-brand-black border-white/5 text-white/40 hover:text-white hover:bg-white/5'}`}
                >
                  {mode === 'overall' ? 'Umumiy' : mode}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            let startDate = new Date();
            let endDate = new Date();
            if (ratingTimeframe === 'today') {
              startDate = new Date(today);
              endDate = new Date(today);
            } else if (ratingTimeframe === 'week') {
              const d = new Date(today);
              const day = d.getDay();
              const diff = d.getDate() - day + (day === 0 ? -6 : 1);
              startDate = new Date(d.setDate(diff));
              endDate = new Date(startDate);
              endDate.setDate(endDate.getDate() + 6);
            } else if (ratingTimeframe === 'month') {
              const d = new Date();
              d.setMonth(d.getMonth() + ratingMonthOffset);
              startDate = new Date(d.getFullYear(), d.getMonth(), 1);
              endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            } else if (ratingTimeframe === 'custom') {
              startDate = new Date(ratingCustomStart);
              endDate = new Date(ratingCustomEnd);
            }
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

            const operatorRankings = state.users
              .filter(u => u.role !== 'manager')
              .map(u => {
                // Determine historical league based on endDate
                let historicalLeague = u.league || 'bronze';
                if (u.leagueHistory && u.leagueHistory.length > 0) {
                   const sorted = [...u.leagueHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                   const match = sorted.find(h => new Date(h.date) <= endDate);
                   if (match) {
                     historicalLeague = match.league;
                   } else {
                     // Before any history (and likely before creation), default to bronze
                     historicalLeague = 'bronze';
                   }
                }

                // Filter sales based on timeframe and mode
                const userSales = state.sales.filter(s => {
                  const saleDate = new Date(s.date);
                  // Reset time part to compare dates correctly
                  const sDate = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate());
                  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                  
                  const inRange = sDate >= start && sDate <= end;
                  
                  if (ratingMode === 'overall') return s.userId === u.id && inRange;
                  return s.userId === u.id && inRange && s.company === ratingMode;
                });

                const totalSales = userSales.reduce((acc, s) => acc + s.count + s.bonus, 0);
                return { ...u, sales: totalSales, historicalLeague };
              })
              .sort((a, b) => b.sales - a.sales);

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 items-start">
                {['gold', 'silver', 'bronze'].map((leagueName) => {
                  // Filter users belonging to this league using historical data
                  const groupUsers = operatorRankings.filter(u => {
                    const userLeague = u.historicalLeague;
                    return userLeague === leagueName;
                  });
                  
                  const leagueInfo = leagueName === 'gold' 
                    ? { color: 'text-yellow-400', bg: 'bg-yellow-400/10', title: "1 Gold", border: 'border-yellow-400/20' }
                    : leagueName === 'silver'
                    ? { color: 'text-gray-300', bg: 'bg-gray-300/10', title: "2 Silver", border: 'border-gray-300/20' }
                    : { color: 'text-orange-500', bg: 'bg-orange-500/10', title: "3 Bronza", border: 'border-orange-500/20' };

                  return (
                    <div key={leagueName} className={`bg-brand-dark rounded-[2rem] border ${leagueInfo.border} shadow-2xl overflow-hidden flex flex-col max-h-[800px]`}>
                      <div className={`px-6 py-5 border-b border-white/10 flex items-center justify-between ${leagueInfo.bg}`}>
                        <div className="flex items-center gap-3">
                          <Trophy className={`w-5 h-5 ${leagueInfo.color}`} />
                          <span className={`text-sm font-black uppercase tracking-[0.2em] ${leagueInfo.color}`}>{leagueInfo.title}</span>
                        </div>
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{groupUsers.length} ta operator</span>
                      </div>
                      <div className="divide-y divide-white/5 flex-1 overflow-y-auto">
                        {groupUsers.length === 0 ? (
                          <div className="p-8 text-center text-white/20 text-xs font-bold uppercase tracking-widest">Operatorlar yo'q</div>
                        ) : groupUsers.map((u, idx) => {
                          return (
                            <div key={u.id} className={`px-6 py-5 flex items-center justify-between hover:bg-white/5 transition-colors group`}>
                              <div className="flex items-center gap-4">
                                <span className="w-5 text-center font-bold text-white/20 group-hover:text-brand-gold transition-colors">{idx + 1}</span>
                                <div className="w-10 h-10 rounded-xl bg-brand-black border border-white/5 flex items-center justify-center font-bold text-white/20 text-xs group-hover:scale-110 group-hover:bg-brand-dark transition-all overflow-hidden">
                                  {u.photo ? <img src={u.photo} alt={u.firstName} className="w-full h-full object-cover" /> : <>{u.firstName?.[0]}{u.lastName?.[0]}</>}
                                </div>
                                <div>
                                  <p className="font-bold text-white flex items-center gap-2 text-sm">
                                    {u.firstName} {u.lastName}
                                  </p>
                                  <p className="text-[9px] font-medium text-white/40">{u.department || 'Bo\'limsiz'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right min-w-[50px]">
                                  <p className="text-base font-black text-white">{u.sales}</p>
                                  <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Sotuv</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {isLeagueModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center animate-in fade-in duration-300 p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setIsLeagueModalOpen(false)}></div>
              <div className="bg-brand-black w-full max-w-5xl rounded-[2rem] shadow-2xl relative z-10 overflow-hidden flex flex-col border border-white/10 max-h-[90vh]">
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-brand-dark">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-brand-gold" /> Operatorlarni Saralash
                  </h2>
                  <button onClick={() => setIsLeagueModalOpen(false)} className="p-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                  {/* Form */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="space-y-2 relative">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Liga (Bo'lim)</label>
                      <button 
                        onClick={() => {
                          setIsLeagueDropdownOpen(!isLeagueDropdownOpen);
                          setIsOperatorDropdownOpen(false);
                        }}
                        className={`w-full p-4 bg-brand-dark border ${isLeagueDropdownOpen ? 'border-brand-gold ring-1 ring-brand-gold/50' : 'border-white/10'} rounded-xl text-sm font-bold text-white flex items-center justify-between transition-all hover:border-white/20`}
                      >
                        <span className="capitalize">{leagueForm.league}</span>
                        <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${isLeagueDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isLeagueDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-brand-black border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                          {['gold', 'silver', 'bronze'].map((league) => (
                            <button
                              key={league}
                              onClick={() => {
                                setLeagueForm({...leagueForm, league: league as any});
                                setIsLeagueDropdownOpen(false);
                              }}
                              className={`w-full p-3 text-left text-sm font-bold capitalize transition-colors flex items-center justify-between ${leagueForm.league === league ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                            >
                              {league}
                              {leagueForm.league === league && <Check className="w-4 h-4" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2 relative">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Operator</label>
                      <button 
                        onClick={() => {
                          setIsOperatorDropdownOpen(!isOperatorDropdownOpen);
                          setIsLeagueDropdownOpen(false);
                        }}
                        className={`w-full p-4 bg-brand-dark border ${isOperatorDropdownOpen ? 'border-brand-gold ring-1 ring-brand-gold/50' : 'border-white/10'} rounded-xl text-sm font-bold text-white flex items-center justify-between transition-all hover:border-white/20`}
                      >
                        <span className={leagueForm.userId ? 'text-white' : 'text-white/30'}>
                          {leagueForm.userId 
                            ? operators.find(op => op.id === leagueForm.userId)?.firstName + ' ' + operators.find(op => op.id === leagueForm.userId)?.lastName 
                            : 'Tanlang...'}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${isOperatorDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isOperatorDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-brand-black border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto custom-scrollbar">
                          {operators.filter(op => !op.league).map(op => (
                            <button
                              key={op.id}
                              onClick={() => {
                                setLeagueForm(prev => ({ ...prev, userId: op.id }));
                                setIsOperatorDropdownOpen(false);
                              }}
                              className={`w-full p-3 text-left text-sm font-bold transition-colors flex items-center justify-between ${leagueForm.userId === op.id ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                            >
                              <span>{op.firstName} {op.lastName}</span>
                              {leagueForm.userId === op.id && <Check className="w-4 h-4" />}
                            </button>
                          ))}
                          {operators.filter(op => !op.league).length === 0 && (
                            <div className="p-4 text-center text-white/30 text-xs italic">Barcha operatorlar allaqachon biriktirilgan</div>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        if (!leagueForm.userId) return alert("Operatorni tanlang");
                        const user = operators.find(u => u.id === leagueForm.userId);
                        if (user) {
                          let history = user.leagueHistory || [];
                          // If no history exists but user has a league, backfill it starting from creation date
                          if (history.length === 0 && user.league) {
                            history = [{ league: user.league, date: user.createdAt }];
                          }
                          const newHistory = [...history, { league: leagueForm.league, date: new Date().toISOString() }];
                          // @ts-ignore
                          updateUser(leagueForm.userId, { league: leagueForm.league, leagueHistory: newHistory });
                        }
                        setLeagueForm(prev => ({ ...prev, userId: '' }));
                        setIsLeagueDropdownOpen(false);
                        setIsOperatorDropdownOpen(false);
                      }}
                      className="w-full py-4 gold-gradient text-brand-black rounded-xl text-sm font-black uppercase tracking-widest hover:scale-[1.02] transition shadow-lg shadow-brand-gold/20 flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Qo'shish
                    </button>
                  </div>

                  {/* Lists */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-white/5">
                    {['gold', 'silver', 'bronze'].map(league => {
                      const leagueUsers = operators.filter(u => u.league === league);
                      const color = league === 'gold' ? 'text-yellow-400' : league === 'silver' ? 'text-gray-300' : 'text-orange-500';
                      const bg = league === 'gold' ? 'bg-yellow-400/5 border-yellow-400/10' : league === 'silver' ? 'bg-gray-300/5 border-gray-300/10' : 'bg-orange-500/5 border-orange-500/10';

                      return (
                        <div key={league} className={`rounded-2xl border ${bg} overflow-hidden flex flex-col`}>
                          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-brand-black/20">
                            <span className={`text-xs font-black uppercase tracking-widest ${color}`}>{league}</span>
                            <span className="text-[10px] font-bold text-white/30">{leagueUsers.length} ta</span>
                          </div>
                          <div className="p-2 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {leagueUsers.length === 0 ? (
                              <div className="text-center py-8 text-white/20 text-[10px] font-bold uppercase tracking-widest italic">Bo'sh</div>
                            ) : leagueUsers.map(u => (
                              <div key={u.id} className="p-3 bg-brand-black rounded-xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-white/40">
                                    {u.firstName[0]}{u.lastName[0]}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-white">{u.firstName} {u.lastName}</p>
                                    <p className="text-[9px] text-white/30">{u.phone}</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => {
                                    let history = u.leagueHistory || [];
                                    // If no history exists but user has a league, backfill it starting from creation date
                                    if (history.length === 0 && u.league) {
                                      history = [{ league: u.league, date: u.createdAt }];
                                    }
                                    const newHistory = [...history, { league: 'bronze' as const, date: new Date().toISOString() }];
                                    // @ts-ignore
                                    updateUser(u.id, { league: undefined, leagueHistory: newHistory });
                                  }}
                                  className="p-1.5 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                  title="O'chirish"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {isWorkPointModalOpen && (
        <div className="fixed inset-0 bg-brand-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-brand-dark w-[95vw] h-[95vh] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-br from-brand-gold/10 to-transparent shrink-0">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Ish nuqtasini kiritish</h3>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Operator uchun xaritadan nuqta belgilang</p>
              </div>
              <button 
                onClick={() => {
                  setIsWorkPointModalOpen(false);
                  setWorkPointForm({ userId: '', location: null, radius: 200 });
                }}
                className="p-3 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 gap-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Operatorni tanlang</label>
                  <button 
                    onClick={() => setIsWorkPointOperatorDropdownOpen(!isWorkPointOperatorDropdownOpen)}
                    className={`w-full p-4 bg-brand-black border ${isWorkPointOperatorDropdownOpen ? 'border-brand-gold ring-1 ring-brand-gold/50' : 'border-white/10'} rounded-2xl text-sm font-bold text-white flex items-center justify-between transition-all hover:border-white/20`}
                  >
                    <span className={workPointForm.userId ? 'text-white' : 'text-white/30'}>
                      {workPointForm.userId 
                        ? operators.find(op => op.id === workPointForm.userId)?.firstName + ' ' + operators.find(op => op.id === workPointForm.userId)?.lastName 
                        : 'Operatorni tanlang...'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${isWorkPointOperatorDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isWorkPointOperatorDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-brand-black border border-white/10 rounded-2xl shadow-2xl z-[110] overflow-hidden animate-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto custom-scrollbar">
                      {operators.map(op => (
                        <button
                          key={op.id}
                          onClick={() => {
                            setWorkPointForm({ 
                              userId: op.id, 
                              location: op.workLocation ? { lat: op.workLocation.lat, lng: op.workLocation.lng } : null,
                              radius: op.workRadius || 200,
                              workType: op.workType || 'office'
                            });
                            setIsWorkPointOperatorDropdownOpen(false);
                          }}
                          className={`w-full p-4 text-left text-sm font-bold transition-colors flex items-center justify-between ${workPointForm.userId === op.id ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-white/40">
                              {op.firstName[0]}{op.lastName[0]}
                            </div>
                            <span>{op.firstName} {op.lastName}</span>
                          </div>
                          {workPointForm.userId === op.id && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Radius (metr)</label>
                  <input
                    type="number"
                    value={workPointForm.radius}
                    onChange={(e) => setWorkPointForm(prev => ({ ...prev, radius: parseInt(e.target.value) || 0 }))}
                    className="w-full p-4 bg-brand-black border border-white/10 rounded-2xl text-sm font-bold text-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/50 transition-all outline-none"
                    placeholder="Masalan: 200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Bo'limni tanlang</label>
                  <select
                    value={workPointForm.workType}
                    onChange={(e) => setWorkPointForm(prev => ({ ...prev, workType: e.target.value as 'office' | 'mobile' | 'desk' }))}
                    className="w-full p-4 bg-brand-black border border-white/10 rounded-2xl text-sm font-bold text-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/50 transition-all outline-none appearance-none"
                  >
                    <option value="office">Ofis</option>
                    <option value="mobile">Mobil ofis</option>
                    <option value="desk">Stolda</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 flex-1 min-h-[400px] flex flex-col">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Xaritadan nuqtani belgilang</label>
                <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 relative">
                  <MapPicker 
                    lat={workPointForm.location?.lat || 0} 
                    lng={workPointForm.location?.lng || 0} 
                    onChange={(lat, lng) => setWorkPointForm(prev => ({ ...prev, location: { lat, lng } }))}
                    className="absolute inset-0 h-full w-full m-0 rounded-none border-none"
                    workType={workPointForm.workType}
                    radius={workPointForm.radius}
                  />
                </div>
                {workPointForm.location && (
                  <p className="text-[10px] font-bold text-brand-gold uppercase tracking-widest mt-2">
                    Tanlangan: {workPointForm.location.lat.toFixed(6)}, {workPointForm.location.lng.toFixed(6)}
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  if (!workPointForm.userId) return alert("Operatorni tanlang");
                  if (!workPointForm.location) return alert("Xaritadan nuqtani belgilang");
                  if (workPointForm.radius <= 0) return alert("Radius noldan katta bo'lishi kerak");
                  
                  updateUser(workPointForm.userId, { 
                    workLocation: workPointForm.location,
                    workRadius: workPointForm.radius,
                    workType: workPointForm.workType
                  });
                  
                  setIsWorkPointModalOpen(false);
                  setWorkPointForm({ userId: '', location: null, radius: 200, workType: 'office' });
                  alert("Ish nuqtasi muvaffaqiyatli saqlandi!");
                }}
                className="w-full py-5 gold-gradient text-brand-black rounded-[1.5rem] text-sm font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition shadow-xl shadow-brand-gold/20 flex items-center justify-center gap-2 shrink-0"
              >
                <CheckCircle className="w-5 h-5" /> Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        
        /* DANGER: Global Overrides for Chart Black Borders */
        .recharts-wrapper, .recharts-surface, .recharts-container {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        .recharts-wrapper:focus, .recharts-wrapper:active, .recharts-wrapper * {
          outline: none !important;
          -webkit-tap-highlight-color: transparent;
        }
        .recharts-cartesian-grid-horizontal line, .recharts-cartesian-grid-vertical line {
          stroke: rgba(255,255,255,0.05) !important;
        }
        .recharts-cartesian-axis-line {
          display: none !important;
        }
        .chart-wrapper svg {
          overflow: visible !important;
        }

        /* MODERN MAP MARKER V2 STYLES */
        .map-marker-v2-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 36px;
          height: 46px;
          filter: drop-shadow(0 8px 12px rgba(0,0,0,0.25));
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .map-marker-v2-container:hover {
          transform: translateY(-4px) scale(1.1);
          z-index: 1000 !important;
        }
        .map-marker-v2-pin {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #D4AF37;
          background: #0A0A0A;
          color: #D4AF37;
          position: relative;
          z-index: 2;
        }
        .map-marker-v2-initials {
          font-weight: 900;
          font-size: 11px;
          letter-spacing: -0.02em;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .map-marker-v2-arrow {
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid #D4AF37;
          margin-top: -2px;
          position: relative;
          z-index: 1;
        }
        .late-badge-v2 {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 16px;
          height: 16px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 10px;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
          z-index: 3;
        }
        .marker-pulse-v2::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #D4AF37;
          opacity: 0.4;
          animation: markerPulseV2 2s infinite;
          z-index: 0;
        }
        @keyframes markerPulseV2 {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .marker-late-v2 {
          background: #ef4444 !important;
          border-radius: 50%;
        }

        /* SINGLE MAP TEAR PIN */
        .map-marker-pin-tear {
          width: 40px;
          height: 40px;
          background: #D4AF37;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #0A0A0A;
          box-shadow: 0 10px 25px rgba(212, 175, 55, 0.4);
        }
        .pin-initials {
          transform: rotate(45deg);
          color: #0A0A0A;
          font-weight: 900;
          font-size: 12px;
          letter-spacing: -0.01em;
        }
        .map-custom-tooltip {
          background: #1A1A1A;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          box-shadow: 0 15px 35px -5px rgba(0,0,0,0.5);
          padding: 0;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-brand-dark p-6 rounded-[2.5rem] border border-white/10 flex items-center justify-between shadow-xl hover:-translate-y-1 transition-all group">
    <div><p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">{label}</p><p className="text-3xl font-black text-white leading-none">{value}</p></div>
    <div className={`${color} text-white keep-white p-5 rounded-2xl shadow-2xl transition-all group-hover:scale-110 group-hover:rotate-6`}>{React.cloneElement(icon, { className: 'w-7 h-7' })}</div>
  </div>
);

const RefinedStatCard = ({ label, value, icon, color, onClick, isActive }: any) => (
  <div 
    onClick={onClick}
    className={`bg-brand-dark p-5 rounded-2xl border-2 transition-all ${onClick ? 'cursor-pointer active:scale-95' : ''} ${isActive ? 'ring-4 ring-brand-gold/10 border-brand-gold shadow-xl' : 'border-white/10 shadow-sm hover:border-brand-gold/30'}`}
  >
    <div className="flex items-center gap-4">
      <div className={`${color} text-white p-3 rounded-xl shadow-md`}>{React.cloneElement(icon, { className: 'w-5 h-5' })}</div>
      <div>
        <p className={`text-[8px] font-black uppercase tracking-widest mb-0.5 ${isActive ? 'text-brand-gold' : 'text-white/40'}`}>{label}</p>
        <p className="text-lg font-black text-white truncate max-w-[100px]">{value}</p>
      </div>
    </div>
  </div>
);

export default ManagerPanel;
