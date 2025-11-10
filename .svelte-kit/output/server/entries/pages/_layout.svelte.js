import "clsx";
import { n as navigation, S as SCREENS } from "../../chunks/navigation.svelte.js";
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { children } = $$props;
    let show_layout = navigation.current_screen !== SCREENS.CREATE_HOUSEHOLD;
    if (show_layout) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="flex h-screen flex-col"><header class="flex items-center gap-4 p-4"><button class="text-2xl">☰</button> <div class="font-bold">Budget Tracker</div></header> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <main class="flex-1 overflow-y-auto p-4">`);
      children($$renderer2);
      $$renderer2.push(`<!----></main></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      children($$renderer2);
      $$renderer2.push(`<!---->`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _layout as default
};
