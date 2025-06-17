import { useEffect, useState } from "react"
import type { VisualizationSpec } from "react-vega"
import { FormControl, InputLabel, Select, MenuItem, Box, Grid } from "@mui/material"
import ResponsiveCardVegaLite from "../../../../shared/components/responsive-card-vegalite"
import Loader from "../../../../shared/components/loader"
interface ScatterPlotComponentForMainPageProps {
  data: any[]
  name: string
  controlPanel?: React.ReactNode
  loader?: boolean

}

const ScatterPlotComponentForMainPage = ({
  data,
  name,
  controlPanel,
  loader,
}: ScatterPlotComponentForMainPageProps) => {
  const modifiedData = data.map(item => ({
    ...item,
    label: item.label !== undefined ? item.label : 0, // Add 'label' with 0 if it doesn't exist
  }))

  // Extract unique field names from the data for dropdown options
  const fields = Object.keys(modifiedData[0] || {}).filter(
    field => field !== "index",
  ) // Exclude 'index'

  const determineType = (field: string) => {
    if (!modifiedData.length || modifiedData[0][field] === undefined) {
      return "nominal" // Default type in case of undefined data
    }
    const value = modifiedData[0][field]
    return typeof value === "string" ? "ordinal" : "quantitative"
  }

  // State variables to track user selection for axes and color field
  const [xField, setXField] = useState(fields[0])
  const [yField, setYField] = useState(fields[1])
  // const [colorField, setColorField] = useState(fields[2]);

  useEffect(() => {
    setXField(fields[0] || "") // Set to the first field or an empty string if no fields
    setYField(fields[1] || "") // Set to the second field or an empty string if no fields
    // setColorField(fields[2] || ''); // Set to the third field or an empty string if no fields
  }, [data])

  // Vega-Lite specification
  const spec = {
    data: { values: modifiedData },
    mark: "point",
    selection: {
      grid: {
        type: "interval",
        bind: "scales", // Enable zoom/pan
      },
      industry: {
        type: "point",
        fields: ["label"], // Field for legend interaction
        bind: "legend",
      },
    },
    encoding: {
      x: { field: xField, type: determineType(xField) },
      y: { field: yField, type: determineType(yField) },
      color: {
        field: "label",
        type: "nominal",
        scale: {
          domain: [0, 1], // Specify the label values
          range: ["red", "green"], // Corresponding colors
        },
        legend: { title: "Label" },
      },
      tooltip: [
        { field: xField, type: "nominal" },
        { field: yField, type: "nominal" },
        { field: "label", type: "nominal", title: "Label" },
      ],
      opacity: {
        condition: { param: "industry", value: 1 },
        value: 0.01,
      },
    },
  } as VisualizationSpec
  return (
    <ResponsiveCardVegaLite
      title={`Scatter Plot for ${name}`}
      details={"Todo"}
      spec={spec}
      actions={false}
      minWidth={100}
      minHeight={100}
      maxHeight={400}
      maxWidth={2000}
      aspectRatio={2 / 1}
      infoMessage={<Loader/>}
      
      showInfoMessage={loader}
      controlPanel={
         <Box sx={{ flexGrow: 1, padding: 2 }}>
      <Grid container spacing={2}>
        {/* X-Axis Field */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>X-Axis</InputLabel>
            <Select
              value={xField}
              label="X-Axis"
              onChange={e => setXField(e.target.value)}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 250,
                    maxWidth: 300,
                  },
                },
              }}
            >
              {fields.map(field => (
                <MenuItem key={field} value={field}>
                  {field}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Y-Axis Field */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Y-Axis</InputLabel>
            <Select
              value={yField}
              label="Y-Axis"
              onChange={e => setYField(e.target.value)}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 250,
                    maxWidth: 300,
                  },
                },
              }}
            >
              {fields.map(field => (
                <MenuItem key={field} value={field}>
                  {field}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Additional Controls (like buttons, extra filters) */}
        {controlPanel && (
          <Grid item xs={12}>
            {controlPanel}
          </Grid>
        )}
      </Grid>
    </Box>
      }
      isStatic={false}
    />
  )
}

export default ScatterPlotComponentForMainPage
