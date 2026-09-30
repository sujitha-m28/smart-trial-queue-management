export type Role = 'CUSTOMER' | 'STAFF' | 'ADMIN';

export type TicketStatus = 'WAITING' | 'CALLED' | 'IN_SERVICE' | 'COMPLETED' | 'SKIPPED' | 'NO_SHOW' | 'CANCELLED';

export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';

export interface User {
  id: number;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: Role;
  storeId?: number;
  storeName?: string;
  active?: boolean;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: Role;
  storeId?: number;
  storeName?: string;
}

export interface Store {
  id: number;
  code: string;
  name: string;
  location: string;
  address: string;
  contactPhone: string;
  openingHours: string;
  totalRooms: number;
  active: boolean;
  currentWaiting?: number;
  currentServing?: number;
  avgRating?: number;
}

export interface TrialRoom {
  id: number;
  storeId: number;
  roomNumber: string;
  roomType: string;
  status: RoomStatus;
  currentTicketId?: number;
  currentTokenNumber?: string;
  active: boolean;
}

export interface ServiceType {
  id: number;
  code: string;
  name: string;
  description: string;
  maxItems: number;
  avgServiceMinutes: number;
  priorityLevel: number;
  active: boolean;
}

export interface QueueTicket {
  id: number;
  tokenNumber: string;
  storeId: number;
  storeName?: string;
  serviceTypeId?: number;
  serviceTypeName?: string;
  customerUserId?: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  garmentCount: number;
  status: TicketStatus;
  priorityLevel: number;
  estimatedWaitMinutes: number;
  peopleAhead: number;
  assignedRoomId?: number;
  assignedRoomNumber?: string;
  assignedStaffId?: number;
  assignedStaffName?: string;
  joinedAt: string;
  calledAt?: string;
  serviceStartedAt?: string;
  completedAt?: string;
  actualServiceDurationMinutes?: number;
  notes?: string;
  currentlyServingToken?: string;
}

export interface JoinQueueRequest {
  storeId: number;
  serviceTypeId?: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  garmentCount: number;
  vip?: boolean;
  notes?: string;
}

export interface RoomCard {
  roomId: number;
  roomNumber: string;
  roomType: string;
  status: RoomStatus;
  currentTicketId?: number;
  currentTokenNumber?: string;
  customerName?: string;
  garmentCount?: number;
  serviceStartedAt?: string;
  elapsedMinutes?: number;
}

export interface QueueSummary {
  storeId: number;
  storeName: string;
  nowServingToken: string;
  nextToken: string;
  waitingCount: number;
  servingCount: number;
  completedToday: number;
  estimatedWaitMinutes: number;
  waitingList: QueueTicket[];
  activeList: QueueTicket[];
  rooms: RoomCard[];
}

export interface PublicDisplayData {
  storeName: string;
  storeCode: string;
  activeRooms: RoomCard[];
  nowServingTokens: string[];
  upNextTokens: QueueTicket[];
  totalWaiting: number;
  averageWaitMinutes: number;
  lastUpdated: string;
}

export interface QueueRule {
  id?: number;
  storeId: number;
  maxGarmentsPerPerson: number;
  bufferTimeMinutes: number;
  autoNoShowMinutes: number;
  vipPriorityMultiplier: number;
  enableAiOptimization: boolean;
  sendSmsNotifications: boolean;
}

export interface FeedbackRequest {
  queueTicketId: number;
  rating: number;
  waitTimeSatisfaction: number;
  staffHelpfulness: number;
  roomCleanliness: number;
  comment?: string;
}

export interface Feedback {
  id: number;
  queueTicketId: number;
  tokenNumber: string;
  storeId: number;
  rating: number;
  waitTimeSatisfaction: number;
  staffHelpfulness: number;
  roomCleanliness: number;
  comment?: string;
  customerName: string;
  submittedAt: string;
}

export interface HourlyTrend {
  hour: string;
  arrivals: number;
  completed: number;
  averageWaitMinutes: number;
}

export interface RoomUtilization {
  roomNumber: string;
  roomType: string;
  customersServed: number;
  activeMinutes: number;
  utilizationPercentage: number;
}

export interface StaffPerformance {
  staffId: number;
  staffName: string;
  customersServed: number;
  avgFittingDurationMinutes: number;
  rating: number;
}

export interface AiInsights {
  predictedPeakHour: string;
  recommendedStaffCount: number;
  bottleneckRoom: string;
  recommendationSummary: string;
  actionableTips: string[];
}

export interface DashboardStats {
  totalUsers: number;
  totalStaff: number;
  activeQueues: number;
  todayCustomers: number;
  todayCompleted: number;
  todayNoShows: number;
  todayCancelled: number;
  averageWaitMinutes: number;
  averageServiceMinutes: number;
  customerSatisfactionScore: number;
  hourlyTraffic: HourlyTrend[];
  roomUtilization: RoomUtilization[];
  staffPerformance: StaffPerformance[];
  aiInsights: AiInsights;
}

export interface AuditLog {
  id: number;
  actorUsername: string;
  actorRole: string;
  action: string;
  entityName: string;
  entityId: string;
  details: string;
  storeId?: number;
  timestamp: string;
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  intent?: string;
  quickActions?: string[];
  estimatedRemainingMinutes?: number;
  timestamp: Date;
}
