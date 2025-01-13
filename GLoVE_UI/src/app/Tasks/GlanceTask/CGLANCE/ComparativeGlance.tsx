import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../store/store";
import { runCGlanceComparative } from "../../../../store/slices/glanceSlice";
import {
  Button,
  Typography,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  InputLabel,
  FormControl,
  OutlinedInput,
  TableContainer,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  Grid,
  TableRow,
  FormControlLabel,
  Switch,
  Tooltip,
} from "@mui/material";
import { VisualizationSpec } from "react-vega"; // Import VegaLite from react-vega
import ResponsiveVegaLite from "../../../../shared/components/responsive-vegalite";
import WorkflowCard from "../../../../shared/components/workflow-card";
import MetricSummary from "../MetricSummary";
import ActionScatter from "../PLOTS/ActionScatter";
import UmapGlanceComponent from "../UmapGlanceComponent";


interface CGlanceExecutionProps {
  availableCfMethods: string[];
  availableActionStrategies: string[];
  availableFeatures: string[];
}

const ComparativeGlance: React.FC<CGlanceExecutionProps> = ({
  availableCfMethods,
  availableActionStrategies,
  availableFeatures,
}) => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.glance.loading);
  const error = useAppSelector((state) => state.glance.error);
  const comparativeLoading = useAppSelector((state) => state.glance.comparativeLoading);

  const glanceState = useAppSelector((state) => state.glance);
  const [selectedDetails, setSelectedDetails] = React.useState<any | null>(null); // State for selected details
  const [showPlots, setShowPlots] = React.useState(true); // New state to manage plot visibility
  const [executionMode, setExecutionMode] = React.useState<string>("Number of Counterfactual Actions");
  const [gcfSize, setGcfSize] = React.useState<number[]>([3]);
  const [cfMethod, setCfMethod] = React.useState<string[]>([availableCfMethods[0]]);
  const [actionChoiceStrategy, setActionChoiceStrategy] = React.useState<string[]>([availableActionStrategies[0]]);
  const [selectedFeatures, setSelectedFeatures] = React.useState<string[]>(availableFeatures);
  const [results, setResults] = React.useState<any | null>(null);
  const isMultiSelect = (type: string) => executionMode === type;
  const getSuffix = (value: string) => value.split('_').pop() || value;
  const [showUMAPInTab1, setShowUMAPInTab1] = useState(true); // New state for UMAP in Tab 1
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);

  const handleCfMethodChange = (value: string[]) => {
    setCfMethod(value);

    // Automatically select all features if NearestNeighbors is chosen
    if (value.includes("NearestNeighbors")) {
      setSelectedFeatures(availableFeatures);
    }
  };

  // Check if NearestNeighbors is selected
  const isNearestNeighborsSelected = cfMethod.includes("NearestNeighbors");

  const handleViewDetails = (key: any, data: any) => {
    if (selectedRowKey === key) {
      // If the same row is clicked again, clear the details and show plots
      clearDetails();
    } else {
      setSelectedDetails(data); // Update selected details when button is clicked
      setSelectedRowKey(key); // Mark the row as selected
      setShowPlots(false); // Hide plots
    }
  };

  const clearDetails = () => {
    setSelectedDetails(null); // Clear selected details
    setSelectedRowKey(null); // Clear selected row key
    setShowPlots(true); // Show plots again
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Add state for error messages


  const handleRun = () => {
    dispatch(
      runCGlanceComparative({
        sizes: gcfSize,
        methods: cfMethod,
        strategies: actionChoiceStrategy,
        selectedFeatures,
        caseType: executionMode
      })
    )
      .unwrap()
      .then((data) => {
        setResults(data); // Update results on success
      })
      .catch((error) => {
        setResults(null); // Clear results if there's an error
        if (error?.detail) {
          setErrorMessage(error.detail); // Set the error message from the response
        } else {
          setErrorMessage("An unexpected error occurred."); // Default error message
        }
      });
  };


  const getRowLabelKey = () => {
    switch (executionMode) {
      case "Number of Counterfactual Actions":
        return "Counterfactual Actions";
      case "Local Counterfactual Method":
        return "Local Counterfactual Methods";
      case "Action Choice Strategy":
        return "Action Choice Strategy";
      default:
        return "key";
    }
  };

  const rowLabelKey = getRowLabelKey();


  const scatterPlotData = glanceState.comparativeResults
    ? Object.entries(glanceState.comparativeResults).map(([key, data]) => ({
      TotalCost: data.TotalCost,
      TotalEffectiveness: data.TotalEffectiveness,
      [rowLabelKey]: key,
      DisplayKey: getSuffix(key), // Add cleaned-up value for display
    }))
    : [];



  const scatterPlotSpec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { values: scatterPlotData },
    transform: [
      {
        calculate: "datum.TotalEffectiveness * 100", // Multiply TotalEffectiveness by 100
        as: "ScaledEffectiveness", // Store the result in a new field
      },
    ],
    mark: "point",
    encoding: {
      x: { field: "TotalCost", type: "quantitative", title: "Total Cost" },
      y: {
        field: "ScaledEffectiveness", // Use the scaled field for the y-axis
        type: "quantitative",
        title: "Total Effectiveness (%)", // Adjust the title to reflect the scaling
      },
      color: { field: "DisplayKey", type: "nominal", title: executionMode }, // Replace 'key' with dynamic field
      tooltip: [
        { field: "TotalCost", type: "quantitative", title: "Total Cost" },
        {
          field: "ScaledEffectiveness",
          type: "quantitative",
          title: "Total Effectiveness (%)" // Reflect the scaled value in the tooltip
        },
        { field: "DisplayKey", type: "nominal", title: executionMode }, // Replace 'key' in tooltip
      ],
    },
  };

  const chart1 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { values: scatterPlotData },
    transform: [
      {
        calculate: "datum.TotalEffectiveness * 100", // Scale TotalEffectiveness by 100
        as: "ScaledEffectiveness", // Store in a new field
      },
    ],
    mark: "bar",
    encoding: {
      y: { field: "TotalCost", type: "quantitative", title: "Total Cost" },
      x: { field: "DisplayKey", type: "nominal", title: executionMode }, // Replace 'key' with dynamic field
      tooltip: [
        { field: "TotalCost", type: "quantitative", title: "Total Cost" },
        {
          field: "ScaledEffectiveness",
          type: "quantitative",
          title: "Total Effectiveness (%)" // Reflect scaled value
        },
        { field: "DisplayKey", type: "nominal", title: executionMode }, // Replace 'key' in tooltip
      ],
    },
  };

  const chart2 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { values: scatterPlotData },
    transform: [
      {
        calculate: "datum.TotalEffectiveness * 100", // Scale TotalEffectiveness by 100
        as: "ScaledEffectiveness", // Store in a new field
      },
    ],
    mark: "bar",
    encoding: {
      y: {
        field: "ScaledEffectiveness", // Use scaled field for the y-axis
        type: "quantitative",
        title: "Total Effectiveness (%)" // Update axis title
      },
      x: { field: "DisplayKey", type: "nominal", title: executionMode }, // Replace 'key' with dynamic field
      tooltip: [
        { field: "TotalCost", type: "quantitative", title: "Total Cost" },
        {
          field: "ScaledEffectiveness",
          type: "quantitative",
          title: "Total Effectiveness (%)" // Reflect scaled value in the tooltip
        },
        { field: "DisplayKey", type: "nominal", title: executionMode }, // Replace 'key' in tooltip
      ],
    },
  };

  const hasErrors = glanceState.comparativeResults
    ? Object.values(glanceState.comparativeResults).some((result: any) => result.error)
    : false;

  const validResults = glanceState.comparativeResults
    ? Object.entries(glanceState.comparativeResults).filter(([, result]: any) => !result.error)
    : [];
  const errorResults = glanceState.comparativeResults
    ? Object.entries(glanceState.comparativeResults).filter(([, result]: any) => result.error)
    : [];

  return (
    <WorkflowCard title="Counterfactual Analysis Configuration:" description="">


      <Box marginTop={2}>

        <Box display="flex" alignItems="center" gap={1} marginBottom={2} marginTop={2} flexWrap="wrap">

          {/* Execution Mode Dropdown */}
          <FormControl fullWidth sx={{ flex: 1, minWidth: "150px" }}>
            <InputLabel id="execution-mode-select-label">Execution Mode</InputLabel>
            <Select
              labelId="execution-mode-select-label"
              value={executionMode}
              onChange={(e) => {
                const newExecutionMode = e.target.value;
                setExecutionMode(newExecutionMode);

                // Reset all states to their defaults
                setGcfSize([3]); // Default for gcfSize
                setCfMethod([availableCfMethods[0]]); // Default for cfMethod
                setActionChoiceStrategy([availableActionStrategies[0]]); // Default for actionChoiceStrategy
                setSelectedFeatures(availableFeatures); // Default for selectedFeatures
              }}
              input={<OutlinedInput label="Execution Mode" />}
            >
              <MenuItem value="Number of Counterfactual Actions">Number of Counterfactual Actions</MenuItem>
              <MenuItem value="Local Counterfactual Method">Local Counterfactual Method</MenuItem>
              <MenuItem value="Action Choice Strategy">Action Choice Strategy</MenuItem>
            </Select>
          </FormControl>

          {/* GCF Size */}
          <Tooltip
            title="The number of actions to be generated in the end of the algorithm"
            placement="right-start">
            <FormControl fullWidth sx={{ flex: 1, minWidth: "150px" }}>
              <InputLabel id="gcf-size-select-label">Number of Counterfactual Actions</InputLabel>
              <Select
                labelId="gcf-size-select-label"
                input={<OutlinedInput label="Number of Counterfactual Actions" />}
                multiple={isMultiSelect("Number of Counterfactual Actions")}
                value={gcfSize}
                onChange={(e) => setGcfSize(isMultiSelect("Number of Counterfactual Actions") ? (e.target.value as number[]) : [Number(e.target.value)])}
                renderValue={(selected) =>
                  Array.isArray(selected) ? selected.join(", ") : selected
                }
                MenuProps={{
                  PaperProps: { style: { maxHeight: 224, width: 250 } },
                }}
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Tooltip>

          {/* Counterfactual Method */}
          <Tooltip title="Methods that generate candidate counterfactual explanations"
            placement="right-start">

            <FormControl fullWidth sx={{ flex: 1, minWidth: "150px" }}>
              <InputLabel id="cf-method-select-label">Local Counterfactual Method</InputLabel>
              <Select
                labelId="cf-method-select-label"
                input={<OutlinedInput label="Local Counterfactual Method" />}
                multiple={isMultiSelect("Local Counterfactual Method")}
                value={cfMethod}
                onChange={(e) =>
                  setCfMethod(
                    isMultiSelect("Local Counterfactual Method") ? (e.target.value as string[]) : [(e.target.value as string)]
                  )
                }
                renderValue={(selected) =>
                  Array.isArray(selected) ? selected.join(", ") : selected
                }
                MenuProps={{
                  PaperProps: { style: { maxHeight: 224, width: 250 } },
                }}
              >
                {availableCfMethods.map((method) => (
                  <MenuItem key={method} value={method}>
                    {method}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Tooltip>

          {/* Action Choice Strategy */}
          <Tooltip title="Different strategies for selecting the best actions from the generated counterfactuals based on different criteria"
            placement="right-start">

            <FormControl fullWidth sx={{ flex: 1, minWidth: "150px" }}>
              <InputLabel id="action-choice-strategy-select-label">Action Choice Strategy</InputLabel>
              <Select
                labelId="action-choice-strategy-select-label"
                input={<OutlinedInput label="Action Choice Strategy" />}
                multiple={isMultiSelect("Action Choice Strategy")}
                value={actionChoiceStrategy}
                onChange={(e) =>
                  setActionChoiceStrategy(
                    isMultiSelect("Action Choice Strategy") ? (e.target.value as string[]) : [(e.target.value as string)]
                  )
                }
                renderValue={(selected) =>
                  Array.isArray(selected) ? selected.join(", ") : selected
                }
                MenuProps={{
                  PaperProps: { style: { maxHeight: 224, width: 250 } },
                }}
              >
                {availableActionStrategies.map((strategy) => (
                  <MenuItem key={strategy} value={strategy}>
                    {strategy}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Tooltip>

          {/* Features */}
          <Tooltip title="Select the features to modify when generating candidate counterfactual explanations. Supports methods are DiCE and Random Sampling."
            placement="right-start">

            <FormControl fullWidth sx={{ flex: 1, minWidth: "150px" }}>
              <InputLabel id="feature-select-label">Features</InputLabel>
              <Select
                labelId="feature-select-label"
                input={<OutlinedInput label="Features" />}
                multiple
                value={selectedFeatures}
                onChange={(e) => setSelectedFeatures(e.target.value as string[])}
                renderValue={(selected) => selected.join(", ")}
                disabled={isNearestNeighborsSelected} // Disable dropdown if NearestNeighbors is selected
                MenuProps={{
                  PaperProps: { style: { maxHeight: 224, width: 250 } },
                }}
              >
                {availableFeatures.map((feature) => (
                  <MenuItem key={feature} value={feature}>
                    {feature}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Tooltip>

          {/* Run Button */}
          <Box display="flex" justifyContent="center" alignItems="center" width="100%" marginTop={3}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleRun}
              disabled={
                comparativeLoading ||
                (executionMode === "Number of Counterfactual Actions" && gcfSize.length === 0) ||
                (executionMode === "Local Counterfactual Method" && cfMethod.length === 0) ||
                (executionMode === "Action Choice Strategy" && actionChoiceStrategy.length === 0)
              }
            >
              Run Analysis
            </Button>
            {error && (
              <Typography color="error" style={{ marginTop: 16 }}>
                {error}
              </Typography>
            )}
          </Box>
        </Box>

        <Box marginTop={4}>
          {comparativeLoading ? (
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="400px">
              <CircularProgress size={50} />
              <Typography variant="h6" sx={{ marginTop: 2 }}>
                Running Experiments...
              </Typography>
            </Box>
          ) : (
            <>
              {/* Render Errors */}
              {errorResults.length > 0 && (
                <WorkflowCard title="Analysis Errors" description="Some configurations encountered errors:">
                  <TableContainer component={Paper} sx={{ marginBottom: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>{executionMode}</TableCell>
                          <TableCell>Error Message</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {errorResults.map(([key, result]: any) => (
                          <TableRow key={key}>
                            <TableCell>{getSuffix(key)}</TableCell>
                            <TableCell>{result.error}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </WorkflowCard>
              )}

              {/* Render Valid Results */}
              {validResults.length > 0 && (
                <Box sx={{ marginTop: 2 }}>
                  <WorkflowCard title="Counterfactual Analysis Results" description="">
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>{executionMode}</TableCell>
                            <TableCell>Total Cost</TableCell>
                            <TableCell>Total Effectiveness %</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {validResults.map(([key, data]: any) => (
                            <TableRow key={key} style={{ backgroundColor: selectedRowKey === key ? "#e0f7fa" : "inherit" }}>
                              <TableCell>{getSuffix(key)}</TableCell>
                              <TableCell>{data.TotalCost}</TableCell>
                              <TableCell>{data.TotalEffectiveness * 100}</TableCell>
                              <TableCell>
                                <Button
                                  variant="contained"
                                  color="primary"
                                  onClick={() => handleViewDetails(key, data)}
                                  size="small"
                                  style={{ backgroundColor: selectedRowKey === key ? "#00796b" : undefined }}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </WorkflowCard>
                  {selectedDetails && (
                    <>


                      <Box marginTop={4}>
                        <WorkflowCard
                          title={"Metric Summary"}
                          description="Total Effectiveness: is the percentage of individuals that achieve the favorable outcome, if each one of the final actions is applied to the whole affected population. 
            Total Cost: is calculated as the mean recourse cost of the whole set of final actions over the entire population."
                        >
                          {/* <Box
                  display="flex"
                  justifyContent="flex-end"
                  alignItems="flex-end"
                  position="absolute"

                >
                  <Button
                    variant="text"
                    onClick={clearDetails} // Clear the details view
                    style={{ minWidth: "40px", padding: "4px" }}
                  >
                    ✕
                  </Button>
                </Box> */}
                          <MetricSummary
                            cost={selectedDetails.TotalCost}
                            eff={selectedDetails.TotalEffectiveness}
                            actions={selectedDetails.actions}
                            instances={selectedDetails.applyAffectedActions["Chosen_Action"]}
                          />
                        </WorkflowCard>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={showUMAPInTab1}
                              onChange={(e) => {
                                setShowUMAPInTab1(e.target.checked);
                              }}
                              color="primary"
                            />
                          }
                          label="Enable Dimensionality Reduction (UMAP)"
                        />
                        {!showUMAPInTab1 ? (
                          <Box
                            mt={2}
                            display="flex"
                            justifyContent="space-between"
                            flexWrap="wrap"
                            gap={2}
                          >
                            <Box flex={1} minWidth={0}>
                              <ActionScatter
                                data1={selectedDetails.affected_clusters}
                                data2={selectedDetails.applyAffectedActions}
                                actions={selectedDetails.actions}
                                eff_cost_actions={
                                  selectedDetails.eff_cost_actions
                                }
                              />
                            </Box>
                          </Box>
                        ) : (<UmapGlanceComponent applied_aff_data={selectedDetails.umapOfAppliedAffected.data} aff_data={glanceState.umapReduceResults} actions={selectedDetails.affected_clusters} eff_cost_actions={selectedDetails.eff_cost_actions} />
                        )}

                      </Box>
                    </>
                  )}

                  {/* Render Plots */}
                  {showPlots && (
                    <Grid container spacing={2} marginTop={"20px"}>
                      <Grid item xs={12} md={4}>
                        <WorkflowCard title="Cost-Effectiveness" description="Visualizes the performance of the algorithm for different parameter configurations.">
                          <ResponsiveVegaLite
                            minWidth={100}
                            minHeight={100}
                            maxHeight={500}
                            maxWidth={500}
                            aspectRatio={1}
                            actions={false}
                            spec={scatterPlotSpec as VisualizationSpec}
                          />
                        </WorkflowCard>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <WorkflowCard title="Cost by Parameter" description="Displays the cost of the algorithm across different runs, with the y-axis representing effectiveness and the x-axis showing varying values of the selected parameter.">
                          <ResponsiveVegaLite
                            minWidth={100}
                            minHeight={100}
                            maxHeight={500}
                            maxWidth={500}
                            aspectRatio={1}
                            actions={false}
                            spec={chart1 as VisualizationSpec}
                          />
                        </WorkflowCard>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <WorkflowCard title="Effectiveness by Parameter" description="Displays the effectiveness of the algorithm across different runs, with the y-axis representing effectiveness and the x-axis showing varying values of the selected parameter.">
                          <ResponsiveVegaLite
                            minWidth={100}
                            minHeight={100}
                            maxHeight={500}
                            maxWidth={500}
                            aspectRatio={1}
                            actions={false}
                            spec={chart2 as VisualizationSpec}
                          />
                        </WorkflowCard>
                      </Grid>
                    </Grid>
                  )}
                </Box>
              )}
            </>
          )}
        </Box>

      </Box>
    </WorkflowCard>
  );
};

export default ComparativeGlance;


