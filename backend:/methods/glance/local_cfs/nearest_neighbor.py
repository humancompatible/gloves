from typing import List
import warnings

import pandas as pd
import numpy as np
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer

from ..base import LocalCounterfactualMethod
from ..utils.action import extract_actions_pandas, apply_actions_pandas_rows

class NearestNeighborMethod(LocalCounterfactualMethod):
    def __init__(self):
        super().__init__()

    def fit(
        self,
        model,
        data: pd.DataFrame,
        outcome_name: str,
        continuous_features: List[str],
        feat_to_vary: List[str],
        random_seed=13,
    ):
        X, y = data.drop(columns=[outcome_name]), data[outcome_name]
        self.numerical_features = continuous_features
        self.categorical_features = X.columns.difference(continuous_features).tolist()

        self.encoder = ColumnTransformer(
            [("ohe", OneHotEncoder(sparse=False), self.categorical_features)],
            remainder="passthrough",
        ).fit(X)

        train_preds = model.predict(X)
        self.train_unaffected = X[train_preds == 1]
        self.train_unaffected_one_hot = self.encoder.transform(self.train_unaffected)
        
        self.random_seed = random_seed
        self.feat_to_vary = feat_to_vary

    def explain_instances(
        self, instances: pd.DataFrame, num_counterfactuals: int
    ) -> pd.DataFrame:
        instances_one_not = self.encoder.transform(instances)
        if num_counterfactuals > self.train_unaffected.shape[0]:
            warnings.warn(f"{num_counterfactuals} were requested, but only {self.train_unaffected.shape[0]} unaffected instances given. Taking all.")
            num_counterfactuals = self.train_unaffected.shape[0]
        nn = NearestNeighbors(n_neighbors=num_counterfactuals).fit(self.train_unaffected_one_hot)
        distances, indices = nn.kneighbors(instances_one_not)

        cfs = [self.train_unaffected.iloc[row] for row in indices]

        return pd.concat(cfs, ignore_index=False)

class NearestNeighborsScaled(LocalCounterfactualMethod):
    def __init__(self):
        super().__init__()

    def fit(
        self,
        model,
        data: pd.DataFrame,
        outcome_name: str,
        continuous_features: List[str],
        n_scalars: int,
        random_seed=13,
    ):
        X, y = data.drop(columns=[outcome_name]), data[outcome_name]
        self.numerical_features = continuous_features
        self.categorical_features = X.columns.difference(continuous_features).tolist()
        self.model = model

        self.encoder = ColumnTransformer(
            [("ohe", OneHotEncoder(sparse=False), self.categorical_features)],
            remainder="passthrough",
        ).fit(X)

        train_preds = model.predict(X)
        self.train_unaffected = X[train_preds == 1]
        self.train_unaffected_one_hot = self.encoder.transform(self.train_unaffected)
        
        self.n_scalars = n_scalars
        self.random_seed = random_seed

    def explain_instances(
        self, instances: pd.DataFrame, num_counterfactuals: int
    ) -> pd.DataFrame:
        instances_one_not = self.encoder.transform(instances)
        if num_counterfactuals > self.train_unaffected.shape[0]:
            warnings.warn(f"{num_counterfactuals} were requested, but only {self.train_unaffected.shape[0]} unaffected instances given. Taking all.")
            num_counterfactuals = self.train_unaffected.shape[0]
        nn = NearestNeighbors(n_neighbors=num_counterfactuals).fit(self.train_unaffected_one_hot)
        distances, indices = nn.kneighbors(instances_one_not)

        factuals = instances.apply(lambda col: col.repeat(num_counterfactuals)).reset_index(drop=True)
        cfs = [self.train_unaffected.iloc[row] for row in indices]
        cfs = pd.concat(cfs, ignore_index=True)
        actions = extract_actions_pandas(
            X=factuals,
            cfs=cfs,
            categorical_features=self.categorical_features,
            numerical_features=self.numerical_features,
            categorical_no_action_token="-",
        )

        # and then scale
        scalars = np.linspace(0, 1 + 1 / self.n_scalars, self.n_scalars)
        all_scaling_factors = []
        for i, s in enumerate(scalars):
            candidate_actions = actions.copy()
            candidate_actions[self.numerical_features] *= s
            new_cfs = apply_actions_pandas_rows(
                X=factuals,
                actions=candidate_actions,
                numerical_columns=self.numerical_features,
                categorical_columns=self.categorical_features,
                categorical_no_action_token="-",
            )
            new_preds = self.model.predict(new_cfs)
            scaling_factors = np.where(new_preds == 1, s, np.nan)
            all_scaling_factors.append(scaling_factors)
        
        multipliers = np.array(all_scaling_factors).T
        n_notna_multipliers = np.sum(~ np.isnan(multipliers), axis=1)
        factuals = factuals.apply(lambda col: col.repeat(n_notna_multipliers)).reset_index(drop=True)
        actions = actions.apply(lambda col: col.repeat(n_notna_multipliers)).reset_index(drop=True)
        final_multipliers = multipliers.flatten()
        final_multipliers = final_multipliers[~ np.isnan(final_multipliers)]

        actions[self.numerical_features] = actions[self.numerical_features].mul(final_multipliers, axis="index")
        cfs = apply_actions_pandas_rows(
            X=factuals,
            actions=actions,
            numerical_columns=self.numerical_features,
            categorical_columns=self.categorical_features,
            categorical_no_action_token="-",
        )

        return cfs

