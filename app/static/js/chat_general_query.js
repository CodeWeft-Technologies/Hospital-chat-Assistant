(function () {
  async function initGeneralQueryFlow() {
    const msg = window.tOr
      ? window.tOr("type_question", "Please type your question:")
      : "Please type your question:";
    appendBot(msg);
  }

  function appendBot(msg) {
    const chat = document.getElementById("chatMessages");
    if (!chat) return;
    const div = document.createElement("div");
    div.className = "msg bot";
    div.innerHTML = msg;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }

  function appendUser(msg) {
    const chat = document.getElementById("chatMessages");
    if (!chat) return;
    const div = document.createElement("div");
    div.className = "msg user";
    div.textContent = msg;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }

  // --- TIME HELPERS ---
  function formatTimeRange(timeRange) {
    if (!timeRange) return "";
    if (timeRange.includes("-")) {
      const [start, end] = timeRange.split("-");
      return `${formatTime(start && start.trim())} - ${formatTime(end && end.trim())}`;
    }
    return formatTime(timeRange.trim());
  }

  function formatTime(timeStr) {
    if (!timeStr) return "";
    timeStr = timeStr.replace(/\s+/g, "");

    let [h, m] = timeStr.split(":");
    h = parseInt(h, 10);
    m = m ? parseInt(m, 10) : 0;

    if (isNaN(h)) return timeStr; // fallback

    let suffix = "AM";
    let hour = h;
    if (hour >= 12) {
      suffix = "PM";
      if (hour > 12) hour -= 12;
    }
    if (hour === 0) hour = 12;

    const formatted = `${hour}:${m.toString().padStart(2, "0")} ${suffix}`;
    return translateSuffix(formatted);
  }

  function translateSuffix(timeStr) {
    const lang = window.currentLang || "english";
    if (lang === "hindi") {
      return timeStr.replace("AM", "सुबह").replace("PM", "शाम");
    } else if (lang === "marathi") {
      return timeStr.replace("AM", "सकाळी").replace("PM", "संध्याकाळी");
    }
    return timeStr;
  }

  // --- RENDER HELPERS ---
  function renderTimings(opd, emergency, visiting) {
    appendBot(`
      <div class="appt-card">
        <div class="appt-title">🕒 ${window.tOr("hospital_timings")}</div>
        <div class="appt-field"><b>🏥 ${window.tOr("opd")}:</b> ${opd}</div>
        <div class="appt-field"><b>🚑 ${window.tOr("emergency")}:</b> ${emergency}</div>
        <div class="appt-field"><b>👥 ${window.tOr("visiting_hours")}:</b> ${visiting}</div>
      </div>
    `);
  }

  function renderDoctorList(department, doctors, deptFees) {
    let html = `
      <div class="appt-card">
        <div class="appt-title">👨‍⚕️ ${window.tOr("doctors_in")} ${department}</div>
    `;
    doctors.forEach((doc) => {
      html += `
        <div class="appt-field">
          <b>${doc.name}</b><br/>
          🎓 ${doc.qualification || "-"}<br/>
          💼 ${window.tOr("experience")}: ${doc.experience || window.tOr("na")}<br/>
          🕒 ${formatTimeRange(doc.timings)}<br/>
          💰 ${window.tOr("fees")}: ₹${doc.fees || deptFees || "-"}
        </div>`;
    });
    html += `</div>`;
    appendBot(html);
  }

  function renderDepartments(departments) {
    let html = `
      <div class="appt-card">
        <div class="appt-title">🏥 ${window.tOr("departments")}</div>
    `;
    departments.forEach((d) => {
      html += `<div class="appt-field">- ${d}</div>`;
    });
    html += `</div>`;
    appendBot(html);
  }

  function renderServices(services) {
    let html = `
      <div class="appt-card">
        <div class="appt-title">🛠️ ${window.tOr("services")}</div>
    `;
    Object.entries(services).forEach(([k, v]) => {
      html += `<div class="appt-field"><b>${k}:</b> ${v}</div>`;
    });
    html += `</div>`;
    appendBot(html);
  }

  function renderContact(info) {
    let html = `
      <div class="appt-card">
        <div class="appt-title">📞 ${window.tOr("contact_info")}</div>
        <div class="appt-field"><b>🏥 ${window.tOr("hospital_name")}:</b> ${info.name}</div>
        <div class="appt-field"><b>📍 ${window.tOr("address")}:</b> ${info.address}</div>
        <div class="appt-field"><b>📞 ${window.tOr("phone")}:</b> ${info.phone}</div>
        <div class="appt-field"><b>✉️ ${window.tOr("email")}:</b> ${info.email}</div>
        <div class="appt-field"><b>🌐 ${window.tOr("website")}:</b> ${info.website}</div>
      </div>
    `;
    appendBot(html);
  }

  function renderProcess(action, steps) {
    let icon = "✅";
    if (action === "cancel") icon = "❌";
    if (action === "edit") icon = "✏️";

    let html = `
      <div class="appt-card">
        <div class="appt-title">${icon} ${window.tOr("appointment_process")} (${window.tOr(action)})</div>
    `;
    steps.forEach((s, i) => {
      html += `<div class="appt-field">${i + 1}. ${s}</div>`;
    });
    html += `</div>`;
    appendBot(html);
  }

  function renderSymptom(symptom, dept, doctors, fees) {
    let html = `
      <div class="appt-card">
        <div class="appt-title">🤒 ${window.tOr("symptom_match")}</div>
        <div class="appt-field">
          ${window.tOr("your_symptom")}: <b>${symptom}</b><br/>
          👉 ${window.tOr("recommended_department")}: <b>${dept}</b>
        </div>
        <div class="appt-subtitle">${window.tOr("available_doctors")}</div>
    `;
    doctors.forEach((doc) => {
      html += `
        <div class="appt-field">
          <b>${doc.name}</b><br/>
          🎓 ${doc.qualification || "-"}<br/>
          💼 ${window.tOr("experience")}: ${doc.experience || window.tOr("na")}<br/>
          🕒 ${formatTimeRange(doc.timings)}<br/>
          💰 ${window.tOr("fees")}: ₹${doc.fees || fees || "-"}
        </div>`;
    });
    html += `</div>`;
    appendBot(html);
  }

  async function handleGeneralQueryInput(txt) {
    try {
      const res = await fetch("/queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: txt,
          lang: window.currentLang || "english",
        }),
      });

      if (!res.ok) {
        appendBot(window.tOr("error_generic"));
        return;
      }

      const j = await res.json();

      if (j.type === "timings") {
        renderTimings(j.opd, j.emergency, j.visiting);
      } else if (j.type === "doctors") {
        renderDoctorList(j.department, j.doctors, j.fees);
      } else if (j.type === "departments") {
        renderDepartments(j.departments);
      } else if (j.type === "services") {
        renderServices(j.services);
      } else if (j.type === "contact") {
        renderContact(j);
      } else if (j.type === "process") {
        renderProcess(j.action, j.steps);
      } else if (j.type === "symptom") {
        renderSymptom(j.symptom, j.department, j.doctors, j.fees);
      } else if (j.type === "text") {
        appendBot(j.answer);
      } else {
        console.warn("Unhandled response:", j);
        appendBot(window.tOr("no_answer"));
      }
    } catch (err) {
      console.error("Query error:", err);
      appendBot(window.tOr("error_generic"));
    }
  }

  // ✅ Expose globally
  window.startGeneralQueryChatFlow = initGeneralQueryFlow;
  window.handleGeneralQueryInput = handleGeneralQueryInput;
})();
