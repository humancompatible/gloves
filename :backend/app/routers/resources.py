from fastapi import APIRouter, HTTPException
from app.services.resources_service import (
    get_available_datasets,
    get_available_models,
    load_dataset_and_model,
)  # Import service functions

import logging
from app.config import shared_resources
import pickle
logging.basicConfig(level=logging.DEBUG)
router = APIRouter()

@router.get("/get-data/")
async def get_data():
    data = shared_resources.get("data")
    X_test = shared_resources.get("X_test")
    model = shared_resources.get("model")
    preds = model.predict(X_test)
    X_test['label'] = preds
    affected = X_test[X_test.label == 0].reset_index()
    affected = affected.drop(columns='label')


    shared_resources["affected"] = affected
    shared_resources["umap_model"] = None
    shared_resources["preprocess_pipeline"] = None
    shared_resources["umap_model_globece"] = None
    shared_resources["preprocess_pipeline_globece"] = None
    shared_resources["method"] = None
    print(data)
    return {
                "data": data.to_dict(orient="records"),
                "X_test": X_test.to_dict(orient="records"),
                "affected": affected.to_dict(orient="records"),
        }

@router.post("/load-dataset-and-model/")
async def load_dataset_and_model_endpoint(dataset_name: str, model_name: str):

    if dataset_name == "Compas Dataset":
        dataset_name = 'compas'
    elif dataset_name == "Default Credit Dataset":
        dataset_name = 'default_credit'
    elif dataset_name == "German Credit Dataset":
        dataset_name = 'german_credit'
    elif dataset_name == "Heloc Dataset":
        dataset_name = 'heloc'

    if model_name == 'XGBoost':
        model_name = 'xgb'
    elif model_name == 'DNN':
        model_name = 'dnn'
    elif model_name == 'LogisticRegression':
        model_name = 'lr'

    logging.debug(f"Loading model: {model_name}")
    try:
        # Call the service to load the dataset and model
        
        train_dataset, data, X_train, y_train, X_test, y_test, _, _unaffected, model, feat_to_vary, target_name,num_features,cate_features = load_dataset_and_model(dataset_name, model_name)
        affected = X_test[X_test.label == 0].reset_index()
        affected = affected.drop(columns='label')
        logging.debug("Model loaded successfully.")

        shared_resources['dataset_name'] = dataset_name
        shared_resources['model_name'] = model_name
        shared_resources["train_dataset"] = train_dataset
        shared_resources["data"] = data
        shared_resources["X_train"] = X_train
        shared_resources["y_train"] = y_train
        shared_resources["X_test"] = X_test
        shared_resources["y_test"] = y_test
        shared_resources["affected"] = affected
        shared_resources["_unaffected"] = _unaffected
        shared_resources["model"] = model
        shared_resources["feat_to_vary"] = feat_to_vary
        shared_resources["target_name"] = target_name
        shared_resources["umap_model"] = None
        shared_resources["preprocess_pipeline"] = None
        shared_resources["umap_model_globece"] = None
        shared_resources["preprocess_pipeline_globece"] = None
        shared_resources["method"] = None
        return {
            # "train_dataset": train_dataset.to_dict(orient="records"),
            "data": data.to_dict(orient="records"),
            # "X_train": X_train.to_dict(orient="records"),
            # "y_train": y_train.to_dict(),
            "X_test": X_test.to_dict(orient="records"),
            # "y_test": y_test.to_dict(),
            "affected": affected.to_dict(orient="records"),
            # "_unaffected": _unaffected.to_dict(orient="records"),
            # #"model": model,
            # "feat_to_vary": feat_to_vary,
            # "target_name": target_name
    }
    except Exception as e:
        logging.error(f"Error loading model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/available-resources/")
async def available_resources():
    try:
        datasets = get_available_datasets()  # Call the service to get datasets
        models = get_available_models()      # Call the service to get models
        return {"datasets": datasets, "models": models}
    except Exception as e:
        return {"error": str(e)}

@router.get("/available-cf-methods/")
async def available_cf_methods():
    return ["Dice", "NearestNeighbors", "RandomSampling"]


@router.get("/available-features")
async def get_available_features():
    train_dataset = shared_resources.get("data")
    if train_dataset is None:
        return {"error": "train_dataset is not loaded. Please load it first."}
    
    features = train_dataset.columns.tolist()  # Convert to list for JSON serialization
    return {"features": features}


@router.get("/available-action-strategies")
async def get_available_action_strats():
  # Convert to list for JSON serialization
    return ["Max Effectiveness", "Min Cost", "Mean Action"]