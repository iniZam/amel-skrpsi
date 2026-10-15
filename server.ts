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

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Function to run the apriori model and update database results
  const performRetraining = (minSup: number, minConf: number) => {
    const data = db.get();
    const { supportMap, countsMap, frequentSets } = runApriori(data.transactions, minSup);
    const rules = generateAssociationRules(supportMap, frequentSets, minConf);
    db.saveTrainingResults(frequentSets, rules);
    return { frequentSets, rules };
  };

  // Run initial training on startup if DB is empty or using legacy seed
  const initialData = db.get();
  if (
    initialData.frequent_itemsets.length === 0 || 
    !initialData.transactions || 
    initialData.transactions.length === 0 ||
    (initialData.transactions[0] && initialData.transactions[0].includes('French_Tips'))
  ) {
    console.log("Menyiapkan dataset referensi awal Apriori dari pengguna (31 transaksi riil)...");
    db.resetTransactionsToUserDataset();
    performRetraining(0.15, 0.5);
  }

  // --- API Routes ---

  // 1. Get designs
  app.get("/api/public/gallery", (req, res) => {
    res.json(db.getDesigns());
  });
  app.get("/api/gallery", (req, res) => {
    res.json(db.getDesigns());
  });

  // Admin Services & Gallery Management
  app.get(["/api/admin/services", "/api/admin/gallery"], (req, res) => {
    res.json(db.getDesigns());
  });

  app.post(["/api/admin/services", "/api/admin/gallery"], (req, res) => {
    const { name, price, description, image, category, rating, tag, styleSubtitle, id } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: "Nama motif/layanan kuku wajib diisi." });
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: "Harga layanan tidak valid." });
    }

    try {
      const created = db.addDesign({
        id,
        name,
        price: numPrice,
        description: description || '',
        image: image || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop',
        category: category || 'Minimalis',
        rating: rating ? Number(rating) : 4.8,
        tag: tag || 'Populer',
        styleSubtitle: styleSubtitle || 'Trendy & Cantik'
      });

      res.status(201).json({
        success: true,
        message: "Layanan kuku dan foto galeri baru berhasil ditambahkan!",
        design: created,
        designs: db.getDesigns()
      });
    } catch (err: any) {
      res.status(500).json({ error: `Gagal menambahkan layanan: ${err.message}` });
    }
  });

  app.put(["/api/admin/services/:id", "/api/admin/gallery/:id"], (req, res) => {
    const { id } = req.params;
    const { name, price, description, image, category, rating, tag, styleSubtitle } = req.body;

    if (!id) {
      return res.status(400).json({ error: "ID layanan tidak valid." });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (price !== undefined) updates.price = Number(price);
    if (description !== undefined) updates.description = String(description);
    if (image !== undefined) updates.image = String(image).trim();
    if (category !== undefined) updates.category = String(category);
    if (rating !== undefined) updates.rating = Number(rating);
    if (tag !== undefined) updates.tag = String(tag);
    if (styleSubtitle !== undefined) updates.styleSubtitle = String(styleSubtitle);

    const updated = db.updateDesign(id, updates);
    if (!updated) {
      return res.status(404).json({ error: `Layanan kuku dengan ID ${id} tidak ditemukan.` });
    }

    res.json({
      success: true,
      message: `Layanan "${updated.name}" berhasil diperbarui!`,
      design: updated,
      designs: db.getDesigns()
    });
  });

  app.delete(["/api/admin/services/:id", "/api/admin/gallery/:id"], (req, res) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "ID layanan tidak valid." });
    }

    const success = db.deleteDesign(id);
    if (!success) {
      return res.status(404).json({ error: `Layanan kuku dengan ID ${id} tidak ditemukan.` });
    }

    res.json({
      success: true,
      message: "Layanan kuku berhasil dihapus dari galeri.",
      designs: db.getDesigns()
    });
  });

  app.post(["/api/admin/services/reset", "/api/admin/gallery/reset"], (req, res) => {
    const defaultDesigns = db.resetDesigns();
    res.json({
      success: true,
      message: "Daftar galeri dan layanan berhasil dikembalikan ke standar awal.",
      designs: defaultDesigns
    });
  });

  // 2. Get Apriori Recommendations (Best Sellers & Bundles)
  const getRecommendationsHandler = (req: express.Request, res: express.Response) => {
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
      total_transactions: data.transactions.length,
      newTransactionsCount: data.config.newTransactionsSinceLastTrain,
      new_tx_count: data.config.newTransactionsSinceLastTrain
    });
  };

  app.get("/api/public/recommendations", getRecommendationsHandler);
  app.get("/api/recommendations", getRecommendationsHandler);

  // 3. Create Booking (client-side submission)
  const createBookingHandler = (req: express.Request, res: express.Response) => {
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
  };

  app.post("/api/bookings", createBookingHandler);
  app.post("/api/public/bookings", createBookingHandler);

  // Lookup booking by ID
  const getBookingByIdHandler = (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "ID booking harus diisi." });
    }
    const data = db.get();
    const found = data.bookings.find(b => b.id.toLowerCase() === id.trim().toLowerCase());
    if (!found) {
      return res.status(404).json({ error: `Pemesanan dengan nomor "${id}" tidak ditemukan dalam sistem.` });
    }
    res.json({ success: true, booking: found });
  };

  app.get("/api/public/bookings/:id", getBookingByIdHandler);
  app.get("/api/bookings/:id", getBookingByIdHandler);

  // ==========================================
  // --- ENDPOINT ADMIN (DASBOR PENGELOLA) ---
  // ==========================================

  // POST /api/admin/login
  // Fungsi: Memverifikasi proses masuk (login) akun admin.
  // Parameter JSON Input: username dan password.
  // Data Kembalian: Token otorisasi tiruan ("admin-jwt-token-lucky") jika kredensial cocok dengan database, atau pesan error 401 jika salah.
  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username dan password wajib diisi." });
    }

    const data = db.get();
    const user = data.users.find(u => u.username === username);

    if (user && bcrypt.compareSync(password, user.passwordHash)) {
      res.json({
        success: true,
        token: "admin-jwt-token-lucky",
        username: user.username,
        message: "Login admin berhasil."
      });
    } else {
      res.status(401).json({
        error: "Username atau password salah.",
        message: "Kredensial tidak valid."
      });
    }
  });

  // GET /api/admin/dashboard
  // Fungsi: Memuat seluruh ringkasan data yang dibutuhkan untuk dasbor admin.
  // Data Kembalian: Mengembalikan daftar semua bookings, jumlah total transaksi, konfigurasi Apriori saat ini (minSupport, minConfidence, hitungan transaksi baru), daftar frequent itemsets, dan daftar association rules.
  app.get("/api/admin/dashboard", (req, res) => {
    const data = db.get();
    res.json({
      bookings: data.bookings,
      totalTransactions: data.transactions.length,
      total_transactions: data.transactions.length,
      newTransactionsSinceLastTrain: data.config.newTransactionsSinceLastTrain,
      new_tx_count: data.config.newTransactionsSinceLastTrain,
      config: {
        minSupport: data.config.minSupport,
        minConfidence: data.config.minConfidence,
        newTransactionsSinceLastTrain: data.config.newTransactionsSinceLastTrain,
        new_tx_count: data.config.newTransactionsSinceLastTrain
      },
      frequentItemsets: data.frequent_itemsets,
      frequent_itemsets: data.frequent_itemsets,
      associationRules: data.association_rules,
      association_rules: data.association_rules
    });
  });

  // POST /api/admin/add-transaction
  // Fungsi: Menambahkan transaksi baru secara manual ke database.
  // Parameter JSON Input: items (array berisi daftar nama layanan kuku).
  // Perilaku Khusus: Jika jumlah transaksi baru (new_tx_count) mencapai angka 20, sistem akan otomatis melatih ulang (retrain) model Apriori.
  app.post("/api/admin/add-transaction", (req, res) => {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Transaksi kuku minimal harus memiliki 1 item (array nama layanan kuku)." });
    }

    const sanitizedItems = items.map((it: string) => String(it).trim().toLowerCase()).filter(Boolean);
    if (sanitizedItems.length === 0) {
      return res.status(400).json({ error: "Item transaksi tidak valid." });
    }

    const newCount = db.addTransaction(sanitizedItems);

    // Check for auto-retraining at threshold of 20 new transactions
    let autoRetrained = false;
    if (newCount >= 20) {
      const data = db.get();
      performRetraining(data.config.minSupport, data.config.minConfidence);
      autoRetrained = true;
    }

    const currentDb = db.get();
    res.json({
      success: true,
      message: autoRetrained 
        ? "Transaksi berhasil ditambahkan. Sistem otomatis melatih ulang model Apriori karena mencapai 20 transaksi baru." 
        : "Transaksi berhasil ditambahkan.",
      newTransactionsCount: currentDb.config.newTransactionsSinceLastTrain,
      new_tx_count: currentDb.config.newTransactionsSinceLastTrain,
      totalTransactions: currentDb.transactions.length,
      autoRetrained
    });
  });

  // POST /api/admin/train
  // Fungsi: Memicu pelatihan ulang model Apriori secara manual dengan parameter khusus.
  // Parameter JSON Input: minSupport dan minConfidence.
  // Data Kembalian: Jumlah total frequent sets dan rules yang baru saja dihasilkan.
  app.post("/api/admin/train", (req, res) => {
    const { minSupport, minConfidence } = req.body;
    const data = db.get();

    const minSup = minSupport !== undefined ? parseFloat(minSupport) : data.config.minSupport;
    const minConf = minConfidence !== undefined ? parseFloat(minConfidence) : data.config.minConfidence;

    if (isNaN(minSup) || minSup <= 0 || minSup > 1) {
      return res.status(400).json({ error: "Nilai minSupport harus berada di antara 0.01 dan 1.0." });
    }
    if (isNaN(minConf) || minConf <= 0 || minConf > 1) {
      return res.status(400).json({ error: "Nilai minConfidence harus berada di antara 0.01 dan 1.0." });
    }

    // Save updated configuration in database
    db.update(d => {
      d.config.minSupport = minSup;
      d.config.minConfidence = minConf;
    });

    try {
      const { frequentSets, rules } = performRetraining(minSup, minConf);
      res.json({
        success: true,
        message: "Model Apriori berhasil dilatih ulang.",
        frequentSetsCount: frequentSets.length,
        frequent_sets_count: frequentSets.length,
        rulesCount: rules.length,
        rules_count: rules.length,
        config: {
          minSupport: minSup,
          minConfidence: minConf,
          new_tx_count: 0
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: `Gagal melatih data: ${err.message}` });
    }
  });

  // POST /api/admin/upload-csv
  // Fungsi: Mengimpor data transaksi secara massal melalui teks berformat CSV, menimpa transaksi lama, dan otomatis melatih ulang model Apriori.
  // Parameter JSON Input: csvText (isi teks CSV), opsional minSupport dan minConfidence.
  // Data Kembalian: Jumlah transaksi yang diimpor beserta metrik hasil pelatihan baru.
  app.post("/api/admin/upload-csv", (req, res) => {
    const { csvText, minSupport, minConfidence } = req.body;

    if (!csvText || typeof csvText !== 'string' || !csvText.trim()) {
      return res.status(400).json({ error: "Konten CSV (csvText) kosong atau tidak ditemukan." });
    }

    try {
      const transactions: string[][] = [];
      const lines = csvText.split(/\r?\n/);

      for (const line of lines) {
        if (!line.trim()) continue;
        const items = line
          .split(",")
          .map((item: string) => item.trim().toLowerCase())
          .filter(Boolean);
        if (items.length > 0) {
          transactions.push(items);
        }
      }

      if (transactions.length === 0) {
        return res.status(400).json({ error: "Tidak ada transaksi valid yang terdeteksi dari teks CSV." });
      }

      const data = db.get();
      const minSup = minSupport !== undefined ? parseFloat(minSupport) : data.config.minSupport;
      const minConf = minConfidence !== undefined ? parseFloat(minConfidence) : data.config.minConfidence;

      // Update database configuration and overwrite transactions with the imported CSV transactions
      db.update(d => {
        d.transactions = transactions;
        d.config.minSupport = minSup;
        d.config.minConfidence = minConf;
        d.config.newTransactionsSinceLastTrain = 0;
      });

      const { frequentSets, rules } = performRetraining(minSup, minConf);

      res.json({
        success: true,
        message: "File CSV berhasil diimpor dan model Apriori berhasil dilatih ulang.",
        transactionsCount: transactions.length,
        transactions_count: transactions.length,
        frequentSetsCount: frequentSets.length,
        frequent_sets_count: frequentSets.length,
        rulesCount: rules.length,
        rules_count: rules.length,
        config: {
          minSupport: minSup,
          minConfidence: minConf,
          new_tx_count: 0
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: `Gagal memproses file CSV: ${err.message}` });
    }
  });

  // POST /api/admin/reset-dataset
  // Fungsi: Menerapkan kembali dataset referensi awal (31 transaksi riil nail art) dari pengguna dan melatih ulang model Apriori
  app.post("/api/admin/reset-dataset", (req, res) => {
    try {
      const transactions = db.resetTransactionsToUserDataset();
      const minSup = 0.15;
      const minConf = 0.5;
      const { frequentSets, rules } = performRetraining(minSup, minConf);

      res.json({
        success: true,
        message: "Dataset referensi awal (31 transaksi nail art) berhasil diterapkan dan model Apriori dilatih ulang!",
        transactionsCount: transactions.length,
        transactions_count: transactions.length,
        frequentSetsCount: frequentSets.length,
        frequent_sets_count: frequentSets.length,
        rulesCount: rules.length,
        rules_count: rules.length,
        config: {
          minSupport: minSup,
          minConfidence: minConf,
          new_tx_count: 0
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: `Gagal memuat dataset referensi: ${err.message}` });
    }
  });

  // GET /api/admin/dataset-info
  // Mengembalikan teks dataset referensi awal untuk kemudahan inspeksi admin
  app.get("/api/admin/dataset-info", (req, res) => {
    const raw = db.getRawUserDataset();
    const data = db.get();
    res.json({
      rawDataset: raw,
      currentTransactionsCount: data.transactions.length,
      currentConfig: data.config
    });
  });

  // PATCH /api/admin/bookings/:id/status or /api/admin/bookings/:booking_id/status
  // Fungsi: Memperbarui status dari sebuah reservasi tertentu (misalnya dari 'pending' menjadi 'completed' atau 'cancelled').
  // Parameter JSON Input: status.
  // Perilaku Khusus: Jika status diubah menjadi 'completed', layanan yang ada di reservasi tersebut akan otomatis dicatat sebagai transaksi baru. Sistem juga akan memeriksa apakah perlu melakukan retraining model jika batas 20 transaksi baru terpenuhi.
  const updateBookingStatusHandler = (req: express.Request, res: express.Response) => {
    const id = req.params.id || req.params.booking_id;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({ error: "ID reservasi (booking_id) tidak ditemukan." });
    }

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: "Status pemesanan tidak valid. Pilih antara 'pending', 'completed', atau 'cancelled'." });
    }

    const updatedBooking = db.updateBookingStatus(id, status);
    if (!updatedBooking) {
      return res.status(404).json({ error: `Pemesanan dengan ID ${id} tidak ditemukan.` });
    }

    // Check if completing booking triggered auto-retraining (due to 20 new transactions limit)
    let autoRetrained = false;
    const currentData = db.get();
    if (currentData.config.newTransactionsSinceLastTrain >= 20) {
      performRetraining(currentData.config.minSupport, currentData.config.minConfidence);
      autoRetrained = true;
    }

    res.json({
      success: true,
      message: `Status reservasi ${id} berhasil diperbarui menjadi ${status}.`,
      booking: updatedBooking,
      newTransactionsCount: db.get().config.newTransactionsSinceLastTrain,
      new_tx_count: db.get().config.newTransactionsSinceLastTrain,
      autoRetrained
    });
  };

  app.patch("/api/admin/bookings/:id/status", updateBookingStatusHandler);
  app.patch("/api/admin/bookings/:booking_id/status", updateBookingStatusHandler);

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
