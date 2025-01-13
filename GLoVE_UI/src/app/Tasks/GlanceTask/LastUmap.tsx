import React, { useState } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Paper, Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import WorkflowCard from '../../../shared/components/workflow-card';
import ResponsiveVegaLite from '../../../shared/components/responsive-vegalite';

interface ScatterPlotProps {
  data: any; // The data you want to plot
  actions: any | null; // The actions to be plotted
  name: string;
  eff_cost_actions: any
}

const LastUmap: React.FC<ScatterPlotProps> = ({ data, actions, name, eff_cost_actions }) => {
  // State to store selected action
  const [selectedAction, setSelectedAction] = useState<string>('Action1_Prediction');

  // Flatten the data based on the selected action
  const formattedData = Object.keys(data[0]).map((key) => ({
    x: data[0][key], // First dimension (e.g., X-axis)
    y: data[1][key], // Second dimension (e.g., Y-axis)
    [selectedAction]: actions.find((action: any) => action.key === selectedAction)?.value[key],
  }));

  const tableRows = Object.keys(eff_cost_actions).map((key) => ({
    id: key,
    eff: (eff_cost_actions[key].eff * 100).toFixed(2),
    cost: (eff_cost_actions[key].cost).toFixed(2),
  }));

  const tableColumns = [
    { field: 'id', headerName: 'Action', flex: 1 },
    { field: 'eff', headerName: 'Effectiveness %', flex: 1, },
    { field: 'cost', headerName: 'Cost', flex: 1 },
  ];

  // Vega-Lite specification
  const spec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    description: "A scatter plot with tooltips",

    selection: {
      // Interval selection for zoom and pan
      grid: {
        type: 'interval',
        bind: 'scales', // Enable zoom/pan
      },
      // Point selection for legend interaction
      industry: {
        type: 'point',
        fields: [selectedAction], // Field for legend interaction
        bind: 'legend',           // Bind selection to the legend
      },
    },
    data: {
      values: formattedData,
    },
    mark: "point",
    encoding: {
      x: {
        field: "x",
        type: "quantitative",
        title: "Component 0",
      },
      y: {
        field: "y",
        type: "quantitative",
        title: "Component 1",
      },
      color: {
        field: selectedAction,
        type: "nominal",
        title: "Prediction",
        scale: {
          domain: [0, 1], // Define label values
          range: ['red', 'green'], // Assign corresponding colors
        },

      },
      tooltip: [
        { field: "x", type: "quantitative", title: "Component 0" },
        { field: "y", type: "quantitative", title: "Component 1" },
        { field: selectedAction, type: "nominal", title: selectedAction },
      ],
      opacity: {
        condition: { param: "industry", value: 1 }, // Full opacity for selected points
        value: 0.1, // Dim non-selected points
      },
    },
  };

  // Handle selection change in the dropdown
  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedAction(event.target.value as string);
  };

  return (
    <Paper>



      <Box className="panel" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>

        <Box width="100%" minWidth="100px">
          <DataGrid
            rows={tableRows}
            columns={tableColumns}
            autoHeight
            disableColumnMenu
            sx={{ marginTop: 1 }}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 5,
                },
              }
            }
            }
            pageSizeOptions={[5, 10]}
          />
        </Box>
      </Box>

        <FormControl fullWidth margin="normal">
          <InputLabel id="select-action-label">Apply</InputLabel>
          <Select
            labelId="select-action-label"
            value={selectedAction}
            onChange={handleChange}
            label="Apply"
          >
            {/* Dynamically create dropdown options from actions */}
            {actions.map((action: any) => {
              // Extract the number from the key dynamically
              const displayText = action.key.replace(/^Action(\d+)_Prediction$/, 'Action$1');

              return (
                <MenuItem key={action.key} value={action.key}>
                  {displayText}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        <ResponsiveVegaLite spec={spec} minWidth={100} minHeight={100} maxHeight={400} maxWidth={1200} aspectRatio={2/1} actions={false} />
    </Paper>
  );
};

export default LastUmap;
