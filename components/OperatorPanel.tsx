
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, AppState, CheckIn, SimSale, DailyReport, Achievement } from '../types';
import { Camera, MapPin, CheckCircle2, Send, Plus, History, Trash2, Smartphone, Upload, Image as ImageIcon, TrendingUp, Loader2, Edit3, AlertTriangle, RefreshCw, LogIn, LogOut, X, Trophy, Activity, ChevronLeft, ChevronRight, RotateCcw, BarChart3, Calendar, PlusCircle, Edit, Check, Users, ChevronDown } from 'lucide-react';
import { getTodayStr, isDateMatch, getLatenessStatus, getUzTime, formatUzTime, formatUzDateTime, calculateDistance } from '../utils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, Legend, LabelList } from 'recharts';
import { t, Language, translations } from '../translations';

const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const getIcon = (type: string) => {
    switch (type) {
      case 'gold': return <Trophy className="w-10 h-10 text-yellow-400 drop-shadow-lg" />;
      case 'silver': return <Trophy className="w-10 h-10 text-gray-300 drop-shadow-lg" />;
      case 'bronze': return <Trophy className="w-10 h-10 text-amber-700 drop-shadow-lg" />;
      default: return <Trophy className="w-10 h-10 text-brand-gold" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'gold': return 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 border-yellow-500/30 shadow-yellow-500/10';
      case 'silver': return 'bg-gradient-to-br from-gray-400/20 to-gray-500/5 border-gray-400/30 shadow-gray-400/10';
      case 'bronze': return 'bg-gradient-to-br from-amber-700/20 to-amber-800/5 border-amber-700/30 shadow-amber-700/10';
      default: return 'bg-brand-gold/20 border-brand-gold/30';
    }
  };

  const getTitleColor = (type: string) => {
    switch (type) {
      case 'gold': return 'text-yellow-400';
      case 'silver': return 'text-gray-300';
      case 'bronze': return 'text-amber-600';
      default: return 'text-brand-gold';
    }
  };

  return (
    <div 
      className="relative w-full h-64 cursor-pointer perspective-1000 group"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        {/* Front */}
        <div className={`absolute inset-0 w-full h-full backface-hidden rounded-[2rem] border ${getBgColor(achievement.type)} backdrop-blur-sm p-6 flex flex-col items-center justify-center gap-4 shadow-2xl hover:scale-[1.02] transition-transform ${isFlipped ? 'z-0' : 'z-10'}`}>
          <div className={`p-5 rounded-full bg-white/5 border border-white/5 shadow-inner`}>
            {getIcon(achievement.type)}
          </div>
          <div className="text-center space-y-1">
            <h3 className={`text-2xl font-black uppercase tracking-tight ${getTitleColor(achievement.type)}`}>{achievement.title}</h3>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Batafsil ko'rish</p>
          </div>
        </div>

        {/* Back */}
        <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-[2rem] border border-white/10 bg-brand-black p-8 flex flex-col items-center justify-center text-center gap-4 shadow-2xl ${isFlipped ? 'z-10' : 'z-0'}`}>
          <p className="text-sm font-bold text-white/80 leading-relaxed">{achievement.reason}</p>
          <div className="mt-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[10px] font-black text-brand-gold uppercase tracking-widest">{achievement.date}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface OperatorPanelProps {
  user: User;
  state: AppState;
  addCheckIn: (checkIn: CheckIn) => void;
  updateCheckIn: (userId: string, date: string, updates: Partial<CheckIn>) => void;
  updateReport: (userId: string, date: string, updates: Partial<DailyReport>) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  addSale: (sale: SimSale) => void;
  removeSale: (saleId: string) => void;
  updateSale: (saleId: string, updates: Partial<SimSale>) => void;
  addReport: (report: DailyReport) => void;
  addSimInventory: (company: string, count: number) => void;
  addMessage: (text: string) => void;
  markMessageAsRead: (messageId: string) => void;
  activeTab: string;
  language: 'uz' | 'ru' | 'en';
}

const OperatorPanel: React.FC<OperatorPanelProps> = ({ user, state, addCheckIn, updateCheckIn, updateReport, updateUser, addSale, removeSale, updateSale, addReport, addSimInventory, addMessage, markMessageAsRead, activeTab, language }) => {
  const formatLargeNumber = (val: any) => {
    const num = Number(val);
    if (isNaN(num)) return '0';
    if (num > 999999999) return '999M+';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    return Math.round(num).toLocaleString('uz-UZ');
  };

  const today = getTodayStr();
  const targetMonth = today.substring(0, 7);
  const monthlyTarget = state.monthlyTargets.find(t => t.month === targetMonth);
  const userSales = state.sales.filter(s => s.userId === user.id);
  const totalTarget = monthlyTarget ? Object.values(monthlyTarget.targets).reduce((sum: number, t: any) => sum + Number(t), 0) : 0;
  const totalSales = userSales
    .filter(s => s.date.startsWith(targetMonth))
    .reduce((sum, s) => sum + s.count + s.bonus, 0);
  const percentage = Number(totalTarget) > 0 ? Math.min(100, (totalSales / Number(totalTarget)) * 100) : 0;

  const userCheckIn = state.checkIns.find(c => c.userId === user.id && isDateMatch(c.timestamp, today));
  const hasCheckedIn = !!userCheckIn;
  const currentReport = state.reports.find(r => r.userId === user.id && r.date === today);
  const hasReported = !!currentReport;

  const [isEditingCheckIn, setIsEditingCheckIn] = useState(false);
  const [editingTime, setEditingTime] = useState<{ type: 'checkIn' | 'checkOut', current: string } | null>(null);
  const [newTime, setNewTime] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [reportPhotos, setReportPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [reportText, setReportText] = useState('');
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);
  const [showSimEntryForm, setShowSimEntryForm] = useState(false);
  const [newSimEntry, setNewSimEntry] = useState({ company: 'Ucell', count: '1' });
  const [newSale, setNewSale] = useState({ company: 'Ucell', tariff: '', count: '1', bonus: '0' });
  const [openDropdown, setOpenDropdown] = useState<'company' | 'tariff' | 'simCompany' | null>(null);
  const [ratingMode, setRatingMode] = useState<'overall' | 'Ucell' | 'Uztelecom' | 'Mobiuz' | 'Beeline'>('overall');
  const [ratingTimeframe, setRatingTimeframe] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [ratingCustomStart, setRatingCustomStart] = useState(today);
  const [ratingCustomEnd, setRatingCustomEnd] = useState(today);
  const [ratingMonthOffset, setRatingMonthOffset] = useState(0);
  const [monitoringTimeframe, setMonitoringTimeframe] = useState<'week' | 'month' | 'year'>('week');
  const [monitoringWeekOffset, setMonitoringWeekOffset] = useState(0);
  const [monitoringMonthOffset, setMonitoringMonthOffset] = useState(0);
  const [monitoringYear, setMonitoringYear] = useState(getUzTime().getFullYear());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedTargetMonth, setSelectedTargetMonth] = useState(today.substring(0, 7));
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportPhotoInputRef = useRef<HTMLInputElement>(null);

  const [showCheckInUI, setShowCheckInUI] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    password: user.password,
    photo: user.photo
  });
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const [isEditingReport, setIsEditingReport] = useState(false);
  const [isSendMessageModalOpen, setIsSendMessageModalOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSimRequestModalOpen, setIsSimRequestModalOpen] = useState(false);
  const [simRequestText, setSimRequestText] = useState('');

  useEffect(() => {
    if (isEditingReport && currentReport) {
      setReportText(currentReport.summary);
      setReportPhotos(currentReport.photos || []);
    }
  }, [isEditingReport, currentReport]);

  const refreshLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLocating(false);
        },
        (err) => {
          setIsLocating(false);
          alert("Joylashuv aniqlanmadi. GPS yoniqligini tekshiring.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  useEffect(() => {
    if (!hasCheckedIn && showCheckInUI) refreshLocation();
    if (isEditingCheckIn && userCheckIn) {
      setCapturedPhoto(userCheckIn.photo);
      setLocation(userCheckIn.location);
    }
  }, [hasCheckedIn, showCheckInUI, isEditingCheckIn, userCheckIn]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCapturedPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleReportPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setReportPhotos(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input value so same file can be uploaded again if needed
    e.target.value = '';
  };

  const removeReportPhoto = (index: number) => {
    setReportPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheckOut = () => {
    updateCheckIn(user.id, today, { checkOutTime: getUzTime().toISOString() });
  };

  const handleCheckInAction = () => {
    if (capturedPhoto && location) {
      // Geofencing check
      if (user.workLocation && user.workLocation.lat && user.workLocation.lng) {
        const distance = calculateDistance(
          location.lat, 
          location.lng, 
          user.workLocation.lat, 
          user.workLocation.lng
        );
        
        if (distance > 300) {
          alert(`Siz ish nuqtasidan juda uzoqdasiz (${Math.round(distance)}m). Ishni boshlash uchun 300 metr radiusda bo'lishingiz kerak.`);
          return;
        }
      }

      if (isEditingCheckIn) {
        updateCheckIn(user.id, today, { location, photo: capturedPhoto });
        setIsEditingCheckIn(false);
      } else {
        addCheckIn({
          userId: user.id,
          timestamp: new Date().toISOString(),
          date: today,
          location,
          photo: capturedPhoto,
          workingHours: user.workingHours
        });
      }
    } else {
      alert("Iltimos, rasm yuklang va joylashuvni kiting.");
    }
  };

  const todaySales = useMemo(() => state.sales.filter(s => s.userId === user.id && s.date === today), [state.sales, user.id, today]);

  const dailySalesByOperator = useMemo(() => {
    const operatorSales: { [key: string]: number } = {
      'Ucell': 0,
      'Mobiuz': 0,
      'Beeline': 0,
      'Uztelecom': 0,
    };

    todaySales.forEach(sale => {
      if (operatorSales[sale.company] !== undefined) {
        operatorSales[sale.company] += (sale.count + sale.bonus);
      }
    });
    return operatorSales;
  }, [todaySales]);

  const lateness = useMemo(() => {
    if (!userCheckIn) return null;
    const wh = userCheckIn.workingHours || user.workingHours;
    return getLatenessStatus(userCheckIn.timestamp, wh);
  }, [userCheckIn, user.workingHours]);

  const distanceToWorkPoint = useMemo(() => {
    if (location && user.workLocation && user.workLocation.lat && user.workLocation.lng) {
      return calculateDistance(location.lat, location.lng, user.workLocation.lat, user.workLocation.lng);
    }
    return null;
  }, [location, user.workLocation]);

  const getWorkingTimes = () => {
    const wh = userCheckIn?.workingHours || user.workingHours || '09:00-18:00';
    const [start, end] = wh.split('-');
    return { start, end };
  };

  const renderCheckInForm = () => (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-brand-dark rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-500">
        <div className="p-12 text-center border-b border-white/10 bg-gradient-to-br from-brand-gold/10 to-brand-gold/5">
          <h2 className="text-3xl font-black text-brand-gold tracking-tight uppercase">{isEditingCheckIn ? "Ma'lumotlarni yangilash" : "Xush kelibsiz!"}</h2>
          <p className="text-white/40 mt-3 font-medium">Ishni boshlash uchun rasm va manzilingizni yuboring.</p>
        </div>
        <div className="p-10 space-y-8">
          <div onClick={() => fileInputRef.current?.click()} className="aspect-video bg-white/5 rounded-[2.5rem] overflow-hidden relative border-4 border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:border-brand-gold/30 transition-all">
            {capturedPhoto ? <img src={capturedPhoto} className="w-full h-full object-cover" /> : (
              <div className="text-center">
                <Camera className="w-16 h-16 text-white/10 mx-auto mb-4" />
                <p className="text-white/20 font-black uppercase text-[10px] tracking-widest">Ish joyidan rasm yuklang</p>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
          </div>
          <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-xl ${isLocating ? 'bg-brand-gold/10 text-brand-gold animate-pulse' : 'bg-green-500/10 text-green-500'}`}><MapPin className="w-6 h-6" /></div>
              <div>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{isLocating ? 'Aniqlanmoqda...' : 'Joylashuv'}</p>
                <p className="text-lg font-black text-white">{location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : 'Kutilmoqda...'}</p>
              </div>
            </div>
            {!isEditingCheckIn && (
              <button onClick={refreshLocation} disabled={isLocating} className="p-3.5 bg-white/5 text-brand-gold rounded-xl shadow-sm border border-white/10 hover:rotate-180 transition-all duration-700">
                <RefreshCw className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          {distanceToWorkPoint !== null && distanceToWorkPoint > 300 && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                Siz ish nuqtasidan uzoqdasiz ({Math.round(distanceToWorkPoint)}m). 300m radiusga kiring!
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <button 
              onClick={handleCheckInAction} 
              disabled={!location || isLocating || !capturedPhoto || (distanceToWorkPoint !== null && distanceToWorkPoint > 300)} 
              className="flex-1 py-6 gold-gradient text-brand-black rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-gold/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all"
            >
              {isEditingCheckIn ? "Saqlash" : "Ishni boshlash"}
            </button>
            {(isEditingCheckIn || (!hasCheckedIn && showCheckInUI)) && (
              <button 
                onClick={() => {
                  setIsEditingCheckIn(false);
                  setShowCheckInUI(false);
                }} 
                className="px-10 py-6 bg-white/5 border border-white/10 text-white/40 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
              >
                Bekor qilish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return `+${phoneNumber}`;
    if (phoneNumberLength < 6) {
      return `+${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3)}`;
    }
    if (phoneNumberLength < 9) {
      return `+${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 5)} ${phoneNumber.slice(5)}`;
    }
    if (phoneNumberLength < 11) {
      return `+${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 5)} ${phoneNumber.slice(5, 8)} ${phoneNumber.slice(8)}`;
    }
    return `+${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 5)} ${phoneNumber.slice(5, 8)} ${phoneNumber.slice(8, 10)} ${phoneNumber.slice(10, 12)}`;
  };

  const last30Days = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }, []);

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
        const daySales = state.sales.filter(s => s.userId === user.id && s.date === dateStr);
        const simcards = daySales.reduce((sum, s) => sum + s.count, 0);
        const bonuses = daySales.reduce((sum, s) => sum + s.bonus, 0);
        data.push({ 
          name: uzDays[current.getDay()], 
          simcards,
          bonuses,
          fullDate: dateStr
        });
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
        const daySales = state.sales.filter(s => s.userId === user.id && s.date === dateStr);
        const simcards = daySales.reduce((sum, s) => sum + s.count, 0);
        const bonuses = daySales.reduce((sum, s) => sum + s.bonus, 0);
        data.push({ name: i.toString(), simcards, bonuses, fullDate: dateStr });
      }
    } else if (monitoringTimeframe === 'year') {
      for (let m = 0; m < 12; m++) {
        const monthNum = m + 1;
        const monthPrefix = `${monitoringYear}-${String(monthNum).padStart(2, '0')}`;
        const monthSales = state.sales.filter(s => s.userId === user.id && s.date.startsWith(monthPrefix));
        const simcards = monthSales.reduce((sum, s) => sum + s.count, 0);
        const bonuses = monthSales.reduce((sum, s) => sum + s.bonus, 0);
        const monthNames = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
        data.push({ name: monthNames[m], simcards, bonuses, fullDate: monthPrefix });
      }
    }
    return data;
  }, [monitoringTimeframe, monitoringWeekOffset, monitoringMonthOffset, monitoringYear, state.sales, user.id]);

  const monitoringTotals = useMemo(() => {
    const totalSimcards = monitoringChartData.reduce((sum, item) => sum + (item.simcards || 0), 0);
    const totalBonuses = monitoringChartData.reduce((sum, item) => sum + (item.bonuses || 0), 0);
    return { totalSimcards, totalBonuses };
  }, [monitoringChartData]);

  const monitoringTotalMonthlySales = useMemo(() => state.sales
    .filter(s => s.userId === user.id && new Date(s.date) >= last30Days)
    .reduce((acc, s) => acc + s.count + s.bonus, 0), [state.sales, user.id, last30Days]);

  const monitoringOnTimeCheckIns = useMemo(() => state.checkIns
    .filter(c => c.userId === user.id && new Date(c.timestamp) >= last30Days)
    .filter(c => !getLatenessStatus(c.timestamp, user.workingHours)).length, [state.checkIns, user.id, user.workingHours, last30Days]);
  
  const monitoringTotalCheckIns = useMemo(() => state.checkIns
    .filter(c => c.userId === user.id && new Date(c.timestamp) >= last30Days).length, [state.checkIns, user.id, last30Days]);
  
  const monitoringPunctualityRate = monitoringTotalCheckIns > 0 ? Math.round((monitoringOnTimeCheckIns / monitoringTotalCheckIns) * 100) : 100;

  const monitoringPeriodTotals = useMemo(() => {
    let filteredSales = state.sales.filter(s => s.userId === user.id);
    
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
    
    const totals: Record<string, number> = { 'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0 };
    filteredSales.forEach(s => {
      if (totals[s.company] !== undefined) {
        totals[s.company] += s.count + s.bonus;
      }
    });
    return totals;
  }, [state.sales, user.id, monitoringTimeframe, monitoringWeekOffset, monitoringMonthOffset, monitoringYear]);

  const monitoringAllTimeTotals = useMemo(() => {
    const totals: Record<string, number> = { 'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0 };
    state.sales.filter(s => s.userId === user.id).forEach(s => {
      if (totals[s.company] !== undefined) {
        totals[s.company] += s.count + s.bonus;
      }
    });
    return totals;
  }, [state.sales, user.id]);

  const monitoringCurrentPeriodLabel = useMemo(() => {
    if (monitoringTimeframe === 'week') {
      const d = new Date();
      const currentDayIndex = d.getDay();
      const diffToMonday = (currentDayIndex === 0 ? -6 : 1 - currentDayIndex);
      const targetMonday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday + (monitoringWeekOffset * 7));
      const targetSunday = new Date(targetMonday);
      targetSunday.setDate(targetMonday.getDate() + 6);
      
      const startDay = targetMonday.getDate();
      const endDay = targetSunday.getDate();
      const monthNames = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
      
      if (targetMonday.getMonth() !== targetSunday.getMonth()) {
        return `${startDay} ${monthNames[targetMonday.getMonth()]} - ${endDay} ${monthNames[targetSunday.getMonth()]}`;
      }
      return `${startDay}-${endDay} ${monthNames[targetMonday.getMonth()]}`;
    }
    if (monitoringTimeframe === 'month') {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() + monitoringMonthOffset);
      const monthNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
      return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    }
    return monitoringYear.toString();
  }, [monitoringTimeframe, monitoringWeekOffset, monitoringMonthOffset, monitoringYear]);

  const renderContent = () => {

    switch (activeTab) {
      case 'rating': {
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
                 historicalLeague = 'bronze';
               }
            }

            const userSales = state.sales
              .filter(s => {
                const saleDate = new Date(s.date);
                saleDate.setHours(12, 0, 0, 0);
                const inRange = saleDate >= startDate && saleDate <= endDate;
                const matchMode = ratingMode === 'overall' || s.company === ratingMode;
                return s.userId === u.id && inRange && matchMode;
              });
            const sales = userSales.reduce((acc, s) => acc + s.count + s.bonus, 0);
            return { ...u, sales, historicalLeague };
          })
          .sort((a, b) => b.sales - a.sales);

        return (
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
                <div className="flex flex-col gap-3">
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
                  
                  {ratingTimeframe === 'month' && (
                    <div className="flex items-center gap-1 bg-brand-dark p-1 rounded-xl border border-white/5 shadow-sm self-end">
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
                          const monthName = translations[language].month_names[startDate.getMonth()];
                          return `${monthName} ${startDate.getFullYear()}`;
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
                    <div className="flex items-center gap-2 self-end">
                      <input type="date" value={ratingCustomStart} onChange={e => setRatingCustomStart(e.target.value)} className="bg-brand-black border border-white/10 text-white text-xs p-2 rounded-lg outline-none focus:border-brand-gold" />
                      <span className="text-white/40">-</span>
                      <input type="date" value={ratingCustomEnd} onChange={e => setRatingCustomEnd(e.target.value)} className="bg-brand-black border border-white/10 text-white text-xs p-2 rounded-lg outline-none focus:border-brand-gold" />
                    </div>
                  )}
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

            {operatorRankings.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-brand-black rounded-full flex items-center justify-center mx-auto border border-white/10">
                  <Users className="w-10 h-10 text-white/10" />
                </div>
                <p className="text-white/20 font-bold uppercase tracking-widest text-xs">Hali operatorlar qo'shilmagan</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 items-start">
                  {['gold', 'silver', 'bronze'].map((leagueName) => {
                    const groupUsers = operatorRankings.filter(u => u.historicalLeague === leagueName);
                    
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
                              <div key={u.id} className={`px-6 py-5 flex items-center justify-between hover:bg-white/5 transition-colors group ${u.id === user.id ? 'bg-brand-gold/5' : ''}`}>
                                <div className="flex items-center gap-4">
                                  <span className="w-5 text-center font-bold text-white/20 group-hover:text-brand-gold transition-colors">{idx + 1}</span>
                                  <div className="w-10 h-10 rounded-xl bg-brand-black border border-white/5 flex items-center justify-center font-bold text-white/20 text-xs group-hover:scale-110 group-hover:bg-brand-dark transition-all overflow-hidden">
                                    {u.photo ? <img src={u.photo} alt={u.firstName} className="w-full h-full object-cover" /> : <>{u.firstName?.[0]}{u.lastName?.[0]}</>}
                                  </div>
                                  <div>
                                    <p className="font-bold text-white flex items-center gap-2 text-sm">
                                      {u.firstName} {u.lastName}
                                      {u.id === user.id && <span className="text-[8px] bg-brand-gold text-brand-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Siz</span>}
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
              </>
            )}
          </div>
        );
      }
      case 'monitoring': {
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="bg-brand-dark p-10 rounded-[3rem] shadow-xl border border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-black text-white flex items-center gap-3"><Activity className="w-8 h-8 text-brand-gold" /> Savdo Dinamikasi</h2>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex flex-wrap gap-3 mr-4">
                    {['Ucell', 'Uztelecom', 'Mobiuz', 'Beeline'].map(company => {
                      const count = monitoringPeriodTotals[company] || 0;
                      const styles: any = {
                        'Ucell': 'text-[#9b51e0] bg-[#9b51e0]/10 border-[#9b51e0]/20',
                        'Uztelecom': 'text-[#009ee0] bg-[#009ee0]/10 border-[#009ee0]/20',
                        'Mobiuz': 'text-[#eb1c24] bg-[#eb1c24]/10 border-[#eb1c24]/20',
                        'Beeline': 'text-[#fdb913] bg-[#fdb913]/10 border-[#fdb913]/20'
                      }[company];
                      return (
                        <span key={company} className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${styles}`}>
                          {company}: {count}
                        </span>
                      );
                    })}
                  </div>
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
                    <span className="text-[10px] font-black text-brand-gold px-3 uppercase tracking-widest min-w-[100px] text-center">
                      {monitoringCurrentPeriodLabel}
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
                  {selectedDay && (
                    <button 
                      onClick={() => setSelectedDay(null)}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-100 transition shadow-sm focus:outline-none"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> {t(language, 'back_to_today')}
                    </button>
                  )}
                </div>
              </div>
              <div className="h-[350px] w-full chart-wrapper">
                <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
                  <BarChart 
                    data={monitoringChartData} 
                    margin={{ top: 30, right: 10, left: 0, bottom: 0 }}
                    style={{ outline: 'none' }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload.length > 0) {
                        const payload = e.activePayload[0].payload;
                        if (payload && payload.fullDate) {
                          setSelectedDay(payload.fullDate);
                        }
                      } else if (e && e.activeTooltipIndex !== undefined) {
                        const payload = monitoringChartData[e.activeTooltipIndex];
                        if (payload && payload.fullDate) {
                          setSelectedDay(payload.fullDate);
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
                          setSelectedDay(prev => prev === data.fullDate ? null : data.fullDate);
                        }
                      }}
                    >
                      {monitoringChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fullDate === selectedDay ? '#fff' : 'var(--theme-gold)'} />
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
                          setSelectedDay(prev => prev === data.fullDate ? null : data.fullDate);
                        }
                      }}
                    >
                      {monitoringChartData.map((entry, index) => (
                        <Cell key={`cell-bonus-${index}`} fill={entry.fullDate === selectedDay ? '#a7f3d0' : '#10B981'} />
                      ))}
                      <LabelList dataKey="bonuses" position="top" fill="#10B981" fontSize={10} fontWeight={900} formatter={(val: number) => val > 0 ? val : ''} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-brand-dark rounded-[3rem] shadow-xl border border-white/10 overflow-hidden">
              <div className="p-8 border-b border-white/5 flex flex-col md:flex-row items-center justify-between bg-brand-black gap-6">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="p-3 bg-brand-gold/10 rounded-2xl text-brand-gold shadow-sm"><Smartphone className="w-6 h-6" /></div>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    {selectedDay || getTodayStr()} {t(language, 'daily_sales_title')}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-center md:justify-end">
                  {(() => {
                    const targetDate = selectedDay || getTodayStr();
                    const daySales = state.sales.filter(s => s.userId === user.id && s.date === targetDate);
                    return ['Ucell', 'Uztelecom', 'Mobiuz', 'Beeline'].map(company => {
                      const count = daySales.filter(s => s.company === company).reduce((acc, s) => acc + s.count + s.bonus, 0);
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
                    });
                  })()}
                </div>
              </div>
              <div className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-brand-black">
                        <th className="px-8 py-5 text-[10px] font-black text-white/30 uppercase tracking-widest border-b border-white/5">Kompaniya</th>
                        <th className="px-8 py-5 text-[10px] font-black text-white/30 uppercase tracking-widest border-b border-white/5">Tarif</th>
                        <th className="px-8 py-5 text-[10px] font-black text-white/30 uppercase tracking-widest border-b border-white/5 text-center">Soni</th>
                        <th className="px-8 py-5 text-[10px] font-black text-white/30 uppercase tracking-widest border-b border-white/5 text-center">Bonus</th>
                        <th className="px-8 py-5 text-[10px] font-black text-white/30 uppercase tracking-widest border-b border-white/5 text-center">Jami</th>
                        <th className="px-8 py-5 text-[10px] font-black text-white/30 uppercase tracking-widest border-b border-white/5 text-right">Vaqt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(() => {
                        const targetDate = selectedDay || getTodayStr();
                        const daySales = state.sales.filter(s => s.userId === user.id && s.date === targetDate);
                        
                        if (daySales.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="px-8 py-20 text-center">
                                <div className="flex flex-col items-center gap-4 opacity-40">
                                  <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-white/20">
                                    <History className="w-8 h-8" />
                                  </div>
                                  <p className="text-sm font-black text-white/30 italic">Bu kunda hech nima sotilmagan</p>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return daySales.sort((a, b) => {
                          const order = { 'Ucell': 1, 'Uztelecom': 2, 'Mobiuz': 3, 'Beeline': 4 };
                          return (order[a.company as keyof typeof order] || 99) - (order[b.company as keyof typeof order] || 99) || b.timestamp.localeCompare(a.timestamp);
                        }).map(sale => (
                          <tr key={sale.id} className="hover:bg-white/5 transition-colors group">
                            <td className="px-8 py-5">
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                                sale.company === 'Ucell' ? 'bg-[#9b51e0]/10 text-[#9b51e0]' :
                                sale.company === 'Mobiuz' ? 'bg-[#eb1c24]/10 text-[#eb1c24]' :
                                sale.company === 'Beeline' ? 'bg-[#fdb913]/10 text-[#fdb913]' :
                                'bg-[#009ee0]/10 text-[#009ee0]'
                              }`}>
                                {sale.company}
                              </span>
                            </td>
                            <td className="px-8 py-5 font-bold text-white/70">{sale.tariff}</td>
                            <td className="px-8 py-5 text-center font-black text-white">{sale.count}</td>
                            <td className="px-8 py-5 text-center font-black text-green-500">+{sale.bonus}</td>
                            <td className="px-8 py-5 text-center">
                              <span className="px-3 py-1 bg-white/10 rounded-lg font-black text-white text-xs">
                                {sale.count + sale.bonus}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              {formatUzTime(sale.timestamp)}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      }
      case 'simcards': {
        const companies = [
          { name: 'Ucell', color: 'bg-[#9b51e0]', textColor: 'text-[#9b51e0]' },
          { name: 'Uztelecom', color: 'bg-[#009ee0]', textColor: 'text-[#009ee0]' },
          { name: 'Mobiuz', color: 'bg-[#eb1c24]', textColor: 'text-[#eb1c24]' },
          { name: 'Beeline', color: 'bg-[#fdb913]', textColor: 'text-[#fdb913]' }
        ];

        const totalInventory = Object.values(user.inventory || {}).reduce((sum: number, count: number) => sum + count, 0);

        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="bg-brand-dark p-10 rounded-[3rem] shadow-xl border border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
                <h2 className="text-2xl font-black text-white flex items-center gap-3"><Smartphone className="w-8 h-8 text-brand-gold" /> {t(language, 'sim_inventory')}</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-brand-gold/10 rounded-2xl border border-brand-gold/20">
                    <span className="text-[10px] font-black text-brand-gold uppercase tracking-widest">Jami: {totalInventory} dona</span>
                  </div>
                </div>
              </div>

              {showSimEntryForm && (
                <div className="mb-10 p-8 bg-brand-black rounded-[2.5rem] border border-white/10 animate-in slide-in-from-top duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black text-white">Yangi simkarta kiritish</h3>
                    <button onClick={() => setShowSimEntryForm(false)} className="p-2 text-white/30 hover:text-red-500 transition"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-2">Kompaniya</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenDropdown(openDropdown === 'simCompany' ? null : 'simCompany')}
                          className="w-full p-4 pr-10 border border-white/10 rounded-2xl bg-brand-black text-sm font-bold outline-none focus:border-brand-gold transition text-white text-left flex items-center justify-between shadow-inner"
                        >
                          <span>{newSimEntry.company}</span>
                          <ChevronDown className={`w-5 h-5 text-white/40 transition-transform ${openDropdown === 'simCompany' ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {openDropdown === 'simCompany' && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)}></div>
                            <div className="absolute top-full left-0 right-0 mt-2 bg-brand-black border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                              {companies.map((c) => (
                                <button
                                  type="button"
                                  key={c.name}
                                  onClick={() => {
                                    setNewSimEntry({...newSimEntry, company: c.name});
                                    setOpenDropdown(null);
                                  }}
                                  className={`w-full text-left p-4 text-sm font-bold hover:bg-white/5 transition-colors ${newSimEntry.company === c.name ? 'text-brand-gold bg-brand-gold/10' : 'text-white'}`}
                                >
                                  {c.name}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-2">Soni (dona)</label>
                      <input 
                        type="number" 
                        min="1"
                        className="w-full p-4 border border-white/10 rounded-2xl bg-brand-black text-white text-sm font-bold outline-none focus:border-brand-gold transition shadow-inner"
                        value={newSimEntry.count}
                        onChange={e => setNewSimEntry({...newSimEntry, count: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        const count = parseInt(newSimEntry.count) || 0;
                        if (count <= 0) return alert("Soni 0 dan katta bo'lishi kerak");
                        addSimInventory(newSimEntry.company, count);
                        setShowSimEntryForm(false);
                        setNewSimEntry({ company: 'Ucell', count: '1' });
                      }}
                      className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-indigo-700 transition-all"
                    >
                      Saqlash
                    </button>
                    <button 
                      onClick={() => setShowSimEntryForm(false)}
                      className="px-10 py-5 bg-brand-black border border-white/10 text-white/40 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all"
                    >
                      Bekor qilish
                    </button>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {companies.map(company => {
                  const count = user.inventory?.[company.name] || 0;
                  const percentage = Math.min(100, (count / 200) * 100); // Assuming 200 is full capacity for visualization
                  return (
                    <div key={company.name} className="p-8 bg-brand-dark rounded-[2.5rem] border border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
                      <div className="flex items-center justify-between mb-6">
                        <div className={`w-14 h-14 ${company.color} rounded-2xl shadow-lg flex items-center justify-center text-white keep-white group-hover:rotate-12 transition-transform`}>
                          <Smartphone className="w-7 h-7" />
                        </div>
                        <div className="text-right">
                          <p className={`text-3xl font-black ${company.textColor}`}>{formatLargeNumber(count)}</p>
                          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Mavjud</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-black text-white/60 text-lg">{company.name}</h3>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${count > 0 ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                            {count > 0 ? t(language, 'in_stock') : t(language, 'out_of_stock_status')}
                          </span>
                        </div>
                        <div className="w-full bg-brand-black h-1.5 rounded-full overflow-hidden border border-white/5">
                          <div className={`h-full ${company.color} rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[9px] font-black text-white/30 uppercase tracking-widest">
                          <span>Zaxira holati</span>
                          <span>{Math.round(percentage)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-brand-dark p-10 rounded-[3rem] shadow-xl text-white relative overflow-hidden border border-white/10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4 max-w-xl">
                  <h3 className="text-2xl font-black tracking-tight text-brand-gold uppercase">Simkartalar yetishmayaptimi?</h3>
                  <p className="text-white/60 text-sm font-medium leading-relaxed">Agar omboringizda simkartalar kamayib qolgan bo'lsa, menejerga so'rov yuboring. Yangi partiya 24 soat ichida yetkazib beriladi.</p>
                </div>
                <button 
                  onClick={() => {
                    setIsSimRequestModalOpen(true);
                    setSimRequestText('');
                  }}
                  className="px-10 py-5 gold-gradient text-brand-black rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                >
                  So'rov yuborish
                </button>
              </div>
            </div>

            {isSimRequestModalOpen && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setIsSimRequestModalOpen(false)}></div>
                <div className="bg-brand-dark w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10">
                  <div className="p-8 border-b border-white/5 flex items-center justify-between bg-brand-black">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-brand-gold text-brand-black rounded-2xl shadow-lg">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">Simkarta so'rovi</h3>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-0.5">Menejerga so'rov yuborish</p>
                      </div>
                    </div>
                    <button onClick={() => setIsSimRequestModalOpen(false)} className="p-2 bg-brand-black rounded-xl text-white/40 hover:text-white transition shadow-sm border border-white/10">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-8 space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2 ml-1">So'rov matni</label>
                      <textarea 
                        className="w-full p-6 bg-brand-black border border-white/10 rounded-[2rem] text-sm font-medium text-white focus:border-brand-gold outline-none transition shadow-inner"
                        rows={4}
                        placeholder="Qaysi simkartalar va qancha kerakligini yozing..."
                        value={simRequestText}
                        onChange={(e) => setSimRequestText(e.target.value)}
                        autoFocus
                      />
                    </div>
                    
                    <button 
                      onClick={() => {
                        if (!simRequestText.trim()) return alert("So'rov matnini kiriting");
                        addMessage(`SIMKARTA SO'ROVI: ${simRequestText}`);
                        setIsSimRequestModalOpen(false);
                        setSimRequestText('');
                        alert("So'rov muvaffaqiyatli yuborildi!");
                      }}
                      className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      So'rovni yuborish <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }
      case 'messages': {
        const myMessages = state.messages.filter(m => 
          m.recipientId === 'all' || 
          m.recipientId === user.id || 
          m.senderId === user.id
        ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return (
          <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto py-8 px-4">
            {isSendMessageModalOpen && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setIsSendMessageModalOpen(false)}></div>
                <div className="bg-brand-dark w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10">
                  <div className="p-8 border-b border-white/5 flex items-center justify-between bg-brand-black">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-brand-gold text-brand-black rounded-2xl shadow-lg">
                        <Send className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">{t(language, 'send_message')}</h3>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-0.5">{t(language, 'write_to_manager')}</p>
                      </div>
                    </div>
                    <button onClick={() => setIsSendMessageModalOpen(false)} className="p-2 bg-brand-black rounded-xl text-white/40 hover:text-white transition shadow-sm border border-white/10">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-8 space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2 ml-1">{t(language, 'message_text')}</label>
                      <textarea 
                        className="w-full p-6 bg-brand-black border border-white/10 rounded-[2rem] text-sm font-medium text-white focus:border-brand-gold outline-none transition shadow-inner"
                        rows={4}
                        placeholder={t(language, 'type_message')}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        autoFocus
                      />
                    </div>
                    
                    <button 
                      onClick={() => {
                        if (!messageText.trim()) return alert("Xabar matnini kiriting");
                        addMessage(messageText);
                        setIsSendMessageModalOpen(false);
                        setMessageText('');
                        alert("Xabar muvaffaqiyatli yuborildi!");
                      }}
                      className="w-full py-5 gold-gradient text-brand-black rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-brand-gold/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      {t(language, 'send_message')} <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-gray-800 tracking-tight">{t(language, 'message_center')}</h2>
              <button 
                onClick={() => {
                  setIsSendMessageModalOpen(true);
                  setMessageText('');
                }}
                className="px-6 py-3 gold-gradient text-brand-black rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-brand-gold/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {t(language, 'send_message')}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {myMessages.length > 0 ? (
                myMessages.map(m => (
                  <div 
                    key={m.id} 
                    className={`p-6 rounded-[2.5rem] border transition-all relative ${m.isRead || m.senderId === user.id ? 'bg-brand-dark border-white/10' : 'bg-brand-gold/5 border-brand-gold/20 shadow-lg shadow-brand-gold/5'}`}
                    onClick={() => !m.isRead && m.senderId !== user.id && markMessageAsRead(m.id)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${m.senderId === user.id ? 'bg-brand-gold text-brand-black' : 'bg-white/10 text-white'}`}>
                          {m.senderName[0]}
                        </div>
                        <div>
                          <h4 className="font-black text-white text-sm">
                            {m.senderName}
                            {m.recipientId === 'all' && <span className="text-[8px] bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded-full ml-2 uppercase tracking-widest">Barchaga</span>}
                          </h4>
                          <p className="text-[10px] text-white/30 font-bold">{formatUzDateTime(m.timestamp)}</p>
                        </div>
                      </div>
                      {!m.isRead && m.senderId !== user.id && <span className="px-2 py-1 bg-brand-gold text-brand-black text-[8px] font-black rounded-md uppercase tracking-widest">Yangi</span>}
                    </div>
                    <p className="text-white/70 font-medium leading-relaxed pl-1">{m.text}</p>
                  </div>
                ))
              ) : (
                <div className="bg-brand-dark rounded-[3rem] p-20 text-center border border-white/10 shadow-sm">
                  <div className="w-20 h-20 bg-brand-black rounded-full flex items-center justify-center mx-auto mb-6 text-white/10">
                    <Send className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">{t(language, 'no_messages')}</h3>
                  <p className="text-white/40 font-medium">{t(language, 'manager_messages_desc')}</p>
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'profile': {
        const totalSales = state.sales.filter(s => s.userId === user.id).reduce((acc, s) => acc + s.count + s.bonus, 0);
        const totalCheckIns = state.checkIns.filter(c => c.userId === user.id).length;
        const joinDate = (() => {
          const d = new Date(user.createdAt);
          const monthName = translations[language].month_names[d.getMonth()];
          return `${d.getDate()}-${monthName}, ${d.getFullYear()}`;
        })();

        return (
          <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Profile Header Card */}
            <div className="bg-brand-dark rounded-[3rem] p-8 shadow-2xl border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl -mr-20 -mt-20 transition-all group-hover:bg-brand-gold/10"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="relative">
                  <div className="w-40 h-40 rounded-[2.5rem] bg-brand-black p-2 shadow-xl border border-white/5">
                    {user.photo ? (
                      <img src={user.photo} alt="Profile" className="w-full h-full rounded-[2rem] object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-[2rem] bg-brand-gold/10 flex items-center justify-center text-5xl font-black text-brand-gold">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      setProfileForm({
                        firstName: user.firstName,
                        lastName: user.lastName,
                        phone: user.phone,
                        password: user.password,
                        photo: user.photo
                      });
                      setIsEditingProfile(true);
                    }}
                    className="absolute -bottom-2 -right-2 p-3 bg-brand-gold text-brand-black rounded-2xl shadow-lg hover:scale-110 transition-all active:scale-95 group"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-center md:text-left space-y-3 flex-1">
                  <div>
                    <h2 className="text-4xl font-black text-white tracking-tight">{user.firstName} {user.lastName}</h2>
                    <p className="text-brand-gold font-bold uppercase tracking-widest text-xs mt-1">{user.role}</p>
                  </div>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <div className="px-4 py-2 bg-brand-black rounded-xl border border-white/10 flex items-center gap-2 text-white/60 font-bold text-xs">
                      <Smartphone className="w-4 h-4 text-brand-gold" />
                      {user.phone}
                    </div>
                    <div className="px-4 py-2 bg-brand-black rounded-xl border border-white/10 flex items-center gap-2 text-white/60 font-bold text-xs">
                      <Calendar className="w-4 h-4 text-brand-gold" />
                      {joinDate}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {['Ucell', 'Uztelecom', 'Mobiuz', 'Beeline'].map(company => {
                const count = state.sales
                  .filter(s => s.userId === user.id && s.company === company)
                  .reduce((acc, s) => acc + s.count + s.bonus, 0);
                
                const styles = {
                  'Ucell': { bg: 'bg-[#9b51e0]/10', border: 'border-[#9b51e0]/20', text: 'text-[#9b51e0]', icon: 'text-[#9b51e0]' },
                  'Uztelecom': { bg: 'bg-[#009ee0]/10', border: 'border-[#009ee0]/20', text: 'text-[#009ee0]', icon: 'text-[#009ee0]' },
                  'Mobiuz': { bg: 'bg-[#eb1c24]/10', border: 'border-[#eb1c24]/20', text: 'text-[#eb1c24]', icon: 'text-[#eb1c24]' },
                  'Beeline': { bg: 'bg-[#fdb913]/10', border: 'border-[#fdb913]/20', text: 'text-[#fdb913]', icon: 'text-[#fdb913]' }
                }[company] || { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white/70', icon: 'text-white/30' };

                return (
                  <div key={company} className={`bg-brand-dark border ${styles.border} p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300`}>
                    <div className={`absolute top-0 right-0 w-32 h-32 ${styles.bg} rounded-full -mr-12 -mt-12 blur-3xl group-hover:scale-110 transition-transform`}></div>
                    
                    <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                      <div className="flex justify-between items-start">
                        <div className={`p-3 ${styles.bg} rounded-2xl shadow-sm border ${styles.border}`}>
                          <Smartphone className={`w-6 h-6 ${styles.icon}`} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${styles.text} opacity-80`}>{company}</span>
                      </div>
                      <div>
                        <p className="text-4xl font-black text-white tracking-tight">{count}</p>
                        <p className={`text-[10px] font-bold text-white/40 mt-1`}>Simkarta sotildi</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Achievements Section */}
            <div className="mt-8">
              <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                <Trophy className="w-6 h-6 text-brand-gold" />
                Yutuqlar
              </h3>
              
              {user.achievements && user.achievements.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {user.achievements.map(achievement => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
                  ))}
                </div>
              ) : (
                <div className="bg-brand-dark rounded-[2.5rem] p-10 text-center border border-white/10">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white/20">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <p className="text-white/40 font-medium">Hozircha yutuqlar yo'q</p>
                </div>
              )}
            </div>

            {isEditingProfile && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-brand-dark rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 border border-white/10">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{t(language, 'edit_profile')}</h3>
                    <button onClick={() => setIsEditingProfile(false)} className="p-2 hover:bg-white/5 rounded-full transition"><X className="w-5 h-5 text-white/40" /></button>
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-center mb-8">
                      <div className="relative group cursor-pointer" onClick={() => profilePhotoInputRef.current?.click()}>
                        <div className="w-24 h-24 rounded-full bg-brand-black overflow-hidden border-4 border-brand-dark shadow-lg">
                          {profileForm.photo ? (
                            <img src={profileForm.photo} alt="Profile Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20">
                              <Camera className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-brand-gold/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload className="w-6 h-6 text-white" />
                        </div>
                        <input 
                          type="file" 
                          ref={profilePhotoInputRef} 
                          onChange={handleProfilePhotoUpload} 
                          accept="image/*" 
                          className="hidden" 
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-4">Ism</label>
                      <input 
                        type="text" 
                        value={profileForm.firstName} 
                        onChange={e => setProfileForm({...profileForm, firstName: e.target.value})}
                        className="w-full p-4 border border-white/10 rounded-2xl bg-brand-black focus:bg-brand-dark outline-none focus:border-brand-gold transition font-bold text-white shadow-inner"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-4">Familiya</label>
                      <input 
                        type="text" 
                        value={profileForm.lastName} 
                        onChange={e => setProfileForm({...profileForm, lastName: e.target.value})}
                        className="w-full p-4 border border-white/10 rounded-2xl bg-brand-black focus:bg-brand-dark outline-none focus:border-brand-gold transition font-bold text-white shadow-inner"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-4">Telefon</label>
                      <input 
                        type="text" 
                        value={profileForm.phone} 
                        onChange={e => setProfileForm({...profileForm, phone: formatPhoneNumber(e.target.value)})}
                        className="w-full p-4 border border-white/10 rounded-2xl bg-brand-black focus:bg-brand-dark outline-none focus:border-brand-gold transition font-bold text-white shadow-inner"
                        placeholder="Telefon"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-4">Parol</label>
                      <input 
                        type="text" 
                        value={profileForm.password} 
                        onChange={e => setProfileForm({...profileForm, password: e.target.value})}
                        className="w-full p-4 border border-white/10 rounded-2xl bg-brand-black focus:bg-brand-dark outline-none focus:border-brand-gold transition font-bold text-white shadow-inner"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        updateUser(user.id, {
                          firstName: profileForm.firstName,
                          lastName: profileForm.lastName,
                          phone: profileForm.phone,
                          password: profileForm.password,
                          photo: profileForm.photo
                        });
                        setIsEditingProfile(false);
                      }}
                      className="w-full py-5 gold-gradient text-brand-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-gold/20 hover:scale-[1.02] active:scale-95 transition-all mt-6"
                    >
                      Saqlash
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }
      default: {
        const today = getTodayStr();
        const targetMonth = today.substring(0, 7);
        const monthlyTarget = state.monthlyTargets.find(t => t.month === targetMonth);
        const userSales = state.sales.filter(s => s.userId === user.id);
        const totalTarget = monthlyTarget ? Object.values(monthlyTarget.targets).reduce((sum: number, t: any) => sum + Number(t), 0) : 0;
        const totalSales = userSales
          .filter(s => s.date.startsWith(targetMonth))
          .reduce((sum, s) => sum + s.count + s.bonus, 0);
        const percentage = Number(totalTarget) > 0 ? Math.min(100, (totalSales / Number(totalTarget)) * 100) : 0;

        if (isEditingCheckIn || (!hasCheckedIn && showCheckInUI)) {
          return renderCheckInForm();
        }

        if (!hasCheckedIn) {
          return (
            <div className="max-w-2xl mx-auto py-12 px-4">
              <div className="bg-brand-dark rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-500">
                <div className="p-12 text-center bg-gradient-to-br from-brand-gold/10 to-brand-gold/5 border-b border-white/10">
                  <div className="w-20 h-20 bg-brand-black rounded-3xl shadow-xl border border-white/10 flex items-center justify-center mx-auto mb-6 text-brand-gold">
                    <LogIn className="w-10 h-10" />
                  </div>
                  <h2 className="text-4xl font-black text-brand-gold tracking-tight">{t(language, 'welcome')}</h2>
                  <p className="text-white/40 mt-3 font-medium text-lg">{t(language, 'start_work_day')}</p>
                </div>
                <div className="p-10">
                  <button 
                    onClick={() => setShowCheckInUI(true)}
                    className="w-full py-8 bg-brand-gold text-brand-black rounded-[2.5rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-brand-gold/20 hover:bg-brand-gold/90 active:scale-95 transition-all"
                  >
                    Ishni boshlash
                  </button>
                </div>
              </div>
            </div>
          );
        }

        const checkInForToday = state.checkIns.find(c => c.userId === user.id && c.date === today);

        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="w-full">

              {/* Header */}
              <div className="flex justify-start items-center mb-6">
                {checkInForToday && !checkInForToday.checkOutTime && (
                  <button 
                    onClick={() => handleCheckOut()}
                    className="px-6 py-3 bg-red-500 text-white keep-white font-bold rounded-lg shadow-md hover:bg-red-600 transition-all duration-200 flex items-center gap-2"
                  >
                    <LogOut className="w-5 h-5 text-white keep-white" />
                    <span className="text-white keep-white">Ishni yakunlash</span>
                  </button>
                )}
              </div>

              <div className="mb-6">
                <div className="w-full">
                  {/* Oylik Reja va Sotuvlar */}
                  <div className="bg-brand-dark p-8 rounded-[3rem] shadow-xl border border-white/10 h-full animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-white flex items-center gap-3"><Smartphone className="w-8 h-8 text-brand-gold" /> {t(language, 'monthly_plan_sales')}</h2>
                  </div>
                  
                  <div className="relative">
                    <div 
                      onClick={() => setShowMonthPicker(!showMonthPicker)}
                      className="flex items-center gap-3 bg-brand-black pl-3 pr-6 py-2 rounded-2xl border border-white/10 shadow-sm hover:shadow-md hover:border-brand-gold/30 transition-all cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold group-hover:scale-110 transition-transform">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-black text-white capitalize leading-none">
                        {(() => {
                          if (!selectedTargetMonth) return t(language, 'select_month');
                          const [y, m] = selectedTargetMonth.split('-');
                          const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
                          return `${monthNames[parseInt(m) - 1]} ${y}`;
                        })()}
                      </span>
                    </div>

                    {showMonthPicker && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowMonthPicker(false)}></div>
                        <div className="absolute top-full right-0 mt-4 bg-brand-dark rounded-3xl shadow-2xl border border-white/10 p-6 z-50 w-80 animate-in fade-in zoom-in-95 duration-200">
                          <div className="flex items-center justify-between mb-6">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const [y, m] = (selectedTargetMonth || new Date().toISOString().slice(0, 7)).split('-');
                                setSelectedTargetMonth(`${parseInt(y) - 1}-${m}`);
                              }}
                              className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/60"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-lg font-black text-white">
                              {selectedTargetMonth.split('-')[0]}
                            </span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const [y, m] = (selectedTargetMonth || new Date().toISOString().slice(0, 7)).split('-');
                                setSelectedTargetMonth(`${parseInt(y) + 1}-${m}`);
                              }}
                              className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/60"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'].map((mName, i) => {
                              const monthNum = String(i + 1).padStart(2, '0');
                              const currentYear = (selectedTargetMonth || new Date().toISOString().slice(0, 7)).split('-')[0];
                              const isSelected = selectedTargetMonth === `${currentYear}-${monthNum}`;
                              
                              return (
                                <button
                                  key={i}
                                  onClick={() => {
                                    setSelectedTargetMonth(`${currentYear}-${monthNum}`);
                                    setShowMonthPicker(false);
                                  }}
                                  className={`py-3 rounded-xl text-sm font-bold transition-all ${
                                    isSelected 
                                      ? 'bg-brand-gold text-brand-black shadow-lg shadow-brand-gold/20 scale-105' 
                                      : 'bg-white/5 text-white/60 hover:bg-brand-gold/10 hover:text-brand-gold'
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { name: 'Ucell', color: 'bg-[#9b51e0]', textColor: 'text-[#9b51e0]' },
                    { name: 'Uztelecom', color: 'bg-[#009ee0]', textColor: 'text-[#009ee0]' },
                    { name: 'Mobiuz', color: 'bg-[#eb1c24]', textColor: 'text-[#eb1c24]' },
                    { name: 'Beeline', color: 'bg-[#fdb913]', textColor: 'text-[#fdb913]' }
                  ].map(company => {
                    const target = state.monthlyTargets?.find(t => t.month === selectedTargetMonth)?.targets?.[company.name] || 0;
                    const officeCount = state.monthlyTargets?.find(t => t.month === selectedTargetMonth)?.officeCounts?.[company.name] || 0;
                    const mobileOfficeCount = state.monthlyTargets?.find(t => t.month === selectedTargetMonth)?.mobileOfficeCounts?.[company.name] || 0;
                    const sales = state.sales.filter(s => s.company === company.name && s.date.startsWith(selectedTargetMonth)).reduce((sum, s) => sum + s.count + s.bonus, 0);
                    const rawPercentage = target > 0 ? (sales / target) * 100 : 0;
                    const percentage = Math.min(100, rawPercentage);
                    
                    return (
                      <div key={company.name} className="p-6 bg-brand-black rounded-[2rem] border border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
                        <div className="flex items-center justify-between mb-5">
                          <div className={`w-12 h-12 ${company.color} rounded-2xl shadow-lg flex items-center justify-center text-white keep-white group-hover:rotate-12 transition-transform`}>
                            <Smartphone className="w-6 h-6" />
                          </div>
                          <div className="text-right">
                            <p className={`text-2xl font-black ${company.textColor}`}>{sales}</p>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{t(language, 'sold')}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-black text-white text-lg">{company.name}</h3>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${sales >= target && target > 0 ? 'text-green-500 bg-green-500/10' : 'text-blue-500 bg-blue-500/10'}`}>
                              {sales >= target && target > 0 ? 'Bajarildi' : 'Jarayonda'}
                            </span>
                          </div>
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full ${company.color} rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                          </div>
                          <div className="flex justify-between text-[9px] font-black text-white/40 uppercase tracking-widest">
                            <span>{sales} / {target}</span>
                            <span>{Math.round(rawPercentage)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            <div className="xl:col-span-2 flex flex-col">
              {/* Savdo Paneli */}
              <div className="bg-brand-dark rounded-[3rem] shadow-xl border border-white/10 p-8 animate-in fade-in duration-500 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">Savdo Paneli</h2>
                  <button 
                    onClick={() => setShowSaleForm(true)}
                    className="px-5 py-2 gold-gradient text-brand-black font-black rounded-lg shadow-sm hover:scale-105 transition-all duration-200 flex items-center gap-2 text-[10px] uppercase tracking-widest"
                  >
                    <PlusCircle className="w-5 h-5" />
                    <span>{t(language, 'add_sale')}</span>
                  </button>
                </div>
                
                {/* Sales Form Modal */}
                {showSaleForm && (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const count = Number(newSale.count);
                      const bonus = Number(newSale.bonus);
                      if (count <= 0) return alert("Sotuv soni 0 dan katta bo'lishi kerak!");

                      let effectiveInventory = user.inventory?.[newSale.company] || 0;
                      if (editingSaleId) {
                        const originalSale = state.sales.find(s => s.id === editingSaleId);
                        if (originalSale && originalSale.company === newSale.company) {
                          effectiveInventory += (originalSale.count + originalSale.bonus);
                        }
                      }

                      if (effectiveInventory < (count + bonus)) {
                        return alert(`${newSale.company} simkartalari omborda yetarli emas! Mavjud: ${effectiveInventory} dona. (Sotuv: ${count} + Bonus: ${bonus} = ${count + bonus})`);
                      }

                      if (bonus > count) {
                        return alert("Bonuslar soni sotilgan simkartalar sonidan ko'p bo'lishi mumkin emas!");
                      }

                      if (editingSaleId) {
                        updateSale(editingSaleId, {
                          company: newSale.company,
                          tariff: newSale.tariff,
                          count: count,
                          bonus: bonus
                        });
                        setEditingSaleId(null);
                      } else {
                        // Check if a sale with the same company and tariff already exists for today
                        const existingSale = state.sales.find(s => 
                          s.userId === user.id && 
                          s.date === today && 
                          s.company === newSale.company && 
                          s.tariff === newSale.tariff
                        );

                        if (existingSale) {
                          updateSale(existingSale.id, {
                            count: existingSale.count + count,
                            bonus: existingSale.bonus + bonus
                          });
                        } else {
                          addSale({ 
                            id: Math.random().toString(36).substr(2, 9), 
                            userId: user.id, 
                            date: today, 
                            company: newSale.company, 
                            tariff: newSale.tariff, 
                            count: count, 
                            bonus: bonus, 
                            timestamp: new Date().toISOString() 
                          }); 
                        }
                      }
                      setNewSale({ company: 'Ucell', tariff: '', count: '1', bonus: '0' }); 
                      setShowSaleForm(false); 
                    }} 
                    className="p-8 bg-brand-black space-y-6 border-b border-white/10 animate-in slide-in-from-top duration-300"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-black text-brand-gold uppercase tracking-widest">{editingSaleId ? t(language, 'edit_sale') : t(language, 'new_sale')}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5 relative z-20">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">Kompaniya</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenDropdown(openDropdown === 'company' ? null : 'company')}
                            className="w-full p-4 pr-10 border border-white/10 rounded-2xl bg-brand-dark text-sm font-bold outline-none focus:border-brand-gold transition text-white text-left flex items-center justify-between"
                          >
                            <span>{newSale.company}</span>
                            <ChevronDown className={`w-5 h-5 text-white/40 transition-transform ${openDropdown === 'company' ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {openDropdown === 'company' && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)}></div>
                              <div className="absolute top-full left-0 right-0 mt-2 bg-brand-dark border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                {['Ucell', 'Uztelecom', 'Mobiuz', 'Beeline'].map((company) => (
                                  <button
                                    type="button"
                                    key={company}
                                    onClick={() => {
                                      setNewSale({...newSale, company, tariff: ''});
                                      setOpenDropdown(null);
                                    }}
                                    className={`w-full text-left p-4 text-sm font-bold hover:bg-white/5 transition-colors ${newSale.company === company ? 'text-brand-gold bg-brand-gold/10' : 'text-white'}`}
                                  >
                                    {company}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                        {(user.inventory?.[newSale.company] || 0) <= 0 && (
                          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest pl-2 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {t(language, 'out_of_stock')}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5 relative z-10">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">Tarif</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenDropdown(openDropdown === 'tariff' ? null : 'tariff')}
                            className={`w-full p-4 pr-10 border border-white/10 rounded-2xl bg-brand-dark text-sm font-bold outline-none focus:border-brand-gold transition text-left flex items-center justify-between ${newSale.tariff ? 'text-white' : 'text-white/40'}`}
                          >
                            <span>{newSale.tariff || 'Tarifni tanlang'}</span>
                            <ChevronDown className={`w-5 h-5 text-white/40 transition-transform ${openDropdown === 'tariff' ? 'rotate-180' : ''}`} />
                          </button>

                          {openDropdown === 'tariff' && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)}></div>
                              <div className="absolute top-full left-0 right-0 mt-2 bg-brand-dark border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-60 overflow-y-auto custom-scrollbar">
                                {state.tariffs?.[newSale.company]?.map((t, i) => (
                                  <button
                                    type="button"
                                    key={i}
                                    onClick={() => {
                                      setNewSale({...newSale, tariff: t});
                                      setOpenDropdown(null);
                                    }}
                                    className={`w-full text-left p-4 text-sm font-bold hover:bg-white/5 transition-colors ${newSale.tariff === t ? 'text-brand-gold bg-brand-gold/10' : 'text-white'}`}
                                  >
                                    {t}
                                  </button>
                                ))}
                                {(!state.tariffs?.[newSale.company] || state.tariffs[newSale.company].length === 0) && (
                                  <div className="p-4 text-center text-white/30 text-xs italic">
                                    Tariflar mavjud emas
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">Soni</label>
                        <input 
                          type="number" 
                          min="1" 
                          className={`w-full p-4 border rounded-2xl bg-brand-dark text-sm font-bold outline-none transition text-white ${ (user.inventory?.[newSale.company] || 0) < (Number(newSale.count) + Number(newSale.bonus)) ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-brand-gold'}`} 
                          value={newSale.count} 
                          onChange={e => {
                            const val = e.target.value;
                            if (val.length <= 7) setNewSale({...newSale, count: val});
                          }} 
                        />
                        <p className="text-[9px] font-bold text-white/30 pl-2 mt-1">Mavjud: {formatLargeNumber(user.inventory?.[newSale.company] || 0)} dona</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">Bonus (ta)</label>
                        <input 
                          type="number" 
                          min="0" 
                          step="1" 
                          placeholder="0 ta" 
                          className={`w-full p-4 border rounded-2xl bg-brand-dark text-sm font-bold outline-none transition text-white ${Number(newSale.bonus) > Number(newSale.count) ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-brand-gold'}`} 
                          value={newSale.bonus} 
                          onChange={e => { 
                            const val = e.target.value; 
                            if (val.length <= 7) setNewSale({...newSale, bonus: val}); 
                          }} 
                        />
                        {Number(newSale.bonus) > Number(newSale.count) && (
                          <p className="text-[9px] font-bold text-red-500 pl-2 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Bonus simkarta sonidan ko'p bo'lishi mumkin emas
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 pt-2">
                      <button 
                        type="submit" 
                        disabled={(() => {
                          if (!newSale.tariff) return true;
                          const count = Number(newSale.count);
                          const bonus = Number(newSale.bonus);
                          if (count <= 0) return true;
                          if (bonus > count) return true;
                          let effectiveInventory = user.inventory?.[newSale.company] || 0;
                          if (editingSaleId) {
                            const originalSale = state.sales.find(s => s.id === editingSaleId);
                            if (originalSale && originalSale.company === newSale.company) {
                              effectiveInventory += (originalSale.count + originalSale.bonus);
                            }
                          }
                          return effectiveInventory < (count + bonus);
                        })()}
                        className="flex-1 gold-gradient text-brand-black py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:bg-white/10 disabled:text-white/20"
                      >
                        {(() => {
                          const count = Number(newSale.count);
                          const bonus = Number(newSale.bonus);
                          let effectiveInventory = user.inventory?.[newSale.company] || 0;
                          if (editingSaleId) {
                            const originalSale = state.sales.find(s => s.id === editingSaleId);
                            if (originalSale && originalSale.company === newSale.company) {
                              effectiveInventory += (originalSale.count + originalSale.bonus);
                            }
                          }
                          return effectiveInventory < (count + bonus) ? 'Omborda yetarli emas' : 'Saqlash';
                        })()}
                      </button>
                      <button type="button" onClick={() => { setShowSaleForm(false); setEditingSaleId(null); setNewSale({ company: 'Ucell', tariff: '', count: '1', bonus: '0' }); }} className="px-10 py-5 bg-white border border-gray-200 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px]">Bekor qilish</button>
                    </div>
                  </form>
                )}

                {/* Sales List */}
                <div className="overflow-x-auto flex-1 no-scrollbar">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 text-[9px] font-black text-white/40 uppercase tracking-[0.2em]"><tr className="border-b border-white/5"><th className="px-8 py-4">Brend</th><th className="px-8 py-4">Tarif</th><th className="px-8 py-4 text-center">Soni</th><th className="px-8 py-4 text-center">Bonus</th><th className="px-8 py-4 text-center">Jami</th><th className="px-8 py-4 text-right">Vaqt</th></tr></thead>
                    <tbody className="divide-y divide-white/5">
                      {todaySales.sort((a, b) => {
                        const order = { 'Ucell': 1, 'Uztelecom': 2, 'Mobiuz': 3, 'Beeline': 4 };
                        return (order[a.company as keyof typeof order] || 99) - (order[b.company as keyof typeof order] || 99) || b.timestamp.localeCompare(a.timestamp);
                      }).map(sale => (
                        <tr key={sale.id} className="hover:bg-white/5 transition group">
                          <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                              sale.company === 'Ucell' ? 'bg-[#9b51e0]/10 text-[#9b51e0]' :
                              sale.company === 'Uztelecom' ? 'bg-[#009ee0]/10 text-[#009ee0]' :
                              sale.company === 'Mobiuz' ? 'bg-[#eb1c24]/10 text-[#eb1c24]' :
                              sale.company === 'Beeline' ? 'bg-[#fdb913]/10 text-[#fdb913]' :
                              'bg-blue-500/10 text-blue-500'
                            }`}>
                              {sale.company}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-sm font-bold text-white/70">{sale.tariff}</td>
                          <td className="px-8 py-5 text-center font-black text-xl text-blue-500">{sale.count}</td>
                          <td className="px-8 py-5 text-center font-black text-lg text-white/70">{sale.bonus}</td>
                          <td className="px-8 py-5 text-center font-black text-lg text-indigo-500">{sale.count + sale.bonus}</td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <span className="text-[10px] font-bold text-white/30">{formatUzTime(sale.timestamp)}</span>
                              <button 
                                onClick={() => {
                                  setEditingSaleId(sale.id);
                                  setNewSale({
                                    company: sale.company,
                                    tariff: sale.tariff,
                                    count: sale.count.toString(),
                                    bonus: sale.bonus.toString()
                                  });
                                  setShowSaleForm(true);
                                }}
                                className="p-2 text-white/30 hover:text-blue-500 transition opacity-0 group-hover:opacity-100"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setDeletingSaleId(sale.id)}
                                className="p-2 text-white/30 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {todaySales.length === 0 && <tr><td colSpan={6} className="px-8 py-16 text-center text-white/30 font-bold italic">{t(language, 'no_today_sales')}</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="xl:col-span-1 flex flex-col">
              {/* Bugungi davomat */}
              <div className="bg-brand-dark p-8 rounded-[3rem] shadow-xl border border-white/10 relative overflow-hidden animate-in fade-in duration-700">
                <h2 className="font-black text-white/40 text-[9px] uppercase tracking-widest mb-6 flex items-center gap-2"><History className="w-4 h-4 text-brand-gold" /> BUGUNGI DAVOMAT</h2>
                
                <div className="space-y-5">
                  {userCheckIn ? (() => {
                    const checkTime = formatUzTime(userCheckIn.timestamp);
                    const isLate = !!lateness?.isLate;
                    const { start } = getWorkingTimes();
                    const boxStyle = isLate ? 'bg-red-600 dark:bg-red-500/10 border-red-500/20' : 'bg-green-600 dark:bg-green-500/10 border-green-500/20';

                    return (
                      <div className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col gap-3 ${boxStyle}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-2xl shadow-md ${isLate ? 'bg-white text-red-600 dark:bg-red-600 dark:text-white' : 'bg-white text-green-600 dark:bg-green-600 dark:text-white'}`}><LogIn className="w-6 h-6" /></div>
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className={`text-[9px] font-black uppercase tracking-widest ${isLate ? '!text-white keep-white dark:!text-red-500' : '!text-white keep-white dark:!text-green-500'}`}>Kelish</p>
                                <span className="text-[8px] font-bold opacity-60 text-white keep-white">({start})</span>
                                {isLate && (
                                  <div className="bg-red-600 text-white keep-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter animate-pulse shadow-md ring-2 ring-white">LATE</div>
                                )}
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
                                        const { end } = getWorkingTimes();
                                        const newWh = `${newTime}-${end}`;
                                        updateCheckIn(user.id, today, { workingHours: newWh });
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
                                <p className={`text-2xl font-black tracking-tight ${isLate ? '!text-white keep-white dark:!text-red-500' : '!text-white keep-white'}`}>{checkTime}</p>
                              )}
                            </div>
                          </div>
                          {!hasReported && <button onClick={() => setIsEditingCheckIn(true)} className="p-3 bg-white text-green-600 dark:bg-brand-black dark:text-brand-gold rounded-xl shadow-md border border-white/20 dark:border-brand-gold/20 active:scale-90 transition-all hover:bg-white/90 dark:hover:bg-brand-gold/10"><Edit3 className="w-4 h-4" /></button>}
                          {hasReported && <button onClick={() => setIsEditingCheckIn(true)} className="p-3 bg-white text-green-600 dark:bg-brand-black dark:text-brand-gold rounded-xl shadow-md border border-white/20 dark:border-brand-gold/20 active:scale-90 transition-all hover:bg-white/90 dark:hover:bg-brand-gold/10"><Edit3 className="w-4 h-4" /></button>}
                        </div>
                        {isLate && editingTime?.type !== 'checkIn' && (
                          <div className="mt-1 flex items-center gap-2 bg-red-600 text-white keep-white p-3 rounded-2xl text-[10px] font-black uppercase animate-in slide-in-from-top-2 duration-300">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{lateness?.durationStr} kechikish (LATE)</span>
                          </div>
                        )}
                      </div>
                    );
                  })() : (
                    <div className="p-6 rounded-[2rem] border border-white/10 bg-white/5 text-white/40 italic text-center">
                      Kelish ma'lumotlari topilmadi
                    </div>
                  )}
                  
                  <div className={`p-6 rounded-[2rem] border flex items-center justify-between bg-blue-600 dark:bg-blue-500/10 border-blue-500/20`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3.5 rounded-xl shadow-md bg-white text-blue-600 dark:bg-blue-600 dark:text-white`}><LogOut className="w-6 h-6" /></div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[9px] font-black !text-white keep-white dark:!text-white/30 uppercase tracking-widest">Ketish</p>
                          <span className="text-[8px] font-bold opacity-60 text-white keep-white">({getWorkingTimes().end})</span>
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
                                  const { start } = getWorkingTimes();
                                  const newWh = `${start}-${newTime}`;
                                  updateCheckIn(user.id, today, { workingHours: newWh });
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
                          <p className={`text-2xl font-black ${hasReported ? '!text-white keep-white' : '!text-white/50 keep-white dark:!text-white/30'}`}>{hasReported ? formatUzTime(currentReport!.timestamp) : 'Hali ketmagan'}</p>
                        )}
                      </div>
                    </div>
                    {hasReported && (
                      <button onClick={() => setIsEditingReport(true)} className="p-3 bg-white text-blue-600 dark:bg-brand-black dark:text-brand-gold rounded-xl shadow-md border border-white/20 dark:border-brand-gold/20 active:scale-90 transition-all hover:bg-white/90 dark:hover:bg-brand-gold/10">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="p-8 bg-brand-gold rounded-[2.5rem] !text-white keep-white relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-brand-black/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                    <p className="text-[9px] font-black !text-white/80 keep-white uppercase tracking-widest mb-1 relative z-10">{t(language, 'today_total_sales')}</p>
                    <p className="text-4xl font-black tracking-tight relative z-10 text-white keep-white">{todaySales.reduce((acc, s) => acc + s.count + s.bonus, 0)} <span className="text-xs opacity-60 capitalize text-white keep-white">{t(language, 'pcs')}</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
              {/* Daily Report Section */}
              {!hasReported || isEditingReport ? (
                <section className="bg-brand-dark rounded-[3rem] shadow-xl border border-white/10 overflow-hidden mt-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="p-8 border-b border-white/5 flex items-center justify-between bg-brand-black">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-black text-white tracking-tight">{isEditingReport ? t(language, 'edit_report') : t(language, 'end_day_report')}</h2>
                      {isEditingReport && (
                        <button onClick={() => setIsEditingReport(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition text-white/40">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <button 
                      onClick={() => reportPhotoInputRef.current?.click()}
                      className={`p-3.5 rounded-2xl transition-all shadow-md flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${reportPhotos.length > 0 ? 'bg-brand-gold text-brand-black shadow-brand-gold/20' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Rasm qo'shish {reportPhotos.length > 0 && `(${reportPhotos.length})`}</span>
                    </button>
                    <input type="file" ref={reportPhotoInputRef} onChange={handleReportPhotoUpload} accept="image/*" multiple className="hidden" />
                  </div>
                  
                  <div className="p-10 space-y-6">
                    {reportPhotos.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4">
                        {reportPhotos.map((photo, idx) => (
                          <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden shadow-md border-2 border-brand-dark ring-2 ring-white/5 group">
                            <img src={photo} className="w-full h-full object-cover" />
                            <button 
                              onClick={() => removeReportPhoto(idx)} 
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-75 hover:scale-100"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <div 
                          onClick={() => reportPhotoInputRef.current?.click()}
                          className="aspect-video rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-white/20 hover:border-brand-gold/30 hover:text-brand-gold cursor-pointer transition-all"
                        >
                          <Plus className="w-6 h-6 mb-1" />
                          <span className="text-[8px] font-black uppercase">Yana qo'shish</span>
                        </div>
                      </div>
                    )}
                    
                    <textarea 
                      className="w-full p-6 border border-white/10 rounded-[2rem] bg-brand-black focus:border-brand-gold outline-none transition font-medium text-base text-white shadow-inner" 
                      rows={3} 
                      placeholder={t(language, 'enter_report_placeholder')} 
                      value={reportText} 
                      onChange={e => setReportText(e.target.value)} 
                    />
                    <button onClick={() => { 
                      if(!reportText.trim()) return alert("Hisobot matnini kiriting"); 
                      
                      if (isEditingReport && currentReport) {
                        updateReport(user.id, today, { 
                          summary: reportText, 
                          photos: reportPhotos.length > 0 ? reportPhotos : undefined 
                        });
                        setIsEditingReport(false);
                      } else {
                        addReport({ 
                          userId: user.id, 
                          date: today, 
                          summary: reportText, 
                          timestamp: getUzTime().toISOString(), 
                          photos: reportPhotos.length > 0 ? reportPhotos : undefined 
                        }); 
                        setReportText('');
                        setReportPhotos([]);
                      }
                    }} className="w-full py-6 gold-gradient text-brand-black rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-brand-gold/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                      {isEditingReport ? t(language, 'save') : t(language, 'send_report')} <Send className="w-4 h-4" />
                    </button>
                  </div>
                </section>
              ) : (
                <div className="bg-brand-dark p-10 rounded-[3rem] text-white flex items-center gap-6 shadow-xl border border-brand-gold/20 animate-in fade-in slide-in-from-bottom-5 mt-6">
                  <div className="p-4 bg-brand-gold/20 rounded-2xl backdrop-blur-md text-brand-gold"><CheckCircle2 className="w-10 h-10" /></div>
                  <div><p className="font-black text-2xl leading-none mb-1 uppercase tracking-tight">{t(language, 'great')}</p><p className="font-medium text-white/60 text-sm">{t(language, 'work_day_ended')}</p></div>
                </div>
              )}
            </div>
          </div>
        </div>
        );
      }
    }
  };

  return (
    <div className="w-full">
      {renderContent()}
      {/* Delete Confirmation Modal */}
      {deletingSaleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-brand-dark border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500 border border-red-500/20 shadow-lg shadow-red-500/10">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white text-center mb-2 uppercase tracking-tight">O'chirishni tasdiqlang</h3>
            <p className="text-white/50 text-center text-sm mb-8 font-medium leading-relaxed">Haqiqatan ham bu sotuvni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.</p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setDeletingSaleId(null)}
                className="py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all border border-white/5"
              >
                Bekor qilish
              </button>
              <button 
                onClick={() => {
                  if (deletingSaleId) {
                    removeSale(deletingSaleId);
                    setDeletingSaleId(null);
                  }
                }}
                className="py-4 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-lg shadow-red-500/20 border border-red-400/20"
              >
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorPanel;
