// ---------------- Language Helpers ----------------
function getSelectedLanguage() {
  return localStorage.getItem("selectedLanguage") || "english";
}

async function loadTranslations() {
  const lang = getSelectedLanguage();
  try {
    const res = await fetch("/static/lang/lang.json");
    const all = await res.json();
    const translations = all[lang] || all["english"];
    window.t = translations;
    window.currentLang = lang;

    // ✅ define global helper
    window.tOr = function (key, fallback) {
      if (window.t && window.t[key]) return window.t[key];
      return fallback;
    };

    return { lang, translations };
  } catch (e) {
    console.error("Error loading translations:", e);
    window.t = {};
    window.tOr = function (_k, fallback) { return fallback; };
    return { lang, translations: {} };
  }
}
window.showMainMenu = function () {
  sessionStorage.removeItem("currentFlow");
  const chatMessages = document.getElementById("chatMessages");
  if (chatMessages) chatMessages.innerHTML = "";
  render();
};

// ---------------- UI helpers ----------------
const el = (id) => document.getElementById(id);
const show = (node) => node && (node.style.display = "");
const hide = (node) => node && (node.style.display = "none");

function titleForFlow(flow) {
  switch (flow) {
    case "booking":       return window.tOr("menu_booking", "Booking Appointment");
    case "myAppointment": return window.tOr("menu_my_appointment", "My Appointment");
    case "general":       return window.tOr("menu_general", "General Query");
    default:              return window.tOr("chat_assistant_title", "Chat Assistant");
  }
}

// ---------------- Header & Menu text ----------------
function updateHeaderAndMenu() {
  if (el("hospitalName")) el("hospitalName").textContent = window.tOr("hospital_name", "XYZ Hospital");
  if (el("chatHeading")) el("chatHeading").textContent = window.tOr("chat_assistant_title", "Assistant Chat Assistant");

  if (el("languageDisplay")) {
    el("languageDisplay").textContent =
      window.tOr("selected_language", "Language:") + " " +
      (window.t.lang_label || window.currentLang || "English");
  }

  if (el("menuBookingTitle")) el("menuBookingTitle").textContent = window.tOr("menu_booking", "Booking Appointment");
  if (el("menuBookingSub"))   el("menuBookingSub").textContent   = window.tOr("menu_booking_sub", "Schedule a new visit");

  if (el("menuMyAppointmentTitle")) el("menuMyAppointmentTitle").textContent = window.tOr("menu_my_appointment", "My Appointment");
  if (el("menuMyAppointmentSub"))   el("menuMyAppointmentSub").textContent   = window.tOr("menu_my_appointment_sub", "Check or edit your booking");

  if (el("menuGeneralTitle")) el("menuGeneralTitle").textContent = window.tOr("menu_general", "General Query");
  if (el("menuGeneralSub"))   el("menuGeneralSub").textContent   = window.tOr("menu_general_sub", "Ask a general question");

  if (el("backBtn"))      el("backBtn").textContent = window.tOr("back_title", "Back");
  if (el("languageBtn"))  el("languageBtn").textContent = "🌐 " + window.tOr("change_language_title", "Language");
}

// ---------------- Chat Shell ----------------
function addMsg(text, who = "bot") {
  const div = document.createElement("div");
  div.className = `msg ${who}`;
  div.innerHTML = text;
  el("chatMessages").appendChild(div);
  el("chatMessages").scrollTop = el("chatMessages").scrollHeight;
}

// ✅ Provide old API for booking/myAppointments/general flows
window.appendSystemLine = function (msg) {
  addMsg(msg, "bot");
};

window.appendUserLine = function (msg) {
  addMsg(msg, "user");
};

// 🔹 Only set placeholder & send button text — no dummy "Starting flow…" messages
function seedFlow() {
  el("chatMessages").innerHTML = "";
  el("chatInput").placeholder = window.tOr("chat_input_placeholder", "Type your message here…");
  el("sendBtn").textContent  = window.tOr("send", "Send");
}

function handleSend() {
  const input = el("chatInput");
  const text = (input.value || "").trim();
  if (!text) return;

  addMsg(text, "user");
  input.value = "";

  const flow = sessionStorage.getItem("currentFlow");

  if (flow === "booking" && window.handleBookingInput) {
    window.handleBookingInput(text);   // forward to booking flow
  } else if (flow === "myAppointment" && window.handleMyAppointmentInput) {
    window.handleMyAppointmentInput(text);   // forward to appointment flow
  } else if (flow === "general" && window.handleGeneralQueryInput) {
    window.handleGeneralQueryInput(text);   // forward to general query flow
  } else {
    // If no flow handler found, fallback
    appendSystemLine(window.tOr("chat_no_flow", "I can only assist with booking, appointments or general queries."));
  }
}

// ---------------- Mode switching ----------------
function render() {
  const flow = sessionStorage.getItem("currentFlow");
  if (flow) {
    hide(el("menuSection"));
    show(el("chatShell"));
    el("chatHeading").textContent = titleForFlow(flow);

    seedFlow();

    // 🔹 Directly start real flows (no intro messages)
    if (flow === "booking" && window.startBookingChatFlow) {
      window.startBookingChatFlow();
    }else if (flow === "myAppointment" && window.startMyAppointmentChatFlow) {
        window.startMyAppointmentChatFlow(window.currentLang || "english");      
    } else if (flow === "general" && window.startGeneralQueryChatFlow) {
      window.startGeneralQueryChatFlow(window.currentLang || "english");
    }

  } else {
    show(el("menuSection"));
    hide(el("chatShell"));
    el("chatHeading").textContent = window.tOr("chat_assistant_title", "Assistant Chat Assistant");
  }
}

// ---------------- Wiring ----------------
function wireMenuAndActions() {
  el("menuBookingCard")?.addEventListener("click", () => {
    sessionStorage.setItem("currentFlow", "booking");
    render();
  });

  el("menuMyAppointmentCard")?.addEventListener("click", () => {
    sessionStorage.setItem("currentFlow", "myAppointment");
    render();
  });

  el("menuGeneralCard")?.addEventListener("click", () => {
    sessionStorage.setItem("currentFlow", "general");
    render();
  });

  // 🔹 Back button clears flow + messages
  // 🔹 Back button dual behavior
el("backBtn")?.addEventListener("click", () => {
  const flow = sessionStorage.getItem("currentFlow");
  if (flow) {
    // Case 1: user is inside a flow → go back to chat main menu
    sessionStorage.removeItem("currentFlow");
    if (el("chatMessages")) el("chatMessages").innerHTML = ""; // clear chat
    render();
  } else {
    // Case 2: user is already on main menu → go back to assistant page
    window.location.href = "/language";  // adjust if your route is different
  }
});

  el("languageBtn")?.addEventListener("click", () => (window.location.href = "/language"));

  el("sendBtn")?.addEventListener("click", handleSend);
  el("chatInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSend();
  });
}

// ---------------- Init ----------------
document.addEventListener("DOMContentLoaded", async () => {
  await loadTranslations();
  updateHeaderAndMenu();
  wireMenuAndActions();

  // 🔹 Auto-start based on route
  const path = window.location.pathname;
  if (path.includes("/booking")) {
    sessionStorage.setItem("currentFlow", "booking");
  } else if (path.includes("/myappointments")) {
    sessionStorage.setItem("currentFlow", "myAppointment");
  } else if (path.includes("/general")) {
    sessionStorage.setItem("currentFlow", "general");
  }

  render();
});
