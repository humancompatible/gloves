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

    from src.glance.utils.utils_data import preprocess_datasets, load_models
    print("Loading Datasets and Models")
    # Load the dataset and model
    train_dataset, data, X_train, y_train, X_test, y_test, affected, _unaffected, model, feat_to_vary, target_name = (
        preprocess_datasets(dataset_name, load_models(dataset_name, model_name), model_name)
    )
    predictions = model.predict(X_test)
    X_test['label'] = predictions

    return train_dataset, data, X_train, y_train, X_test, y_test, affected, _unaffected, model, feat_to_vary, target_name 