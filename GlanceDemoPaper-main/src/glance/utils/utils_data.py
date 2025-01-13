import os
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.base import BaseEstimator, TransformerMixin, clone
from sklearn.linear_model import LogisticRegression
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.metrics import accuracy_score
import pickle
import datetime
from glance.utils.dnn_with_preprocess_module import dnn_with_preprocess

from xgboost import XGBClassifier

import random


np.random.seed(42)
# tf.random.set_seed(42)
random.seed(42)


def get_split(data, ratio=0.8, normalise=True, shuffle=False, print_outputs=False):
    """
    Method for returning training/test split with optional normalisation/shuffling

    Inputs: ratio (proportion of training data)
            normalise (if True, normalises data)
            shuffle (if True, shuffles data)
    Outputs: train and test data
    """
    if shuffle:
        data = data.sample(frac=1)
    data = data.values
    train_idx = int(data.shape[0] * ratio)
    x_train, y_train = data[:train_idx, :-1], data[:train_idx, -1]
    x_test, y_test = data[train_idx:, :-1], data[train_idx:, -1]

    if print_outputs:
        print(
            "\033[1mProportion of 1s in Training Data:\033[0m {}%".format(
                round(np.average(y_train) * 100, 2)
            )
        )
        print(
            "\033[1mProportion of 1s in Test Data:\033[0m {}%".format(
                round(np.average(y_test) * 100, 2)
            )
        )

    return x_train, y_train, x_test, y_test


def load_models(dataset, model_name):
    B_name = model_name
    
    if os.path.exists("models/{}_{}.pkl".format(dataset, B_name)):
        with open("models/{}_{}.pkl".format(dataset, B_name), "rb") as f:
            print("models/{}_{}.pkl".format(dataset, B_name))
            B = pickle.load(f)
    else:
        if model_name == "lr":
            B = LogisticRegression()
        elif model_name == "xgb":
            B = XGBClassifier()
        else:
            print(f"load_models function cannot deal with these arguments: {dataset=}, {model_name=}. Returning None.")
            B = None

    return B


def process_compas(data):
    """
    Additional method to process specifically the COMPAS dataset

    Input: data (whole dataset)
    Output: data (whole dataset)
    """
    data = data.to_dict("list")
    for k in data.keys():
        data[k] = np.array(data[k])

    dates_in = data["c_jail_in"]
    dates_out = data["c_jail_out"]
    # this measures time in Jail
    time_served = []
    for i in range(len(dates_in)):
        di = datetime.datetime.strptime(dates_in[i], "%Y-%m-%d %H:%M:%S")
        do = datetime.datetime.strptime(dates_out[i], "%Y-%m-%d %H:%M:%S")
        time_served.append((do - di).days)
    time_served = np.array(time_served)
    time_served[time_served < 0] = 0
    data["time_served"] = time_served

    """ Filtering the data """
    # These filters are as taken by propublica
    # (refer to https://github.com/propublica/compas-analysis)
    # If the charge date of a defendants Compas scored crime was not within 30 days
    # from when the person was arrested, we assume that because of data quality
    # reasons, that we do not have the right offense.
    idx = np.logical_and(
        data["days_b_screening_arrest"] <= 30, data["days_b_screening_arrest"] >= -30
    )

    # We coded the recidivist flag -- is_recid -- to be -1
    # if we could not find a compas case at all.
    idx = np.logical_and(idx, data["is_recid"] != -1)

    # In a similar vein, ordinary traffic offenses -- those with a c_charge_degree of
    # 'O' -- will not result in Jail time are removed (only two of them).
    idx = np.logical_and(idx, data["c_charge_degree"] != "O")
    # F: felony, M: misconduct

    # We filtered the underlying data from Broward county to include only those rows
    # representing people who had either recidivated in two years, or had at least two
    # years outside of a correctional facility.
    idx = np.logical_and(idx, data["score_text"] != "NA")

    # select the examples that satisfy this criteria
    for k in data.keys():
        data[k] = data[k][idx]
    return pd.DataFrame(data)




def preprocess_datasets(dataset, B, model_name, dataset_folder="datasets/"):

    if dataset == "germannumeric_credit":
        data = pd.read_csv(
            Path(dataset_folder) / "germannumeric.data",
            header=None,
            delim_whitespace=True,
        )
        data.columns = data.columns.astype(str)
        data[data.columns[-1]] = 2 - data[data.columns[-1]]

        X_train, y_train, X_test, y_test = get_split(
            data, normalise=False, shuffle=False
        )
        X_train = pd.DataFrame(X_train, columns=data.columns[:-1])
        X_test = pd.DataFrame(X_test, columns=data.columns[:-1])
        num_features = X_train._get_numeric_data().columns.to_list()
        cate_features = X_train.columns.difference(num_features)
        if model_name == "dnn":
            model = dnn_with_preprocess(B, "german_credit_numeric", X_train, X_test)
        else:

            class IdentityTransformer(BaseEstimator, TransformerMixin):
                def __init__(self):
                    pass

                def fit(self, input_array, y=None):
                    return self

                def transform(self, input_array, y=None):
                    return input_array * 1

            model = Pipeline(
                [("preprocessor", IdentityTransformer()), ("classifier", B)]
            )

            model.fit(X_train, y_train)
        predictions = model.predict(X_test)

        accuracy = accuracy_score(y_test, predictions)
        print("Accuracy:", round(accuracy, 2))

        affected = X_test[predictions == 0].reset_index(drop=True)
        unaffected = X_test[predictions == 1].reset_index(drop=True)

        train_dataset = X_train.copy()
        for col in num_features:
            train_dataset[col] = train_dataset[col].astype(float)
        train_dataset["target"] = y_train

        feat_to_vary = list(affected.columns)

    if dataset == "german_credit":
        data = pd.read_csv(
            Path(dataset_folder) / "german.data", header=None, delim_whitespace=True
        )

        cols = [
            "Existing-Account-Status",
            "Month-Duration",
            "Credit-History",
            "Purpose",
            "Credit-Amount",
            "Savings-Account",
            "Present-Employment",
            "Instalment-Rate",
            "Sex",
            "Guarantors",
            "Residence",
            "Property",
            "Age",
            "Installment",
            "Housing",
            "Existing-Credits",
            "Job",
            "Num-People",
            "Telephone",
            "Foreign-Worker",
            "Status",
        ]

        data.columns = cols
        # Prepocess targets to Bad = 0, Good = 1
        data["Status"] = data["Status"].astype("int32")
        data[data.columns[-1]] = 2 - data[data.columns[-1]]

        dtype_dict = {
            "Month-Duration": "int64",
            "Credit-Amount": "int64",
            "Age": "int64",
            "Instalment-Rate": "int64",
            "Residence": "int64",
            "Existing-Credits": "int64",
            "Num-People": "int64",
        }

        X_train, y_train, X_test, y_test = get_split(
            data, normalise=False, shuffle=False
        )
        X_train = pd.DataFrame(X_train, columns=cols[:-1]).astype(dtype_dict)
        X_test = pd.DataFrame(X_test, columns=cols[:-1]).astype(dtype_dict)
        X_test.columns = cols[:-1]

        y_train = pd.Series(y_train, dtype="int32")
        y_test = pd.Series(y_test, dtype="int32")

        num_features = X_train._get_numeric_data().columns.to_list()
        cate_features = X_train.columns.difference(num_features)

        X_train.reset_index(drop=True, inplace=True)
        X_test.reset_index(drop=True, inplace=True)

        if model_name == "dnn":
            model = dnn_with_preprocess(B, "german", X_train, X_test)

        else:
            preprocessor = ColumnTransformer(
                transformers=[
                    (
                        "cat",
                        OneHotEncoder(sparse=False, handle_unknown="ignore"),
                        cate_features,
                    )
                ],
                remainder="passthrough",
            )

            model = Pipeline(
                [
                    ("preprocessor", preprocessor),
                    ("classifier", B),
                ]
            )

            model.fit(X_train, y_train)
        predictions = model.predict(X_test)

        accuracy = accuracy_score(y_test, predictions)
        print("Accuracy:", round(accuracy, 2))

        affected = X_test[predictions == 0].reset_index(drop=True)
        unaffected = X_test[predictions == 1].reset_index(drop=True)

        train_dataset = X_train.copy()
        for col in num_features:
            train_dataset[col] = train_dataset[col].astype(float)
        train_dataset["target"] = y_train

        feat_to_vary = list(affected.columns)
        feat_to_vary.remove("Sex")
        feat_to_vary.remove("Foreign-Worker")
        target_name = "Status"
    elif dataset == "compas":
        data = pd.read_csv(Path(dataset_folder) / "compas.data")
        data = data.dropna(subset=["days_b_screening_arrest"])  # drop missing vals
        data = data.rename(columns={data.columns[-1]: "status"})
        data = process_compas(data)
        cols = [
            "Sex",
            "Age_Cat",
            "Race",
            "C_Charge_Degree",
            "Priors_Count",
            "Time_Served",
            "Status",
        ]
        data = data[[col.lower() for col in cols]]
        data.columns = cols
        data[data.columns[-1]] = 1 - data[data.columns[-1]]
        X_train, y_train, X_test, y_test = get_split(
            data, normalise=False, shuffle=False
        )
        X_train = pd.DataFrame(X_train)
        X_train.columns = cols[:-1]
        X_test = pd.DataFrame(X_test)
        X_test.columns = cols[:-1]
        dtype_dict = {"Priors_Count": "int32", "Time_Served": "int32"}
        X_train = X_train.astype(dtype_dict)
        X_test = X_test.astype(dtype_dict)
        y_train = pd.Series(y_train, dtype="int32")
        y_test = pd.Series(y_test, dtype="int32")
        num_features = X_train._get_numeric_data().columns.to_list()
        cate_features = X_train.columns.difference(num_features)
        X_train.reset_index(drop=True, inplace=True)
        X_test.reset_index(drop=True, inplace=True)
        if model_name == "dnn":
            model = dnn_with_preprocess(B, "compas", X_train, X_test)
        else:

            preprocessor = ColumnTransformer(
                transformers=[
                    (
                        "cat",
                        OneHotEncoder(sparse=False, handle_unknown="ignore"),
                        cate_features,
                    )
                ],
                remainder="passthrough",
            )
            model = Pipeline(
                [
                    ("preprocessor", preprocessor),
                    ("classifier", B),
                ]
            )

            model.fit(X_train, y_train)

        predictions = model.predict(X_test)
        accuracy = accuracy_score(y_test, predictions)
        print("Accuracy:", round(accuracy, 2))
        affected = X_test[predictions == 0].reset_index(drop=True)
        unaffected = X_test[predictions == 1].reset_index(drop=True)
        
        train_dataset = X_train.copy()
        for col in num_features:
            train_dataset[col] = train_dataset[col].astype(float)
        train_dataset["target"] = y_train
        feat_to_vary = list(affected.columns)
        feat_to_vary.remove("Sex")
        target_name = "Status"
    elif dataset == "heloc":
        data = pd.read_csv(Path(dataset_folder) / "heloc.data")
        data = data[(data.iloc[:, 1:] >= 0).any(axis=1)]
        # Encode string labels
        data["RiskPerformance"] = data["RiskPerformance"].replace(
            ["Bad", "Good"], [0, 1]
        )
        # Move labels to final column (necessary for self.get_split)
        y = data.pop("RiskPerformance")
        data["RiskPerformance"] = y
        # Convert negative values to NaN
        data = data[data >= 0]
        # Replace NaN values with median
        nan_cols = data.isnull().any(axis=0)
        for col in data.columns:
            if nan_cols[col]:
                data[col] = data[col].replace(np.nan, np.nanmedian(data[col]))
        X_train, y_train, X_test, y_test = get_split(
            data, normalise=False, shuffle=False
        )
        X_train = pd.DataFrame(X_train)
        X_train.columns = data.columns[:-1]
        X_test = pd.DataFrame(X_test)
        X_test.columns = data.columns[:-1]
        X_train.reset_index(drop=True, inplace=True)
        X_test.reset_index(drop=True, inplace=True)
        y_train = pd.Series(y_train, dtype="int32")
        y_test = pd.Series(y_test, dtype="int32")
        num_features = X_train._get_numeric_data().columns.to_list()
        cate_features = X_train.columns.difference(num_features)
        if model_name == "dnn":
            model = dnn_with_preprocess(B, "heloc", X_train, X_test)
        else:

            class IdentityTransformer(BaseEstimator, TransformerMixin):
                def __init__(self):
                    pass

                def fit(self, input_array, y=None):
                    return self

                def transform(self, input_array, y=None):
                    return input_array * 1

            model = Pipeline(
                [("preprocessor", IdentityTransformer()), ("classifier", B)]
            )

            model.fit(X_train, y_train)

        predictions = model.predict(X_test)
        accuracy = accuracy_score(y_test, predictions)
        print("Accuracy:", round(accuracy, 2))
        affected = X_test[predictions == 0].reset_index(drop=True)
        unaffected = X_test[predictions == 1].reset_index(drop=True)

        train_dataset = X_train.copy()
        for col in num_features:
            train_dataset[col] = train_dataset[col].astype(float)
        train_dataset["target"] = y_train
        feat_to_vary = list(affected.columns)
        target_name = "RiskPerformance"
    elif dataset == "default_credit":
        data = pd.read_excel(Path(dataset_folder) / "default.data", header=1)
        data["default payment next month"] = data["default payment next month"].replace(
            {0: 1, 1: 0}
        )
        data["SEX"] = data["SEX"].astype(str)
        data["EDUCATION"] = data["EDUCATION"].astype(str)
        data["MARRIAGE"] = data["MARRIAGE"].astype(str)
        df = data.copy()
        df = df.drop(columns=["ID"])
        df = df.reset_index(drop=True)
        df = df.rename(columns={"default payment next month": "target"})

        numerical_columns = [
            col
            for col in df.columns
            if col
            not in [
                "SEX",
                "EDUCATION",
                "MARRIAGE",
                "PAY_0",
                "PAY_2",
                "PAY_3",
                "PAY_4",
                "PAY_5",
                "PAY_6",
            ]
        ]

        for col in numerical_columns:
            df[col] = df[col].astype(int)

        for col in df.columns:
            if col not in numerical_columns:
                df[col] = df[col].astype(str)
        cols = [
            "Limit_Bal",
            "Sex",
            "Education",
            "Marriage",
            "Age",
            "Pay_0",
            "Pay_2",
            "Pay_3",
            "Pay_4",
            "Pay_5",
            "Pay_6",
            "Bill_Amt1",
            "Bill_Amt2",
            "Bill_Amt3",
            "Bill_Amt4",
            "Bill_Amt5",
            "Bill_Amt6",
            "Pay_Amt1",
            "Pay_Amt2",
            "Pay_Amt3",
            "Pay_Amt4",
            "Pay_Amt5",
            "Pay_Amt6",
            "Status",
        ]
        X_train, y_train, X_test, y_test = get_split(df, normalise=False, shuffle=False)
        X_train = pd.DataFrame(X_train)
        X_train.columns = df.columns[:-1]
        X_test = pd.DataFrame(X_test)
        X_test.columns = df.columns[:-1]
        X_train = X_train.astype(dict(df.drop(columns="target").dtypes))

        X_test = X_test.astype(dict(df.drop(columns="target").dtypes))
        y_train = pd.Series(y_train, dtype="int32")
        y_test = pd.Series(y_test, dtype="int32")
        X_train.reset_index(drop=True, inplace=True)
        X_test.reset_index(drop=True, inplace=True)

        num_features = X_train._get_numeric_data().columns.to_list()
        cate_features = X_train.columns.difference(num_features)

        if model_name == "dnn":
            model = dnn_with_preprocess(B, "default", X_train, X_test)
        elif model_name == "lr":

            preprocessor = ColumnTransformer(
                transformers=[
                    (
                        "cat",
                        OneHotEncoder(sparse=False, handle_unknown="ignore"),
                        cate_features,
                    ),
                    (
                        "num",
                        StandardScaler(),
                        num_features,
                    ),
                ],
                remainder="passthrough",
            )
            model = Pipeline(
                [
                    ("preprocessor", preprocessor),
                    ("classifier", B),
                ]
            )

            model.fit(X_train, y_train)
        else:

            preprocessor = ColumnTransformer(
                transformers=[
                    (
                        "cat",
                        OneHotEncoder(sparse=False, handle_unknown="ignore"),
                        cate_features,
                    )
                ],
                remainder="passthrough",
            )
            model = Pipeline(
                [
                    ("preprocessor", preprocessor),
                    ("classifier", B),
                ]
            )

            model.fit(X_train, y_train)
        predictions = model.predict(X_test)

        accuracy = accuracy_score(y_test, predictions)
        print("Accuracy:", round(accuracy, 2))
        affected = X_test[predictions == 0].reset_index(drop=True)
        unaffected = X_test[predictions == 1].reset_index(drop=True)

        train_dataset = X_train.copy()
        for col in num_features:
            train_dataset[col] = train_dataset[col].astype(float)
        train_dataset["target"] = y_train
        feat_to_vary = list(affected.columns)
        feat_to_vary.remove("SEX")
        data = df
        target_name = "target"

    return (
        train_dataset,
        data,
        X_train,
        y_train,
        X_test,
        y_test,
        affected,
        unaffected,
        model,
        feat_to_vary,
        target_name,
    )
