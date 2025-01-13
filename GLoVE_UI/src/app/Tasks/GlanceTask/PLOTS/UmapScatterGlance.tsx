

import React from 'react'
import { VisualizationSpec } from 'react-vega';
import ResponsiveVegaLite from '../../../../shared/components/responsive-vegalite';


interface ScatterPlotProps {
  data: any; // The data you want to plot
  actions: any | null;
  name: string;
  color: string;
}


const UmapScatterGlance: React.FC<ScatterPlotProps> = ({ data, color, actions, name }) => {

  const reshapedData = Object.keys(data[Object.keys(data)[0]]).map((key, index) => {
    const reshapedObject = Object.keys(data).reduce((acc, curr) => {
      acc[curr] = data[curr][index];
      return acc;
    }, {} as { [key: string]: any });


    // Add the Chosen_Action key only if actions exist, otherwise use a default or null value
    reshapedObject['Chosen_Action'] = actions ? actions[index] || "-" : "-";

    return reshapedObject;
  });


  const scatterPlotSpec = {

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
        fields: ['Chosen_Action'], // Field for legend interaction
        bind: 'legend',           // Bind selection to the legend
      },
    },
    encoding: {
      x: { field: "0", type: "quantitative", title: "Component 0" },
      y: { field: "1", type: "quantitative", title: "Component 1" },
      color: {
        field: "Chosen_Action",
        type: "nominal",
        title: "Chosen Action",
      },
      tooltip: [
        { field: "0", type: "quantitative", title: "Component 0", format: ".2f" },
        { field: "1", type: "quantitative", title: "Component 1", format: ".2f" },
        { field: "Chosen_Action", type: "nominal", title: "Chosen Action" },
      ],
      opacity: {
        condition: { param: "industry", value: 1 }, // Full opacity for selected points
        value: 0.1, // Dim non-selected points
      },
    },
    data: {
      values: reshapedData, // Provide reshaped data
    },
  } as VisualizationSpec;

  return (

    <>
      <ResponsiveVegaLite
        spec={scatterPlotSpec}
        actions={false}
        minWidth={100}
        minHeight={100}
        maxHeight={500}
        maxWidth={700}
        aspectRatio={1}
      />
    </>


  );
};

export default UmapScatterGlance;

