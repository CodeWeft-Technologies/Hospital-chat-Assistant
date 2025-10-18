(function () {
  const exports = {}; 

  // Helper: convert digits to Devanagari
  function toDevanagari(numStr) {
    const map = { '0': '०','1': '१','2': '२','3': '३','4': '४','5': '५','6': '६','7': '७','8': '८','9': '९' };
    return numStr.toString().split("").map(ch => map[ch] || ch).join("");
  }

  // --- Main Booking Flow Steps ---
  exports.handleStep = async function () {
    window.stopRecognition();
    const lang = window.currentLang || "english";

    switch (window.voiceFlowState.bookingStep) {
      case 0: // Ask for name
        window.appendVoiceMessage(window.tOr("booking_ask_name", "Please tell your full name:"));
        window.speakBotMessage(window.tOr("booking_ask_name", "Please tell your full name:"), () => window.startRecognition());
        break;

      case 1: // Ask for phone
        const name = window.voiceFlowState.bookingData.name;
        window.appendVoiceMessage(window.tOr("booking_ask_phone", `Okay ${name}, please tell your 10-digit phone number:`));
        window.speakBotMessage(window.tOr("booking_ask_phone", `Okay ${name}, please tell your 10-digit phone number:`), () => window.startRecognition());
        break;

      case 2: // Departments
        try {
          const res = await fetch("/meta/departments");
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          const departments = await res.json();
          if (!Array.isArray(departments)) {
            console.error("Departments response is not an array:", departments);
            throw new Error("Invalid departments data format");
          }
          if (departments && departments.length > 0) {
            window.voiceFlowState.bookingData.departments = departments;
            const deptNames = departments.map(d => window.tOr(d.name_key || d.name.en, d.name.en));
            const deptCards = deptNames.map(n => `<div class="option-card">${n}</div>`).join("");
            window.appendVoiceMessage(`<div class="option-list">${deptCards}</div>`);
            window.speakBotMessage(window.tOr("voice_available_departments_speak", `Available departments are: ${deptNames.join(", ")}`), () => window.startRecognition());
          }
        } catch (e) {
          console.error("Error fetching departments", e);
        }
        break;

      case 3: // Doctors
        try {
          const res = await fetch(`/meta/doctors?department_id=${window.voiceFlowState.bookingData.department_id}`);
          const doctors = await res.json();
          if (doctors && doctors.length > 0) {
            window.voiceFlowState.bookingData.doctors = doctors;
            const doctorNames = doctors.map(d => window.tOr(d.name_key || d.name.en, d.name.en));
            const doctorCards = doctorNames.map(n => `<div class="option-card">${n}</div>`).join("");
            window.appendVoiceMessage(`<div class="option-list">${doctorCards}</div>`);
            window.speakBotMessage(window.tOr("voice_available_doctors_speak", `Available doctors: ${doctorNames.join(", ")}`), () => window.startRecognition());
          }
        } catch (e) {
          console.error("Error fetching doctors", e);
        }
        break;

      case 4: // Dates
        try {
          const res = await fetch(`/meta/doctor_days?doctor_id=${window.voiceFlowState.bookingData.doctor_id}`);
          const availableDays = await res.json();
          if (availableDays && availableDays.length > 0) {
            window.voiceFlowState.bookingData.availableDays = availableDays;
            const formattedDates = availableDays.map(dateStr => {
              const date = new Date(dateStr + "T00:00:00");
              let formatted = date.toLocaleDateString(
                lang === "english" ? "en-IN" : (lang === "hindi" ? "hi-IN" : "mr-IN"),
                { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
              );
              if (lang !== "english") formatted = toDevanagari(formatted);
              return formatted;
            });
            const dateCards = formattedDates.map(d => `<div class="option-card">${d}</div>`).join("");
            window.appendVoiceMessage(`<div class="option-list">${dateCards}</div>`);
            window.speakBotMessage(window.tOr("voice_available_dates_speak", `Available dates are: ${formattedDates.join(", ")}`), () => window.startRecognition());
          }
        } catch (e) {
          console.error("Error fetching days", e);
        }
        break;

      case 5: // Slots
        try {
          const res = await fetch(`/meta/slots?doctor_id=${window.voiceFlowState.bookingData.doctor_id}&date=${window.voiceFlowState.bookingData.date}`);
          const slots = await res.json();
          if (slots && slots.length > 0) {
            window.voiceFlowState.bookingData.availableSlots = slots;
            const formattedSlots = slots.map(slot => {
              const [h, m] = slot.split(":").map(Number);
              const period = h < 12 ? "AM" : "PM";
              const hour12 = h % 12 === 0 ? 12 : h % 12;
              let formatted = `${hour12}:${m < 10 ? "0" : ""}${m} ${period}`;
              if (lang !== "english") formatted = toDevanagari(formatted.replace("AM","पूर्वाह्न").replace("PM","अपराह्न"));
              return formatted;
            });
            const slotCards = formattedSlots.map(s => `<div class="option-card">${s}</div>`).join("");
            window.appendVoiceMessage(`<div class="option-list">${slotCards}</div>`);
            window.speakBotMessage(window.tOr("voice_available_time_slots_speak", `Available slots: ${formattedSlots.join(", ")}`), () => window.startRecognition());
          }
        } catch (e) {
          console.error("Error fetching slots", e);
        }
        break;

      case 6: // Confirmation
        const info = window.voiceFlowState.bookingData;
        const confirmCard = `
          <div class="confirm-card">
            <h3>${window.tOr("booking_confirm_title", "Confirm Appointment Details")}</h3>
            <p><strong>${window.tOr("name","Name")}:</strong> ${info.name}</p>
            <p><strong>${window.tOr("phone","Phone")}:</strong> ${lang !== "english" ? toDevanagari(info.phone) : info.phone}</p>
            <p><strong>${window.tOr("department","Department")}:</strong> ${info.department}</p>
            <p><strong>${window.tOr("doctor","Doctor")}:</strong> ${info.doctor}</p>
            <p><strong>${window.tOr("date","Date")}:</strong> ${info.date}</p>
            <p><strong>${window.tOr("time","Time")}:</strong> ${info.time}</p>
            <p class="confirm-note">${window.tOr("booking_confirm_note","Do you want to book this appointment? Say Yes or No.")}</p>
          </div>`;
        window.appendVoiceMessage(confirmCard);
        window.speakBotMessage(window.tOr("booking_confirm_speak",
          `Please confirm: Appointment with ${info.doctor} in ${info.department} on ${info.date} at ${info.time}. Say Yes or No.`), 
          () => window.startRecognition());
        break;

      case 7: // Success
        const successCard = `
          <div class="success-card">
            <h3>${window.tOr("booking_success","✅ Appointment Confirmed!")}</h3>
            <p>${window.tOr("booking_success_msg","Your booking has been successfully confirmed.")}</p>
          </div>`;
        window.appendVoiceMessage(successCard);
        window.speakBotMessage(window.tOr("booking_success_msg","Your booking has been successfully confirmed."), () => {});
        break;
    }
  };

  // --- NEW: Process User Input ---
  exports.processInput = function (text) {
    const step = window.voiceFlowState.bookingStep;
    if (!text) return;

    switch (step) {
      case 0: // Name
        window.voiceFlowState.bookingData.name = text;
        window.voiceFlowState.bookingStep = 1;
        exports.handleStep();
        break;

      case 1: // Phone
        const digits = text.replace(/\D/g, "");
        if (digits.length === 10) {
          window.voiceFlowState.bookingData.phone = digits;
          window.voiceFlowState.bookingStep = 2;
          exports.handleStep();
        } else {
          window.appendVoiceMessage("Invalid phone, please say again.");
          window.speakBotMessage("Invalid phone number, please repeat.", () => window.startRecognition());
        }
        break;

      case 2: // Department
        window.voiceFlowState.bookingData.department = text;
        window.voiceFlowState.bookingStep = 3;
        exports.handleStep();
        break;

      case 3: // Doctor
        window.voiceFlowState.bookingData.doctor = text;
        window.voiceFlowState.bookingStep = 4;
        exports.handleStep();
        break;

      case 4: // Date
        window.voiceFlowState.bookingData.date = text;
        window.voiceFlowState.bookingStep = 5;
        exports.handleStep();
        break;

      case 5: // Time
        window.voiceFlowState.bookingData.time = text;
        window.voiceFlowState.bookingStep = 6;
        exports.handleStep();
        break;

      case 6: // Confirmation
        if (/yes|haan|ho/i.test(text)) {
          window.voiceFlowState.bookingStep = 7;
          exports.handleStep();
        } else {
          window.appendVoiceMessage("Booking cancelled.");
          window.speakBotMessage("Okay, booking cancelled.", () => {});
        }
        break;
    }
  };

  window.VoiceBookingFlow = exports;
})();
