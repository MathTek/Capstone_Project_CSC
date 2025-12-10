
function waitForPost() {
  return new Promise((resolve) => {
    const checkForPost = () => {
      const postElement = document.querySelector('.post-content'); // Sélecteur fictif
      if (postElement) {
        resolve(postElement.innerText);
      } else {
        setTimeout(checkForPost, 500); // Réessayer après 500ms
      }
    };
    checkForPost();
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "getPost") {
    waitForPost().then(post => sendResponse({ post }));
    console.log("Content script sent post:");
    return true; // crucial pour réponse async
  }
});