
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, AppState, CheckIn, SimSale, DailyReport } from '../types';
import { Camera, MapPin, CheckCircle2, Send, Plus, History, Trash2, Smartphone, Upload, Image as ImageIcon, TrendingUp, Loader2, Edit3, AlertTriangle, RefreshCw, LogIn, LogOut, X, Trophy, Activity, ChevronLeft, ChevronRight, RotateCcw, BarChart3, Calendar, PlusCircle, Edit, Check, Users } from 'lucide-react';
import { getTodayStr, isDateMatch, getLatenessStatus, getUzTime } from '../utils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

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
}

const OperatorPanel: React.FC<OperatorPanelProps> = ({ user, state, addCheckIn, updateCheckIn, updateReport, updateUser, addSale, removeSale, updateSale, addReport, addSimInventory, addMessage, markMessageAsRead, activeTab }) => {
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
  const [showSimEntryForm, setShowSimEntryForm] = useState(false);
  const [newSimEntry, setNewSimEntry] = useState({ company: 'Ucell', count: '1' });
  const [newSale, setNewSale] = useState({ company: 'Ucell', tariff: '', count: '1', bonus: '0' });
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
    if ((!hasCheckedIn && showCheckInUI) || isEditingCheckIn) refreshLocation();
    if (isEditingCheckIn && userCheckIn) setCapturedPhoto(userCheckIn.photo);
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

  const getWorkingTimes = () => {
    const wh = userCheckIn?.workingHours || user.workingHours || '09:00-18:00';
    const [start, end] = wh.split('-');
    return { start, end };
  };

  const renderCheckInForm = () => (
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
            {(isEditingCheckIn || (!hasCheckedIn && showCheckInUI)) && (
              <button 
                onClick={() => {
                  setIsEditingCheckIn(false);
                  setShowCheckInUI(false);
                }} 
                className="px-10 py-6 bg-white border border-gray-200 text-gray-400 rounded-[2rem] font-black uppercase tracking-widest text-xs"
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

            {operatorRankings.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                  <Users className="w-10 h-10 text-slate-300" />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Hali operatorlar qo'shilmagan</p>
              </div>
            ) : (
              <>
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
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden">
                  <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Boshqa Ishtirokchilar</span>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {operatorRankings.length > 3 ? (
                      operatorRankings.slice(3).map((u, idx) => (
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
                          <div className="text-right">
                            <p className="text-lg font-black text-slate-900">{u.monthlySales}</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Oylik Sotuv</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-8 py-12 text-center">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">4 va 5-o'rinlar uchun ishtirokchilar yetarli emas</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      }
      case 'monitoring': {
        const today = getTodayStr();
        const targetMonth = today.substring(0, 7);
        const monthlyTarget = state.monthlyTargets.find(t => t.month === targetMonth);
        const userSales = state.sales.filter(s => s.userId === user.id);
        const totalTarget = monthlyTarget ? Object.values(monthlyTarget.targets).reduce((sum: number, t: any) => sum + Number(t), 0) : 0;
        const totalSales = userSales
          .filter(s => s.date.startsWith(targetMonth))
          .reduce((sum, s) => sum + s.count + s.bonus, 0);
        const percentage = Number(totalTarget) > 0 ? Math.min(100, (totalSales / Number(totalTarget)) * 100) : 0;

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
                sales: count,
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
              const count = state.sales.filter(s => s.userId === user.id && s.date === dateStr).reduce((sum, s) => sum + s.count + s.bonus, 0);
              data.push({ name: i.toString(), sales: count, fullDate: dateStr });
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

        const getPeriodSales = () => {
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
        };

        const periodTotals = getPeriodSales();

        const getAllTimeSales = () => {
          const totals: Record<string, number> = { 'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0 };
          state.sales.filter(s => s.userId === user.id).forEach(s => {
            if (totals[s.company] !== undefined) {
              totals[s.company] += s.count + s.bonus;
            }
          });
          return totals;
        };

        const allTimeTotals = getAllTimeSales();

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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Ucell', color: 'bg-purple-600', textColor: 'text-purple-600' },
                { name: 'Mobiuz', color: 'bg-red-600', textColor: 'text-red-600' },
                { name: 'Beeline', color: 'bg-yellow-400', textColor: 'text-yellow-600' },
                { name: 'Uztelecom', color: 'bg-blue-500', textColor: 'text-blue-500' }
              ].map(company => (
                <div key={company.name} className="bg-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-5 hover:scale-105 transition-transform duration-300">
                  <div className={`w-12 h-12 ${company.color} rounded-2xl shadow-lg flex items-center justify-center text-white`}>
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{company.name}</p>
                    <p className={`text-2xl font-black ${company.textColor}`}>{allTimeTotals[company.name]}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-10 rounded-[3rem] shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3"><Activity className="w-8 h-8 text-blue-600" /> Savdo Dinamikasi</h2>
                  <div className="flex flex-wrap gap-3 pl-11">
                    {['Ucell', 'Mobiuz', 'Beeline', 'Uztelecom'].map(company => {
                      const count = periodTotals[company] || 0;
                      const styles: any = {
                        'Ucell': 'text-purple-600 bg-purple-50 border-purple-100',
                        'Mobiuz': 'text-red-600 bg-red-50 border-red-100',
                        'Beeline': 'text-yellow-600 bg-yellow-50 border-yellow-100',
                        'Uztelecom': 'text-blue-600 bg-blue-50 border-blue-100'
                      }[company];
                      return (
                        <span key={company} className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${styles}`}>
                          {company}: {count}
                        </span>
                      );
                    })}
                  </div>
                </div>
                
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
                  {selectedDay && (
                    <button 
                      onClick={() => setSelectedDay(null)}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-100 transition shadow-sm focus:outline-none"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Bugunga qaytish
                    </button>
                  )}
                </div>
              </div>
              <div className="h-[300px] w-full chart-wrapper">
                <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
                  <BarChart 
                    data={chartData} 
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    style={{ outline: 'none' }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload.length > 0) {
                        const payload = e.activePayload[0].payload;
                        if (payload && payload.fullDate) {
                          setSelectedDay(payload.fullDate);
                        }
                      } else if (e && e.activeTooltipIndex !== undefined) {
                        const payload = chartData[e.activeTooltipIndex];
                        if (payload && payload.fullDate) {
                          setSelectedDay(payload.fullDate);
                        }
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                      dy={10}
                    />
                    <YAxis 
                      hide
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontWeight: 800 }}
                      cursor={{ fill: '#f1f5f9', radius: 4 }}
                    />
                    <Bar 
                      dataKey="sales" 
                      fill="#2563eb" 
                      radius={[12, 12, 0, 0]}
                      barSize={monitoringTimeframe === 'week' ? 80 : undefined}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row items-center justify-between bg-white gap-6">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 shadow-sm"><Smartphone className="w-6 h-6" /></div>
                  <h3 className="text-xl font-black text-gray-800 tracking-tight">
                    {selectedDay || getTodayStr()} Kunlik Sotuvlar
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-center md:justify-end">
                  {(() => {
                    const targetDate = selectedDay || getTodayStr();
                    const daySales = state.sales.filter(s => s.userId === user.id && s.date === targetDate);
                    return ['Ucell', 'Mobiuz', 'Beeline', 'Uztelecom'].map(company => {
                      const count = daySales.filter(s => s.company === company).reduce((acc, s) => acc + s.count + s.bonus, 0);
                      const styles: any = {
                        'Ucell': 'bg-purple-50 text-purple-600 border-purple-100',
                        'Mobiuz': 'bg-red-50 text-red-600 border-red-100',
                        'Beeline': 'bg-yellow-50 text-yellow-700 border-yellow-100',
                        'Uztelecom': 'bg-blue-50 text-blue-600 border-blue-100'
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
                      <tr className="bg-gray-50/50">
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Kompaniya</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Tarif</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Soni</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Bonus</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Jami</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Vaqt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(() => {
                        const targetDate = selectedDay || getTodayStr();
                        const daySales = state.sales.filter(s => s.userId === user.id && s.date === targetDate);
                        
                        if (daySales.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="px-8 py-20 text-center">
                                <div className="flex flex-col items-center gap-4 opacity-40">
                                  <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-400">
                                    <History className="w-8 h-8" />
                                  </div>
                                  <p className="text-sm font-black text-gray-400 italic">Bu kunda hech nima sotilmagan</p>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return daySales.sort((a, b) => b.timestamp - a.timestamp).map(sale => (
                          <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-8 py-5">
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                                sale.company === 'Ucell' ? 'bg-purple-50 text-purple-600' :
                                sale.company === 'Mobiuz' ? 'bg-red-50 text-red-600' :
                                sale.company === 'Beeline' ? 'bg-yellow-50 text-yellow-700' :
                                'bg-blue-50 text-blue-600'
                              }`}>
                                {sale.company}
                              </span>
                            </td>
                            <td className="px-8 py-5 font-bold text-gray-700">{sale.tariff}</td>
                            <td className="px-8 py-5 text-center font-black text-gray-800">{sale.count}</td>
                            <td className="px-8 py-5 text-center font-black text-green-600">+{sale.bonus}</td>
                            <td className="px-8 py-5 text-center">
                              <span className="px-3 py-1 bg-gray-100 rounded-lg font-black text-gray-800 text-xs">
                                {sale.count + sale.bonus}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              {new Date(sale.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: true})}
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
                    setIsSimRequestModalOpen(true);
                    setSimRequestText('');
                  }}
                  className="px-10 py-5 bg-white text-indigo-900 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-indigo-50 active:scale-95 transition-all whitespace-nowrap"
                >
                  So'rov yuborish
                </button>
              </div>
            </div>

            {isSimRequestModalOpen && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setIsSimRequestModalOpen(false)}></div>
                <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-br from-indigo-50 to-blue-50/30">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-800 tracking-tight">Simkarta so'rovi</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Menejerga so'rov yuborish</p>
                      </div>
                    </div>
                    <button onClick={() => setIsSimRequestModalOpen(false)} className="p-2 bg-white rounded-xl text-gray-400 hover:text-gray-900 transition shadow-sm border border-gray-100">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-8 space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">So'rov matni</label>
                      <textarea 
                        className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none transition shadow-inner"
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
                <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-br from-blue-50 to-indigo-50/30">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
                        <Send className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-800 tracking-tight">Xabar yuborish</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Menejerga xabar yozish</p>
                      </div>
                    </div>
                    <button onClick={() => setIsSendMessageModalOpen(false)} className="p-2 bg-white rounded-xl text-gray-400 hover:text-gray-900 transition shadow-sm border border-gray-100">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-8 space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">Xabar matni</label>
                      <textarea 
                        className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition shadow-inner"
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
                        addMessage(messageText);
                        setIsSendMessageModalOpen(false);
                        setMessageText('');
                        alert("Xabar muvaffaqiyatli yuborildi!");
                      }}
                      className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      Xabarni yuborish <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-gray-800 tracking-tight">Xabarlar Markazi</h2>
              <button 
                onClick={() => {
                  setIsSendMessageModalOpen(true);
                  setMessageText('');
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Xabar yuborish
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {myMessages.length > 0 ? (
                myMessages.map(m => (
                  <div 
                    key={m.id} 
                    className={`p-6 rounded-[2.5rem] border transition-all relative ${m.isRead || m.senderId === user.id ? 'bg-white border-gray-100' : 'bg-blue-50 border-blue-200 shadow-lg shadow-blue-100/50'}`}
                    onClick={() => !m.isRead && m.senderId !== user.id && markMessageAsRead(m.id)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${m.senderId === user.id ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white'}`}>
                          {m.senderName[0]}
                        </div>
                        <div>
                          <h4 className="font-black text-gray-800 text-sm">
                            {m.senderName}
                            {m.recipientId === 'all' && <span className="text-[8px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full ml-2 uppercase tracking-widest">Barchaga</span>}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-bold">{new Date(m.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      {!m.isRead && m.senderId !== user.id && <span className="px-2 py-1 bg-blue-600 text-white text-[8px] font-black rounded-md uppercase tracking-widest">Yangi</span>}
                    </div>
                    <p className="text-gray-700 font-medium leading-relaxed pl-1">{m.text}</p>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-[3rem] p-20 text-center border border-gray-100 shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                    <Send className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-gray-800 mb-2">Xabarlar mavjud emas</h3>
                  <p className="text-gray-400 font-medium">Menejer tomonidan yuborilgan xabarlar shu yerda ko'rinadi.</p>
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'profile': {
        const totalSales = state.sales.filter(s => s.userId === user.id).reduce((acc, s) => acc + s.count + s.bonus, 0);
        const totalCheckIns = state.checkIns.filter(c => c.userId === user.id).length;
        const joinDate = new Date(user.createdAt).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });

        return (
          <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Profile Header Card */}
            <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl -mr-20 -mt-20 transition-all group-hover:bg-blue-100/50"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -ml-20 -mb-20 transition-all group-hover:bg-indigo-100/50"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="relative">
                  <div className="w-40 h-40 rounded-[2.5rem] bg-white p-2 shadow-xl shadow-blue-100">
                    {user.photo ? (
                      <img src={user.photo} alt="Profile" className="w-full h-full rounded-[2rem] object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-[2rem] bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-5xl font-black text-blue-600">
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
                    className="absolute -bottom-2 -right-2 p-3 bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700 hover:scale-110 transition-all active:scale-95 group"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-center md:text-left space-y-3 flex-1">
                  <div>
                    <h2 className="text-4xl font-black text-gray-800 tracking-tight">{user.firstName} {user.lastName}</h2>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">{user.role}</p>
                  </div>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2 text-gray-600 font-bold text-xs">
                      <Smartphone className="w-4 h-4 text-blue-500" />
                      {user.phone}
                    </div>
                    <div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2 text-gray-600 font-bold text-xs">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      {joinDate}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {['Ucell', 'Mobiuz', 'Beeline', 'Uztelecom'].map(company => {
                const count = state.sales
                  .filter(s => s.userId === user.id && s.company === company)
                  .reduce((acc, s) => acc + s.count + s.bonus, 0);
                
                const styles = {
                  'Ucell': { bg: 'bg-purple-600', text: 'text-purple-100', icon: 'text-purple-600' },
                  'Mobiuz': { bg: 'bg-red-600', text: 'text-red-100', icon: 'text-red-600' },
                  'Beeline': { bg: 'bg-yellow-500', text: 'text-yellow-100', icon: 'text-yellow-600' },
                  'Uztelecom': { bg: 'bg-blue-600', text: 'text-blue-100', icon: 'text-blue-600' }
                }[company] || { bg: 'bg-gray-600', text: 'text-gray-100', icon: 'text-gray-600' };

                return (
                  <div key={company} className={`${styles.bg} p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300`}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-white/20 transition-all"></div>
                    
                    <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-white rounded-2xl shadow-sm">
                          <Smartphone className={`w-6 h-6 ${styles.icon}`} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${styles.text} opacity-80`}>{company}</span>
                      </div>
                      <div>
                        <p className="text-4xl font-black text-white tracking-tight">{count}</p>
                        <p className={`text-[10px] font-bold ${styles.text} mt-1`}>Simkarta sotildi</p>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                        onChange={e => setProfileForm({...profileForm, phone: formatPhoneNumber(e.target.value)})}
                        className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 transition font-bold text-gray-800"
                        placeholder="Telefon"
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
              <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-500">
                <div className="p-12 text-center bg-gradient-to-br from-blue-50 to-indigo-50/40">
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 text-blue-600">
                    <LogIn className="w-10 h-10" />
                  </div>
                  <h2 className="text-4xl font-black text-blue-900 tracking-tight">Xush kelibsiz!</h2>
                  <p className="text-gray-500 mt-3 font-medium text-lg">Bugungi ish kunini boshlash uchun tugmani bosing.</p>
                </div>
                <div className="p-10">
                  <button 
                    onClick={() => setShowCheckInUI(true)}
                    className="w-full py-8 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
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
          <div className="p-4 sm:p-6 lg:p-8 font-sans bg-gray-50/50 min-h-screen flex flex-col">
            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">

              {/* Header */}
              <div className="flex justify-end items-center mb-6">
                {checkInForToday && !checkInForToday.checkOutTime && (
                  <button 
                    onClick={() => handleCheckOut()}
                    className="px-6 py-3 bg-red-500 text-white font-bold rounded-lg shadow-md hover:bg-red-600 transition-all duration-200 flex items-center gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Ishni yakunlash</span>
                  </button>
                )}
              </div>

              <div className="mb-6">
                <div className="w-full">
                  {/* Oylik Reja va Sotuvlar */}
                  <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 h-full animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3"><Smartphone className="w-8 h-8 text-indigo-600" /> Oylik Reja va Sotuvlar</h2>
                    <div className="relative">
                      <div 
                        onClick={() => setShowMonthPicker(!showMonthPicker)}
                        className="flex items-center gap-3 bg-white pl-3 pr-6 py-2 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-black text-gray-800 capitalize leading-none">
                          {(() => {
                            if (!selectedTargetMonth) return 'Oy tanlang';
                            const [y, m] = selectedTargetMonth.split('-');
                            const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
                            return `${monthNames[parseInt(m) - 1]} ${y}`;
                          })()}
                        </span>
                      </div>

                      {showMonthPicker && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowMonthPicker(false)}></div>
                          <div className="absolute top-full left-0 mt-4 bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 z-50 w-80 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-6">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const [y, m] = (selectedTargetMonth || new Date().toISOString().slice(0, 7)).split('-');
                                  setSelectedTargetMonth(`${parseInt(y) - 1}-${m}`);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
                              >
                                <ChevronLeft className="w-5 h-5" />
                              </button>
                              <span className="text-lg font-black text-gray-800">
                                {selectedTargetMonth.split('-')[0]}
                              </span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const [y, m] = (selectedTargetMonth || new Date().toISOString().slice(0, 7)).split('-');
                                  setSelectedTargetMonth(`${parseInt(y) + 1}-${m}`);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
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
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' 
                                        : 'bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { name: 'Ucell', color: 'bg-purple-600', textColor: 'text-purple-600' },
                    { name: 'Mobiuz', color: 'bg-red-600', textColor: 'text-red-600' },
                    { name: 'Beeline', color: 'bg-yellow-400', textColor: 'text-yellow-600' },
                    { name: 'Uztelecom', color: 'bg-blue-500', textColor: 'text-blue-500' }
                  ].map(company => {
                    const target = state.monthlyTargets?.find(t => t.month === selectedTargetMonth)?.targets?.[company.name] || 0;
                    const officeCount = state.monthlyTargets?.find(t => t.month === selectedTargetMonth)?.officeCounts?.[company.name] || 0;
                    const mobileOfficeCount = state.monthlyTargets?.find(t => t.month === selectedTargetMonth)?.mobileOfficeCounts?.[company.name] || 0;
                    const sales = state.sales.filter(s => s.company === company.name && s.date.startsWith(selectedTargetMonth)).reduce((sum, s) => sum + s.count + s.bonus, 0);
                    const rawPercentage = target > 0 ? (sales / target) * 100 : 0;
                    const percentage = Math.min(100, rawPercentage);
                    
                    return (
                      <div key={company.name} className="p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
                        <div className="flex items-center justify-between mb-5">
                          <div className={`w-12 h-12 ${company.color} rounded-2xl shadow-lg flex items-center justify-center text-white group-hover:rotate-12 transition-transform`}>
                            <Smartphone className="w-6 h-6" />
                          </div>
                          <div className="text-right">
                            <p className={`text-2xl font-black ${company.textColor}`}>{sales}</p>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Sotildi</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-black text-gray-800 text-lg">{company.name}</h3>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${sales >= target && target > 0 ? 'text-green-500 bg-green-50' : 'text-blue-500 bg-blue-50'}`}>
                              {sales >= target && target > 0 ? 'Bajarildi' : 'Jarayonda'}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full ${company.color} rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                          </div>
                          <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest">
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
              <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 p-8 animate-in fade-in duration-500 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Savdo Paneli</h2>
                  <button 
                    onClick={() => setShowSaleForm(true)}
                    className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-all duration-200 flex items-center gap-2"
                  >
                    <PlusCircle className="w-5 h-5" />
                    <span>Sotuv qo'shish</span>
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

                {/* Sales List */}
                <div className="overflow-x-auto flex-1">
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
              </div>
            </div>

            <div className="xl:col-span-1 flex flex-col">
              {/* Bugungi davomat */}
              <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 relative overflow-hidden animate-in fade-in duration-700 h-full">
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
                                {editingTime?.type !== 'checkIn' && (
                                  <button 
                                    onClick={() => {
                                      const { start } = getWorkingTimes();
                                      setEditingTime({ type: 'checkIn', current: start });
                                      setNewTime(start);
                                    }}
                                    className="p-1 bg-white/50 rounded-lg hover:bg-white transition shadow-sm"
                                  >
                                    <Edit className="w-3 h-3 text-gray-500" />
                                  </button>
                                )}
                                {isLate && (
                                  <div className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter animate-pulse shadow-md ring-2 ring-white">LATE</div>
                                )}
                              </div>
                              {editingTime?.type === 'checkIn' ? (
                                <div className="flex items-center gap-2 mt-1">
                                  <input 
                                    type="time" 
                                    value={newTime} 
                                    onChange={e => setNewTime(e.target.value)}
                                    className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-lg font-bold w-32 outline-none focus:ring-2 focus:ring-blue-500"
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
                                  <button onClick={() => setEditingTime(null)} className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition shadow-sm"><X className="w-4 h-4" /></button>
                                </div>
                              ) : (
                                <p className={`text-2xl font-black tracking-tight ${isLate ? 'text-red-900' : 'text-gray-800'}`}>{checkTime}</p>
                              )}
                            </div>
                          </div>
                          {!hasReported && <button onClick={() => setIsEditingCheckIn(true)} className="p-3 bg-white text-blue-600 rounded-xl shadow-md border border-gray-100 active:scale-90 transition-all hover:bg-blue-50"><Edit3 className="w-4 h-4" /></button>}
                          {hasReported && <button onClick={() => setIsEditingCheckIn(true)} className="p-3 bg-white text-blue-600 rounded-xl shadow-md border border-gray-100 active:scale-90 transition-all hover:bg-blue-50"><Edit3 className="w-4 h-4" /></button>}
                        </div>
                        {isLate && editingTime?.type !== 'checkIn' && (
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
                  
                  <div className={`p-6 rounded-[2rem] border shadow-sm flex items-center justify-between ${hasReported ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3.5 rounded-xl shadow-md ${hasReported ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'}`}><LogOut className="w-6 h-6" /></div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ketish</p>
                          {hasReported && editingTime?.type !== 'checkOut' && (
                            <button 
                              onClick={() => {
                                const { end } = getWorkingTimes();
                                setEditingTime({ type: 'checkOut', current: end });
                                setNewTime(end);
                              }}
                              className="p-1 bg-white/50 rounded-lg hover:bg-white transition shadow-sm"
                            >
                              <Edit className="w-3 h-3 text-gray-500" />
                            </button>
                          )}
                        </div>
                        {editingTime?.type === 'checkOut' ? (
                          <div className="flex items-center gap-2 mt-1">
                            <input 
                              type="time" 
                              value={newTime} 
                              onChange={e => setNewTime(e.target.value)}
                              className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-lg font-bold w-32 outline-none focus:ring-2 focus:ring-blue-500"
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
                            <button onClick={() => setEditingTime(null)} className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition shadow-sm"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <p className="text-2xl font-black text-gray-800">{hasReported ? new Date(currentReport!.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: true}).toUpperCase() : 'Hali ketmagan'}</p>
                        )}
                      </div>
                    </div>
                    {hasReported && (
                      <button onClick={() => setIsEditingReport(true)} className="p-3 bg-white text-blue-600 rounded-xl shadow-md border border-gray-100 active:scale-90 transition-all hover:bg-blue-50">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                    <p className="text-[9px] font-black text-blue-100 uppercase tracking-widest mb-1 relative z-10">Bugun jami savdo</p>
                    <p className="text-4xl font-black tracking-tight relative z-10">{todaySales.reduce((acc, s) => acc + s.count + s.bonus, 0)} <span className="text-xs opacity-60">Dona</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
              {/* Daily Report Section */}
              {!hasReported || isEditingReport ? (
                <section className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden mt-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-black text-gray-800 tracking-tight">{isEditingReport ? "Hisobotni tahrirlash" : "Kun yakuni hisoboti"}</h2>
                      {isEditingReport && (
                        <button onClick={() => setIsEditingReport(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition text-gray-500">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
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
                    }} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3">
                      {isEditingReport ? "Saqlash" : "Hisobotni yuborish"} <Send className="w-4 h-4" />
                    </button>
                  </div>
                </section>
              ) : (
                <div className="bg-green-600 p-10 rounded-[3rem] text-white flex items-center gap-6 shadow-xl animate-in fade-in slide-in-from-bottom-5 mt-6">
                  <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md"><CheckCircle2 className="w-10 h-10" /></div>
                  <div><p className="font-black text-2xl leading-none mb-1">Ajoyib!</p><p className="font-medium opacity-80 text-sm">Bugungi ish kuningiz muvaffaqiyatli yakunlandi!</p></div>
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
    </div>
  );
};

export default OperatorPanel;
