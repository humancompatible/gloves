import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../store/store";
import { applyAffectedActions, runCGlance, setSelectedFeatures, umapReduce } from "../../../../store/slices/glanceSlice";
import {
  Button,
  Typography,
  Select,
  MenuItem,
  Box,
  InputLabel,
  FormControl,
  OutlinedInput,
  SelectChangeEvent,
  Collapse,
  Tooltip
} from "@mui/material";

interface CGlanceExecutionProps {
  availableCfMethods: string[];
  availableActionStrategies: string[];
  availableFeatures: string[];
}

const CGlanceExecution: React.FC<CGlanceExecutionProps> = ({
  availableCfMethods,
  availableActionStrategies,
  availableFeatures,
}) => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.glance.loading);
  const error = useAppSelector((state) => state.glance.error);
  const glanceState = useAppSelector((state) => state.glance);


  const [gcfSize, setGcfSize] = React.useState<number>(3);
  const [cfMethod, setCfMethod] = React.useState<string>(availableCfMethods[0] || "");
  const [actionChoiceStrategy, setActionChoiceStrategy] = React.useState<string>(availableActionStrategies[0] || "");
  // const [selectedFeature, setSelectedFeature] = React.useState<string[]>(availableFeatures);
  const [selectedFeature, setSelectedFeature] = useState<string[]>([]); // Start with empty array

  const [results, setResults] = React.useState<any | null>(null);
  useEffect(() => {
    if (availableCfMethods.length > 0 && !cfMethod) {
      setCfMethod(availableCfMethods[0]);
    }
    if (availableFeatures.length > 0 && selectedFeature.length === 0) {
      setSelectedFeature(availableFeatures); // Only set if `selectedFeature` is empty
    }
  }, [availableCfMethods, availableFeatures]);

  const handleRunCGlance = () => {
    setResults(null);

    if (gcfSize > 0 && cfMethod) {
      dispatch(
        runCGlance({
          gcf_size: gcfSize,
          cf_method: cfMethod,
          action_choice_strategy: actionChoiceStrategy,
          selected_features: selectedFeature.length > 0 ? selectedFeature : undefined,
        })
      )
        .unwrap()
        .then((data) => {
          setResults(data);
        })
        .catch(() => {
          setResults(null);
        });
    }
  };



  useEffect(() => {
    if (results) {
      dispatch(applyAffectedActions());
      dispatch(umapReduce({ dataset_identifier: "appliedAffected", n_components: 2 }))
      dispatch(umapReduce({ dataset_identifier: "affectedData", n_components: 2 }))

    }
  }, [results, dispatch]);

  useEffect(() => {
    setResults(null);
  }, [gcfSize, cfMethod, actionChoiceStrategy]);


  const handleFeatureChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    setSelectedFeature(value);
    dispatch(setSelectedFeatures(value)); // Dispatch the action to update the state in the Redux slice
  };

  const [advancedOptionsOpen, setAdvancedOptionsOpen] = useState(false); // To control the collapse state

  return (
    <>
      {/* Box container to arrange elements side by side */}
      <Box display="flex" alignItems="center" gap={1} marginBottom={2} marginTop={2} flexWrap="wrap">
        {/* Dropdown for GCF Size */}
        <Tooltip
          title="The number of actions to be generated in the end of the algorithm">

          <FormControl fullWidth sx={{ flex: 1, minWidth: "150px" }} >
            <InputLabel id="gcf-size-select-label">Number of CounterFactual Actions</InputLabel>
            <Select
              MenuProps={{
                PaperProps: { style: { maxHeight: 224, width: 250 } },
              }}
              labelId="gcf-size-select-label"

              input={<OutlinedInput label="Number of CounterFactual Actions" />}

              value={gcfSize}

              onChange={(e) => setGcfSize(Number(e.target.value))}
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (

                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Tooltip>


        {/* Multi-Select for Features */}

      </Box>
      <Box display="flex" justifyContent="flex-start" marginTop={2}>
        <Button
          variant="outlined"
          onClick={() => setAdvancedOptionsOpen(!advancedOptionsOpen)}
        >

          {advancedOptionsOpen ? 'Hide Advanced Options' : 'Show Advanced Options'}
        </Button>
      </Box>
      <Collapse in={advancedOptionsOpen}>
        <Box display="flex" gap={1} marginTop={2} flexWrap="wrap">

          {/* Counterfactual Method Selection Dropdown */}
          <Tooltip title="Methods that generate candidate counterfactual explanations">
            <FormControl fullWidth sx={{ flex: 1, minWidth: "150px" }}>
              <InputLabel id="cf-method-select-label">Local Counterfactual Method</InputLabel>
              <Select
                labelId="cf-method-select-label"
                input={<OutlinedInput label="Local Counterfactual Method" />}
                value={cfMethod}
                onChange={(e) => setCfMethod(e.target.value as string)}
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

          {/* Action Choice Strategy Selection Dropdown */}
          <Tooltip title="Different strategies for selecting the best actions from the generated counterfactuals based on different criteria">
            <FormControl fullWidth sx={{ flex: 1, minWidth: "150px" }}>
              <InputLabel id="action-choice-strategy-select-label">Action Choice Strategy</InputLabel>
              <Select
                MenuProps={{
                  PaperProps: { style: { maxHeight: 224, width: 250 } },
                }}
                labelId="action-choice-strategy-select-label"
                input={<OutlinedInput label="Action Choice Strategy" />}
                value={actionChoiceStrategy}
                onChange={(e) => setActionChoiceStrategy(e.target.value as string)}
              >
                {availableActionStrategies.map((strategy) => (
                  <MenuItem key={strategy} value={strategy}>
                    {strategy}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Tooltip>

          <Tooltip title="Select the features to modify when generating candidate counterfactual explanations. Supports methods are DiCE and Random Sampling.">
            <FormControl fullWidth sx={{ flex: 1, minWidth: "150px" }}>
              <InputLabel id="feature-select-label">Features</InputLabel>
              <Select
                labelId="feature-select-label"
                input={<OutlinedInput label=" Features" />}
                multiple
                value={selectedFeature}

                onChange={handleFeatureChange}
                renderValue={(selected) => (
                  <Box>
                    {selected.join(', ')}
                  </Box>
                )}
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
        </Box>
      </Collapse>



      <Box display="flex" justifyContent="center" alignItems="center" marginTop={2} >
        <Button
          variant="contained"
          color="primary"
          onClick={handleRunCGlance}
          disabled={loading || gcfSize <= 0 || !cfMethod}
        >
          Run GLOVES
        </Button>
        {/* {loading && <CircularProgress size={24} style={{ marginLeft: 16 }} />} */}
        {error && (
          <Typography color="error" style={{ marginTop: 16 }}>
            No counterfactuals found for any of the query points! Kindly check your configuration.
          </Typography>
        )}
      </Box>

    </>
  );
};

export default CGlanceExecution;
