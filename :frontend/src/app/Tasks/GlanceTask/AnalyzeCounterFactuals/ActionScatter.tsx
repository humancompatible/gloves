import { useState, useEffect } from "react"
import { FormControl, InputLabel, Select, MenuItem, Box, Grid, FormControlLabel, Switch } from "@mui/material"
import ResponsiveCardVegaLite from "../../../../shared/components/responsive-card-vegalite"
import {
  getAnalyzeCounterFactualsApplyActionChartSpec,
  getAnalyzeCounterFactualsSharedLegendChartSpec,
} from "../Plots/chartSpecs"
import { useAppDispatch, useAppSelector } from "../../../../store/store"
import { setShowUMAPInTab1 } from "../../../../store/slices/glanceSlice"

interface ActionScatterProps {
  data1: any
  data2: any
  eff_cost_actions: any
}
const ActionScatter = ({
  data1,
  data2,
}: ActionScatterProps) => {
  // Utility function to filter out unwanted fields for dropdown options only
  const isExcludedField = (field: string) => {
    const excludedFields = ["index", "Cluster", "Chosen_Action"]
    const actionPredictionRegex = /^Action\d+_Prediction$/
    return excludedFields.includes(field) || actionPredictionRegex.test(field)
  }

  const getColorOptions = (clusters: {}) => {
    if (!clusters) return []
    return Object.keys(clusters).filter(field =>
      /^Action\d+_Prediction$/.test(field),
    )
  }

  const [xAxis, setXAxis] = useState("")
  const [yAxis, setYAxis] = useState("")
  const [colorField, setColorField] = useState("")
  const [options, setOptions] = useState([])
  const [colorOptions, setColorOptions] = useState([])
const dispatch = useAppDispatch()
  const glanceState = useAppSelector(state => state.glance)
  const showUMAPInTab1 = useAppSelector(state => state.glance.showUMAPInTab1)
  // Extract options from the data for dropdowns (excluding certain fields)
  const getOptions = (clusters: {}) => {
    if (!clusters) return []
    return Object.keys(clusters).filter(field => !isExcludedField(field))
  }

  // Update state whenever data1 or data2 changes
  useEffect(() => {
    const options1 = getOptions(data1)
    const options2 = getOptions(data2)
    const combinedOptions =
      options1.length > options2.length ? options1 : options2

    setOptions(combinedOptions)
    setXAxis(combinedOptions[0] || "")
    setYAxis(combinedOptions[1] || "")
    setColorOptions(getColorOptions(data1))
    setColorField(getColorOptions(data1)[0] || "")
  }, [data1, data2])

  // Function to transform data for Vega-Lite, keeping all fields
  const transformData = (clusters: { [x: string]: { [x: string]: any } }) => {
    if (!clusters) return []
    const fields = Object.keys(clusters) // Include all fields (even excluded ones for the dropdowns)
    const sampleKeys = Object.keys(clusters[fields[0]] || {})

    return sampleKeys.map(key => {
      const dataPoint = { id: key }
      fields.forEach(field => {
        dataPoint[field] = clusters[field]?.[key]
      })
      return dataPoint
    })
  }

  const transformedData1 = transformData(data1)
  const transformedData2 = transformData(data2)

  return (
    <>
     <Grid container spacing={2} mb={1}>
  <Grid item xs={12} md={6}>
      <ResponsiveCardVegaLite
      title="Action Selection"
        spec={getAnalyzeCounterFactualsSharedLegendChartSpec(
          transformedData1,
          xAxis,
          yAxis,
        )}
        actions={false}
        controlPanel={
          <Box>
             <Box sx={{ flexGrow: 1, padding: 2 }}>
                 <Grid container spacing={2}>
                   {/* X-Axis Field */}
                   <Grid item xs={12} md={6}>
                     <FormControl fullWidth variant="outlined">
              <InputLabel>X-Axis</InputLabel>
              <Select
                value={xAxis}
                onChange={e => setXAxis(e.target.value)}
                label="X-Axis"
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 250,
                      maxWidth: 300,
                    },
                  },
                }}
              >
                {options.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            </Grid>
                               <Grid item xs={12} md={6}>


                      <FormControl fullWidth variant="outlined">

              <InputLabel>Y-Axis</InputLabel>
              <Select
                value={yAxis}
                onChange={e => setYAxis(e.target.value)}
                label="Y-Axis"
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 250,
                      maxWidth: 300,
                    },
                  },
                }}
              >
                {options.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            </Grid>
                 </Grid>
               </Box>
            <FormControlLabel
                                            control={
                                              <Switch
                                                checked={showUMAPInTab1}
                                                onChange={e => {
                                                  dispatch(setShowUMAPInTab1(e.target.checked))
                                                }}
                                                color="primary"
                                              />
                                            }
                                            label="UMAP"
                                          />
          </Box>
        }
      />
      </Grid> 
        <Grid item xs={12} md={6}>

      

       <ResponsiveCardVegaLite
        spec={getAnalyzeCounterFactualsSharedLegendChartSpec(
          transformedData2,
          xAxis,
          yAxis,
        )}
        actions={false}
        title="Post-Action Selection"
        controlPanel={
          <Box>
           
             <Box sx={{ flexGrow: 1, padding: 2 }}>
                 <Grid container spacing={2}>
                   {/* X-Axis Field */}
                   <Grid item xs={12} md={6}>
                     <FormControl fullWidth variant="outlined">

              <InputLabel>X-Axis</InputLabel>
              <Select
                value={xAxis}
                onChange={e => setXAxis(e.target.value)}
                label="X-Axis"
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 250,
                      maxWidth: 300,
                    },
                  },
                }}
              >
                {options.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>

            <FormControl
              variant="outlined"
            >
              <InputLabel>Y-Axis</InputLabel>
              <Select
                value={yAxis}
                onChange={e => setYAxis(e.target.value)}
                label="Y-Axis"
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 250,
                      maxWidth: 300,
                    },
                  },
                }}
              >
                {options.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            </Grid>
            </Grid>
            </Box>


            <FormControlLabel
                                            control={
                                              <Switch
                                                checked={showUMAPInTab1}
                                                onChange={e => {
                                                  dispatch(setShowUMAPInTab1(e.target.checked))
                                                }}
                                                color="primary"
                                              />
                                            }
                                            label="UMAP"
                                          />
          </Box>
        }
      />
      </Grid>

      {/* Right side (Vega-Lite Chart) */}

      </Grid>


      <ResponsiveCardVegaLite
            title="Individual Action Application"

        spec={getAnalyzeCounterFactualsApplyActionChartSpec(
          transformedData1,
          xAxis,
          yAxis,
          colorField,
        )}
        actions={false}
        controlPanel={
          <>
          <Box display="flex" justifyContent="center" gap={2}>
            <FormControl
              fullWidth
              margin="normal"
              style={{ minWidth: 200, marginRight: "20px" }}
            >
              <InputLabel>Apply</InputLabel>
              <Select
                value={colorField}
                onChange={e => setColorField(e.target.value)}
                label="Apply"
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 250,
                      maxWidth: 300,
                    },
                  },
                }}
              >
                {colorOptions.map(option => {
                  // Extract the part before "_Prediction"
                  const displayText = option.replace(/_Prediction$/, "")
                  return (
                    <MenuItem key={option} value={option}>
                      {displayText}
                    </MenuItem>
                  )
                })}
              </Select>
            </FormControl>
            
          </Box>
          <FormControlLabel
                                            control={
                                              <Switch
                                                checked={showUMAPInTab1}
                                                onChange={e => {
                                                  dispatch(setShowUMAPInTab1(e.target.checked))
                                                }}
                                                color="primary"
                                              />
                                            }
                                            label="UMAP"
                                          />
          </>
        }
        isStatic={false}
       
      />
    </>
  )
}

export default ActionScatter
