from pypdf import PdfReader
from docx import Document
import fitz
import pytesseract


def extract_text_from_pdf(file_path: str) -> str:
    reader = PdfReader(file_path)

    text = ""

    for page in reader.pages:
        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

    # If normal PDF extraction found enough text, return it
    if len(text.strip()) > 50:
        return text

    # Otherwise, use OCR for scanned/image-based PDFs
    return extract_text_with_ocr(file_path)


def extract_text_with_ocr(file_path: str) -> str:
    document = fitz.open(file_path)

    text = ""

    for page in document:
        # Render PDF page as an image
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))

        # Convert image to PIL format
        image = pix.pil_image()

        # Extract text using Tesseract OCR
        page_text = pytesseract.image_to_string(image)

        if page_text:
            text += page_text + "\n"

    document.close()

    return text


def extract_text_from_docx(file_path: str) -> str:
    document = Document(file_path)

    text = ""

    for paragraph in document.paragraphs:
        text += paragraph.text + "\n"

    return text


def extract_resume_text(file_path: str) -> str:
    if file_path.lower().endswith(".pdf"):
        return extract_text_from_pdf(file_path)

    if file_path.lower().endswith(".docx"):
        return extract_text_from_docx(file_path)

    raise ValueError("Only PDF and DOCX files are supported.")