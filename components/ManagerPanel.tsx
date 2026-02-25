
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Role, AppState, User, CheckIn, SimSale, DailyReport } from '../types';
import { 
  Users, TrendingUp, Search, MapPin, Activity, 
  Phone, X, Clock, 
  ChevronRight, Smartphone, ExternalLink,
  CheckCircle, FileText, UserPlus, Award, BarChart2,
  ArrowLeft, CalendarDays,
  Plus,
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
  LayoutGrid
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import L from 'leaflet';
import { getTodayStr } from '../utils';

interface ManagerPanelProps {
  state: AppState;
  approveUser: (userId: string) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  addMessage: (text: string) => void;
  markMessageAsRead: (messageId: string) => void;
  activeTab: 'overview' | 'users' | 'reports' | 'approvals' | 'messages' | 'simcards';
  setActiveTab: (tab: 'overview' | 'users' | 'reports' | 'approvals' | 'messages' | 'simcards') => void;
  addSimInventory: (company: string, count: number) => void;
  setMonthlyTarget: (month: string, targets: Record<string, number>, officeCounts?: Record<string, number>, mobileOfficeCounts?: Record<string, number>) => void;
}

const isDateMatch = (timestamp: string, dateStr: string) => {
  if (!timestamp) return false;
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}` === dateStr;
};

const getFormattedDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
        isEarly: false,
        durationStr: durationStr.trim(),
        diffMinutes: diff
      };
    } else if (checkInTotalMinutes < startTotalMinutes) {
      const diff = startTotalMinutes - checkInTotalMinutes;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      
      let durationStr = "";
      if (hours > 0) durationStr += `${hours} soat `;
      durationStr += `${mins} daqiqa`;

      return {
        isLate: false,
        isEarly: true,
        durationStr: durationStr.trim(),
        diffMinutes: diff
      };
    }
  } catch (e) {
    return null;
  }
  return null;
};

const getEarlyDepartureStatus = (checkOutTimestamp: string, workingHours?: string) => {
  if (!workingHours || !workingHours.includes('-')) return null;

  try {
    const parts = workingHours.split('-');
    if (parts.length < 2) return null;
    
    const endTimePart = parts[1].trim();
    const timeMatch = endTimePart.match(/(\d{1,2})[:.](\d{2})/);

    if (!timeMatch) return null;

    const endH = parseInt(timeMatch[1], 10);
    const endM = parseInt(timeMatch[2], 10);

    const checkOutDate = new Date(checkOutTimestamp);
    if (isNaN(checkOutDate.getTime())) return null;

    const endTotalMinutes = endH * 60 + endM;
    const checkOutTotalMinutes = checkOutDate.getHours() * 60 + checkOutDate.getMinutes();

    // If checkout is BEFORE end time
    if (checkOutTotalMinutes < endTotalMinutes) {
      const diff = endTotalMinutes - checkOutTotalMinutes;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;

      let durationStr = "";
      if (hours > 0) durationStr += `${hours} soat `;
      durationStr += `${mins} daqiqa`;

      return {
        isEarly: true,
        durationStr: durationStr.trim(),
        diffMinutes: diff
      };
    }
  } catch (e) {
    return null;
  }
  return null;
};

const SingleLocationMap: React.FC<{ location: { lat: number; lng: number } | null, initials: string }> = ({ location, initials }) => {
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
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { 
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
    <div className="h-56 flex flex-col items-center justify-center text-gray-300 italic font-black text-xs uppercase tracking-widest bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100 p-8 text-center">
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
        <MapPin className="w-8 h-8 opacity-20" />
      </div>
      Joylashuv ma'lumotlari topilmadi
    </div>
  );

  return (
    <div className="h-56 rounded-[2rem] overflow-hidden border border-gray-100 shadow-inner relative group">
      <div ref={mapRef} className="w-full h-full z-0" />
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <a 
          href={`https://www.google.com/maps?q=${location.lat},${location.lng}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white/95 backdrop-blur-md p-2.5 rounded-xl shadow-lg border border-white text-blue-600 hover:text-blue-700 transition-all block hover:scale-105"
          title="Google Maps'da ko'rish"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
      <div className="absolute bottom-4 left-6 z-10 bg-blue-600 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl ring-4 ring-white/30">
        JONLI MANZIL
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

const StaffMap: React.FC<{ checkIns: CheckIn[], reports: DailyReport[], users: User[], today: string, onUserSelect: (userId: string) => void }> = ({ checkIns, reports, users, today, onUserSelect }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersGroup = useRef<L.LayerGroup | null>(null);

  const operators = useMemo(() => users.filter(u => u.isApproved && u.role !== Role.MANAGER), [users]);

  const staffStatus = useMemo(() => {
    return operators.map(user => {
      const userCheckIns = checkIns
        .filter(ci => ci.userId === user.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      const lastKnownLocation = userCheckIns[0];
      const todayCheckIn = userCheckIns.find(ci => isDateMatch(ci.timestamp, today));
      const todayReport = reports.find(r => r.userId === user.id && r.date === today);
      
      return { user, todayCheckIn, todayReport, lastKnownLocation, isPresent: !!todayCheckIn, hasFinished: !!todayReport };
    });
  }, [operators, checkIns, reports, today]);

  const fitToMarkers = () => {
    if (leafletMap.current && markersGroup.current) {
      const layers = markersGroup.current.getLayers();
      if (layers.length > 0) {
        const boundsArr = layers.map((l: any) => l.getLatLng());
        leafletMap.current.fitBounds(L.latLngBounds(boundsArr as any), { padding: [80, 80], maxZoom: 14 });
      }
    }
  };

  useEffect(() => {
    if (mapRef.current && !leafletMap.current) {
      leafletMap.current = L.map(mapRef.current, { scrollWheelZoom: true, dragging: true, zoomControl: false }).setView([41.311081, 69.240562], 12);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO', maxZoom: 20 }).addTo(leafletMap.current);
      L.control.zoom({ position: 'bottomright' }).addTo(leafletMap.current);
      markersGroup.current = L.layerGroup().addTo(leafletMap.current);
      
      setTimeout(() => {
        leafletMap.current?.invalidateSize();
      }, 250);

      const resizeObserver = new ResizeObserver(() => {
        leafletMap.current?.invalidateSize();
      });
      resizeObserver.observe(mapRef.current);
      return () => {
        resizeObserver.disconnect();
        if (leafletMap.current) {
          leafletMap.current.remove();
          leafletMap.current = null;
        }
      };
    }
  }, []);

  useEffect(() => {
    if (leafletMap.current && markersGroup.current) {
      markersGroup.current.clearLayers();
      staffStatus.forEach(({ user, lastKnownLocation, todayCheckIn, isPresent, hasFinished }) => {
        if (!lastKnownLocation?.location) return;
        const lateness = todayCheckIn ? getLatenessStatus(todayCheckIn.timestamp, user.workingHours) : null;
        let statusColor = isPresent ? (hasFinished ? '#64748b' : (lateness?.isEarly ? '#3b82f6' : '#2563eb')) : '#ef4444';
        let statusLabel = isPresent ? (hasFinished ? 'Tugatgan' : (lateness?.isEarly ? 'Erta Kelgan' : 'Ishda')) : 'Kelmagan';
        const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

        const customIcon = L.divIcon({
          className: 'custom-staff-icon-marker',
          html: `
            <div class="map-marker-v2-container ${isPresent && !hasFinished ? 'marker-pulse-v2' : ''} ${lateness?.isLate ? 'marker-late-v2' : ''} ${lateness?.isEarly ? 'marker-early-v2' : ''}" style="opacity: ${isPresent ? '1' : '0.8'}">
              <div class="map-marker-v2-pin" style="background-color: ${statusColor}; ${lateness?.isLate ? 'border-color: #ef4444; border-width: 3px;' : (lateness?.isEarly ? 'border-color: #3b82f6; border-width: 3px;' : '')}">
                <span class="map-marker-v2-initials">${initials}</span>
              </div>
              <div class="map-marker-v2-arrow" style="border-top-color: ${lateness?.isLate ? '#ef4444' : (lateness?.isEarly ? '#3b82f6' : statusColor)}"></div>
              ${lateness?.isLate ? '<div class="late-badge-v2">!</div>' : ''}
              ${lateness?.isEarly ? '<div class="early-badge-v2">&#10003;</div>' : ''}
            </div>
          `,
          iconSize: [36, 46], 
          iconAnchor: [18, 46], 
          popupAnchor: [0, -40]
        });
        
        const latenessHtml = lateness?.isLate ? 
          `<div style="color: white; font-weight: 900; background: #ef4444; padding: 4px 10px; border-radius: 8px; margin-top: 8px; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.2); font-size: 10px; display: flex; align-items: center; gap: 6px; text-transform: uppercase;">
            <span style="font-size: 14px;">🚨</span> LATE: ${lateness.durationStr}
          </div>` : (lateness?.isEarly ? 
          `<div style="color: white; font-weight: 900; background: #3b82f6; padding: 4px 10px; border-radius: 8px; margin-top: 8px; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2); font-size: 10px; display: flex; align-items: center; gap: 6px; text-transform: uppercase;">
            <span style="font-size: 14px;">✅</span> EARLY: ${lateness.durationStr}
          </div>` : '');

        const marker = L.marker([lastKnownLocation.location.lat, lastKnownLocation.location.lng], { icon: customIcon })
          .bindTooltip(`<div class="map-tooltip-content" style="padding: 10px; min-width: 140px;">
            <span class="tooltip-name" style="font-weight: 900; color: #1e293b; font-size: 15px; display: block; margin-bottom: 6px; letter-spacing: -0.02em;">${user.firstName} ${user.lastName}</span>
            <div class="tooltip-status" style="display: flex; align-items: center; gap: 8px;">
              <span class="status-dot" style="width: 10px; height: 10px; border-radius: 50%; background-color: ${statusColor}; box-shadow: 0 0 0 3px ${statusColor}33"></span>
              <span class="status-text" style="color: ${statusColor}; font-weight: 900; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">${statusLabel}</span>
            </div>
            ${latenessHtml}
          </div>`, { direction: 'top', offset: [0, -40], className: 'map-custom-tooltip' });
          
        marker.on('click', () => {
          onUserSelect(user.id);
        });

        marker.addTo(markersGroup.current!);
      });
      fitToMarkers();
    }
  }, [staffStatus, onUserSelect]);

  return (
    <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-2xl bg-white flex flex-col md:flex-row">
      <div className="w-full md:w-64 bg-gray-50/90 backdrop-blur-md border-r border-gray-100 overflow-y-auto custom-scrollbar p-4 z-20">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Xodimlar ({staffStatus.length})</h4>
        <div className="space-y-2">
          {staffStatus.map(({ user, todayCheckIn, isPresent, hasFinished }) => {
            const lateness = todayCheckIn ? getLatenessStatus(todayCheckIn.timestamp, user.workingHours) : null;
            return (
              <div 
                key={user.id} 
                onClick={() => onUserSelect(user.id)}
                className={`p-2.5 rounded-xl border transition-all flex items-center gap-3 shadow-sm hover:shadow-md cursor-pointer ${lateness?.isLate ? 'bg-red-50 border-red-200' : (lateness?.isEarly ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100')}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${isPresent ? (lateness?.isLate ? 'bg-red-600 text-white' : (lateness?.isEarly ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600')) : 'bg-red-50 text-red-400'} overflow-hidden`}>
                  {user.photo ? (
                    <img src={user.photo} alt={user.firstName} className="w-full h-full object-cover" />
                  ) : (
                    <>{user.firstName?.[0]}</>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate leading-none mb-1">{user.firstName} {user.lastName}</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider">${isPresent ? (hasFinished ? 'Tugatgan' : (lateness?.isEarly ? 'Erta Kelgan' : 'Ishda')) : 'Kelmagan'}</p>
                    {lateness?.isLate && <span className="text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded-md font-black animate-pulse shadow-sm shadow-red-200">LATE</span>}
                    {lateness?.isEarly && <span className="text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md font-black animate-pulse shadow-sm shadow-blue-200">EARLY</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full min-h-[400px] z-10" />
        <button onClick={fitToMarkers} className="absolute top-4 right-4 z-[20] p-3 bg-white/95 rounded-xl shadow-lg border border-white text-blue-600 active:scale-95 transition-all"><Navigation2 className="w-4 h-4 fill-current" /></button>
      </div>
    </div>
  );
};

const ManagerPanel: React.FC<ManagerPanelProps> = ({ state, approveUser, updateUser, addMessage, markMessageAsRead, activeTab, setActiveTab, addSimInventory, setMonthlyTarget }) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [tempStartTime, setTempStartTime] = useState('');
  const [tempEndTime, setTempEndTime] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [chartTimeframe, setChartTimeframe] = useState<'week' | 'month' | 'year'>('week');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [monthOffset, setMonthOffset] = useState<number>(0);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplyingTo, setIsReplyingTo] = useState<string | null>(null);
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
        const count = state.sales.filter(s => s.userId === userId && s.date === dateStr).reduce((sum, s) => sum + s.count + s.bonus, 0);
        data.push({ 
          name: uzDays[current.getDay()], 
          fullDate: dateStr, 
          sales: count 
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
        const count = state.sales.filter(s => s.userId === userId && s.date === dateStr).reduce((sum, s) => sum + s.count + s.bonus, 0);
        data.push({ name: i.toString(), fullDate: dateStr, sales: count });
      }
    } else if (timeframe === 'year') {
      for (let m = 0; m < 12; m++) {
        const monthNum = m + 1;
        const monthPrefix = `${targetYear}-${String(monthNum).padStart(2, '0')}`;
        const count = state.sales.filter(s => s.userId === userId && s.date.startsWith(monthPrefix)).reduce((sum, s) => sum + s.count + s.bonus, 0);
        const monthNames = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
        data.push({ name: monthNames[m], fullDate: `${targetYear}-${String(monthNum).padStart(2, '0')}-01`, sales: count });
      }
    }
    return data;
  };

  const currentChartData = useMemo(() => {
    if (!selectedUserId) return [];
    return getSalesChartData(selectedUserId, chartTimeframe, selectedYear, weekOffset, monthOffset);
  }, [selectedUserId, chartTimeframe, selectedYear, weekOffset, monthOffset, state.sales]);

  const chartTitleLabel = useMemo(() => {
    if (chartTimeframe === 'week') return 'Haftalik';
    if (chartTimeframe === 'month') {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() + monthOffset);
      return d.toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' });
    }
    if (chartTimeframe === 'year') return `Yillik - ${selectedYear}`;
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

  return (
    <div className="space-y-6">
      {viewingPhoto && <PhotoViewer photo={viewingPhoto} onClose={() => setViewingPhoto(null)} />}
      
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Ucell" value={state.sales.filter(s => s.date === today && s.company === 'Ucell').reduce((sum, s) => sum + s.count, 0)} icon={<Smartphone />} color="bg-purple-600" />
            <StatCard label="Mobiuz" value={state.sales.filter(s => s.date === today && s.company === 'Mobiuz').reduce((sum, s) => sum + s.count, 0)} icon={<Smartphone />} color="bg-red-600" />
            <StatCard label="Beeline" value={state.sales.filter(s => s.date === today && s.company === 'Beeline').reduce((sum, s) => sum + s.count, 0)} icon={<Smartphone />} color="bg-yellow-500" />
            <StatCard label="Uztelecom" value={state.sales.filter(s => s.date === today && s.company === 'Uztelecom').reduce((sum, s) => sum + s.count, 0)} icon={<Smartphone />} color="bg-blue-600" />
          </div>

          <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600"><Trophy className="w-5 h-5" /></div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Xodimlar Samaradorligi</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4 w-16 text-center">#</th>
                    <th className="px-8 py-4">Xodim</th>
                    <th className="px-8 py-4">Lavozim</th>
                    <th className="px-8 py-4 text-center">Bugungi Sotuv</th>
                    <th className="px-8 py-4 text-center">Oylik Sotuv</th>
                    <th className="px-8 py-4 text-right">Mavqei</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...operators]
                    .sort((a, b) => getUserSalesCount(b.id, 'month') - getUserSalesCount(a.id, 'month'))
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((op, idx) => {
                    const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                    const todayCount = getUserSalesCount(op.id, 'today');
                    const monthCount = getUserSalesCount(op.id, 'month');
                    const todayCheckIn = state.checkIns.find(ci => ci.userId === op.id && isDateMatch(ci.timestamp, today));
                    const lateness = todayCheckIn ? getLatenessStatus(todayCheckIn.timestamp, op.workingHours) : null;
                    
                    return (
                      <tr 
                        key={op.id} 
                        className={`transition group cursor-pointer ${lateness ? 'bg-red-50/50 hover:bg-red-100/50' : 'hover:bg-blue-50/30'}`}
                        onClick={() => {
                          setSelectedUserId(op.id);
                          setSelectedDay(null); // Defaults to today
                          setChartTimeframe('week');
                        }}
                      >
                        <td className="px-8 py-5 text-center">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
                            globalIdx === 0 ? 'bg-yellow-100 text-yellow-600' :
                            globalIdx === 1 ? 'bg-slate-200 text-slate-600' :
                            globalIdx === 2 ? 'bg-orange-100 text-orange-600' :
                            'bg-gray-50 text-gray-400'
                          }`}>
                            {globalIdx + 1}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs border ${lateness ? 'bg-red-600 text-white border-red-700 shadow-sm' : 'bg-gradient-to-br from-indigo-50 to-blue-50 text-blue-600 border-blue-100/50'} overflow-hidden`}>
                              {op.photo ? (
                                <img src={op.photo} alt={op.firstName} className="w-full h-full object-cover" />
                              ) : (
                                <>{op.firstName?.[0]}{op.lastName?.[0]}</>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-800">{op.firstName} {op.lastName}</span>
                              {lateness?.isLate && <span className="text-[8px] font-black text-red-600 uppercase tracking-widest">Kechikkan: {lateness.durationStr}</span>}
                              {lateness?.isEarly && <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Erta Kelgan: {lateness.durationStr}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter bg-gray-100 px-2 py-1 rounded-md">
                            {op.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className="inline-flex flex-col">
                            <span className="text-xl font-black text-blue-600">{todayCount}</span>
                            <span className="text-[8px] font-black text-gray-300 uppercase">dona</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className="inline-flex flex-col">
                            <span className="text-xl font-black text-indigo-600">{monthCount}</span>
                            <span className="text-[8px] font-black text-gray-300 uppercase">dona</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <div key={star} className={`w-1.5 h-1.5 rounded-full ${monthCount > (star * 20) ? 'bg-orange-400' : 'bg-gray-200'}`}></div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {operators.length > itemsPerPage && (
                <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-50">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="text-xs font-bold text-gray-600">
                    {currentPage} / {Math.ceil(operators.length / itemsPerPage)}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(operators.length / itemsPerPage), p + 1))}
                    disabled={currentPage === Math.ceil(operators.length / itemsPerPage)}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}
            </div>
          </section>

          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 h-[650px] flex flex-col">
            <div className="p-2 mb-2 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-base font-black text-gray-800 flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-600" /> Jonli Monitoring</h3>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{today}</span>
            </div>
            <div className="flex-1 overflow-hidden"><StaffMap checkIns={state.checkIns} reports={state.reports} users={state.users} today={today} onUserSelect={setSelectedUserId} /></div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-gray-800">Xodimlar Jamoasi</h2>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Xodimni qidirish..." className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl bg-white focus:ring-2 focus:ring-blue-500 transition outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredUsers.map(u => {
              const todayCheckIn = state.checkIns.find(ci => ci.userId === u.id && isDateMatch(ci.timestamp, today));
              const lateness = todayCheckIn ? getLatenessStatus(todayCheckIn.timestamp, u.workingHours) : null;
              
              return (
                <div key={u.id} onClick={() => { setSelectedUserId(u.id); setChartTimeframe('week'); setSelectedDay(null); }} className={`p-6 rounded-[2.5rem] border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group text-center relative overflow-hidden ${lateness?.isLate ? 'bg-red-50 border-red-200' : (lateness?.isEarly ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100')}`}>
                  {lateness?.isLate && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter shadow-md animate-pulse z-10">LATE</div>
                  )}
                  {lateness?.isEarly && (
                    <div className="absolute top-4 right-4 bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter shadow-md animate-pulse z-10">EARLY</div>
                  )}
                  <div className={`w-20 h-20 rounded-[1.8rem] flex items-center justify-center mx-auto mb-4 font-black text-2xl group-hover:scale-110 transition-transform ${lateness?.isLate ? 'bg-red-600 text-white shadow-lg shadow-red-200' : (lateness?.isEarly ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600')} overflow-hidden`}>
                    {u.photo ? (
                      <img src={u.photo} alt={u.firstName} className="w-full h-full object-cover" />
                    ) : (
                      <>{u.firstName?.[0]}{u.lastName?.[0]}</>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-gray-800">{u.firstName} {u.lastName}</h3>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">{u.role.replace('_', ' ')}</p>
                  <div className="mt-4 pt-4 border-t border-gray-50 flex justify-around">
                    <div className="text-center"><p className="text-[10px] font-black text-gray-400 uppercase">Bugun</p><p className={`font-black ${lateness?.isLate ? 'text-red-600' : (lateness?.isEarly ? 'text-blue-600' : 'text-blue-600')}`}>{getUserSalesCount(u.id, 'today')}</p></div>
                    <div className="text-center"><p className="text-[10px] font-black text-gray-400 uppercase">Oy</p><p className="font-black text-gray-800">{getUserSalesCount(u.id, 'month')}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-300">
              <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-xl" onClick={() => { setSelectedUserId(null); setSelectedDay(null); }}></div>
              <div className="bg-gray-50 w-full h-full md:h-[92vh] md:w-[92vw] md:rounded-[3rem] shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in slide-in-from-bottom-12">
                <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-50">
                  <div className="flex items-center gap-6">
                    <button onClick={() => { setSelectedUserId(null); setSelectedDay(null); }} className="p-3 bg-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 transition shadow-sm border border-gray-100"><ArrowLeft className="w-6 h-6" /></button>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center font-black text-2xl uppercase shadow-xl ring-4 ring-blue-50 overflow-hidden">
                        {selectedUser.photo ? (
                          <img src={selectedUser.photo} alt={selectedUser.firstName} className="w-full h-full object-cover" />
                        ) : (
                          <>{selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}</>
                        )}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-gray-800 leading-none mb-2">{selectedUser.firstName} {selectedUser.lastName}</h2>
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-600 text-white text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">{selectedUser.role.replace('_', ' ')}</span>
                          <span className="text-gray-400 text-[10px] font-bold">● {selectedUser.phone}</span>
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
                        className="appearance-none bg-blue-50 text-blue-600 pl-10 pr-10 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-gray-200 cursor-pointer hover:bg-blue-100 active:scale-[0.98] transition-all border border-transparent focus:border-gray-200 flex items-center gap-2 min-w-[180px]"
                      >
                        <span>{selectedUser.workingHours || "Vaqtni tanlang"}</span>
                      </button>
                      <Clock className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200" style={{ transform: isTimeDropdownOpen ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)' }}>
                        <ChevronRight className="w-3 h-3 text-blue-600 rotate-90" />
                      </div>

                      {isTimeDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 p-4">
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
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Ish boshlash</label>
                              <input 
                                type="time" 
                                value={tempStartTime}
                                onClick={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) {} }}
                                onChange={(e) => setTempStartTime(e.target.value)}
                                className="time-picker-input w-full p-3 bg-gray-50 rounded-xl text-sm font-bold text-gray-800 border border-gray-100 focus:border-blue-500 outline-none relative"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Ish tugatish</label>
                              <input 
                                type="time" 
                                value={tempEndTime}
                                onClick={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) {} }}
                                onChange={(e) => setTempEndTime(e.target.value)}
                                className="time-picker-input w-full p-3 bg-gray-50 rounded-xl text-sm font-bold text-gray-800 border border-gray-100 focus:border-blue-500 outline-none relative"
                              />
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
                              className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-md shadow-blue-200"
                            >
                              Saqlash
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => {
                        const text = prompt(`${selectedUser.firstName}ga xabar yuboring:`);
                        if (text) {
                          addMessage(`MENEJERDAN: ${text}`);
                          alert("Xabar yuborildi!");
                        }
                      }}
                      className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                    >
                      <Phone className="w-4 h-4" />
                      Xabar yuborish
                    </button>
                    <button onClick={() => { setSelectedUserId(null); setSelectedDay(null); }} className="p-3 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm"><X className="w-6 h-6" /></button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar bg-gray-50/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <RefinedStatCard 
                      label="Bugungi Sotuv" 
                      value={getUserSalesCount(selectedUser.id, 'today')} 
                      icon={<Clock />} 
                      color="bg-blue-600" 
                      isActive={chartTimeframe === 'week'}
                      onClick={() => setChartTimeframe('week')}
                    />
                    <RefinedStatCard 
                      label="Shu Oylik" 
                      value={getUserSalesCount(selectedUser.id, 'month')} 
                      icon={<CalendarDays />} 
                      color="bg-indigo-600" 
                      isActive={chartTimeframe === 'month'}
                      onClick={() => setChartTimeframe('month')}
                    />
                    <RefinedStatCard 
                      label="Telefon" 
                      value={selectedUser.phone} 
                      icon={<Phone />} 
                      color="bg-violet-600" 
                    />
                    <RefinedStatCard 
                      label="Jami" 
                      value={getUserSalesCount(selectedUser.id, 'total')} 
                      icon={<Award />} 
                      color="bg-emerald-600" 
                      isActive={chartTimeframe === 'year'}
                      onClick={() => setChartTimeframe('year')}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      <div className="bg-white rounded-[2rem] p-6 shadow-sm overflow-hidden border-none outline-none select-none no-outline-container">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                              <BarChart2 className="w-5 h-5 text-blue-600" /> 
                              Sotuvlar Dinamikasi ({chartTitleLabel})
                            </h3>
                            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 shadow-inner">
                              <button 
                                onClick={() => {
                                  if (chartTimeframe === 'week') setWeekOffset(prev => prev - 1);
                                  else if (chartTimeframe === 'month') setMonthOffset(prev => prev - 1);
                                  else if (chartTimeframe === 'year') setSelectedYear(prev => prev - 1);
                                }}
                                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-400 hover:text-blue-600 focus:outline-none"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <span className="text-[10px] font-black text-blue-600 px-2 uppercase tracking-tighter whitespace-nowrap min-w-[120px] text-center">
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
                                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-400 hover:text-blue-600 focus:outline-none"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {(selectedDay || weekOffset !== 0 || monthOffset !== 0 || (chartTimeframe === 'year' && selectedYear !== new Date().getFullYear())) && (
                              <button 
                                onClick={handleResetChart}
                                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-100 transition shadow-sm focus:outline-none"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> Bugunga qaytish
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="h-64 border-none outline-none bg-white focus:outline-none focus:ring-0 chart-wrapper">
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
                              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                              style={{ border: 'none', outline: 'none' }}
                            >
                              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 700}} 
                                interval={0}
                              />
                              <YAxis hide axisLine={false} tickLine={false} />
                              <Tooltip 
                                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', outline: 'none'}} 
                                cursor={{ fill: '#f1f5f9', radius: 4 }} 
                              />
                              {activeReferencePoint && (
                                <ReferenceLine x={activeReferencePoint.name} stroke="#2563eb" strokeWidth={2} strokeDasharray="3 3" />
                              )}
                              <Bar 
                                dataKey="sales" 
                                fill="#2563eb" 
                                radius={[12, 12, 0, 0]}
                                barSize={80}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-gray-50 relative flex flex-col md:flex-row items-center justify-between bg-white gap-4">
                          <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600"><Smartphone className="w-5 h-5" /></div>
                            <h3 className="text-lg font-black text-gray-800 tracking-tight">
                              {selectedDay || today} Kunlik Sotuvlar
                            </h3>
                          </div>
                          
                          <div className="flex flex-wrap justify-center items-center gap-2 w-full md:w-auto md:absolute md:left-1/2 md:-translate-x-1/2">
                            {(() => {
                              const targetDate = selectedDay || today;
                              const daySales = state.sales.filter(s => s.userId === selectedUser.id && s.date === targetDate);
                              const companies = [
                                { name: 'Ucell', color: 'border-purple-500 text-purple-600' },
                                { name: 'Mobiuz', color: 'border-red-500 text-red-600' },
                                { name: 'Beeline', color: 'border-yellow-500 text-yellow-600' },
                                { name: 'Uztelecom', color: 'border-blue-500 text-blue-600' }
                              ];
                              
                              return companies.map(c => {
                                const count = daySales.filter(s => s.company === c.name).reduce((acc, s) => acc + s.count + s.bonus, 0);
                                return (
                                  <div key={c.name} className={`px-3 py-1.5 rounded-lg border-2 ${c.color} bg-white font-bold text-xs flex items-center gap-2`}>
                                    <span className="uppercase text-[10px] opacity-70">{c.name}:</span>
                                    <span className="text-sm">{count}</span>
                                  </div>
                                );
                              });
                            })()}
                          </div>

                          <div className="w-full md:w-auto flex justify-end">
                            {selectedDay && (
                              <div className="flex items-center gap-2 text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                                <Calendar className="w-3 h-3" /> Tanlangan kun
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="bg-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                              <tr>
                                <th className="px-8 py-4">Kompaniya</th>
                                <th className="px-8 py-4">Tarif</th>
                                <th className="px-8 py-4 text-center">Soni</th>
                                <th className="px-8 py-4 text-center">Bonus</th>
                                <th className="px-8 py-4 text-center">Jami</th>
                                <th className="px-8 py-4 text-right">Vaqt</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {(() => {
                                const targetDate = selectedDay || today;
                                const daySales = state.sales.filter(s => s.userId === selectedUser.id && s.date === targetDate);
                                if (daySales.length === 0) {
                                  return (
                                    <tr>
                                      <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                            <PackageSearch className="w-10 h-10" />
                                          </div>
                                          <p className="text-sm font-black text-gray-400 italic">Bu kunda hech nima sotilmagan</p>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                }
                                return daySales.map(sale => (
                                  <tr key={sale.id} className="hover:bg-indigo-50/20 transition group">
                                    <td className="px-8 py-5">
                                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase group-hover:bg-indigo-600 group-hover:text-white transition-colors">{sale.company}</span>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-bold text-gray-700">{sale.tariff}</td>
                                    <td className="px-8 py-5 text-center font-black text-lg text-indigo-600">{sale.count}</td>
                                    <td className="px-8 py-5 text-center font-black text-lg text-gray-700">{sale.bonus.toLocaleString()}</td>
                                    <td className="px-8 py-5 text-center font-black text-lg text-indigo-600">{(sale.count + sale.bonus).toLocaleString()}</td>
                                    <td className="px-8 py-5 text-right text-[10px] font-bold text-gray-300">{new Date(sale.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                                  </tr>
                                ));
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* OPTIMIZED DAILY REPORT DISPLAY MATCHING SCREENSHOT */}
                      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-gray-50 bg-white">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600"><FileText className="w-5 h-5" /></div>
                            <h3 className="text-lg font-black text-gray-800 tracking-tight">
                              Kunlik Hisobot {selectedDay ? `(${selectedDay})` : '(Bugun)'}
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
                                  <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                    <AlertTriangle className="w-8 h-8" />
                                  </div>
                                  <p className="text-sm font-black text-gray-400 italic">Bu kun uchun hisobot yuborilmagan</p>
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-10">
                                {dailyReport.photos && dailyReport.photos.length > 0 && (
                                  <div className="space-y-5">
                                    <div className="flex items-center gap-3 px-2">
                                      <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
                                        <LayoutGrid className="w-4 h-4 text-indigo-500" />
                                      </div>
                                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">ILOVA QILINGAN RASMLAR ({dailyReport.photos.length})</p>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                      {dailyReport.photos.map((photo, idx) => (
                                        <div 
                                          key={idx}
                                          className="relative group cursor-pointer overflow-hidden rounded-[2.2rem] border-4 border-white shadow-xl aspect-square transition-all hover:scale-[1.02]"
                                          onClick={() => setViewingPhoto(photo)}
                                        >
                                          <img src={photo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
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

                                <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm flex flex-col gap-6">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kunlik Xulosa</span>
                                    </div>
                                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                      {new Date(dailyReport.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: true})}
                                    </span>
                                  </div>
                                  <p className="text-gray-800 font-bold text-2xl leading-relaxed tracking-tight">
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
                      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm focus:outline-none">
                        <h3 className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" /> {selectedDay || today} DAVOMAT</h3>
                        <div className="p-6 space-y-4">
                          {(() => {
                            const date = selectedDay || today;
                            const ci = state.checkIns.find(c => c.userId === selectedUser.id && isDateMatch(c.timestamp, date));
                            const co = state.reports.find(r => r.userId === selectedUser.id && r.date === date);
                            const lateness = ci ? getLatenessStatus(ci.timestamp, selectedUser.workingHours) : null;
                            const earlyDeparture = co ? getEarlyDepartureStatus(co.timestamp, selectedUser.workingHours) : null;
                            
                            const arrivalCardStyle = ci 
                              ? (lateness ? 'bg-red-50 border-red-300 shadow-red-100/50' : 'bg-green-50 border-green-100 shadow-green-100/50') 
                              : 'bg-red-50/50 border-red-100';

                            const departureCardStyle = co
                              ? (earlyDeparture ? 'bg-orange-50 border-orange-300 shadow-orange-100/50' : 'bg-blue-50 border-blue-100 shadow-blue-100/50')
                              : 'bg-gray-50 border-gray-100 opacity-60';
                            
                            return (
                              <>
                                <div className={`p-6 rounded-[2rem] border-2 transition-all duration-300 flex flex-col gap-2 shadow-sm ${arrivalCardStyle}`}>
                                  <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl shadow-md ${ci ? (lateness ? 'bg-red-600 text-white' : 'bg-green-600 text-white') : 'bg-red-600 text-white'}`}><LogInIcon className="w-5 h-5" /></div>
                                    <div className="flex-1">
                                      <div className="flex justify-between items-start">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Kelish</p>
                                        {lateness && (
                                          <div className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse shadow-md ring-2 ring-white">LATE</div>
                                        )}
                                      </div>
                                      <p className={`text-2xl font-black leading-none mt-1 ${ci ? (lateness ? 'text-red-900' : 'text-gray-800') : 'text-red-900/40'}`}>
                                        {ci ? new Date(ci.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: true}).toUpperCase() : 'Kelmagan'}
                                      </p>
                                      {lateness && (
                                        <div className="mt-2 pt-2 border-t border-red-200 flex items-center gap-1.5 text-red-600 font-black text-[10px] uppercase tracking-wider animate-in fade-in slide-in-from-top-2 duration-500">
                                          <AlertTriangle className="w-3.5 h-3.5" />
                                          <span>{lateness.durationStr} kechikish</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className={`p-6 rounded-[2rem] border-2 flex flex-col gap-2 shadow-sm transition-all ${departureCardStyle}`}>
                                  <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl shadow-md ${co ? (earlyDeparture ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white') : 'bg-gray-400 text-white'}`}><LogOutIcon className="w-5 h-5" /></div>
                                    <div className="flex-1">
                                      <div className="flex justify-between items-start">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ketish</p>
                                        {earlyDeparture && (
                                          <div className="bg-orange-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse shadow-md ring-2 ring-white">EARLY</div>
                                        )}
                                      </div>
                                      <p className={`text-2xl font-black leading-none mt-1 ${co ? (earlyDeparture ? 'text-orange-900' : 'text-gray-800') : 'text-gray-400'}`}>
                                        {co ? new Date(co.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: true}).toUpperCase() : 'Hali ketmagan'}
                                      </p>
                                      {earlyDeparture && (
                                        <div className="mt-2 pt-2 border-t border-orange-200 flex items-center gap-1.5 text-orange-600 font-black text-[10px] uppercase tracking-wider animate-in fade-in slide-in-from-top-2 duration-500">
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

                      <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-indigo-500" /> {selectedDay ? 'KUNDAGI FOTO' : 'OXIRGI FOTO'}
                        </h3>
                        {(() => {
                          const targetDate = selectedDay || today;
                          const dayCi = state.checkIns.find(c => c.userId === selectedUser.id && isDateMatch(c.timestamp, targetDate));
                          return dayCi ? (
                            <div 
                              className="relative group cursor-pointer overflow-hidden rounded-[1.5rem]"
                              onClick={() => setViewingPhoto(dayCi.photo)}
                            >
                              <img src={dayCi.photo} className="w-full h-40 object-cover shadow-sm border border-gray-50 group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30 text-white scale-90 group-hover:scale-100 transition-transform">
                                  <Maximize2 className="w-5 h-5" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="h-40 flex items-center justify-center text-gray-300 italic font-black text-xs uppercase tracking-widest bg-gray-50 rounded-[1.5rem] border-2 border-dashed border-gray-100">
                              {selectedDay ? 'Bu kunda foto yo\'q' : 'Hali foto yo\'q'}
                            </div>
                          );
                        })()}
                      </div>

                      <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-500" /> {selectedDay ? 'KUNDAGI JOYLAHUV' : 'OXIRGI JOYLAHUV'}
                        </h3>
                        {(() => {
                          const targetDate = selectedDay || today;
                          const dayCi = state.checkIns.find(c => c.userId === selectedUser.id && isDateMatch(c.timestamp, targetDate));
                          const initials = `${selectedUser.firstName?.[0] || ''}${selectedUser.lastName?.[0] || ''}`.toUpperCase();
                          return <SingleLocationMap location={dayCi?.location || null} initials={initials} />;
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
            <h2 className="text-2xl font-black text-gray-800">Xabarlar Markazi</h2>
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-2xl">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Jonli aloqa</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {state.messages.length > 0 ? (
              state.messages.map(m => (
                <div 
                  key={m.id} 
                  className={`p-6 rounded-[2rem] border transition-all relative group ${m.isRead ? 'bg-white border-gray-100' : 'bg-blue-50 border-blue-200 shadow-lg shadow-blue-100/50'}`}
                  onClick={() => !m.isRead && markMessageAsRead(m.id)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${m.senderName.includes('MENEJER') ? 'bg-indigo-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                        {m.senderName[0]}
                      </div>
                      <div>
                        <h4 className="font-black text-gray-800 text-sm">{m.senderName}</h4>
                        <p className="text-[10px] text-gray-400 font-bold">{new Date(m.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    {!m.isRead && <span className="px-2 py-1 bg-blue-600 text-white text-[8px] font-black rounded-md uppercase tracking-widest">Yangi</span>}
                  </div>
                  <p className="text-gray-700 font-medium leading-relaxed mb-4 pl-1">{m.text}</p>
                  
                  {!m.senderName.includes('MENEJER') && (
                    <div className="flex justify-end">
                      {isReplyingTo === m.id ? (
                        <div className="w-full space-y-3 animate-in slide-in-from-top-2">
                          <textarea 
                            className="w-full p-4 border border-blue-100 rounded-2xl bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition shadow-inner"
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
                              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-md"
                            >
                              Yuborish
                            </button>
                            <button 
                              onClick={() => setIsReplyingTo(null)}
                              className="px-6 py-2.5 bg-gray-100 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition"
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
                          className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                        >
                          Javob berish
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white rounded-[3rem] p-20 text-center border border-gray-100 shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                  <Phone className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-gray-800 mb-2">Xabarlar mavjud emas</h3>
                <p className="text-gray-400 font-medium">Xodimlar tomonidan yuborilgan xabarlar shu yerda ko'rinadi.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'simcards' && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
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
                        if (!targetMonth) return 'Oy tanlang';
                        const [y, m] = targetMonth.split('-');
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
                              const [y, m] = (targetMonth || new Date().toISOString().slice(0, 7)).split('-');
                              setTargetMonth(`${parseInt(y) - 1}-${m}`);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <span className="text-lg font-black text-gray-800">
                            {targetMonth.split('-')[0]}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const [y, m] = (targetMonth || new Date().toISOString().slice(0, 7)).split('-');
                              setTargetMonth(`${parseInt(y) + 1}-${m}`);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'].map((mName, i) => {
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
                      className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-100"
                    >
                      <Plus className="w-4 h-4" /> Reja Kiritish
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
                      className="bg-white text-indigo-600 border border-indigo-100 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 active:scale-95 transition-all shadow-sm"
                    >
                      <LayoutGrid className="w-4 h-4" /> Ofis Kiritish
                    </button>
                  </>
                )}
              </div>
            </div>

            {showOfficeForm && (
              <div className="mb-10 p-8 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100 animate-in slide-in-from-top duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-indigo-900">{targetMonth} uchun ofis va mobil ofis sotuvlarini kiritish</h3>
                  <button onClick={() => setShowOfficeForm(false)} className="p-2 text-gray-400 hover:text-red-500 transition"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  {['Ucell', 'Mobiuz', 'Beeline', 'Uztelecom'].map(company => (
                    <div key={company} className="space-y-4 bg-white p-4 rounded-2xl border border-indigo-50 shadow-sm">
                      <h4 className="font-black text-gray-800 text-center border-b border-gray-100 pb-2 mb-2">{company}</h4>
                      
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-2">Ofis (dona)</label>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm font-bold outline-none focus:border-indigo-600 transition"
                          value={officeForm[company as keyof typeof officeForm]}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '' || /^\d+$/.test(val)) {
                              setOfficeForm({...officeForm, [company]: val});
                            }
                          }}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-2">Mobil Ofis (dona)</label>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm font-bold outline-none focus:border-indigo-600 transition"
                          value={mobileOfficeForm[company as keyof typeof mobileOfficeForm]}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '' || /^\d+$/.test(val)) {
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
                    className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-indigo-700 transition-all"
                  >
                    Saqlash
                  </button>
                  <button 
                    onClick={() => setShowOfficeForm(false)}
                    className="px-10 py-5 bg-white border border-gray-200 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                  >
                    Bekor qilish
                  </button>
                </div>
              </div>
            )}

            {showTargetForm && (
              <div className="mb-10 p-8 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100 animate-in slide-in-from-top duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-indigo-900">{targetMonth} uchun reja kiritish</h3>
                  <button onClick={() => setShowTargetForm(false)} className="p-2 text-gray-400 hover:text-red-500 transition"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  {['Ucell', 'Mobiuz', 'Beeline', 'Uztelecom'].map(company => (
                    <div key={company} className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">{company} (dona)</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-full p-4 border border-gray-200 rounded-2xl bg-white text-sm font-bold outline-none focus:border-indigo-600 transition"
                        value={targetForm[company as keyof typeof targetForm]}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '' || /^\d+$/.test(val)) {
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
                    className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-indigo-700 transition-all"
                  >
                    Saqlash
                  </button>
                  <button 
                    onClick={() => setShowTargetForm(false)}
                    className="px-10 py-5 bg-white border border-gray-200 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                  >
                    Bekor qilish
                  </button>
                </div>
              </div>
            )}

            {inventoryModalUser && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-white rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-gray-800">
                      {inventoryModalUser.firstName} {inventoryModalUser.lastName} - Simkarta Ombori
                    </h3>
                    <button onClick={() => setInventoryModalUser(null)} className="p-2 hover:bg-gray-100 rounded-full transition"><X className="w-5 h-5 text-gray-400" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {['Ucell', 'Mobiuz', 'Beeline', 'Uztelecom'].map(company => (
                      <div key={company} className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">{company} (mavjud)</label>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-full p-4 border border-gray-200 rounded-2xl bg-white text-lg font-bold outline-none focus:border-indigo-600 transition"
                          value={inventoryForm[company as keyof typeof inventoryForm]}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '' || /^\d+$/.test(val)) {
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
                      className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-indigo-700 transition-all"
                    >
                      Saqlash
                    </button>
                    <button 
                      onClick={() => setInventoryModalUser(null)}
                      className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all"
                    >
                      Bekor qilish
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Ucell', color: 'bg-purple-600', textColor: 'text-purple-600' },
                { name: 'Mobiuz', color: 'bg-red-600', textColor: 'text-red-600' },
                { name: 'Beeline', color: 'bg-yellow-400', textColor: 'text-yellow-600' },
                { name: 'Uztelecom', color: 'bg-blue-500', textColor: 'text-blue-500' }
              ].map(company => {
                const target = state.monthlyTargets?.find(t => t.month === targetMonth)?.targets?.[company.name] || 0;
                const officeCount = state.monthlyTargets?.find(t => t.month === targetMonth)?.officeCounts?.[company.name] || 0;
                const mobileOfficeCount = state.monthlyTargets?.find(t => t.month === targetMonth)?.mobileOfficeCounts?.[company.name] || 0;
                const sales = state.sales.filter(s => s.company === company.name && s.date.startsWith(targetMonth)).reduce((sum, s) => sum + s.count, 0);
                
                // Total sales including manual office/mobile office entries if needed, 
                // but usually sales come from Operator inputs. 
                // If the user wants these to be purely manual additions on top of operator sales, 
                // we should add them to 'sales'. 
                // However, based on the context, these seem to be breakdowns or separate stats.
                // Let's assume they are just for display breakdown as requested.
                
                const rawPercentage = target > 0 ? (sales / target) * 100 : 0;
                const percentage = Math.min(100, rawPercentage);
                
                return (
                  <div key={company.name} className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-14 h-14 ${company.color} rounded-2xl shadow-lg flex items-center justify-center text-white group-hover:rotate-12 transition-transform`}>
                        <Smartphone className="w-7 h-7" />
                      </div>
                      <div className="text-right">
                        <p className={`text-3xl font-black ${company.textColor}`}>{sales}</p>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sotildi</p>
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
                      <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2 pt-2 border-t border-gray-50">
                        <div>Mobil ofis: <span className="text-gray-800 ml-1">{mobileOfficeCount}</span></div>
                        <div>Ofis: <span className="text-gray-800 ml-1">{officeCount}</span></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-gray-800">Mavjud Simkartalar Ro'yxati</h3>
              <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-black text-sm uppercase tracking-widest border border-indigo-100">
                Jami: {operators.reduce((acc: number, user: User) => acc + Object.values(user.inventory || {}).reduce((sum: number, count: number) => sum + count, 0), 0)} dona
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

                const totalSims = Object.values(counts).reduce((a: number, b: number) => a + b, 0);

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
                    className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-95"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gray-200 flex items-center justify-center font-black text-gray-800 overflow-hidden text-xl shadow-inner">
                          {user.photo ? (
                            <img src={user.photo} alt={user.firstName} className="w-full h-full object-cover" />
                          ) : (
                            <>{user.firstName?.[0]}{user.lastName?.[0]}</>
                          )}
                        </div>
                        <div>
                          <h4 className="text-2xl font-black text-gray-800 leading-none mb-1 group-hover:text-indigo-600 transition-colors">{user.firstName} {user.lastName}</h4>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">OPERATOR</p>
                        </div>
                      </div>
                      <div className="text-right bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <p className="text-2xl font-black text-indigo-600 group-hover:text-white">{totalSims}</p>
                        <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest group-hover:text-indigo-200">Jami</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { name: 'Ucell', color: 'text-purple-600', bg: 'bg-purple-50' },
                        { name: 'Mobiuz', color: 'text-red-600', bg: 'bg-red-50' },
                        { name: 'Beeline', color: 'text-yellow-600', bg: 'bg-yellow-50' },
                        { name: 'Uztelecom', color: 'text-blue-600', bg: 'bg-blue-50' }
                      ].map(provider => (
                        <div key={provider.name} className={`p-4 rounded-2xl ${provider.bg} border border-gray-100/50`}>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{provider.name}</p>
                          <p className={`text-2xl font-black ${provider.color}`}>{counts[provider.name as keyof typeof counts]} <span className="text-[10px] text-gray-400 font-bold">dona</span></p>
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
            <div key={u.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl">{u.firstName?.[0]}</div>
                <div><h4 className="text-lg font-black text-gray-800 leading-none mb-1">{u.firstName} {u.lastName}</h4><p className="text-xs text-gray-400 font-bold">{u.phone} • {u.role.replace('_', ' ')}</p></div>
              </div>
              <button onClick={() => approveUser(u.id)} className="p-4 bg-green-500 text-white rounded-2xl shadow-xl shadow-green-100 transition hover:bg-green-600"><CheckCircle className="w-6 h-6" /></button>
            </div>
          ))}
          {pendingUsers.length === 0 && <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 italic text-gray-400 font-bold uppercase tracking-widest text-[10px]">Yangi so'rovlar mavjud emas</div>}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-8 border-b border-gray-50"><h2 className="text-xl font-black text-gray-800">Barcha Kunlik Hisobotlar</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest"><tr><th className="px-8 py-4">Xodim</th><th className="px-8 py-4">Sana</th><th className="px-8 py-4">Xulosa</th><th className="px-8 py-4 text-right">Vaqt</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {state.reports.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((rep, idx) => {
                  const u = state.users.find(user => user.id === rep.userId);
                  return (
                    <tr 
                      key={idx} 
                      className="hover:bg-blue-50/50 transition cursor-pointer group"
                      onClick={() => {
                        setSelectedUserId(rep.userId);
                        setSelectedDay(rep.date);
                        setChartTimeframe('week');
                      }}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {u?.firstName?.[0]}{u?.lastName?.[0]}
                          </div>
                          <span className="font-bold text-gray-800">{u?.firstName} {u?.lastName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm text-gray-400 font-medium">{rep.date}</td>
                      <td className="px-8 py-6 text-sm text-gray-700 italic leading-relaxed truncate max-w-xs">"{rep.summary}"</td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                            {new Date(rep.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors" />
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
          stroke: #f1f5f9 !important;
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
          border: 2px solid white;
          color: white;
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
          border-top: 10px solid;
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
          background: inherit;
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
          background: #2563eb;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 10px 25px rgba(37, 99, 235, 0.4);
        }
        .pin-initials {
          transform: rotate(45deg);
          color: white;
          font-weight: 900;
          font-size: 12px;
          letter-spacing: -0.01em;
        }
        .map-custom-tooltip {
          background: white;
          border: none;
          border-radius: 16px;
          box-shadow: 0 15px 35px -5px rgba(0,0,0,0.15);
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
  <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 flex items-center justify-between shadow-sm hover:-translate-y-1 transition-all group">
    <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p><p className="text-3xl font-black text-gray-800 leading-none">{value}</p></div>
    <div className={`${color} text-white p-5 rounded-2xl shadow-xl transition-all group-hover:scale-110 group-hover:rotate-6`}>{React.cloneElement(icon, { className: 'w-7 h-7' })}</div>
  </div>
);

const RefinedStatCard = ({ label, value, icon, color, onClick, isActive }: any) => (
  <div 
    onClick={onClick}
    className={`bg-white p-5 rounded-2xl border-2 transition-all ${onClick ? 'cursor-pointer active:scale-95' : ''} ${isActive ? 'ring-4 ring-blue-500/10 border-blue-500 shadow-xl' : 'border-gray-100 shadow-sm hover:border-blue-200'}`}
  >
    <div className="flex items-center gap-4">
      <div className={`${color} text-white p-3 rounded-xl shadow-md`}>{React.cloneElement(icon, { className: 'w-5 h-5' })}</div>
      <div>
        <p className={`text-[8px] font-black uppercase tracking-widest mb-0.5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{label}</p>
        <p className="text-lg font-black text-gray-800 truncate max-w-[100px]">{value}</p>
      </div>
    </div>
  </div>
);

export default ManagerPanel;
