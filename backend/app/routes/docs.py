from fastapi import APIRouter, HTTPException
import os

router = APIRouter(prefix="/docs", tags=["docs"])

BASE_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS_INTEGRATIONS_DIR = os.path.abspath(os.path.join(BASE_PATH, "..", "docs", "integrations"))

@router.get("/integration/{slug}")
def get_integration_tutorial(slug: str):
    file_path = os.path.join(DOCS_INTEGRATIONS_DIR, f"{slug}.md")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Tutorial não encontrado.")
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    return {"slug": slug, "content": content}