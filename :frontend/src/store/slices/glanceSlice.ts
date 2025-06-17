// src/store/glanceSlice.ts
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Define types for the API responses

interface GlanceState {
  // General state
  welcomeMessage: string;
  viewOption: string;
  selectedTab: number;
  activeStep: number;
  showUMAPInTab1: boolean;
  showUMAPScatter: boolean;
  error: string | null;

  // Resource-related
  availableResources: AvailableResources;
  availableCfMethods: string[];
  availableFeatures: string[];
  availableActionStrategies: string[];
  selectedFeatures: string[];
  selectedModel: string | null;
  selectedDataset: string | null;
  targetName: string | null;

  // Loading states
  loading: boolean;
  initialLoading: boolean;
  datasetLoading: boolean;
  umapLoading: boolean;
  comparativeLoading: boolean;
  modelComparativeLoading: boolean;
  umapLoader: boolean;

  // Results
  runGlanceResult: any | null;
  loadDatasetAndModelResult: any | null;
  runTGlanceResult: any | null;
  getDataResults: any | null;
  applyAffectedActionsResult: { [key: string]: any } | null;
  processedSizes: number[];

  // UMAP-specific
  umapReduceResults: {
    rawData?: any;
    affectedData?: any;
    testData?: any;
    appliedAffected?: any;
  };

  // Comparative results
  comparativeResults: {
    [key: string]: any;
  };
  modelComparativeResults: {
    [key: string]: any;
  };

  
  runModelComparativeResult: any | null;


}



// Define initial state with typed structure
const initialState: GlanceState = {
  availableResources: { datasets: [], models: [] },
  availableCfMethods: [],
  welcomeMessage: "",
  availableFeatures: [],
  selectedFeatures: [],
  availableActionStrategies: [],
  runGlanceResult: null,
  loadDatasetAndModelResult: null,
  runTGlanceResult: null,
  loading: false,
  datasetLoading: false, // Specific loading state for dataset/model loading
  error: null,
  initialLoading: true,
  applyAffectedActionsResult: null,
  processedSizes: [],
  umapReduceResults: {},
  getDataResults: null,
  comparativeResults: {},
  modelComparativeResults: {},
  comparativeLoading: false,
  modelComparativeLoading: false,
  targetName: null, // Initialize it
  selectedModel: "XGBoost",
  selectedDataset: "COMPAS Dataset",
  viewOption: "affected",
  showUMAPScatter: false,
  selectedTab: 1,
  activeStep: 1,
  umapLoader: true,
  showUMAPInTab1: true,
  umapLoading: false, // State for UMAP loading
  runModelComparativeResult: null, // Initialize the comparative result
};

interface AvailableResources {
  datasets: string[];
  models: string[];
}

interface UmapReduceParams {
  dataset_identifier: string;
  n_components: number;
}

interface ComparativeParams {
  sizes?: number[];
  methods?: string[];
  strategies?: string[];
  selectedFeatures?: string[];
  algorithm?: string | number | boolean;
  direction?:number[];
  features_to_change?:number[];

}

// Type for the runCGlance parameters
interface RunCGlanceParams {
  gcf_size: number;
  cf_method?: string;
  action_choice_strategy?: string;
  selected_features?: string[]; // Optional array of selected features
  algorithm?: string | number | boolean;
  features_to_change?:number;
  direction?:number;
}
// Type for the loadDatasetAndModel parameters
interface LoadDatasetAndModelParams {
  dataset_name: string;
  model_name: string;
}

// Type for the runTGlance parameters
interface RunTGlanceParams {
  split_features: string[];
  local_cf_method: string;
}
// const API_BASE_URL = "http://127.0.0.1:8000/";
const API_BASE_URL = "/api/";

// Fetch all initial data
export const fetchInitialGlanceData = createAsyncThunk(
  "glance/fetchInitialGlanceData",
  async (_, { dispatch }) => {
    const [resourcesResponse, cfMethodsResponse,loadDatasetAndModelResponse] = await Promise.all([

      axios.get(`${API_BASE_URL}available-resources/`),
      axios.get(`${API_BASE_URL}available-cf-methods/`),
      // axios.get(`${API_BASE_URL}available-action-strategies/`),

      axios.post(`${API_BASE_URL}load-dataset-and-model/?dataset_name=compas&model_name=xgb`)
    
    ]);


    return {
      availableResources: resourcesResponse.data,
      availableCfMethods: cfMethodsResponse.data,
      availableActionStrategies: ["Max Effectiveness","Min Cost","Mean Action"],
      loadDatasetAndModelResult: loadDatasetAndModelResponse.data,
    };
  }
);

export const umapReduce = createAsyncThunk(
  "glance/umapReduce",
  async ({ dataset_identifier, n_components }: UmapReduceParams) => {
    const response = await axios.post(
      `${API_BASE_URL}umap-reduce/`,
      { dataset_identifier },
      {
        params: { n_components },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return { data: response.data, datasetIdentifier: dataset_identifier }; // Pass data and identifier
  }
);

export const runModelComparative = createAsyncThunk(
  "glance/runModelComparative",
  async ({selected_features,gcf_size,algorithm,}: RunCGlanceParams, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}${encodeURIComponent(algorithm ?? '')}`,
        selected_features?.length ? selected_features : null, // Pass selected features or null
        {
          params: {
            gcf_size:gcf_size,
            cf_method:"Dice",
            action_choice_strategy:"Max Effectiveness",
            direction:1,
            features_to_change:5,
          },
        }
      );
      return { data: response.data,algorithm:algorithm, gcf_size: gcf_size.toString() };
    } catch (error: any) {
      if (error.response?.status === 400 && error.response.data?.detail) {
        // Return specific error message if it matches the expected structure
        return rejectWithValue(error.response.data.detail);
      }
      // Return a generic error message for other cases
      return rejectWithValue("An error occurred. Please try again.");
    }
  } 
);

// Define a thunk for runCGlance with parameters
export const runCGlance = createAsyncThunk(
  "glance/runCGlance",
  async ({ gcf_size, cf_method, action_choice_strategy, selected_features,algorithm,direction,features_to_change }: RunCGlanceParams, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}${encodeURIComponent(algorithm ?? '')}`,
        selected_features?.length ? selected_features : null, // Pass selected features or null
        {
          params: {
            gcf_size,
            cf_method,
            action_choice_strategy,
            direction,
            features_to_change
          },
        }
      );
      return { data: response.data, size: gcf_size.toString(), method: cf_method, strategy: action_choice_strategy };
    } catch (error: any) {
      if (error.response?.status === 400 && error.response.data?.detail) {
        // Return specific error message if it matches the expected structure
        return rejectWithValue(error.response.data.detail);
      }
      // Return a generic error message for other cases
      return rejectWithValue("An error occurred while running C-Glance");
    }
  }
);
// Define a thunk for loadDatasetAndModel with query parameters
export const loadDatasetAndModel = createAsyncThunk(
  "glance/loadDatasetAndModel",
  async ({ dataset_name, model_name }: LoadDatasetAndModelParams) => {
    const response = await axios.post(`${API_BASE_URL}load-dataset-and-model/`, null, {
      params: { dataset_name, model_name }
    });
    return response.data;
  }
);

export const fetchGetData = createAsyncThunk(
  "glance/fetchGetData",
  async () => {

    const response = await axios.get(`${API_BASE_URL}get-data/`,{timeout: 60000}); // Set a timeout of 10 seconds
    return response.data; // Assuming the response structure matches loadDatasetAndModelResult
  }
);

// Define a thunk for fetching available features
export const fetchAvailableFeatures = createAsyncThunk(
  "glance/fetchAvailableFeatures",
  async () => {
    const response = await axios.get(`${API_BASE_URL}available-features`);
    return response.data;
  }
);

// Define a thunk for running T-Glance with parameters
export const runTGlance = createAsyncThunk(
  "glance/runTGlance",
  async ({ split_features, local_cf_method }: RunTGlanceParams) => {
    const response = await axios.post("http://127.0.0.1:8000/run-t_glance", {
      split_features,
      local_cf_method,
    });
    return response.data;
  }
);

export const applyAffectedActions = createAsyncThunk(
  "glance/applyAffectedActions",
  async () => {
    const response = await axios.get(`${API_BASE_URL}apply_affected_actions`);
    return response.data;
  }
);

export const uploadDataset = createAsyncThunk(
  "glance/uploadDataset",
  async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(`${API_BASE_URL}upload/dataset`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }
);

// Define a thunk for uploading a test dataset
export const uploadTestDataset = createAsyncThunk(
  "glance/uploadTestDataset",
  async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(`${API_BASE_URL}upload/test_dataset`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }
);

// Define a thunk for uploading a model
export const uploadModel = createAsyncThunk(
  "glance/uploadModel",
  async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(`${API_BASE_URL}upload/model`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }
);

export const fetchTargetName = createAsyncThunk(
  "glance/fetchTargetName",
  async (target_name: string) => {
    const response = await axios.post(
      `${API_BASE_URL}get-target_name`,
      null,
      {
        params: { target_name },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data; // Assuming the response is just the target name string
  }
);


export const runCGlanceComparative = createAsyncThunk(
  "glance/runCGlanceComparative",
  async (
    { sizes, methods, strategies, selectedFeatures, caseType, algorithm,direction,features_to_change }: ComparativeParams & { caseType: string },
    { dispatch, rejectWithValue }
  ) => {
    const results: any = {};

    const handleRunCGlanceError = (error: any) => {
      if (error.response && error.response.status === 400) {
        return {
          error: true,
          message: error.response.data?.detail || "Unknown error occurred.",
        };
      }
      throw error; // Re-throw non-400 errors to be handled globally
    };

    const runAndHandleErrors = async (params: any ) => {
      try {
        const response = await axios.post(`${API_BASE_URL}${algorithm}`, selectedFeatures?.length ? selectedFeatures : null, {
          params,
        });
        return response.data;
      } catch (error) {
        return handleRunCGlanceError(error);
      }
    };

    switch (caseType) {
      case "Number of Counterfactual Actions":
        for (const size of sizes || []) {
          const runCGlanceResponse = await runAndHandleErrors({
            gcf_size: size,
            cf_method: methods?.[0],
            action_choice_strategy: strategies?.[0],
            algorithm,
            direction:direction?.[0],
            features_to_change:features_to_change?.[0]
          });

          if (runCGlanceResponse.error) {
            results[`size_${size}`] = { error: runCGlanceResponse.message };
            continue;
          }

          try {
            const applyAffectedResponse = await axios.get(`${API_BASE_URL}apply_affected_actions`);
            const umapResult = await dispatch(
              umapReduce({ dataset_identifier: "appliedAffected", n_components: 2 })
            ).unwrap();

            results[`size_${size}`] = {
              ...runCGlanceResponse,
              applyAffectedActions: applyAffectedResponse.data,
              umapOfAppliedAffected: umapResult,
            };
          } catch (error) {
            results[`size_${size}`] = { error: "Error in downstream processing." };
          }
        }
        break;

      case "Local Counterfactual Method":
        for (const method of methods || []) {
          const runCGlanceResponse = await runAndHandleErrors({
            gcf_size: sizes?.[0],
            cf_method: method,
            action_choice_strategy: strategies?.[0],
            algorithm,
            direction:direction?.[0],
            features_to_change:features_to_change?.[0]
          });

          if (runCGlanceResponse.error) {
            results[`method_${method}`] = { error: runCGlanceResponse.message };
            continue;
          }

          try {
            const applyAffectedResponse = await axios.get(`${API_BASE_URL}apply_affected_actions`);
            const umapResult = await dispatch(
              umapReduce({ dataset_identifier: "appliedAffected", n_components: 2 })
            ).unwrap();

            results[`method_${method}`] = {
              ...runCGlanceResponse,
              applyAffectedActions: applyAffectedResponse.data,
              umapOfAppliedAffected: umapResult,
            };
          } catch (error) {
            results[`method_${method}`] = { error: "Error in downstream processing." };
          }
        }
        break;

      case "Action Choice Strategy":
        for (const strategy of strategies || []) {
          const runCGlanceResponse = await runAndHandleErrors({
            gcf_size: sizes?.[0],
            cf_method: methods?.[0],
            action_choice_strategy: strategy,
            algorithm,
            direction:direction?.[0],
            features_to_change:features_to_change?.[0]
          });

          if (runCGlanceResponse.error) {
            results[`strategy_${strategy}`] = { error: runCGlanceResponse.message };
            continue;
          }

          try {
            const applyAffectedResponse = await axios.get(`${API_BASE_URL}apply_affected_actions`);
            const umapResult = await dispatch(
              umapReduce({ dataset_identifier: "appliedAffected", n_components: 2 })
            ).unwrap();

            results[`strategy_${strategy}`] = {
              ...runCGlanceResponse,
              applyAffectedActions: applyAffectedResponse.data,
              umapOfAppliedAffected: umapResult,
            };
          } catch (error) {
            results[`strategy_${strategy}`] = { error: "Error in downstream processing." };
          }
        }
        break;
        case "Direction":
        for (const dir of direction || []) {
          const runCGlanceResponse = await runAndHandleErrors({
            gcf_size: sizes?.[0],
            cf_method: methods?.[0],
            action_choice_strategy: strategies?.[0],
            algorithm,
            direction: dir,
            features_to_change: features_to_change?.[0]
          });

          if (runCGlanceResponse.error) {
            results[`direction_${dir}`] = { error: runCGlanceResponse.message };
            continue;
          }

          try {
            const applyAffectedResponse = await axios.get(`${API_BASE_URL}apply_affected_actions`);
            const umapResult = await dispatch(
              umapReduce({ dataset_identifier: "appliedAffected", n_components: 2 })
            ).unwrap();

            results[`direction_${dir}`] = {
              ...runCGlanceResponse,
              applyAffectedActions: applyAffectedResponse.data,
              umapOfAppliedAffected: umapResult,
            };
          } catch (error) {
            results[`direction_${dir}`] = { error: "Error in downstream processing." };
          }
        }
        break;
        case "Features to change":
        for (const ftc of features_to_change || []) {
          const runCGlanceResponse = await runAndHandleErrors({
            gcf_size: sizes?.[0],
            cf_method: methods?.[0],
            action_choice_strategy: strategies?.[0],
            algorithm,
            direction: direction?.[0],
            features_to_change: ftc
          });

          if (runCGlanceResponse.error) {
            results[`features_to_change_${ftc}`] = { error: runCGlanceResponse.message };
            continue;
          }

          try {
            const applyAffectedResponse = await axios.get(`${API_BASE_URL}apply_affected_actions`);
            const umapResult = await dispatch(
              umapReduce({ dataset_identifier: "appliedAffected", n_components: 2 })
            ).unwrap();

            results[`features_to_change_${ftc}`] = {
              ...runCGlanceResponse,
              applyAffectedActions: applyAffectedResponse.data,
              umapOfAppliedAffected: umapResult,
            };
          } catch (error) {
            results[`features_to_change_${ftc}`] = { error: "Error in downstream processing." };
          }
        }
        break;


      default:
        return rejectWithValue("Invalid caseType");
    }

    return results;
  }
);

const glanceSlice = createSlice({
  name: "glance",
  initialState,
  reducers: {
    setSelectedFeatures: (state, action: PayloadAction<string[]>) => {
      state.selectedFeatures = action.payload;
    },
    setProcessedSizes: (state, action: PayloadAction<number[]>) => {
      state.processedSizes = action.payload;
    },
    addProcessedSize: (state, action: PayloadAction<number>) => {
      // Ensures no duplicates are added
      if (!state.processedSizes.includes(action.payload)) {
        state.processedSizes.push(action.payload);
      }
    },
    
    setSelectedModel: (state, action: PayloadAction<string>) => {
      state.selectedModel = action.payload;
      if (!state.availableResources.models.includes(action.payload)) {
      state.availableResources.models.push(action.payload);
    }
    },
    setSelectedDataset: (state, action: PayloadAction<string>) => {
      state.selectedDataset = action.payload;
      if (!state.availableResources.datasets.includes(action.payload)) {
      state.availableResources.datasets.push(action.payload);
    }
   
    },
     setShowUMAPInTab1(state, action: PayloadAction<boolean>) {
      state.showUMAPInTab1 = action.payload;
      
    },
    setViewOption(state, action: PayloadAction<string>) {
      state.viewOption = action.payload;
    },
    setShowUMAPScatter(state, action: PayloadAction<boolean>) {
      state.showUMAPScatter = action.payload;
    },
    setSelectedTab(state, action: PayloadAction<number>) {
      state.selectedTab = action.payload;
    },
    setActiveStep(state, action: PayloadAction<number>) {
      state.activeStep = action.payload;
    },

  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInitialGlanceData.pending, (state) => {
        state.initialLoading = true;


      })
      .addCase(fetchInitialGlanceData.fulfilled, (state, action: PayloadAction<any>) => {
        state.initialLoading = false;
        state.availableResources = action.payload.availableResources;
        state.availableCfMethods = action.payload.availableCfMethods;
        state.availableActionStrategies = action.payload.availableActionStrategies;
        state.loadDatasetAndModelResult = action.payload.loadDatasetAndModelResult;
        state.error = null;
      })
      .addCase(fetchInitialGlanceData.rejected, (state, action) => {
        state.initialLoading = false;
        state.error = action.error.message || "Error fetching initial data";
      })
      .addCase(runCGlance.rejected, (state, action: PayloadAction<any, string, never, string | undefined>) => {
        state.loading = false;
        state.error = action.payload || "Error generating counterfactuals"; // Use specific error message if available
      })
      
      .addCase(runCGlance.pending, (state) => {
        state.loading = true;
        state.error = null; // Clear any previous error

      })
      .addCase(loadDatasetAndModel.pending, (state) => {
        state.datasetLoading = true;
        state.umapLoader = true;
      })
      .addCase(loadDatasetAndModel.fulfilled, (state, action: PayloadAction<any>) => {
        state.datasetLoading = false;
        state.umapLoader = true;
        state.loadDatasetAndModelResult = action.payload;
        state.runGlanceResult = null;
        state.comparativeResults = {};
        state.modelComparativeResults = {};
        state.runModelComparativeResult = null; // Reset the comparative result
        state.error = null;
      })
      .addCase(loadDatasetAndModel.rejected, (state, action) => {
        state.datasetLoading = false;
        state.error = action.error.message || "Error loading dataset and model";
      })
      .addCase(fetchAvailableFeatures.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAvailableFeatures.fulfilled, (state, action: PayloadAction<{ features: string[] }>) => {
        state.loading = false;

if (state.targetName && state.targetName.length > 0) {
  state.availableFeatures = action.payload.features.filter(
    (feature: string) => !state?.targetName?.includes(feature)
  );
} else {
  state.availableFeatures = action.payload.features;
}   
        state.error = null;
      })
      .addCase(fetchAvailableFeatures.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error fetching available features";
      })
      .addCase(runTGlance.fulfilled, (state, action: PayloadAction<any>) => {
        state.runTGlanceResult = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(runTGlance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error running T-Glance";
      })
      .addCase(runCGlance.fulfilled, (state, action: PayloadAction<{
        strategy: any;
        method: any; 
        data: any; 
        size: string;
      }>) => {
        state.loading = false;
        state.runGlanceResult = state.datasetLoading ? null : action.payload.data; // Ensure null if datasetLoading is true
        state.error = null;
      })
      .addCase(applyAffectedActions.pending, (state) => {
        state.loading = true;
      })
      .addCase(applyAffectedActions.fulfilled, (state, action: PayloadAction<{ [key: string]: any }>) => {
        state.loading = false;
        state.applyAffectedActionsResult = action.payload; // Store response in state
        state.error = null;
      })
      .addCase(applyAffectedActions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error applying affected actions";
      })
      .addCase(umapReduce.pending, (state) => {
        state.umapLoader = true;
      })
      .addCase(umapReduce.fulfilled, (state, action: PayloadAction<any>) => {
        state.umapLoader = false;
        state.umapReduceResults[action.payload.datasetIdentifier] = action.payload.data; // Store result by identifier
        state.error = null;
      })
      .addCase(umapReduce.rejected, (state, action) => {
        state.loading = false;
        state.umapLoader = false;
        state.error = action.error.message || "Error reducing UMAP";
      })
      .addCase(uploadDataset.pending, (state) => {
        state.loading = true;
      })
      .addCase(uploadDataset.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        // You can store the response if needed
      })
      .addCase(uploadDataset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error uploading dataset";
      })
      .addCase(uploadTestDataset.pending, (state) => {
        state.loading = true;
      })
      .addCase(uploadTestDataset.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        // You can store the response if needed
      })
      .addCase(uploadTestDataset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error uploading test dataset";
      })
      .addCase(uploadModel.pending, (state) => {
        state.loading = true;
      })
      .addCase(uploadModel.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        // You can store the response if needed
      })
      .addCase(uploadModel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error uploading model";
      })
      .addCase(runCGlanceComparative.pending, (state) => {
        state.comparativeLoading = true; // Start the loader
      })
      .addCase(runCGlanceComparative.fulfilled, (state, action: PayloadAction<any>) => {
        state.comparativeLoading = false; // End the loader
        state.comparativeResults = action.payload;
        state.error = null;
      })
      .addCase(runCGlanceComparative.rejected, (state, action) => {
        state.comparativeLoading = false; // End the loader
        state.error = action.error.message || "Error in comparative analysis";
      })
      .addCase(runModelComparative.pending, (state) => {
        state.modelComparativeLoading = true; // Start the loader
      })
     .addCase(runModelComparative.fulfilled, (state, action: PayloadAction<any>) => {
  state.modelComparativeLoading = false;
  state.error = null;

  if (!state.runModelComparativeResult) {
    state.runModelComparativeResult = [];
  }

  const newResult = action.payload;
  const exists = state.runModelComparativeResult.some(result => result.algorithm === newResult.algorithm && result.gcf_size === newResult.gcf_size);

  if (!exists) {
    state.runModelComparativeResult.push(newResult);
  }

  // Optionally keep latest:
  state.modelComparativeResults = newResult;
})
      .addCase(runModelComparative.rejected, (state, action) => {
        state.modelComparativeLoading = false; // End the loader
        state.error = action.error.message || "Error in model comparative analysis";
      })
      .addCase(fetchGetData.pending, (state) => {
        state.loading = true; // Optional: Set a loading state
        state.loadDatasetAndModelResult = null;
      })
      .addCase(fetchGetData.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.loadDatasetAndModelResult = action.payload; // Update the result with get-data response
        state.error = null;
      })
      .addCase(fetchGetData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error fetching data from get-data";
      })
      .addCase(fetchTargetName.pending, (state) => {
        state.loading = true; // Optional: Add a loading state for target name
      })
      .addCase(fetchTargetName.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.targetName = action.payload; // Update the target name in state

        state.error = null;
      })
      .addCase(fetchTargetName.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error fetching target name";
      });
  },
});
export const { setSelectedFeatures,setShowUMAPInTab1, setSelectedDataset, setSelectedModel,setViewOption,setShowUMAPScatter,setActiveStep,setSelectedTab} = glanceSlice.actions
export default glanceSlice.reducer;


