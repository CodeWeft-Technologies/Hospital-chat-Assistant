// chat_myappointments.js

window.startMyAppointmentChatFlow = function (lang) {
  const chatBox = document.getElementById("chatMessages");
  const inputBox = document.getElementById("chatInput");

  let translations = {};
  let appointmentData = null;
  let selectedAppointmentId = null;
  let step = 0;
  let activeEditField = null;

  // store current language globally
  window.currentLang = lang;

  // ✅ Load translations
  fetch("/static/lang/lang.json")
    .then((res) => res.json())
    .then((all) => {
      translations = all[lang] || all["english"] || {};
      introStep();
    });

  function introStep() {
    chatBox.innerHTML = "";
    appendSystemLine(
      translations["enter_appt_id_or_phone"] ||
        "Please enter your Appointment ID or registered phone number:"
    );
    step = 0;
  }

  // ✅ Flow input handler
  window.handleMyAppointmentInput = function (val) {
    if (!val) return;

    if (step === 0) {
      findAppointment(val);
    } else if (step === 1 && activeEditField === "name") {
      appointmentData.name = val;
      confirmUpdatePreview();
    } else if (step === 2 && activeEditField === "phone") {
      appointmentData.phone = val;
      confirmUpdatePreview();
    } else if (step === 99) {
      if (val.toLowerCase() === "yes") cancelAppointment();
      else showActionCards();
    }
  };

  // 🔎 Find Appointment
  function findAppointment(key) {
    // Allow IDs like "XYZ_123"
    if (key.toUpperCase().startsWith("XYZ_")) {
      key = key.split("_")[1];
    }

    fetch("/appointments/find", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.detail === "not found") {
          appendSystemLine(
            translations["no_appt_found"] || "No appointment found."
          );
          return;
        }
        appointmentData = data;
        selectedAppointmentId = data.id;
        showAppointmentCard();
      });
  }

  // 📄 Show appointment card with dynamic dept/doctor
  function showAppointmentCard() {
    chatBox.innerHTML = "";
    const currentLang = window.currentLang || "en";

    Promise.all([
      fetch("/meta/departments").then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      }),
      fetch("/meta/doctors").then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      }),
    ]).then(([depts, docs]) => {
      const dept = depts.find((d) => d.id === appointmentData.department_id);
      const doc = docs.find((d) => d.id === appointmentData.doctor_id);

      const deptName = dept
        ? dept.name[currentLang] || dept.name["en"]
        : "Unknown Department";
      const docName = doc
        ? doc.name[currentLang] || doc.name["en"]
        : "Unknown Doctor";

      // ✅ Localize fees symbol
      let docFees = "N/A";
      if (doc && doc.fees) {
        if (currentLang === "hindi") docFees = `${doc.fees} रुपये`;
        else if (currentLang === "marathi") docFees = `${doc.fees} रुपये`;
        else docFees = `₹${doc.fees}`;
      }

      // ✅ Format time properly in selected language
      const formattedTime = formatTimeSlot(
        appointmentData.time,
        window.currentLang
      );

      // Create doctor photo URL
      let doctorPhotoHtml = '';
      if (doc && doc.photo) {
        doctorPhotoHtml = `
          <div class="doctor-photo-container">
            <img src="/static/uploads/doctors/${doc.photo}" 
                 alt="${docName}" 
                 class="doctor-photo"
                 onerror="this.style.display='none'">
          </div>
        `;
      }

      const card = document.createElement("div");
      card.className = "appt-card";
      card.innerHTML = `
        <div class="appt-header">
          <div class="appt-icon">📋</div>
          <div class="appt-title">
            <strong>${translations["your_appt_details"] || "Your Appointment Details"}</strong>
          </div>
        </div>
        
        <div class="appt-content">
          <div class="appt-info-grid">
            <div class="appt-info-item">
              <span class="appt-label">${translations["appt_id"] || "Appointment ID"}:</span>
              <span class="appt-value">XYZ_${appointmentData.id}</span>
            </div>
            <div class="appt-info-item">
              <span class="appt-label">${translations["name"] || "Name"}:</span>
              <span class="appt-value">${appointmentData.name}</span>
            </div>
            <div class="appt-info-item">
              <span class="appt-label">${translations["phone"] || "Phone"}:</span>
              <span class="appt-value">${appointmentData.phone}</span>
            </div>
            <div class="appt-info-item">
              <span class="appt-label">${translations["department"] || "Department"}:</span>
              <span class="appt-value">${deptName}</span>
            </div>
            <div class="appt-info-item doctor-info-item">
              <span class="appt-label">${translations["doctor"] || "Doctor"}:</span>
              <span class="appt-value">${docName}</span>
              ${doctorPhotoHtml}
            </div>
            <div class="appt-info-item">
              <span class="appt-label">${translations["date"] || "Date"}:</span>
              <span class="appt-value">${appointmentData.date}</span>
            </div>
            <div class="appt-info-item">
              <span class="appt-label">${translations["time"] || "Time"}:</span>
              <span class="appt-value">${formattedTime}</span>
            </div>
            <div class="appt-info-item">
              <span class="appt-label">${translations["fees"] || "Fees"}:</span>
              <span class="appt-value">${docFees}</span>
            </div>
            <div class="appt-info-item">
              <span class="appt-label">${translations["status"] || "Status"}:</span>
              <span class="appt-value status-${appointmentData.status || 'confirmed'}">${appointmentData.status || "confirmed"}</span>
            </div>
          </div>
        </div>
      `;
      chatBox.appendChild(card);

      appendSystemLine(
        translations["what_you_want"] || "What do you want to do?"
      );
      showActionCards();
    }).catch((error) => {
      console.error("Error loading appointment data:", error);
      appendSystemLine(
        translations["error_loading_appointment"] || "❌ Error loading appointment data. Please refresh the page and try again."
      );
    });
  }

  // 🎛️ Actions
  function showActionCards() {
    const wrap = document.createElement("div");
    wrap.className = "menu";

    // ✅ Check if appointment is within 6 hours
    let allowEdit = true;
    try {
      const apptDateTime = new Date(`${appointmentData.date} ${appointmentData.time}`);
      const now = new Date();
      const diffHours = (apptDateTime - now) / (1000 * 60 * 60); // difference in hours
      if (diffHours < 6) {
        allowEdit = false;
      }
    } catch (err) {
      console.error("Date parse error:", err);
    }

    // Edit Appointment button
    const editCard = createCard(
      translations["edit_appt"] || "Edit Appointment",
      () => showEditableFields(),
      "✏️"
    );
    if (!allowEdit) {
      editCard.classList.add("disabled-card");
      editCard.onclick = () => {
        appendSystemLine(
          translations["edit_not_allowed"] ||
            "⚠️ You cannot edit appointments within 6 hours of scheduled time."
        );
      };
    }
    wrap.appendChild(editCard);

    // Cancel Appointment button (still allowed)
    wrap.appendChild(
      createCard(
        translations["cancel_appt"] || "Cancel Appointment",
        () => askCancel(),
        "❌"
      )
    );

    chatBox.appendChild(wrap);
  }

  // ✏️ Editable fields
  function showEditableFields() {
    chatBox.innerHTML = "";
    appendSystemLine(
      translations["click_field_to_edit"] || "Click a field to edit:"
    );

    const wrap = document.createElement("div");
    wrap.className = "menu";

    // Name & Phone (always user-input)
    wrap.appendChild(
      createCard(
        `${translations["name"] || "Name"}: ${appointmentData.name}`,
        () => editName(),
        "👤"
      )
    );
    wrap.appendChild(
      createCard(
        `${translations["phone"] || "Phone"}: ${appointmentData.phone}`,
        () => editPhone(),
        "📱"
      )
    );

    // Department & Doctor with translations
    Promise.all([
      fetch("/meta/departments").then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      }),
      fetch("/meta/doctors").then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      }),
    ]).then(([depts, docs]) => {
      const dept = depts.find((d) => d.id === appointmentData.department_id);
      const doc = docs.find((d) => d.id === appointmentData.doctor_id);

      const deptName = dept
        ? dept.name[window.currentLang] || dept.name["en"]
        : appointmentData.department_id;
      const docName = doc
        ? doc.name[window.currentLang] || doc.name["en"]
        : appointmentData.doctor_id;

      wrap.appendChild(
        createCard(
          `${translations["department"] || "Department"}: ${deptName}`,
          () => selectDepartment(),
          "🏥"
        )
      );
      wrap.appendChild(
        createCard(
          `${translations["doctor"] || "Doctor"}: ${docName}`,
          () => selectDoctor(),
          "👨‍⚕️"
        )
      );
      wrap.appendChild(
        createCard(
          `${translations["date"] || "Date"}: ${appointmentData.date}`,
          () => selectDate(),
          "📅"
        )
      );
      const formattedTime = formatTimeSlot(appointmentData.time, window.currentLang);

      wrap.appendChild(
        createCard(
          `${translations["time"] || "Time"}: ${formattedTime}`,
          () => selectTime(),
          "⏰"
        )
      );
      chatBox.appendChild(wrap);
    }).catch((error) => {
      console.error("Error loading editable fields data:", error);
      appendSystemLine(
        translations["error_loading_edit_data"] || "❌ Error loading edit data. Please refresh the page and try again."
      );
    });
  }

  function editName() {
    activeEditField = "name";
    appendSystemLine(
      translations["enter_new_name"] || "Enter new full name:"
    );
    step = 1;
  }

  function editPhone() {
    activeEditField = "phone";
    appendSystemLine(
      translations["enter_new_phone"] || "Enter new phone number:"
    );
    step = 2;
  }

  // 📅 Dept → Doctor → Date → Time
  function selectDepartment() {
    fetch("/meta/departments")
      .then((res) => res.json())
      .then((depts) => {
        showOptions(depts, (dept) => {
          appointmentData.department_id = dept.id;
          appointmentData.department = dept.name[lang] || dept.name["en"];
          selectDoctor();
        });
      });
  }

  function selectDoctor() {
    fetch(`/meta/doctors?department_id=${appointmentData.department_id}`)
      .then((res) => res.json())
      .then((docs) => {
        showOptions(
          docs,
          (doc) => {
            appointmentData.doctor_id = doc.id;
            appointmentData.doctor = doc.name[lang] || doc.name["en"];
            selectDate();
          },
          true
        );
      });
  }

  function selectDate() {
    chatBox.innerHTML = "";
    appendSystemLine(translations["select_date"] || "Select a date for your appointment:");
  
    // Ensure doctor_id is set
    if (!appointmentData.doctor_id) {
      appendSystemLine(translations["error_no_doctor"] || "Error: No doctor selected. Please select a doctor first.");
      return;
    }
  
    // Create a container for the datepicker
    const datePickerContainer = document.createElement("div");
    datePickerContainer.id = "datePicker";
    datePickerContainer.style.margin = "10px 0";
    chatBox.appendChild(datePickerContainer);
  
    // Fetch doctor's available days
    fetch(`/meta/doctor_days?doctor_id=${appointmentData.doctor_id}`)
      .then((res) => res.json())
      .then((availableDays) => {
        if (!Array.isArray(availableDays) || availableDays.length === 0) {
          appendSystemLine(translations["no_available_days"] || "No available days for this doctor.");
          return;
        }
  
        // Normalize available days to lowercase for comparison
        const availableDaysLower = availableDays.map(day => day.toLowerCase());
  
        // Initialize jQuery UI Datepicker
        $(datePickerContainer).datepicker({
          minDate: 1, // Prevent selecting today or past dates (relative to Sep 27, 2025)
          dateFormat: "yy-mm-dd", // Format for backend (e.g., 2025-09-28)
          beforeShowDay: function(date) {
            // Get the day of the week (e.g., "monday")
            const day = date.toLocaleString("en-US", { weekday: "long" }).toLowerCase();
            // Enable date if it's in availableDaysLower
            const isAvailable = availableDaysLower.includes(day);
            return [isAvailable, isAvailable ? "" : "ui-state-disabled", isAvailable ? "" : "Unavailable"];
          },
          onSelect: function(dateText) {
            appointmentData.date = dateText; // Store selected date (e.g., "2025-09-28")
            selectTimeSlots(); // Proceed to time slot selection
          }
        });
  
        // Localize the datepicker (optional, for Hindi/Marathi)
        if (window.currentLang === "hindi") {
          $.datepicker.setDefaults($.datepicker.regional["hi"]);
        } else if (window.currentLang === "marathi") {
          // Marathi not natively supported, fallback to English or custom translation
          $.datepicker.setDefaults($.datepicker.regional[""]);
        } else {
          $.datepicker.setDefaults($.datepicker.regional["en"]);
        }
      })
      .catch((error) => {
        console.error("Error fetching doctor days:", error);
        appendSystemLine(translations["error_fetch_days"] || "Error: Unable to fetch available days. Please try again.");
      });
  }
  // 🕒 Format time slot into 12hr & localized
  function formatTimeSlot(slot, lang) {
    if (!slot || typeof slot !== "string" || !/^\d{2}:\d{2}$/.test(slot)) {
      console.warn(`Invalid slot format: ${slot}`);
      return "";
    }
    const [hourStr, minute] = slot.split(":");
    let hour = parseInt(hourStr, 10);
    if (isNaN(hour) || hour < 0 || hour > 23) {
      console.warn(`Invalid hour in slot: ${slot}`);
      return "";
    }
    let period = "AM";

    if (hour >= 12) {
      period = "PM";
      if (hour > 12) hour -= 12;
    }
    if (hour === 0) hour = 12;

    if (lang === "hindi") {
      return period === "AM"
        ? `${hour}:${minute} बजे`
        : `दोपहर ${hour}:${minute} बजे`;
    } else if (lang === "marathi") {
      return period === "AM"
        ? `${hour}:${minute} वाजता`
        : `दुपारी ${hour}:${minute} वाजता`;
    } else {
      return `${hour}:${minute} ${period}`;
    }
  }

  // 🕒 Select time slot
  function selectTimeSlots() {
    fetch(`/meta/slots?doctor_id=${appointmentData.doctor_id}&date=${appointmentData.date}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          appendSystemLine(translations["error_fetch_slots"] || "Error: Unable to fetch available slots. Please try again.");
          selectDate(); // Fallback to date selection
          return;
        }
  
        const slots = data.slots || [];
        if (slots.length === 0) {
          appendSystemLine(translations["no_slots"] || "No slots available for this date. Please choose another date.");
          selectDate();
          return;
        }
  
        appendSystemLine(translations["select_time"] || "Select a time slot:");
        const wrap = document.createElement("div");
        wrap.className = "menu";
  
        slots.forEach((slotObj) => {
          const slotValue = slotObj.value; // e.g., "09:00"
          const slotDisplay = slotObj.display; // e.g., "09:00 AM"
  
          if (typeof slotValue !== "string" || !/^\d{2}:\d{2}$/.test(slotValue)) {
            console.error("Invalid slot format:", slotObj);
            console.warn("Skipping invalid slot:", slotObj);
            return;
          }
  
          const card = document.createElement("div");
          card.className = "menu-card";
          card.textContent = slotDisplay || slotValue;
          card.onclick = () => {
            appointmentData.time = slotValue;
            confirmUpdatePreview();
          };
          wrap.appendChild(card);
        });
  
        chatBox.appendChild(wrap);
      })
      .catch((error) => {
        console.error("Error fetching slots:", error);
        appendSystemLine(translations["error_fetch_slots"] || "Error: Unable to fetch available slots. Please try again.");
        selectDate();
      });
  }
  // ✅ Confirm update
  function confirmUpdatePreview() {
    chatBox.innerHTML = "";

    Promise.all([
      fetch("/meta/departments").then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      }),
      fetch("/meta/doctors").then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      }),
    ]).then(([depts, docs]) => {
      const dept = depts.find((d) => d.id === appointmentData.department_id);
      const doc = docs.find((d) => d.id === appointmentData.doctor_id);

      const deptName = dept
        ? dept.name[window.currentLang] || dept.name["en"]
        : appointmentData.department_id;
      const docName = doc
        ? doc.name[window.currentLang] || doc.name["en"]
        : appointmentData.doctor_id;

      const formattedTime = formatTimeSlot(
        appointmentData.time,
        window.currentLang
      );

      // Create doctor photo URL
      let doctorPhotoHtml = '';
      if (doc && doc.photo) {
        doctorPhotoHtml = `
          <div class="doctor-photo-container">
            <img src="/static/uploads/doctors/${doc.photo}" 
                 alt="${docName}" 
                 class="doctor-photo"
                 onerror="this.style.display='none'">
          </div>
        `;
      }

      const card = document.createElement("div");
      card.className = "appt-card";
      card.innerHTML = `
        <div class="appt-header">
          <div class="appt-icon">📋</div>
          <div class="appt-title">
            <strong>${translations["your_appt_details"] || "Your Appointment Details"}</strong>
          </div>
        </div>
        
        <div class="appt-content">
          <div class="appt-info-grid">
            <div class="appt-info-item">
              <span class="appt-label">${translations["appt_id"] || "Appointment ID"}:</span>
              <span class="appt-value">XYZ_${appointmentData.id}</span>
            </div>
            <div class="appt-info-item">
              <span class="appt-label">${translations["name"] || "Name"}:</span>
              <span class="appt-value">${appointmentData.name}</span>
            </div>
            <div class="appt-info-item">
              <span class="appt-label">${translations["phone"] || "Phone"}:</span>
              <span class="appt-value">${appointmentData.phone}</span>
            </div>
            <div class="appt-info-item">
              <span class="appt-label">${translations["department"] || "Department"}:</span>
              <span class="appt-value">${deptName}</span>
            </div>
            <div class="appt-info-item doctor-info-item">
              <span class="appt-label">${translations["doctor"] || "Doctor"}:</span>
              <span class="appt-value">${docName}</span>
              ${doctorPhotoHtml}
            </div>
            <div class="appt-info-item">
              <span class="appt-label">${translations["date"] || "Date"}:</span>
              <span class="appt-value">${appointmentData.date}</span>
            </div>
            <div class="appt-info-item">
              <span class="appt-label">${translations["time"] || "Time"}:</span>
              <span class="appt-value">${formattedTime}</span>
            </div>
          </div>
        </div>
      `;
      chatBox.appendChild(card);

      appendSystemLine(
        translations["confirm_changes"] || "Confirm changes?"
      );
      const wrap = document.createElement("div");
      wrap.className = "menu";
      wrap.appendChild(createCard("Yes", () => saveUpdatedAppointment(), "✅"));
      wrap.appendChild(createCard("No", () => showEditableFields(), "❌"));
      chatBox.appendChild(wrap);
    }).catch((error) => {
      console.error("Error loading update preview data:", error);
      appendSystemLine(
        translations["error_loading_update_preview"] || "❌ Error loading update preview. Please refresh the page and try again."
      );
    });
  }

  // 💾 Save Update
  function saveUpdatedAppointment() {
    fetch(`/appointments/${selectedAppointmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(appointmentData),
    })
      .then((res) => res.json())
      .then(() => {
        appendSystemLine(
          translations["update_success"] ||
            "✅ Appointment updated successfully!"
        );
        showDownloadSlip(selectedAppointmentId);
      });
  }

  // ❌ Cancel
  function askCancel() {
    appendSystemLine(
      translations["confirm_cancel"] ||
        "Are you sure you want to cancel?"
    );
    const wrap = document.createElement("div");
    wrap.className = "menu";
    wrap.appendChild(createCard("Yes", () => cancelAppointment(), "✅"));
    wrap.appendChild(createCard("No", () => showActionCards(), "❌"));
    chatBox.appendChild(wrap);
    step = 99;
  }

  function cancelAppointment() {
    fetch(`/appointments/${selectedAppointmentId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: true }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "cancelled") {
          appendSystemLine(
            translations["cancel_success"] ||
              "❌ Appointment cancelled successfully."
          );
          chatBox.innerHTML = "";
        } else if (data.detail === "not found") {
          appendSystemLine(
            translations["cancel_failed"] ||
              "⚠️ Appointment not found or already deleted."
          );
        } else {
          appendSystemLine(
            translations["cancel_aborted"] || "⚠️ Cancel aborted."
          );
        }
      })
      .catch((err) => {
        console.error("Cancel error:", err);
        appendSystemLine(
          translations["cancel_failed"] || "⚠️ Failed to cancel appointment."
        );
      });
  }

  // 📥 Download Slip
  function showDownloadSlip(id) {
    const wrap = document.createElement("div");
    wrap.className = "menu";
    wrap.appendChild(
      createCard(
        translations["download_slip"] || "Download Slip",
        () => window.open(`/appointments/${id}/slip`, "_blank"),
        "📄"
      )
    );
    wrap.appendChild(
      createCard(
        translations["main_menu"] || "Back to Main Menu",
        () => (window.location.href = "/chat"),
        "🏠"
      )
    );
    chatBox.appendChild(wrap);

    appendSystemLine(
      translations["go_general"] ||
        "ℹ️ If you have questions, go to main menu and click on General Query."
    );
    appendSystemLine(
      translations["tip"] ||
        "💡 Health Tip: Take short breaks from screens to protect your eyes."
    );
  }

  // Helpers
  function appendSystemLine(text) {
    const div = document.createElement("div");
    div.className = "info-msg";
    div.innerText = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function createCard(title, callback, icon = null) {
    const card = document.createElement("div");
    card.className = "menu-card";
    if (icon) {
      card.innerHTML = `${icon} ${title}`;
    } else {
      card.textContent = title;
    }
    card.onclick = () => callback();
    return card;
  }

  function showOptions(items, callback, isDoctor = false) {
    chatBox.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "menu";
    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "menu-card";
      card.innerHTML = isDoctor
        ? `<strong>${item.name[lang] || item.name["en"]}</strong><br>${item.education}<br>₹${item.fees}`
        : item.name[lang] || item.name["en"];
      card.onclick = () => callback(item);
      wrap.appendChild(card);
    });
    chatBox.appendChild(wrap);
  }
};
