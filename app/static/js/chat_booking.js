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

  // Smart input parser for direct appointment requests
  function parseDirectBookingRequest(input) {
    const lowerInput = input.toLowerCase();
    
    // First check for booking-related keywords - if found, prioritize booking
    const bookingKeywords = [
      /book/i,
      /appointment/i,
      /dr\.?\s*\w+/i,
      /doctor/i,
      /tomorrow/i,
      /today/i,
      /monday|tuesday|wednesday|thursday|friday|saturday|sunday/i,
      /my name is/i,
      /phone.*\d/i
    ];
    
    // If booking keywords are present, don't treat as general question
    const hasBookingKeywords = bookingKeywords.some(pattern => pattern.test(input));
    
    // Check if this is a general question (not booking related)
    const generalQuestionPatterns = [
      /^(what|how|when|where|why|can you|could you|tell me|explain|describe)/,
      /(symptoms|treatment|medicine|disease|illness|health|medical advice)/,
      /(hospital|address|location|contact|timing|hours)/,
      /(fees|cost|price|charge|payment)/,
      /(about|information|details|help)/
    ];
    
    // Only treat as general question if no booking keywords and matches general patterns
    if (!hasBookingKeywords && generalQuestionPatterns.some(pattern => pattern.test(lowerInput))) {
      return {
        type: 'general_question',
        message: 'This appears to be a general question. Please go to the "General Query" section for medical information and hospital details.'
      };
    }
    
    // Check for direct appointment booking patterns
    const bookingPatterns = [
      // Pattern 1: "book appointment with dr khan for tomorrow at 12:30 pm"
      /book\s+(?:an?\s+)?appointment\s+with\s+(?:dr\.?\s*)?([a-zA-Z\s]+?)\s+(?:for\s+)?(tomorrow|today|day\s+after|next\s+week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)?\s*(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
      
      // Pattern 2: "dr khan appointment tomorrow 12:30"
      /(?:dr\.?\s*)?([a-zA-Z\s]+?)\s+appointment\s+(tomorrow|today|day\s+after|next\s+week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
      
      // Pattern 3: "appointment with khan for tomorrow"
      /appointment\s+with\s+(?:dr\.?\s*)?([a-zA-Z\s]+?)\s+(?:for\s+)?(tomorrow|today|day\s+after|next\s+week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      
      // Pattern 4: "book with dr khan"
      /book\s+(?:with\s+)?(?:dr\.?\s*)?([a-zA-Z\s]+?)(?:\s+for\s+(tomorrow|today|day\s+after|next\s+week|monday|tuesday|wednesday|thursday|friday|saturday|sunday))?/i,
      
      // Pattern 5: "I am John Smith, book appointment with dr khan for tomorrow at 2pm"
      /I\s+am\s+([a-zA-Z\s]+?),\s+book\s+(?:an?\s+)?appointment\s+with\s+(?:dr\.?\s*)?([a-zA-Z\s]+?)\s+(?:for\s+)?(tomorrow|today|day\s+after|next\s+week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)?\s*(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
      
      // Pattern 6: "My name is John Smith, phone 9876543210, book with dr khan"
      /My\s+name\s+is\s+([a-zA-Z\s]+?),\s+phone\s+(\d{10}),\s+book\s+(?:with\s+)?(?:dr\.?\s*)?([a-zA-Z\s]+?)(?:\s+for\s+(tomorrow|today|day\s+after|next\s+week|monday|tuesday|wednesday|thursday|friday|saturday|sunday))?/i,
      
      // Pattern 7: "my name is Adam downshine phone number is 7867456756 book my appointment with doctor khan for tomorrow"
      /my\s+name\s+is\s+([a-zA-Z\s]+?)\s+phone\s+number\s+is\s+(\d{10})\s+book\s+(?:my\s+)?appointment\s+with\s+(?:doctor\s+|dr\.?\s*)?([a-zA-Z\s]+?)(?:\s+for\s+)?(tomorrow|today|day\s+after|next\s+week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)?/i,
      
      // Pattern 8: "my name is John Smith, phone is 9876543210, book appointment with dr khan"
      /my\s+name\s+is\s+([a-zA-Z\s]+?),\s+phone\s+is\s+(\d{10}),\s+book\s+(?:an?\s+)?appointment\s+with\s+(?:dr\.?\s*)?([a-zA-Z\s]+?)(?:\s+for\s+)?(tomorrow|today|day\s+after|next\s+week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)?/i
    ];
    
    for (let i = 0; i < bookingPatterns.length; i++) {
      const pattern = bookingPatterns[i];
      const match = input.match(pattern);
      if (match) {
        // Handle different patterns with different match groups
        if (i === 4) { // Pattern 5: "I am John Smith, book appointment with dr khan..."
          return {
            type: 'direct_booking',
            name: match[1]?.trim(),
            doctorName: match[2]?.trim(),
            date: match[3]?.trim() || 'tomorrow',
            time: match[4]?.trim()
          };
        } else if (i === 5) { // Pattern 6: "My name is John Smith, phone 9876543210, book with dr khan"
          return {
            type: 'direct_booking',
            name: match[1]?.trim(),
            phone: match[2]?.trim(),
            doctorName: match[3]?.trim(),
            date: match[4]?.trim() || 'tomorrow',
            time: null
          };
        } else if (i === 6) { // Pattern 7: "my name is Adam downshine phone number is 7867456756 book my appointment with doctor khan for tomorrow"
          return {
            type: 'direct_booking',
            name: match[1]?.trim(),
            phone: match[2]?.trim(),
            doctorName: match[3]?.trim(),
            date: match[4]?.trim() || 'tomorrow',
            time: null
          };
        } else if (i === 7) { // Pattern 8: "my name is John Smith, phone is 9876543210, book appointment with dr khan"
          return {
            type: 'direct_booking',
            name: match[1]?.trim(),
            phone: match[2]?.trim(),
            doctorName: match[3]?.trim(),
            date: match[4]?.trim() || 'tomorrow',
            time: null
          };
        } else {
          // Standard patterns
          return {
            type: 'direct_booking',
            doctorName: match[1]?.trim(),
            date: match[2]?.trim() || 'tomorrow',
            time: match[3]?.trim()
          };
        }
      }
    }
    
    return { type: 'normal_flow' };
  }

  // Enhanced input handler
  function handleSmartBookingInput(input) {
    const parsed = parseDirectBookingRequest(input);
    
    switch (parsed.type) {
      case 'general_question':
        window.appendSystemLine(`🤖 ${parsed.message}`);
        window.appendSystemLine('💡 Click on "General Query" in the main menu for medical information.');
        return true;
        
      case 'direct_booking':
        handleDirectBooking(parsed);
        return true;
        
      case 'normal_flow':
      default:
        return false; // Continue with normal flow
    }
  }

  // Handle direct booking requests
  async function handleDirectBooking(parsed) {
    window.appendSystemLine(`🎯 ${window.tOr("processing_direct_booking", "Processing your direct booking request...")}`);
    
    try {
      // Set name and phone if provided in the request
      if (parsed.name && validateName(parsed.name)) {
        bookingData.name = parsed.name;
        window.appendSystemLine(`✅ ${window.tOr("name_set", "Name set")}: ${parsed.name}`);
      }
      
      if (parsed.phone && validatePhone(parsed.phone)) {
        bookingData.phone = parsed.phone;
        window.appendSystemLine(`✅ ${window.tOr("phone_set", "Phone set")}: ${parsed.phone}`);
      }
      
      // Check if we still need name and phone
      if (!bookingData.name || !bookingData.phone) {
        window.appendSystemLine(`👤 ${window.tOr("direct_booking_need_details", "For direct booking, I need your details first:")}`);
        
        if (!bookingData.name) {
          currentStep = 1;
          askName();
          return;
        }
        
        if (!bookingData.phone) {
          currentStep = 2;
          askPhone();
          return;
        }
      }
      
      // First, get all doctors to find the matching doctor
      const doctorsResponse = await fetch("/meta/doctors");
      if (!doctorsResponse.ok) {
        throw new Error(`HTTP error! status: ${doctorsResponse.status}`);
      }
      const allDoctors = await doctorsResponse.json();
      
      // Find doctor by name (case insensitive, partial match)
      const doctorName = parsed.doctorName.toLowerCase();
      const matchingDoctor = allDoctors.find(doc => {
        const docName = (doc.name.en || '').toLowerCase();
        const docNameHi = (doc.name.hi || '').toLowerCase();
        const docNameMr = (doc.name.mr || '').toLowerCase();
        
        return docName.includes(doctorName) || 
               docNameHi.includes(doctorName) || 
               docNameMr.includes(doctorName) ||
               doctorName.includes(docName.split(' ')[0]) ||
               doctorName.includes(docNameHi.split(' ')[0]) ||
               doctorName.includes(docNameMr.split(' ')[0]);
      });
      
      if (!matchingDoctor) {
        window.appendSystemLine(`❌ ${window.tOr("doctor_not_found", "Doctor not found. Available doctors:")}`);
        showAvailableDoctors(allDoctors);
        return;
      }
      
      // Set the doctor in booking data
      bookingData.doctor_id = matchingDoctor.id;
      bookingData.doctor_name = matchingDoctor.name[resolveLangKey()] || matchingDoctor.name.en;
      bookingData.department_id = matchingDoctor.department_id;
      
      window.appendSystemLine(`✅ ${window.tOr("doctor_found", "Doctor found")}: ${bookingData.doctor_name}`);
      
      // Handle date
      const requestedDate = parseDate(parsed.date);
      if (!requestedDate) {
        window.appendSystemLine(`📅 ${window.tOr("select_date", "Please select an available date:")}`);
        askDate();
        return;
      }
      
      bookingData.date = requestedDate;
      
      // Handle time if provided
      if (parsed.time) {
        const requestedTime = parseTime(parsed.time);
        if (requestedTime) {
          await handleTimeSlotRequest(requestedDate, requestedTime, matchingDoctor.id);
        } else {
          window.appendSystemLine(`⏰ ${window.tOr("invalid_time", "Invalid time format. Please select from available slots:")}`);
          showTimeSlotsForDate(requestedDate, matchingDoctor.id);
        }
      } else {
        window.appendSystemLine(`⏰ ${window.tOr("select_time", "Please select an available time slot:")}`);
        showTimeSlotsForDate(requestedDate, matchingDoctor.id);
      }
      
    } catch (error) {
      console.error("Direct booking error:", error);
      window.appendSystemLine(`❌ ${window.tOr("booking_error", "Error processing booking request. Please try again.")}`);
    }
  }

  // Parse date from natural language
  function parseDate(dateStr) {
    if (!dateStr) return null;
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    const dateMap = {
      'today': today,
      'tomorrow': tomorrow,
      'day after': dayAfter,
      'day after tomorrow': dayAfter
    };
    
    const dayNames = {
      'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
      'friday': 5, 'saturday': 6, 'sunday': 0
    };
    
    const lowerDate = dateStr.toLowerCase();
    
    if (dateMap[lowerDate]) {
      return dateMap[lowerDate].toISOString().split('T')[0];
    }
    
    // Handle day names (find next occurrence)
    if (dayNames[lowerDate] !== undefined) {
      const targetDay = dayNames[lowerDate];
      const currentDay = today.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7; // Next week
      
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysToAdd);
      return targetDate.toISOString().split('T')[0];
    }
    
    return null;
  }

  // Parse time from natural language
  function parseTime(timeStr) {
    if (!timeStr) return null;
    
    // Remove spaces and convert to lowercase
    const cleanTime = timeStr.replace(/\s/g, '').toLowerCase();
    
    // Handle formats like "12:30pm", "12pm", "12:30", "12"
    const timePattern = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/;
    const match = cleanTime.match(timePattern);
    
    if (!match) return null;
    
    let hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const period = match[3];
    
    // Convert to 24-hour format
    if (period === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // Show available doctors when direct match fails
  function showAvailableDoctors(doctors) {
    const chatInputCard = document.querySelector(".chat-input-card");
    if (chatInputCard) chatInputCard.classList.add("hidden");
    
    let docCards = document.createElement("div");
    docCards.className = "menu-cards";
    
    doctors.forEach(doc => {
      let card = document.createElement("div");
      card.className = "menu-card doctor-card";
      
      let photoUrl = "/static/images/default-doctor.png";
      if (doc.photo) {
        photoUrl = `/static/uploads/doctors/${doc.photo}`;
      }
      
      card.innerHTML = `
        <div class="doctor-card-content">
          <div class="doctor-photo">
            <img src="${photoUrl}" alt="${doc.name[resolveLangKey()] || doc.name.en}" 
                 onerror="this.src='/static/images/default-doctor.png'">
          </div>
          <div class="doctor-info">
            <strong class="doctor-name">${doc.name[resolveLangKey()] || doc.name.en}</strong><br>
            <span class="doctor-education">${doc.education || ""}</span><br>
            <span class="doctor-experience">${doc.experience || ""}</span><br>
            <span class="doctor-fees">Fees: ₹${doc.fees || ""}</span>
          </div>
        </div>
      `;
      
      card.addEventListener("click", () => {
        bookingData.doctor_id = doc.id;
        bookingData.doctor_name = doc.name[resolveLangKey()] || doc.name.en;
        bookingData.department_id = doc.department_id;
        window.appendUserLine(doc.name[resolveLangKey()] || doc.name.en);
        saveState();
        askDate();
        if (chatInputCard) chatInputCard.classList.remove("hidden");
      });
      
      docCards.appendChild(card);
    });
    
    document.getElementById("chatMessages").appendChild(docCards);
    document.getElementById("chatMessages").scrollTop = document.getElementById("chatMessages").scrollHeight;
  }

  // Handle specific time slot request
  async function handleTimeSlotRequest(date, requestedTime, doctorId) {
    try {
      const response = await fetch(`/meta/slots?doctor_id=${doctorId}&date=${date}`);
      const data = await response.json();
      const availableSlots = data.slots || [];
      
      // Find exact time match
      const exactMatch = availableSlots.find(slot => slot.value === requestedTime);
      
      if (exactMatch) {
        // Time slot is available - proceed with booking
        bookingData.time = exactMatch.value;
        bookingData.time_display = exactMatch.display;
        
        window.appendSystemLine(`✅ ${window.tOr("time_available", "Great! Time slot is available")}: ${exactMatch.display}`);
        window.appendSystemLine(`📅 ${window.tOr("date_confirmed", "Date confirmed")}: ${formatDate(date)}`);
        
        // Skip to confirmation since we have all required info
        currentStep = 7;
        saveState();
        confirmAppointmentPrompt();
      } else {
        // Time slot not available - show alternatives
        window.appendSystemLine(`❌ ${window.tOr("time_not_available", "Requested time slot is not available.")}`);
        window.appendSystemLine(`💡 ${window.tOr("alternative_times", "Here are the available time slots for")} ${formatDate(date)}:`);
        
        showTimeSlotsForDate(date, doctorId);
      }
    } catch (error) {
      console.error("Time slot check error:", error);
      window.appendSystemLine(`❌ ${window.tOr("time_check_error", "Error checking time slots. Please try again.")}`);
    }
  }

  // Show time slots for a specific date
  async function showTimeSlotsForDate(date, doctorId) {
    const chatInputCard = document.querySelector(".chat-input-card");
    if (chatInputCard) chatInputCard.classList.add("hidden");
    
    try {
      const response = await fetch(`/meta/slots?doctor_id=${doctorId}&date=${date}`);
      const data = await response.json();
      const availableSlots = data.slots || [];
      
      if (availableSlots.length === 0) {
        window.appendSystemLine(`❌ ${window.tOr("no_slots_available", "No available time slots for this date.")}`);
        window.appendSystemLine(`📅 ${window.tOr("try_another_date", "Please try another date:")}`);
        askDate();
        return;
      }
      
      let timeCards = document.createElement("div");
      timeCards.className = "menu-cards";
      
      availableSlots.forEach(slot => {
        let card = document.createElement("div");
        card.className = "menu-card";
        card.innerHTML = `⏰ ${slot.display}`;
        
        card.addEventListener("click", () => {
          bookingData.time = slot.value;
          bookingData.time_display = slot.display;
          window.appendUserLine(slot.display);
          saveState();
          confirmAppointmentPrompt();
          if (chatInputCard) chatInputCard.classList.remove("hidden");
        });
        
        timeCards.appendChild(card);
      });
      
      document.getElementById("chatMessages").appendChild(timeCards);
      document.getElementById("chatMessages").scrollTop = document.getElementById("chatMessages").scrollHeight;
      
      currentStep = 6;
      saveState();
      
    } catch (error) {
      console.error("Error fetching time slots:", error);
      window.appendSystemLine(`❌ ${window.tOr("error_loading_slots", "Error loading time slots. Please try again.")}`);
    }
  }

  // Format date for display
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString(window.currentLang === 'hindi' ? 'hi-IN' : 
                                   window.currentLang === 'marathi' ? 'mr-IN' : 'en-US', options);
  }

  function askName() {
    window.appendSystemLine(`👤 ${window.tOr("booking_ask_name", "Please enter your full name:")}`);
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
    window.appendSystemLine(`📱 ${window.tOr("booking_ask_phone", "Please enter your 10-digit phone number:")}`);
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

    window.appendSystemLine(`🏥 ${window.tOr("booking_select_department", "Please select a department:")}`);
    currentStep = 3; saveState();

    fetch("/meta/departments")
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(departments => {
        // Check if departments is an array
        if (!Array.isArray(departments)) {
          console.error("Departments response is not an array:", departments);
          throw new Error("Invalid departments data format");
        }
        
        let deptCards = document.createElement("div");
        deptCards.className = "menu-cards"; // Reuse menu-cards style for department selection
        departments.forEach(dept => {
          let card = document.createElement("div");
          card.className = "menu-card";
          card.innerHTML = `🏥 ${dept.name[resolveLangKey()] || dept.name.en}`;
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

    window.appendSystemLine(`👨‍⚕️ ${window.tOr("booking_select_doctor", "Please select a doctor:")}`);
    currentStep = 4; saveState();

    fetch(`/meta/doctors?department_id=${bookingData.department_id}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(doctors => {
        let docCards = document.createElement("div");
        docCards.className = "menu-cards"; // Reuse menu-cards style for doctor selection
        doctors.forEach(doc => {
          let card = document.createElement("div");
          card.className = "menu-card doctor-card";
          
          // Create doctor photo URL
          let photoUrl = "/static/images/default-doctor.png"; // Default photo
          if (doc.photo) {
            photoUrl = `/static/uploads/doctors/${doc.photo}`;
          }
          
          card.innerHTML = `
            <div class="doctor-card-content">
              <div class="doctor-photo">
                <img src="${photoUrl}" alt="${doc.name[resolveLangKey()] || doc.name.en}" 
                     onerror="this.src='/static/images/default-doctor.png'">
              </div>
              <div class="doctor-info">
                <strong class="doctor-name">${doc.name[resolveLangKey()] || doc.name.en}</strong><br>
                <span class="doctor-education">${doc.education || ""}</span><br>
                <span class="doctor-experience">${doc.experience || ""}</span><br>
                <span class="doctor-fees">Fees: ₹${doc.fees || ""}</span>
              </div>
            </div>
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

    window.appendSystemLine(`📅 ${window.tOr("booking_select_date", "Please select an available date:")}`);

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
  
    window.appendSystemLine(`⏰ ${window.tOr("booking_select_time_slot", "Please select an available time slot:")}`);
  
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
          card.innerHTML = `⏰ ${slot.display}`;   // Show nice 12hr format with icon
  
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
    window.appendSystemLine(`✅ ${window.tOr("booking_confirm_appointment", "Please confirm your appointment:")}`);
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
    [
      {text: window.tOr("choice_yes", "Yes"), icon: "✅"},
      {text: window.tOr("choice_no", "No"), icon: "❌"}
    ].forEach(choice => {
      let btn = document.createElement("div");
      btn.className = "menu-card";
      btn.innerHTML = `${choice.icon} ${choice.text}`;
      btn.addEventListener("click", () => {
        window.appendUserLine(choice.text);
        if (choice.text === window.tOr("choice_yes", "Yes")) {
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
    // First, try smart input parsing for direct booking or general questions
    if (handleSmartBookingInput(val)) {
      return; // Smart handler processed the input
    }
    
    // Continue with normal step-by-step flow
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
