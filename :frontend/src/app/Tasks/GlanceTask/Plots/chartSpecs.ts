// chartSpecs.ts

import type { VisualizationSpec } from "react-vega";

interface VegaLiteSpec {
  [key: string]: any; // You can replace this with the actual VegaLiteSpec type if available
}

export const getCostEffectivenessChartSpec = (scatterPlotData: any[], executionMode: string): VegaLiteSpec => ({
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  data: { values: scatterPlotData },
  transform: [
    {
      calculate: "datum.TotalEffectiveness * 100",
      as: "ScaledEffectiveness",
    },
  ],
  mark: "point",
  encoding: {
    x: { field: "TotalCost", type: "quantitative", title: "Total Cost" },
    y: {
      field: "ScaledEffectiveness",
      type: "quantitative",
      title: "Total Effectiveness (%)",
    },
    color: { field: "DisplayKey", type: "nominal", title: executionMode },
    tooltip: [
      { field: "TotalCost", type: "quantitative", title: "Total Cost" },
      {
        field: "ScaledEffectiveness",
        type: "quantitative",
        title: "Total Effectiveness (%)",
      },
      { field: "DisplayKey", type: "nominal", title: executionMode },
    ],
  },
});

export const getCostChartSpec = (scatterPlotData: any[], executionMode: string): VegaLiteSpec => ({
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  data: { values: scatterPlotData },
  transform: [
    {
      calculate: "datum.TotalEffectiveness * 100",
      as: "ScaledEffectiveness",
    },
  ],
  mark: "bar",
  encoding: {
    y: { field: "TotalCost", type: "quantitative", title: "Total Cost" },
    x: { field: "DisplayKey", type: "nominal", title: executionMode },
    tooltip: [
      { field: "TotalCost", type: "quantitative", title: "Total Cost" },
      {
        field: "ScaledEffectiveness",
        type: "quantitative",
        title: "Total Effectiveness (%)",
      },
      { field: "DisplayKey", type: "nominal", title: executionMode },
    ],
  },
});

export const getEffectivenessChartSpec = (scatterPlotData: any[], executionMode: string): VegaLiteSpec => ({
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  data: { values: scatterPlotData },
  transform: [
    {
      calculate: "datum.TotalEffectiveness * 100",
      as: "ScaledEffectiveness",
    },
  ],
  mark: "bar",
  encoding: {
    y: {
      field: "ScaledEffectiveness",
      type: "quantitative",
      title: "Total Effectiveness (%)",
    },
    x: { field: "DisplayKey", type: "nominal", title: executionMode },
    tooltip: [
      { field: "TotalCost", type: "quantitative", title: "Total Cost" },
      {
        field: "ScaledEffectiveness",
        type: "quantitative",
        title: "Total Effectiveness (%)",
      },
      { field: "DisplayKey", type: "nominal", title: executionMode },
    ],
  },
});


export const getCompareMethodsChartSpec=(allData:any): VegaLiteSpec => ({
   $schema: "https://vega.github.io/schema/vega-lite/v5.json",
   width:"container",
    mark: { type: "line", point: true, interpolate: "step-after" },
    selection: {
      // Interval selection for zoom and pan
     
      // Point selection for legend interaction
      industry: {
        type: 'point',
        fields: ['run'], // Field for legend interaction
        bind: 'legend',           // Bind selection to the legend
      },
    },
    encoding: {
      y: {
        field: "eff",
        type: "quantitative",
        title: "Effectiveness", // X-axis is now effectiveness
      },
      x: {
        field: "cost",
        type: "quantitative",
        title: "Cost", // Y-axis is now cost
      },
      color: {
        field: "run",
        type: "nominal",
        title: "Method",
      },
      opacity: {
        condition: { "param": "industry", "value": 1 },
        value: 0.01
      },
       tooltip: [
      { field: "run", title: "Method" },
      { field: "eff", title: "Effectiveness" },
      { field: "cost", title: "Cost" },
      { field: "step", title: "Step" }, // if available
    ],
    },
   
    data: { values: allData },
  });
  


  export const getExploreDatasetUmapPlotSpec=(reshapedData:any): VegaLiteSpec => ({
   mark: "point",
    selection: {
      // Interval selection for zoom and pan
      grid: {
        type: "interval",
        bind: "scales", // Enable zoom/pan
      },
      // Point selection for legend interaction
      industry: {
        type: "point",
        fields: ["label"], // Field for legend interaction
        bind: "legend", // Bind selection to the legend
      },
    },

    encoding: {
      x: {
        field: "0",
        type: "quantitative",
        title: "Component 0",
        format: ".3f",
      },
      y: {
        field: "1",
        type: "quantitative",
        title: "Component 1",
        format: ".3f",
      }, // Use 'value' for y-axis encoding
      // color: { field: color, type: 'nominal' }, // Different color for each selected y-axis field

      color: {
        field: "label",
        type: "nominal",
        scale: {
          domain: [0, 1], // Define label values
          range: ["red", "green"], // Assign corresponding colors
        },
        legend: { title: "Label" }, // Optional: Set legend title dynamically
      },

      tooltip: [
        { field: "0", type: "nominal" },
        { field: "1", type: "nominal" },
        { field: "label", type: "nominal" },
      ],
      opacity: {
        condition: { param: "industry", value: 1 },
        value: 0.01,
      },
    },
    data: {
      values: reshapedData, // Provide reshaped data for plotting multiple y-axis fields on the same chart
    },
  });
  






export const getAnalyzeCounterFactualsApplyActionChartSpec = (
  data: { id: string }[],
  xAxis: string,
  yAxis: string,
  colorField: string
): VisualizationSpec => ({
  description: "A scatter plot of affected clusters",
  mark: "circle",
  encoding: {
    x: { field: xAxis, type: determineType(xAxis, data) },
    y: { field: yAxis, type: determineType(yAxis, data) },
    color: {
      field: colorField,
      type: "nominal",
      scale: {
        domain: [0, 1],
        range: ["red", "green"],
      },
      title: "Prediction",
    },
    tooltip: [
      { field: xAxis, type: "nominal" },
      { field: yAxis, type: "nominal" },
      { field: colorField, type: "nominal" },
    ],
  },
  data: { values: data },
});

// Helper function to determine type
export const determineType = (field: string, data: any[]) => {
  if (!data.length || data[0][field] === undefined) return "nominal";
  return typeof data[0][field] === "string" ? "ordinal" : "quantitative";
};

export const getAnalyzeCounterFactualsSharedLegendChartSpec = (
  data1: any[],
  xAxis: string,
  yAxis: string
): VisualizationSpec => ({
  description: "Two scatter plots with a shared legend",
   title: "Action Selection",
      width: 350,
      height: 500,
      data: { values: data1 },
      mark: { type: "circle", opacity: 0.8 },
      params: [
        {
          name: "industry",
          select: { type: "point", fields: ["Chosen_Action"] },
          bind: "legend",
        },
      ],
      encoding: {
        x: { field: xAxis, type: determineType(xAxis, data1) },
        y: { field: yAxis, type: determineType(yAxis, data1) },
        color: {
          field: "Chosen_Action",
          type: "nominal",
          title: "Chosen Action",
        },
        tooltip: [
          { field: "Chosen_Action", type: "nominal", title: "Chosen Action" },
          { field: xAxis, type: determineType(xAxis, data1) },
          { field: yAxis, type: determineType(yAxis, data1) },
        ],
        opacity: {
          condition: { param: "industry", value: 1 },
          value: 0.01,
        },
      },
  
});


// shared/utils/chartSpec.ts

// Basic scatter plot generator with legend binding
export const getAnalyzeCounterFactualsUmapSharedLegendChartSpec = (
  data: any[],
  title?: string
): VisualizationSpec => ({
  mark: "point",
  title: title || "",
  width: 350,
  height: 500,
  selection: {
    grid: { type: "interval", bind: "scales" },
    industry: { type: "point", fields: ["Chosen_Action"], bind: "legend" },
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
      { field: "0", type: "quantitative", title: "Component 0" },
      { field: "1", type: "quantitative", title: "Component 1" },
      { field: "Chosen_Action", type: "nominal", title: "Chosen Action" },
    ],
    opacity: {
      condition: { param: "industry", value: 1 },
      value: 0.1,
    },
  },
  data: { values: data },
});

// Prediction-based scatter plot
export const getAnalyzeCounterFactualsUmapApplyActionChartSpec = (
  data: any[],
  selectedAction: string
): VisualizationSpec => ({
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  description: "A scatter plot with tooltips",
  selection: {
    grid: {
      type: "interval",
      bind: "scales",
    },
    industry: {
      type: "point",
      fields: [selectedAction],
      bind: "legend",
    },
  },
  data: {
    values: data,
  },
  mark: "point",
  encoding: {
    x: { field: "x", type: "quantitative", title: "Component 0" },
    y: { field: "y", type: "quantitative", title: "Component 1" },
    color: {
      field: selectedAction,
      type: "nominal",
      title: "Prediction",
      scale: {
        domain: [0, 1],
        range: ["red", "green"],
      },
    },
    tooltip: [
      { field: "x", type: "quantitative", title: "Component 0" },
      { field: "y", type: "quantitative", title: "Component 1" },
      { field: selectedAction, type: "nominal", title: selectedAction },
    ],
    opacity: {
      condition: { param: "industry", value: 1 },
      value: 0.1,
    },
  },
});
