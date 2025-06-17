import type React from "react";
import { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store/store";
import { useAppDispatch } from "../../../../store/store";
import {
  fetchAvailableFeatures,
  fetchGetData,
  fetchTargetName,
  setSelectedDataset,
  setSelectedModel,
  uploadDataset,
  uploadModel,
  uploadTestDataset,
} from "../../../../store/slices/glanceSlice";
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
  Stack,
} from "@mui/material";

interface UploadComponentProps {
  onUploadComplete?: (type: 'dataset' | 'model', name: string) => void;
}

const UploadComponent: React.FC<UploadComponentProps> = ({ onUploadComplete }) => {
  const dispatch = useAppDispatch();
  const [fileDataset, setFileDataset] = useState<File | null>(null);
  const [fileModel, setFileModel] = useState<File | null>(null);
  const [fileTest, setFileTest] = useState<File | null>(null);
  const [target, setTarget] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const error = useSelector((state: RootState) => state.glance.error);

  // Handle file selection for dataset, model, and test dataset
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (e.target.files) {
      switch (type) {
        case "dataset":
          setFileDataset(e.target.files[0]);
          break;
        case "model":
          setFileModel(e.target.files[0]);
          break;
        case "test":
          setFileTest(e.target.files[0]);
          break;
        default:
          break;
      }
    }
  };
  const removeFileExtension = (filename: string): string => {
    return filename.slice(0, filename.lastIndexOf('.')) || filename;
  };
  // Handle input for target value
  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTarget(e.target.value);
  };

  // Handle upload
  const handleUpload = async () => {
    setLoading(true);
    try {
      // Upload dataset if selected
      if (fileDataset) {
        await dispatch(uploadDataset(fileDataset));
        if (onUploadComplete) {
          onUploadComplete('dataset', removeFileExtension(fileDataset.name)); // Notify parent of the uploaded dataset
        }
      }

      // Upload model if selected
      if (fileModel) {
        await dispatch(uploadModel(fileModel));
        if (onUploadComplete) {
          onUploadComplete('model', removeFileExtension(fileModel.name)); // Notify parent of the uploaded model
        }
      }

      // Upload test dataset if selected
      if (fileTest) {
        await dispatch(uploadTestDataset(fileTest));
      }

      // Upload target value
      if (target.trim() !== "") {
        await dispatch(fetchTargetName(target));
      }

      // Fetch data after uploading everything
      await dispatch(fetchGetData());
      await dispatch(fetchAvailableFeatures());
      dispatch(setSelectedDataset(removeFileExtension(fileDataset?.name || "")));
      dispatch(setSelectedModel(removeFileExtension(fileModel?.name || "")));

      setStatusMessage("All uploads and data fetch completed successfully!");
    } catch (err) {
      console.error("Error during upload:", err);
      setStatusMessage("An error occurred during upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
    >
      <Stack spacing={2} sx={{ width: "100%" }}>
        <Box>
          <Typography variant="body1">Upload Dataset:</Typography>
          <TextField
            type="file"
            fullWidth
            onChange={(e) => handleFileChange(e, "dataset")}
            sx={{ marginBottom: 2 }}
          />
        </Box>
        <Box>
          <Typography variant="body1">Upload Model:</Typography>
          <TextField
            type="file"
            fullWidth
            onChange={(e) => handleFileChange(e, "model")}
            sx={{ marginBottom: 2 }}
          />
        </Box>
        <Box>
          <Typography variant="body1">Upload Test Dataset:</Typography>
          <TextField
            type="file"
            fullWidth
            onChange={(e) => handleFileChange(e, "test")}
            sx={{ marginBottom: 2 }}
          />
        </Box>
        <Box>
          <Typography variant="body1">Target Value:</Typography>
          <TextField
            value={target}
            onChange={handleTargetChange}
            fullWidth
            variant="outlined"
            sx={{ marginBottom: 2 }}
          />
        </Box>
      </Stack>
      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        disabled={loading}
        sx={{ width: "100%" }}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          "Upload and Get Data"
        )}
      </Button>
      {statusMessage && (
        <Typography variant="body2" color="green" sx={{ marginTop: 2 }}>
          {statusMessage}
        </Typography>
      )}
      {error && (
        <Typography variant="body2" color="error" sx={{ marginTop: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default UploadComponent;
