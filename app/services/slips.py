import io
import pathlib
import qrcode
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab import rl_config

from ..config import BASE_DIR

# --- Ensure ReportLab uses UTF-8 ---
rl_config.warnOnMissingFontGlyphs = 0
rl_config.defaultEncoding = "utf-8"

# --- Font Registration with Devanagari Support ---
NOTO_SANS_FONT_NAME = "NotoSansDevanagari"
NOTO_SANS_REGISTERED = False

try:
    devanagari_font_path = BASE_DIR / "static" / "fonts" / "NotoSansDevanagari-Regular.ttf"
    fallback_font_path = BASE_DIR / "static" / "fonts" / "NotoSans-Regular.ttf"

    if devanagari_font_path.exists():
        pdfmetrics.registerFont(TTFont(NOTO_SANS_FONT_NAME, str(devanagari_font_path), subfontIndex=0, validate=True))
        NOTO_SANS_REGISTERED = True
        print(f"DEBUG: Registered {devanagari_font_path}")
    elif fallback_font_path.exists():
        pdfmetrics.registerFont(TTFont("NotoSans", str(fallback_font_path), subfontIndex=0, validate=True))
        NOTO_SANS_FONT_NAME = "NotoSans"
        NOTO_SANS_REGISTERED = True
        print(f"DEBUG: Registered fallback {fallback_font_path}")
    else:
        print("DEBUG: No NotoSans font found. Devanagari may not render properly.")

except Exception as e:
    print(f"DEBUG: Error registering fonts: {e}")


# --- Helper Function for Devanagari Digits ---
def convert_to_devanagari_digits(number_str, lang):
    if not NOTO_SANS_REGISTERED or lang not in ["hindi", "marathi"]:
        return str(number_str)

    devanagari_digits_map = {
        "0": "०", "1": "१", "2": "२", "3": "३", "4": "४",
        "5": "५", "6": "६", "7": "७", "8": "८", "9": "९"
    }
    return "".join(devanagari_digits_map.get(ch, ch) for ch in str(number_str))


# --- Time Formatting Function ---
def format_time_with_lang(time_str, lang="en"):
    try:
        hour, minute = map(int, time_str.split(":"))
    except ValueError:
        return time_str

    period = "AM" if hour < 12 else "PM"
    hour_12 = hour % 12 or 12

    if NOTO_SANS_REGISTERED and lang in ["hindi", "marathi"]:
        formatted_time_core = f"{convert_to_devanagari_digits(hour_12, lang)}:{convert_to_devanagari_digits(minute, lang)}"
    else:
        formatted_time_core = f"{hour_12:02}:{minute:02}"

    prefix, suffix = "", ""
    if lang == "english":
        return f"{formatted_time_core}{period}"
    elif lang == "marathi":
        if hour < 12:
            prefix = "सकाळी "
        elif hour < 16:
            prefix = "दुपारी "
        else:
            prefix = "संध्याकाळी "
        suffix = " वाजता"
    elif lang == "hindi":
        if hour < 12:
            prefix = "सुबह "
        elif hour < 16:
            prefix = "दोपहर "
        else:
            prefix = "शाम "
        suffix = " बजे"

    return f"{prefix}{formatted_time_core}{suffix}"


# --- PDF Generation Function ---
def generate_pdf_for_appointment(appt, lang="en"):
    slip_dir = pathlib.Path(BASE_DIR) / "data" / "slips"
    slip_dir.mkdir(parents=True, exist_ok=True)

    appt_id_str = f"XYZ_{appt.get('id', '')}"
    slip_path = slip_dir / f"{appt_id_str}.pdf"

    # --- Get doctor & department localized ---
    from services import data_service_json as ds
    dept_info = next((d for d in ds.list_departments() if d["id"] == appt.get("department_id")), None)
    doc_info = next((d for d in ds.list_doctors(None) if d["id"] == appt.get("doctor_id")), None)

    dept_display = dept_info["name"].get(lang, dept_info["name"]["en"]) if dept_info else appt.get("department", "")
    doc_display = doc_info["name"].get(lang, doc_info["name"]["en"]) if doc_info else appt.get("doctor", "")

    # --- Format date/time properly ---
    time_display = format_time_with_lang(appt.get("time", "00:00"), lang)

    qr_appt_id = convert_to_devanagari_digits(appt_id_str, lang)
    qr_phone = convert_to_devanagari_digits(appt.get("phone", ""), lang)
    qr_date = convert_to_devanagari_digits(appt.get("date", ""), lang)

    qr_data = (
        f"Appointment ID: {qr_appt_id}\n"
        f"Name: {appt.get('name', '')}\n"
        f"Phone: {qr_phone}\n"
        f"Department: {dept_display}\n"
        f"Doctor: {doc_display}\n"
        f"Date: {qr_date}\n"
        f"Time: {time_display}"
    )

    qr_img = qrcode.make(qr_data)
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)

    doc = SimpleDocTemplate(str(slip_path), pagesize=A4)

    # Always use NotoSansDevanagari if available
    display_font = NOTO_SANS_FONT_NAME if NOTO_SANS_REGISTERED else "Helvetica"
    display_bold_font = display_font

    title_style = ParagraphStyle("TitleStyle", fontName=display_bold_font, fontSize=18, leading=22, alignment=TA_CENTER, spaceAfter=6)
    normal_style = ParagraphStyle("NormalStyle", fontName=display_font, fontSize=11, leading=14, alignment=TA_LEFT)
    normal_bold_style = ParagraphStyle("NormalBoldStyle", parent=normal_style, fontName=display_bold_font)

    story = []
    story.append(Paragraph("🏥 <b>Hospital Appointment Slip</b>", title_style))
    story.append(Spacer(1, 0.2 * inch))

    data = [
        [Paragraph("Field", normal_bold_style), Paragraph("Details", normal_bold_style)],
        [Paragraph("Appointment ID", normal_style), Paragraph(qr_appt_id, normal_style)],
        [Paragraph("Name", normal_style), Paragraph(appt.get("name", ""), normal_style)],
        [Paragraph("Phone", normal_style), Paragraph(qr_phone, normal_style)],
        [Paragraph("Department", normal_style), Paragraph(dept_display, normal_style)],
        [Paragraph("Doctor", normal_style), Paragraph(doc_display, normal_style)],
        [Paragraph("Date", normal_style), Paragraph(qr_date, normal_style)],
        [Paragraph("Time", normal_style), Paragraph(time_display, normal_style)],
    ]

    table = Table(data, colWidths=[2.5 * inch, 3.5 * inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#004c99")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("FONTNAME", (0, 0), (-1, -1), display_font),
        ("FONTSIZE", (0, 0), (-1, 0), 12),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
        ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
        ("GRID", (0, 0), (-1, -1), 1, colors.black),
    ]))

    story.append(table)
    story.append(Spacer(1, 0.3 * inch))
    qr_image = Image(qr_buffer, width=1.5 * inch, height=1.5 * inch)
    story.append(Paragraph("<b>🔍 Scan QR for Details</b>", normal_bold_style))
    story.append(qr_image)

    doc.build(story)
    return str(slip_path)
