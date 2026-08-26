export interface NailDesign {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category?: string;
  rating?: number;
  tag?: string;
  styleSubtitle?: string;
}

export interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  services: string[];
  date: string;
  time: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface BestSeller {
  items: string[];
  support: number;
  count: number;
}

export interface AssociationRule {
  antecedent: string;
  consequent: string;
  confidence: number;
  lift: number;
}

export interface RecommendationData {
  bestSellers: BestSeller[];
  recommendations: AssociationRule[];
  totalTransactions: number;
  newTransactionsCount: number;
}

export interface AdminDashboardData {
  bookings: Booking[];
  totalTransactions: number;
  newTransactionsSinceLastTrain: number;
  config: {
    minSupport: number;
    minConfidence: number;
    newTransactionsSinceLastTrain: number;
  };
  frequentItemsets: Array<{
    items: string[];
    support: number;
    count: number;
    k: number;
  }>;
  associationRules: Array<{
    antecedent: string[];
    consequent: string[];
    support: number;
    confidence: number;
    lift: number;
  }>;
}
