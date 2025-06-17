from fastapi import APIRouter, HTTPException
import logging
from app.config import shared_resources
logging.basicConfig(level=logging.DEBUG)
from app.services.resources_service import load_dataset_and_model,get_data
from methods.glance.iterative_merges.iterative_merges import C_GLANCE
from typing import List, Optional
from raiutils.exceptions import UserConfigValidationException
from methods.groupcfe.group_cfe import cumulative
import pandas as pd
import numpy as np
import redis
import json
from methods.glance.counterfactual_costs import build_dist_func_dataframe

router = APIRouter()

rd = redis.Redis(host="localhost", port=6379, db=0)

@router.post("/run-groupcfe", summary="Run GroupCFE")
async def run_groupcfe(gcf_size: int, features_to_change: Optional[List[str]] = None):
    cache_key = f"run-groupcfe:{shared_resources['dataset_name']}:{shared_resources['model_name']}:{gcf_size}"
    cache = rd.get(cache_key)
    if cache:
        print("Cache hit")
        cache_res = json.loads(cache)
        shared_resources["method"] = cache_res["method"]
        shared_resources["clusters_res"] = {
            int(k): {  # Ensure key is Python int
            "action": pd.Series(v["action"]),
            "effectiveness": v["effectiveness"],
            "cost": v["cost"],
        }
        for k, v in cache_res["clusters_res"].items()}
        shared_resources["affected"] = pd.DataFrame(cache_res["affected"])
        shared_resources["affected_clusters"] = pd.DataFrame(cache_res["affected_clusters"])
        shared_resources["X_test"] = pd.DataFrame(cache_res["X_test"])
        shared_resources["data"] = pd.DataFrame(cache_res["data"])

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
                    "eff_cost_actions": cache_res['eff_cost_actions'],
                    "eff_cost_plot": cache_res['eff_cost_plot']} 
    else:
        from methods.groupcfe.group_cfe import Group_CF
        print(f"Cache key {cache_key} does not exist - Running GroupCFE Algorithm")    
        if shared_resources["method"] == 'globece' and shared_resources.get("dataset_name") in ['compas', 'default_credit', 'german_credit', 'heloc']:
            train_dataset, data, X_train, y_train, X_test, y_test, _, _unaffected, model, feat_to_vary, target_name,num_features,cate_features = load_dataset_and_model(shared_resources['dataset_name'], shared_resources['model_name'])
            affected = X_test[X_test.label == 0].reset_index()
            affected = affected.drop(columns='label')
            logging.debug("Model loaded successfully.")

            # shared_resources['dataset_name'] = dataset_name
            # shared_resources['model_name'] = model_name
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
            shared_resources["method"] = 'groupcfe'
        elif shared_resources.get("dataset_name") in ['adult', 'bank_marketing', 'compas', 'default_credit', 'german_credit', 'heloc']:
            train_dataset, data, X_train, y_train, X_test, y_test, _, _unaffected, model, feat_to_vary, target_name,num_features,cate_features = load_dataset_and_model(shared_resources['dataset_name'], shared_resources['model_name'])
            affected = X_test[X_test.label == 0].reset_index()
            affected = affected.drop(columns='label')
            logging.debug("Model loaded successfully.")

            # shared_resources['dataset_name'] = dataset_name
            # shared_resources['model_name'] = model_name
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
            shared_resources["method"] = 'groupcfe'
        else:
            shared_resources["method"] = 'groupcfe'    
            data,X_test,affected = get_data()
            # shared_resources["data"] = data
            # shared_resources["X_test"] = X_test
            shared_resources["affected"] = affected
        # data = shared_resources.get("data").copy(deep=True)
        # X_test = shared_resources.get("X_test").copy(deep=True)
        print(X_test)
        print(affected)
        # affected = shared_resources.get("affected").copy(deep=True)
        model = shared_resources.get("model")
        target_name = shared_resources.get("target_name")
        train_dataset = shared_resources.get("train_dataset")
        _unaffected = shared_resources.get("_unaffected")
        
        num_features = X_test.drop(columns='label')._get_numeric_data().columns.to_list()
        cate_features = X_test.drop(columns='label').columns.difference(num_features)
        features = data.columns.to_list()
        features.remove(target_name)
        feat_to_vary = features_to_change if features_to_change else features
        X_test.rename(columns={"label": "target"},inplace=True)

        try:
            group_cfe = Group_CF(
                model = model,
                data = data,
                train_dataset = X_test,
                affected = affected.drop(columns='index'),
                unaffected = _unaffected,
                numerical_features = num_features,
                categorical_features = cate_features,
                target = target_name,
                feat_to_vary = feat_to_vary,
                clusters=gcf_size,
                sample_size_gcfe_pairs = 50
            )
            best_cfs,effs,costs,_,_,_, _, _,_ = group_cfe.explain_group()

            counterfactual_dict = {
                i + 1: {
                    "action": action,
                    "effectiveness": effectiveness,
                    "cost": cost
                }
                for i, (action, effectiveness, cost) in enumerate(zip(best_cfs, effs, costs))
            }
            sorted_actions_dict = dict(sorted(counterfactual_dict.items(), key=lambda item: item[1]['cost']))
            print(sorted_actions_dict)
            actions = [stats["action"] for i,stats in sorted_actions_dict.items()]
            print(actions)
            dist_func_dataframe = build_dist_func_dataframe(
                    X=data.drop(columns=target_name),
                    numerical_columns=num_features,
                    categorical_columns=cate_features,
                )
            total_eff, total_cost,pred_list, chosen_actions, costs_list, final_costs = cumulative(affected.drop(columns='index'), actions, model,dist_func_dataframe)

            eff_cost_actions = {}
            action_costs = [final_costs[np.array(chosen_actions) == i].mean() for i in range(gcf_size)]
            action_costs = [0 if np.isnan(x) else x for x in action_costs]
            action_effs = [len(np.array(chosen_actions)[np.array(chosen_actions) == i]) for i in range(gcf_size)]
            print(action_costs)
            print(action_effs)
            sorted_lists = sorted(zip(action_costs, action_effs))  # Sorts based on first element of each tuple
            sorted_list1, sorted_list2 = zip(*sorted_lists)  # Unzips the sorted pairs
            action_costs = list(sorted_list1)
            action_effs = list(sorted_list2)
            print(action_costs)
            print(action_effs)
            eff_plot = 0
            cost_plot = 0
            eff_cost_plot = {}
            affected_clusters = affected.copy(deep=True)
            for i, arr in pred_list.items():
                column_name = f"Action{i}_Prediction"
                affected_clusters[column_name] = arr
                eff_act = pred_list[i].sum()/len(affected)
                cost_act = costs_list[i-1][costs_list[i-1] != np.inf].sum()/pred_list[i].sum()
                eff_cost_actions[i] = {'eff':eff_act , 'cost':cost_act}
                eff_plot += action_effs[i-1]
                cost_plot += action_costs[i-1]*action_effs[i-1]
                if cost_plot == 0:
                    eff_cost_plot[i] = {'eff':0.0 , 'cost':0.0}
                else:
                    eff_cost_plot[i] = {'eff':eff_plot/len(affected) , 'cost':cost_plot/eff_plot}

            affected_clusters['Chosen_Action'] = chosen_actions
            affected_clusters['Chosen_Action'] = affected_clusters['Chosen_Action'] + 1
            affected_clusters = affected_clusters.replace(np.inf , '-')

            filtered_data = {
                    k: {
                        **{
                            'action': {ak: av for ak, av in v['action'].items() if av != '-'}
                        },
                        **{kk: vv for kk, vv in v.items() if kk != 'action'}
                    }
                    for k, v in sorted_actions_dict.items()
                }
            actions_returned  = [stats["action"] for i,stats in filtered_data.items()]
            shared_resources['affected_clusters'] = affected_clusters
            serialized_clusters_res = {
                int(k): {  # Convert key to Python int
                    "action": v["action"].to_dict(),
                    "effectiveness": v["effectiveness"],
                    "cost": v["cost"],
                }
                for k, v in counterfactual_dict.items()
            }
            shared_resources["clusters_res"] = serialized_clusters_res

            cache_ret = {
                "method" : 'groupcfe',
                "actions": actions_returned,
                "data": shared_resources["data"].to_dict(orient='records'),
                "clusters_res": serialized_clusters_res,
                "affected": affected.to_dict(orient='records'),
                "X_test": shared_resources["X_test"].to_dict(orient='records'),
                "TotalEffectiveness": round(total_eff,2),
                "TotalCost": round(total_cost,2),
                "affected_clusters": affected_clusters.to_dict(orient='records'),
                "eff_cost_actions": eff_cost_actions,
                "eff_cost_plot": eff_cost_plot} 
            
            rd.set(cache_key,json.dumps(cache_ret), ex=3600)
            return {"actions": actions_returned,
                    "TotalEffectiveness": round(total_eff,3),
                    "TotalCost": round(total_cost,2),
                    "affected_clusters": affected_clusters.to_dict(),
                    "eff_cost_actions": eff_cost_actions,
                    "eff_cost_plot": eff_cost_plot} 
        except UserConfigValidationException as e:
            raise HTTPException(status_code=400, detail=str(e))
        except KeyError as e:  # Catch KeyError specifically
            raise HTTPException(status_code=400, detail=f"KeyError: {str(e)}")
        except Exception as e:  # Catch any other unexpected errors
            raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
