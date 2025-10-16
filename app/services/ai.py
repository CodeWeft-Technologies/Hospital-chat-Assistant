import json
from pathlib import Path
import re
import difflib
from deep_translator import GoogleTranslator
from datetime import datetime

# --- Paths ---
BASE_DIR = Path(__file__).resolve().parent.parent
HOSP_FILE = BASE_DIR / "data" / "hospital_info.json"

with HOSP_FILE.open(encoding="utf-8") as f:
    HOSP_DATA = json.load(f)

# Map friendly language names to ISO codes
LANG_CODE_MAP = {
    "english": "en",
    "hindi": "hi",
    "marathi": "mr",
}

# --- Simple in-memory translation cache 🚀 ---
_translation_cache = {}

def _fast_translate(text: str, source: str, target: str) -> str:
    """Cached + fallback translation"""
    if not text or source == target:
        return text
    cache_key = (text, source, target)
    if cache_key in _translation_cache:
        return _translation_cache[cache_key]
    try:
        translated = GoogleTranslator(source=source, target=target).translate(text)
        _translation_cache[cache_key] = translated
        return translated
    except Exception:
        return text  # fallback

# --- Pick correct language field ---
def pick_lang(val, user_lang="english"):
    """Pick user language text from multilingual dict"""
    if isinstance(val, dict):
        # keys in hospital_info.json are english/hindi/marathi
        return val.get(user_lang.lower(), val.get("english", "")) or ""
    return val or ""

# --- Symptom → Department mapping ---
SYMPTOM_MAP = {
    # General Medicine
    "fever": "General Medicine","cold": "General Medicine","cough": "General Medicine",
    "headache": "General Medicine","vomiting": "General Medicine",
    "बुखार": "General Medicine","सर्दी": "General Medicine","खाँसी": "General Medicine",
    "सरदर्द": "General Medicine","उल्टी": "General Medicine",
    "ताप": "General Medicine","खोकला": "General Medicine","डोकेदुखी": "General Medicine",
    "ओकणे": "General Medicine",

    # Cardiology
    "chest pain": "Cardiology","heart pain": "Cardiology","breathing issue": "Cardiology",
    "palpitation": "Cardiology","blood pressure": "Cardiology",
    "सीने में दर्द": "Cardiology","दिल का दर्द": "Cardiology","सांस लेने में तकलीफ": "Cardiology",
    "धड़कन तेज": "Cardiology","ब्लड प्रेशर": "Cardiology",
    "छातीत दुखणे": "Cardiology","हृदय वेदना": "Cardiology","श्वास घेण्यास त्रास": "Cardiology",
    "धडधड वाढणे": "Cardiology","रक्तदाब": "Cardiology",

    # Orthopedics
    "fracture": "Orthopedics","bone pain": "Orthopedics","joint pain": "Orthopedics",
    "swelling leg": "Orthopedics","back pain": "Orthopedics",
    "हड्डी टूटना": "Orthopedics","हड्डी में दर्द": "Orthopedics","जोड़ दर्द": "Orthopedics",
    "पीठ दर्द": "Orthopedics","सूजन": "Orthopedics",
    "हाड मोडणे": "Orthopedics","हाड दुखणे": "Orthopedics","सांधेदुखी": "Orthopedics",
    "पाठदुखी": "Orthopedics","सुज": "Orthopedics",
}

# --- Synonyms for departments ---
DEPT_SYNONYMS = {
    "General Medicine": {
        "general medicine","physician","gp","general","medicine","internal medicine","family doctor",
        "जनरल मेडिसिन","सामान्य विभाग","सामान्य चिकित्सा","फॅमिली डॉक्टर"
    },
    "Cardiology": {
        "cardiology","cardiologist","heart","cardio","heart specialist","heart doctor",
        "हृदय रोग विशेषज्ञ","दिल का डॉक्टर","हृदय विभाग","कार्डिओलॉजी","कार्डिओलॉजि","हृदयशास्त्र","हृदय तज्ञ"
    },
    "Orthopedics": {
        "orthopedics","ortho","bone","joint","fracture","bone specialist","orthopedic doctor",
        "हड्डी रोग","हड्डी डॉक्टर","हाड विभाग","सांधे तज्ञ","ऑर्थोपेडिक्स","ऑर्थो डॉक्टर"
    },
}

# --- Intent keywords ---
INTENT_KEYWORDS = {
    "timings": {
        "time","timing","hours","visiting","open","closing","schedule","when","working hours",
        "समय","घंटे","टाइम","खुलने का समय","बंद होने का समय","कब खुलता","कब बंद",
        "वेळ","भेट","दर्शनाची वेळ","उघडण्याची वेळ","बंद होण्याची वेळ","कधी उघडतं","कधी बंद"
    },
    "departments": {
        "department","specialities","specialty","unit","ward","clinic","specialization",
        "विभाग","विशेषता","शाखा","डिपार्टमेंट","वॉर्ड","युनिट","क्लिनिक","विशेषज्ञता",
        "विभाग","विशेषता","शाखा","वॉर्ड","युनिट","क्लिनिक"
    },
    "doctors": {
        "doctor","physician","specialist","consultant","dr","md","who is doctor","meet","see","consult",
        "appointment with","अपॉइंटमेंट","मिलना","भेंट","भेटायचे","भेटणे","डॉक्टर","चिकित्सक",
        "तज्ञ","सलाहकार","डॉ","वैद्य","डॉक्टर कौन","डॉक्टर जानकारी","डॉक्टर माहिती",
        "डॉक्टर","चिकित्सक","तज्ञ","सलाहकार","डॉ","वैद्य"
    },
    "services": {
        "service","facility","support","amenities","helpdesk","available","ambulance","ambulances",
        "emergency service","pharmacy","lab","parking","insurance","cashless",
        "सेवा","सुविधा","मदद","सपोर्ट","फॅसिलिटी","रुग्णवाहिका","ऍम्ब्युलन्स","आपत्कालीन सेवा",
        "अॅम्ब्युलन्स सेवा","फार्मेसी","लैब","पार्किंग","बीमा","कैशलेस",
        "सेवा","सुविधा","मदत","सपोर्ट","फॅसिलिटी","रुग्णवाहिका","फार्मसी","लॅब","पार्किंग","विमा"
    },
    "process": {
        "book","appointment","cancel","edit","change","reschedule","modify","register","how to book",
        "बुकिंग","अपॉइंटमेंट","रद्द","सुधारणे","बदलणे","नोंदणी","बुक","रजिस्टर","कॅन्सल",
        "रीशेड्यूल","कैसे मिलूं","कैसे मिलें","कसा भेटू","कसे भेटायचे","कैसे बुक करें",
        "बुकिंग","अपॉइंटमेंट","रद्द","सुधारणे","बदलणे","नोंदणी","कसे बुक करायचे"
    },
    "contact": {
        "contact","phone","email","address","location","map","reach","connect","call","number",
        "संपर्क","फोन","नंबर","पता","स्थान","जगह","लोकेशन","ईमेल","पत्ता","पहुंच","कनेक्ट",
        "संपर्क क्रमांक","पत्ता माहिती","कॉल","नंबर",
        "संपर्क","फोन","नंबर","पत्ता","स्थान","ईमेल","कॉल","नंबर"
    },
    "fees": {
        "fees","cost","price","charge","payment","money","rupees","consultation fee","doctor fee",
        "शुल्क","कीमत","दाम","भुगतान","पैसे","रुपये","परामर्श शुल्क","डॉक्टर शुल्क",
        "फी","किंमत","दाम","पेमेंट","पैसे","रुपये","सल्लागार शुल्क","डॉक्टर शुल्क"
    },
    "documents": {
        "documents","papers","id","proof","insurance","card","reports","medical reports","what to bring",
        "दस्तावेज","कागज","पहचान","प्रूफ","बीमा","कार्ड","रिपोर्ट","चिकित्सा रिपोर्ट","क्या लाना",
        "कागदपत्रे","पेपर्स","ओळखपत्र","प्रूफ","विमा","कार्ड","अहवाल","वैद्यकीय अहवाल","काय आणावे"
    },
    "emergency": {
        "emergency","urgent","help","ambulance","trauma","accident","critical","immediate",
        "आपातकाल","जरूरी","मदद","रुग्णवाहिका","ट्रॉमा","दुर्घटना","गंभीर","तत्काल",
        "आपत्कालीन","गरजेचे","मदत","रुग्णवाहिका","ट्रॉमा","अपघात","गंभीर","तत्काळ"
    },
}

# --- Normalization helpers ---
def _norm(s: str) -> str:
    s = s.lower().strip()
    # keep latin, devanagari, digits, spaces
    s = re.sub(r"[^0-9a-z\u0900-\u097F\s\.\-]", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s

def _tokens(s: str):
    return _norm(s).split()

def _has_intent(q_en: str, intent: str, threshold: float=0.85) -> bool:
    words = _tokens(q_en)
    keys = INTENT_KEYWORDS[intent]
    for key in keys:
        if key in q_en:
            return True
        for w in words:
            if difflib.SequenceMatcher(None, key, w).ratio() >= threshold:
                return True
    return False

def _best_department_match(q_en: str, threshold: float=0.65) -> str|None:
    qn = _norm(q_en)
    best, score = None, 0
    for dept in HOSP_DATA["departments"]:
        dept_name_en = pick_lang(dept["name"], "english")
        cand_set = {dept_name_en.lower()} | DEPT_SYNONYMS.get(dept_name_en, set())
        for cand in cand_set:
            for w in qn.split():
                sc = difflib.SequenceMatcher(None, cand, w).ratio()
                if sc > score:
                    best, score = dept_name_en, sc
    return best if score >= threshold else None

# ---------- Doctor index & matching ----------
def _clean_doctor_name(s: str) -> str:
    s = _norm(s)
    s = s.replace("dr.", " ").replace("dr ", " ")
    s = re.sub(r"\s+", " ", s).strip()
    return s

# Build an index of doctor names (across languages) → (dept, doc)
DOCTOR_INDEX = []
for dept in HOSP_DATA["departments"]:
    dept_key = pick_lang(dept["name"], "english")
    for doc in dept.get("doctors", []):
        # name can be dict or string
        names = []
        if isinstance(doc.get("name"), dict):
            names.extend(doc["name"].values())
        else:
            names.append(str(doc.get("name", "")))
        # also add without "Dr"
        cleaned = [_clean_doctor_name(n) for n in names]
        for n in set(names + cleaned):
            if n:
                DOCTOR_INDEX.append({
                    "match_key": _clean_doctor_name(n),
                    "dept_key": dept_key,
                    "dept": dept,
                    "doc": doc
                })

# plus a quick map to search by strong fuzzy match
def _match_doctor(q_text: str, threshold: float = 0.82):
    qn = _clean_doctor_name(q_text)
    best = None
    best_score = 0.0
    for entry in DOCTOR_INDEX:
        mk = entry["match_key"]
        # direct containment helps "meet dr khan"
        if mk and (mk in qn or qn in mk):
            return entry
        sc = difflib.SequenceMatcher(None, mk, qn).ratio()
        if sc > best_score:
            best_score = sc
            best = entry
    if best and best_score >= threshold:
        return best
    # token-wise fallback: try each token window
    for tok in qn.split():
        if not tok or len(tok) < 3:
            continue
        for entry in DOCTOR_INDEX:
            sc = difflib.SequenceMatcher(None, entry["match_key"], tok).ratio()
            if sc > 0.92:
                return entry
    return None

def _extract_named_doctor(q_text: str):
    """
    Try to extract something like 'dr khan' / 'डॉ खान' / 'doctor priya' etc.
    Returns best matched doctor entry or None.
    """
    qt = _norm(q_text)
    # common markers preceding names
    patterns = [
        r"(dr\.?\s+[a-z\u0900-\u097F\-]+(?:\s+[a-z\u0900-\u097F\-]+)?)",
        r"(doctor\s+[a-z\u0900-\u097F\-]+)",
        r"(डॉ\.?\s*[a-z\u0900-\u097F\-]+)",
    ]
    candidates = []
    for p in patterns:
        for m in re.finditer(p, qt, flags=re.IGNORECASE):
            candidates.append(m.group(1))
    # also try last two words (e.g., "meet khan", "मिलना खान")
    words = qt.split()
    if len(words) >= 2:
        candidates.append(" ".join(words[-2:]))

    # direct match over candidates
    for c in candidates:
        m = _match_doctor(c)
        if m:
            return m
    # as a final attempt, try full text
    return _match_doctor(qt)

# Format doctor payload
def _doctor_payload(doc, dept, user_lang="english"):
    return {
        "name": pick_lang(doc.get("name"), user_lang),
        "qualification": pick_lang(doc.get("qualification"), user_lang),
        "experience": doc.get("experience", ""),
        "fees": doc.get("fees", dept.get("fees")),
        "timings": pick_lang(doc.get("timings"), user_lang)
    }

# ---------- Main function ----------
def get_general_query_answer(question: str, user_lang="english") -> dict:
    user_lang_code = LANG_CODE_MAP.get(user_lang.lower(), "en")

    # Step 1: translate to English for logic
    q_en = _fast_translate(question, user_lang_code, "en").strip()
    q_norm = _norm(q_en)
    result = None

    # 0) Try strong doctor-name intent: "I want to meet Dr Khan" / "डॉ खान से मिलना है" / "डॉ खान कसे भेटायचे"
    direct_doc_hit = _extract_named_doctor(q_en)
    if direct_doc_hit:
        dept = direct_doc_hit["dept"]
        doc = direct_doc_hit["doc"]
        dept_key = pick_lang(dept["name"], "english")

        steps_dict = HOSP_DATA.get("appointment_process", {}).get("booking", {})
        if isinstance(steps_dict, dict):
            steps = steps_dict.get(user_lang.lower(), steps_dict.get("english", []))
        else:
            steps = steps_dict or []

        result = {
            "type": "doctors",  # keep existing frontend renderer
            "department": pick_lang(dept["name"], user_lang),
            "department_key": dept_key,
            "fees": dept.get("fees"),
            "doctors": [
                _doctor_payload(doc, dept, user_lang=user_lang)
            ],
            # extra helpful fields (frontend may ignore safely)
            "process": {
                "action": "booking",
                "steps": steps
            },
            "tips": {
                "note": {
                    "english": "Bring previous reports and arrive 10 minutes early.",
                    "hindi": "पिछली रिपोर्ट साथ लाएँ और 10 मिनट पहले पहुँचे।",
                    "marathi": "मागील अहवाल सोबत आणा आणि 10 मिनिटे लवकर या."
                }.get(user_lang.lower(), "Bring previous reports and arrive 10 minutes early.")
            }
        }
        return result

    # 1) Contact
    if _has_intent(q_norm, "contact"):
        h = HOSP_DATA["hospital"]
        result = {
            "type":"contact",
            "name": pick_lang(h["name"], user_lang),
            "address": pick_lang(h["address"], user_lang),
            "phone": h["phone"],
            "email": h["email"],
            "website": h["website"]
        }

    # 2) Timings
    elif _has_intent(q_norm, "timings"):
        t = HOSP_DATA["hospital"]["timings"]
        result = {
            "type":"timings",
            "opd": pick_lang(t["general_opd"], user_lang),
            "emergency": pick_lang(t["emergency"], user_lang),
            "visiting": pick_lang(t["visiting_hours"], user_lang)
        }

    # 3) Departments
    elif _has_intent(q_norm, "departments"):
        result = {
            "type":"departments",
            "departments":[pick_lang(d["name"], user_lang) for d in HOSP_DATA["departments"]],
            "departments_key":[pick_lang(d["name"], "english") for d in HOSP_DATA["departments"]]
        }

    # 4) Doctors (generic or dept-specific)
    elif _has_intent(q_norm, "doctors"):
        dept_name = _best_department_match(q_norm)
        if dept_name:
            dept = next(d for d in HOSP_DATA["departments"] if pick_lang(d["name"], "english") == dept_name)
            result = {
                "type":"doctors",
                "department": pick_lang(dept["name"], user_lang),
                "department_key": dept_name,
                "fees": dept.get("fees"),
                "doctors":[_doctor_payload(doc, dept, user_lang) for doc in dept.get("doctors", [])]
            }
        else:
            all_docs = []
            for dept in HOSP_DATA["departments"]:
                for doc in dept.get("doctors", []):
                    d = _doctor_payload(doc, dept, user_lang)
                    d["department"] = pick_lang(dept["name"], user_lang)
                    d["department_key"] = pick_lang(dept["name"], "english")
                    all_docs.append(d)
            result = {"type":"doctors","department":"All","doctors":all_docs}

    # 5) Services
    elif _has_intent(q_norm, "services"):
        matched = None
        if "ambulance" in q_norm or "रुग्णवाहिका" in q_norm or "एम्बुलेंस" in q_norm:
            for key in HOSP_DATA["services"].keys():
                if "ambulance" in key.lower():
                    matched = {key: pick_lang(HOSP_DATA["services"][key], user_lang)}
                    break
        elif "pharmacy" in q_norm or "फार्मेसी" in q_norm:
            for key in HOSP_DATA["services"].keys():
                if "pharmacy" in key.lower():
                    matched = {key: pick_lang(HOSP_DATA["services"][key], user_lang)}
                    break
        elif "lab" in q_norm or "लैब" in q_norm or "लॅब" in q_norm:
            for key in HOSP_DATA["services"].keys():
                if "lab" in key.lower():
                    matched = {key: pick_lang(HOSP_DATA["services"][key], user_lang)}
                    break
        elif "parking" in q_norm or "पार्किंग" in q_norm:
            result = {"type": "text", "answer": {
                "english": "Yes, we have free parking facilities for patients and visitors. The parking area is located in front of the main building.",
                "hindi": "हाँ, हमारे पास रोगियों और आगंतुकों के लिए निःशुल्क पार्किंग सुविधा है। पार्किंग क्षेत्र मुख्य भवन के सामने स्थित है।",
                "marathi": "होय, आमच्याकडे रुग्ण आणि भेट देणाऱ्यांसाठी विनामूल्य पार्किंग सुविधा आहे. पार्किंग क्षेत्र मुख्य इमारतीच्या समोर आहे."
            }.get(user_lang.lower(), "Yes, we have free parking facilities for patients and visitors.")}
        elif "insurance" in q_norm or "बीमा" in q_norm or "विमा" in q_norm:
            for key in HOSP_DATA["services"].keys():
                if "insurance" in key.lower():
                    matched = {key: pick_lang(HOSP_DATA["services"][key], user_lang)}
                    break
        
        if matched:
            result = {"type": "services", "services": matched, "services_key": list(matched.keys())}
        elif not result:
            result = {"type": "services",
                      "services": {k: pick_lang(v, user_lang) for k,v in HOSP_DATA["services"].items()},
                      "services_key": list(HOSP_DATA["services"].keys())}

    # 6) Process (book/edit/cancel)
    elif _has_intent(q_norm, "process"):
        action = "booking"
        if "cancel" in q_norm or "रद्द" in q_norm or "रद्द करें" in q_norm:
            action = "cancel"
        elif "edit" in q_norm or "change" in q_norm or "बदल" in q_norm or "modify" in q_norm or "रीशेड्यूल" in q_norm:
            action = "edit"

        steps_dict = HOSP_DATA["appointment_process"][action]
        if isinstance(steps_dict, dict):
            steps = steps_dict.get(user_lang.lower(), steps_dict.get("english", []))
        else:
            steps = steps_dict

        result = {"type":"process","action":action,"steps":steps}

    # 6.5) Fees
    elif _has_intent(q_norm, "fees"):
        result = {"type": "text", "answer": {
            "english": "Consultation fees vary by department: General Medicine - ₹400, Cardiology - ₹600, Orthopedics - ₹500. Emergency consultation is ₹800.",
            "hindi": "परामर्श शुल्क विभाग के अनुसार भिन्न होता है: जनरल मेडिसिन - ₹400, कार्डियोलॉजी - ₹600, ऑर्थोपेडिक्स - ₹500। आपातकालीन परामर्श ₹800 है।",
            "marathi": "सल्लागार शुल्क विभागानुसार बदलते: जनरल मेडिसिन - ₹400, कार्डिओलॉजी - ₹600, ऑर्थोपेडिक्स - ₹500. आपत्कालीन सल्लागार ₹800 आहे."
        }.get(user_lang.lower(), "Consultation fees vary by department.")}

    # 6.6) Documents
    elif _has_intent(q_norm, "documents"):
        result = {"type": "text", "answer": {
            "english": "Please bring your ID proof, insurance card (if applicable), previous medical reports, and any current medications you are taking.",
            "hindi": "कृपया अपना पहचान पत्र, बीमा कार्ड (यदि लागू हो), पिछली चिकित्सा रिपोर्ट, और आपके द्वारा ली जा रही कोई भी वर्तमान दवाएं लाएं।",
            "marathi": "कृपया आपले ओळखपत्र, विमा कार्ड (लागू असल्यास), मागील वैद्यकीय अहवाल आणि आपण घेत असलेली कोणतीही सध्याची औषधे आणा."
        }.get(user_lang.lower(), "Please bring your ID proof and medical documents.")}

    # 6.7) Emergency
    elif _has_intent(q_norm, "emergency"):
        result = {"type": "text", "answer": {
            "english": "For emergencies, call +91 9921142657 immediately. We provide 24/7 emergency services including trauma care, cardiac emergency, stroke care, and general emergency treatment.",
            "hindi": "आपातकाल के लिए, तुरंत +91 9921142657 पर कॉल करें। हम 24/7 आपातकालीन सेवाएं प्रदान करते हैं जिसमें ट्रॉमा केयर, कार्डियक इमरजेंसी, स्ट्रोक केयर, और सामान्य आपातकालीन उपचार शामिल है।",
            "marathi": "आपत्कालीन परिस्थितीसाठी, ताबडतोब +91 9921142657 वर कॉल करा. आम्ही २४/७ आपत्कालीन सेवा पुरवतो ज्यामध्ये ट्रॉमा केअर, कार्डियक इमरजन्सी, स्ट्रोक केअर आणि सामान्य आपत्कालीन उपचार समाविष्ट आहे."
        }.get(user_lang.lower(), "For emergencies, call +91 9921142657 immediately.")}

    # 7) Symptoms smart-match
    else:
        for sym, dept in SYMPTOM_MAP.items():
            if difflib.SequenceMatcher(None, sym, q_norm).ratio() > 0.8 or sym in q_norm:
                dept_data = next(d for d in HOSP_DATA["departments"] if pick_lang(d["name"], "english") == dept)
                result = {
                    "type":"symptom","symptom":sym,
                    "department": pick_lang(dept_data["name"], user_lang),
                    "department_key": dept,
                    "fees": dept_data.get("fees"),
                    "doctors":[_doctor_payload(doc, dept_data, user_lang) for doc in dept_data.get("doctors", [])]
                }
                break

    # 8) Enhanced FAQ matching with better similarity detection
    if not result:
        best_match_score = 0
        best_faq = None
        
        for f in HOSP_DATA.get("faqs", []):
            qdict = f.get("question", {})
            adict = f.get("answer", {})
            
            # Check all language versions of the question
            for lang_key, qtext in qdict.items():
                # Normalize both question and user input
                qtext_norm = _norm(qtext)
                user_q_norm = _norm(q_en)
                
                # Calculate similarity score
                similarity = difflib.SequenceMatcher(None, qtext_norm, user_q_norm).ratio()
                
                # Also check for keyword overlap
                q_words = set(qtext_norm.split())
                user_words = set(user_q_norm.split())
                keyword_overlap = len(q_words.intersection(user_words)) / max(len(q_words), 1)
                
                # Combined score (weighted)
                combined_score = (similarity * 0.7) + (keyword_overlap * 0.3)
                
                # Check for exact substring match (higher priority)
                if qtext_norm in user_q_norm or user_q_norm in qtext_norm:
                    combined_score = max(combined_score, 0.8)
                
                # Update best match if this is better
                if combined_score > best_match_score and combined_score >= 0.6:
                    best_match_score = combined_score
                    best_faq = f
        
        # If we found a good match, use it
        if best_faq:
            adict = best_faq.get("answer", {})
            if isinstance(adict, dict):
                ans = adict.get(user_lang.lower(), adict.get("english"))
            else:
                ans = adict
            result = {"type": "text", "answer": ans}

    # 9) Absolute fallback → polite “no answer”
    if not result:
        # keep frontend-friendly type
        result = {"type": "text", "answer": {
            "english": "Sorry, I couldn't understand that. Please try rephrasing or ask about departments, doctors, timings, or booking.",
            "hindi": "क्षमा करें, मैं समझ नहीं पाया। कृपया दोबारा पूछें या विभाग, डॉक्टर, समय या बुकिंग के बारे में पूछें।",
            "marathi": "माफ करा, मला समजले नाही. कृपया पुन्हा विचारा किंवा विभाग, डॉक्टर, वेळा किंवा बुकिंगबद्दल विचारा."
        }.get(user_lang.lower(), "Sorry, I couldn't understand that.")}
    return result
