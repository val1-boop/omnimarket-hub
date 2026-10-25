// Modo claro u oscuro. La elección se guarda solo en este navegador (localStorage);
// si la persona nunca eligió, se usa el modo de su celular o computadora.
export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "omnimarket-tema";

/**
 * Se ejecuta en <head> antes de que se pinte la página, para que no se vea un destello
 * del modo equivocado al cargar.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}})();`;
