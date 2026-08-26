import { FrequentItemset, AssociationRule } from './db';

/**
 * Serializes an itemset (array or Set) to a unique sorted comma-separated string
 */
export function setKey(items: string[] | Set<string>): string {
  const arr = Array.isArray(items) ? [...items] : Array.from(items);
  return arr.filter(Boolean).sort().join(',');
}

/**
 * Deserializes a key back into an array of items
 */
export function keySet(key: string): string[] {
  return key.split(',').filter(Boolean);
}

/**
 * Generates all subsets of a given array
 */
function getSubsets<T>(array: T[]): T[][] {
  const result: T[][] = [[]];
  for (const element of array) {
    const length = result.length;
    for (let i = 0; i < length; i++) {
      result.push([...result[i], element]);
    }
  }
  return result;
}

/**
 * Runs the Apriori Algorithm to find Frequent Itemsets
 */
export function runApriori(
  transactions: string[][],
  minSupport: number
): { supportMap: Record<string, number>; countsMap: Record<string, number>; frequentSets: FrequentItemset[] } {
  const nTx = transactions.length;
  const minCount = Math.max(1, Math.ceil(minSupport * nTx));

  const supportMap: Record<string, number> = {};
  const countsMap: Record<string, number> = {};
  const frequentSets: FrequentItemset[] = [];

  // --- Step 1: L1 (Frequent 1-itemsets) ---
  const l1Counts: Record<string, number> = {};
  for (const tx of transactions) {
    const uniqueItems = new Set(tx);
    for (const item of uniqueItems) {
      l1Counts[item] = (l1Counts[item] || 0) + 1;
    }
  }

  // Active frequent itemsets at level k-1 (represented as Set of strings)
  let prevFrequent: Set<string> = new Set();

  for (const [item, count] of Object.entries(l1Counts)) {
    if (count >= minCount) {
      const key = setKey([item]);
      supportMap[key] = count / nTx;
      countsMap[key] = count;
      prevFrequent.add(key);

      frequentSets.push({
        id: Math.random(), // transient or generated
        items: [item],
        support: count / nTx,
        count: count,
        k: 1
      });
    }
  }

  let k = 2;

  // --- Step 2: Lk for k >= 2 ---
  while (prevFrequent.size > 0) {
    // Generate Candidates C_k
    const candidates: Set<string> = new Set();
    const prevList = Array.from(prevFrequent).map(keySet);

    for (let i = 0; i < prevList.length; i++) {
      for (let j = i + 1; j < prevList.length; j++) {
        const a = prevList[i];
        const b = prevList[j];

        // Union of a and b
        const unionSet = new Set([...a, ...b]);
        if (unionSet.size === k) {
          // Check pruning: all subsets of size k-1 must be frequent
          let allSubsetsFrequent = true;
          const unionArray = Array.from(unionSet);

          for (let m = 0; m < unionArray.length; m++) {
            const subset = unionArray.filter((_, idx) => idx !== m);
            const subsetKey = setKey(subset);
            if (!prevFrequent.has(subsetKey)) {
              allSubsetsFrequent = false;
              break;
            }
          }

          if (allSubsetsFrequent) {
            candidates.add(setKey(unionSet));
          }
        }
      }
    }

    if (candidates.size === 0) {
      break;
    }

    // Count support for candidates
    const candidateCounts: Record<string, number> = {};
    for (const key of candidates) {
      candidateCounts[key] = 0;
    }

    const candidateSets = Array.from(candidates).map(k => ({ key: k, set: new Set(keySet(k)) }));

    for (const tx of transactions) {
      const txSet = new Set(tx);
      for (const { key, set } of candidateSets) {
        let matches = true;
        for (const item of set) {
          if (!txSet.has(item)) {
            matches = false;
            break;
          }
        }
        if (matches) {
          candidateCounts[key]++;
        }
      }
    }

    // Filter by minSupport
    const currentFrequent: Set<string> = new Set();
    for (const [key, count] of Object.entries(candidateCounts)) {
      if (count >= minCount) {
        currentFrequent.add(key);
        supportMap[key] = count / nTx;
        countsMap[key] = count;

        frequentSets.push({
          id: Math.random(),
          items: keySet(key),
          support: count / nTx,
          count: count,
          k: k
        });
      }
    }

    prevFrequent = currentFrequent;
    k++;
  }

  return { supportMap, countsMap, frequentSets };
}

/**
 * Generates Association Rules from Frequent Itemsets
 */
export function generateAssociationRules(
  supportMap: Record<string, number>,
  frequentSets: FrequentItemset[],
  minConfidence: number
): AssociationRule[] {
  const rules: AssociationRule[] = [];

  for (const itemset of frequentSets) {
    if (itemset.k < 2) continue;

    const items = itemset.items;
    const parentKey = setKey(items);
    const parentSupport = supportMap[parentKey];
    if (parentSupport === undefined) continue;

    // Get all subsets of items
    const subsets = getSubsets(items);

    for (const subset of subsets) {
      // Antecedent must be non-empty and a proper subset of items
      if (subset.length === 0 || subset.length === items.length) continue;

      const antecedentKey = setKey(subset);
      const antecedentSupport = supportMap[antecedentKey];
      if (antecedentSupport === undefined) continue;

      // Consequent is the complement
      const consequent = items.filter(x => !subset.includes(x));
      const consequentKey = setKey(consequent);
      const consequentSupport = supportMap[consequentKey];
      if (consequentSupport === undefined) continue;

      // Calculate metrics
      const confidence = parentSupport / antecedentSupport;

      if (confidence >= minConfidence) {
        const lift = confidence / consequentSupport;

        rules.push({
          id: Math.random(),
          antecedent: subset.sort(),
          consequent: consequent.sort(),
          support: parentSupport,
          confidence: confidence,
          lift: lift
        });
      }
    }
  }

  // Sort by confidence, then lift, then support (descending)
  rules.sort((a, b) => {
    if (Math.abs(b.confidence - a.confidence) > 1e-9) {
      return b.confidence - a.confidence;
    }
    if (Math.abs(b.lift - a.lift) > 1e-9) {
      return b.lift - a.lift;
    }
    return b.support - a.support;
  });

  return rules;
}
