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

export interface DBData {
  users: User[];
  bookings: Booking[];
  transactions: string[][];
  frequent_itemsets: FrequentItemset[];
  association_rules: AssociationRule[];
  designs: NailDesign[];
  config: {
    minSupport: number;
    minConfidence: number;
    newTransactionsSinceLastTrain: number;
  };
}

export const DEFAULT_GALLERY_DESIGNS: NailDesign[] = [
  { 
    id: "chrome", 
    name: "Rose & Silver Chrome Mirror", 
    price: 140000, 
    description: "Finishing bubuk chrome mirror pantulan kaca futuristik bernuansa rose metallic dan silver mengkilap. Item terpopuler di 77% transaksi studio.", 
    image: "https://images.unsplash.com/photo-1632345031435-8797b2d58045?q=80&w=600&auto=format&fit=crop",
    category: "Glitter",
    rating: 5.0,
    tag: "Terpopuler (77%)",
    styleSubtitle: "Futuristik & Berkilau"
  },
  { 
    id: "abstrak", 
    name: "Nail Art Abstrak & Swirl Marble", 
    price: 135000, 
    description: "Lukisan kuku motif abstrak artistik kontemporer dengan perpaduan warna harmonis dan corak dinamis berkelas.", 
    image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=600&auto=format&fit=crop",
    category: "Korea Style",
    rating: 4.9,
    tag: "Best Seller (55%)",
    styleSubtitle: "Artistik & Chic"
  },
  { 
    id: "putih", 
    name: "Milky White Clean Gel", 
    price: 95000, 
    description: "Garis lembut minimalis bernuansa putih susu dan nude bersih yang memikat, natural, dan cocok dipadu dengan motif apapun.", 
    image: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?q=80&w=600&auto=format&fit=crop",
    category: "Minimalis",
    rating: 4.8,
    tag: "Favorit (48%)",
    styleSubtitle: "Bersih & Natural"
  },
  { 
    id: "cat eye", 
    name: "Cat Eye Velvet Magnetic Rose", 
    price: 160000, 
    description: "Efek magnetik 3D cat eye berkilau mewah dengan pancaran spektrum galaksi yang memukau dan misterius.", 
    image: "https://images.unsplash.com/photo-1522337094133-f30f51db0d5b?q=80&w=600&auto=format&fit=crop",
    category: "Elegant",
    rating: 5.0,
    tag: "Best Seller (42%)",
    styleSubtitle: "Misterius & Elegan"
  },
  { 
    id: "french crop", 
    name: "French Crop Modern Elegan", 
    price: 110000, 
    description: "Sentuhan gaya french crop presisi dengan garis lengkung rapi di ujung kuku yang klasik, anggun, dan abadi.", 
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop",
    category: "Classic",
    rating: 4.9,
    tag: "Klasik (42%)",
    styleSubtitle: "Klasik & Abadi"
  },
  { 
    id: "3d bunga", 
    name: "3D Bunga Emboss Sculpture", 
    price: 150000, 
    description: "Aksen timbul 3D bunga kuku buatan tangan (emboss sculpture) yang memancarkan pesona feminin mewah.", 
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop",
    category: "Cute",
    rating: 4.9,
    tag: "Tren 2026 (42%)",
    styleSubtitle: "Feminin & Mewah"
  },
  { 
    id: "pita", 
    name: "Pita 3D Korean Ribbon Charm", 
    price: 125000, 
    description: "Dekorasi charm pita 3D timbul manis khas gaya Korean aesthetic nail art yang menggemaskan dan rapi.", 
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop",
    category: "Korea Style",
    rating: 4.8,
    tag: "Korea Style (35%)",
    styleSubtitle: "Manis & Gemas"
  },
  { 
    id: "bunga", 
    name: "Hand-Painted Floral & Daisy", 
    price: 125000, 
    description: "Lukisan tangan bunga daisy mini dan corak floral ceria berestetika tinggi yang manis dan memikat hati.", 
    image: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=80&w=600&auto=format&fit=crop",
    category: "Cute",
    rating: 4.8,
    tag: "Handmade (29%)",
    styleSubtitle: "Ceria & Indah"
  },
  { 
    id: "mutiara", 
    name: "Aksen Butiran Mutiara (Pearl Beads)", 
    price: 120000, 
    description: "Hiasan butiran mutiara anggun berkilau lembut untuk tampilan kuku berkelas, mewah bak putri kerajaan.", 
    image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=600&auto=format&fit=crop",
    category: "Elegant",
    rating: 4.9,
    tag: "Elegan (29%)",
    styleSubtitle: "Mewah & Anggun"
  },
  { 
    id: "pink", 
    name: "Sweet Pink Pastel Gel", 
    price: 105000, 
    description: "Warna dasar gel pink manis nan lembut yang memberi kesan kuku sehat bercahaya, segar, dan feminin.", 
    image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=600&auto=format&fit=crop",
    category: "Cute",
    rating: 4.8,
    tag: "Manis Pastel (29%)",
    styleSubtitle: "Segar & Manis"
  },
  { 
    id: "manik-manik", 
    name: "Manik-manik Kristal & Rhinestones", 
    price: 130000, 
    description: "Taburan butir kristal rhinestones berkilauan menangkap cahaya untuk penampilan kuku mewah glamor.", 
    image: "https://images.unsplash.com/photo-1604654894560-df2db5362536?q=80&w=600&auto=format&fit=crop",
    category: "Glitter",
    rating: 4.8,
    tag: "Kilau Kristal (29%)",
    styleSubtitle: "Glamor & Berkilau"
  },
  { 
    id: "merah maron", 
    name: "Merah Maron Royal Gel", 
    price: 120000, 
    description: "Warna merah maron pekat yang memberikan aura percaya diri tinggi, sensual, berkelas, dan memikat.", 
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=600&auto=format&fit=crop",
    category: "Elegant",
    rating: 4.9,
    tag: "Berani Mewah (23%)",
    styleSubtitle: "Berani & Menawan"
  },
  { 
    id: "bintang", 
    name: "Starlight Celestial & Motif Bintang", 
    price: 125000, 
    description: "Aksen lukisan bintang kelap-kelip berkilau perak/emas menghadirkan nuansa malam berbintang yang magis.", 
    image: "https://images.unsplash.com/photo-1632345031435-8797b2d58045?q=80&w=600&auto=format&fit=crop",
    category: "Colorful",
    rating: 4.7,
    tag: "Populer (16%)",
    styleSubtitle: "Magis & Cantik"
  },
  { 
    id: "hitam", 
    name: "Midnight Black Glossy & Edgy", 
    price: 100000, 
    description: "Warna hitam pekat glossy intens yang memberikan statement modern, tegas, chic, dan berani.", 
    image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=600&auto=format&fit=crop",
    category: "Minimalis",
    rating: 4.7,
    tag: "Edgy Style (13%)",
    styleSubtitle: "Tegas & Modern"
  },
  { 
    id: "miror", 
    name: "Mirror Liquid Powder Chrome", 
    price: 135000, 
    description: "Aksen lelehan efek kaca mirror futuristik dengan kilau reflektif ekstra jernih dan tahan gores.", 
    image: "https://images.unsplash.com/photo-1522337094133-f30f51db0d5b?q=80&w=600&auto=format&fit=crop",
    category: "Glitter",
    rating: 4.8,
    tag: "Futuristik (13%)",
    styleSubtitle: "Reflektif & Modern"
  },
  { 
    id: "3d kerang", 
    name: "3D Kerang Mutiara Mermaid Shell", 
    price: 145000, 
    description: "Tekstur gel timbul menyerupai cangkang kerang mutiara laut eksotis ala mermaid aesthetic.", 
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop",
    category: "Elegant",
    rating: 4.8,
    tag: "Mermaid Style",
    styleSubtitle: "Eksotis & Mewah"
  },
  { 
    id: "cokelat gel", 
    name: "Warm Mocha & Cokelat Mahogani", 
    price: 110000, 
    description: "Nuansa hangat cokelat mahogani dan mocha latte yang cozy, natural, dan flattering di semua warna kulit.", 
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop",
    category: "Classic",
    rating: 4.8,
    tag: "Warm Tone",
    styleSubtitle: "Hangat & Natural"
  },
  { 
    id: "kupu-kupu", 
    name: "3D Butterfly Charm Transparan", 
    price: 135000, 
    description: "Ornamen 3D kupu-kupu bersayap kristal bening yang memberikan sentuhan dreamy, manis, dan playful.", 
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop",
    category: "Cute",
    rating: 4.9,
    tag: "Dreamy Charm",
    styleSubtitle: "Manis & Playful"
  }
];

const DB_FILE = path.join(process.cwd(), 'lucky_nailart_db.json');

// Dataset referensi Apriori dari pengguna (31 transaksi riil nail art)
export const INITIAL_USER_DATASET_RAW = `pink,frusia,putih,cat eye,bunga,french crop,pita
pink,frusia,putih,bunga,french crop
cokelat gel,pink,chrome,matahari,abstrak,french crop
merah maron,cat eye
hitam,putih,chrome,mutiara,love 3D,pita,abstrak
pink,cat eye,bintang,french crop,abstrak
pink,cat eye,putih,pita,mutiara,3D bunga,3D kerang,french crop
pink frusia,cat eye,chrome,kupu-kupu,daun,abstrak
merah,pink frusia,pink pastel,stiker,chrome,pita,abstrak
abu-abu,kuning,cat eye,pink,hijau muda,chrome,french crop,3D bunga,bunga
putih,cat eye,pink,chrome,manik-manik,stamp,painting flower,bunga,painting pemandangan
putih,cat eye,hijau muda,peach,ungu,chrome,kuning,orange,hitam,mutiara,manik-manik,3D bunga,daun,abstrak
merah maron,cat eye,french crop,chrome,manik-manik,3D bunga,abstrak
hijau toska,cat eye hijau,bunga,chrome,bintang,3D bunga,miror
biru muda,cat eye biru,chrome,pita,sarang laba-laba,miror,abstrak
gradasi pink,peach,merah maron,chrome,mutiara,3D bunga,french crop,abstrak
putih,chrome,pink,pink frusia,french crop,3D bunga,kupu-kupu,mutiara,pita
merah maron,cat eye,french crop,bintang,manik-manik,chrome,3D bunga,abstrak
biru muda,putih,chrome,bunga,abstrak
merah maron,mutiara,3D bunga
cat eye putih,cat eye merah,chrome,kupu-kupu,cery,mutiara,pita,abstrak
hijau,gradasi merah,cat eye,painting,3D kupu-kupu,3D kerang,3D bunga,chrome,miror,pita,manik-manik
gradasi peach,3D pita,cat eye mahogani,chrome,bunga,pita
merah maron,chrome,french crop,putih,love,cat eye
hijau,chrome,putih,manik-manik,3D bunga,abstrak
hitam,pita,french crop,bunga,bintang,chrome
cokelat mahogani,putih,gradasi cokelat,abstrak
hitam,putih,cat eye,gradasi abu-abu,chrome,bintang,ular,miror,abstrak
putih,cokelat gel,merah maron,french crop,chrome,mutiara,manik-manik,3D bunga
pink,putih,gradasi pink,chrome,3D bunga,manik-manik,mutiara,abstrak
cokelat mahogani,putih,cokelat,chrome,manik-manik,bunga,pita,abstrak`;

export const SEED_TRANSACTIONS: string[][] = INITIAL_USER_DATASET_RAW
  .trim()
  .split('\n')
  .map(line => line.split(',').map(item => item.trim()).filter(Boolean));

export class NailartDatabase {
  private data: DBData;

  constructor() {
    this.data = this.load();
  }

  private load(): DBData {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure designs array is present
        if (!parsed.designs || !Array.isArray(parsed.designs) || parsed.designs.length === 0) {
          parsed.designs = DEFAULT_GALLERY_DESIGNS;
          this.saveData(parsed);
        }
        // Ensure user reference dataset is used if previous data was synthetic
        if (!parsed.transactions || parsed.transactions.length === 0 || (parsed.transactions[0] && parsed.transactions[0].includes('French_Tips'))) {
          parsed.transactions = SEED_TRANSACTIONS;
          if (!parsed.config) {
            parsed.config = { minSupport: 0.15, minConfidence: 0.5, newTransactionsSinceLastTrain: 0 };
          } else {
            parsed.config.minSupport = 0.15;
            parsed.config.minConfidence = 0.5;
            parsed.config.newTransactionsSinceLastTrain = 0;
          }
          this.saveData(parsed);
        }
        return parsed;
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
      designs: DEFAULT_GALLERY_DESIGNS,
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

  public getDesigns(): NailDesign[] {
    return this.data.designs || DEFAULT_GALLERY_DESIGNS;
  }

  public addDesign(design: Omit<NailDesign, 'id'> & { id?: string }): NailDesign {
    const id = design.id && design.id.trim()
      ? design.id.trim().replace(/\s+/g, '_')
      : 'Art_' + Math.random().toString(36).substr(2, 6);

    const newDesign: NailDesign = {
      id,
      name: design.name.trim(),
      price: Number(design.price) || 100000,
      description: design.description || '',
      image: design.image || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop',
      category: design.category || 'Minimalis',
      rating: design.rating ? Number(design.rating) : 4.8,
      tag: design.tag || 'Populer',
      styleSubtitle: design.styleSubtitle || 'Trendy & Cantik'
    };

    this.update(data => {
      if (!data.designs) data.designs = [...DEFAULT_GALLERY_DESIGNS];
      // Check if id already exists, if so append unique suffix
      let finalId = newDesign.id;
      let counter = 1;
      while (data.designs.some(d => d.id === finalId)) {
        finalId = `${newDesign.id}_${counter++}`;
      }
      newDesign.id = finalId;
      data.designs.unshift(newDesign);
    });

    return newDesign;
  }

  public updateDesign(id: string, updated: Partial<NailDesign>): NailDesign | null {
    let updatedItem: NailDesign | null = null;
    this.update(data => {
      if (!data.designs) data.designs = [...DEFAULT_GALLERY_DESIGNS];
      const idx = data.designs.findIndex(d => d.id === id);
      if (idx !== -1) {
        data.designs[idx] = {
          ...data.designs[idx],
          ...updated,
          id: id // preserve ID
        };
        updatedItem = data.designs[idx];
      }
    });
    return updatedItem;
  }

  public deleteDesign(id: string): boolean {
    let deleted = false;
    this.update(data => {
      if (!data.designs) data.designs = [...DEFAULT_GALLERY_DESIGNS];
      const initialLen = data.designs.length;
      data.designs = data.designs.filter(d => d.id !== id);
      if (data.designs.length < initialLen) {
        deleted = true;
      }
    });
    return deleted;
  }

  public resetDesigns(): NailDesign[] {
    this.update(data => {
      data.designs = [...DEFAULT_GALLERY_DESIGNS];
    });
    return DEFAULT_GALLERY_DESIGNS;
  }

  public resetTransactionsToUserDataset(): string[][] {
    this.update(data => {
      data.transactions = [...SEED_TRANSACTIONS];
      data.config.minSupport = 0.15;
      data.config.minConfidence = 0.5;
      data.config.newTransactionsSinceLastTrain = 0;
    });
    return SEED_TRANSACTIONS;
  }

  public getRawUserDataset(): string {
    return INITIAL_USER_DATASET_RAW;
  }
}

export const db = new NailartDatabase();
