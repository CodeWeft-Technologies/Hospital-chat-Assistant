(function () {
  let bookingData = {};
  let currentStep = 0;

  function resolveLangKey() {
    const map = { english: "en", hindi: "hi", marathi: "mr" };
    return map[window.currentLang] || "en";
  }
  
  function saveState() {
    // Store current flow type along with step and data
    localStorage.setItem("bookingFlow", JSON.stringify({ step: currentStep, data: bookingData, currentFlow: window.currentFlow }));
  }
  function clearState() {
    localStorage.removeItem("bookingFlow");
  }

  function askName() {
    window.appendSystemLine(window.tOr("booking_ask_name", "Please enter your full name:"));
    currentStep = 1; saveState();
    // Ensure regular chat input is visible
    document.getElementById("chatInput").classList.remove("hidden");
    document.getElementById("sendBtn").classList.remove("hidden");
    document.getElementById("appointmentDatePicker").classList.add("hidden");
  }
  function validateName(name) {
    return /^[\u0900-\u097Fa-zA-Z.\s]+$/.test(name.trim());
  }

  function askPhone() {
    window.appendSystemLine(window.tOr("booking_ask_phone", "Please enter your 10-digit phone number:"));
    currentStep = 2; saveState();
    // Ensure regular chat input is visible
    document.getElementById("chatInput").classList.remove("hidden");
    document.getElementById("sendBtn").classList.remove("hidden");
    document.getElementById("appointmentDatePicker").classList.add("hidden");
  }
  function validatePhone(phone) {
    const numOnly = phone.replace(/[०-९]/g, d => "०१२३४५६७८९".indexOf(d)).replace(/\D/g, "");
    return /^\d{10}$/.test(numOnly);
  }

  function showDepartments() {
    const chatInputCard = document.querySelector(".chat-input-card");
    if (chatInputCard) chatInputCard.classList.add("hidden"); // Hide input card for menu selection

    window.appendSystemLine(window.tOr("booking_select_department", "Please select a department:"));
    currentStep = 3; saveState();

    fetch("/meta/departments")
      .then(res => res.json())
      .then(departments => {
        let deptCards = document.createElement("div");
        deptCards.className = "menu-cards"; // Reuse menu-cards style for department selection
        departments.forEach(dept => {
          let card = document.createElement("div");
          card.className = "menu-card";
          card.textContent = dept.name[resolveLangKey()] || dept.name.en;
          card.addEventListener("click", () => {
            bookingData.department_id = dept.id;
            bookingData.department_name = dept.name[resolveLangKey()] || dept.name.en;
            window.appendUserLine(bookingData.department_name);
            saveState();
            showDoctors();
            if (chatInputCard) chatInputCard.classList.remove("hidden"); // Show input card again after selection
          });
          deptCards.appendChild(card);
        });
        document.getElementById("chatMessages").appendChild(deptCards);
        // Scroll to the bottom to show new department cards
        document.getElementById("chatMessages").scrollTop = document.getElementById("chatMessages").scrollHeight;
      })
      .catch(error => {
          console.error("Error fetching departments:", error);
          window.appendSystemLine(window.tOr("booking_failed_load_departments", "Failed to load departments. Please try again."));
          if (chatInputCard) chatInputCard.classList.remove("hidden"); // Show input card back on error
      });
  }

  function showDoctors() {
    if (!bookingData.department_id) { 
      window.appendSystemLine(window.tOr("booking_no_department_selected", "Please select a department first.")); 
      showDepartments(); 
      return; 
    }

    const chatInputCard = document.querySelector(".chat-input-card");
    if (chatInputCard) chatInputCard.classList.add("hidden"); // Hide input card for menu selection

    window.appendSystemLine(window.tOr("booking_select_doctor", "Please select a doctor:"));
    currentStep = 4; saveState();

    fetch(`/meta/doctors?department_id=${bookingData.department_id}`)
      .then(res => res.json())
      .then(doctors => {
        let docCards = document.createElement("div");
        docCards.className = "menu-cards"; // Reuse menu-cards style for doctor selection
        doctors.forEach(doc => {
          let card = document.createElement("div");
          card.className = "menu-card";
          card.innerHTML = `
            <strong>${doc.name[resolveLangKey()] || doc.name.en
            }</strong><br>
            ${doc.education || ""}<br>
            ${doc.experience || ""}<br>
            Fees: ${doc.fees || ""}
          `;
          card.addEventListener("click", () => {
            bookingData.doctor_id = doc.id;
            bookingData.doctor_name = doc.name[resolveLangKey()] || doc.name.en;
            window.appendUserLine(bookingData.doctor_name);
            saveState();
            askDate();
            if (chatInputCard) chatInputCard.classList.remove("hidden"); // Show input card again after selection
          });
          docCards.appendChild(card);
        });
        document.getElementById("chatMessages").appendChild(docCards);
        // Scroll to the bottom to show new doctor cards
        document.getElementById("chatMessages").scrollTop = document.getElementById("chatMessages").scrollHeight;
      })
      .catch(error => {
          console.error("Error fetching doctors:", error);
          window.appendSystemLine(window.tOr("booking_failed_load_doctors", "Failed to load doctors. Please try again."));
          if (chatInputCard) chatInputCard.classList.remove("hidden"); // Show input card back on error
      });
  }

  function askDate() {
    if (!bookingData.doctor_id) { 
      window.appendSystemLine(window.tOr("booking_no_doctor_selected", "Please select a doctor first.")); 
      showDoctors(); 
      return; 
    }

    window.appendSystemLine(window.tOr("booking_select_date", "Please select an available date:"));

    const datePickerInput = document.getElementById("appointmentDatePicker");
    document.getElementById("chatInput").classList.remove("hidden");
    document.getElementById("sendBtn").classList.remove("hidden");

    if (datePickerInput && chatInput && sendBtn) {
        // Hide regular chat input and send button, show date picker input
        chatInput.classList.add("hidden");
        sendBtn.classList.add("hidden");
        datePickerInput.classList.remove("hidden");

        fetch(`/meta/doctor_days?doctor_id=${bookingData.doctor_id}`)
            .then(res => res.json())
            .then(days => {
                if (!days || !days.length) {
                    window.appendSystemLine(window.tOr("booking_no_available_days", "No available days for this doctor. Please select another doctor."));
                    // Hide date picker and show chat input again before returning
                    datePickerInput.classList.add("hidden");
                    chatInput.classList.remove("hidden");
                    sendBtn.classList.remove("hidden");
                    showDoctors();
                    return;
                }
                const availableDays = days.map(d => d.toLowerCase());

                // Destroy existing datepicker instance to re-initialize (important for dynamic updates)
                if ($(datePickerInput).data('datepicker')) {
                    $(datePickerInput).datepicker('destroy');
                }

                $(datePickerInput).datepicker({
                    dateFormat: "yy-mm-dd",
                    minDate: 0,
                    beforeShowDay: function (date) {
                        const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
                        return [availableDays.includes(dayName)];
                    },
                    onSelect: function (dateText) {
                        bookingData.date = dateText;
                        window.appendUserLine(dateText);
                        saveState();
                        showTimeSlots();
                        // Hide the date picker and show the regular chat input and send button again
                        datePickerInput.classList.add("hidden");
                        chatInput.classList.remove("hidden");
                        sendBtn.classList.remove("hidden");
                    }
                });

                // Open the date picker immediately after it's initialized
                $(datePickerInput).datepicker("show");
                currentStep = 5; saveState();
                document.getElementById("chatMessages").scrollTop = document.getElementById("chatMessages").scrollHeight;
            })
            .catch(error => {
                console.error("Error fetching doctor days:", error);
                window.appendSystemLine(window.tOr("booking_failed_load_dates", "Failed to load available dates. Please try again."));
                datePickerInput.classList.add("hidden");
                chatInput.classList.remove("hidden");
                sendBtn.classList.remove("hidden");
            });
    } else {
        window.appendSystemLine(window.tOr("booking_datepicker_error", "Date picker, chat input, or send button element not found. Please ensure the HTML structure is correct."));
    }
  }

  function formatTimeSlot(timeStr, lang) {
    const [hourStr, minuteStr] = timeStr.split(":");
    let hour24 = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
  
    // Prepare display hour in 12-hour format
    let period = hour24 >= 12 ? "PM" : "AM";
    let displayHour = hour24 % 12 || 12;
  
    let formattedTime;
    let prefix = "", suffix = "";
  
    if (lang === "english") {
      formattedTime = `${displayHour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")} ${period}`;
    } else {
      // Hindi / Marathi formatting
      formattedTime = `${displayHour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
  
      if (lang === "marathi") {
        if (hour24 < 12) prefix = "सकाळी ";            // Morning
        else if (hour24 >= 12 && hour24 < 16) prefix = "दुपारी "; // Afternoon 12–3
        else prefix = "संध्याकाळी ";                   // Evening 4+
        suffix = " वाजता";
      } else if (lang === "hindi") {
        if (hour24 < 12) prefix = "सुबह ";             // Morning
        else if (hour24 >= 12 && hour24 < 16) prefix = "दोपहर "; // Afternoon 12–3
        else prefix = "शाम ";                          // Evening 4+
        suffix = " बजे";
      }
    }
  
    return `${prefix}${formattedTime}${suffix}`;
  }
  
  function showTimeSlots() {
    if (!bookingData.date) { 
      window.appendSystemLine(window.tOr("booking_no_date_selected", "Please select a date first.")); 
      askDate(); 
      return; 
    }
  
    const chatInputCard = document.querySelector(".chat-input-card");
    if (chatInputCard) chatInputCard.classList.add("hidden"); // Hide input card for menu selection
  
    window.appendSystemLine(window.tOr("booking_select_time_slot", "Please select an available time slot:"));
  
    fetch(`/meta/slots?doctor_id=${bookingData.doctor_id}&date=${bookingData.date}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        const times = data.slots || [];   // ✅ Extract slots array
  
        if (!times.length) {
          window.appendSystemLine(
            window.tOr("booking_no_available_slots", "No available time slots. Please select another date.")
          );
          askDate();
          return;
        }
  
        currentStep = 6; 
        saveState();
  
        let timeCards = document.createElement("div");
        timeCards.className = "menu-cards"; // Reuse menu-cards style for time selection
  
        times.forEach(slot => {
          // slot = { value: "14:00", display: "02:00 PM" }
          let card = document.createElement("div");
          card.className = "menu-card";
          card.textContent = slot.display;   // Show nice 12hr format
  
          card.addEventListener("click", () => {
            bookingData.time = slot.value;   // Store backend format
            bookingData.time_display = slot.display; // Store for preview
            window.appendUserLine(slot.display);
            saveState();
            confirmAppointmentPrompt(); 
            if (chatInputCard) chatInputCard.classList.remove("hidden"); // Show input card again
          });
  
          timeCards.appendChild(card);
        });
  
        document.getElementById("chatMessages").appendChild(timeCards);
        document.getElementById("chatMessages").scrollTop = document.getElementById("chatMessages").scrollHeight;
      })
      .catch(error => {
        console.error("Error fetching time slots:", error);
        window.appendSystemLine(
          window.tOr("booking_failed_load_slots", "Failed to load time slots. Please try again.")
        );
        if (chatInputCard) chatInputCard.classList.remove("hidden"); // Show input card back on error
      });
  }
  

  function confirmAppointmentPrompt() {
    window.appendSystemLine(window.tOr("booking_confirm_appointment", "Please confirm your appointment:"));
    let previewCard = document.createElement("div");
    previewCard.className = "preview-card-3d";
    previewCard.innerHTML = `
      <b>${window.tOr("booking_name", "Name")}:</b> ${bookingData.name}<br>
      <b>${window.tOr("booking_phone", "Phone")}:</b> ${bookingData.phone}<br>
      <b>${window.tOr("booking_department", "Department")}:</b> ${bookingData.department_name}<br>
      <b>${window.tOr("booking_doctor", "Doctor")}:</b> ${bookingData.doctor_name}<br>
      <b>${window.tOr("booking_date", "Date")}:</b> ${bookingData.date}<br>
      <b>${window.tOr("booking_time", "Time")}:</b> ${bookingData.time_display || bookingData.time}
    `;
    document.getElementById("chatMessages").appendChild(previewCard);

    currentStep = 7; saveState();

    let confirmBtns = document.createElement("div");
    confirmBtns.className = "menu-cards"; // Reuse menu-cards style for confirmation
    [window.tOr("choice_yes", "Yes"), window.tOr("choice_no", "No")].forEach(choice => {
      let btn = document.createElement("div");
      btn.className = "menu-card";
      btn.textContent = choice;
      btn.addEventListener("click", () => {
        window.appendUserLine(choice);
        if (choice === window.tOr("choice_yes", "Yes")) {
            saveAppointment();
        } else {
            window.appendSystemLine(window.tOr("booking_cancelled", "Booking cancelled."));
            clearState(); // Clear state if cancelled
            // Optionally, return to main menu or allow starting a new booking
            setTimeout(window.showMainMenu, 1500); // Go back to main menu after a short delay
        }
      });
      confirmBtns.appendChild(btn);
    });
    document.getElementById("chatMessages").append(confirmBtns);
    document.getElementById("chatMessages").scrollTop = document.getElementById("chatMessages").scrollHeight;
  }

  function saveAppointment() {
    const requiredKeys = ["name", "phone", "department_id", "doctor_id", "date", "time"];
    for (let key of requiredKeys) {
      if (!bookingData[key]) {
        window.appendSystemLine(window.tOr("booking_error_missing_data", `Error: Missing ${key}. Please restart booking.`));
        return;
      }
    }

    fetch("/appointments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: bookingData.name,
        phone: bookingData.phone,
        department_id: bookingData.department_id,
        department: bookingData.department_name || "",
        doctor_id: bookingData.doctor_id,
        doctor: bookingData.doctor_name || "",
        date: bookingData.date,
        time: bookingData.time
      })
    })
    .then(async r => {
      if (!r.ok) {
        const errText = await r.text();
        console.error("Server returned error:", errText);
        window.appendSystemLine(window.tOr("booking_error_confirming", "Error confirming appointment."));
        return null;
      }
      return r.json();
    })
    .then(finalResp => {
      if (!finalResp || !finalResp.appointment_id) { 
        window.appendSystemLine(window.tOr("booking_error_confirming", "Error confirming appointment.")); 
        return; 
      }
      bookingData.appointment_id = finalResp.appointment_id;
      const apptId = `XYZ_${finalResp.appointment_id}`;
      window.appendSystemLine(window.tOr("booking_success", "✅ Your appointment successfully booked!"));
      window.appendSystemLine(window.tOr("booking_appointment_id", `Appointment ID: ${apptId}`));
      appendActionButtons(finalResp.appointment_id);
      clearState();
      document.getElementById("chatMessages").scrollTop = document.getElementById("chatMessages").scrollHeight;
    })
    .catch(err => {
      console.error("Error confirming appointment:", err);
      window.appendSystemLine(window.tOr("booking_error_confirming", "Error confirming appointment."));
    });
  }

  function appendActionButtons(apptId) {
    let actionsContainer = document.createElement("div");
    actionsContainer.style.display = 'flex';
    actionsContainer.style.flexDirection = 'column';
    actionsContainer.style.gap = '10px';
    actionsContainer.style.marginTop = '15px';


    let slipBtn = document.createElement("button");
    slipBtn.textContent = window.tOr("booking_download_slip", "Download Slip"); // Localize button text
    slipBtn.className = "btn-3d"; // Using general 3d button style
    slipBtn.style.alignSelf = 'center'; // Center the button
    slipBtn.style.minWidth = '200px';
    slipBtn.addEventListener("click", () => {
      window.open(`/appointments/${apptId}/slip`, '_blank'); // Open in new tab
    });
    actionsContainer.appendChild(slipBtn);

    let menuBtn = document.createElement("button");
    menuBtn.textContent = window.tOr("menu_main", "Main Menu"); // Localize button text
    menuBtn.className = "btn-3d"; // Using general 3d button style
    menuBtn.style.alignSelf = 'center'; // Center the button
    menuBtn.style.minWidth = '200px';
    menuBtn.addEventListener("click", window.showMainMenu); // Call global showMainMenu
    actionsContainer.appendChild(menuBtn);
    
    document.getElementById("chatMessages").appendChild(actionsContainer);


    let instructionMsg = document.createElement("div");
    instructionMsg.className = "chat-message bot"; // Use bot message style
    instructionMsg.innerHTML = window.tOr("booking_edit_instruction", "ℹ️ If you want to edit this appointment, click on <b>Main Menu</b> and go to <b>My Appointments</b> section."); // Localize instruction
    document.getElementById("chatMessages").appendChild(instructionMsg);

    const healthTips = [
      window.tOr("health_tip_1", "💡 Health Tip: Stay hydrated — drink 6-8 glasses of water daily."),
      window.tOr("health_tip_2", "💡 Health Tip: Get at least 7-8 hours of quality sleep every night."),
      window.tOr("health_tip_3", "💡 Health Tip: Eat more fresh fruits and vegetables for better immunity."),
      window.tOr("health_tip_4", "💡 Health Tip: Exercise at least 30 minutes a day to keep your heart healthy."),
      window.tOr("health_tip_5", "💡 Health Tip: Take short breaks from screens to protect your eyes."),
      window.tOr("health_tip_6", "💡 Health Tip: Wash your hands regularly to prevent infections."),
      window.tOr("health_tip_7", "💡 Health Tip: Manage stress with meditation or deep breathing exercises.")
    ];
    const randomTip = healthTips[Math.floor(Math.random() * healthTips.length)];

    let healthMsg = document.createElement("div");
    healthMsg.className = "chat-message bot"; // Use bot message style
    healthMsg.innerHTML = randomTip;
    document.getElementById("chatMessages").appendChild(healthMsg);
    document.getElementById("chatMessages").scrollTop = document.getElementById("chatMessages").scrollHeight;
  }

  function handleBookingInput(val) {
    if (currentStep === 1) {
      if (!validateName(val)) { window.appendSystemLine(window.tOr("booking_invalid_name", "Invalid name. Please enter again.")); return; }
      bookingData.name = val; saveState(); askPhone();
    } else if (currentStep === 2) {
      if (!validatePhone(val)) { window.appendSystemLine(window.tOr("booking_invalid_phone", "Invalid phone. Please enter again.")); return; }
      bookingData.phone = val; saveState(); showDepartments();
    }
  }

  function startBookingFlow() {
    clearState();
    bookingData = { name: "", phone: "", department_id: "", department_name: "", doctor_id: "", doctor_name: "", date: "", time: "", time_display: "", currentFlow: "booking" };
    currentStep = 0;
    
    // Ensure chat input is visible and date picker is hidden when starting booking flow
    const chatInput = document.getElementById("chatInput");
    const datePickerInput = document.getElementById("appointmentDatePicker");
    const sendBtn = document.getElementById("sendChatBtn");

    if (chatInput) chatInput.classList.remove("hidden");
    if (sendBtn) sendBtn.classList.remove("hidden");
    if (datePickerInput) datePickerInput.classList.add("hidden");

    askName();
  }

  // Exposed function for chat.js to restore a booking flow
  // This function is still used, but called from chat.js if needed (e.g., via browser history)
  window.restoreBookingFlow = function({ step, data }) {
    bookingData = data || {};
    currentStep = step || 0;

    // Ensure chat input and date picker visibility are set correctly based on the restored step
    const chatInput = document.getElementById("chatInput");
    const datePickerInput = document.getElementById("appointmentDatePicker");
    const sendBtn = document.getElementById("sendBtn");

    if (currentStep === 5) { // If restoring at the askDate step
        if (chatInput) chatInput.classList.add("hidden");
        if (sendBtn) sendBtn.classList.add("hidden");
        if (datePickerInput) datePickerInput.classList.remove("hidden");
    } else { // For all other steps, ensure regular input is visible
        if (chatInput) chatInput.classList.remove("hidden");
        if (sendBtn) sendBtn.classList.remove("hidden");
        if (datePickerInput) datePickerInput.classList.add("hidden");
    }

    // Resume the correct step in the booking flow
    switch (currentStep) {
      case 1: askName(); break;
      case 2: askPhone(); break;
      case 3: showDepartments(); break;
      case 4: showDoctors(); break;
      case 5: askDate(); break;
      case 6: showTimeSlots(); break;
      case 7: confirmAppointmentPrompt(); break;
      default: window.showMainMenu(); break; // Fallback
    }
  };


  window.startBookingFlow = startBookingFlow;
  window.startBookingChatFlow = startBookingFlow; 
  window.startFlow = startBookingFlow;   // ✅ generic alias for chatshell.html
  window.handleBookingInput = handleBookingInput;
})();
