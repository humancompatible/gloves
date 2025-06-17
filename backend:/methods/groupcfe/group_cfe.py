import pandas as pd
import numpy as np
import dice_ml
from dice_ml.utils import helpers
from typing import Union, Any, List, Optional, Dict, Tuple, Callable, Literal
from sklearn.cluster import KMeans
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
import warnings
warnings.filterwarnings('ignore')
from methods.glance.counterfactual_costs import build_dist_func_dataframe
from IPython.display import display

class Group_CF():

    def __init__(
        self,
        model: Any,
        train_dataset: pd.DataFrame,
        data: pd.DataFrame,
        affected: pd.DataFrame,
        unaffected: pd.DataFrame,
        numerical_features: List[str],
        categorical_features: List[str],
        target: str,
        feat_to_vary: List[str],
        clusters: int = 3,
        num_local_counterfactuals: int = 1,
        sample_size_gcfe_pairs: int = 50,
        random_seed: int = 13,
    ) -> None:
        super().__init__()
        self.model = model
        self.train_dataset = train_dataset
        self.data = data
        self.affected = affected
        self.unaffected = unaffected
        self.numerical_features = numerical_features
        self.categorical_features = categorical_features
        self.target = target
        self.feat_to_vary = feat_to_vary
        self.clusters = clusters
        self.num_local_counterfactuals = num_local_counterfactuals
        self.sample_size_gcfe_pairs = sample_size_gcfe_pairs
        self.random_seed = random_seed
        
        
    def explain_group(self,):
        
        #Create clusters from affected
        print("Creating Clusters")
        clusters = _generate_clusters(self.affected,self.clusters,self.categorical_features)

        #Generate counterfactuals in order to find key features for each cluster
        print("Generating counterfactuals for each instance of each clusters in order to find key features")
        d = dice_ml.Data(dataframe=self.train_dataset, continuous_features=self.numerical_features, outcome_name='target') #nb capitol loss
        m = dice_ml.Model(model=self.model, backend="sklearn")
        exp = dice_ml.Dice(d, m, method='random')
        
        cfs_list = []
        for i,cluster in enumerate(clusters):
            cfs = generate_counterfactuals(clusters[i],1,exp,self.feat_to_vary)
            cfs_list.append(cfs)
            
        # Find key features that change the most times
        print("Finding key difference features")
        key_difference_features_list = []
        direction_info_list = []
        for i in range(len(cfs_list)):
            #direction_info below if you put directions
            key_difference_features,change_counts = get_key_difference_features(cfs_list[i], clusters[i],'target')
            key_difference_features_list.append(key_difference_features)
            #direction_info_list.append(direction_info)
        
        
        #Find group candidate counterfactuals from unaffected
        print("Finding candidate counterfactuals from unaffacted")
        candidate_counterfactuals_list = []
        for i in  range(len(cfs_list)):
            counterfactuals = pd.concat(cfs_list[i])
            #direction_info = direction_info_list[i]
            key_features = key_difference_features_list[i]
            candidate_counterfactuals = generate_candidate_group_counterfactuals(self.unaffected,key_difference_features_list[i],100,clusters[i])
            candidate_counterfactuals_list.append(candidate_counterfactuals)
            
        #Select best counterfactual for each cluster from the candidate counterfactuals
        dist_func_dataframe = build_dist_func_dataframe(
                X=self.data.drop(columns=self.target),
                numerical_columns=self.numerical_features,
                categorical_columns=self.categorical_features,
            )
        
        effs = []
        costs = []
        best_cfs = []
        print("Finding best counterfactual for each cluster")
        for i in range(len(candidate_counterfactuals_list)):
            
            best_counterfactual , best_coverage , best_cost = select_best_counterfactual(self.model, candidate_counterfactuals_list[i], clusters[i],key_difference_features_list[i],dist_func_dataframe)
            
            
            effs.append(best_coverage)
            costs.append(best_cost)
            best_cfs.append(best_counterfactual)
            print(f"Cluster {i} with size {len(clusters[i])}")
            display(best_counterfactual.to_frame().T)
            print(f"Effectiveness : {round(best_coverage,2)*100}% with cost: {best_cost} ")
                  
        total_eff, total_cost,all_predictions, chosen_actions, costs_list, final_costs = cumulative(self.affected, best_cfs, self.model,dist_func_dataframe)
        print(f"Total Effectiveness : {round(total_eff,2)*100}% with cost {total_cost}")
        
        return best_cfs,effs,costs,total_eff,total_cost,all_predictions, chosen_actions, costs_list , final_costs
            
        

def _generate_clusters(
    instances: pd.DataFrame,
    num_clusters: int,
    categorical_features_names: List[str],
) -> Dict[int, pd.DataFrame]:
    ohe_instances = _one_hot_encode(instances, categorical_features_names)
    clustering_method = KMeans(
            n_clusters=num_clusters, n_init=10, random_state=13)
    clustering_method.fit(ohe_instances)
    assigned_clusters = clustering_method.predict(ohe_instances)

    cluster_ids = np.unique(assigned_clusters)
    cluster_ids.sort()
    clusters = {i: instances.iloc[assigned_clusters == i] for i in cluster_ids}

    return clusters


def _one_hot_encode(X: pd.DataFrame, categorical_columns: List[str]) -> pd.DataFrame:
    transformer = ColumnTransformer(
        [("ohe", OneHotEncoder(sparse=False), categorical_columns)],
        remainder="passthrough",
    )
    ret = transformer.fit_transform(X)
    assert isinstance(ret, np.ndarray)
    return pd.DataFrame(ret, columns=transformer.get_feature_names_out())


def generate_counterfactuals(instances,num_cf,exp,feat_to_vary):
    cfs = []
    failed_indices = []
    for index,row in instances.iterrows():
        try:
            e1 = exp.generate_counterfactuals(row.to_frame().T, total_CFs=1, desired_class=1,
                                     features_to_vary=feat_to_vary, random_seed=13)
            cfs.append(e1.cf_examples_list[0].final_cfs_df)
        except Exception as e:
            cfs.append(row.to_frame().T)
            continue
    return cfs

def get_key_difference_features(counterfactuals, query_instances,target):
    counterfactuals = pd.concat(counterfactuals).drop(columns=target)
    if query_instances.shape != counterfactuals.shape:
        raise ValueError("Dataframes must have the same shape")
        
    change_counts = (query_instances.reset_index(drop=True) != counterfactuals.reset_index(drop=True)).sum()
    top_features = change_counts.sort_values(ascending=False).head(2)
    
#     direction_info = {}
#     for feature in top_features.index:
#         if pd.api.types.is_numeric_dtype(query_instances[feature]):
#             # Calculate the difference
#             differences = counterfactuals[feature] - query_instances[feature]
#             # Determine the direction of the changes
#             increasing_changes = (differences > 0).sum()
#             decreasing_changes = (differences < 0).sum()
#             if increasing_changes > decreasing_changes:
#                 direction_info[feature] = 'increasing'
#             elif decreasing_changes > increasing_changes:
#                 direction_info[feature] = 'decreasing'
#             else:
#                 direction_info[feature] = 'inconclusive'
#         else:
#             direction_info[feature] = 'non-numeric feature'
    
    return list(top_features.index), change_counts 
    
#     return list(top_features.index),change_counts,direction_info


def generate_candidate_group_counterfactuals(unaffected, key_features, sample_size_gcfe_pairs,original):
    filtered_df2 = unaffected.merge(original[[key_features[0], key_features[1]]], on=[key_features[0], key_features[1]], how='left', indicator=True)
    filtered_df2 = filtered_df2[filtered_df2['_merge'] == 'left_only']

    # Drop the '_merge' column
    filtered_df2 = filtered_df2.drop(columns=['_merge'])
    if len(filtered_df2[[key_features[0], key_features[1]]].drop_duplicates()) > sample_size_gcfe_pairs:
        candidate_counterfactuals = filtered_df2[[key_features[0], key_features[1]]].drop_duplicates().sample(n=sample_size_gcfe_pairs)
    else: 
        candidate_counterfactuals = filtered_df2[[key_features[0], key_features[1]]].drop_duplicates()
    return candidate_counterfactuals.reset_index(drop=True)

# def generate_candidate_group_counterfactuals(unaffected, key_features, sample_size_gcfe_pairs, direction_info, counterfactuals):
#     candidate_counterfactuals = pd.DataFrame()
    
#     for feature in key_features:
#         if direction_info[feature] == 'increasing':
#             min_value = counterfactuals[feature].min()
#             unaffected = unaffected[(unaffected[feature] <= unaffected[feature].max()) & (unaffected[feature] >  min_value)]
#             if len(unaffected) < sample_size_gcfe_pairs:
#                 samples = unaffected[feature]
#             else:
#                 samples = unaffected[feature].sample(n=sample_size_gcfe_pairs).values
#         elif direction_info[feature] == 'decreasing':
#             max_value = counterfactuals[feature].max()
#             unaffected = unaffected[(unaffected[feature] >= unaffected[feature].min()) & (unaffected[feature] <  max_value)]
#             if len(unaffected) < sample_size_gcfe_pairs:
#                 samples = unaffected[feature]
#             else:
#                 samples = unaffected[feature].sample(n=sample_size_gcfe_pairs).values
#         else:
#             # Handle the non-numeric or equally increasing and decreasing cases by sampling within the entire range
#             if len(unaffected.drop_duplicates()) < sample_size_gcfe_pairs:
#                 samples = unaffected[feature]
#             else:
#                 samples = unaffected[feature].sample(n=sample_size_gcfe_pairs).values        
#         candidate_counterfactuals[feature] = samples
    
#     return candidate_counterfactuals.reset_index(drop=True)

def select_best_counterfactual(model, candidate_counterfactuals, similar_instances,key_features,dist_func_dataframe):
    best_counterfactual = None
    
    best_coverage = 0
    best_cost = 0
    original_instances = similar_instances.copy(deep=True)
    
    for index, row in candidate_counterfactuals.iterrows():
        similar_instances[key_features[0]] = row[key_features[0]]
        similar_instances[key_features[1]] = row[key_features[1]]
        predictions = model.predict(similar_instances)
        count = 0
        for prediction in predictions:
            if prediction == 1:
                count = count+1
                
        coverage = count / len(similar_instances)
        cost = dist_func_dataframe(original_instances.reset_index(drop=True),similar_instances.reset_index(drop=True))
        cost = cost[predictions==1]
        cost = cost.mean()

        
    #or (coverage == best_coverage and cost < best_cost)
        if coverage > best_coverage:
            best_coverage = coverage
            best_counterfactual = row
            best_cost = cost
        similar_instances = original_instances.copy(deep=True)
    return best_counterfactual , best_coverage , best_cost

def cumulative(instances, best_cfs, model,dist_func_dataframe):

    all_predictions = {}
    original_instances = instances.copy(deep=True)
    costs = [] 
    i=0
    for series in best_cfs:
        # Apply the changes from the series to the instances DataFrame
        for col, value in series.items():
            instances[col] = value
        # Predict new labels
        new_predictions = model.predict(instances)
        all_predictions[i+1]=new_predictions
        i=i+1
        cur_costs = dist_func_dataframe(original_instances.reset_index(drop=True), instances.reset_index(drop=True))

        cur_costs[new_predictions == 0] = np.inf
        costs.append(cur_costs)
        instances = original_instances.copy(deep=True)

    final_costs = np.column_stack(costs).min(axis=1)
    effectiveness = (final_costs != np.inf).sum()
    cost = final_costs[final_costs != np.inf].sum()
    final_output = []

    for row in np.column_stack(costs):
        if np.all(row == np.inf):
            final_output.append(np.inf)
        else:
            min_index = np.argmin(row)  
            final_output.append(min_index)

    return effectiveness/len(original_instances), cost/effectiveness, all_predictions, final_output , costs, final_costs