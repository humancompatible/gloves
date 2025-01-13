

import React from 'react'
import { VisualizationSpec } from 'react-vega';
import { Box, Paper } from '@mui/material';
import ResponsiveVegaLite from '../../../../shared/components/responsive-vegalite';




interface ScatterPlotProps {
  data: any; // The data you want to plot
  color: string;
}

const UmapScatter: React.FC<ScatterPlotProps> = ({ data, color }) => {

  const hasLabel = Object.keys(data).includes("label");
  const processedData = { ...data };

  if (!hasLabel) {
    processedData.label = Array(Object.keys(data[Object.keys(data)[0]]).length).fill(0);
  }

  const reshapedData = Object.keys(processedData[Object.keys(processedData)[0]]).map((key, index) => {
    return Object.keys(processedData).reduce((acc, curr) => {
      acc[curr] = processedData[curr][index];
      return acc;
    }, {} as { [key: string]: any });
  });



  // Define the Vega-Lite scatter plot specification
  const scatterPlotSpec = {
    width: 1000,
    height: 400,
    mark: 'point',
    selection: {
      // Interval selection for zoom and pan
      grid: {
        type: 'interval',
        bind: 'scales', // Enable zoom/pan
      },
      // Point selection for legend interaction
      industry: {
        type: 'point',
        fields: ['label'], // Field for legend interaction
        bind: 'legend',           // Bind selection to the legend
      },
    },

    encoding: {
      x: { field: "0", type: "quantitative", title: "Component 0", format: '.3f' },
      y: { field: "1", type: "quantitative", title: "Component 1", format: '.3f' }, // Use 'value' for y-axis encoding
      // color: { field: color, type: 'nominal' }, // Different color for each selected y-axis field

      color: {
        field: "label",
        type: 'nominal',
        scale: {
          domain: [0, 1], // Define label values
          range: ['red', 'green'], // Assign corresponding colors
        },
        legend: { title: "Label" }, // Optional: Set legend title dynamically
      },


      tooltip: [
        { field: "0", type: 'nominal' },
        { field: "1", type: 'nominal' },
        { field: "label", type: 'nominal' },




      ],
      opacity: {
        condition: { "param": "industry", "value": 1 },
        value: 0.01
      }
    },
    data: {
      values: reshapedData, // Provide reshaped data for plotting multiple y-axis fields on the same chart
    },


  } as VisualizationSpec;


  return (

    < Paper>

      <Box display="flex" justifyContent="center">
        <ResponsiveVegaLite
          spec={scatterPlotSpec}
          actions={false}
          minWidth={100} 
          minHeight={100} 
          maxHeight={400} 
          maxWidth={1500} 
          aspectRatio={2/1}

        />
      </Box>

    </Paper>
  );
};

export default UmapScatter;
