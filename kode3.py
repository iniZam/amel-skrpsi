from flask import Flask, render_template, request, redirect, url_for, session, g
import pandas as pd
import itertools
import sqlite3
from collections import defaultdict
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = "kunci_rahasia_super_aman_lucky_nailart" # Ganti dengan key acak
DATABASE = 'lucky_nailart.db'

# ----------------------------
# Database Helpers
# ----------------------------
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    """Inisialisasi tabel database saat aplikasi pertama kali dijalankan"""
    with app.app_context():
        db = get_db()
        # Tabel User
        db.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        ''')
        # Tabel Frequent Itemsets (Kombinasi Populer)
        db.execute('''
            CREATE TABLE IF NOT EXISTS frequent_itemsets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                items TEXT NOT NULL,
                support REAL NOT NULL,
                count INTEGER NOT NULL,
                k INTEGER NOT NULL
            )
        ''')
        # Tabel Aturan Asosiasi (Rekomendasi Pintar)
        db.execute('''
            CREATE TABLE IF NOT EXISTS association_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                antecedent TEXT NOT NULL,
                consequent TEXT NOT NULL,
                support REAL NOT NULL,
                confidence REAL NOT NULL,
                lift REAL NOT NULL
            )
        ''')
        
        # Buat akun admin bawaan jika belum ada (Username: admin, Password: admin123)
        try:
            db.execute(
                'INSERT INTO users (username, password) VALUES (?, ?)',
                ('admin', generate_password_hash('admin123'))
            )
            db.commit()
        except sqlite3.IntegrityError:
            pass # Username admin sudah ada

# Decorator untuk membatasi akses halaman admin
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_logged_in' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# ----------------------------
# Fungsi Core Apriori (Sama seperti sebelumnya)
# ----------------------------
def load_transactions_from_csv(file):
    transactions = []
    content = file.read().decode("utf-8").strip()
    lines = content.splitlines()
    for line in lines:
        items = [item.strip().replace(" ", "_") for item in line.split(",") if item.strip()]
        if items:
            transactions.append(items)
    return transactions

def apriori(transactions, min_support):
    n_tx = len(transactions)
    min_count = max(1, int(min_support * n_tx + 1e-9))

    item_counts = defaultdict(int)
    for t in transactions:
        for i in t:
            item_counts[i] += 1
    L1 = {frozenset([i]): c for i, c in item_counts.items() if c >= min_count}

    frequent = dict(L1)
    Lk = L1
    k = 2

    def join_step(prev_L):
        prev_itemsets = list(prev_L.keys())
        candidates = set()
        for i in range(len(prev_itemsets)):
            for j in range(i + 1, len(prev_itemsets)):
                a, b = prev_itemsets[i], prev_itemsets[j]
                union = a | b
                if len(union) == k:
                    all_subfreq = all((union - frozenset([x])) in prev_L for x in union)
                    if all_subfreq:
                        candidates.add(union)
        return candidates

    while Lk:
        Ck = join_step(Lk)
        if not Ck:
            break
        counts = defaultdict(int)
        for t in transactions:
            for c in Ck:
                if c.issubset(t):
                    counts[c] += 1
        Lk = {itemset: cnt for itemset, cnt in counts.items() if cnt >= min_count}
        frequent.update(Lk)
        k += 1

    support = {fs: cnt / n_tx for fs, cnt in frequent.items()}
    return support, frequent, n_tx

def association_rules(frequent_support, n_tx, min_confidence=0.3):
    rules = []
    support_lookup = frequent_support

    for itemset, sup in support_lookup.items():
        if len(itemset) < 2:
            continue
        items = list(itemset)
        for r in range(1, len(items)):
            for antecedent in itertools.combinations(items, r):
                antecedent = frozenset(antecedent)
                consequent = itemset - antecedent
                if not consequent:
                    continue
                sup_itemset = sup
                sup_ante = support_lookup.get(antecedent)
                sup_cons = support_lookup.get(consequent)
                if sup_ante is None or sup_cons is None:
                    continue
                conf = sup_itemset / max(sup_ante, 1e-12)
                if conf + 1e-12 >= min_confidence:
                    lift = conf / max(sup_cons, 1e-12)
                    rules.append({
                        "antecedent": tuple(sorted(antecedent)),
                        "consequent": tuple(sorted(consequent)),
                        "support": sup_itemset,
                        "confidence": conf,
                        "lift": lift,
                    })
    rules.sort(key=lambda x: (x["confidence"], x["lift"], x["support"]), reverse=True)
    return rules

# ----------------------------
# Web Routes
# ----------------------------

# 1. Halaman Utama Pembeli (Membaca Hasil dari SQLite)
@app.get("/")
def index():
    db = get_db()
    
    # Ambil kombinasi produk populer (Best Seller) dengan ukuran item >= 2, urut berdasarkan support tertinggi
    best_sellers_query = db.execute('''
        SELECT items, support, count FROM frequent_itemsets 
        WHERE k >= 2 
        ORDER BY support DESC LIMIT 6
    ''').fetchall()
    
    # Format data kombinasi produk agar mudah ditampilkan di HTML
    best_sellers = []
    for row in best_sellers_query:
        # Mengembalikan string "Glitter_Red,Nude_Gel" kembali menjadi list ["Glitter Red", "Nude Gel"]
        formatted_items = [item.replace("_", " ") for item in row['items'].split(',')]
        best_sellers.append({
            'produk': formatted_items,
            'support': round(row['support'] * 100, 1),
            'count': row['count']
        })

    # Ambil rekomendasi relasi aturan asosiasi (Rekomendasi Bundling Pintar)
    rules_query = db.execute('''
        SELECT antecedent, consequent, confidence, lift FROM association_rules 
        WHERE lift > 1.0 
        ORDER BY confidence DESC LIMIT 6
    ''').fetchall()
    
    recommendations = []
    for row in rules_query:
        formatted_ant = [item.replace("_", " ") for item in row['antecedent'].split(',')]
        formatted_cons = [item.replace("_", " ") for item in row['consequent'].split(',')]
        recommendations.append({
            'antecedent': ", ".join(formatted_ant),
            'consequent': ", ".join(formatted_cons),
            'confidence': round(row['confidence'] * 100, 1),
            'lift': round(row['lift'], 2)
        })

    return render_template('home.html', best_sellers=best_sellers, recommendations=recommendations)

# 2. Halaman Login Admin
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        
        db = get_db()
        user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
        
        if user and check_password_hash(user['password'], password):
            session['admin_logged_in'] = True
            session['username'] = username
            return redirect(url_for('admin_dashboard'))
        else:
            return render_template('login.html', error="Username atau password salah.")
            
    return render_template('login.html')

# 3. Logout Route
@app.get("/logout")
def logout():
    session.pop('admin_logged_in', None)
    session.pop('username', None)
    return redirect(url_for('index'))

# 4. Halaman Dashboard Admin (Butuh Login)
@app.get("/admin")
@login_required
def admin_dashboard():
    return render_template('admin.html')

# 5. Route untuk memproses CSV dan mengupdate Database (Butuh Login)
@app.post("/run")
@login_required
def run_apriori():
    f = request.files.get("csvfile")
    minsup = float(request.form.get("minsup", 0.1))
    minconf = float(request.form.get("minconf", 0.3))

    if not f:
        return "CSV tidak ditemukan", 400

    try:
        transactions = load_transactions_from_csv(f)
    except Exception as e:
        return f"Gagal membaca CSV: {e}", 400

    if not transactions:
        return "Tidak ada transaksi terdeteksi dari CSV.", 400

    # Menjalankan Algoritma Apriori
    fs_support, fs_counts, n_tx = apriori(transactions, minsup)
    rules = association_rules(fs_support, n_tx, min_confidence=minconf)

    # Memasukkan Hasil Training ke SQLite Database
    db = get_db()
    
    # Bersihkan hasil training lama sebelum memasukkan yang baru
    db.execute('DELETE FROM frequent_itemsets')
    db.execute('DELETE FROM association_rules')

    # Simpan Frequent Itemsets baru
    for fs, sup in fs_support.items():
        items_str = ",".join(sorted(list(fs)))
        db.execute(
            'INSERT INTO frequent_itemsets (items, support, count, k) VALUES (?, ?, ?, ?)',
            (items_str, sup, fs_counts.get(fs, int(round(sup * n_tx))), len(fs))
        )

    # Simpan Aturan Asosiasi baru
    for r in rules:
        ant_str = ",".join(r["antecedent"])
        cons_str = ",".join(r["consequent"])
        db.execute(
            'INSERT INTO association_rules (antecedent, consequent, support, confidence, lift) VALUES (?, ?, ?, ?, ?)',
            (ant_str, cons_str, r["support"], r["confidence"], r["lift"])
        )
    
    db.commit()

    # Siapkan data preview untuk halaman hasil training admin
    fis_rows = [{
        "itemset": tuple(sorted(fs)),
        "k": len(fs),
        "support": sup,
        "count": fs_counts.get(fs, int(round(sup * n_tx)))
    } for fs, sup in fs_support.items()]
    fis_rows.sort(key=lambda x: (x["k"], x["support"]), reverse=True)

    return render_template('hasil.html',
                           n_tx=n_tx,
                           minsup=minsup,
                           minconf=minconf,
                           fis=fis_rows,
                           rules=rules)

if __name__ == "__main__":
    init_db()  # Inisialisasi DB sebelum server menyala
    app.run(port=5000, debug=True)