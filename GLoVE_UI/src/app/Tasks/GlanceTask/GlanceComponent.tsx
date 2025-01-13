import React, { useEffect, useState } from "react";
import DataModelSetup from "./SIDEBAR/DataModelSetup";
import { useAppDispatch, useAppSelector } from "../../../store/store";
import { fetchAvailableFeatures, fetchInitialGlanceData, umapReduce } from "../../../store/slices/glanceSlice";
import { Box, Typography, CircularProgress, FormControlLabel, Switch, Step, StepLabel, Stepper } from "@mui/material";
import DataTable from "./PLOTS/DataTable";
import UmapScatter from "./PLOTS/UmapScatter";
import ScatterPlotComponentForMainPage from "./PLOTS/ScatterComponentForMainPage";
import ComparativeGlance from "./CGLANCE/ComparativeGlance";
import WorkflowCard from "../../../shared/components/workflow-card";
import UploadComponent from "./UploadComponent";

const styles = {
  sidebar: {
    width: '25%',
    padding: '16px',
    margin: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    backgroundColor: '#f9f9f9',
  },
  mainContent: {
    width: '99%',
    padding: '-1px',
    // margin: '10px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  layoutContainer: {
    display: 'flex',
    flexDirection: 'column', // Default to column for smaller screens
    '@media (min-width: 768px)': { // Apply media query for larger screens
      flexDirection: 'row',
    },
  },
  contentContainer: {
    display: 'flex',
    flexDirection: 'column', // Default to column
    gap: '16px',
    '@media (min-width: 1024px)': { // Side-by-side view on larger screens
      flexDirection: 'row',
    },
  },
  loaderContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    flexDirection: 'column',
  },
  flexChild: {
    flex: 1, // Ensure flexible children take equal space
    minWidth: '300px', // Minimum width for smaller screens
  },
};


const GlanceComponent: React.FC = () => {
  const dispatch = useAppDispatch();
  const glanceState = useAppSelector((state) => state.glance);
  const [viewOption, setViewOption] = useState<"data" | "affected" | "test">("affected"); // Track which data to display
  const [selectedTab, setSelectedTab] = useState<number>(0); // Track selected tab
  const [showUMAPScatter, setShowUMAPScatter] = useState(true); // State to toggle scatter plot
  const [processedDataset, setProcessedDataset] = useState([]);
  const [umapCache, setUmapCache] = useState<{ [key: string]: any }>({});

  const [activeStep, setActiveStep] = useState(0);
  const steps = ["Select Dataset and Model", "Explore Dataset", "Analyze Counterfactuals"];
  const [selectedDataset, setSelectedDataset] = useState<string>("COMPAS Dataset");
  const [selectedModel, setSelectedModel] = useState<string>("XGBoost");




  const handleStepClick = (index) => {
    setActiveStep(index);
    setSelectedTab(index); // Sync tab with stepper
  };



  useEffect(() => {
    if (!glanceState.loadDatasetAndModelResult) {
      dispatch(fetchInitialGlanceData());
      dispatch(fetchAvailableFeatures());
      dispatch(umapReduce({ dataset_identifier: "affectedData", n_components: 2 }));
      dispatch(umapReduce({ dataset_identifier: "testData", n_components: 2 }));


    }
  }, [dispatch]);

  useEffect(() => {
    if (viewOption && showUMAPScatter) {
      const datasetIdentifier =
        viewOption === "data"
          ? "rawData"
          : viewOption === "affected"
            ? "affectedData"
            : "testData";
      // Check if UMAP data is already cached
      if (!umapCache[datasetIdentifier]) {
        dispatch(umapReduce({ dataset_identifier: datasetIdentifier, n_components: 2 }))
          .then((action) => {
            // Store the result in the cache
            if (action.payload) {
              setUmapCache((prevCache) => ({
                ...prevCache,
                [datasetIdentifier]: action.payload.data,
              }));
            }
          });
      }
    }
  }, [viewOption, dispatch, showUMAPScatter, umapCache]);

  useEffect(() => {
    if (glanceState.loadDatasetAndModelResult) {
      // Clear the UMAP cache when the dataset/model changes
      setUmapCache({});
      setSelectedTab(1);
      setActiveStep(1);
    }
  }, [glanceState.loadDatasetAndModelResult]);

  useEffect(() => {
    if (glanceState.runGlanceResult) {
      const indexValues = new Set(Object.values(glanceState.runGlanceResult.affected_clusters.index));
      const newDataset = glanceState.loadDatasetAndModelResult.X_test.map((item: any, idx: unknown) => {
        if (indexValues.has(idx)) {
          const indexArray = Object.values(glanceState.runGlanceResult.affected_clusters.index);
          const actionIndex = indexArray.indexOf(idx);
          const actionValue = glanceState.runGlanceResult.affected_clusters.Chosen_Action[actionIndex];
          return { ...item, action: actionValue };
        } else {
          return { ...item, action: "-1" };
        }
      });

      setProcessedDataset(newDataset); // Set the state
    }
  }, [glanceState.runGlanceResult,]);


  // Handle Tab Change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
    setActiveStep(newValue); // Sync stepper with tabs

  };


  const renderScatterPlot = () => {


    if (!showUMAPScatter && viewOption === "affected") {
      // Render Raw Scatter when checkbox is unchecked
      return (


        <ScatterPlotComponentForMainPage data={glanceState.loadDatasetAndModelResult.affected} name="Affected Data" />
      );
    }
    if (!showUMAPScatter && viewOption === "test") {
      // Render Raw Scatter when checkbox is unchecked
      return (

        <ScatterPlotComponentForMainPage data={glanceState.loadDatasetAndModelResult.X_test} name="Test Data" />
      )
    }
    if (glanceState.loading) {
      // Show loader when UMAP data is still loading
      return (
        <Box sx={styles.loaderContainer}>
          <CircularProgress size={50} />
          <Typography variant="h6" sx={{ marginTop: 2 }}>Enabling Dimensionality Reduction (UMAP)...</Typography>
        </Box>
      );

    }

    const datasetKey = viewOption === "data" ? "rawData" :
      viewOption === "affected" ? "affectedData" :
        "testData"; // Update or expand if necessary

    //  if (glanceState.umapReduceResults[datasetKey]) {
    //   const umapData = glanceState.umapReduceResults[datasetKey].reduced_data; // Retrieve the UMAP data based on dataset key
    if (umapCache[datasetKey]) {
      const umapData = umapCache[datasetKey].reduced_data;
      // Use `umapData` for your visualization logic
      return (



        <UmapScatter
          data={umapData}
          color={viewOption === "affected" ? "" : "label"} // Adjust color logic as needed
        />
      );
    } else {
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="300px" // Adjust the height to ensure proper centering
        >
          <CircularProgress size={50} />
          <Typography variant="h6" sx={{ marginLeft: 2 }}>
            Fetching Data...
          </Typography>
        </Box>
      );
    }
  };



  if (glanceState.initialLoading && !glanceState.loadDatasetAndModelResult) {
    return (
      <Box sx={styles.loaderContainer}>
        <CircularProgress />
        <Typography variant="h6" sx={{ marginTop: 2 }}>Initializing page...</Typography>
      </Box>
    );
  }



  return (
    <Box
      sx={{
        padding: 2,        // Adds consistent padding
        backgroundColor: "#f9f9f9", // Light background for the app
        minHeight: "100vh", // Ensures full viewport height
      }}>

      <Typography
        variant="h4"
        gutterBottom
        sx={{
          ...styles.header,
          background: "linear-gradient(90deg, green, blue)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontWeight: "bold", // Optional, makes the text bold
          marginBottom: 2,
          marginTop: 4

        }}
      >
        GLOVES: Global Counterfactual-based Visual Explanations
      </Typography>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ marginBottom: 2, marginTop: 2 }} >
        {steps.map((label, index) => (
          <Step key={label} onClick={() => handleStepClick(index)}>
            <StepLabel
              sx={{
                cursor: "pointer",
                "& .MuiStepLabel-label": { textDecoration: "underline" },
              }}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>



      <Box sx={{ padding: 2 }}>

        {selectedTab === 0 && (
          <Box>
            <DataModelSetup
              selectedDataset={selectedDataset}
              setSelectedDataset={setSelectedDataset}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
            />

          </Box>
        )}
        {selectedTab === 1 && (
          <Box>
            {glanceState.datasetLoading && (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="300px" // Adjust the height to ensure proper centering
              >
                <CircularProgress size={50} />
                <Typography variant="h6" sx={{ marginLeft: 2 }}>
                  Fetching Data...
                </Typography>
              </Box>
            )}
            {glanceState.loadDatasetAndModelResult && !glanceState.datasetLoading && (
              <Box>
                {viewOption === "affected" && glanceState.loadDatasetAndModelResult.affected && (
                  <>
                    <WorkflowCard
                      title={
                        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                          <Typography variant="h6">{`Affected Data for ${selectedDataset} with ${selectedModel} model`}</Typography>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={viewOption === "affected"}
                                onChange={(e) => setViewOption(e.target.checked ? "affected" : "test")}
                                color="primary"
                              />
                            }
                            label="Affected Data"
                            labelPlacement="start"
                          />
                        </Box>
                      }
                      description="Instances from the test dataset where the model's prediction was equal to 0.">
                      <DataTable title="Affected Test Data" data={glanceState.loadDatasetAndModelResult.affected} showArrow={false} />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={showUMAPScatter}
                            onChange={(e) => setShowUMAPScatter(e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Enable Dimensionality Reduction (UMAP)"
                      />
                      {renderScatterPlot()}
                    </WorkflowCard>
                  </>
                )}

                {viewOption === "test" && glanceState.loadDatasetAndModelResult.X_test && (
                  <>
                    <WorkflowCard
                      title={
                        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                          <Typography variant="h6">{`Test Data for ${selectedDataset} with ${selectedModel} model`}</Typography>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={viewOption === "affected"}
                                onChange={(e) => setViewOption(e.target.checked ? "affected" : "test")}
                                color="primary"
                              />
                            }
                            label="Test Data"
                            labelPlacement="start"

                          />
                        </Box>
                      }
                      description="A subset of the dataset set aside during the train-test split, used to evaluate the performance of the trained ML model on unseen data.">
                      <DataTable title="Test Data" data={glanceState.loadDatasetAndModelResult.X_test} showArrow={false} />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={showUMAPScatter}
                            onChange={(e) => setShowUMAPScatter(e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Enable Dimensionality Reduction (UMAP)"
                      />
                      {renderScatterPlot()}
                    </WorkflowCard>
                  </>
                )}
              </Box>


            )}
          </Box>
        )}

        {selectedTab === 2 && (
          <Box>
            {glanceState.datasetLoading ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="300px" // Adjust the height to ensure proper centering
              >
                <CircularProgress size={50} />
                <Typography variant="h6" sx={{ marginLeft: 2 }}>
                  Fetching Data...
                </Typography>
              </Box>
            ) : (
              <Box>
                <ComparativeGlance
                  availableCfMethods={glanceState.availableCfMethods}
                  availableActionStrategies={glanceState.availableActionStrategies}
                  availableFeatures={glanceState.availableFeatures.slice(0, -1)}
                />
              </Box>
            )}
          </Box>
        )}
      </Box>


    </Box>
  );
};

export default GlanceComponent;
