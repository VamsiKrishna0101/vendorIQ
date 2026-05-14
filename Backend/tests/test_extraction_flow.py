import sys
import os
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the root directory to sys.path so we can import from services, models, etc.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.extract_data_service import ExtractData
from models.Intelligence import Base, Intelligence

async def run_test():
    # 1. Setup In-Memory Database for testing
    print("--- Setting up test database ---")
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    # 2. Get files from the tests/docs folder
    DOCS_DIR = os.path.join("tests", "docs")
    if not os.path.exists(DOCS_DIR):
        print(f"!!! Folder not found: {DOCS_DIR} !!!")
        return
    
    # Get all .txt, .pdf, or .docx files in the directory
    valid_extensions = ('.txt', '.pdf', '.docx', '.md')
    files_to_process = [
        os.path.join(DOCS_DIR, f) for f in os.listdir(DOCS_DIR) 
        if f.lower().endswith(valid_extensions)
    ]
    
    if not files_to_process:
        print(f"!!! No valid document files found in {DOCS_DIR} folder. !!!")
        return

    # Extract vendor names from filenames (e.g., 'aws.txt' -> 'aws')
    vendor_names = [os.path.splitext(os.path.basename(f))[0].title() for f in files_to_process]

    print(f"--- Found {len(files_to_process)} files: {', '.join(vendor_names)} ---")

    try:
        extractor = ExtractData(db)
        
        # 3. Run the extraction flow
        print(f"--- Starting extraction flow ---")
        session_id = "test_flow_" + os.urandom(2).hex()
        
        result = await extractor.extract_data(
            path_lists=files_to_process,
            vendor_names=vendor_names,
            session_id=session_id
        )
        
        print("\n--- Flow Results ---")
        print(f"Session ID: {result.get('session_id')}")
        print(f"Status: {result.get('status')}")
        print(f"Vendors: {', '.join(result.get('vendor_names', []))}")
        
        # 4. Verify Database Persistence
        print("\n--- Verifying Database Records ---")
        records = db.query(Intelligence).filter_by(session_id=session_id).all()
        print(f"Total Analyst Records Found: {len(records)}")
        
        for record in records:
            print(f"[{record.analyst_type}] Status: {record.content.get('status')}, Confidence: {record.confidence}")

    except Exception as e:
        print(f"\n[ERROR] Flow failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Cleanup
        if os.path.exists(test_pdf):
            os.remove(test_pdf)
        db.close()
        print("\n--- Test Finished ---")

if __name__ == "__main__":
    if not os.getenv("GEMINI_API_KEY"):
        print("ERROR: GEMINI_API_KEY not found in .env file.")
    else:
        asyncio.run(run_test())
