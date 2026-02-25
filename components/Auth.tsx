
import React, { useState } from 'react';
import { Role, AppState, User } from '../types';
import { Phone, Lock, User as UserIcon } from 'lucide-react';

interface AuthProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Auth: React.FC<AuthProps> = ({ state, setState }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    role: Role.OPERATOR
  });
  const [error, setError] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const user = state.users.find(u => u.phone === authForm.phone && u.password === authForm.password);
      if (user) {
        setState(prev => ({ ...prev, currentUser: user }));
      } else {
        setError('Telefon raqam yoki parol noto\'g\'ri.');
      }
    } else {
      // Signup
      if (state.users.some(u => u.phone === authForm.phone)) {
        setError('Ushbu raqam allaqachon ro\'yxatga olingan.');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-700 to-blue-900 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-blue-700 mb-2">Sam Brend Nomer</h1>
          <p className="text-gray-500">{isLogin ? 'Hisobingizga kiring' : 'Yangi hisob yarating'}</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <>
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Ism"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={authForm.firstName}
                    onChange={e => setAuthForm({ ...authForm, firstName: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Familiya"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={authForm.lastName}
                    onChange={e => setAuthForm({ ...authForm, lastName: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                placeholder="Telefon raqam"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={authForm.phone}
                onChange={e => setAuthForm({ ...authForm, phone: e.target.value })}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                placeholder="Parol"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={authForm.password}
                onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Lavozimingiz:</label>
                <select
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
                  value={authForm.role}
                  onChange={e => setAuthForm({ ...authForm, role: e.target.value as Role })}
                >
                  <option value={Role.OPERATOR}>Operator</option>
                  <option value={Role.MANAGER}>Menejer</option>
                  <option value={Role.DUTY_OPERATOR}>Navbatchi operator</option>
                </select>
              </div>
            )}
          </>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            {isLogin ? 'Kirish' : 'Ro\'yxatdan o\'tish'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
          >
            {isLogin ? 'Hisobingiz yo\'qmi? Ro\'yxatdan o\'ting' : 'Hisobingiz bormi? Kirish'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
