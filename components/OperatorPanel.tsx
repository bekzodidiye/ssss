
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, AppState, CheckIn, SimSale, DailyReport } from '../types';
import { Camera, MapPin, CheckCircle2, Send, Plus, History, Trash2, Smartphone, Upload, Image as ImageIcon, TrendingUp, Loader2, Edit3, AlertTriangle, RefreshCw, LogIn, LogOut, X, Trophy, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTodayStr } from '../utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface OperatorPanelProps {
  user: User;
  state: AppState;
  addCheckIn: (checkIn: CheckIn) => void;
  updateCheckIn: (userId: string, date: string, updates: Partial<CheckIn>) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  addSale: (sale: SimSale) => void;
  removeSale: (saleId: string) => void;
  updateSale: (saleId: string, updates: Partial<SimSale>) => void;
  addReport: (report: DailyReport) => void;
  addSimInventory: (company: string, count: number) => void;
  addMessage: (text: string) => void;
  activeTab: string;
}

const isDateMatch = (timestamp: string, dateStr: string) => {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}` === dateStr;
};

const getLatenessStatus = (checkInTimestamp: string, workingHours?: string) => {
  if (!workingHours || !workingHours.includes('-')) return null;
  
  try {
    const startTimePart = workingHours.split('-')[0].trim();
    const timeMatch = startTimePart.match(/(\d{1,2})[:.](\d{2})/);
    
    if (!timeMatch) return null;
    
    const startH = parseInt(timeMatch[1], 10);
    const startM = parseInt(timeMatch[2], 10);
    
    const checkInDate = new Date(checkInTimestamp);
    if (isNaN(checkInDate.getTime())) return null;

    const startTotalMinutes = startH * 60 + startM;
    const checkInTotalMinutes = checkInDate.getHours() * 60 + checkInDate.getMinutes();

    if (checkInTotalMinutes > startTotalMinutes) {
      const diff = checkInTotalMinutes - startTotalMinutes;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      
      let durationStr = "";
      if (hours > 0) durationStr += `${hours} soat `;
      durationStr += `${mins} daqiqa`;
      
      return {
        isLate: true,
        durationStr: durationStr.trim(),
        diffMinutes: diff
      };
    }
  } catch (e) {
    return null;
  }
  return null;
};

const OperatorPanel: React.FC<OperatorPanelProps> = ({ user, state, addCheckIn, updateCheckIn, updateUser, addSale, removeSale, updateSale, addReport, addSimInventory, addMessage, activeTab }) => {
  const today = getTodayStr();
  const userCheckIn = state.checkIns.find(c => c.userId === user.id && isDateMatch(c.timestamp, today));
  const hasCheckedIn = !!userCheckIn;
  const currentReport = state.reports.find(r => r.userId === user.id && r.date === today);
  const hasReported = !!currentReport;

  const [isEditingCheckIn, setIsEditingCheckIn] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [reportPhotos, setReportPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [reportText, setReportText] = useState('');
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [showSimEntryForm, setShowSimEntryForm] = useState(false);
  const [newSimEntry, setNewSimEntry] = useState({ company: 'Ucell', count: '1' });
  const [newSale, setNewSale] = useState({ company: 'Ucell', tariff: '', count: '1', bonus: '0' });
  const [ratingMonthOffset, setRatingMonthOffset] = useState(0);
  const [monitoringTimeframe, setMonitoringTimeframe] = useState<'week' | 'month' | 'year'>('week');
  const [monitoringWeekOffset, setMonitoringWeekOffset] = useState(0);
  const [monitoringMonthOffset, setMonitoringMonthOffset] = useState(0);
  const [monitoringYear, setMonitoringYear] = useState(new Date().getFullYear());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportPhotoInputRef = useRef<HTMLInputElement>(null);

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
    if (!hasCheckedIn || isEditingCheckIn) refreshLocation();
    if (isEditingCheckIn && userCheckIn) setCapturedPhoto(userCheckIn.photo);
  }, [hasCheckedIn, isEditingCheckIn, userCheckIn]);

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

  const handleCheckInAction = () => {
    if (capturedPhoto && location) {
      if (isEditingCheckIn) {
        updateCheckIn(user.id, today, { location, photo: capturedPhoto });
        setIsEditingCheckIn(false);
      } else {
        addCheckIn({
          userId: user.id,
          timestamp: new Date().toISOString(),
          location,
          photo: capturedPhoto
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
    return getLatenessStatus(userCheckIn.timestamp, user.workingHours);
  }, [userCheckIn, user.workingHours]);

  if (!hasCheckedIn || isEditingCheckIn) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-500">
          <div className="p-12 text-center border-b bg-gradient-to-br from-blue-50 to-indigo-50/40">
            <h2 className="text-3xl font-black text-blue-900 tracking-tight">{isEditingCheckIn ? "Ma'lumotlarni yangilash" : "Xush kelibsiz!"}</h2>
            <p className="text-gray-500 mt-3 font-medium">Ishni boshlash uchun rasm va manzilingizni yuboring.</p>
          </div>
          <div className="p-10 space-y-8">
            <div onClick={() => fileInputRef.current?.click()} className="aspect-video bg-gray-50 rounded-[2.5rem] overflow-hidden relative border-4 border-dashed border-gray-100 flex items-center justify-center cursor-pointer hover:border-blue-300 transition-all">
              {capturedPhoto ? <img src={capturedPhoto} className="w-full h-full object-cover" /> : (
                <div className="text-center">
                  <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Ish joyidan rasm yuklang</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
            </div>
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-xl ${isLocating ? 'bg-blue-100 text-blue-600 animate-pulse' : 'bg-green-100 text-green-600'}`}><MapPin className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isLocating ? 'Aniqlanmoqda...' : 'Joylashuv'}</p>
                  <p className="text-lg font-black text-gray-800">{location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : 'Kutilmoqda...'}</p>
                </div>
              </div>
              <button onClick={refreshLocation} disabled={isLocating} className="p-3.5 bg-white text-blue-600 rounded-xl shadow-sm border border-gray-100 hover:rotate-180 transition-all duration-700"><RefreshCw className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} /></button>
            </div>
            <div className="flex gap-4">
              <button onClick={handleCheckInAction} disabled={!location || isLocating || !capturedPhoto} className="flex-1 py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all">
                {isEditingCheckIn ? "Saqlash" : "Ishni boshlash"}
              </button>
              {isEditingCheckIn && <button onClick={() => setIsEditingCheckIn(false)} className="px-10 py-6 bg-white border border-gray-200 text-gray-400 rounded-[2rem] font-black uppercase tracking-widest text-xs">Bekor qilish</button>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    switch (activeTab) {
      case 'rating': {
        const targetMonth = new Date();
        targetMonth.setMonth(targetMonth.getMonth() + ratingMonthOffset);
        const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
        const monthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);

        const operatorRankings = state.users
          .filter(u => u.role !== 'manager')
          .map(u => {
            const monthlySales = state.sales
              .filter(s => {
                const saleDate = new Date(s.date);
                return s.userId === u.id && saleDate >= monthStart && saleDate <= monthEnd;
              })
              .reduce((acc, s) => acc + s.count + s.bonus, 0);
            return { ...u, monthlySales };
          })
          .sort((a, b) => b.monthlySales - a.monthlySales);

        const top3 = operatorRankings.slice(0, 3);
        const others = operatorRankings.slice(3);
        const maxSales = operatorRankings[0]?.monthlySales || 1;

        const monthNamesUz = [
          "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
          "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
        ];
        const monthName = `${monthNamesUz[targetMonth.getMonth()]} ${targetMonth.getFullYear()}`;

        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-6xl mx-auto py-8 px-4">
            {/* Elegant Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-12">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-[0.2em]">
                  <Trophy className="w-4 h-4" />
                  <span>Muvaffaqiyatlar Sarhisobi</span>
                </div>
                <h2 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                  Reyting <span className="text-blue-600">Jadvali</span>
                </h2>
                <p className="text-slate-500 font-medium">
                  {monthName} natijalari bo'yicha eng yaxshi ko'rsatkichga ega operatorlar.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/50 shadow-sm">
                  <button 
                    onClick={() => setRatingMonthOffset(prev => prev - 1)}
                    className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-blue-600"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-black text-slate-600 px-4 uppercase tracking-widest min-w-[120px] text-center">
                    {monthName}
                  </span>
                  <button 
                    onClick={() => setRatingMonthOffset(prev => prev + 1)}
                    className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-blue-600"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200/50 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Jonli Yangilanish</span>
                </div>
              </div>
            </div>

            {/* Podium Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end pt-10">
              {/* 2nd Place */}
              <div className="order-2 md:order-1">
                <div className="bg-gradient-to-b from-slate-50 to-slate-200 rounded-[2.5rem] p-8 border border-slate-300 shadow-xl shadow-slate-300/40 relative group hover:-translate-y-2 transition-all duration-500">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-slate-400 rounded-2xl flex items-center justify-center font-black text-white border-4 border-white shadow-lg">2</div>
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-20 h-20 rounded-3xl bg-white border border-slate-300 flex items-center justify-center text-2xl font-black text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors shadow-sm overflow-hidden">
                      {top3[1]?.photo ? (
                        <img src={top3[1].photo} alt={top3[1].firstName} className="w-full h-full object-cover" />
                      ) : (
                        <>{top3[1]?.firstName?.[0]}{top3[1]?.lastName?.[0]}</>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{top3[1]?.firstName} {top3[1]?.lastName}</h3>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Kumush Daraja</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1st Place */}
              <div className="order-1 md:order-2">
                <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-yellow-200/50 relative group hover:-translate-y-4 transition-all duration-500 border-4 border-white/30">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/40 transition-all"></div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-2xl flex items-center justify-center font-black text-yellow-600 border-4 border-yellow-400 shadow-xl rotate-3 group-hover:rotate-12 transition-transform">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                    <div className="w-28 h-28 rounded-[2.5rem] bg-white/20 p-1 shadow-2xl backdrop-blur-sm">
                      <div className="w-full h-full rounded-[2.3rem] bg-white flex items-center justify-center text-4xl font-black text-yellow-600 overflow-hidden">
                        {top3[0]?.photo ? (
                          <img src={top3[0].photo} alt={top3[0].firstName} className="w-full h-full object-cover" />
                        ) : (
                          <>{top3[0]?.firstName?.[0]}{top3[0]?.lastName?.[0]}</>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-white tracking-tight drop-shadow-md">{top3[0]?.firstName} {top3[0]?.lastName}</h3>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/10 border border-white/20 mt-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white">Oylik Chempion</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="order-3">
                <div className="bg-gradient-to-b from-orange-50 to-orange-200 rounded-[2.5rem] p-8 border border-orange-300 shadow-xl shadow-orange-300/40 relative group hover:-translate-y-2 transition-all duration-500">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center font-black text-white border-4 border-white shadow-lg">3</div>
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-20 h-20 rounded-3xl bg-white border border-orange-200 flex items-center justify-center text-2xl font-black text-orange-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors shadow-sm overflow-hidden">
                      {top3[2]?.photo ? (
                        <img src={top3[2].photo} alt={top3[2].firstName} className="w-full h-full object-cover" />
                      ) : (
                        <>{top3[2]?.firstName?.[0]}{top3[2]?.lastName?.[0]}</>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{top3[2]?.firstName} {top3[2]?.lastName}</h3>
                      <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Bronza Daraja</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* List Section */}
            {others.length > 0 && (
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden">
                <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Boshqa Ishtirokchilar</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {others.map((u, idx) => (
                    <div key={u.id} className={`px-8 py-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group ${u.id === user.id ? 'bg-blue-50/50' : ''}`}>
                      <div className="flex items-center gap-6">
                        <span className="w-6 text-center font-bold text-slate-300 group-hover:text-blue-500 transition-colors">{idx + 4}</span>
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200/50 flex items-center justify-center font-bold text-slate-400 text-sm group-hover:scale-110 group-hover:bg-white transition-all overflow-hidden">
                          {u.photo ? (
                            <img src={u.photo} alt={u.firstName} className="w-full h-full object-cover" />
                          ) : (
                            <>{u.firstName?.[0]}{u.lastName?.[0]}</>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-2">
                            {u.firstName} {u.lastName}
                            {u.id === user.id && <span className="text-[8px] bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Siz</span>}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400">Operator</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }
      case 'monitoring': {
        const getChartData = () => {
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
              const count = state.sales.filter(s => s.userId === user.id && s.date === dateStr).reduce((sum, s) => sum + s.count + s.bonus, 0);
              data.push({ 
                name: uzDays[current.getDay()], 
                sales: count 
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
              const count = state.sales.filter(s => s.userId === user.id && s.date === dateStr).reduce((sum, s) => sum + s.count + s.bonus, 0);
              data.push({ name: i.toString(), sales: count });
            }
          } else if (monitoringTimeframe === 'year') {
            for (let m = 0; m < 12; m++) {
              const monthNum = m + 1;
              const monthPrefix = `${monitoringYear}-${String(monthNum).padStart(2, '0')}`;
              const count = state.sales.filter(s => s.userId === user.id && s.date.startsWith(monthPrefix)).reduce((sum, s) => sum + s.count + s.bonus, 0);
              const monthNames = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
              data.push({ name: monthNames[m], sales: count });
            }
          }
          return data;
        };

        const chartData = getChartData();

        const totalMonthlySales = state.sales
          .filter(s => s.userId === user.id && new Date(s.date) >= last30Days)
          .reduce((acc, s) => acc + s.count + s.bonus, 0);

        const onTimeCheckIns = state.checkIns
          .filter(c => c.userId === user.id && new Date(c.timestamp) >= last30Days)
          .filter(c => !getLatenessStatus(c.timestamp, user.workingHours)).length;
        
        const totalCheckIns = state.checkIns
          .filter(c => c.userId === user.id && new Date(c.timestamp) >= last30Days).length;
        
        const punctualityRate = totalCheckIns > 0 ? Math.round((onTimeCheckIns / totalCheckIns) * 100) : 100;

        const currentPeriodLabel = () => {
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
        };

        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Oylik Sotuv</p>
                <p className="text-4xl font-black text-blue-600">{totalMonthlySales}</p>
                <p className="text-[10px] font-bold text-gray-400 mt-1">Oxirgi 30 kun</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Intizom</p>
                <p className="text-4xl font-black text-indigo-600">{punctualityRate}%</p>
                <p className="text-[10px] font-bold text-gray-400 mt-1">O'z vaqtida kelish</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Faollik</p>
                <p className="text-4xl font-black text-green-600">{totalCheckIns}</p>
                <p className="text-[10px] font-bold text-gray-400 mt-1">Ish kunlari soni</p>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
                <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3"><Activity className="w-8 h-8 text-blue-600" /> Savdo Dinamikasi</h2>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex p-1 bg-gray-100 rounded-xl border border-gray-200">
                    <button 
                      onClick={() => setMonitoringTimeframe('week')}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${monitoringTimeframe === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      Hafta
                    </button>
                    <button 
                      onClick={() => setMonitoringTimeframe('month')}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${monitoringTimeframe === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      Oy
                    </button>
                    <button 
                      onClick={() => setMonitoringTimeframe('year')}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${monitoringTimeframe === 'year' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      Yil
                    </button>
                  </div>

                  <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                    <button 
                      onClick={() => {
                        if (monitoringTimeframe === 'week') setMonitoringWeekOffset(prev => prev - 1);
                        else if (monitoringTimeframe === 'month') setMonitoringMonthOffset(prev => prev - 1);
                        else if (monitoringTimeframe === 'year') setMonitoringYear(prev => prev - 1);
                      }}
                      className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-400 hover:text-blue-600"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] font-black text-blue-600 px-3 uppercase tracking-widest min-w-[100px] text-center">
                      {currentPeriodLabel()}
                    </span>
                    <button 
                      onClick={() => {
                        if (monitoringTimeframe === 'week') setMonitoringWeekOffset(prev => prev + 1);
                        else if (monitoringTimeframe === 'month') setMonitoringMonthOffset(prev => prev + 1);
                        else if (monitoringTimeframe === 'year') setMonitoringYear(prev => prev + 1);
                      }}
                      className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-400 hover:text-blue-600"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 800 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#2563eb" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorSales)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      }
      case 'simcards': {
        const companies = [
          { name: 'Ucell', color: 'bg-purple-600', textColor: 'text-purple-600' },
          { name: 'Mobiuz', color: 'bg-red-600', textColor: 'text-red-600' },
          { name: 'Beeline', color: 'bg-yellow-400', textColor: 'text-yellow-600' },
          { name: 'Uztelecom', color: 'bg-blue-500', textColor: 'text-blue-500' }
        ];

        const totalInventory = Object.values(user.inventory || {}).reduce((sum: number, count: number) => sum + count, 0);

        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
                <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3"><Smartphone className="w-8 h-8 text-indigo-600" /> Simkartalar Ombori</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Jami: {totalInventory} dona</span>
                  </div>
                </div>
              </div>

              {showSimEntryForm && (
                <div className="mb-10 p-8 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100 animate-in slide-in-from-top duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black text-indigo-900">Yangi simkarta kiritish</h3>
                    <button onClick={() => setShowSimEntryForm(false)} className="p-2 text-gray-400 hover:text-red-500 transition"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Kompaniya</label>
                      <select 
                        className="w-full p-4 border border-gray-200 rounded-2xl bg-white text-sm font-bold outline-none focus:border-indigo-600 transition"
                        value={newSimEntry.company}
                        onChange={e => setNewSimEntry({...newSimEntry, company: e.target.value})}
                      >
                        {companies.map(c => <option key={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Soni (dona)</label>
                      <input 
                        type="number" 
                        min="1"
                        className="w-full p-4 border border-gray-200 rounded-2xl bg-white text-sm font-bold outline-none focus:border-indigo-600 transition"
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
                      className="px-10 py-5 bg-white border border-gray-200 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px]"
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
                    <div key={company.name} className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
                      <div className="flex items-center justify-between mb-6">
                        <div className={`w-14 h-14 ${company.color} rounded-2xl shadow-lg flex items-center justify-center text-white group-hover:rotate-12 transition-transform`}>
                          <Smartphone className="w-7 h-7" />
                        </div>
                        <div className="text-right">
                          <p className={`text-3xl font-black ${company.textColor}`}>{count}</p>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mavjud</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-black text-gray-500 text-lg">{company.name}</h3>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${count > 0 ? 'text-green-500 bg-green-50' : 'text-red-500 bg-red-50'}`}>
                            {count > 0 ? 'Sotuvda bor' : 'Tugagan'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full ${company.color} rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest">
                          <span>Zaxira holati</span>
                          <span>{Math.round(percentage)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-indigo-900 p-10 rounded-[3rem] shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4 max-w-xl">
                  <h3 className="text-2xl font-black tracking-tight">Simkartalar yetishmayaptimi?</h3>
                  <p className="text-indigo-100 text-sm font-medium leading-relaxed">Agar omboringizda simkartalar kamayib qolgan bo'lsa, menejerga so'rov yuboring. Yangi partiya 24 soat ichida yetkazib beriladi.</p>
                </div>
                <button 
                  onClick={() => {
                    const text = prompt("Menejerga so'rov matnini kiriting:");
                    if (text) {
                      addMessage(`SIMKARTA SO'ROVI: ${text}`);
                      alert("So'rov yuborildi!");
                    }
                  }}
                  className="px-10 py-5 bg-white text-indigo-900 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-indigo-50 active:scale-95 transition-all whitespace-nowrap"
                >
                  So'rov yuborish
                </button>
              </div>
            </div>
          </div>
        );
      }
      case 'profile': {
        const totalSales = state.sales.filter(s => s.userId === user.id).reduce((acc, s) => acc + s.count + s.bonus, 0);
        const totalCheckIns = state.checkIns.filter(c => c.userId === user.id).length;
        const joinDate = new Date(user.createdAt).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });

        return (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 py-8">
            <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden relative">
              <div className="h-48 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <button 
                  onClick={() => {
                    setProfileForm({
                      firstName: user.firstName,
                      lastName: user.lastName,
                      phone: user.phone,
                      password: user.password
                    });
                    setIsEditingProfile(true);
                  }}
                  className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-2xl hover:bg-white/30 transition-all shadow-lg active:scale-95 group"
                >
                  <Edit3 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </button>
              </div>
              <div className="px-10 pb-10 relative">
                <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-20 mb-8">
                  <div className="w-40 h-40 rounded-[2.5rem] bg-white p-2 shadow-2xl relative group">
                    {user.photo ? (
                      <img src={user.photo} alt="Profile" className="w-full h-full rounded-[2rem] object-cover border-4 border-white shadow-inner" />
                    ) : (
                      <div className="w-full h-full rounded-[2rem] bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-6xl font-black text-blue-600 border-4 border-white shadow-inner">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="text-center md:text-left flex-1 space-y-2 mb-4">
                    <h2 className="text-4xl font-black text-gray-800 tracking-tight">{user.firstName} {user.lastName}</h2>
                    <div className="flex items-center justify-center md:justify-start gap-3">
                      <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">{user.role}</span>
                      <span className="text-gray-400 text-xs font-bold flex items-center gap-1">
                        <Smartphone className="w-3 h-3" /> {user.phone}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                  {['Ucell', 'Mobiuz', 'Beeline', 'Uztelecom'].map(company => {
                    const count = state.sales
                      .filter(s => s.userId === user.id && s.company === company)
                      .reduce((acc, s) => acc + s.count + s.bonus, 0);
                    
                    const styles = {
                      'Ucell': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
                      'Mobiuz': { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
                      'Beeline': { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100' },
                      'Uztelecom': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' }
                    }[company] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100' };

                    return (
                      <div key={company} className={`p-6 rounded-[2rem] border ${styles.border} ${styles.bg} text-center group hover:scale-105 transition-transform duration-300`}>
                        <div className={`w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-3 ${styles.text}`}>
                          <Smartphone className="w-6 h-6" />
                        </div>
                        <p className={`text-2xl font-black ${styles.text} mb-1`}>{count}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{company}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {isEditingProfile && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-gray-800">Profilni tahrirlash</h3>
                    <button onClick={() => setIsEditingProfile(false)} className="p-2 hover:bg-gray-100 rounded-full transition"><X className="w-5 h-5 text-gray-400" /></button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-center mb-6">
                      <div className="relative group cursor-pointer" onClick={() => profilePhotoInputRef.current?.click()}>
                        <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden border-4 border-white shadow-lg">
                          {profileForm.photo ? (
                            <img src={profileForm.photo} alt="Profile Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Camera className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Ism</label>
                      <input 
                        type="text" 
                        value={profileForm.firstName} 
                        onChange={e => setProfileForm({...profileForm, firstName: e.target.value})}
                        className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 transition font-bold text-gray-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Familiya</label>
                      <input 
                        type="text" 
                        value={profileForm.lastName} 
                        onChange={e => setProfileForm({...profileForm, lastName: e.target.value})}
                        className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 transition font-bold text-gray-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Telefon</label>
                      <input 
                        type="text" 
                        value={profileForm.phone} 
                        onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                        className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 transition font-bold text-gray-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Parol</label>
                      <input 
                        type="text" 
                        value={profileForm.password} 
                        onChange={e => setProfileForm({...profileForm, password: e.target.value})}
                        className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 transition font-bold text-gray-800"
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
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-blue-700 active:scale-95 transition-all mt-4"
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
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              <section className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white">
                  <div><h2 className="text-2xl font-black text-gray-800 tracking-tight">Savdo Paneli</h2></div>
                  {!showSaleForm && <button onClick={() => setShowSaleForm(true)} className="bg-blue-600 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-100"><Plus className="w-4 h-4" /> Yangi sotuv</button>}
                </div>
                
                {showSaleForm && (
                  <form 
                    onSubmit={e => { 
                      e.preventDefault(); 
                      const count = Number(newSale.count);
                      const bonus = Number(newSale.bonus);
                      const currentInv = user.inventory?.[newSale.company] || 0;
                      
                      // If editing, we need to account for the current sale's count in inventory check
                      let effectiveInventory = currentInv;
                      if (editingSaleId) {
                        const originalSale = state.sales.find(s => s.id === editingSaleId);
                        if (originalSale && originalSale.company === newSale.company) {
                          effectiveInventory += (originalSale.count + originalSale.bonus);
                        }
                      }

                      if (effectiveInventory < (count + bonus)) {
                        return alert(`${newSale.company} simkartalari omborda yetarli emas! Mavjud: ${effectiveInventory} dona. (Sotuv: ${count} + Bonus: ${bonus} = ${count + bonus})`);
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
                      setNewSale({ company: 'Ucell', tariff: '', count: '1', bonus: '0' }); 
                      setShowSaleForm(false); 
                    }} 
                    className="p-8 bg-gray-50/50 space-y-6 border-b border-gray-50 animate-in slide-in-from-top duration-300"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest">{editingSaleId ? 'Sotuvni tahrirlash' : 'Yangi sotuv qo\'shish'}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Kompaniya</label>
                        <select 
                          className="w-full p-4 border border-gray-200 rounded-2xl bg-white text-sm font-bold outline-none focus:border-blue-600 transition" 
                          value={newSale.company} 
                          onChange={e => setNewSale({...newSale, company: e.target.value})}
                        >
                          <option>Ucell</option>
                          <option>Mobiuz</option>
                          <option>Beeline</option>
                          <option>Uztelecom</option>
                        </select>
                        {(user.inventory?.[newSale.company] || 0) <= 0 && (
                          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest pl-2 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Omborda tugagan!
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Tarif</label><input type="text" placeholder="Tarif nomi" className="w-full p-4 border border-gray-200 rounded-2xl bg-white text-sm font-bold outline-none focus:border-blue-600 transition" value={newSale.tariff} onChange={e => setNewSale({...newSale, tariff: e.target.value})} required /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Soni</label>
                        <input 
                          type="number" 
                          min="1" 
                          className={`w-full p-4 border rounded-2xl bg-white text-sm font-bold outline-none transition ${ (user.inventory?.[newSale.company] || 0) < (Number(newSale.count) + Number(newSale.bonus)) ? 'border-red-300 focus:border-red-600' : 'border-gray-200 focus:border-blue-600'}`} 
                          value={newSale.count} 
                          onChange={e => setNewSale({...newSale, count: e.target.value})} 
                        />
                        <p className="text-[9px] font-bold text-gray-400 pl-2 mt-1">Mavjud: {user.inventory?.[newSale.company] || 0} dona</p>
                      </div>
                      <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Bonus (ta)</label><input type="number" min="0" step="1" placeholder="0 ta" className="w-full p-4 border border-gray-200 rounded-2xl bg-white text-sm font-bold outline-none focus:border-blue-600 transition" value={newSale.bonus} onChange={e => setNewSale({...newSale, bonus: e.target.value})} /></div>
                    </div>
                    <div className="flex gap-4 pt-2">
                      <button 
                        type="submit" 
                        disabled={(() => {
                          const count = Number(newSale.count);
                          const bonus = Number(newSale.bonus);
                          if (count <= 0) return true;
                          let effectiveInventory = user.inventory?.[newSale.company] || 0;
                          if (editingSaleId) {
                            const originalSale = state.sales.find(s => s.id === editingSaleId);
                            if (originalSale && originalSale.company === newSale.company) {
                              effectiveInventory += (originalSale.count + originalSale.bonus);
                            }
                          }
                          return effectiveInventory < (count + bonus);
                        })()}
                        className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:bg-gray-400"
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

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]"><tr className="border-b border-gray-100"><th className="px-8 py-4">Brend</th><th className="px-8 py-4">Tarif</th><th className="px-8 py-4 text-center">Soni</th><th className="px-8 py-4 text-center">Bonus</th><th className="px-8 py-4 text-center">Jami</th><th className="px-8 py-4 text-right">Vaqt</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {todaySales.map(sale => (
                        <tr key={sale.id} className="hover:bg-blue-50/30 transition group">
                          <td className="px-8 py-5"><span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase">{sale.company}</span></td>
                          <td className="px-8 py-5 text-sm font-bold text-gray-700">{sale.tariff}</td>
                          <td className="px-8 py-5 text-center font-black text-xl text-blue-600">{sale.count}</td>
                          <td className="px-8 py-5 text-center font-black text-lg text-gray-700">{sale.bonus}</td>
                          <td className="px-8 py-5 text-center font-black text-lg text-indigo-600">{sale.count + sale.bonus}</td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <span className="text-[10px] font-bold text-gray-300">{new Date(sale.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
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
                                className="p-2 text-gray-300 hover:text-blue-600 transition opacity-0 group-hover:opacity-100"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {todaySales.length === 0 && <tr><td colSpan={6} className="px-8 py-16 text-center text-gray-300 font-bold italic">Bugungi savdolar mavjud emas</td></tr>}
                    </tbody>
                  </table>
                </div>
              </section>

              {!hasReported ? (
                <section className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden">
                  <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white">
                    <h2 className="text-xl font-black text-gray-800 tracking-tight">Kun yakuni hisoboti</h2>
                    <button 
                      onClick={() => reportPhotoInputRef.current?.click()}
                      className={`p-3.5 rounded-2xl transition-all shadow-md flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${reportPhotos.length > 0 ? 'bg-blue-600 text-white shadow-blue-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
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
                          <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden shadow-md border-2 border-white ring-2 ring-gray-100 group">
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
                          className="aspect-video rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 cursor-pointer transition-all"
                        >
                          <Plus className="w-6 h-6 mb-1" />
                          <span className="text-[8px] font-black uppercase">Yana qo'shish</span>
                        </div>
                      </div>
                    )}
                    
                    <textarea 
                      className="w-full p-6 border border-gray-200 rounded-[2rem] bg-gray-50 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 outline-none transition font-medium text-base shadow-inner" 
                      rows={3} 
                      placeholder="Bugungi ish xulosasini kiriting..." 
                      value={reportText} 
                      onChange={e => setReportText(e.target.value)} 
                    />
                    <button onClick={() => { 
                      if(!reportText.trim()) return alert("Hisobot matnini kiriting"); 
                      addReport({ 
                        userId: user.id, 
                        date: today, 
                        summary: reportText, 
                        timestamp: new Date().toISOString(), 
                        photos: reportPhotos.length > 0 ? reportPhotos : undefined 
                      }); 
                      setReportText('');
                      setReportPhotos([]);
                    }} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3">Hisobotni yuborish <Send className="w-4 h-4" /></button>
                  </div>
                </section>
              ) : (
                <div className="bg-green-600 p-10 rounded-[3rem] text-white flex items-center gap-6 shadow-xl animate-in fade-in slide-in-from-bottom-5">
                  <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md"><CheckCircle2 className="w-10 h-10" /></div>
                  <div><p className="font-black text-2xl leading-none mb-1">Ajoyib!</p><p className="font-medium opacity-80 text-sm">Bugungi ish kuningiz muvaffaqiyatli yakunlandi!</p></div>
                </div>
              )}
            </div>

            <div className="space-y-8">
              <section className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 relative overflow-hidden">
                <h2 className="font-black text-gray-400 text-[9px] uppercase tracking-widest mb-6 flex items-center gap-2"><History className="w-4 h-4 text-blue-600" /> BUGUNGI DAVOMAT</h2>
                
                <div className="space-y-5">
                  {userCheckIn ? (() => {
                    const checkTime = new Date(userCheckIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
                    const isLate = !!lateness;
                    const boxStyle = isLate ? 'bg-red-50 border-red-300 shadow-red-100' : 'bg-green-50 border-green-100 shadow-green-100';

                    return (
                      <div className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col gap-3 shadow-lg ${boxStyle}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-2xl shadow-md ${isLate ? 'bg-red-600' : 'bg-green-600'} text-white`}><LogIn className="w-6 h-6" /></div>
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className={`text-[9px] font-black uppercase tracking-widest ${isLate ? 'text-red-600' : 'text-green-500'}`}>Kelish</p>
                                {isLate && (
                                  <div className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter animate-pulse shadow-md ring-2 ring-white">LATE</div>
                                )}
                              </div>
                              <p className={`text-2xl font-black tracking-tight ${isLate ? 'text-red-900' : 'text-gray-800'}`}>{checkTime}</p>
                            </div>
                          </div>
                          {!hasReported && <button onClick={() => setIsEditingCheckIn(true)} className="p-3 bg-white text-blue-600 rounded-xl shadow-md border border-gray-100 active:scale-90 transition-all hover:bg-blue-50"><Edit3 className="w-4 h-4" /></button>}
                        </div>
                        {isLate && (
                          <div className="mt-1 flex items-center gap-2 bg-red-600 text-white p-3 rounded-2xl shadow-xl shadow-red-200 text-[10px] font-black uppercase animate-in slide-in-from-top-2 duration-300">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{lateness?.durationStr} kechikish (LATE)</span>
                          </div>
                        )}
                      </div>
                    );
                  })() : (
                    <div className="p-6 rounded-[2rem] border border-gray-100 bg-gray-50 text-gray-400 italic text-center">
                      Kelish ma'lumotlari topilmadi
                    </div>
                  )}
                  
                  <div className={`p-6 rounded-[2rem] border shadow-sm flex items-center gap-4 ${hasReported ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className={`p-3.5 rounded-xl shadow-md ${hasReported ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'}`}><LogOut className="w-6 h-6" /></div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Ketish</p>
                      <p className="text-2xl font-black text-gray-800">{hasReported ? new Date(currentReport!.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: true}).toUpperCase() : 'Hali ketmagan'}</p>
                    </div>
                  </div>

                  <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                    <p className="text-[9px] font-black text-blue-100 uppercase tracking-widest mb-1 relative z-10">Bugun jami savdo</p>
                    <p className="text-4xl font-black tracking-tight relative z-10">{todaySales.reduce((acc, s) => acc + s.count + s.bonus, 0)} <span className="text-xs opacity-60">Dona</span></p>
                  </div>
                </div>
              </section>

              <section className="bg-indigo-950 p-10 rounded-[3rem] shadow-xl text-white relative overflow-hidden group">
                <div className="flex items-center gap-5 mb-6 relative z-10"><div className="p-4 bg-white/10 rounded-xl backdrop-blur-md shadow-lg"><TrendingUp className="w-6 h-6 text-blue-400" /></div><h3 className="font-black text-xl">Sizning Mavqeingiz</h3></div>
                <p className="text-sm opacity-70 leading-relaxed font-bold mb-6 relative z-10">Muntazam faollik va o'z vaqtida kelish sizning reytingingizni oshiradi. Rejani bajarish orqali qo'shimcha bonuslarga ega bo'ling!</p>
                <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden relative z-10"><div className="bg-blue-400 h-full w-[65%] rounded-full shadow-lg shadow-blue-400/50"></div></div>
              </section>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {renderContent()}
    </div>
  );
};

export default OperatorPanel;
