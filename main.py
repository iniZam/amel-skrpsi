import pandas as pd
from mlxtend.preprocessing import TransactionEncoder

# Data Transaksi (list of lists)
data_transaksi = [
    ['Charger', 'hedset', 'tws'],
    ['gurita', 'holder', 'Charger'],
    ['hedset', 'tws'],
    ['Charger', 'hedset', 'gurita', 'tws'],
    ['kabel utp', 'hedset', 'holder']
]

# Inisialisasi dan fit encoder
te = TransactionEncoder()
te_ary = te.fit(data_transaksi).transform(data_transaksi)

# Konversi ke DataFrame
df = pd.DataFrame(te_ary, columns=te.columns_)

print("Data One-Hot Encoded:")
print(df)

from mlxtend.frequent_patterns import apriori

# Menemukan Frequent Itemsets
# min_support = 0.6 berarti itemset harus muncul minimal 60% dari total 5 transaksi (minimal 3 kali)
frequent_itemsets = apriori(df, min_support=0.6, use_colnames=True)

print("\nFrequent Itemsets (min_support = 0.6):")
print(frequent_itemsets)

from mlxtend.frequent_patterns import association_rules

# Menghasilkan aturan asosiasi
# min_threshold = 0.7 berarti confidence minimal harus 70%
rules = association_rules(
    frequent_itemsets, 
    metric="confidence", 
    min_threshold=0.7
)

# Sortir berdasarkan lift untuk melihat aturan paling menarik
rules = rules.sort_values(by="lift", ascending=False)

print("\nAturan Asosiasi (min_confidence = 0.7):")
print(rules)

