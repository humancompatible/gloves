from fastapi import APIRouter, HTTPException
import logging
from app.config import shared_resources
logging.basicConfig(level=logging.DEBUG)
from methods.glance.iterative_merges.iterative_merges import C_GLANCE
from typing import List, Optional
from raiutils.exceptions import UserConfigValidationException
from methods.groupcfe.group_cfe import cumulative
import pandas as pd
import numpy as np
import redis
import json
from methods.globe_ce.helper_functions import find_actions,report_globece_actions
from methods.globe_ce.ares import AReS
from app.services.resources_service import get_data,load_dataset_and_model_globece,reverse_one_hot,prepare_globece_data,one_hot,round_categorical
import math
from sklearn.base import clone
from sklearn.pipeline import Pipeline

router = APIRouter()

rd = redis.Redis(host="localhost", port=6379, db=0)

@router.post("/run-globece", summary="Run GLOBE_CE")
async def run_groupcfe(gcf_size: int = 3, features_to_change: int = 5, direction: int =1):
    cache_key = f"run-globece:{shared_resources['dataset_name']}:{shared_resources['model_name']}:{gcf_size}:{features_to_change}:{direction}"
    cache = rd.get(cache_key)
    if cache:
        print("Cache hit")
        cache_res = json.loads(cache)
        shared_resources["method"] = cache_res["method"]
        shared_resources["clusters_res"] = {
            int(k): {  # Ensure key is Python int
            "action": pd.Series(v["action"]),
        }
        for k, v in cache_res["clusters_res"].items()}
        shared_resources["affected"] = pd.DataFrame(cache_res["affected"])
        #shared_resources["X_test"] = pd.DataFrame(cache_res["X_test"])
        #shared_resources["data"] = pd.DataFrame(cache_res["data"])
        shared_resources["affected_clusters"] = pd.DataFrame(cache_res["affected_clusters"])
        shared_resources['actions'] = pd.DataFrame(cache_res['actions'])
        shared_resources['features'] = cache_res['features']
        shared_resources['features_tree'] = cache_res['features_tree']
        # Change numeric columns to int32 for affected
        numeric_cols_affected = shared_resources["affected"].select_dtypes(include=["number"]).columns
        shared_resources["affected"][numeric_cols_affected] = shared_resources["affected"][numeric_cols_affected].astype("int32")

        # Change numeric columns to int32 for affected_clusters
        numeric_cols_affected_clusters = shared_resources["affected_clusters"].select_dtypes(include=["number"]).columns
        shared_resources["affected_clusters"][numeric_cols_affected_clusters] = shared_resources["affected_clusters"][numeric_cols_affected_clusters].astype("int32")
        # shared_resources["affected_clusters"]['Chosen_Action'] = shared_resources["affected_clusters"]['Chosen_Action'].astype('int64')
        if 'action_idxs' in shared_resources["affected_clusters"].columns.tolist():
            return {"actions": cache_res['actions_ret'],
                        "TotalEffectiveness": cache_res['TotalEffectiveness'],
                        "TotalCost": cache_res['TotalCost'],
                        "affected_clusters": reverse_one_hot(shared_resources["affected_clusters"]).drop(columns=['action_idxs']).to_dict(),
                        "eff_cost_actions": cache_res['eff_cost_actions'],
                        "eff_cost_plot": cache_res['eff_cost_plot']} 
        else:
            return {"actions": cache_res['actions_ret'],
                        "TotalEffectiveness": cache_res['TotalEffectiveness'],
                        "TotalCost": cache_res['TotalCost'],
                        "affected_clusters": reverse_one_hot(shared_resources["affected_clusters"]).to_dict(),
                        "eff_cost_actions": cache_res['eff_cost_actions'],
                        "eff_cost_plot": cache_res['eff_cost_plot']} 
    else:
        from methods.globe_ce.globe_ce import GLOBE_CE
        print(f"Cache key {cache_key} does not exist - Running GLOBE_CE Algorithm")    
        shared_resources["method"] = 'globece'

        if shared_resources['dataset_name'] in ['compas','heloc','german_credit','default_credit']:
            dataset , X_test, model, normalise = load_dataset_and_model_globece(shared_resources['dataset_name'],shared_resources['model_name'])
            shared_resources["data"] = dataset.data
            shared_resources["X_test"] = X_test
            if shared_resources['dataset_name'] == 'default_credit':
                target_name = 'Status'
            else:
                target_name = shared_resources.get("target_name")
        else:
            from methods.globe_ce.datasets import dataset_loader
            data = shared_resources["data"]
            model = shared_resources["model"]
            target_name = shared_resources.get("target_name")
            if isinstance(model, Pipeline):
                model = clone(model.named_steps['classifier'])
            else:
                model = clone(model)

            data,X_test,_ = get_data()
            X_test = shared_resources["X_test"].drop(columns=['label'])

            X_train = data.merge(X_test, on=X_test.columns.tolist(), how='left', indicator=True)
            X_train = X_train[X_train['_merge'] == 'left_only'].drop(columns=['_merge'])


            categorical_columns = data.drop(columns=[shared_resources["target_name"]]).select_dtypes(include=['object', 'category']).columns.tolist()
            numerical_columns = data.select_dtypes(include=['number']).columns.tolist()
            if data.columns[-1] != shared_resources["target_name"]:
                data = data[[col for col in data.columns if col != shared_resources["target_name"]] + [shared_resources["target_name"]]]
            dataset = dataset_loader()
            dataset.name = shared_resources["dataset_name"]
            dataset.continuous_features = {}
            dataset.columns = {shared_resources["dataset_name"]: data.columns.tolist()}
            dataset.categorical_features = {shared_resources["dataset_name"]: categorical_columns}
            dataset.continuous_features = {}

            dataset = prepare_globece_data(dataset)
            one_hot_data, features = one_hot(dataset,data)
            dataset.features = features
            dataset.features.append(data.columns[-1])
            dataset.data = pd.concat([one_hot_data, data[data.columns[-1]]], axis=1)
            #shared_resources["data"] = dataset.data

            X_test=X_test.reindex(columns=dataset.data.columns, fill_value=0)
            X_test = X_test.drop(columns=[target_name])
            #shared_resources["X_test"] = X_test
            X_train=X_train.reindex(columns=dataset.data.columns, fill_value=0)
            model.fit(X_train.drop(columns=[target_name]),X_train[target_name])
            # preds = model.predict(X_test)
            # affected = X_test[preds == 0].reset_index()
            # shared_resources["affected"] = affected
            normalise = None


        try:
            n_bins = 10
            ordinal_features = []
            dropped_features = []
            ares_widths = AReS(model=model, dataset=dataset, X=dataset.data.drop(columns=target_name), n_bins=10, normalise=normalise)
            bin_widths = ares_widths.bin_widths

            bin_widths = ares_widths.bin_widths
            
            globe_ce = GLOBE_CE(model=model, dataset=dataset, X=X_test, affected_subgroup=None,
                                dropped_features=dropped_features, delta_init='zeros',
                                ordinal_features=ordinal_features, normalise=normalise,
                                bin_widths=bin_widths, monotonicity=None, p=1)
            
            globe_ce.sample(n_sample=1000, magnitude=1, sparsity_power=5,
                                    idxs=None, n_features=features_to_change, disable_tqdm=False,
                                    plot=False, seed=0, scheme='random',
                                    dropped_features=dropped_features)
            
            x_aff = globe_ce.x_aff
            affected = pd.DataFrame(x_aff,columns=globe_ce.feature_values)
            shared_resources['affected'] = affected
            delta = globe_ce.best_delta
            if direction > 1:
                globe_ce.select_n_deltas(n_div=direction)
            
            if direction == 1:
                corrects, costs, scalars = globe_ce.scale(delta=delta, vector=True, plot=True, n_scalars=gcf_size)
                min_costs, idxs = globe_ce.min_scalar_costs(costs=costs, return_idxs=True)

                unique_actions, actions, avg_cost, effectiveness, flipped_list, cost_list = report_globece_actions(
                    globe_ce_object=globe_ce,
                    idxs=idxs,
                    min_costs=min_costs,
                    scalars=scalars,
                    delta=delta,
                )
            else:
                n_div = globe_ce.deltas_div.shape[0]
                min_costs = np.zeros((n_div, globe_ce.x_aff.shape[0]))
                min_costs_idxs = np.zeros((n_div, globe_ce.x_aff.shape[0]))
                scalars = []
                costs = []
                corrects = []
                for i in range(n_div):  
                    cor_s, cos_s, k_s = globe_ce.scale(globe_ce.deltas_div[i], disable_tqdm=False, vector=True,n_scalars=gcf_size)
                    scalars.append(k_s)
                    min_costs[i], min_costs_idxs[i] = globe_ce.min_scalar_costs(cos_s, return_idxs=True, inf=True)
                    costs.append(cos_s)
                    corrects.append(cor_s)
                for i in range(n_div):
                    unique_actions, _, avg_cost, effectiveness, _, _  = report_globece_actions(
                        globe_ce_object=globe_ce,
                        idxs=min_costs_idxs[i],
                        min_costs=min_costs[i],
                        scalars=scalars[i],
                        delta=globe_ce.deltas_div[i],
                    )        
                min_costs_for_eff = min_costs.min(axis=0)

            if direction > 1:
                print(np.unique(min_costs_for_eff))
                costs_bound, corrects_bound = globe_ce.accuracy_cost_bounds(min_costs_for_eff)
                print(f"Average cost : {costs_bound[-1]}")
                print(f"Total Effectiveness : {corrects_bound[-1]}")

                min_indices = np.argmin(min_costs, axis=0)  # direction from which the action was selected

                # Get the actual minimum values
                min_values = np.take_along_axis(min_costs, min_indices[None, :], axis=0).squeeze() 

                # Get the corresponding values from second_array
                corresponding_values = np.take_along_axis(min_costs_idxs, min_indices[None, :], axis=0).squeeze()
                actions = []
                actions_df = pd.DataFrame()
                for i in range(min_indices.shape[0]):
                    if min_values[i] != np.inf:
                        direct = min_indices[i]
                        scalar = corresponding_values[i]
                        cost = min_values[i]
                        action = find_actions(scalars[0][int(scalar)],globe_ce.deltas_div[direct])
                        # actions.append(action)
                        x = pd.DataFrame(action.reshape(1,-1),columns=globe_ce.feature_values)
                        x['direction'] = direct
                        x['scalar'] = scalar
                        x['cost'] = min_values[i]
                        actions_df = pd.concat([actions_df,x])
                    else:
                        x = pd.DataFrame(columns=['direction','scalar','cost'])
                        x.loc[0] = ['-', '-','-']
                        actions_df = pd.concat([actions_df,x])
                        actions_df=actions_df.fillna('-')    
                unique_actions = actions_df[actions_df["direction"] != "-"].drop_duplicates().reset_index(drop=True)
                unique_actions = unique_actions.sort_values(by='cost')
                unique_actions["Chosen_Action"] = pd.factorize(unique_actions[["direction", "scalar"]].apply(tuple, axis=1))[0]
                unique_actions["Chosen_Action"] = unique_actions["Chosen_Action"] + 1
                actions_df = actions_df.merge(unique_actions, on=["direction", "scalar",'cost'], how="left")
                actions_df["Chosen_Action"] = actions_df["Chosen_Action"].fillna("-")
                actions_df = actions_df[['Chosen_Action','cost']]
                affected_clusters = pd.DataFrame(globe_ce.x_aff,columns=globe_ce.feature_values)
                affected_clusters["Chosen_Action"] = actions_df["Chosen_Action"]

                eff_cost_plot = {}
                flipped_list = []
                cost_list = []
                eff_plot = 0
                cost_plot = 0
                for i in unique_actions["Chosen_Action"].unique().tolist(): 
                    flipped = actions_df[actions_df["Chosen_Action"] == i].shape[0]
                    flipped_list.append(flipped)
                    cost = actions_df[actions_df["Chosen_Action"] == i].cost.mean()
                    cost_list.append(cost)
                    eff_plot += flipped
                    cost_plot += cost*flipped
                    eff_cost_plot[i] = {'eff':eff_plot/len(affected) , 'cost':cost_plot/eff_plot}
                    

                eff_cost_actions = {}
                for i in unique_actions["Chosen_Action"].tolist():
                    column_name = f"Action{i}_Prediction"
                    action = unique_actions[unique_actions['Chosen_Action'] == i]

                    affected_clusters[column_name] = [val/100 for val in corrects[action.direction.values[0]][int(action.scalar.values[0])]]
                    if (sum(corrects[action.direction.values[0]][int(action.scalar.values[0])])/100) == 0.0:
                        eff_cost_actions[i] = {'eff':0.0 , 'cost':0.0}
                    else:
                        eff_act = (sum(corrects[action.direction.values[0]][int(action.scalar.values[0])])/100)/len(affected_clusters)
                        cost_act = sum(costs[action.direction.values[0]][int(action.scalar.values[0])])/(sum(corrects[action.direction.values[0]][int(action.scalar.values[0])])/100)
                        eff_cost_actions[i] = {'eff':round(eff_act,3) , 'cost':round(cost_act,3)}
                


                #processed_actions = reverse_one_hot(pd.DataFrame(globe_ce.round_categorical(unique_actions.drop(columns=['direction','scalar','Chosen_Action','cost']).to_numpy()),columns=globe_ce.feature_values))
                counterfactual_dict = {
                    i + 1: {
                        "action": reverse_one_hot(pd.DataFrame(round_categorical(action.to_frame().T.values,np.array(list(globe_ce.features_tree)),globe_ce.features_tree),columns=globe_ce.feature_values)[action.to_frame().T.loc[:, (action.to_frame().T != 0.0).any(axis=0)].columns.tolist()]),
                    }
                    for i, (action) in unique_actions.drop(columns=['direction','scalar','cost','Chosen_Action']).drop_duplicates().reset_index(drop=True).iterrows()
                }
                filtered_data = {
                    k: {
                        **{
                            'action': {ak: av for ak, av in v['action'].T.iloc[:,0].items() if av != '-'}
                        },
                        **{kk: vv for kk, vv in v.items() if kk != 'action'}
                    }
                    for k, v in counterfactual_dict.items()
                }
                actions_returned = [stats["action"] for i,stats in filtered_data.items()]
                shared_resources['affected_clusters'] = affected_clusters
                shared_resources["actions"] = unique_actions.reset_index(drop=True)
                shared_resources['features'] = globe_ce.feature_values
                shared_resources['features_tree'] = globe_ce.features_tree
                

                serialized_clusters_res = {
                    int(k): {  # Convert key to Python int
                        "action": v["action"].to_dict(),
                    }
                    for k, v in counterfactual_dict.items()
                }
                shared_resources["clusters_res"] = serialized_clusters_res
                print(unique_actions)
                # print(affected_clusters)
                cache_ret = {
                    "method" : 'globece',
                    "actions_ret": actions_returned,
                    "data": dataset.data.to_dict(orient='records'),
                    "X_test": X_test.to_dict(orient='records'),
                    "clusters_res": serialized_clusters_res,
                    "affected": affected.to_dict(orient='records'),
                    "TotalEffectiveness": round(corrects_bound[-1]/100,2),
                    "TotalCost": round(costs_bound[-1],2),
                    "affected_clusters": affected_clusters.to_dict(orient='records'),
                    "eff_cost_actions": eff_cost_actions,
                    "eff_cost_plot": eff_cost_plot,
                    "actions": unique_actions.reset_index(drop=True).to_dict(orient='records'),
                    "features": globe_ce.feature_values,
                    "features_tree": globe_ce.features_tree} 
                rd.set(cache_key,json.dumps(cache_ret), ex=3600)
                return {"actions": actions_returned,
                        "TotalEffectiveness": round(corrects_bound[-1]/100,3),
                        "TotalCost": round(costs_bound[-1],2),
                        "affected_clusters": reverse_one_hot(affected_clusters).to_dict(),
                        "eff_cost_actions": eff_cost_actions,
                        "eff_cost_plot": eff_cost_plot
                        } 
            else:
                costs_bound, corrects_bound = globe_ce.accuracy_cost_bounds(min_costs)
                print(f"Average cost : {avg_cost}")
                print(f"Total Effectiveness : {effectiveness}")
                print(f"Average cost : {costs_bound[-1]}")
                print(f"Total Effectiveness : {corrects_bound[-1]}")
                print(actions)
                #all actions
                # actions = find_actions(scalars,delta)
                # actions = pd.DataFrame(actions,columns=globe_ce.feature_values)
                # processed_actions = reverse_one_hot(pd.DataFrame(globe_ce.round_categorical(actions.to_numpy()),columns=globe_ce.feature_values))
                #processed_actions = reverse_one_hot(pd.DataFrame(globe_ce.round_categorical(actions.drop(columns=['idx','sum_flipped','mean_cost']).to_numpy()),columns=globe_ce.feature_values))
                processed_actions =  reverse_one_hot(pd.DataFrame(round_categorical(actions.drop(columns=['idx','mean_cost','sum_flipped']).values,np.array(list(globe_ce.features_tree)),globe_ce.features_tree),columns=globe_ce.feature_values)[actions.loc[:, (actions != 0.0).any(axis=0)].drop(columns=['idx','mean_cost','sum_flipped']).columns.tolist()])

                flipped_idxs = idxs[~np.isnan(idxs)]
                print(actions)
                counterfactual_dict = {
                    i + 1: {
                        "action": action,
                    }
                    for i, (action) in processed_actions.iterrows()
                }
                filtered_data = {
                        k: {
                            **{
                                'action': {ak: av for ak, av in v['action'].items() if av != '-'}
                            },
                            **{kk: vv for kk, vv in v.items() if kk != 'action'}
                        }
                        for k, v in counterfactual_dict.items()
                }

                actions_returned = [stats["action"] for i,stats in filtered_data.items()]
                affected_clusters = affected.copy(deep=True)

                sorted_lists = sorted(zip(cost_list, flipped_list))  # Sorts based on first element of each tuple
                sorted_list1, sorted_list2 = zip(*sorted_lists)  # Unzips the sorted pairs
                sorted_list1 = list(sorted_list1)
                sorted_list2 = list(sorted_list2)

                eff_cost_plot = {}
                eff_plot = 0
                cost_plot = 0
                actions = actions.sort_values(by='mean_cost')
                for i,row in actions.iterrows(): 
                    flipped = row['sum_flipped']
                    cost = row['mean_cost']
                    eff_plot += flipped
                    cost_plot += cost*flipped
                    eff_cost_plot[i+1] = {'eff':eff_plot/len(affected) , 'cost':cost_plot/eff_plot}

                eff_cost_actions = {}
                z=0
                for i,value in enumerate(corrects.tolist()):
                    if i in np.unique(flipped_idxs):

                        column_name = f"Action{z+1}_Prediction"
                        affected_clusters[column_name] = [val/100 for val in value]
                        if (sum(value)/100) == 0.0:
                            eff_cost_actions[z+1] = {'eff':0.0 , 'cost':0.0}
                            z=z+1
                        else:
                            eff_act = (sum(value)/100)/len(affected)
                            cost_act = sum(costs[i])/(sum(value)/100)
                            eff_cost_actions[z+1] = {'eff':round(eff_act,3) , 'cost':round(cost_act,3)}
                            z=z+1
                affected_clusters['action_idxs'] = idxs
                affected_clusters = affected_clusters.replace(np.nan , '-')
                z=0
                x = pd.DataFrame()
                for i in list(np.unique(flipped_idxs)):
                    aff = affected_clusters[affected_clusters.action_idxs == i]
                    aff['Chosen_Action'] = z+1
                    z = z+1
                    x = pd.concat([aff,x])
                y = affected_clusters[affected_clusters.action_idxs =='-']
                y['Chosen_Action'] = '-'
                x = pd.concat([x,y])
                
                # eff_cost_plot = {}
                # for i in x["Chosen_Action"].tolist():


                shared_resources['affected_clusters'] = x
                shared_resources["actions"] = actions
                shared_resources['features'] = globe_ce.feature_values
                shared_resources['features_tree'] = globe_ce.features_tree
                

                serialized_clusters_res = {
                    int(k): {  # Convert key to Python int
                        "action": v["action"].to_dict(),
                    }
                    for k, v in counterfactual_dict.items()
                }
                shared_resources["clusters_res"] = serialized_clusters_res
                # print(affected_clusters)
                cache_ret = {
                    "method" : 'globece',
                    "actions_ret": actions_returned,
                    "data": dataset.data.to_dict(orient='records'),
                    "clusters_res": serialized_clusters_res,
                    "affected": affected.to_dict(orient='records'),
                    "X_test": X_test.to_dict(orient='records'),
                    "TotalEffectiveness": round(corrects_bound[-1]/100,2),
                    "TotalCost": round(costs_bound[-1],2),
                    "affected_clusters": x.to_dict(orient='records'),
                    "eff_cost_actions": eff_cost_actions,
                    "eff_cost_plot": eff_cost_plot,
                    "actions": actions.to_dict(orient='records'),
                    "features": globe_ce.feature_values,
                    "features_tree": globe_ce.features_tree} 
                rd.set(cache_key,json.dumps(cache_ret), ex=3600)
                return {"actions": actions_returned,
                        "TotalEffectiveness": round(corrects_bound[-1]/100,3),
                        "TotalCost": round(costs_bound[-1],2),
                        "affected_clusters": reverse_one_hot(x).drop(columns=['action_idxs']).to_dict(),
                        "eff_cost_actions": eff_cost_actions,
                        "eff_cost_plot": eff_cost_plot
                        } 
        except UserConfigValidationException as e:
            raise HTTPException(status_code=400, detail=str(e))
        except KeyError as e:  # Catch KeyError specifically
            raise HTTPException(status_code=400, detail=f"KeyError: {str(e)}")
        except Exception as e:  # Catch any other unexpected errors
            raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
            