(function () {
  let hospitalNameVoicePage;
  let currentLangPillVoice;
  let voiceHomeBtn;
  let voiceHeading;
  let voiceMessages;
  let toggleVoiceBtn;
  let voiceButtonLabel;

  // Navigation buttons
  let voiceBackToPrevStepBtn;
  let voiceChatAssistantBtn;
  let voiceMainMenuBtn;

  let recognition; // Web Speech API
  let speechSynthesis;

  // Expose globally
  window.isListening = false;
  window.timeoutTimer = null;
  window.retryCount = 0;
  window.MAX_RETRIES = 2;

  // Language + flow state
  window.t = {};
  window.currentLang = localStorage.getItem("selectedLanguage") || "english";
  window.voiceFlowState = {
    currentFlow: null,
    flowHistory: [],
    bookingStep: 0,
    bookingData: {}
  };

  // --- Language helpers ---
  window.loadTranslations = async function () {
    try {
      const res = await fetch("/static/lang/lang.json");
      const all = await res.json();
      const lang = localStorage.getItem("selectedLanguage") || "english";
      window.currentLang = lang;
      window.t = all[lang] || all["english"] || {};
      return { lang, translations: window.t };
    } catch (err) {
      console.error("Error loading translations:", err);
      window.currentLang = "english";
      window.t = {};
      return { lang: "english", translations: {} };
    }
  };

  window.tOr = function (key, fallback) {
    return (window.t && window.t[key]) || fallback;
  };

  // --- Append messages ---
  window.appendVoiceMessage = function (text, isUser = false) {
    if (!voiceMessages) return;
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("voice-message", isUser ? "user" : "bot");
    messageDiv.textContent = text;
    voiceMessages.appendChild(messageDiv);
    voiceMessages.scrollTop = voiceMessages.scrollHeight;
  };

  // --- TTS ---
  window.speakBotMessage = function (text, callback = null) {
    if (!text || !speechSynthesis) {
      if (callback) callback();
      return;
    }
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);

    let bcp47Lang = "en-US";
    if (window.currentLang === "hindi") bcp47Lang = "hi-IN";
    else if (window.currentLang === "marathi") bcp47Lang = "mr-IN";

    const voices = speechSynthesis.getVoices();
    let selectedVoice = voices.find(v => v.lang.startsWith(bcp47Lang) && v.localService)
      || voices.find(v => v.lang.startsWith(bcp47Lang))
      || voices.find(v => v.lang.startsWith("en"))
      || voices[0];

    if (selectedVoice) {
      utter.voice = selectedVoice;
      utter.rate = 1.0;
      utter.pitch = 1.0;
    }
    utter.onend = () => { if (callback) callback(); };
    utter.onerror = () => { if (callback) callback(); };
    speechSynthesis.speak(utter);
  };

  // --- Recognition ---
  window.startRecognition = function () {
    if (recognition && !window.isListening) {
      try {
        recognition.lang = getRecognitionLanguage(window.currentLang);
        recognition.start();
        window.isListening = true;
        toggleVoiceBtn.classList.add("recording");
        voiceButtonLabel.textContent = window.tOr("stop_voice_assistant", "Stop Voice Assistant");
        console.log("Speech recognition started.");
        window.clearTimeoutTimer();
        window.startTimeoutTimer();
      } catch (e) {
        console.error("Error starting recognition:", e);
        if (e.name === "SecurityError") {
          window.appendVoiceMessage(window.tOr("voice_permission_denied", "Microphone access denied."));
          window.stopRecognition();
        }
      }
    }
  };

  window.stopRecognition = function () {
    if (recognition && window.isListening) {
      recognition.stop();
      window.isListening = false;
      toggleVoiceBtn.classList.remove("recording");
      voiceButtonLabel.textContent = window.tOr("start_voice_assistant", "Start Voice Assistant");
      console.log("Speech recognition stopped.");
      window.clearTimeoutTimer();
      window.retryCount = 0;
      speechSynthesis.cancel();
    }
  };

  function getRecognitionLanguage(appLang) {
    switch (appLang) {
      case "hindi": return "hi-IN";
      case "marathi": return "mr-IN";
      default: return "en-US";
    }
  }

  // --- Timeout ---
  window.startTimeoutTimer = function () {
    window.clearTimeoutTimer();
    window.timeoutTimer = setTimeout(() => {
      window.handleTimeout();
    }, 30000);
  };
  window.clearTimeoutTimer = function () {
    if (window.timeoutTimer) {
      clearTimeout(window.timeoutTimer);
      window.timeoutTimer = null;
    }
  };
  window.handleTimeout = function () {
    window.retryCount++;
    if (window.retryCount <= window.MAX_RETRIES) {
      window.speakBotMessage(window.tOr("voice_cannot_understand", "I can't understand. Please say again."), () => {
        if (window.isListening) window.startRecognition();
      });
      window.startTimeoutTimer();
    } else {
      window.speakBotMessage(window.tOr("voice_auto_stop", "Auto-stopping voice assistant."), () => {
        window.stopRecognition();
        window.voiceFlowState = { currentFlow: null, bookingStep: 0, bookingData: {}, flowHistory: [] };
        window.appendVoiceMessage(window.tOr("voice_initial_prompt", "Please click on the Start Voice Assistant button to begin."));
      });
    }
  };

  // --- Process input ---
  window.processUserVoiceInput = async function (transcript) {
    window.clearTimeoutTimer();
    window.appendVoiceMessage(transcript, true);
    const lowerTranscript = transcript.toLowerCase();
    const lang = window.currentLang;

    const mainMenuKeywords = {
      booking: {
        english: ["booking", "book appointment"],
        hindi: ["बुकिंग", "अपॉइंटमेंट बुक"],
        marathi: ["बुकिंग", "अपॉइंटमेंट बुक"]
      },
      myAppointments: {
        english: ["my appointment", "appointments"],
        hindi: ["मेरी अपॉइंटमेंट", "अपॉइंटमेंट्स"],
        marathi: ["अपॉइंटमेंट", "अपॉइंटमेंट्स"]
      },
      generalQuery: {
        english: ["general query", "question"],
        hindi: ["प्रश्न", "सवाल"],
        marathi: ["प्रश्न"]
      }
    };

    if (!window.voiceFlowState.currentFlow) {
      if (mainMenuKeywords.booking[lang].some(k => lowerTranscript.includes(k))) {
        window.voiceFlowState.currentFlow = "booking";
        window.voiceFlowState.bookingStep = 0;
        window.voiceFlowState.flowHistory.push({ flow: "booking", step: 0 });
        window.appendVoiceMessage(window.tOr("flow_booking_msg", "Starting Booking Appointment…"));
        window.speakBotMessage(window.tOr("flow_booking_msg", "Starting Booking Appointment…"), () => {
          if (window.VoiceBookingFlow?.handleStep) {
            voiceMessages.innerHTML = "";
            window.VoiceBookingFlow.handleStep();
          }
        });
      } else if (mainMenuKeywords.myAppointments[lang].some(k => lowerTranscript.includes(k))) {
        window.voiceFlowState.currentFlow = "appointments";
        window.voiceFlowState.flowHistory.push({ flow: "appointments" });
        window.appendVoiceMessage(window.tOr("flow_my_appointment_msg", "Starting My Appointment…"));
        window.speakBotMessage(window.tOr("flow_my_appointment_msg_speak", "Starting My Appointment…"), () => {
          if (window.VoiceMyAppointmentsFlow?.handleInput) {
            voiceMessages.innerHTML = "";
            window.VoiceMyAppointmentsFlow.handleInput(lowerTranscript);
          }
        });
      } else if (mainMenuKeywords.generalQuery[lang].some(k => lowerTranscript.includes(k))) {
        window.voiceFlowState.currentFlow = "general";
        window.voiceFlowState.flowHistory.push({ flow: "general" });
        window.appendVoiceMessage(window.tOr("flow_general_msg", "Starting General Query…"));
        window.speakBotMessage(window.tOr("flow_general_msg_speak", "Starting General Query…"), () => {
          if (window.VoiceGeneralQueryFlow?.handleInput) {
            voiceMessages.innerHTML = "";
            window.VoiceGeneralQueryFlow.handleInput(lowerTranscript);
          }
        });
      } else {
        window.handleInvalidOption();
      }
    } else {
      switch (window.voiceFlowState.currentFlow) {
        case "booking": window.VoiceBookingFlow?.handleInput?.(lowerTranscript); break;
        case "appointments": window.VoiceMyAppointmentsFlow?.handleInput?.(lowerTranscript); break;
        case "general": window.VoiceGeneralQueryFlow?.handleInput?.(lowerTranscript); break;
      }
    }
    window.startTimeoutTimer();
  };

  window.handleInvalidOption = function () {
    window.speakBotMessage(window.tOr("voice_invalid_option", "That is a wrong option. Please choose again."), () => {
      if (window.isListening) window.startRecognition();
    });
  };

  // --- UI Labels ---
  function applyVoiceLabels() {
    if (!window.t) return;
    if (hospitalNameVoicePage) hospitalNameVoicePage.textContent = window.tOr("hospital_name", "XYZ Hospital");
    if (currentLangPillVoice) {
      const langName = window.t["lang_" + window.currentLang] || window.currentLang;
      currentLangPillVoice.textContent = window.tOr("lang_pill", "Language") + ": " + langName;
    }
    if (voiceHomeBtn) voiceHomeBtn.textContent = window.tOr("back_home_title", "Home");
    if (voiceHeading) voiceHeading.textContent = window.tOr("voice_assistant_title", "Voice Assistant");
    if (voiceButtonLabel) voiceButtonLabel.textContent = window.tOr("start_voice_assistant", "Start Voice Assistant");
    if (voiceBackToPrevStepBtn) voiceBackToPrevStepBtn.textContent = window.tOr("back_to_prev_step", "← Back");
    if (voiceChatAssistantBtn) voiceChatAssistantBtn.textContent = window.tOr("chat_assistant_title", "Chat Assistant");
    if (voiceMainMenuBtn) voiceMainMenuBtn.textContent = window.tOr("back_home_title", "Main Menu");
  }

  // --- Initialization ---
  document.addEventListener("DOMContentLoaded", async () => {
    await window.loadTranslations();
    hospitalNameVoicePage = document.getElementById("hospitalNameVoicePage");
    currentLangPillVoice = document.getElementById("currentLangPillVoice");
    voiceHomeBtn = document.getElementById("voiceHomeBtn");
    voiceHeading = document.getElementById("voiceHeading");
    voiceMessages = document.getElementById("voiceMessages");
    toggleVoiceBtn = document.getElementById("toggleVoiceBtn");
    voiceButtonLabel = document.getElementById("voiceButtonLabel");
    voiceBackToPrevStepBtn = document.getElementById("voiceBackToPrevStepBtn");
    voiceChatAssistantBtn = document.getElementById("voiceChatAssistantBtn");
    voiceMainMenuBtn = document.getElementById("voiceMainMenuBtn");
    applyVoiceLabels();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onresult = (event) => {
        const speechResult = event.results[event.results.length - 1][0].transcript;
        console.log("Speech Result:", speechResult);
        window.processUserVoiceInput(speechResult);
      };
      recognition.onerror = (event) => {
        console.error("Recognition error:", event.error);
        if (event.error === "no-speech" && window.isListening) {
          window.handleTimeout();
        }
      };
      recognition.onend = () => {
        console.log("Recognition ended. isListening:", window.isListening);
        if (window.isListening && window.voiceFlowState.currentFlow !== null) {
          window.startRecognition();
        }
      };
    } else {
      window.appendVoiceMessage(window.tOr("voice_not_supported", "Voice recognition not supported. Use Chrome/Edge."));
      toggleVoiceBtn.disabled = true;
    }

    speechSynthesis = window.speechSynthesis;
    if (speechSynthesis) {
      speechSynthesis.getVoices();
      speechSynthesis.onvoiceschanged = () => console.log("Voices loaded/changed");
    }

    toggleVoiceBtn?.addEventListener("click", toggleVoiceAssistant);

    // Navigation buttons
    voiceHomeBtn?.addEventListener("click", () => {
      window.stopRecognition();
      window.voiceFlowState = { currentFlow: null, bookingStep: 0, bookingData: {}, flowHistory: [] };
      window.location.href = "/assistant";
    });
    voiceChatAssistantBtn?.addEventListener("click", () => {
      window.stopRecognition();
      window.voiceFlowState = { currentFlow: null, bookingStep: 0, bookingData: {}, flowHistory: [] };
      window.location.href = `/chat?lang=${window.currentLang}`;
    });
    voiceMainMenuBtn?.addEventListener("click", () => {
      window.stopRecognition();
      window.voiceFlowState = { currentFlow: null, bookingStep: 0, bookingData: {}, flowHistory: [] };
      voiceMessages.innerHTML = "";
      askInitialQuestion();
      window.appendVoiceMessage(window.tOr("voice_main_menu_return", "Returned to main menu."));
    });

    window.appendVoiceMessage(window.tOr("voice_initial_prompt", "Please click on the Start Voice Assistant button to begin."));
  });

  // --- Toggle Voice Assistant ---
  function toggleVoiceAssistant() {
    if (window.isListening) {
      window.stopRecognition();
      window.appendVoiceMessage(window.tOr("voice_assistant_stopped", "Voice assistant stopped."));
      window.voiceFlowState = { currentFlow: null, bookingStep: 0, bookingData: {}, flowHistory: [] };
      window.appendVoiceMessage(window.tOr("voice_initial_prompt", "Please click on the Start Voice Assistant button to begin."));
    } else {
      voiceMessages.innerHTML = "";
      window.appendVoiceMessage(window.tOr("voice_assistant_started", "Voice assistant started. Listening..."));
      window.voiceFlowState = { currentFlow: null, bookingStep: 0, bookingData: {}, flowHistory: [] };
      window.startRecognition();
      setTimeout(askInitialQuestion, 1000);
    }
  }

  function askInitialQuestion() {
    window.appendVoiceMessage(window.tOr("voice_welcome_prompt", "What do you want: booking appointment, my appointments, or general query?"));
    window.speakBotMessage(window.tOr("voice_welcome_prompt_speak", "What do you want: booking appointment, my appointments, or general query?"), () => {
      if (window.isListening) window.startRecognition();
    });
  }

  // ✅ Expose globally
  window.toggleVoiceAssistant = toggleVoiceAssistant;
  window.askInitialQuestion = askInitialQuestion;

})(); // end IIFE
