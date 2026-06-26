// utils/similarity.js
// Jaccard similarity: measures overlap between two sets of strings.
// Formula: |A ∩ B| / |A ∪ B|
// Example: A = ["React","Python","IoT"], B = ["Python","IoT","Java"]
//          intersection = {Python, IoT} -> size 2
//          union = {React, Python, IoT, Java} -> size 4
//          similarity = 2/4 = 0.5

// Normalizes strings for comparison: lowercase + trim, so "Machine Learning"
// and "machine learning " are treated as the same tag.
const normalize = (arr = []) => arr.map((s) => s.trim().toLowerCase()).filter(Boolean);

const jaccardSimilarity = (setA = [], setB = []) => {
  const a = new Set(normalize(setA));
  const b = new Set(normalize(setB));

  if (a.size === 0 || b.size === 0) return 0;

  let intersectionSize = 0;
  for (const item of a) {
    if (b.has(item)) intersectionSize++;
  }

  const unionSize = a.size + b.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
};

module.exports = { jaccardSimilarity, normalize };