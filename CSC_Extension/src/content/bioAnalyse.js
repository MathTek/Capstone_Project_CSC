
// === EXTRACTION BIO INSTAGRAM ===
function getInstaBio() {
  console.log("🔍 Extracting Instagram bio...");
  
  // Sélecteurs pour la bio (ordre de priorité)
  const bioSelectors = [
    'header section > div:last-child', // Section principale de la bio
    'header section div[dir="auto"]', // Texte avec direction auto
    'header section span[dir="auto"]', // Span avec direction auto
    'header div[data-testid*="bio"]', // Testid bio
    'header section div:nth-child(3)', // Troisième div de la section
    'header section > div > div > div', // Structure imbriquée
    'header section div',
    'header section span',
    'header section p'
  ];

  for (let selector of bioSelectors) {
    const elements = [...document.querySelectorAll(selector)];
    for (let el of elements) {
      if (el.offsetParent !== null) { // Élément visible
        const text = el.innerText?.trim();
        if (text && text.length > 10 && 
            !text.match(/abonnés|followers|following|publications|posts|^@/i) &&
            !text.match(/^\d+$/)) {
          console.log("✅ Bio found:", text);
          return text;
        }
      }
    }
  }
  
  console.log("❌ No bio found");
  return null;
}

function waitForBio(maxMs = 3000) {
  return new Promise((resolve) => {
    const start = performance.now();
    function check() {
      const bio = getInstaBio();
      if (bio) return resolve(bio);
      if (performance.now() - start > maxMs) return resolve(null);
      requestAnimationFrame(check);
    }
    check();
  });
}

// Export des fonctions pour utilisation dans content.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getInstaBio,
    waitForBio
  };
}
