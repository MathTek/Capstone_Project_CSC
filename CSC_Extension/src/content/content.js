console.log("🔥 SIMPLE TEST: Content script loaded!");

function getInstaBio() {
  const candidates = [...document.querySelectorAll("header section div, header section span, header section p")]
    .filter(el => el.offsetParent !== null)
    .map(el => el.innerText.trim())
    .filter(txt => txt.length > 20 && !txt.match(/abonnés|followers|following|publications|posts/i));
  const bio = candidates.sort((a, b) => b.length - a.length)[0] || null;
  console.log("Content success: ", bio);
  return bio;
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

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "getBio") {
    waitForBio().then(bio => sendResponse({ bio }));
    console.log("Content script sent bio:");
    return true; // crucial pour réponse async
  }
});
