
import React, { useState } from 'react';
import { Role, AppState, User } from '../types';
import { Phone, Lock, User as UserIcon, Crown, ChevronDown, Globe } from 'lucide-react';
import { t, Language } from '../translations';

interface AuthProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const Auth: React.FC<AuthProps> = ({ state, setState, language, setLanguage }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<'role' | null>(null);
  const [authForm, setAuthForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    role: Role.OPERATOR
  });
  const [error, setError] = useState('');

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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    setAuthForm({ ...authForm, phone: formattedValue });
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const user = state.users.find(u => u.phone === authForm.phone && u.password === authForm.password);
      if (user) {
        setState(prev => ({ ...prev, currentUser: user }));
      } else {
        setError(t(language, 'auth_error'));
      }
    } else {
      // Signup
      if (state.users.some(u => u.phone === authForm.phone)) {
        setError(t(language, 'phone_exists_error'));
        return;
      }

      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        firstName: authForm.firstName,
        lastName: authForm.lastName,
        phone: authForm.phone,
        password: authForm.password,
        role: authForm.role,
        isApproved: authForm.role === Role.MANAGER, // Managers auto-approved for simplicity in demo or first user
        createdAt: new Date().toISOString()
      };

      setState(prev => ({
        ...prev,
        users: [...prev.users, newUser],
        currentUser: newUser // Initially set to show "Waiting" message if not approved
      }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-black p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl"></div>
      </div>

      {/* Language Selector for Auth Screen */}
      <div className="absolute top-6 right-6 z-20">
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-dark/40 backdrop-blur-md border border-white/10 rounded-xl text-white/60 hover:text-brand-gold transition-all">
            <Globe className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">{language}</span>
          </button>
          <div className="absolute right-0 top-full mt-2 w-32 bg-brand-dark border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
            <button type="button" onClick={() => setLanguage('uz')} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${language === 'uz' ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>{t(language, 'uzbek')}</button>
            <button type="button" onClick={() => setLanguage('ru')} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors border-t border-white/5 ${language === 'ru' ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>{t(language, 'russian')}</button>
            <button type="button" onClick={() => setLanguage('en')} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors border-t border-white/5 ${language === 'en' ? 'bg-brand-gold/10 text-brand-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>{t(language, 'english')}</button>
          </div>
        </div>
      </div>

      <div className="theme-blue-box bg-brand-dark/40 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-black border-2 border-brand-gold/30 rounded-3xl mb-6 shadow-2xl shadow-brand-gold/10">
            <Crown className="w-10 h-10 text-brand-gold" />
          </div>
          <h1 className="text-4xl font-black gold-text-gradient mb-2 uppercase tracking-tighter">{t(language, 'brand_name')}</h1>
          <p className="text-brand-gold/60 text-[10px] font-black uppercase tracking-[0.3em] mb-4">{t(language, 'brand_subtitle')}</p>
          <div className="h-px w-12 bg-brand-gold/30 mx-auto"></div>
          <p className="text-white/40 text-xs font-medium mt-4">{isLogin ? t(language, 'login_title') : t(language, 'signup_title')}</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-xs font-bold border border-red-500/20 animate-pulse">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-gold w-5 h-5 transition-colors" />
                  <input
                    type="text"
                    placeholder={t(language, 'first_name')}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white placeholder:text-white/20 focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/5 outline-none transition-all"
                    value={authForm.firstName}
                    onChange={e => setAuthForm({ ...authForm, firstName: e.target.value })}
                  />
                </div>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-gold w-5 h-5 transition-colors" />
                  <input
                    type="text"
                    placeholder={t(language, 'last_name')}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white placeholder:text-white/20 focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/5 outline-none transition-all"
                    value={authForm.lastName}
                    onChange={e => setAuthForm({ ...authForm, lastName: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-gold w-5 h-5 transition-colors" />
              <input
                type="tel"
                placeholder={t(language, 'phone_number')}
                required
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white placeholder:text-white/20 focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/5 outline-none transition-all"
                value={authForm.phone}
                onChange={handlePhoneChange}
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-gold w-5 h-5 transition-colors" />
              <input
                type="password"
                placeholder={t(language, 'password')}
                required
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white placeholder:text-white/20 focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/5 outline-none transition-all"
                value={authForm.password}
                onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-brand-gold uppercase tracking-widest block mb-1 ml-1">{t(language, 'role_label')}</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === 'role' ? null : 'role')}
                    className="w-full px-4 py-4 pr-12 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/5 outline-none transition-all text-left flex items-center justify-between"
                  >
                    <span>
                      {authForm.role === Role.OPERATOR ? t(language, 'operator') : 
                       authForm.role === Role.MANAGER ? t(language, 'manager') : 
                       t(language, 'duty_operator')}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-white/50 transition-transform ${openDropdown === 'role' ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {openDropdown === 'role' && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)}></div>
                      <div className="absolute top-full left-0 right-0 mt-2 bg-brand-black border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {[
                          { value: Role.OPERATOR, label: t(language, 'operator') },
                          { value: Role.MANAGER, label: t(language, 'manager') },
                          { value: Role.DUTY_OPERATOR, label: t(language, 'duty_operator') }
                        ].map((role) => (
                          <button
                            type="button"
                            key={role.value}
                            onClick={() => {
                              setAuthForm({ ...authForm, role: role.value });
                              setOpenDropdown(null);
                            }}
                            className={`w-full text-left p-4 text-sm font-bold hover:bg-white/5 transition-colors ${authForm.role === role.value ? 'text-brand-gold bg-brand-gold/10' : 'text-white'}`}
                          >
                            {role.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-5 gold-gradient text-brand-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-brand-gold/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
          >
            {isLogin ? t(language, 'login_button') : t(language, 'signup_button')}
          </button>
        </form>

        <div className="mt-10 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-white/40 hover:text-brand-gold text-xs font-bold transition-colors uppercase tracking-widest"
          >
            {isLogin ? t(language, 'no_account') : t(language, 'have_account')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
