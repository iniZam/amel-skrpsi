import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import bcrypt from "bcryptjs";
import { db } from "./server/db";
import { runApriori, generateAssociationRules } from "./server/apriori";

// Static gallery designs with rich aesthetic properties
export const GALLERY_DESIGNS = [
  { 
    id: "Floral_Accent", 
    name: "Daisy Nude & Floral", 
    price: 130000, 
    description: "Motif daisy halus nan manis dengan dasar nude pink natural yang anggun dan feminim.", 
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop",
    category: "Cute",
    rating: 4.8,
    tag: "Populer",
    styleSubtitle: "Natural, Feminim"
  },
  { 
    id: "Nude_Gel", 
    name: "Milky White Minimalist", 
    price: 90000, 
    description: "Garis lembut minimalis bernuansa putih susu dan nude bersih yang memikat.", 
    image: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?q=80&w=600&auto=format&fit=crop",
    category: "Minimalis",
    rating: 4.7,
    tag: "Rekomendasi",
    styleSubtitle: "Bersih & Minimalis"
  },
  { 
    id: "Pastel_Ombre", 
    name: "Sugar Berry Ombre", 
    price: 125000, 
    description: "Gradasi warna berry pink manis dengan sentuhan shimmer glitter lembut berkilau.", 
    image: "https://images.unsplash.com/photo-1632345031435-8797b2d58045?q=80&w=600&auto=format&fit=crop",
    category: "Korea Style",
    rating: 4.9,
    tag: "Best Seller",
    styleSubtitle: "Manis & Berkilau"
  },
  { 
    id: "Marble_Art", 
    name: "Mocha Love & Checkered", 
    price: 150000, 
    description: "Kombinasi artistik motif hati, catur chic, dan marble hangat berkelas.", 
    image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=600&auto=format&fit=crop",
    category: "Korea Style",
    rating: 4.6,
    tag: "Populer",
    styleSubtitle: "Hangat & Chic"
  },
  { 
    id: "French_Tips", 
    name: "French Tips Modern", 
    price: 110000, 
    description: "Sentuhan gaya klasik timeless dengan ujung putih presisi pada gel kuku sehat bercahaya.", 
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop",
    category: "Classic",
    rating: 4.9,
    tag: "Favorit",
    styleSubtitle: "Klasik & Abadi"
  },
  { 
    id: "Glitter_Red", 
    name: "Glitter Glam Crimson", 
    price: 120000, 
    description: "Kilauan butiran glitter rose crimson mewah untuk pesona glamor dan percaya diri.", 
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=600&auto=format&fit=crop",
    category: "Glitter",
    rating: 4.8,
    tag: "Baru",
    styleSubtitle: "Kilau Mewah"
  },
  { 
    id: "Cat_Eye", 
    name: "Cat Eye Velvet Rose", 
    price: 160000, 
    description: "Efek magnetik 3D velvet deep rosy mauve dengan kilau galaksi yang memukau.", 
    image: "https://images.unsplash.com/photo-1522337094133-f30f51db0d5b?q=80&w=600&auto=format&fit=crop",
    category: "Elegant",
    rating: 5.0,
    tag: "Premium",
    styleSubtitle: "Misterius & Elegan"
  },
  { 
    id: "Gold_Foil", 
    name: "Gold Foil & Rose Quartz", 
    price: 130000, 
    description: "Aksen serpihan emas murni 24k di atas dasar rose quartz marmer transparan.", 
    image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=600&auto=format&fit=crop",
    category: "Elegant",
    rating: 4.8,
    tag: "Elegan",
    styleSubtitle: "Kemewahan Emas"
  },
  { 
    id: "Chrome_Finish", 
    name: "Rose Chrome Mirror", 
    price: 140000, 
    description: "Finishing chrome mirror pantulan kaca futuristik bernuansa rose metallic lembut.", 
    image: "https://images.unsplash.com/photo-1632345031435-8797b2d58045?q=80&w=600&auto=format&fit=crop",
    category: "Colorful",
    rating: 4.7,
    tag: "Tren 2026",
    styleSubtitle: "Futuristik & Berani"
  },
  { 
    id: "Matte_Black", 
    name: "Matte Velvet Plum", 
    price: 100000, 
    description: "Lapisan akhir matte beludru warna plum gelap yang anggun, modern, dan tahan gores.", 
    image: "https://images.unsplash.com/photo-1604654894560-df2db5362536?q=80&w=600&auto=format&fit=crop",
    category: "Minimalis",
    rating: 4.6,
    tag: "Minimalis",
    styleSubtitle: "Tegas & Menawan"
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Function to run the apriori model and update database results
  const performRetraining = (minSup: number, minConf: number) => {
    const data = db.get();
    const { supportMap, countsMap, frequentSets } = runApriori(data.transactions, minSup);
    const rules = generateAssociationRules(supportMap, frequentSets, minConf);
    db.saveTrainingResults(frequentSets, rules);
    return { frequentSets, rules };
  };

  // Run initial training on startup if DB is empty
  const initialData = db.get();
  if (initialData.frequent_itemsets.length === 0) {
    console.log("Running initial Apriori model training...");
    performRetraining(initialData.config.minSupport, initialData.config.minConfidence);
  }

  // --- API Routes ---

  // 1. Get designs
  app.get("/api/public/gallery", (req, res) => {
    res.json(GALLERY_DESIGNS);
  });

  // 2. Get Apriori Recommendations (Best Sellers & Bundles)
  app.get("/api/public/recommendations", (req, res) => {
    const data = db.get();

    // Format best sellers (k >= 2 frequent itemsets)
    const bestSellers = data.frequent_itemsets
      .filter(itemset => itemset.k >= 2)
      .sort((a, b) => b.support - a.support)
      .slice(0, 6)
      .map(itemset => ({
        items: itemset.items.map(item => item.replace(/_/g, ' ')),
        support: Math.round(itemset.support * 1000) / 10,
        count: itemset.count
      }));

    // Format association rules with lift > 1.0
    const recommendations = data.association_rules
      .filter(rule => rule.lift > 1.0)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 6)
      .map(rule => ({
        antecedent: rule.antecedent.map(item => item.replace(/_/g, ' ')).join(', '),
        consequent: rule.consequent.map(item => item.replace(/_/g, ' ')).join(', '),
        confidence: Math.round(rule.confidence * 1000) / 10,
        lift: Math.round(rule.lift * 100) / 100
      }));

    res.json({
      bestSellers,
      recommendations,
      totalTransactions: data.transactions.length,
      newTransactionsCount: data.config.newTransactionsSinceLastTrain
    });
  });

  // 3. Create Booking (client-side submission)
  app.post("/api/public/bookings", (req, res) => {
    const { name, email, phone, services, date, time } = req.body;

    if (!name || !email || !phone || !services || !date || !time) {
      return res.status(400).json({ error: "Semua detail pemesanan harus diisi." });
    }

    const newBooking = db.addBooking({
      name,
      email,
      phone,
      services,
      date,
      time
    });

    res.status(201).json({ success: true, booking: newBooking });
  });

  // 4. Admin Login
  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    const data = db.get();
    const user = data.users.find(u => u.username === username);

    if (user && bcrypt.compareSync(password, user.passwordHash)) {
      res.json({ success: true, token: "admin-jwt-token-lucky", username: user.username });
    } else {
      res.status(401).json({ error: "Username atau password salah." });
    }
  });

  // 5. Admin Dashboard Details
  app.get("/api/admin/dashboard", (req, res) => {
    const data = db.get();
    res.json({
      bookings: data.bookings,
      totalTransactions: data.transactions.length,
      newTransactionsSinceLastTrain: data.config.newTransactionsSinceLastTrain,
      config: data.config,
      frequentItemsets: data.frequent_itemsets,
      associationRules: data.association_rules
    });
  });

  // 6. Manual trigger training
  app.post("/api/admin/train", (req, res) => {
    const { minSupport, minConfidence } = req.body;
    const data = db.get();

    const minSup = minSupport !== undefined ? parseFloat(minSupport) : data.config.minSupport;
    const minConf = minConfidence !== undefined ? parseFloat(minConfidence) : data.config.minConfidence;

    // Save updated configuration in database
    db.update(d => {
      d.config.minSupport = minSup;
      d.config.minConfidence = minConf;
    });

    try {
      const { frequentSets, rules } = performRetraining(minSup, minConf);
      res.json({
        success: true,
        frequentSetsCount: frequentSets.length,
        rulesCount: rules.length
      });
    } catch (err: any) {
      res.status(500).json({ error: `Gagal melatih data: ${err.message}` });
    }
  });

  // 7. Manually add a single transaction
  app.post("/api/admin/add-transaction", (req, res) => {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Transaksi kuku minimal harus memiliki 1 item." });
    }

    const newCount = db.addTransaction(items);

    // Check for auto-retraining at threshold of 20
    let autoRetrained = false;
    if (newCount >= 20) {
      const data = db.get();
      performRetraining(data.config.minSupport, data.config.minConfidence);
      autoRetrained = true;
    }

    res.json({
      success: true,
      newTransactionsCount: db.get().config.newTransactionsSinceLastTrain,
      autoRetrained
    });
  });

  // 8. CSV Bulk upload & training
  app.post("/api/admin/upload-csv", (req, res) => {
    const { csvText, minSupport, minConfidence } = req.body;

    if (!csvText) {
      return res.status(400).json({ error: "Konten CSV kosong atau tidak ditemukan." });
    }

    try {
      const transactions: string[][] = [];
      const lines = csvText.split(/\r?\n/);

      for (const line of lines) {
        if (!line.trim()) continue;
        const items = line
          .split(",")
          .map((item: string) => item.trim().replace(/\s+/g, "_"))
          .filter(Boolean);
        if (items.length > 0) {
          transactions.push(items);
        }
      }

      if (transactions.length === 0) {
        return res.status(400).json({ error: "Tidak ada transaksi terdeteksi dari CSV." });
      }

      const data = db.get();
      const minSup = minSupport !== undefined ? parseFloat(minSupport) : data.config.minSupport;
      const minConf = minConfidence !== undefined ? parseFloat(minConfidence) : data.config.minConfidence;

      // Update database configuration and overwrite transactions with the CSV transactions
      db.update(d => {
        d.transactions = transactions;
        d.config.minSupport = minSup;
        d.config.minConfidence = minConf;
      });

      const { frequentSets, rules } = performRetraining(minSup, minConf);

      res.json({
        success: true,
        transactionsCount: transactions.length,
        frequentSetsCount: frequentSets.length,
        rulesCount: rules.length
      });
    } catch (err: any) {
      res.status(500).json({ error: `Gagal memproses file CSV: ${err.message}` });
    }
  });

  // 9. Update Booking Status (Cancel or Complete)
  app.patch("/api/admin/bookings/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: "Status pemesanan tidak valid." });
    }

    const updatedBooking = db.updateBookingStatus(id, status);
    if (!updatedBooking) {
      return res.status(404).json({ error: "Pemesanan tidak ditemukan." });
    }

    // Check if completing booking triggered auto-retraining (due to 20 new transactions limit)
    let autoRetrained = false;
    const data = db.get();
    if (data.config.newTransactionsSinceLastTrain >= 20) {
      performRetraining(data.config.minSupport, data.config.minConfidence);
      autoRetrained = true;
    }

    res.json({
      success: true,
      booking: updatedBooking,
      newTransactionsCount: db.get().config.newTransactionsSinceLastTrain,
      autoRetrained
    });
  });

  // --- Vite & Client App Routing ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Lucky Nailart Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
