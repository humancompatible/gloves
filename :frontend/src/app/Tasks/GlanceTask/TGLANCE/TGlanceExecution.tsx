import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../../store/store";
import { runTGlance } from "../../../../store/slices/glanceSlice";
import {
  Button,
  Typography,
  MenuItem,
  Select,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Chip,
} from "@mui/material";

interface TGlanceExecutionProps {
  availableCfMethods: string[];
  availableFeatures: string[];
}

const TGlanceExecution: React.FC<TGlanceExecutionProps> = ({
  availableCfMethods,
  availableFeatures,
}) => {
  const dispatch = useAppDispatch();
  const [splitFeatures, setSplitFeatures] = React.useState<string[]>([]);
  const [cfMethod, setCfMethod] = React.useState<string>(availableCfMethods[0] || "");
  const [results, setResults] = React.useState<any | null>(null);
  const loading = useAppSelector((state) => state.glance.loading);
  const error = useAppSelector((state) => state.glance.error);

  useEffect(() => {
    // Preselect the first available method if availableCfMethods is not empty
    if (availableCfMethods.length > 0 && !cfMethod) {
      setCfMethod(availableCfMethods[0]);
    }
    if (availableFeatures.length > 0) {
      setSplitFeatures(availableFeatures);
    }
  }, [availableCfMethods, availableFeatures]);

  const handleRunTGlance = () => {
    if (splitFeatures.length > 0 && cfMethod) {
      dispatch(runTGlance({ split_features: splitFeatures, local_cf_method: cfMethod }))
        .unwrap()
        .then((data) => {
          setResults(data);
        })
        .catch(() => {
          setResults(null);
        });
    }
  };

  return (
    // <>

    //   {/* Counterfactual Method Selection Dropdown */}
    //   <Select
    //     label="Counterfactual Method"
    //     value={cfMethod}
    //     onChange={(e) => setCfMethod(e.target.value as string)}
    //     fullWidth
    //     style={{ marginBottom: 16 }}
    //   >
    //     {availableCfMethods.map((method) => (
    //       <MenuItem key={method} value={method}>
    //         {method}
    //       </MenuItem>
    //     ))}
    //   </Select>

    //   {/* Multi-Select for Features */}
    //   <FormControl fullWidth style={{ marginBottom: 16 }}>
    //     <InputLabel>Select Features for Split</InputLabel>
    //     <Select
    //       multiple
    //       value={splitFeatures}
    //       onChange={(e) => setSplitFeatures(e.target.value as string[])}
    //       renderValue={(selected) => (
    //         <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
    //           {selected.map((value) => (
    //             <Chip key={value} label={value} />
    //           ))}
    //         </Box>
    //       )}
    //     >
    //       {availableFeatures.map((feature) => (
    //         <MenuItem key={feature} value={feature}>
    //           {feature}
    //         </MenuItem>
    //       ))}
    //     </Select>
    //   </FormControl>

    //   <Box display="flex" justifyContent="center" alignItems="center">
    //     <Button
    //       variant="contained"
    //       color="primary"
    //       onClick={handleRunTGlance}
    //       disabled={loading || !cfMethod}

    //     >
    //       Run T-GLANCE
    //     </Button>

    //     {loading && <CircularProgress size={24} style={{ marginLeft: 16 }} />}
    //   </Box>

    //   {error && (
    //     <Typography color="error" style={{ marginTop: 16 }}>
    //       {error}
    //     </Typography>
    //   )}

    //   {results && (
    //     <div style={{ marginTop: 16 }}>
    //       <Typography variant="h6">Results Tree</Typography>
    //       {/* You would render your results here */}
    //     </div>
    //   )}
    // </>
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} mt={2}>
        {/* Counterfactual Method Selection Dropdown */}
        <FormControl variant="outlined" style={{ flex: 1, marginRight: 16 }}>
          <InputLabel>Counterfactual Method</InputLabel>
          <Select
            label="Counterfactual Method"
            value={cfMethod}
            onChange={(e) => setCfMethod(e.target.value as string)}
            fullWidth
          >
            {availableCfMethods.map((method) => (
              <MenuItem key={method} value={method}>
                {method}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Multi-Select for Features */}
        <FormControl variant="outlined" style={{ flex: 2, marginRight: 16 }}>
          <InputLabel>Select Features for Split</InputLabel>
          <Select
            multiple
            label="Select Features for Split"
            value={splitFeatures}
            onChange={(e) => setSplitFeatures(e.target.value as string[])}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} />
                ))}
              </Box>
            )}
          >
            {availableFeatures.map((feature) => (
              <MenuItem key={feature} value={feature}>
                {feature}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Run Button */}
        <Button
          variant="contained"
          color="primary"
          onClick={handleRunTGlance}
          disabled={loading || !cfMethod}
          style={{ flexShrink: 0 }} // Prevent button from resizing
        >
          Run T-GLANCE
        </Button>

        {loading && <CircularProgress size={24} style={{ marginLeft: 16 }} />}
      </Box>

      {error && (
        <Typography color="error" style={{ marginTop: 16 }}>
          {error}
        </Typography>
      )}

      {results && (
        <div style={{ marginTop: 16 }}>
          <Typography variant="h6">Results Tree</Typography>
          {/* You would render your results here */}
        </div>
      )}
    </>

  );
};

export default TGlanceExecution;
