import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  username: string;
  passwordHash: string;
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

export interface FrequentItemset {
  id: number;
  items: string[];
  support: number;
  count: number;
  k: number;
}

export interface AssociationRule {
  id: number;
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
}

export interface DBData {
  users: User[];
  bookings: Booking[];
  transactions: string[][];
  frequent_itemsets: FrequentItemset[];
  association_rules: AssociationRule[];
  config: {
    minSupport: number;
    minConfidence: number;
    newTransactionsSinceLastTrain: number;
  };
}

const DB_FILE = path.join(process.cwd(), 'lucky_nailart_db.json');

// Realistic sample transactions for Apriori seed data
// Valid design names: "Glitter_Red", "Nude_Gel", "Marble_Art", "Chrome_Finish", "French_Tips", "Floral_Accent", "Cat_Eye", "Matte_Black", "Gold_Foil", "Pastel_Ombre"
const SEED_TRANSACTIONS = [
  ["French_Tips", "Nude_Gel"],
  ["French_Tips", "Nude_Gel", "Floral_Accent"],
  ["Nude_Gel", "Marble_Art"],
  ["Nude_Gel", "Marble_Art", "Gold_Foil"],
  ["Chrome_Finish", "Cat_Eye"],
  ["Chrome_Finish", "Cat_Eye", "Matte_Black"],
  ["Glitter_Red", "Gold_Foil"],
  ["Glitter_Red", "Nude_Gel", "Gold_Foil"],
  ["Pastel_Ombre", "Glitter_Red"],
  ["French_Tips", "Nude_Gel", "Gold_Foil"],
  ["French_Tips", "Floral_Accent"],
  ["Nude_Gel", "Marble_Art", "Floral_Accent"],
  ["Chrome_Finish", "Matte_Black"],
  ["Cat_Eye", "Matte_Black"],
  ["Glitter_Red", "Gold_Foil", "Matte_Black"],
  ["Pastel_Ombre", "Nude_Gel"],
  ["French_Tips", "Nude_Gel", "Marble_Art"],
  ["Nude_Gel", "Chrome_Finish"],
  ["Cat_Eye", "Chrome_Finish", "Gold_Foil"],
  ["Glitter_Red", "French_Tips"],
  ["French_Tips", "Nude_Gel"],
  ["French_Tips", "Nude_Gel", "Gold_Foil"],
  ["Nude_Gel", "Marble_Art"],
  ["Nude_Gel", "Marble_Art", "Gold_Foil"],
  ["Chrome_Finish", "Cat_Eye"],
  ["Chrome_Finish", "Cat_Eye", "Matte_Black"],
  ["Glitter_Red", "Gold_Foil"],
  ["Glitter_Red", "Nude_Gel"],
  ["Pastel_Ombre", "French_Tips"],
  ["French_Tips", "Nude_Gel", "Floral_Accent"]
];

export class NailartDatabase {
  private data: DBData;

  constructor() {
    this.data = this.load();
  }

  private load(): DBData {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error("Error reading database, creating fresh one", err);
      }
    }

    // Default configuration and seed data
    const salt = bcrypt.genSaltSync(10);
    const adminPasswordHash = bcrypt.hashSync('admin123', salt);

    const initialData: DBData = {
      users: [
        {
          id: 1,
          username: 'admin',
          passwordHash: adminPasswordHash
        }
      ],
      bookings: [
        {
          id: "bk-1",
          name: "Siti Rahma",
          email: "siti@gmail.com",
          phone: "08123456789",
          services: ["French_Tips", "Nude_Gel"],
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
          time: "10:00",
          status: "pending",
          createdAt: new Date().toISOString()
        },
        {
          id: "bk-2",
          name: "Agnes Monica",
          email: "agnes@gmail.com",
          phone: "08234567890",
          services: ["Chrome_Finish", "Cat_Eye"],
          date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // in 2 days
          time: "14:00",
          status: "pending",
          createdAt: new Date().toISOString()
        }
      ],
      transactions: SEED_TRANSACTIONS,
      frequent_itemsets: [],
      association_rules: [],
      config: {
        minSupport: 0.1,
        minConfidence: 0.3,
        newTransactionsSinceLastTrain: 0
      }
    };

    this.saveData(initialData);
    return initialData;
  }

  private saveData(data: DBData) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error("Failed to save database to disk", err);
    }
  }

  public get(): DBData {
    return this.data;
  }

  public update(updater: (data: DBData) => void) {
    updater(this.data);
    this.saveData(this.data);
  }

  public addBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'status'>): Booking {
    const newBooking: Booking = {
      ...booking,
      id: 'bk-' + Math.random().toString(36).substr(2, 9),
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    this.update(data => {
      data.bookings.unshift(newBooking);
    });
    return newBooking;
  }

  public updateBookingStatus(id: string, status: 'pending' | 'completed' | 'cancelled'): Booking | null {
    let updatedBooking: Booking | null = null;
    this.update(data => {
      const idx = data.bookings.findIndex(b => b.id === id);
      if (idx !== -1) {
        data.bookings[idx].status = status;
        updatedBooking = data.bookings[idx];

        // If a booking is completed, automatically add its services as a transaction
        if (status === 'completed' && updatedBooking.services.length > 0) {
          // Add transaction
          data.transactions.push(updatedBooking.services);
          data.config.newTransactionsSinceLastTrain += 1;
        }
      }
    });
    return updatedBooking;
  }

  public addTransaction(items: string[]): number {
    let newCount = 0;
    this.update(data => {
      data.transactions.push(items);
      data.config.newTransactionsSinceLastTrain += 1;
      newCount = data.config.newTransactionsSinceLastTrain;
    });
    return newCount;
  }

  public saveTrainingResults(frequent: FrequentItemset[], rules: AssociationRule[]) {
    this.update(data => {
      data.frequent_itemsets = frequent;
      data.association_rules = rules;
      data.config.newTransactionsSinceLastTrain = 0; // Reset counter after training
    });
  }
}

export const db = new NailartDatabase();
