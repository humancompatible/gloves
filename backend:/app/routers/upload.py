# app/routers/upload.py

import os
import pandas as pd
import pickle
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from app.config import shared_resources

router = APIRouter()

# Define an upload directory for saving the files
UPLOAD_DIRECTORY = "uploads"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

@router.post("/upload/dataset")
async def upload_dataset(file: UploadFile = File(...)):
    if file.content_type != "text/csv":
        raise HTTPException(status_code=400, detail="File must be a CSV format.")
    
    file_location = os.path.join(UPLOAD_DIRECTORY, "uploaded_dataset.csv")
    with open(file_location, "wb") as buffer:
        buffer.write(await file.read())
    
    shared_resources["dataset_name"] = file.filename
    # Load and store dataset in shared_resources
    try:
        df = pd.read_csv(file_location)
        if 'Unnamed: 0' in df.columns.tolist():
            df.drop(columns='Unnamed: 0',inplace=True)
        if 'activation' in df.columns.to_list():
            for col in ['activation','offer_id','number_of_seen','offer_duration_months']:
                df[col] = df[col].astype('str')
        
        print(df)
        shared_resources["data"] = df
        return JSONResponse(content={"message": "Dataset uploaded successfully", "columns": list(df.columns)})
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV file: {str(e)}")

@router.post("/upload/test_dataset")
async def upload_dataset(file: UploadFile = File(...)):
    if file.content_type != "text/csv":
        raise HTTPException(status_code=400, detail="File must be a CSV format.")
    
    file_location = os.path.join(UPLOAD_DIRECTORY, "uploaded_test_dataset.csv")
    with open(file_location, "wb") as buffer:
        buffer.write(await file.read())
    
    # Load and store dataset in shared_resources
    try:
        df = pd.read_csv(file_location,index_col=0)
        if 'Unnamed: 0' in df.columns.tolist():
            df.drop(columns='Unnamed: 0',inplace=True)
        if 'activation' in df.columns.to_list():
            for col in ['activation','offer_id','number_of_seen','offer_duration_months']:
                df[col] = df[col].astype('str')
        print(df)
        shared_resources["X_test"] = df
        return JSONResponse(content={"message": "Dataset uploaded successfully", "columns": list(df.columns)})
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV file: {str(e)}")

@router.post("/upload/model")
async def upload_model(file: UploadFile = File(...)):
    if file.content_type != "application/octet-stream":
        raise HTTPException(status_code=400, detail="File must be a pickle format.")
    
    shared_resources["model_name"] = file.filename
    file_location = os.path.join(UPLOAD_DIRECTORY, "uploaded_model.pkl")
    with open(file_location, "wb") as buffer:
        buffer.write(await file.read())
    
    # Load and store model in shared_resources
    try:
        with open(file_location, "rb") as f:
            model = pickle.load(f)
            shared_resources["model"] = model
        return JSONResponse(content={"message": "Model uploaded successfully"})
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading pickle file: {str(e)}")

@router.post("/get-target_name")
async def get_target_name(target_name: str):
  # Convert to list for JSON serialization
    
    shared_resources['target_name'] = target_name
    return {target_name}