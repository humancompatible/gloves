from fastapi import APIRouter, HTTPException
import logging
from app.config import shared_resources
logging.basicConfig(level=logging.DEBUG)
from app.services.resources_service import round_categorical,reverse_one_hot
from methods.glance.iterative_merges.iterative_merges import C_GLANCE
from typing import List, Optional
from raiutils.exceptions import UserConfigValidationException
from methods.glance.iterative_merges.iterative_merges import apply_action_pandas,cumulative
import pandas as pd
import numpy as np

router = APIRouter()

@router.get("/apply_affected_actions")
async def apply_affected_actions():
    if shared_resources["method"] == "glance":
        affected = shared_resources.get("affected")
        affected = affected.drop(columns=['index'])
        clusters_res = shared_resources.get("clusters_res")
        affected_clusters  = shared_resources.get("affected_clusters")
        index = affected_clusters['index']
        affected_clusters = affected_clusters.drop(columns='index')
        sorted_actions_dict = dict(sorted(clusters_res.items(), key=lambda item: item[1]['cost']))
        actions = [stats["action"] for i, stats in sorted_actions_dict.items()]

        num_features = affected._get_numeric_data().columns.to_list()
        cate_features = affected.columns.difference(num_features)
        applied_affected = pd.DataFrame()
        for i,val in enumerate(list(affected_clusters.Chosen_Action.unique())):
            aff = affected_clusters[affected_clusters['Chosen_Action'] == val]
            if val != '-':
                applied_df = apply_action_pandas(
                    aff[affected.columns.to_list()],
                    actions[int(val-1)],
                    num_features,
                    cate_features,
                    '-',
                )
                applied_df['Chosen_Action'] = val
                applied_affected = pd.concat([applied_affected,applied_df])
            else:
                aff['Chosen_Action'] = '-'
                cols = affected.columns.to_list()
                cols.append('Chosen_Action')
                applied_affected = pd.concat([applied_affected,aff[cols]])

        applied_affected = applied_affected.sort_index()
        applied_affected['index'] = index
        shared_resources['applied_affected'] = applied_affected
        return applied_affected.to_dict()
    elif shared_resources["method"] == "groupcfe":
        affected = shared_resources.get("affected")
        affected = affected.drop(columns=['index'])
        clusters_res = shared_resources.get("clusters_res")
        affected_clusters  = shared_resources.get("affected_clusters")
        index = affected_clusters['index']
        affected_clusters = affected_clusters.drop(columns='index')
        sorted_actions_dict = dict(sorted(clusters_res.items(), key=lambda item: item[1]['cost']))
        actions = [stats["action"] for i, stats in sorted_actions_dict.items()]

        num_features = affected._get_numeric_data().columns.to_list()
        cate_features = affected.columns.difference(num_features)
        applied_affected = pd.DataFrame()
        for i,val in enumerate(list(affected_clusters.Chosen_Action.unique())):
            aff = affected_clusters[affected_clusters['Chosen_Action'] == val]
            print(aff)
            if val != '-':
                for col, value in actions[int(val) - 1].items():
                    aff[col] = value
                cols = affected.columns.to_list()
                cols.append('Chosen_Action')
                applied_affected = pd.concat([applied_affected,aff[cols]])
            else:
                aff['Chosen_Action'] = '-'
                cols = affected.columns.to_list()
                cols.append('Chosen_Action')
                applied_affected = pd.concat([applied_affected,aff[cols]])

        applied_affected = applied_affected.sort_index()
        applied_affected['index'] = index
        shared_resources['applied_affected'] = applied_affected
        return applied_affected.to_dict()
    elif shared_resources["method"] == "globece":
        affected = shared_resources.get("affected")
        clusters_res = shared_resources.get("clusters_res")
        affected_clusters  = shared_resources.get("affected_clusters")
        # actions = [stats["action"] for i, stats in clusters_res.items()]

        num_features = affected._get_numeric_data().columns.to_list()
        cate_features = affected.columns.difference(num_features)
        applied_affected = pd.DataFrame()
        actions = shared_resources["actions"]
        print(actions)
        feature_values = shared_resources["features"]
        feature_tree = shared_resources["features_tree"]
        features = np.array(list(feature_tree))
        # actions['idx'] = actions['idx'].astype(float)
        # actions['idx'] = actions['idx'].astype(str)
        if 'action_idxs' in affected_clusters.columns.tolist():

            for i,val in enumerate(list(affected_clusters.action_idxs.unique())):
                aff = affected_clusters[affected_clusters['action_idxs'] == val]
                if val != '-':
                    action = actions[actions.idx == val].drop(columns=['idx','mean_cost','sum_flipped']).values
                    applied = round_categorical(aff[feature_values].values + action,features,feature_tree)
                    applied_df = pd.DataFrame(applied,columns=feature_values)
                    applied_df['Chosen_Action'] = aff.Chosen_Action.values[0]
                    applied_affected = pd.concat([applied_affected,applied_df])
                else:
                    aff['Chosen_Action'] = '-'
                    cols = affected.columns.to_list()
                    cols.append('Chosen_Action')
                    applied_affected = pd.concat([applied_affected,aff[cols]])
        else:
            for i,val in enumerate(list(affected_clusters['Chosen_Action'].unique())):
                aff = affected_clusters[affected_clusters['Chosen_Action'] == val]
                if val != '-':
                    action = actions[actions['Chosen_Action'] == val].drop(columns=['direction','scalar','Chosen_Action','cost']).drop_duplicates().values
                    applied = round_categorical(aff[feature_values].values + action,features,feature_tree)
                    applied_df = pd.DataFrame(applied,columns=feature_values)
                    applied_df['Chosen_Action'] = aff.Chosen_Action.values[0]
                    applied_affected = pd.concat([applied_affected,applied_df])
                else:
                    aff['Chosen_Action'] = '-'
                    cols = affected.columns.to_list()
                    cols.append('Chosen_Action')
                    applied_affected = pd.concat([applied_affected,aff[cols]])

        
        shared_resources['applied_affected'] = applied_affected.reset_index(drop=True)
        return reverse_one_hot(applied_affected).reset_index(drop=True).to_dict()

        




    