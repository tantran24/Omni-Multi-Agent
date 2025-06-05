from fastapi import APIRouter, HTTPException
import os
import logging
from fastapi.responses import JSONResponse
from config.config import Config

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/read-pdf")
async def read_pdf(pdf_path: str):
    """
    Read PDF content using PyPDF2 and return the text
    """
    try:
        import PyPDF2

        # Make sure the path starts from the proper location
        if pdf_path.startswith("/uploaded_files/"):
            filename = pdf_path.replace("/uploaded_files/", "")
            pdf_path = os.path.join(Config.UPLOADED_FILES_DIR, filename)

        logger.info(f"Attempting to read PDF from path: {pdf_path}")

        # Check if file exists
        if not os.path.exists(pdf_path):
            logger.error(f"PDF file not found: {pdf_path}")
            raise HTTPException(
                status_code=404, detail=f"PDF file not found: {pdf_path}"
            )

        # Open and read the PDF file
        pdf_text = ""
        with open(pdf_path, "rb") as file:
            reader = PyPDF2.PdfReader(file)
            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                pdf_text += f"\n\n--- Page {page_num + 1} ---\n\n"
                pdf_text += page.extract_text()

        logger.info(f"Successfully extracted {len(pdf_text)} characters from PDF")
        return {"text": pdf_text}

    except ImportError:
        return JSONResponse(
            status_code=500,
            content={
                "detail": "PyPDF2 package not installed. Please install it with 'pip install PyPDF2'"
            },
        )
    except Exception as e:
        logger.error(f"Error reading PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))
