import "clsx";
import { n as navigation, S as SCREENS } from "../../chunks/navigation.svelte.js";
import { x as attr_class, y as stringify, z as ensure_array_like, F as attributes, G as bind_props, J as clsx } from "../../chunks/index.js";
import { Capacitor } from "@capacitor/core";
import { SQLiteConnection, CapacitorSQLite } from "@capacitor-community/sqlite";
import { e as escape_html } from "../../chunks/context.js";
function html(value) {
  var html2 = String(value);
  var open = "<!---->";
  return open + html2 + "<!---->";
}
function Icon($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { name, $$slots, $$events, ...rest } = $$props;
    let svg = ``;
    $$renderer2.push(`<span${attr_class(`inline-block ${stringify(rest.class ?? "")}`)} role="img" aria-hidden="true">${html(svg)}</span>`);
  });
}
new SQLiteConnection(CapacitorSQLite);
function DashboardScreen($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let isNative = Capacitor.isNativePlatform();
    let notes = [];
    $$renderer2.push(`<div class="p-4"><div class="mb-6 flex items-center justify-between"><h1 class="text-2xl font-bold">Dashboard - Notes CRUD Test</h1> `);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<button class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">+ New Note</button>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    if (!isNative) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="rounded border border-yellow-400 bg-yellow-100 px-4 py-3 text-yellow-700"><p class="font-bold">Native Platform Required</p> <p class="mt-1 text-sm">SQLite only works on Android/iOS.</p></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
      if (notes.length === 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<p class="text-center text-gray-400">No notes yet. Create one to get started!</p>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div class="space-y-4"><!--[-->`);
        const each_array = ensure_array_like(notes);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let note = each_array[$$index];
          $$renderer2.push(`<div class="rounded-lg bg-grey-900 p-4"><div class="mb-2 flex items-start justify-between"><h3 class="text-lg font-semibold">${escape_html(note.title)}</h3> <div class="flex gap-2"><button class="text-sm text-blue-400 hover:text-blue-300">Edit</button> <button class="text-sm text-red-400 hover:text-red-300">Delete</button></div></div> <p class="mb-2 whitespace-pre-wrap text-gray-300">${escape_html(note.content)}</p> <p class="text-xs text-gray-500">${escape_html(new Date(note.createdAt).toLocaleString())}</p></div>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function SettingsScreen($$renderer) {
  $$renderer.push(`<div class="p-4"><h1 class="text-2xl font-bold mb-4">Settings</h1> <p class="text-gray-400">Settings screen placeholder</p></div>`);
}
function MembersScreen($$renderer) {
  $$renderer.push(`<div class="p-4"><h1 class="text-2xl font-bold mb-4">Members</h1> <p class="text-gray-400">Members screen placeholder</p></div>`);
}
function InputLabel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      text = "Label text",
      invalid = false,
      disabled = false,
      optional = false,
      optional_text = "(optional)",
      required = false,
      required_text = "*",
      $$slots,
      $$events,
      ...rest
    } = $$props;
    $$renderer2.push(`<label${attributes({
      ...rest,
      class: ` block leading-none transition-all select-none ${stringify(rest.class ?? "")} ${stringify(disabled ? "opacity-60" : "")} ${stringify(invalid ? "text-danger-600" : "")} `
    })}>${escape_html(text)} `);
    if (optional) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`${escape_html(optional_text)}`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (required) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`${escape_html(required_text)}`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></label>`);
  });
}
function InputValidation($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      text,
      disabled = false,
      invalid = false,
      $$slots,
      $$events,
      ...rest
    } = $$props;
    if (text) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div${attributes({
        ...rest,
        class: `${stringify(invalid ? "text-danger-600" : disabled ? "opacity-60" : "")} text-right text-sm ${stringify(rest.class)}`
      })}>${escape_html(text)}</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { disabled, invalid });
  });
}
function InputText($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      type = "text",
      name = "text",
      placeholder = "Placeholder text",
      value = void 0,
      invalid = false,
      disabled = false,
      input = void 0,
      focus_on_load = false,
      autofocus,
      $$slots,
      $$events,
      ...rest
    } = $$props;
    $$renderer2.push(`<input${attributes(
      {
        type,
        name,
        value,
        placeholder,
        disabled,
        ...rest,
        class: ` w-full rounded-lg px-3 py-1.5 placeholder-grey-300 ring ring-grey-400 outline-0 transition-all duration-300 focus:ring-2 focus:ring-primary-700 focus:outline-0 ${stringify(disabled ? "cursor-not-allowed opacity-60" : "")} ${stringify(invalid ? "ring-danger-600! focus:ring-danger-600!" : "")} ${stringify(rest.class)} `
      },
      void 0,
      void 0,
      void 0,
      4
    )}/>`);
    bind_props($$props, { value, input });
  });
}
function BudgetsScreen($$renderer) {
  $$renderer.push(`<div class="space-y-4 p-4"><div class="space-y-1">`);
  InputLabel($$renderer, { for: "input-example", text: "Example Input" });
  $$renderer.push(`<!----> `);
  InputText($$renderer, {
    id: "input-example",
    placeholder: "Enter some text...",
    focus_on_load: true
  });
  $$renderer.push(`<!----></div> <div class="space-y-1">`);
  InputLabel($$renderer, {
    for: "input-example",
    text: "Example Input",
    required: true,
    invalid: true
  });
  $$renderer.push(`<!----> `);
  InputText($$renderer, {
    id: "input-example",
    placeholder: "Enter some text...",
    required: true,
    invalid: true
  });
  $$renderer.push(`<!----> `);
  InputValidation($$renderer, { text: "This field is required.", invalid: true });
  $$renderer.push(`<!----></div></div>`);
}
const size_classes = {
  small: ["py-1", "px-1.5"].join(" "),
  medium: ["py-2", "px-3.5"].join(" "),
  large: ["py-3", "px-6"].join(" ")
};
const button_round_size_classes = {
  small: ["p-1"].join(" "),
  medium: ["p-2"].join(" "),
  large: ["p-3"].join(" ")
};
const color_classes = {
  primary: ["bg-primary-600", "active:bg-primary-700", "disabled:active:bg-primary-600"].join(" "),
  secondary: [
    "bg-secondary-700",
    "active:bg-secondary-800",
    "disabled:active:bg-secondary-700"
  ].join(" "),
  tertiary: ["bg-transparent", "active:bg-secondary-700", "disabled:active:bg-transparent"].join(
    " "
  ),
  danger: ["bg-danger-600", "active:bg-danger-700", "disabled:active:bg-danger-600"].join(" ")
};
function Button($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      disabled = false,
      title = "",
      size = "medium",
      color = "primary",
      children,
      $$slots,
      $$events,
      ...rest
    } = $$props;
    $$renderer2.push(`<button${attributes({
      type: "button",
      ...rest,
      disabled,
      title,
      class: clsx([
        "flex flex-nowrap items-center justify-center gap-2 rounded-full transition-colors duration-300 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
        size_classes[size],
        color_classes[color],
        rest.class || ""
      ])
    })}>`);
    children($$renderer2);
    $$renderer2.push(`<!----></button>`);
    bind_props($$props, { disabled });
  });
}
function ButtonRound($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      disabled = false,
      title = "",
      size = "large",
      color = "primary",
      children,
      $$slots,
      $$events,
      ...rest
    } = $$props;
    $$renderer2.push(`<button${attributes({
      type: "button",
      ...rest,
      disabled,
      title,
      class: clsx([
        "flex aspect-square flex-nowrap items-center justify-center rounded-full transition-colors duration-300 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
        button_round_size_classes[size],
        color_classes[color],
        rest.class || ""
      ])
    })}>`);
    children($$renderer2);
    $$renderer2.push(`<!----></button>`);
    bind_props($$props, { disabled });
  });
}
function ButtonQuick($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      disabled = false,
      title = "",
      size = "large",
      color = "secondary",
      active = false,
      $$slots,
      $$events,
      ...rest
    } = $$props;
    $$renderer2.push(`<button${attributes({
      type: "button",
      ...rest,
      disabled,
      title,
      class: clsx([
        "relative h-9 rounded-t-full px-9 py-4 transition-colors duration-300 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
        color_classes[color],
        rest.class || ""
      ])
    })}>`);
    Icon($$renderer2, {
      name: "plus",
      class: `absolute top-1/2 left-1/2 size-6 -translate-x-1/2 -translate-y-1/2 transform transition-all duration-300 ${stringify(active ? "rotate-135" : "")}`
    });
    $$renderer2.push(`<!----></button>`);
    bind_props($$props, { disabled, active });
  });
}
function FAB($$renderer, $$props) {
  let { children } = $$props;
  let is_active = false;
  $$renderer.push(`<div class="flex flex-col items-center justify-center gap-2">`);
  if (is_active) {
    $$renderer.push("<!--[-->");
    $$renderer.push(`<div class="flex w-screen flex-col items-center justify-center gap-2">`);
    children($$renderer);
    $$renderer.push(`<!----></div>`);
  } else {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]--> `);
  ButtonQuick($$renderer, {
    color: "secondary",
    active: is_active,
    onclick: () => is_active = !is_active
  });
  $$renderer.push(`<!----></div>`);
}
function TransactionsScreen($$renderer) {
  $$renderer.push(`<div class="relative space-y-4 p-4"><h1 class="mb-4 text-2xl font-bold">Transaction</h1> <p class="text-gray-400">Transaction screen placeholder</p> <h2 class="mt-6 mb-4 text-xl font-semibold">Buttons</h2> `);
  Button($$renderer, {
    size: "small",
    color: "primary",
    children: ($$renderer2) => {
      $$renderer2.push(`<!---->Small Primary Button`);
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> `);
  Button($$renderer, {
    size: "small",
    color: "secondary",
    children: ($$renderer2) => {
      $$renderer2.push(`<!---->Small Secondary Button`);
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> `);
  Button($$renderer, {
    size: "small",
    color: "tertiary",
    children: ($$renderer2) => {
      $$renderer2.push(`<!---->Small Tertiary Button`);
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> `);
  Button($$renderer, {
    size: "small",
    color: "danger",
    children: ($$renderer2) => {
      $$renderer2.push(`<!---->Small Danger Button`);
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> `);
  Button($$renderer, {
    size: "medium",
    color: "primary",
    children: ($$renderer2) => {
      $$renderer2.push(`<!---->Medium Primary Button`);
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> `);
  Button($$renderer, {
    size: "medium",
    color: "secondary",
    children: ($$renderer2) => {
      $$renderer2.push(`<!---->Medium Secondary Button`);
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> `);
  Button($$renderer, {
    size: "medium",
    color: "tertiary",
    children: ($$renderer2) => {
      $$renderer2.push(`<!---->Medium Tertiary Button`);
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> `);
  Button($$renderer, {
    size: "medium",
    color: "danger",
    children: ($$renderer2) => {
      $$renderer2.push(`<!---->Medium Danger Button`);
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> `);
  Button($$renderer, {
    size: "large",
    color: "primary",
    children: ($$renderer2) => {
      $$renderer2.push(`<!---->Large Primary Button`);
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> `);
  Button($$renderer, {
    size: "large",
    color: "secondary",
    children: ($$renderer2) => {
      $$renderer2.push(`<!---->Large Secondary Button`);
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> `);
  Button($$renderer, {
    size: "large",
    color: "tertiary",
    children: ($$renderer2) => {
      $$renderer2.push(`<!---->Large Tertiary Button`);
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> `);
  Button($$renderer, {
    size: "large",
    color: "danger",
    disabled: true,
    children: ($$renderer2) => {
      $$renderer2.push(`<!---->Large Danger Button`);
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> <h2 class="mt-6 mb-4 text-xl font-semibold">Round Buttons</h2> `);
  ButtonRound($$renderer, {
    size: "small",
    color: "primary",
    children: ($$renderer2) => {
      Icon($$renderer2, { name: "plus", class: "size-4" });
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> `);
  ButtonRound($$renderer, {
    size: "small",
    color: "secondary",
    children: ($$renderer2) => {
      Icon($$renderer2, { name: "arrow-left", class: "size-4" });
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> `);
  ButtonRound($$renderer, {
    size: "small",
    color: "tertiary",
    children: ($$renderer2) => {
      Icon($$renderer2, { name: "xmark", class: "size-4" });
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> `);
  ButtonRound($$renderer, {
    size: "small",
    color: "danger",
    children: ($$renderer2) => {
      Icon($$renderer2, { name: "trash", class: "size-4" });
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> `);
  ButtonRound($$renderer, {
    size: "medium",
    color: "primary",
    children: ($$renderer2) => {
      Icon($$renderer2, { name: "plus", class: "size-4" });
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> `);
  ButtonRound($$renderer, {
    size: "medium",
    color: "secondary",
    children: ($$renderer2) => {
      Icon($$renderer2, { name: "arrow-left", class: "size-4" });
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> `);
  ButtonRound($$renderer, {
    size: "medium",
    color: "tertiary",
    children: ($$renderer2) => {
      Icon($$renderer2, { name: "xmark", class: "size-4" });
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> `);
  ButtonRound($$renderer, {
    size: "medium",
    color: "danger",
    children: ($$renderer2) => {
      Icon($$renderer2, { name: "trash", class: "size-4" });
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> `);
  ButtonRound($$renderer, {
    size: "large",
    color: "primary",
    children: ($$renderer2) => {
      Icon($$renderer2, { name: "plus", class: "size-4" });
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> `);
  ButtonRound($$renderer, {
    size: "large",
    color: "secondary",
    children: ($$renderer2) => {
      Icon($$renderer2, { name: "arrow-left", class: "size-4" });
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> `);
  ButtonRound($$renderer, {
    size: "large",
    color: "tertiary",
    children: ($$renderer2) => {
      Icon($$renderer2, { name: "xmark", class: "size-4" });
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> `);
  ButtonRound($$renderer, {
    size: "large",
    color: "danger",
    disabled: true,
    children: ($$renderer2) => {
      Icon($$renderer2, { name: "trash", class: "size-4" });
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> <div class="absolute bottom-0 left-1/2 -translate-x-1/2 transform">`);
  FAB($$renderer, {
    children: ($$renderer2) => {
      Button($$renderer2, {
        color: "primary",
        children: ($$renderer3) => {
          Icon($$renderer3, { name: "arrows-up-down", class: "size-6" });
          $$renderer3.push(`<!----> Add Variable Expense`);
        },
        $$slots: { default: true }
      });
      $$renderer2.push(`<!----> `);
      Button($$renderer2, {
        color: "primary",
        children: ($$renderer3) => {
          Icon($$renderer3, { name: "exclamation-triangle", class: "size-6" });
          $$renderer3.push(`<!----> Add Incidental Expense`);
        },
        $$slots: { default: true }
      });
      $$renderer2.push(`<!---->`);
    }
  });
  $$renderer.push(`<!----></div></div>`);
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    if (navigation.current_screen === SCREENS.DASHBOARD) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div>`);
      DashboardScreen($$renderer2);
      $$renderer2.push(`<!----></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (navigation.current_screen === SCREENS.SETTINGS) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div>`);
        SettingsScreen($$renderer2);
        $$renderer2.push(`<!----></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        if (navigation.current_screen === SCREENS.MEMBERS) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div>`);
          MembersScreen($$renderer2);
          $$renderer2.push(`<!----></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
          if (navigation.current_screen === SCREENS.BUDGETS) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<div>`);
            BudgetsScreen($$renderer2);
            $$renderer2.push(`<!----></div>`);
          } else {
            $$renderer2.push("<!--[!-->");
            if (navigation.current_screen === SCREENS.TRANSACTIONS) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<div>`);
              TransactionsScreen($$renderer2);
              $$renderer2.push(`<!----></div>`);
            } else {
              $$renderer2.push("<!--[!-->");
              $$renderer2.push(`<div>`);
              DashboardScreen($$renderer2);
              $$renderer2.push(`<!----></div>`);
            }
            $$renderer2.push(`<!--]-->`);
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
