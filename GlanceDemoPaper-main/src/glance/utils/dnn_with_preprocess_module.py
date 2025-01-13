# import keras
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import pandas as pd
import warnings
from sklearn import preprocessing
warnings.filterwarnings("ignore")

def one_hot(data,categorical_features,dataset_name):
        """
        Improvised method for one-hot encoding the data
        
        Input: data (whole dataset)
        Outputs: data_oh (one-hot encoded data)
                 features (list of feature values after one-hot encoding)
        """
        label_encoder = preprocessing.LabelEncoder()
        data_encode = data.copy()
        n_bins= None
        bins = {}
        bins_tree = {}
        features_tree = {}
        # Assign encoded features to one hot columns
        data_oh, features = [], []
        for x in data.columns:
            features_tree[x] = []
            categorical = x in categorical_features
            if categorical:
                data_encode[x] = label_encoder.fit_transform(data_encode[x])
                cols = label_encoder.classes_
            elif n_bins is not None:
                data_encode[x] = pd.cut(data_encode[x].apply(lambda x: float(x)),
                                        bins=n_bins)
                cols = data_encode[x].cat.categories
                bins_tree[x] = {}
            else:
                data_oh.append(data[x])
                features.append(x)
                continue
                
            one_hot = pd.get_dummies(data_encode[x])
            if dataset_name=='compas' and x.lower()=='age_cat':
                one_hot = one_hot[[2, 0, 1]]
                cols = cols[[2, 0, 1]]
            data_oh.append(one_hot)
            for col in cols:
                feature_value = x + " = " + str(col)
                features.append(feature_value)
                features_tree[x].append(feature_value)
                if not categorical:
                    bins[feature_value] = col.mid
                    bins_tree[x][feature_value] = col.mid
                
        data_oh = pd.concat(data_oh, axis=1, ignore_index=True)
        data_oh.columns = features
        return data_oh, features


class dnn_with_preprocess:
    def __init__(self, dnn, dataset, X_train, X_test):
        self.dnn = dnn
        self.dataset = dataset
        self.X_train = X_train
        self.X_test = X_test


    def transform(self, X):
        X = pd.get_dummies(X)

        if self.dataset == "german_credit":
            cols = [
                "Existing-Account-Status_A11",
                "Existing-Account-Status_A12",
                "Existing-Account-Status_A13",
                "Existing-Account-Status_A14",
                "Month-Duration",
                "Credit-History_A30",
                "Credit-History_A31",
                "Credit-History_A32",
                "Credit-History_A33",
                "Credit-History_A34",
                "Purpose_A40",
                "Purpose_A41",
                "Purpose_A410",
                "Purpose_A42",
                "Purpose_A43",
                "Purpose_A44",
                "Purpose_A45",
                "Purpose_A46",
                "Purpose_A48",
                "Purpose_A49",
                "Credit-Amount",
                "Savings-Account_A61",
                "Savings-Account_A62",
                "Savings-Account_A63",
                "Savings-Account_A64",
                "Savings-Account_A65",
                "Present-Employment_A71",
                "Present-Employment_A72",
                "Present-Employment_A73",
                "Present-Employment_A74",
                "Present-Employment_A75",
                "Instalment-Rate_1",
                "Instalment-Rate_2",
                "Instalment-Rate_3",
                "Instalment-Rate_4",
                "Sex_A91",
                "Sex_A92",
                "Sex_A93",
                "Sex_A94",
                "Guarantors_A101",
                "Guarantors_A102",
                "Guarantors_A103",
                "Residence_1",
                "Residence_2",
                "Residence_3",
                "Residence_4",
                "Property_A121",
                "Property_A122",
                "Property_A123",
                "Property_A124",
                "Age",
                "Installment_A141",
                "Installment_A142",
                "Installment_A143",
                "Housing_A151",
                "Housing_A152",
                "Housing_A153",
                "Existing-Credits_1",
                "Existing-Credits_2",
                "Existing-Credits_3",
                "Existing-Credits_4",
                "Job_A171",
                "Job_A172",
                "Job_A173",
                "Job_A174",
                "Num-People_1",
                "Num-People_2",
                "Telephone_A191",
                "Telephone_A192",
                "Foreign-Worker_A201",
                "Foreign-Worker_A202",
            ]
            X = X.reindex(columns=cols)

        elif self.dataset == "compas":
            cols = [
                "Sex_Female",
                "Sex_Male",
                "Age_Cat_Less than 25",
                "Age_Cat_25 - 45",
                "Age_Cat_Greater than 45",
                "Race_African-American",
                "Race_Asian",
                "Race_Caucasian",
                "Race_Hispanic",
                "Race_Native American",
                "Race_Other",
                "C_Charge_Degree_F",
                "C_Charge_Degree_M",
                "Priors_Count",
                "Time_Served",
            ]
            X = X.reindex(columns=cols)
        elif self.dataset == "default_credit":
            cols = [
                "LIMIT_BAL",
                "SEX_1",
                "SEX_2",
                "EDUCATION_0",
                "EDUCATION_1",
                "EDUCATION_2",
                "EDUCATION_3",
                "EDUCATION_4",
                "EDUCATION_5",
                "EDUCATION_6",
                "MARRIAGE_0",
                "MARRIAGE_1",
                "MARRIAGE_2",
                "MARRIAGE_3",
                "AGE",
                "PAY_0_-2",
                "PAY_0_-1",
                "PAY_0_0",
                "PAY_0_1",
                "PAY_0_2",
                "PAY_0_3",
                "PAY_0_4",
                "PAY_0_5",
                "PAY_0_6",
                "PAY_0_7",
                "PAY_0_8",
                "PAY_2_-2",
                "PAY_2_-1",
                "PAY_2_0",
                "PAY_2_1",
                "PAY_2_2",
                "PAY_2_3",
                "PAY_2_4",
                "PAY_2_5",
                "PAY_2_6",
                "PAY_2_7",
                "PAY_2_8",
                "PAY_3_-2",
                "PAY_3_-1",
                "PAY_3_0",
                "PAY_3_1",
                "PAY_3_2",
                "PAY_3_3",
                "PAY_3_4",
                "PAY_3_5",
                "PAY_3_6",
                "PAY_3_7",
                "PAY_3_8",
                "PAY_4_-2",
                "PAY_4_-1",
                "PAY_4_0",
                "PAY_4_1",
                "PAY_4_2",
                "PAY_4_3",
                "PAY_4_4",
                "PAY_4_5",
                "PAY_4_6",
                "PAY_4_7",
                "PAY_4_8",
                "PAY_5_-2",
                "PAY_5_-1",
                "PAY_5_0",
                "PAY_5_2",
                "PAY_5_3",
                "PAY_5_4",
                "PAY_5_5",
                "PAY_5_6",
                "PAY_5_7",
                "PAY_5_8",
                "PAY_6_-2",
                "PAY_6_-1",
                "PAY_6_0",
                "PAY_6_2",
                "PAY_6_3",
                "PAY_6_4",
                "PAY_6_5",
                "PAY_6_6",
                "PAY_6_7",
                "PAY_6_8",
                "BILL_AMT1",
                "BILL_AMT2",
                "BILL_AMT3",
                "BILL_AMT4",
                "BILL_AMT5",
                "BILL_AMT6",
                "PAY_AMT1",
                "PAY_AMT2",
                "PAY_AMT3",
                "PAY_AMT4",
                "PAY_AMT5",
                "PAY_AMT6",
            ]
            X = X.reindex(columns=cols)

        return X

    def fit(self, X, y):
        self.X_train = X
        if self.dataset == "german":
            X = pd.get_dummies(X)
            cols = [
                "Existing-Account-Status_A11",
                "Existing-Account-Status_A12",
                "Existing-Account-Status_A13",
                "Existing-Account-Status_A14",
                "Month-Duration",
                "Credit-History_A30",
                "Credit-History_A31",
                "Credit-History_A32",
                "Credit-History_A33",
                "Credit-History_A34",
                "Purpose_A40",
                "Purpose_A41",
                "Purpose_A410",
                "Purpose_A42",
                "Purpose_A43",
                "Purpose_A44",
                "Purpose_A45",
                "Purpose_A46",
                "Purpose_A48",
                "Purpose_A49",
                "Credit-Amount",
                "Savings-Account_A61",
                "Savings-Account_A62",
                "Savings-Account_A63",
                "Savings-Account_A64",
                "Savings-Account_A65",
                "Present-Employment_A71",
                "Present-Employment_A72",
                "Present-Employment_A73",
                "Present-Employment_A74",
                "Present-Employment_A75",
                "Instalment-Rate_1",
                "Instalment-Rate_2",
                "Instalment-Rate_3",
                "Instalment-Rate_4",
                "Sex_A91",
                "Sex_A92",
                "Sex_A93",
                "Sex_A94",
                "Guarantors_A101",
                "Guarantors_A102",
                "Guarantors_A103",
                "Residence_1",
                "Residence_2",
                "Residence_3",
                "Residence_4",
                "Property_A121",
                "Property_A122",
                "Property_A123",
                "Property_A124",
                "Age",
                "Installment_A141",
                "Installment_A142",
                "Installment_A143",
                "Housing_A151",
                "Housing_A152",
                "Housing_A153",
                "Existing-Credits_1",
                "Existing-Credits_2",
                "Existing-Credits_3",
                "Existing-Credits_4",
                "Job_A171",
                "Job_A172",
                "Job_A173",
                "Job_A174",
                "Num-People_1",
                "Num-People_2",
                "Telephone_A191",
                "Telephone_A192",
                "Foreign-Worker_A201",
                "Foreign-Worker_A202",
            ]

            X = X.reindex(columns=cols)
            X = X.fillna(int(0))
            X = X.to_numpy()

        elif self.dataset == "compas":
            X = pd.get_dummies(X)
            cols = [
                "Sex_Female",
                "Sex_Male",
                "Age_Cat_Less than 25",
                "Age_Cat_25 - 45",
                "Age_Cat_Greater than 45",
                "Race_African-American",
                "Race_Asian",
                "Race_Caucasian",
                "Race_Hispanic",
                "Race_Native American",
                "Race_Other",
                "C_Charge_Degree_F",
                "C_Charge_Degree_M",
                "Priors_Count",
                "Time_Served",
            ]

            X = X.reindex(columns=cols)
            X = X.fillna(int(0))
            X = X.to_numpy()

        elif self.dataset == "heloc":
            X = X.to_numpy()

        elif self.dataset == "german_credit_numeric":
            X = X.to_numpy()

        elif self.dataset == "default":
            X = pd.get_dummies(X)
            cols = [
                "LIMIT_BAL",
                "SEX_1",
                "SEX_2",
                "EDUCATION_0",
                "EDUCATION_1",
                "EDUCATION_2",
                "EDUCATION_3",
                "EDUCATION_4",
                "EDUCATION_5",
                "EDUCATION_6",
                "MARRIAGE_0",
                "MARRIAGE_1",
                "MARRIAGE_2",
                "MARRIAGE_3",
                "AGE",
                "PAY_0_-2",
                "PAY_0_-1",
                "PAY_0_0",
                "PAY_0_1",
                "PAY_0_2",
                "PAY_0_3",
                "PAY_0_4",
                "PAY_0_5",
                "PAY_0_6",
                "PAY_0_7",
                "PAY_0_8",
                "PAY_2_-2",
                "PAY_2_-1",
                "PAY_2_0",
                "PAY_2_1",
                "PAY_2_2",
                "PAY_2_3",
                "PAY_2_4",
                "PAY_2_5",
                "PAY_2_6",
                "PAY_2_7",
                "PAY_2_8",
                "PAY_3_-2",
                "PAY_3_-1",
                "PAY_3_0",
                "PAY_3_1",
                "PAY_3_2",
                "PAY_3_3",
                "PAY_3_4",
                "PAY_3_5",
                "PAY_3_6",
                "PAY_3_7",
                "PAY_3_8",
                "PAY_4_-2",
                "PAY_4_-1",
                "PAY_4_0",
                "PAY_4_1",
                "PAY_4_2",
                "PAY_4_3",
                "PAY_4_4",
                "PAY_4_5",
                "PAY_4_6",
                "PAY_4_7",
                "PAY_4_8",
                "PAY_5_-2",
                "PAY_5_-1",
                "PAY_5_0",
                "PAY_5_2",
                "PAY_5_3",
                "PAY_5_4",
                "PAY_5_5",
                "PAY_5_6",
                "PAY_5_7",
                "PAY_5_8",
                "PAY_6_-2",
                "PAY_6_-1",
                "PAY_6_0",
                "PAY_6_2",
                "PAY_6_3",
                "PAY_6_4",
                "PAY_6_5",
                "PAY_6_6",
                "PAY_6_7",
                "PAY_6_8",
                "BILL_AMT1",
                "BILL_AMT2",
                "BILL_AMT3",
                "BILL_AMT4",
                "BILL_AMT5",
                "BILL_AMT6",
                "PAY_AMT1",
                "PAY_AMT2",
                "PAY_AMT3",
                "PAY_AMT4",
                "PAY_AMT5",
                "PAY_AMT6",
            ]

            X = X.reindex(columns=cols)
            X = X.fillna(int(0))
            X = X.to_numpy()

        if self.dataset in ["german", "default", "german_credit_numeric"]:
            x_means, x_stds = X.mean(axis=0), X.std(axis=0)
            X = (X - x_means) / x_stds

        # optimizer = keras.optimizers.Adam(learning_rate=0.001)
        # self.dnn.compile(optimizer=optimizer, loss="binary_crossentropy", metrics=["accuracy"])
        X_train_smol, X_val, y_train_smol, y_val = train_test_split(X, y, test_size=0.2)
        self.dnn.fit(
            X,
            y,
            batch_size=200,
            epochs=200,
            verbose=1,
            validation_data=(X_val.values, y_val.values),
        )

    def score(self, X, y_true):
        preds = self.predict(X)
        return accuracy_score(y_true=y_true, y_pred=preds)

    def predict(self, X_test):
        
        if self.dataset == "german":
            cate_features = ['Existing-Account-Status', 'Credit-History', 'Purpose',
                              'Savings-Account', 'Present-Employment', 'Instalment-Rate',
                              'Sex', 'Guarantors', 'Residence', 'Property', 'Installment',
                              'Housing', 'Existing-Credits', 'Job', 'Num-People',
                              'Telephone', 'Foreign-Worker']
            X_train, feat = one_hot(self.X_train,cate_features,'german')
            X_test , feat= one_hot(X_test,cate_features,'german')
            # X_train = pd.get_dummies(X_train)
            # X_test = pd.get_dummies(X_test)

            cols = [
                "Existing-Account-Status_A11",
                "Existing-Account-Status_A12",
                "Existing-Account-Status_A13",
                "Existing-Account-Status_A14",
                "Month-Duration",
                "Credit-History_A30",
                "Credit-History_A31",
                "Credit-History_A32",
                "Credit-History_A33",
                "Credit-History_A34",
                "Purpose_A40",
                "Purpose_A41",
                "Purpose_A410",
                "Purpose_A42",
                "Purpose_A43",
                "Purpose_A44",
                "Purpose_A45",
                "Purpose_A46",
                "Purpose_A48",
                "Purpose_A49",
                "Credit-Amount",
                "Savings-Account_A61",
                "Savings-Account_A62",
                "Savings-Account_A63",
                "Savings-Account_A64",
                "Savings-Account_A65",
                "Present-Employment_A71",
                "Present-Employment_A72",
                "Present-Employment_A73",
                "Present-Employment_A74",
                "Present-Employment_A75",
                "Instalment-Rate_1",
                "Instalment-Rate_2",
                "Instalment-Rate_3",
                "Instalment-Rate_4",
                "Sex_A91",
                "Sex_A92",
                "Sex_A93",
                "Sex_A94",
                "Guarantors_A101",
                "Guarantors_A102",
                "Guarantors_A103",
                "Residence_1",
                "Residence_2",
                "Residence_3",
                "Residence_4",
                "Property_A121",
                "Property_A122",
                "Property_A123",
                "Property_A124",
                "Age",
                "Installment_A141",
                "Installment_A142",
                "Installment_A143",
                "Housing_A151",
                "Housing_A152",
                "Housing_A153",
                "Existing-Credits_1",
                "Existing-Credits_2",
                "Existing-Credits_3",
                "Existing-Credits_4",
                "Job_A171",
                "Job_A172",
                "Job_A173",
                "Job_A174",
                "Num-People_1",
                "Num-People_2",
                "Telephone_A191",
                "Telephone_A192",
                "Foreign-Worker_A201",
                "Foreign-Worker_A202",
            ]

            X_test = X_test.reindex(columns=X_train.columns)
            # X_train = X_train.reindex(columns=cols)
            # X_train = X_train.fillna(int(0))
            X_test = X_test.fillna(int(0))
            X_test = X_test.to_numpy()

        elif self.dataset == "compas":
            X_train = pd.get_dummies(self.X_train)
            X_test = pd.get_dummies(X_test)
            cols = [
                "Sex_Female",
                "Sex_Male",
                "Age_Cat_Less than 25",
                "Age_Cat_25 - 45",
                "Age_Cat_Greater than 45",
                "Race_African-American",
                "Race_Asian",
                "Race_Caucasian",
                "Race_Hispanic",
                "Race_Native American",
                "Race_Other",
                "C_Charge_Degree_F",
                "C_Charge_Degree_M",
                "Priors_Count",
                "Time_Served",
            ]

            X_test = X_test.reindex(columns=cols)
            X_train = X_train.reindex(columns=cols)
            X_train = X_train.fillna(int(0))
            X_test = X_test.fillna(int(0))
            X_test = X_test.to_numpy()

        elif self.dataset == "heloc":
            X_train = self.X_train
            X_test = X_test.to_numpy()

        elif self.dataset == "german_credit_numeric":
            X_train = self.X_train
            X_test = X_test.to_numpy()
        elif self.dataset == "default":

            X_train = pd.get_dummies(self.X_train)
            X_test = pd.get_dummies(X_test)
            cols = [
                "LIMIT_BAL",
                "SEX_1",
                "SEX_2",
                "EDUCATION_0",
                "EDUCATION_1",
                "EDUCATION_2",
                "EDUCATION_3",
                "EDUCATION_4",
                "EDUCATION_5",
                "EDUCATION_6",
                "MARRIAGE_0",
                "MARRIAGE_1",
                "MARRIAGE_2",
                "MARRIAGE_3",
                "AGE",
                "PAY_0_-2",
                "PAY_0_-1",
                "PAY_0_0",
                "PAY_0_1",
                "PAY_0_2",
                "PAY_0_3",
                "PAY_0_4",
                "PAY_0_5",
                "PAY_0_6",
                "PAY_0_7",
                "PAY_0_8",
                "PAY_2_-2",
                "PAY_2_-1",
                "PAY_2_0",
                "PAY_2_1",
                "PAY_2_2",
                "PAY_2_3",
                "PAY_2_4",
                "PAY_2_5",
                "PAY_2_6",
                "PAY_2_7",
                "PAY_2_8",
                "PAY_3_-2",
                "PAY_3_-1",
                "PAY_3_0",
                "PAY_3_1",
                "PAY_3_2",
                "PAY_3_3",
                "PAY_3_4",
                "PAY_3_5",
                "PAY_3_6",
                "PAY_3_7",
                "PAY_3_8",
                "PAY_4_-2",
                "PAY_4_-1",
                "PAY_4_0",
                "PAY_4_1",
                "PAY_4_2",
                "PAY_4_3",
                "PAY_4_4",
                "PAY_4_5",
                "PAY_4_6",
                "PAY_4_7",
                "PAY_4_8",
                "PAY_5_-2",
                "PAY_5_-1",
                "PAY_5_0",
                "PAY_5_2",
                "PAY_5_3",
                "PAY_5_4",
                "PAY_5_5",
                "PAY_5_6",
                "PAY_5_7",
                "PAY_5_8",
                "PAY_6_-2",
                "PAY_6_-1",
                "PAY_6_0",
                "PAY_6_2",
                "PAY_6_3",
                "PAY_6_4",
                "PAY_6_5",
                "PAY_6_6",
                "PAY_6_7",
                "PAY_6_8",
                "BILL_AMT1",
                "BILL_AMT2",
                "BILL_AMT3",
                "BILL_AMT4",
                "BILL_AMT5",
                "BILL_AMT6",
                "PAY_AMT1",
                "PAY_AMT2",
                "PAY_AMT3",
                "PAY_AMT4",
                "PAY_AMT5",
                "PAY_AMT6",
            ]

            X_test = X_test.reindex(columns=cols)
            X_train = X_train.reindex(columns=cols)
            X_train = X_train.fillna(int(0))
            X_test = X_test.fillna(int(0))
            X_test = X_test.to_numpy()

        if self.dataset in ["german", "default", "german_credit_numeric"]:
            x_means, x_stds = X_train.to_numpy().mean(axis=0), X_train.to_numpy().std(
                axis=0
            )
            X_test = (X_test - x_means) / x_stds
        return self.dnn.predict(X_test)

    def predict_proba(self, x):

        if self.dataset == "german":
            cate_features = ['Existing-Account-Status', 'Credit-History', 'Purpose',
                              'Savings-Account', 'Present-Employment', 'Instalment-Rate',
                              'Sex', 'Guarantors', 'Residence', 'Property', 'Installment',
                              'Housing', 'Existing-Credits', 'Job', 'Num-People',
                              'Telephone', 'Foreign-Worker']
            X_train, feat = one_hot(self.X_train,cate_features,'german')
            X_test , feat= one_hot(x,cate_features,'german')
            # cols = [
            #     "Existing-Account-Status_A11",
            #     "Existing-Account-Status_A12",
            #     "Existing-Account-Status_A13",
            #     "Existing-Account-Status_A14",
            #     "Month-Duration",
            #     "Credit-History_A30",
            #     "Credit-History_A31",
            #     "Credit-History_A32",
            #     "Credit-History_A33",
            #     "Credit-History_A34",
            #     "Purpose_A40",
            #     "Purpose_A41",
            #     "Purpose_A410",
            #     "Purpose_A42",
            #     "Purpose_A43",
            #     "Purpose_A44",
            #     "Purpose_A45",
            #     "Purpose_A46",
            #     "Purpose_A48",
            #     "Purpose_A49",
            #     "Credit-Amount",
            #     "Savings-Account_A61",
            #     "Savings-Account_A62",
            #     "Savings-Account_A63",
            #     "Savings-Account_A64",
            #     "Savings-Account_A65",
            #     "Present-Employment_A71",
            #     "Present-Employment_A72",
            #     "Present-Employment_A73",
            #     "Present-Employment_A74",
            #     "Present-Employment_A75",
            #     "Instalment-Rate_1",
            #     "Instalment-Rate_2",
            #     "Instalment-Rate_3",
            #     "Instalment-Rate_4",
            #     "Sex_A91",
            #     "Sex_A92",
            #     "Sex_A93",
            #     "Sex_A94",
            #     "Guarantors_A101",
            #     "Guarantors_A102",
            #     "Guarantors_A103",
            #     "Residence_1",
            #     "Residence_2",
            #     "Residence_3",
            #     "Residence_4",
            #     "Property_A121",
            #     "Property_A122",
            #     "Property_A123",
            #     "Property_A124",
            #     "Age",
            #     "Installment_A141",
            #     "Installment_A142",
            #     "Installment_A143",
            #     "Housing_A151",
            #     "Housing_A152",
            #     "Housing_A153",
            #     "Existing-Credits_1",
            #     "Existing-Credits_2",
            #     "Existing-Credits_3",
            #     "Existing-Credits_4",
            #     "Job_A171",
            #     "Job_A172",
            #     "Job_A173",
            #     "Job_A174",
            #     "Num-People_1",
            #     "Num-People_2",
            #     "Telephone_A191",
            #     "Telephone_A192",
            #     "Foreign-Worker_A201",
            #     "Foreign-Worker_A202",
            # ]

            X_test = X_test.reindex(columns=X_train.columns)
            # X_train = X_train.reindex(columns=cols)
            # X_train = X_train.fillna(int(0))
            X_test = X_test.fillna(int(0))
            X_test = X_test.to_numpy()

        elif self.dataset == "compas":
            X_train = pd.get_dummies(self.X_train)
            X_test = pd.get_dummies(x)
            cols = [
                "Sex_Female",
                "Sex_Male",
                "Age_Cat_Less than 25",
                "Age_Cat_25 - 45",
                "Age_Cat_Greater than 45",
                "Race_African-American",
                "Race_Asian",
                "Race_Caucasian",
                "Race_Hispanic",
                "Race_Native American",
                "Race_Other",
                "C_Charge_Degree_F",
                "C_Charge_Degree_M",
                "Priors_Count",
                "Time_Served",
            ]

            X_test = X_test.reindex(columns=cols)
            X_train = X_train.reindex(columns=cols)
            X_train = X_train.fillna(int(0))
            X_test = X_test.fillna(int(0))
            X_test = X_test.to_numpy()

        elif self.dataset == "heloc":
            X_train = self.X_train
            X_test = x.to_numpy()

        elif self.dataset == "german_credit_numeric":
            X_train = self.X_train
            X_test = x.to_numpy()

        elif self.dataset == "default":
            X_train = pd.get_dummies(self.X_train)
            X_test = pd.get_dummies(x)
            cols = [
                "LIMIT_BAL",
                "SEX_1",
                "SEX_2",
                "EDUCATION_0",
                "EDUCATION_1",
                "EDUCATION_2",
                "EDUCATION_3",
                "EDUCATION_4",
                "EDUCATION_5",
                "EDUCATION_6",
                "MARRIAGE_0",
                "MARRIAGE_1",
                "MARRIAGE_2",
                "MARRIAGE_3",
                "AGE",
                "PAY_0_-2",
                "PAY_0_-1",
                "PAY_0_0",
                "PAY_0_1",
                "PAY_0_2",
                "PAY_0_3",
                "PAY_0_4",
                "PAY_0_5",
                "PAY_0_6",
                "PAY_0_7",
                "PAY_0_8",
                "PAY_2_-2",
                "PAY_2_-1",
                "PAY_2_0",
                "PAY_2_1",
                "PAY_2_2",
                "PAY_2_3",
                "PAY_2_4",
                "PAY_2_5",
                "PAY_2_6",
                "PAY_2_7",
                "PAY_2_8",
                "PAY_3_-2",
                "PAY_3_-1",
                "PAY_3_0",
                "PAY_3_1",
                "PAY_3_2",
                "PAY_3_3",
                "PAY_3_4",
                "PAY_3_5",
                "PAY_3_6",
                "PAY_3_7",
                "PAY_3_8",
                "PAY_4_-2",
                "PAY_4_-1",
                "PAY_4_0",
                "PAY_4_1",
                "PAY_4_2",
                "PAY_4_3",
                "PAY_4_4",
                "PAY_4_5",
                "PAY_4_6",
                "PAY_4_7",
                "PAY_4_8",
                "PAY_5_-2",
                "PAY_5_-1",
                "PAY_5_0",
                "PAY_5_2",
                "PAY_5_3",
                "PAY_5_4",
                "PAY_5_5",
                "PAY_5_6",
                "PAY_5_7",
                "PAY_5_8",
                "PAY_6_-2",
                "PAY_6_-1",
                "PAY_6_0",
                "PAY_6_2",
                "PAY_6_3",
                "PAY_6_4",
                "PAY_6_5",
                "PAY_6_6",
                "PAY_6_7",
                "PAY_6_8",
                "BILL_AMT1",
                "BILL_AMT2",
                "BILL_AMT3",
                "BILL_AMT4",
                "BILL_AMT5",
                "BILL_AMT6",
                "PAY_AMT1",
                "PAY_AMT2",
                "PAY_AMT3",
                "PAY_AMT4",
                "PAY_AMT5",
                "PAY_AMT6",
            ]

            X_test = X_test.reindex(columns=cols)
            X_train = X_train.reindex(columns=cols)
            X_train = X_train.fillna(int(0))
            X_test = X_test.fillna(int(0))
            X_test = X_test.to_numpy()

        if self.dataset in ["german", "default", "german_credit_numeric"]:
            x_means, x_stds = X_train.to_numpy().mean(axis=0), X_train.to_numpy().std(
                axis=0
            )
            X_test = (X_test - x_means) / x_stds

        return self.dnn.predict_proba(X_test)
