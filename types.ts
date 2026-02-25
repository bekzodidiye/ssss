
export enum Role {
  OPERATOR = 'operator',
  MANAGER = 'manager',
  DUTY_OPERATOR = 'navbatchi_operator'
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: Role;
  password?: string;
  isApproved: boolean;
  createdAt: string;
  workingHours?: string;
  photo?: string;
  inventory?: Record<string, number>;
}

export interface CheckIn {
  userId: string;
  timestamp: string;
  location: { lat: number; lng: number };
  photo: string;
}

export interface SimSale {
  id: string;
  userId: string;
  date: string;
  company: string;
  tariff: string;
  count: number;
  bonus: number;
  timestamp: string;
}

export interface DailyReport {
  userId: string;
  date: string;
  summary: string;
  timestamp: string;
  photos?: string[];
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface MonthlyTarget {
  month: string; // YYYY-MM
  targets: Record<string, number>; // company -> target count
  officeCounts?: Record<string, number>; // company -> office count
  mobileOfficeCounts?: Record<string, number>; // company -> mobile office count
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  checkIns: CheckIn[];
  sales: SimSale[];
  reports: DailyReport[];
  simInventory: Record<string, number>;
  messages: Message[];
  monthlyTargets: MonthlyTarget[];
}
