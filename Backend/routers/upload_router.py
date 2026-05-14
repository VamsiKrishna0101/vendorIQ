from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from services.upload_service import UploadService
from typing import List
from utils.auth import get_current_user
from models.User import User

router=APIRouter(prefix="/upload",tags=["upload"])
upload_service=UploadService()

@router.post("/")
async def upload_files(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    try:
        res=await upload_service.upload_documents(files)
        return {"status":"success","data":res}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500,detail=str(e))