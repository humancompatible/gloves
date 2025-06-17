import type React from "react";
import {
  Box,
  CircularProgress,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import DataTable from "./DataTable";
import ResponsiveCardTable from "../../../../shared/components/responsive-card-table";
import { useAppSelector, useAppDispatch } from "../../../../store/store";
import { setViewOption } from "../../../../store/slices/glanceSlice";
import Loader from "../../../../shared/components/loader";
interface DatasetExplorerProps {
  renderScatterPlot: any
}

const DatasetExplorer: React.FC<DatasetExplorerProps> = ({ renderScatterPlot }) => {
  

  const dispatch = useAppDispatch();

  // Select from Redux
  const glanceState = useAppSelector((state) => state.glance);
  const selectedDataset = glanceState.selectedDataset;
  const selectedModel = glanceState.selectedModel;
  const viewOption = glanceState.viewOption; // You need to add this to your slice
  const showUMAPScatter = glanceState.showUMAPScatter; // Add to slice

  const hasData =
    viewOption === "affected"
      ? glanceState.loadDatasetAndModelResult?.affected
      : glanceState.loadDatasetAndModelResult?.X_test;

  const tableTitle = viewOption === "affected" ? "Affected Test Data" : "Test Data";
  const cardTitle = `${viewOption === "affected" ? "Affected" : "Test"} Data for ${selectedDataset} with ${selectedModel} model`;
  const description =
    viewOption === "affected"
      ? "Instances from the test dataset where the model's prediction was equal to 0."
      : "A subset of the dataset used to evaluate model performance on unseen data.";

 

  if (!hasData) return null;

  const handleViewOptionChange = (event: React.MouseEvent<HTMLElement>, newValue: string | null) => {
    if (newValue !== null) {
      dispatch(setViewOption(newValue));
    }
  };


  return (
    <>
      <ResponsiveCardTable
        title={cardTitle}
        showControlsInHeader
        details={description}
        showFullScreenButton={false}
        controlPanel={
          <Box display="flex" alignItems="center" gap={2} width="100%">
            <ToggleButtonGroup
              value={viewOption}
              exclusive
              onChange={handleViewOptionChange}
              color="primary"
              size="small"
              sx={{ flex: 1 }}
            >
              <ToggleButton value="affected" sx={{ fontWeight: "bold" }}>
                Affected Data
              </ToggleButton>
              <ToggleButton value="test" sx={{ fontWeight: "bold" }}>
                Test Data
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

        }
        
      >
      
        {
          glanceState.datasetLoading ? (
            <Loader/>
          ) : (
            <DataTable title={tableTitle} data={hasData} showArrow={false} />)
          
        }
              

       
      </ResponsiveCardTable>

      
      
      <Box mt={2}>{renderScatterPlot}</Box>
    </>
  );
};

export default DatasetExplorer;
