import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
} from "@mui/material"
import { useState } from "react"
import { RootState, useAppDispatch } from "../../../../store/store"
import { runModelComparative } from "../../../../store/slices/glanceSlice"
import ResponsiveVegaLite from "../../../../shared/components/responsive-vegalite"
import ResponsiveCardTable from "../../../../shared/components/responsive-card-table"
import Loader from "../../../../shared/components/loader"
import { getCompareMethodsChartSpec } from "../Plots/chartSpecs"
import InfoMessage from "../../../../shared/components/infoMessage"
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded"
import { useSelector } from "react-redux"

const CompareMethods = () => {
  const [algorithms, setAlgorithms] = useState<string[]>(["run-c_glance"])
  const [gcfSize, setGcfSize] = useState<number>(3)
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState<boolean>(false) // Loading state

   const allResults = useSelector(
    (state: RootState) => state.glance.runModelComparativeResult || []
  )
  const filteredResults = allResults.filter(
  (result) =>
    algorithms.includes(result.algorithm) && 
    result.gcf_size === gcfSize.toString() // since you store gcf_size as string
)
const resultsMap = filteredResults.reduce((acc, result) => {
  acc[result.algorithm] = result.data.eff_cost_plot
  return acc
}, {} as Record<string, any>)
  const [results, setResults] = useState<any | null>(null)
  const [errorMessage, setErrorMessage] = useState<Record<
    string,
    string
  > | null>(null) // Add state for error messages
  const handleRun = async () => {
    setResults(null) // Clear previous results
    setErrorMessage(null) // Clear previous errors
    setLoading(true) // Set loading to true when the analysis starts

    const resultsMap: Record<string, any> = {} // Object to store results
    const errorsMap: Record<string, string> = {} // Object to store errors

    await Promise.all(
      algorithms.map(async algorithm => {
        try {
          const data = await dispatch(
            runModelComparative({
              algorithm,
              gcf_size: gcfSize,
            }),
          ).unwrap()

          resultsMap[algorithm] = data.data.eff_cost_plot // Store result
        } catch (error: any) {
          errorsMap[algorithm] =
            error?.detail || "An unexpected error occurred." // Store error
        }
      }),
    )
    // Update state with results
    setResults(resultsMap)
    setLoading(false) // Set loading to false when the analysis is complete

    // If there are errors, update error state
    if (Object.keys(errorsMap).length > 0) {
      setErrorMessage(errorsMap)
    }
  }
  const handleChange = (event: any) => {
    const {
      target: { value },
    } = event
    setAlgorithms(typeof value === "string" ? value.split(",") : value)
  }

  const addZeroStep = (runData: any) => {
    return { "0": { eff: 0, cost: 0 }, ...runData }
  }

  const transformedData = Object.entries(resultsMap).reduce(
  (acc: { [key: string]: any }, [runName, runData]) => {
    acc[runName] = addZeroStep(runData)
    return acc
  },
  {},
)
  const transformData = (runData: any, runName: string, offset: number) => {
    return Object.keys(runData).map(step => ({
      step: parseInt(step) + offset,
      eff: runData[step].eff,
      cost: runData[step].cost,
      run: runMap[runName],
    }))
  }

  

const runMap = {
  "run-c_glance": "GLANCE",
  "run-globece": "GLOBE_CE",
  "run-groupcfe":"GroupCFE",
};
const allData = Object.entries(transformedData).flatMap(([runName, runData], index) =>
  transformData(runData, runName, index * (gcfSize + 1)),
)

  return (
  <ResponsiveCardTable
    title={"Compare Methods Analysis"}
    details={
      "Visualize the performance of the algorithm for different parameter configurations."
    }
    controlPanel={
      <Box sx={{ flexGrow: 1, padding: 2 }}>
        <Grid container spacing={2}>
          {/* Full width form controls */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="Algorithm Selection">Algorithm Selection</InputLabel>
              <Select
                labelId="Algorithm Selection"
                multiple
                value={algorithms}
                onChange={handleChange}
                input={<OutlinedInput label="Algorithm Selection" />}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 250,
                      maxWidth: 300,
                    },
                  },
                }}
              >
                <MenuItem value="run-c_glance">GLANCE</MenuItem>
                <MenuItem value="run-groupcfe">GroupCFE</MenuItem>
                <MenuItem value="run-globece">GLOBE-CE</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="Counterfactial Size">Counterfactial Size</InputLabel>
              <Select
                labelId="Counterfactial Size"
                value={gcfSize}
                onChange={e => setGcfSize(e.target.value as number)}
                input={<OutlinedInput label="GCF Size Selection" />}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 200,
                      maxWidth: 300,
                    },
                  },
                }}
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map(value => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Run Button, always full width and below */}
          <Grid item xs={12}>
            <Button variant="contained" color="primary" fullWidth onClick={handleRun}>
              Run Analysis
            </Button>
          </Grid>
        </Grid>
      </Box>
    }
  >
    {loading ? (
      <Loader />
    ) : errorMessage ? (
      <InfoMessage
        message="One or more algorithms failed to run."
        type="error"
        icon={
          <ReportProblemRoundedIcon
            sx={{ fontSize: 40, color: "error.main" }}
          />
        }
        fullHeight
      />
    ) : allData.length === 0 ? (
      <InfoMessage
        message="Please select algorithm(s) and run the analysis to see results."
        type="info"
        icon={
          <ReportProblemRoundedIcon
            sx={{ fontSize: 40, color: "info.main" }}
          />
        }
        fullHeight
      />
    ) : (
      <ResponsiveVegaLite
        title="Effectiveness vs. Cost"
        details={"todo"}
        spec={getCompareMethodsChartSpec(allData)}
        actions={false}
        minWidth={100}
        minHeight={100}
        maxWidth={900}
        maxHeight={500}
      

      />
    )}
  </ResponsiveCardTable>

  )
}

export default CompareMethods
