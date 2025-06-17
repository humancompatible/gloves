import pandas as pd
from methods.globe_ce.datasets import dataset_loader
import pickle
import numpy as np
from app.config import shared_resources
# This file holds the logic for fetching datasets and models
# In real usage, you would replace this with actual logic, like reading from a database

def get_available_datasets():
    # Simulate dataset retrieval
    print("Fetching available Datasets")
    return ["COMPAS Dataset", "Default Credit Dataset", "German Credit Dataset", "Heloc Dataset"]

def get_available_models():
    # Simulate model retrieval
    print("Fetching available Models")
    return ["XGBoost", "DNN", "LogisticRegression"]


def load_dataset_and_model(dataset_name, model_name):

    from methods.glance.utils.utils_data import preprocess_datasets, load_models
    print("Loading Datasets and Models")
    # Load the dataset and model
    train_dataset, data, X_train, y_train, X_test, y_test, affected, _unaffected, model, feat_to_vary, target_name ,num_features, cate_features= (
        preprocess_datasets(dataset_name, load_models(dataset_name, model_name), model_name)
    )
    predictions = model.predict(X_test)
    X_test['label'] = predictions

    return train_dataset, data, X_train, y_train, X_test, y_test, affected, _unaffected, model, feat_to_vary, target_name, num_features, cate_features

def reverse_one_hot(data_oh):
    """
    Reverse one-hot encoding to get the original categorical values.
    
    Input: 
        data_oh (one-hot encoded DataFrame)
    
    Output: 
        data_original (DataFrame in its original form)
    """
    data_decoded = pd.DataFrame()
    
    # Identify categorical columns (columns with ' = ' in their name)
    categorical_features = set(col.split(" = ")[0] for col in data_oh.columns if " = " in col)
    
    for feature in categorical_features:
        # Get columns corresponding to the feature
        cols = [col for col in data_oh.columns if col.startswith(feature + " = ")]
        
        # Get the original category by finding the column with a value of 1
        data_decoded[feature] = data_oh[cols].idxmax(axis=1).str.split(" = ").str[1]
    
    # Include numerical columns
    numerical_columns = [col for col in data_oh.columns if " = " not in col]
    data_decoded[numerical_columns] = data_oh[numerical_columns]
    
    return data_decoded

def load_dataset_and_model_globece(dataset_name,model_name):
        
    dataset = dataset_loader(dataset_name, dropped_features=[], n_bins=None)
    x_train, y_train, x_test, y_test, x_means, x_std = dataset.get_split(normalise=False, shuffle=False,
                                                                     return_mean_std=True)
    
    if model_name == 'dnn':
        from models import dnn_normalisers as normalisers
    elif model_name == 'lr':
        from models import lr_normalisers as normalisers
    else:  # no xgb normalisation
        normalisers = {dataset_name: False}
    with open('models/{}_{}.pkl'.format(dataset_name, model_name), 'rb') as f:
        B = pickle.load(f)
    normalise = [x_means, x_std] if normalisers[dataset_name] else None

    X_test = pd.DataFrame(x_test)
    X_test.columns = dataset.features[:-1]

    return dataset , X_test, B, normalise


def round_categorical(cf,features,features_tree):
        """
        This function is used after the optimization to compute the actual counterfactual
        Currently not implemented for optimization: argmax will likely break gradient descent
        
        Input: counterfactuals computed using x_aff + global translation
        Output: valid counterfactuals where one_hot encodings are integers (0 or 1), not floats
        """
        ret = np.zeros(cf.shape)
        i = 0
        for feature in features:  # requires list to maintain correct order
            if not features_tree[feature]:
                ret[:, i] = cf[:, i]
                i += 1
            else:
                n = len(features_tree[feature])
                ret[np.arange(ret.shape[0]), i+np.argmax(cf[:, i:i+n], axis=1)] = 1
                i += n
        return ret

def prepare_globece_data(dataset):
    for name in dataset.columns:
        dataset.continuous_features[name] = []
        for column in dataset.columns[name][:-1]:
            if column not in dataset.categorical_features[name]:
                dataset.continuous_features[name].append(column)
            
# Initialization
    if dataset.name is not None:  # process dataset if specified
        dataset.n_bins = None
        dataset.features = None  # processed in dataset.one_hot()
        dataset.features_tree = {}  # processed in dataset.one_hot()
        dataset.dropped_features = []
    # download and process data
        if dataset.n_bins is not None:
            dataset.categorical_features[dataset.name] = list(dataset.features_tree.keys())
            dataset.continuous_features[dataset.name] = {}

    return dataset


from sklearn import preprocessing
def one_hot(dataset,data):
        """
        Improvised method for one-hot encoding the data
        
        Input: data (whole dataset)
        Outputs: data_oh (one-hot encoded data)
                 features (list of feature values after one-hot encoding)
        """
        label_encoder = preprocessing.LabelEncoder()
        data_encode = data.copy()
        dataset.bins = {}
        dataset.bins_tree = {}
        
        # Assign encoded features to one hot columns
        data_oh, features = [], []
        for x in data.columns[:-1]:
            dataset.features_tree[x] = []
            categorical = x in dataset.categorical_features[dataset.name]
            if categorical:
                data_encode[x] = label_encoder.fit_transform(data_encode[x])
                cols = label_encoder.classes_
            elif dataset.n_bins is not None:
                data_encode[x] = pd.cut(data_encode[x].apply(lambda x: float(x)),
                                        bins=dataset.n_bins)
                cols = data_encode[x].cat.categories
                dataset.bins_tree[x] = {}
            else:
                data_oh.append(data[x])
                features.append(x)
                continue
                
            one_hot = pd.get_dummies(data_encode[x])
            if dataset.name=='compas' and x.lower()=='age_cat':
                one_hot = one_hot[[2, 0, 1]]
                cols = cols[[2, 0, 1]]
            data_oh.append(one_hot)
            for col in cols:
                feature_value = x + " = " + str(col)
                features.append(feature_value)
                dataset.features_tree[x].append(feature_value)
                if not categorical:
                    dataset.bins[feature_value] = col.mid
                    dataset.bins_tree[x][feature_value] = col.mid
                
        data_oh = pd.concat(data_oh, axis=1, ignore_index=True)
        data_oh.columns = features
        return data_oh, features

def get_data():
    data = shared_resources.get("data").copy(deep=True)
    X_test = shared_resources.get("X_test").copy(deep=True)
    model = shared_resources.get("model")
    preds = model.predict(X_test)
    X_test['label'] = preds
    affected = X_test[X_test.label == 0].reset_index()
    affected = affected.drop(columns='label')

    return data,X_test,affected