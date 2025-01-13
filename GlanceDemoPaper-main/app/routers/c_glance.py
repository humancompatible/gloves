from fastapi import APIRouter, HTTPException
import logging
from app.config import shared_resources
logging.basicConfig(level=logging.DEBUG)
from app.services.resources_service import load_dataset_and_model
from src.glance.iterative_merges.iterative_merges import C_GLANCE
from typing import List, Optional
from raiutils.exceptions import UserConfigValidationException
from src.glance.iterative_merges.iterative_merges import apply_action_pandas,cumulative
import pandas as pd
import numpy as np
import redis
import json

router = APIRouter()

rd = redis.Redis(host="localhost", port=6379, db=0)

@router.post("/run-c_glance", summary="Run C_GLANCE")
async def run_glance(gcf_size: int, cf_method: str, action_choice_strategy: str, features_to_change: Optional[List[str]] = None):
    cache_key = f"run-c_glance:{shared_resources['dataset_name']}:{shared_resources['model_name']}:{gcf_size}:{cf_method}:{action_choice_strategy}:{features_to_change}"
    cache = rd.get(cache_key)
    if cache:
        print("Cache hit")
        cache_res = json.loads(cache)
        shared_resources["clusters_res"] = {
            int(k): {  # Ensure key is Python int
            "action": pd.Series(v["action"]),
            "effectiveness": v["effectiveness"],
            "cost": v["cost"],
            "size": v["size"]
        }for k, v in cache_res["clusters_res"].items()}
        shared_resources["affected"] = pd.DataFrame(cache_res["affected"])
        shared_resources["affected_clusters"] = pd.DataFrame(cache_res["affected_clusters"])\

        # Change numeric columns to int32 for affected
        numeric_cols_affected = shared_resources["affected"].select_dtypes(include=["number"]).columns
        shared_resources["affected"][numeric_cols_affected] = shared_resources["affected"][numeric_cols_affected].astype("int32")

        # Change numeric columns to int32 for affected_clusters
        numeric_cols_affected_clusters = shared_resources["affected_clusters"].select_dtypes(include=["number"]).columns
        shared_resources["affected_clusters"][numeric_cols_affected_clusters] = shared_resources["affected_clusters"][numeric_cols_affected_clusters].astype("int32")
        # shared_resources["affected_clusters"]['Chosen_Action'] = shared_resources["affected_clusters"]['Chosen_Action'].astype('int64')
        return {"actions": cache_res['actions'],
                    "TotalEffectiveness": cache_res['TotalEffectiveness'],
                    "TotalCost": cache_res['TotalCost'],
                    "affected_clusters": shared_resources["affected_clusters"].to_dict(),
                    "eff_cost_actions": cache_res['eff_cost_actions']} 
    else:
        print(f"Cache key {cache_key} does not exist - Running C_GLANCE Algorithm")
        from src.glance.utils.utils_data import preprocess_datasets, load_models

        data = shared_resources.get("data").copy(deep=True)
        X_test = shared_resources.get("X_test").copy(deep=True)
        affected = shared_resources.get("affected").copy(deep=True)
        model = shared_resources.get("model")
        target_name = shared_resources.get("target_name")

        X_test.rename(columns={"label": "target"},inplace=True)
        
            # Retrieve values from the shared global state
        # train_dataset, data, X_train, y_train, X_test, y_test, affected, _unaffected, model, feat_to_vary, target_name = load_dataset_and_model(dataset_name, model_name)
        features = data.columns.to_list()
        features.remove(target_name)
        feat_to_vary = features_to_change if features_to_change else features

        if action_choice_strategy == 'Max Effectiveness':
            action_choice_strategy = 'max-eff'
        elif action_choice_strategy == 'Min Cost':
            action_choice_strategy = 'low-cost'
        elif action_choice_strategy == 'Mean Action':
            action_choice_strategy = 'mean-act'

        # Initialize and fit C_GLANCE with user-defined parameters
        global_method = C_GLANCE(
            model=model,
            initial_clusters=50,
            final_clusters=gcf_size,
            num_local_counterfactuals=10,
        )

        global_method.fit(
            data.drop(columns=[target_name]),
            data[target_name],
            X_test,
            feat_to_vary,
            cluster_action_choice_algo = action_choice_strategy,
            cf_generator = cf_method
        )
        try:
            clusters, clusters_res, eff, cost = global_method.explain_group(affected.drop(columns='index'))
            shared_resources["clusters"] = clusters
            shared_resources["clusters_res"] = clusters_res
            # actions = []
            # for i in clusters_res:
            #     actions.append(clusters_res[i]['action'].to_dict())
            sorted_actions_dict = dict(sorted(clusters_res.items(), key=lambda item: item[1]['cost']))
            actions = [stats["action"] for i,stats in sorted_actions_dict.items()]
            i=1
            all_clusters = {}
            num_features = X_test._get_numeric_data().columns.to_list()
            cate_features = X_test.columns.difference(num_features)

            for key in clusters:
                clusters[key]['Cluster'] = i
                all_clusters[i] = clusters[key]
                i=i+1

            combined_df = pd.concat(all_clusters.values(), ignore_index=True)
            cluster = combined_df['Cluster']
            combined_df = combined_df.drop(columns='Cluster')
            new_aff = shared_resources['affected'].copy(deep=True)
            new_aff['unique_id'] = new_aff.groupby(list(new_aff.columns.difference(['index']))).cumcount()
            combined_df['unique_id'] = combined_df.groupby(list(combined_df.columns)).cumcount()
            result = combined_df.merge(new_aff, on=list(combined_df.columns) + ['unique_id'], how='left')
            result = result.drop(columns='unique_id')
            eff, cost, pred_list, chosen_actions, costs = cumulative(
                    model,
                    result.drop(columns=['index']),
                    actions,
                    global_method.dist_func_dataframe,
                    global_method.numerical_features_names,
                    global_method.categorical_features_names,
                    "-",
                )
            
            eff_cost_actions = {}
            for i, arr in pred_list.items():
                column_name = f"Action{i}_Prediction"
                result[column_name] = arr
                eff_act = pred_list[i].sum()/len(affected)
                cost_act = costs[i-1][costs[i-1] != np.inf].sum()/pred_list[i].sum()
                eff_cost_actions[i] = {'eff':eff_act , 'cost':cost_act}

            result['Cluster'] = cluster
            
            result['Chosen_Action'] = chosen_actions
            result['Chosen_Action'] = result['Chosen_Action'] + 1
            result = result.replace(np.inf , '-')


            filtered_data = {
                k: {
                    **{
                        'action': {ak: av for ak, av in v['action'].items() if av != 0 and av != '-'}
                    },
                    **{kk: vv for kk, vv in v.items() if kk != 'action'}
                }
                for k, v in sorted_actions_dict.items()
            }
            actions_returned  = [stats["action"] for i,stats in filtered_data.items()]
            shared_resources['affected_clusters'] = result
            serialized_clusters_res = {
                int(k): {  # Convert key to Python int
                    "action": v["action"].to_dict(),
                    "effectiveness": v["effectiveness"],
                    "cost": v["cost"],
                    "size": v["size"]
                }
                for k, v in clusters_res.items()
            }
            cache_ret = {
                "actions": actions_returned,
                "clusters_res": serialized_clusters_res,
                "affected": affected.to_dict(orient='records'),
                "TotalEffectiveness": round(eff/len(affected),2),
                "TotalCost": round(cost/eff,2),
                "affected_clusters": result.to_dict(orient='records'),
                "eff_cost_actions": eff_cost_actions} 
            
            rd.set(cache_key,json.dumps(cache_ret), ex=3600)

            return {"actions": actions_returned,
                    "TotalEffectiveness": round(eff/len(affected),3),
                    "TotalCost": round(cost/eff,2),
                    "affected_clusters": result.to_dict(),
                    "eff_cost_actions": eff_cost_actions} 
        except UserConfigValidationException as e:
            # Handle known Dice error for missing counterfactuals
            if str(e) == "No counterfactuals found for any of the query points! Kindly check your configuration.":
                raise HTTPException(status_code=400, detail="No counterfactuals found for any of the query points! Please select different features.")
            else:
                raise HTTPException(status_code=400, detail=str(e))
