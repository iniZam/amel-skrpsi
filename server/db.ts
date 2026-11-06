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

// Dataset referensi Apriori dari pengguna (100 transaksi riil nail art)
export const INITIAL_USER_DATASET_RAW = `biru muda,cat eye,chrome,mutiara,french crop,bunga,pita,3D bunga
chrome,bintang,gradasi cokelat,manik-manik,mutiara,pita,miror
pink,3D pita,bintang,mutiara,bunga
cat eye merah,putih,cat eye,chrome,bintang,french crop,mutiara,stamp,bunga,painting flower,kupu-kupu,love,pita,3D bunga
gradasi pink,cat eye,pink pastel,cat eye mahogani,chrome,french crop,bunga,pita,abstrak
abu-abu,gradasi peach,cat eye,french crop,3D bunga
gradasi peach,putih,chrome,matahari,pita,love 3D,abstrak
pink,gradasi pink,chrome,mutiara,3D bunga,abstrak
cat eye putih,merah maron,hijau muda,chrome,french crop,3D kerang,3D bunga,abstrak
pink,putih,cat eye,stamp,manik-manik,3D bunga,abstrak
biru muda,manik-manik
merah maron,putih,chrome,bintang,love 3D,french crop,3D bunga,abstrak
merah maron,pink,putih,french crop,bunga,manik-manik,love 3D
gradasi pink,pink,chrome,cery,bintang,3D bunga
pink,frusia,chrome,french crop,bunga,pita,3D bunga,abstrak
merah maron,abu-abu,ungu,chrome,manik-manik,bunga,pita
cat eye,ungu,chrome,mutiara,french crop,bunga,miror
gradasi pink,french crop,pita,mutiara,3D bunga
merah maron,cat eye biru,cat eye hijau,painting,chrome,stiker,3D bunga,abstrak
cokelat mahogani,ungu,gradasi abu-abu,chrome,mutiara,miror
pink,abstrak
hijau,3D pita,cat eye,painting,cat eye mahogani,chrome,stamp,french crop,cery,mutiara,bintang,3D bunga,pita,abstrak
cat eye merah,cat eye,orange,french crop,mutiara,3D bunga,manik-manik,bunga,abstrak
pink,putih,mutiara,3D bunga,bunga,pita,manik-manik,miror
merah maron,biru muda,kupu-kupu,chrome,3D kerang,bintang,bunga,abstrak
frusia,hijau muda,cokelat,mutiara,3D kerang,pita,painting pemandangan
hijau,putih,cat eye,hitam,bunga,abstrak
merah maron,pink,cat eye,3D bunga,bunga,abstrak,daun
biru muda,hijau,pink frusia,manik-manik,bunga,french crop,3D kerang,abstrak
merah maron,cat eye merah,cat eye,putih,chrome,french crop
gradasi peach,pink,cat eye,chrome,bintang,french crop,sarang laba-laba
cokelat gel,cat eye putih,3D pita,cery,chrome,mutiara,bintang,sarang laba-laba,pita,bunga,french crop,manik-manik,miror,abstrak
cokelat mahogani,hitam,mutiara,french crop,stamp,3D bunga,pita,abstrak
putih,pink,painting pemandangan
hitam,cat eye,chrome,bunga,french crop,abstrak
pink,putih,cat eye,chrome,3D kupu-kupu,mutiara,kupu-kupu,bunga,manik-manik,french crop,painting flower,pita,3D bunga,abstrak
cokelat gel,cat eye,chrome,mutiara,pita,bunga,painting pemandangan
cat eye,chrome,pink pastel,french crop,manik-manik,pita
putih,chrome,mutiara,french crop,bunga,3D bunga,painting flower
hijau muda,chrome,manik-manik,mutiara,bintang,pita
cokelat mahogani,chrome,gradasi cokelat,french crop,abstrak
merah maron,putih,painting,french crop,3D bunga,abstrak
merah maron,pink,chrome,kupu-kupu,french crop,abstrak
cokelat,chrome,bunga,manik-manik,3D bunga,daun,abstrak
pink,putih,chrome,bintang,french crop,mutiara,manik-manik,miror,3D bunga
cat eye merah,merah maron,french crop,bintang,daun,abstrak
abu-abu,merah maron,painting,chrome,mutiara,3D bunga,pita,abstrak
pink frusia,hitam,cokelat gel,cat eye,french crop,bunga
cat eye putih,pink,orange,manik-manik,french crop
merah maron,cat eye,hijau muda,pita,3D bunga,abstrak
putih,frusia,bintang,french crop,pita,abstrak
gradasi abu-abu,chrome,bunga,mutiara,3D bunga,french crop
cat eye biru,cat eye,putih,chrome,french crop,painting flower,pita,kupu-kupu,mutiara,manik-manik,bunga,3D bunga,daun,abstrak
pink frusia,chrome,stamp,manik-manik,3D bunga,bunga,abstrak
peach,kuning,chrome,ular
gradasi peach,cat eye putih,biru muda,cat eye hijau,cat eye,chrome,3D kupu-kupu,mutiara,bunga,bintang,3D bunga,pita,painting pemandangan,abstrak
cat eye hijau,chrome,gradasi abu-abu,bintang,manik-manik,3D bunga,love
hijau,hitam,chrome,painting flower,manik-manik,3D bunga
pink,peach,chrome,french crop,3D kerang,pita,abstrak
kuning,cat eye,pink pastel,mutiara,miror,abstrak
cat eye putih,pink,hitam,chrome,sarang laba-laba,mutiara,abstrak
cokelat gel,frusia,putih,cat eye,hijau muda
pink frusia,gradasi pink,chrome,bunga,3D bunga,pita
cat eye putih,kuning,putih,cat eye,chrome,mutiara,manik-manik,3D bunga,pita,abstrak,miror
putih,cat eye,gradasi abu-abu,chrome,french crop,mutiara,painting flower,abstrak
pink,love 3D,bintang,bunga,3D bunga,abstrak
merah maron,pink,chrome,cat eye,mutiara,kupu-kupu,manik-manik,abstrak
putih,cat eye,love 3D,mutiara,3D bunga,pita,abstrak
cat eye putih,frusia,putih,cat eye mahogani,3D kupu-kupu,chrome,french crop,pita,abstrak
pink,cat eye,french crop,3D kerang,bunga,3D bunga,miror,abstrak
pink frusia,putih,cat eye mahogani,cery,french crop,bintang
cat eye merah,merah maron,frusia,mutiara,french crop,bunga,stamp,manik-manik
putih,cokelat,chrome,french crop,manik-manik,mutiara,bunga,3D bunga
merah maron,cat eye,hijau muda,french crop,mutiara,abstrak
cat eye putih,merah maron,frusia,cat eye,chrome,kupu-kupu,pita,manik-manik,stamp,bunga,3D bunga,mutiara,daun,abstrak
cokelat mahogani,chrome,french crop,bunga,abstrak
pink,cat eye,chrome,bintang,french crop,3D bunga,mutiara,pita,abstrak
pink frusia,hitam,merah maron,3D pita,kuning,french crop
putih,pink,pita,manik-manik,miror,bunga
pink,cat eye,chrome,stiker,3D bunga
pink,cat eye biru,putih,kuning,cat eye,chrome,sarang laba-laba,french crop,mutiara,manik-manik,ular,bunga,miror,abstrak
hijau,cokelat gel,pink,putih,chrome
merah maron,pink,cat eye,cat eye biru,chrome,sarang laba-laba,french crop,3D bunga,mutiara,bunga,daun
pink frusia,pink,putih,bintang,love 3D,3D kerang,pita,bunga
pink,gradasi abu-abu,cat eye,chrome,mutiara,kupu-kupu,french crop,bintang,stamp,bunga,manik-manik,pita,abstrak,3D bunga
biru muda,cokelat gel,bintang,manik-manik,3D bunga
cokelat gel,pink,french crop,3D kerang,3D bunga,pita
cokelat gel,putih,3D kupu-kupu,chrome,bintang,french crop,mutiara
merah maron,pink pastel,cat eye,stiker,mutiara,ular,gradasi cokelat,manik-manik,daun
cat eye biru,kuning,ungu,cat eye,bintang,mutiara,kupu-kupu,3D bunga,abstrak
cat eye biru,pink frusia,cokelat,chrome,bunga,pita,abstrak
biru muda,cokelat mahogani,pink frusia,putih,french crop,manik-manik,bunga
putih,kuning,painting,chrome,cat eye,3D bunga,abstrak
pink,chrome,mutiara,bunga,french crop,abstrak
pink frusia,hitam,merah maron,gradasi cokelat,bintang,french crop,manik-manik,bunga,3D bunga
cat eye merah,putih,3D kupu-kupu,chrome,french crop,stiker,manik-manik,bunga
cokelat mahogani,putih,cat eye,chrome,french crop,mutiara,3D bunga
pink,pink frusia,cat eye,stiker,french crop,cery,kupu-kupu,stamp,pita,daun,abstrak
gradasi pink,putih,stiker,chrome,kupu-kupu,french crop,pita
pink,cat eye,3D bunga,manik-manik,mutiara,french crop,abstrak`;

export const SEED_TRANSACTIONS: string[][] = INITIAL_USER_DATASET_RAW
  .trim()
  .split(/\r?\n/)
  .map(line => line.split(',').map(item => item.trim().toLowerCase()).filter(Boolean));

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
        if (!parsed.transactions || parsed.transactions.length !== SEED_TRANSACTIONS.length || (parsed.transactions[0] && parsed.transactions[0].includes('French_Tips'))) {
          parsed.transactions = SEED_TRANSACTIONS;
          parsed.frequent_itemsets = [];
          parsed.association_rules = [];
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
