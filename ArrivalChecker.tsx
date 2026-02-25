
import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import ManagerPanel from './components/ManagerPanel';
import OperatorPanel from './components/OperatorPanel';
import { AppState, Role, User, CheckIn, SimSale, DailyReport, Message, MonthlyTarget } from './types';

const ArrivalChecker: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('paynet_app_state');
    return saved ? JSON.parse(saved) : {
      currentUser: null,
      users: [],
      checkIns: [],
      sales: [],
      reports: [],
      simInventory: { 'Ucell': 0, 'Mobiuz': 0, 'Beeline': 0, 'Uztelecom': 0 },
      messages: [],
      monthlyTargets: []
    };
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'reports' | 'approvals' | 'messages' | 'simcards'>('overview');
  const [operatorTab, setOperatorTab] = useState('checkin');

  useEffect(() => {
    localStorage.setItem('paynet_app_state', JSON.stringify(state));
  }, [state]);

  const handleLogout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
  };

  if (!state.currentUser) {
    return <Auth state={state} setState={setState} />;
  }

  if (!state.currentUser.isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">⏳</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Tasdiqlash kutilmoqda</h2>
          <p className="text-gray-500 mb-6">Sizning hisobingiz menejer tomonidan tasdiqlanishi kerak. Iltimos, kuting.</p>
          <button onClick={handleLogout} className="text-blue-600 font-medium hover:underline">Chiqish</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm">SB</div>
            <h1 className="text-lg font-bold text-gray-800 hidden sm:block">Sam Brend Nomer</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                {state.currentUser.firstName[0]}
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-gray-800">{state.currentUser.firstName} {state.currentUser.lastName}</p>
                <p className="text-[10px] text-gray-500 font-medium uppercase">{state.currentUser.role.replace('_', ' ')}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
              title="Chiqish"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {state.currentUser.role === Role.MANAGER ? (
          <>
            {/* Manager Navigation */}
            <div className="flex overflow-x-auto pb-4 mb-6 gap-2 no-scrollbar">
              {[
                { id: 'overview', label: 'Umumiy', icon: '📊' },
                { id: 'users', label: 'Xodimlar', icon: '👥' },
                { id: 'reports', label: 'Hisobotlar', icon: '📝' },
                { id: 'simcards', label: 'Ombor & Reja', icon: '📱' },
                { id: 'messages', label: 'Xabarlar', icon: '💬' },
                { id: 'approvals', label: 'Tasdiqlash', icon: '✅', count: state.users.filter(u => !u.isApproved).length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                    activeTab === tab.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.count ? (
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{tab.count}</span>
                  ) : null}
                </button>
              ))}
            </div>

            <ManagerPanel 
              state={state}
              approveUser={(userId) => setState(prev => ({ ...prev, users: prev.users.map(u => u.id === userId ? { ...u, isApproved: true } : u) }))}
              updateUser={(userId, updates) => setState(prev => ({ ...prev, users: prev.users.map(u => u.id === userId ? { ...u, ...updates } : u) }))}
              addMessage={(text) => setState(prev => ({ ...prev, messages: [...prev.messages, { id: Date.now().toString(), senderId: state.currentUser!.id, senderName: 'MENEJER', text, timestamp: new Date().toISOString(), isRead: false }] }))}
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
            />
          </>
        ) : (
          <>
             {/* Operator Navigation */}
             <div className="flex overflow-x-auto pb-4 mb-6 gap-2 no-scrollbar justify-center">
              {[
                { id: 'checkin', label: 'Asosiy', icon: '🏠' },
                { id: 'simcards', label: 'Ombor', icon: '📱' },
                { id: 'monitoring', label: 'Monitoring', icon: '📈' },
                { id: 'rating', label: 'Reyting', icon: '🏆' },
                { id: 'profile', label: 'Profil', icon: '👤' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setOperatorTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
                    operatorTab === tab.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105' 
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <OperatorPanel 
              user={state.currentUser}
              state={state}
              addCheckIn={(checkIn) => setState(prev => ({ ...prev, checkIns: [...prev.checkIns, checkIn] }))}
              updateCheckIn={(userId, date, updates) => setState(prev => ({ ...prev, checkIns: prev.checkIns.map(c => c.userId === userId && c.timestamp.startsWith(date) ? { ...c, ...updates } : c) }))}
              updateUser={(userId, updates) => setState(prev => ({ ...prev, users: prev.users.map(u => u.id === userId ? { ...u, ...updates } : u) }))}
              addSale={(sale) => setState(prev => {
                // Deduct from inventory
                const user = prev.users.find(u => u.id === sale.userId);
                if (user && user.inventory) {
                  const newInventory = { ...user.inventory };
                  if (newInventory[sale.company] >= (sale.count + sale.bonus)) {
                    newInventory[sale.company] -= (sale.count + sale.bonus);
                    // Update user inventory and add sale
                    return {
                      ...prev,
                      users: prev.users.map(u => u.id === user.id ? { ...u, inventory: newInventory } : u),
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
                  if (user && user.inventory) {
                    const newInventory = { ...user.inventory };
                    newInventory[sale.company] = (newInventory[sale.company] || 0) + (sale.count + sale.bonus);
                    return {
                      ...prev,
                      users: prev.users.map(u => u.id === user.id ? { ...u, inventory: newInventory } : u),
                      sales: prev.sales.filter(s => s.id !== saleId)
                    };
                  }
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
              addMessage={(text) => setState(prev => ({ ...prev, messages: [...prev.messages, { id: Date.now().toString(), senderId: state.currentUser!.id, senderName: `${state.currentUser!.firstName} ${state.currentUser!.lastName}`, text, timestamp: new Date().toISOString(), isRead: false }] }))}
              activeTab={operatorTab}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default ArrivalChecker;
