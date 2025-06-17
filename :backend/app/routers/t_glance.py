from fastapi import APIRouter, HTTPException
import logging
from app.config import shared_resources
logging.basicConfig(level=logging.DEBUG)
from app.services.resources_service import load_dataset_and_model
from methods.glance.counterfactual_tree.counterfactual_tree import T_GLANCE
from typing import Union, List
from app.services.resources_t_glance import to_json_structure
from pydantic import BaseModel


router = APIRouter()

# Request model definition
class GlanceRequest(BaseModel):
    split_features: List[str]
    local_cf_method: str

# Endpoint using the request model
@router.post("/run-t_glance",summary="Run T_GLANCE")
async def run_glance(request: GlanceRequest):
    # Extract dataset and model names from shared state
    dataset_name = shared_resources.get("dataset_name")
    model_name = shared_resources.get("model_name")
    
    # Retrieve values from shared state or load them as needed
    train_dataset, data, X_train, y_train, X_test, y_test, affected, _unaffected, model, feat_to_vary, target_name = load_dataset_and_model(dataset_name, model_name)
    num_features = X_train._get_numeric_data().columns.to_list()
    # Prepare arguments for the method
    global_method_args_fit = {"train_dataset": train_dataset}

    # Initialize and fit the T_GLANCE model
    cf_tree = T_GLANCE(model, local_method=request.local_cf_method, split_features=request.split_features)
    cf_tree.fit(data.drop(columns=[target_name]), data[target_name], train_dataset)

    # Partition the group and convert to JSON structure
    node = cf_tree.partition_group(affected.loc[0:10])
    node_json = to_json_structure(node,numeric_features=num_features)
    eff, cost , num = cf_tree.cumulative_leaf_actions()
    node_json['TotalEffectiveness'] = float(round(eff/len(affected.loc[0:10]),2))
    node_json['Cost'] = float(round(cost/eff,2))
    
    # Return the JSON response
    return node_json


