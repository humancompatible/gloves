// import type React from "react";
// import { useState } from "react";
// import { useAppSelector, useAppDispatch } from "../../../../store/store";
// import { fetchAvailableFeatures, loadDatasetAndModel } from "../../../../store/slices/glanceSlice";
// import type {
//   SelectChangeEvent} from "@mui/material";
// import {
//   Select,
//   MenuItem,
//   Box,
//   FormControl,
//   InputLabel,
//   OutlinedInput,
//   Typography,
//   CircularProgress
// } from "@mui/material";
// import ResponsiveCardTable from "../../../../shared/components/responsive-card-table";

// interface DataModelSetupProps {
//   selectedDataset: string;
//   setSelectedDataset: React.Dispatch<React.SetStateAction<string>>;
//   selectedModel: string;
//   setSelectedModel: React.Dispatch<React.SetStateAction<string>>;
// }

// const DataModelSetup: React.FC<DataModelSetupProps> = ({
//   selectedDataset,
//   setSelectedDataset,
//   selectedModel,
//   setSelectedModel,
// }) => {
//   const dispatch = useAppDispatch();
//   const availableResources = useAppSelector((state) => state.glance.availableResources);
//   const datasetLoading = useAppSelector((state) => state.glance.datasetLoading);

//   const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

//   const datasetMap: { [key: string]: string } = {
//     "COMPAS Dataset": "compas",
//     "Default Credit Dataset": "default_credit",
//     "German Credit Dataset": "german_credit",
//     "Heloc Dataset": "heloc",
//   };

//   const modelMap: { [key: string]: string } = {
//     "XGBoost": "xgb",
//     "DNN": "dnn",
//     "LogisticRegression": "lr",
//   };

//   const handleLoad = (newDataset: string, newModel: string) => {
//     if (newDataset && newModel) {
//       const datasetParam = datasetMap[newDataset];
//       const modelParam = modelMap[newModel];
//       setTimeout(() => {
//         dispatch(loadDatasetAndModel({ dataset_name: datasetParam, model_name: modelParam }))
//           .unwrap()
//           .then(() => {
//             dispatch(fetchAvailableFeatures());
//           })
//           .catch((err) => {
//             console.error("Failed to load dataset and model:", err);
//           });
//       }, 2500);
//     }
//   };

//   const handleDatasetChange = (e: SelectChangeEvent<string>) => {
//     const newDataset = e.target.value as string;
//     if (newDataset === "Upload a new dataset…") {
//       setIsUploadModalOpen(true);
//     } else {
//       setSelectedDataset(newDataset);
//       handleLoad(newDataset, selectedModel);
//     }
//   };

//   const handleModelChange = (e: SelectChangeEvent<string>) => {
//     const newModel = e.target.value as string;
//     setSelectedModel(newModel);
//     handleLoad(selectedDataset, newModel);
//   };

//   // Callback to handle when a new dataset or model is uploaded
//   const handleUploadComplete = (type: 'dataset' | 'model', name: string) => {
//     if (type === 'dataset') {
//       setSelectedDataset(name);
//     } else if (type === 'model') {
//       setSelectedModel(name);
//     }
//     setIsUploadModalOpen(false);
//   };

//   return (
//       <ResponsiveCardTable 
//       title={"Dataset & Model Selection"} 
//       details={"This section allows you to select a dataset and model for analysis."}
      
//       >
//         {datasetLoading ? (
//           <Box
//             display="flex"
//             justifyContent="center"
//             alignItems="center"
//             height="300px"
//           >
//             <CircularProgress size={50} />
//             <Typography variant="h6" sx={{ marginLeft: 2 }}>
//               Fetching Data...
//             </Typography>
//           </Box>
//         ) : (
//           <>
//             <FormControl fullWidth sx={{ marginTop: 2 }}>
//               <InputLabel id="dataset-select-label">Select Dataset</InputLabel>
//               <Box display="flex" alignItems="center" gap={1}>
//                 <Select
//                   labelId="dataset-select-label"
//                   value={selectedDataset}
//                   input={<OutlinedInput label="Select Dataset" />}
//                   onChange={handleDatasetChange}
//                   displayEmpty
//                   sx={{ flex: 1 }}
//                 >
//                   {availableResources.datasets.map((dataset) => (
//                     <MenuItem key={dataset} value={dataset}>{dataset}</MenuItem>
//                   ))}
//                   <MenuItem value="Upload a new dataset…" divider>
//                     <em>Upload a new dataset…</em>
//                   </MenuItem>
//                 </Select>
//               </Box>
//             </FormControl>

//             <FormControl fullWidth sx={{ marginTop: 2 }}>
//               <InputLabel id="model-select-label">Select Model</InputLabel>
//               <Select
//                 labelId="model-select-label"
//                 input={<OutlinedInput label="Select Model" />}
//                 value={selectedModel}
//                 onChange={handleModelChange}
//                 displayEmpty
//                 sx={{ width: '100%' }}
//               >
//                 {availableResources.models.map((model) => (
//                   <MenuItem key={model} value={model}>{model}</MenuItem>
//                 ))}
//               </Select>
//             </FormControl>
//           </>
//         )}
//       </ResponsiveCardTable>

//     //   {/* Modal for uploading new dataset and model */}
//     //   <Modal
//     //     open={isUploadModalOpen}
//     //     onClose={() => setIsUploadModalOpen(false)}
//     //     aria-labelledby="upload-modal-title"
//     //     aria-describedby="upload-modal-description"
//     //   >
//     //     <Box sx={styles.modalStyle}>

//     //       <UploadComponent onUploadComplete={handleUploadComplete} />
//     //       <Stack direction="row" justifyContent="center" sx={{ marginTop: 2 }}>
//     //         <Button onClick={() => setIsUploadModalOpen(false)}>Close</Button>
//     //       </Stack>
//     //     </Box>
//     //   </Modal>
//     // </Box>
//   );
// };

// // Example styles for modal
// const styles = {
//   modalStyle: {
//     position: 'absolute' as 'absolute',
//     top: '50%',
//     left: '50%',
//     transform: 'translate(-50%, -50%)',
//     width: '90%', // Use a percentage or a fixed value
//     maxWidth: 600, // Set a max-width for larger screens
//     bgcolor: 'background.paper',
//     border: '2px solid #000',
//     boxShadow: 24,
//     p: 4,
//     overflow: 'hidden', // Prevent scrolling
//     display: 'flex',
//     flexDirection: 'column',
//     alignItems: 'center',
//     justifyContent: 'center',
//     height: 'auto', // Adjust height as needed
//     maxHeight: '90vh', // Ensure modal height is responsive and doesn't overflow vertically
//   },
// };

// export default DataModelSetup;


import type React from "react";
import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../../store/store";
import { fetchAvailableFeatures, loadDatasetAndModel, setSelectedDataset, setSelectedModel } from "../../../../store/slices/glanceSlice";
import type { SelectChangeEvent } from "@mui/material";
import {
  Select,
  MenuItem,
  Box,
  FormControl,
  InputLabel,
  OutlinedInput,
  Typography,
  CircularProgress,
  Dialog,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import ResponsiveCardTable from "../../../../shared/components/responsive-card-table";
import Loader from "../../../../shared/components/loader";
import UploadComponent from "./UploadComponent";

const DataModelSetup: React.FC = () => {
  const dispatch = useAppDispatch();
  const availableResources = useAppSelector((state) => state.glance.availableResources);
  const datasetLoading = useAppSelector((state) => state.glance.datasetLoading);
  const selectedDataset = useAppSelector((state) => state.glance.selectedDataset);
  const selectedModel = useAppSelector((state) => state.glance.selectedModel);
  const comparativeLoading= useAppSelector((state)=> state.glance.comparativeLoading);

  

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Maps from user-friendly names to API parameters
  const datasetMap: { [key: string]: string } = {
    "COMPAS Dataset": "compas",
    "Default Credit Dataset": "default_credit",
    "German Credit Dataset": "german_credit",
    "Heloc Dataset": "heloc",
  };

  const modelMap: { [key: string]: string } = {
    "XGBoost": "xgb",
    "DNN": "dnn",
    "LogisticRegression": "lr",
  };

  const handleLoad = (newDataset: string, newModel: string) => {
    if (newDataset && newModel) {
      const datasetParam = datasetMap[newDataset];
      const modelParam = modelMap[newModel];
      setTimeout(() => {
        dispatch(loadDatasetAndModel({ dataset_name: datasetParam, model_name: modelParam }))
          .unwrap()
          .then(() => {
            dispatch(fetchAvailableFeatures());
          })
          .catch((err) => {
            console.error("Failed to load dataset and model:", err);
          });
      }, 2500);
    }
  };

  const handleDatasetChange = (e: SelectChangeEvent<string>) => {
    const newDataset = e.target.value;
    if (newDataset === "Upload a new dataset…") {
      setIsUploadModalOpen(true);
    } else {
      dispatch(setSelectedDataset(newDataset));
      handleLoad(newDataset, selectedModel || "");
    }
  };

  const handleModelChange = (e: SelectChangeEvent<string>) => {
    const newModel = e.target.value;
    dispatch(setSelectedModel(newModel));
    handleLoad(selectedDataset || "", newModel);
  };

  

  return (
   
    
    <ResponsiveCardTable
      title={"Dataset & Model Selection"}
      details={"This section allows you to select a dataset and model for analysis."}
    showFullScreenButton={false}
    showOptions={false}
    >

      {datasetLoading||comparativeLoading ? (
        <Loader/>
      ) : (
        <>
          <FormControl fullWidth sx={{ marginTop: 2 }}>
            <InputLabel id="dataset-select-label">Select Dataset</InputLabel>
            <Box display="flex" alignItems="center" gap={1}>
              <Select
                labelId="dataset-select-label"
                value={selectedDataset || ""}
                input={<OutlinedInput label="Select Dataset" />}
                onChange={handleDatasetChange}
                displayEmpty
                sx={{ flex: 1 }}
              >
                {availableResources.datasets.map((dataset) => (
                  <MenuItem key={dataset} value={dataset}>
                    {dataset}
                  </MenuItem>
                ))}
                <MenuItem value="Upload a new dataset…" divider>
                  <em>Upload a new dataset…</em>
                </MenuItem>
              </Select>
            </Box>
          </FormControl>

          <FormControl fullWidth sx={{ marginTop: 2,mb:2 }}>
            <InputLabel id="model-select-label">Select Model</InputLabel>
            <Select
              labelId="model-select-label"
              input={<OutlinedInput label="Select Model" />}
              value={selectedModel || ""}
              onChange={handleModelChange}
              displayEmpty
              sx={{ width: "100%" }}
            >
              {availableResources.models.map((model) => (
                <MenuItem key={model} value={model}>
                  {model}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
         <Dialog open={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} fullWidth maxWidth="sm">
        
        <DialogContent>
          <UploadComponent />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsUploadModalOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

        </>
      )}
    </ResponsiveCardTable>
  );
};

export default DataModelSetup;
