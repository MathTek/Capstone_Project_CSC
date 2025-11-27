// @ts-ignore: missing type declarations for .svelte files
import Popup from "./popup/Popup.svelte";

const app = new Popup({
  target: document.getElementById("app")
});
export default app;
