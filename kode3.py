from flask import Flask, request, jsonify, g
import sqlite3
import itertools
from collections import defaultdict
from werkzeug.security import generate_password_hash, check_password_hash
import json
import uuid
import datetime

app = Flask(__name__)
app.secret_key = "kunci_rahasia_super_aman_lucky_nailart"
DATABASE = 'lucky_nailart.db'

# Data statis galeri kuku
GALLERY_DESIGNS = [
    {"id": "Glitter_Red", "name": "Glitter Red", "price": 120000, "description": "Bold glittery crimson gel kuku, perfect for a striking elegant look.", "image": "https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=600"},
    {"id": "Nude_Gel", "name": "Nude Gel", "price": 90000, "description": "Minimalist, sleek natural nude skin shade that goes well with anything.", "image": "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?q=80&w=600"},
    {"id": "Marble_Art", "name": "Marble Art", "price": 150000, "description": "Luxurious artistic white and gold marble-textured nail polish details.", "image": "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=600"},
    {"id": "Chrome_Finish", "name": "Chrome Finish", "price": 140000, "description": "Futuristic, ultra-reflective metallic chrome sheen with mirror glow.", "image": "https://images.unsplash.com/photo-1632345031435-8797b2d58045?q=80&w=600"},
    {"id": "French_Tips", "name": "French Tips", "price": 110000, "description": "Timeless classic style featuring crisp white tips on healthy pink gel.", "image": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600"},
    {"id": "Floral_Accent", "name": "Floral Accent", "price": 130000, "description": "Delicate and sweet hand-painted daisies or rose ornaments on accent nails.", "image": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600"},
    {"id": "Cat_Eye", "name": "Cat Eye", "price": 160000, "description": "Captivating deep magnetic 3D velvet effect with stellar starry streaks.", "image": "https://images.unsplash.com/photo-1522337094133-f30f51db0d5b?q=80&w=600"},
    {"id": "Matte_Black", "name": "Matte Black", "price": 100000, "description": "Chic, velvety matte black finish with elegant minimalist vibes.", "image": "https://images.unsplash.com/photo-1604654894560-df2db5362536?q=80&w=600"},
    {"id": "Gold_Foil", "name": "Gold Foil", "price": 130000, "description": "Glimmering design with actual textured flakes of premium gold foil details.", "image": "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=600"},
    {"id": "Pastel_Ombre", "name": "Pastel Ombre", "price": 125000, "description": "Seamless gradient blend of soft pastel colors like lavender and baby pink.", "image": "https://images.unsplash.com/photo-1632345031435-8797b2d58045?q=80&w=600"}
]

# --- Database Setup ---
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
    with app.app_context():
        db = get_db()
        db.execute('''CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT)''')
        db.execute('''CREATE TABLE IF NOT EXISTS frequent_itemsets (id INTEGER PRIMARY KEY, items TEXT, support REAL, count INTEGER, k INTEGER)''')
        db.execute('''CREATE TABLE IF NOT EXISTS association_rules (id INTEGER PRIMARY KEY, antecedent TEXT, consequent TEXT, support REAL, confidence REAL, lift REAL)''')
        db.execute('''CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, name TEXT, email TEXT, phone TEXT, services TEXT, date TEXT, time TEXT, status TEXT, created_at TEXT)''')
        db.execute('''CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY, items TEXT)''')
        db.execute('''CREATE TABLE IF NOT EXISTS config (id INTEGER PRIMARY KEY, min_support REAL, min_confidence REAL, new_tx_count INTEGER)''')
        
        try:
            db.execute('INSERT INTO users (username, password) VALUES (?, ?)', ('admin', generate_password_hash('admin123')))
        except sqlite3.IntegrityError:
            pass
        
        config = db.execute('SELECT * FROM config WHERE id = 1').fetchone()
        if not config:
            db.execute('INSERT INTO config (id, min_support, min_confidence, new_tx_count) VALUES (1, 0.1, 0.3, 0)')
        db.commit()

# --- Apriori Algorithm Core ---
def run_apriori_pipeline(min_support, min_confidence):
    db = get_db()
    tx_rows = db.execute('SELECT items FROM transactions').fetchall()
    transactions = [json.loads(row['items']) for row in tx_rows]
    n_tx = len(transactions)
    
    if n_tx == 0:
        return 0, 0

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
                if len(union) == k and all((union - frozenset([x])) in prev_L for x in union):
                    candidates.add(union)
        return candidates

    while Lk:
        Ck = join_step(Lk)
        if not Ck: break
        counts = defaultdict(int)
        for t in transactions:
            for c in Ck:
                if c.issubset(t): counts[c] += 1
        Lk = {itemset: cnt for itemset, cnt in counts.items() if cnt >= min_count}
        frequent.update(Lk)
        k += 1

    fs_support = {fs: cnt / n_tx for fs, cnt in frequent.items()}
    rules = []
    for itemset, sup in fs_support.items():
        if len(itemset) < 2: continue
        items = list(itemset)
        for r in range(1, len(items)):
            for antecedent in itertools.combinations(items, r):
                antecedent = frozenset(antecedent)
                consequent = itemset - antecedent
                sup_ante = fs_support.get(antecedent)
                sup_cons = fs_support.get(consequent)
                if not sup_ante or not sup_cons: continue
                
                conf = sup / sup_ante
                if conf >= min_confidence:
                    lift = conf / sup_cons
                    rules.append((list(antecedent), list(consequent), sup, conf, lift))
    
    # Save to DB
    db.execute('DELETE FROM frequent_itemsets')
    db.execute('DELETE FROM association_rules')
    
    for fs, sup in fs_support.items():
        db.execute('INSERT INTO frequent_itemsets (items, support, count, k) VALUES (?, ?, ?, ?)', 
                   (json.dumps(list(fs)), sup, frequent[fs], len(fs)))
                   
    for r in rules:
        db.execute('INSERT INTO association_rules (antecedent, consequent, support, confidence, lift) VALUES (?, ?, ?, ?, ?)',
                   (json.dumps(r[0]), json.dumps(r[1]), r[2], r[3], r[4]))
                   
    db.execute('UPDATE config SET new_tx_count = 0 WHERE id = 1')
    db.commit()
    return len(fs_support), len(rules)

# --- API Endpoints ---

@app.route("/api/public/gallery", methods=["GET"])
def get_gallery():
    return jsonify(GALLERY_DESIGNS)

@app.route("/api/public/recommendations", methods=["GET"])
def get_recommendations():
    db = get_db()
    best_sellers_query = db.execute('SELECT * FROM frequent_itemsets WHERE k >= 2 ORDER BY support DESC LIMIT 6').fetchall()
    best_sellers = [{
        "items": [i.replace('_', ' ') for i in json.loads(row['items'])],
        "support": round(row['support'] * 100, 1),
        "count": row['count']
    } for row in best_sellers_query]

    rules_query = db.execute('SELECT * FROM association_rules WHERE lift > 1.0 ORDER BY confidence DESC LIMIT 6').fetchall()
    recommendations = [{
        "antecedent": ", ".join([i.replace('_', ' ') for i in json.loads(row['antecedent'])]),
        "consequent": ", ".join([i.replace('_', ' ') for i in json.loads(row['consequent'])]),
        "confidence": round(row['confidence'] * 100, 1),
        "lift": round(row['lift'], 2)
    } for row in rules_query]

    tx_count = db.execute('SELECT COUNT(*) FROM transactions').fetchone()[0]
    config = db.execute('SELECT new_tx_count FROM config WHERE id = 1').fetchone()
    
    return jsonify({
        "bestSellers": best_sellers,
        "recommendations": recommendations,
        "totalTransactions": tx_count,
        "newTransactionsCount": config['new_tx_count']
    })

@app.route("/api/public/bookings", methods=["POST"])
def create_booking():
    data = request.json
    db = get_db()
    booking_id = "bk-" + str(uuid.uuid4())[:8]
    created_at = datetime.datetime.now().isoformat()
    
    db.execute('INSERT INTO bookings (id, name, email, phone, services, date, time, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
               (booking_id, data['name'], data['email'], data['phone'], json.dumps(data['services']), data['date'], data['time'], 'pending', created_at))
    db.commit()
    
    return jsonify({"success": True, "booking": {"id": booking_id, "name": data['name'], "date": data['date'], "time": data['time'], "services": data['services']}})

@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    data = request.json
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE username = ?', (data.get('username'),)).fetchone()
    
    if user and check_password_hash(user['password'], data.get('password')):
        return jsonify({"success": True, "token": "admin-jwt-token-lucky", "username": user['username']})
    return jsonify({"error": "Username atau password salah."}), 401

@app.route("/api/admin/dashboard", methods=["GET"])
def admin_dashboard():
    db = get_db()
    bookings = [dict(row) for row in db.execute('SELECT * FROM bookings ORDER BY created_at DESC').fetchall()]
    for b in bookings: b['services'] = json.loads(b['services'])
    
    tx_count = db.execute('SELECT COUNT(*) FROM transactions').fetchone()[0]
    config = dict(db.execute('SELECT min_support as minSupport, min_confidence as minConfidence, new_tx_count as newTransactionsSinceLastTrain FROM config WHERE id = 1').fetchone())
    
    frequent = [dict(row) for row in db.execute('SELECT * FROM frequent_itemsets').fetchall()]
    for f in frequent: f['items'] = json.loads(f['items'])
    
    rules = [dict(row) for row in db.execute('SELECT * FROM association_rules').fetchall()]
    for r in rules:
        r['antecedent'] = json.loads(r['antecedent'])
        r['consequent'] = json.loads(r['consequent'])
        
    return jsonify({
        "bookings": bookings,
        "totalTransactions": tx_count,
        "newTransactionsSinceLastTrain": config['newTransactionsSinceLastTrain'],
        "config": config,
        "frequentItemsets": frequent,
        "associationRules": rules
    })

@app.route("/api/admin/add-transaction", methods=["POST"])
def add_transaction():
    items = request.json.get('items', [])
    db = get_db()
    db.execute('INSERT INTO transactions (items) VALUES (?)', (json.dumps(items),))
    db.execute('UPDATE config SET new_tx_count = new_tx_count + 1 WHERE id = 1')
    db.commit()
    
    config = db.execute('SELECT * FROM config WHERE id = 1').fetchone()
    auto_retrained = False
    if config['new_tx_count'] >= 20:
        run_apriori_pipeline(config['min_support'], config['min_confidence'])
        auto_retrained = True
        
    return jsonify({"success": True, "newTransactionsCount": config['new_tx_count'] if not auto_retrained else 0, "autoRetrained": auto_retrained})

@app.route("/api/admin/train", methods=["POST"])
def trigger_training():
    data = request.json
    db = get_db()
    db.execute('UPDATE config SET min_support = ?, min_confidence = ? WHERE id = 1', (data['minSupport'], data['minConfidence']))
    db.commit()
    fs_count, rules_count = run_apriori_pipeline(data['minSupport'], data['minConfidence'])
    return jsonify({"success": True, "frequentSetsCount": fs_count, "rulesCount": rules_count})

@app.route("/api/admin/upload-csv", methods=["POST"])
def upload_csv():
    data = request.json
    csv_text = data.get('csvText', '')
    transactions = []
    for line in csv_text.splitlines():
        items = [item.strip().replace(" ", "_") for item in line.split(",") if item.strip()]
        if items: transactions.append(items)
        
    db = get_db()
    db.execute('DELETE FROM transactions')
    for tx in transactions:
        db.execute('INSERT INTO transactions (items) VALUES (?)', (json.dumps(tx),))
        
    db.execute('UPDATE config SET min_support = ?, min_confidence = ?, new_tx_count = 0 WHERE id = 1', (data.get('minSupport', 0.1), data.get('minConfidence', 0.3)))
    db.commit()
    
    fs_count, rules_count = run_apriori_pipeline(data.get('minSupport', 0.1), data.get('minConfidence', 0.3))
    return jsonify({"success": True, "transactionsCount": len(transactions), "frequentSetsCount": fs_count, "rulesCount": rules_count})

@app.route("/api/admin/bookings/<booking_id>/status", methods=["PATCH"])
def update_booking_status(booking_id):
    status = request.json.get('status')
    db = get_db()
    booking = dict(db.execute('SELECT * FROM bookings WHERE id = ?', (booking_id,)).fetchone())
    db.execute('UPDATE bookings SET status = ? WHERE id = ?', (status, booking_id))
    
    auto_retrained = False
    if status == 'completed':
        services = json.loads(booking['services'])
        if services:
            db.execute('INSERT INTO transactions (items) VALUES (?)', (json.dumps(services),))
            db.execute('UPDATE config SET new_tx_count = new_tx_count + 1 WHERE id = 1')
            config = db.execute('SELECT * FROM config WHERE id = 1').fetchone()
            if config['new_tx_count'] >= 20:
                run_apriori_pipeline(config['min_support'], config['min_confidence'])
                auto_retrained = True
                
    db.commit()
    booking['status'] = status
    booking['services'] = json.loads(booking['services'])
    return jsonify({"success": True, "booking": booking, "autoRetrained": auto_retrained})

if __name__ == "__main__":
    init_db()
    app.run(port=5000, debug=True)