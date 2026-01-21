export function detectPII(text, source) {
  const piiPatterns = [
    { type: "credit_card", pattern: /\b(?:\d[ -]*?){13,19}\b/g },
    { type: "phone", pattern: /\b\+(?:33|32)[\s.-]?[1-9](?:[\s.-]?\d{2}){4}\b|\+262[\s.-]?\d{3}(?:[\s.-]?\d{2}){3}\b/g },
    { type: "email", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  ];

  const results = [];
  const detectedValues = new Set();

  for (const { type, pattern } of piiPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const value of matches) {
        if (!detectedValues.has(value)) {
          results.push({ type, value, source });
          detectedValues.add(value);
        }
      }
    }
  }

  if (results.length === 0) {
    console.log("✅ No PII detected");
  }

  return results;
}
