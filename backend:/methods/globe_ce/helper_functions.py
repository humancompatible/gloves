from typing import List
import pickle
import numpy as np
import pandas as pd
from sklearn import metrics
from IPython.display import display
from IPython.core.display import Markdown

from methods.globe_ce.globe_ce import GLOBE_CE

def bold(string):
    return '\033[1m' + string + '\033[0m'

def find_actions(scalars, delta):
    # actions = []
    # for i in range(scalars.shape[0]):
    #     if i==0:
    #         continue
    # actions.append(delta * scalars)
    return delta * scalars

def find_actions_costs(costs, idxs, scalars, delta):
    actions = []
    action_costs = []
    non_zero_costs = costs[costs != 0]
    non_zero_costs = non_zero_costs[non_zero_costs != np.inf]
    i = ~np.isnan(idxs)
    idxs = idxs[i]
    for i in range(non_zero_costs.shape[0]):
        actions.append(delta * scalars[int(idxs[i])])
        action_costs.append(non_zero_costs[i])
    return actions, action_costs

def find_actions_costs_df(costs, idxs, scalars, delta, column_names, flipped_idxs):
    individual_actions, individual_costs = find_actions_costs(costs, idxs, scalars, delta)
    individual_actions_df = pd.DataFrame(individual_actions, columns=column_names)
    individual_actions_df['cost'] = individual_costs
    individual_actions_df['idx'] = flipped_idxs.astype(int)

def reduce_actions_to_unique(individual_actions_df: pd.DataFrame):
    columns_except_cost = individual_actions_df.columns.drop(["cost"]).tolist()
    actions_unique = individual_actions_df \
        .groupby(columns_except_cost) \
        .agg(
            mean_cost=pd.NamedAgg(column="cost", aggfunc="mean"),
            sum_flipped=pd.NamedAgg(column="cost", aggfunc="size")
        ).reset_index()
    return actions_unique

def build_globece_actions_report(
    actions: pd.DataFrame,
    feature_weights: pd.DataFrame,
    common_columns: List[str],
    all_columns: List[str],
    total_affected: int,
    affected_flipped: np.ndarray,
    flipped_idxs: np.ndarray,
    globe_ce_object: GLOBE_CE,
    num_show: int = 10,
):
    common_costs_vector = abs(feature_weights[common_columns]).iloc[0]
    print("\n")
    print(f"Number of unique actions : {len(actions)}")
    print("\n")
    avg_cost = 0
    num_total_flipped = 0
    flipped_list = []
    cost_list = []
    for i, (_index, action) in enumerate(actions.iterrows()):
        individuals_on_which_applied = affected_flipped[flipped_idxs == action["idx"]]
        individuals_on_which_applied_df = pd.DataFrame(individuals_on_which_applied, columns=all_columns)
        action_numpy = action.drop(["idx", "mean_cost", "sum_flipped"]).values
        cfs = globe_ce_object.round_categorical(individuals_on_which_applied + action_numpy)
        cfs = pd.DataFrame(cfs, columns=all_columns)
        total_flipped = int(action['sum_flipped'])
        assert total_flipped == individuals_on_which_applied.shape[0]
        
        # Calculate and print the result
        result_message = []
        result = 0
        for original_col, cols_list in globe_ce_object.features_tree.items():
            if original_col in globe_ce_object.categorical_features:
                if any(col in common_columns for col in cols_list):
                    changed = (individuals_on_which_applied_df[cols_list].values != cfs[cols_list].values).any(axis=1).sum()
                    result_message.append(f"{changed} / {total_flipped} (x 1) {bold(original_col)}")
                    result += changed / total_flipped
            elif original_col in globe_ce_object.continuous_features:
                assert cols_list == []
                if original_col in common_columns:
                    col = original_col
                    result_message.append(f"{abs(action[col]):.2f}*{abs(common_costs_vector[col]):.3f} {bold(col)}")
                    result += abs(action[col]) * abs(common_costs_vector[col])
            else:
                print("Error: neither categorical nor continuous feature.")
        result_message = " + ".join(result_message)
#         if i < num_show:
        display(action[common_columns].to_frame().T)
        print(f"Cost {result_message} = {result}")
        cost_list.append(result)
        #assert np.isclose(result, action["mean_cost"])
#         if i < num_show:
        print(f" Flipped : {int(total_flipped)} in {total_affected} ")
        flipped_list.append(int(total_flipped))
        avg_cost = avg_cost + result*total_flipped
        num_total_flipped = num_total_flipped + total_flipped
    
    if num_total_flipped != 0:
        avg_cost = avg_cost/num_total_flipped
        effectiveness = (num_total_flipped/ total_affected)*100
        return avg_cost, effectiveness, flipped_list, cost_list
    else:
        return 0, 0 , 0, 0

def report_globece_actions(
    globe_ce_object: GLOBE_CE,
    idxs: np.ndarray,
    min_costs: np.ndarray,
    scalars: np.ndarray,
    delta: np.ndarray,
    num_show: int = 10,
):
    affected = globe_ce_object.x_aff
    all_columns = globe_ce_object.feature_values

    affected_flipped = affected[~np.isnan(idxs)]
    flipped_idxs = idxs[~np.isnan(idxs)]

    individual_actions, individual_costs = find_actions_costs(min_costs, idxs, scalars, delta)
    individual_actions_df = pd.DataFrame(individual_actions, columns=all_columns)
    individual_actions_df['cost'] = individual_costs
    individual_actions_df['idx'] = flipped_idxs.astype(int)

    actions_unique = reduce_actions_to_unique(individual_actions_df)
    feature_costs_vector = pd.DataFrame(globe_ce_object.feature_costs_vector.reshape(1, -1), columns=all_columns)
    common_columns = actions_unique[actions_unique.columns[(actions_unique != 0).any()]].columns.intersection(feature_costs_vector.columns).tolist()

    unique_actions = len(actions_unique)
    avg_cost, effectiveness, flipped_list, cost_list = build_globece_actions_report(
        actions=actions_unique,
        feature_weights=feature_costs_vector,
        common_columns=common_columns,
        all_columns=all_columns,
        total_affected=min_costs.shape[0],
        affected_flipped=affected_flipped,
        flipped_idxs=flipped_idxs,
        globe_ce_object=globe_ce_object,
        num_show=num_show,
    )
    return unique_actions, actions_unique, avg_cost, effectiveness, flipped_list, cost_list

def load_models(dataset_name, means, stds, dnn_normalisers, lr_normalisers):
    normalisers = {"dnn": dnn_normalisers, "lr": lr_normalisers, "xgb": {dataset_name: False}}

    models = {"xgb": None, "lr": None, "dnn": None}
    normalise = {"xgb": None, "lr": None, "dnn": None}
    for model_name in models.keys():
        with open('../models/{}_{}.pkl'.format(dataset_name, model_name), 'rb') as f:
            B = pickle.load(f)
        models[model_name] = B
        normalise[model_name] = [means, stds] if normalisers[model_name][dataset_name] else None

    return models, normalise

def models_performance_report(models, x_train, x_test, y_train, y_test, normalise_vars):
    # Compute predictions on train and test datasets
    acc_train = {}
    acc_test = {}
    prop1_train = {}
    prop1_test = {}
    for model_name, model in models.items():
        normalise = normalise_vars[model_name]
        if normalise is not None:
            y_pred = model.predict((x_test-normalise[0])/normalise[1])
            y_pred_tr = model.predict((x_train-normalise[0])/normalise[1])
        else:
            y_pred = model.predict(x_test)
            y_pred_tr = model.predict(x_train)
        
        # Compute model accuracy
        acc_train[model_name] = round(metrics.accuracy_score(y_train, y_pred_tr)*100, 2)
        acc_test[model_name] = round(metrics.accuracy_score(y_test, y_pred)*100, 2)
        # Compute proportion of positive predictions
        prop1_train[model_name] = round(sum(y_pred_tr)/len(y_pred_tr)*100, 2)
        prop1_test[model_name] = round(sum(y_pred)/len(y_pred)*100, 2)
    
    markdown_report = f"""
|                                  | xgb                   | lr                   | dnn                   |
|----------------------------------|-----------------------|----------------------|-----------------------|
|Train Accuracy                    | {acc_train["xgb"]}%   | {acc_train["lr"]}%   | {acc_train["dnn"]}%   |
|Test Accuracy                     | {acc_test["xgb"]}%    | {acc_test["lr"]}%    | {acc_test["dnn"]}%    |
|Proportion of 1s Predicted (Train)| {prop1_train["xgb"]}% | {prop1_train["lr"]}% | {prop1_train["dnn"]}% |
|Proportion of 1s Predicted (Test) | {prop1_test["xgb"]}%  | {prop1_test["lr"]}%  | {prop1_test["dnn"]}%  |
    """
    display(Markdown(markdown_report))

