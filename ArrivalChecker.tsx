
import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import ManagerPanel from './components/ManagerPanel';
import OperatorPanel from './components/OperatorPanel';
import Calculator from './components/Calculator';
import RulesPanel from './components/RulesPanel';
import RulesView from './components/RulesView';
import { AppState, Role, User, CheckIn, SimSale, DailyReport, Message, MonthlyTarget } from './types';
import { getTodayStr, isDateMatch } from './utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sun, Moon, Globe, Hash } from 'lucide-react';
import { t, Language } from './translations';

const ArrivalChecker: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('paynet_app_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          currentUser: parsed.currentUser || null,
          users: parsed.users || [],
          checkIns: parsed.checkIns || [],
          sales: parsed.sales || [],
          reports: parsed.reports || [],
          simInventory: parsed.simInventory || { 'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0 },
          messages: parsed.messages || [],
          rules: parsed.rules || [],
          monthlyTargets: parsed.monthlyTargets || [],
          tariffs: parsed.tariffs || { 'Ucell': [], 'Mobiuz': [], 'Beeline': [], 'Uztelecom': [] }
        };
      } catch (e) {
        console.error("Failed to parse state", e);
      }
    }
    return {
      currentUser: null,
      users: [],
      checkIns: [],
      sales: [],
      reports: [],
      simInventory: { 'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0 },
      messages: [],
      rules: [],
      monthlyTargets: [],
      tariffs: { 'Ucell': [], 'Mobiuz': [], 'Beeline': [], 'Uztelecom': [] }
    };
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'reports' | 'approvals' | 'messages' | 'rules' | 'simcards'>('overview');
  const [operatorTab, setOperatorTab] = useState('checkin');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('paynet_app_dark_mode');
    return saved === null ? true : saved === 'true';
  });
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('paynet_app_language');
    return (saved as Language) || 'uz';
  });

  useEffect(() => {
    localStorage.setItem('paynet_app_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('paynet_app_dark_mode', isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('paynet_app_state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'paynet_app_state' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setState(prev => {
            // Only update if the new state is actually different to avoid infinite loops
            if (JSON.stringify(prev) !== JSON.stringify(parsed)) {
              return parsed;
            }
            return prev;
          });
        } catch (err) {
          console.error('Failed to parse state from storage event', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
  };

  if (!state.currentUser) {
    return <Auth state={state} setState={setState} language={language} setLanguage={setLanguage} />;
  }

  if (!state.currentUser.isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-black p-4">
        <div className="bg-brand-dark p-10 rounded-[3rem] shadow-2xl text-center max-w-md w-full border border-white/10 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-brand-gold/10 text-brand-gold rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-3xl shadow-xl border border-brand-gold/20">⏳</div>
          <h2 className="text-3xl font-black text-white mb-3 uppercase tracking-tight">{t(language, 'pending_approval')}</h2>
          <p className="text-white/40 mb-8 font-medium leading-relaxed">{t(language, 'account_approval_wait')}</p>
          <button onClick={handleLogout} className="w-full py-5 bg-white/5 hover:bg-white/10 text-white/60 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all border border-white/10">{t(language, 'logout')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-brand-black font-sans text-white ${state.currentUser.role === Role.MANAGER ? 'flex' : ''}`}>
      {state.currentUser.role === Role.MANAGER ? (
        <aside className="w-72 h-screen sticky top-0 flex flex-col bg-brand-black/80 backdrop-blur-md border-r border-white/10 theme-blue-box z-30 shrink-0">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute -inset-1 bg-brand-gold rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative w-12 h-12 bg-brand-black border border-brand-gold/50 rounded-xl flex flex-col items-center justify-center text-brand-gold font-black shadow-2xl overflow-hidden">
                  <Crown className="w-6 h-6 mb-0.5" />
                  <div className="flex gap-0.5 mt-0.5">
                     <div className="w-1.5 h-1 bg-brand-gold/40 rounded-full"></div>
                     <div className="w-1.5 h-1 bg-brand-gold/40 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-black tracking-tighter gold-text-gradient leading-none uppercase">{t(language, 'brand_name')}</h1>
                <h1 className="text-xs font-bold tracking-[0.2em] text-white/60 leading-none uppercase mt-1">{t(language, 'brand_subtitle')}</h1>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between bg-white/5 p-1.5 rounded-xl border border-white/10">
              <button 
                onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
                className={`flex-1 p-2 flex justify-center transition-all rounded-lg ${isCalculatorOpen ? 'text-brand-gold bg-brand-gold/10 border border-brand-gold/30 shadow-lg shadow-brand-gold/10' : 'text-white/40 hover:text-brand-gold hover:bg-white/5 border border-transparent'}`}
                title={t(language, 'calculator')}
              >
                <Hash className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-white/10"></div>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="flex-1 p-2 flex justify-center text-white/40 hover:text-brand-gold transition-colors rounded-lg hover:bg-white/5"
                title={isDarkMode ? t(language, 'day_mode') : t(language, 'night_mode')}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <div className="w-px h-4 bg-white/10"></div>
              <div className="relative group flex-1">
                <button className="w-full flex justify-center items-center gap-1.5 p-2 text-white/40 hover:text-brand-gold transition-colors rounded-lg hover:bg-white/5">
                  <Globe className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{language}</span>
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-brand-dark border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                  <button onClick={() => setLanguage('uz')} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${language === 'uz' ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>{t(language, 'uzbek')}</button>
                  <button onClick={() => setLanguage('ru')} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors border-t border-white/5 ${language === 'ru' ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>{t(language, 'russian')}</button>
                  <button onClick={() => setLanguage('en')} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors border-t border-white/5 ${language === 'en' ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>{t(language, 'english')}</button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
            {[
              { id: 'overview', label: t(language, 'overview'), icon: '📊' },
              { id: 'users', label: t(language, 'employees'), icon: '👥' },
              { id: 'reports', label: t(language, 'reports'), icon: '📝' },
              { id: 'simcards', label: t(language, 'inventory_plan'), icon: '📱' },
              { id: 'messages', label: t(language, 'messages'), icon: '💬' },
              { id: 'rules', label: t(language, 'rules'), icon: '📋' },
              { id: 'approvals', label: t(language, 'approvals'), icon: '✅', count: state.users.filter(u => !u.isApproved).length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-xs font-black transition-all uppercase tracking-wider ${
                  activeTab === tab.id 
                    ? 'bg-brand-gold text-brand-black shadow-lg shadow-brand-gold/20' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
                {tab.count ? (
                  <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{tab.count}</span>
                ) : null}
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-white/10">
            <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center text-brand-gold font-black text-sm">
                  {state.currentUser.firstName[0]}
                </div>
                <div>
                  <p className="text-xs font-black text-white tracking-tight">{state.currentUser.firstName} {state.currentUser.lastName}</p>
                  <p className="text-[9px] text-brand-gold font-black uppercase tracking-widest">{state.currentUser.role.replace('_', ' ')}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-white/40 hover:text-red-500 transition-all rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                title={t(language, 'logout')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              </button>
            </div>
          </div>
        </aside>
      ) : (
        <header className="theme-blue-box bg-brand-black/80 backdrop-blur-md border-b border-white/10 relative z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative group">
                <div className="absolute -inset-1 bg-brand-gold rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative w-12 h-12 bg-brand-black border border-brand-gold/50 rounded-xl flex flex-col items-center justify-center text-brand-gold font-black shadow-2xl overflow-hidden">
                  <Crown className="w-6 h-6 mb-0.5" />
                  <div className="flex gap-0.5 mt-0.5">
                     <div className="w-1.5 h-1 bg-brand-gold/40 rounded-full"></div>
                     <div className="w-1.5 h-1 bg-brand-gold/40 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-black tracking-tighter gold-text-gradient leading-none uppercase">{t(language, 'brand_name')}</h1>
                <h1 className="text-xs font-bold tracking-[0.2em] text-white/60 leading-none uppercase mt-1">{t(language, 'brand_subtitle')}</h1>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto flex items-center justify-start sm:justify-center gap-1.5 no-scrollbar px-2 min-w-0">
              {[
                { id: 'checkin', label: t(language, 'home'), icon: '🏠' },
                { id: 'simcards', label: t(language, 'inventory'), icon: '📱' },
                { id: 'monitoring', label: t(language, 'monitoring'), icon: '📈' },
                { id: 'rating', label: t(language, 'rating'), icon: '🏆' },
                { id: 'messages', label: t(language, 'messages'), icon: '💬' },
                { id: 'rules', label: t(language, 'rules'), icon: '📋' },
                { id: 'profile', label: t(language, 'profile'), icon: '👤' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setOperatorTab(tab.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black whitespace-nowrap transition-all uppercase tracking-wider ${
                    operatorTab === tab.id 
                      ? 'bg-brand-gold text-brand-black shadow-lg shadow-brand-gold/20' 
                      : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="inline">{tab.label}</span>
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                <button 
                  onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
                  className={`p-2 transition-all rounded-lg ${isCalculatorOpen ? 'text-brand-gold bg-brand-gold/10 border border-brand-gold/30 shadow-lg shadow-brand-gold/10' : 'text-white/40 hover:text-brand-gold hover:bg-white/5 border border-transparent'}`}
                  title={t(language, 'calculator')}
                >
                  <Hash className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-white/10"></div>
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 text-white/40 hover:text-brand-gold transition-colors rounded-lg hover:bg-white/5"
                  title={isDarkMode ? t(language, 'day_mode') : t(language, 'night_mode')}
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <div className="w-px h-4 bg-white/10"></div>
                <div className="relative group">
                  <button className="flex items-center gap-1.5 p-2 text-white/40 hover:text-brand-gold transition-colors rounded-lg hover:bg-white/5">
                    <Globe className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{language}</span>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-32 bg-brand-dark border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                    <button onClick={() => setLanguage('uz')} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${language === 'uz' ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>{t(language, 'uzbek')}</button>
                    <button onClick={() => setLanguage('ru')} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors border-t border-white/5 ${language === 'ru' ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>{t(language, 'russian')}</button>
                    <button onClick={() => setLanguage('en')} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors border-t border-white/5 ${language === 'en' ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>{t(language, 'english')}</button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                <div className="w-9 h-9 rounded-xl bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center text-brand-gold font-black text-sm">
                  {state.currentUser.firstName[0]}
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-black text-white tracking-tight">{state.currentUser.firstName} {state.currentUser.lastName}</p>
                  <p className="text-[9px] text-brand-gold font-black uppercase tracking-widest">{state.currentUser.role.replace('_', ' ')}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-3 text-white/40 hover:text-red-500 transition-all rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                title={t(language, 'logout')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={state.currentUser.role === Role.MANAGER ? "flex-1 overflow-y-auto p-4 sm:p-8" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8"}>
        {state.currentUser.role === Role.MANAGER ? (
          <>
            {/* Manager Navigation removed from here */}

            <ManagerPanel 
              state={state}
              isDarkMode={isDarkMode}
              approveUser={(userId) => setState(prev => ({ ...prev, users: prev.users.map(u => u.id === userId ? { ...u, isApproved: true } : u) }))}
              updateUser={(userId, updates) => setState(prev => {
                // If workingHours is being updated, handle check-ins
                let newCheckIns = prev.checkIns;
                if (updates.workingHours) {
                  const user = prev.users.find(u => u.id === userId);
                  if (user) {
                    const today = getTodayStr();
                    newCheckIns = prev.checkIns.map(ci => {
                      if (ci.userId === userId) {
                        const isToday = ci.date === today || isDateMatch(ci.timestamp, today);
                        
                        if (isToday) {
                          // For today, ALWAYS update to the NEW working hours
                          return { ...ci, workingHours: updates.workingHours };
                        } else if (!ci.workingHours && user.workingHours) {
                          // For past days, if missing, backfill with OLD working hours to preserve history
                          return { ...ci, workingHours: user.workingHours };
                        }
                      }
                      return ci;
                    });
                  }
                }
                
                return {
                  ...prev,
                  users: prev.users.map(u => u.id === userId ? { ...u, ...updates } : u),
                  checkIns: newCheckIns
                };
              })}
              updateCheckIn={(userId, date, updates) => setState(prev => ({ ...prev, checkIns: prev.checkIns.map(c => c.userId === userId && isDateMatch(c.timestamp, date) ? { ...c, ...updates } : c) }))}
              updateReport={(userId, date, updates) => setState(prev => ({ ...prev, reports: prev.reports.map(r => r.userId === userId && r.date === date ? { ...r, ...updates } : r) }))}
              addMessage={(text, recipientId) => setState(prev => ({ ...prev, messages: [...prev.messages, { id: Date.now().toString(), senderId: state.currentUser!.id, senderName: 'MENEJER', recipientId, text, timestamp: new Date().toISOString(), isRead: false }] }))}
              markMessageAsRead={(msgId) => setState(prev => ({ ...prev, messages: prev.messages.map(m => m.id === msgId ? { ...m, isRead: true } : m) }))}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              addSimInventory={(company, count) => setState(prev => ({ ...prev, simInventory: { ...prev.simInventory, [company]: (prev.simInventory[company] || 0) + count } }))}
              setMonthlyTarget={(month, targets, officeCounts, mobileOfficeCounts) => setState(prev => {
                const existing = prev.monthlyTargets.find(t => t.month === month);
                if (existing) {
                  return { ...prev, monthlyTargets: prev.monthlyTargets.map(t => t.month === month ? { ...t, targets, officeCounts, mobileOfficeCounts } : t) };
                }
                return { ...prev, monthlyTargets: [...prev.monthlyTargets, { month, targets, officeCounts, mobileOfficeCounts }] };
              })}
              addTariff={(company, tariff) => setState(prev => {
                const currentTariffs = prev.tariffs?.[company] || [];
                if (!currentTariffs.includes(tariff)) {
                  return {
                    ...prev,
                    tariffs: {
                      ...prev.tariffs,
                      [company]: [...currentTariffs, tariff]
                    }
                  };
                }
                return prev;
              })}
              removeTariff={(company, tariff) => setState(prev => {
                const currentTariffs = prev.tariffs?.[company] || [];
                return {
                  ...prev,
                  tariffs: {
                    ...prev.tariffs,
                    [company]: currentTariffs.filter(t => t !== tariff)
                  }
                };
              })}
              language={language}
            />
            {activeTab === 'rules' && (
              <RulesPanel state={state} setState={setState} language={language} />
            )}
          </>
        ) : (
          <>
             {/* Operator Navigation removed from here */}

            {operatorTab === 'rules' ? (
              <RulesView state={state} language={language} />
            ) : (
              <OperatorPanel 
                user={state.currentUser}
                state={state}
              addCheckIn={(checkIn) => setState(prev => ({ ...prev, checkIns: [...prev.checkIns, checkIn] }))}
              updateCheckIn={(userId, date, updates) => setState(prev => ({ ...prev, checkIns: prev.checkIns.map(c => c.userId === userId && c.timestamp.startsWith(date) ? { ...c, ...updates } : c) }))}
              updateReport={(userId, date, updates) => setState(prev => ({ ...prev, reports: prev.reports.map(r => r.userId === userId && r.date === date ? { ...r, ...updates } : r) }))}
              updateUser={(userId, updates) => setState(prev => {
                // If workingHours is being updated, handle check-ins
                let newCheckIns = prev.checkIns;
                if (updates.workingHours) {
                  const user = prev.users.find(u => u.id === userId);
                  if (user) {
                    const today = getTodayStr();
                    newCheckIns = prev.checkIns.map(ci => {
                      if (ci.userId === userId) {
                        const isToday = ci.date === today || isDateMatch(ci.timestamp, today);
                        
                        if (isToday) {
                          // For today, ALWAYS update to the NEW working hours
                          return { ...ci, workingHours: updates.workingHours };
                        } else if (!ci.workingHours && user.workingHours) {
                          // For past days, if missing, backfill with OLD working hours to preserve history
                          return { ...ci, workingHours: user.workingHours };
                        }
                      }
                      return ci;
                    });
                  }
                }
                
                return {
                  ...prev,
                  users: prev.users.map(u => u.id === userId ? { ...u, ...updates } : u),
                  checkIns: newCheckIns
                };
              })}
              addSale={(sale) => setState(prev => {
                // Deduct from inventory
                const user = prev.users.find(u => u.id === sale.userId);
                if (user && user.inventory) {
                  const newInventory = { ...user.inventory };
                  if (newInventory[sale.company] >= (sale.count + sale.bonus)) {
                    newInventory[sale.company] -= (sale.count + sale.bonus);
                    // Update user inventory and add sale
                    const updatedUsers = prev.users.map(u => u.id === user.id ? { ...u, inventory: newInventory } : u);
                    return {
                      ...prev,
                      users: updatedUsers,
                      currentUser: prev.currentUser && prev.currentUser.id === user.id ? { ...prev.currentUser, inventory: newInventory } : prev.currentUser,
                      sales: [...prev.sales, sale]
                    };
                  }
                }
                return prev; // Should be handled in UI validation, but safety check here
              })}
              removeSale={(saleId) => setState(prev => {
                const sale = prev.sales.find(s => s.id === saleId);
                if (sale) {
                  // Restore inventory
                  const user = prev.users.find(u => u.id === sale.userId);
                  let updatedUsers = prev.users;
                  let updatedCurrentUser = prev.currentUser;

                  if (user && user.inventory) {
                    const newInventory = { ...user.inventory };
                    newInventory[sale.company] = (newInventory[sale.company] || 0) + (sale.count + sale.bonus);
                    updatedUsers = prev.users.map(u => u.id === user.id ? { ...u, inventory: newInventory } : u);
                    if (prev.currentUser && prev.currentUser.id === user.id) {
                      updatedCurrentUser = { ...prev.currentUser, inventory: newInventory };
                    }
                  }

                  return {
                    ...prev,
                    users: updatedUsers,
                    currentUser: updatedCurrentUser,
                    sales: prev.sales.filter(s => s.id !== saleId)
                  };
                }
                return prev;
              })}
              updateSale={(saleId, updates) => setState(prev => {
                const oldSale = prev.sales.find(s => s.id === saleId);
                if (oldSale) {
                  // Complex inventory logic needed here if count changes, simplified for now:
                  // 1. Revert old sale from inventory
                  // 2. Apply new sale to inventory
                  // This is better handled by removing and re-adding or careful diffing.
                  // For this demo, we'll assume the UI handles validation and we just update state.
                  // In a real app, this needs transaction-like safety.
                  
                  // Let's do a simple inventory adjustment if count/bonus changes
                  const user = prev.users.find(u => u.id === oldSale.userId);
                  if (user && user.inventory) {
                    const newInventory = { ...user.inventory };
                    // Revert old
                    newInventory[oldSale.company] = (newInventory[oldSale.company] || 0) + (oldSale.count + oldSale.bonus);
                    
                    const newCount = updates.count !== undefined ? updates.count : oldSale.count;
                    const newBonus = updates.bonus !== undefined ? updates.bonus : oldSale.bonus;
                    const newCompany = updates.company || oldSale.company;

                    // Apply new
                    if (newInventory[newCompany] >= (newCount + newBonus)) {
                      newInventory[newCompany] -= (newCount + newBonus);
                      return {
                        ...prev,
                        users: prev.users.map(u => u.id === user.id ? { ...u, inventory: newInventory } : u),
                        sales: prev.sales.map(s => s.id === saleId ? { ...s, ...updates } : s)
                      };
                    }
                  }
                }
                return prev;
              })}
              addReport={(report) => setState(prev => ({ ...prev, reports: [...prev.reports, report] }))}
              addSimInventory={(company, count) => setState(prev => {
                const user = prev.users.find(u => u.id === state.currentUser!.id);
                if (user) {
                  const newInventory = { ...(user.inventory || {}) };
                  newInventory[company] = (newInventory[company] || 0) + count;
                  return {
                    ...prev,
                    users: prev.users.map(u => u.id === user.id ? { ...u, inventory: newInventory } : u)
                  };
                }
                return prev;
              })}
              addMessage={(text) => setState(prev => ({ ...prev, messages: [...prev.messages, { id: Date.now().toString(), senderId: state.currentUser!.id, senderName: `${state.currentUser!.firstName} ${state.currentUser!.lastName}`, recipientId: 'manager', text, timestamp: new Date().toISOString(), isRead: false }] }))}
              markMessageAsRead={(msgId) => setState(prev => ({ ...prev, messages: prev.messages.map(m => m.id === msgId ? { ...m, isRead: true } : m) }))}
              activeTab={operatorTab}
              language={language}
            />
            )}
          </>
        )}
      </main>

      <AnimatePresence>
        {isCalculatorOpen && (
          <Calculator onClose={() => setIsCalculatorOpen(false)} language={language} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ArrivalChecker;
