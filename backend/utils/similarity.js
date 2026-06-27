// utils/similarity.js
const jaccardSimilarity = (setA = [], setB = []) => {
  if (!setA.length && !setB.length) return 0;
  const a = new Set(setA.map((s) => s.toLowerCase().trim()));
  const b = new Set(setB.map((s) => s.toLowerCase().trim()));
  let intersectionSize = 0;
  for (const item of a) {
    if (b.has(item)) intersectionSize += 1;
  }
  const unionSize = a.size + b.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
};

module.exports = { jaccardSimilarity };