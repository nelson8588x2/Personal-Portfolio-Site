"""
PDF to page images conversion script
Converts PDFs in /public/book/ to JPG images
"""
import fitz  # PyMuPDF
import os

BOOK_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "book")
OUTPUT_DIR = os.path.join(BOOK_DIR, "pages")

def convert_pdf(pdf_path, prefix, dpi=200):
    """Convert each PDF page to JPG"""
    doc = fitz.open(pdf_path)
    count = 0
    for i, page in enumerate(doc):
        mat = fitz.Matrix(dpi / 72, dpi / 72)
        pix = page.get_pixmap(matrix=mat)
        output_path = os.path.join(OUTPUT_DIR, f"{prefix}-{i + 1}.jpg")
        pix.save(output_path)
        count += 1
        print(f"  Converted: {output_path}")
    doc.close()
    return count

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Convert cover PDF
    cover_pdf = os.path.join(BOOK_DIR, "2025徐嘉陽的作品集(頁首頁尾).pdf")
    if os.path.exists(cover_pdf):
        print("Converting cover pages...")
        convert_pdf(cover_pdf, "cover")
    else:
        print(f"Not found: {cover_pdf}")

    # Convert content PDF
    content_pdf = os.path.join(BOOK_DIR, "2025徐嘉陽的作品集(內容).pdf")
    if os.path.exists(content_pdf):
        print("Converting content pages...")
        n = convert_pdf(content_pdf, "content")
        print(f"Converted {n} content pages")
    else:
        print(f"Not found: {content_pdf}")

    print("\nDone! Images saved to:", OUTPUT_DIR)

if __name__ == "__main__":
    main()
