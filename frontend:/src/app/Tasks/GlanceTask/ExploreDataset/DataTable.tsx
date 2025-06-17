import type React from "react";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import { ArrowDropUp, ArrowDropDown } from "@mui/icons-material";

interface DataTableProps {
  title: string;
  data: any[];
  showArrow: boolean; // New parameter to toggle arrows
}

const DataTable: React.FC<DataTableProps> = ({ title, data, showArrow }) => {
  // Function to dynamically generate columns based on the data keys
  const getColumns = (data: any[]): GridColDef[] => {
    let processedData = data;
    let hasLabelColumn = false;

    // Check if "label" column exists, if not, add it
    if (data.length > 0) {
      hasLabelColumn = Object.keys(data[0]).includes("label");
      if (!hasLabelColumn) {
        processedData = data.map((row) => ({ ...row, label: 0 }));
      }
    }

    const keys = Object.keys(processedData[0]).filter((key) => key !== "index");

    // Ensure "label" is the first column if it exists
    const sortedKeys = ["label", ...keys.filter((key) => key !== "label")];

    return sortedKeys.map((key) => ({
      field: key,
      headerName: key.charAt(0).toUpperCase() + key.slice(1),
      width: 150,
      renderCell: (params) => {
        if (key === "label") {
          // Style the "label" column
          const cellStyle = {
            backgroundColor: params.value === 0 ? "lightcoral" : "lightgreen",
            color: "#000", // Text color, adjust as needed
            padding: "8px",
          };

          return (
            <div style={cellStyle}>
              {params.value}
            </div>
          );
        }

        if (showArrow && typeof params.value === "number") {
          return (
            <div style={{ display: "flex", alignItems: "center" }}>
              {params.value}
              {params.value > 0 ? (
                <ArrowDropUp style={{ color: "green" }} />
              ) : params.value < 0 ? (
                <ArrowDropDown style={{ color: "red" }} />
              ) : null}
            </div>
          );
        }

        return params.value; // Default rendering for other columns
      },
    }));
  };

  // Add a fallback for empty data
  const processedData = data.length > 0
    ? (!Object.keys(data[0]).includes("label")
      ? data.map((row) => ({ ...row, label: 0 }))
      : data
    )
    : [];

  return (
    <>
      <DataGrid
        rows={processedData.map((item, index) => ({ id: index, ...item }))}
        disableRowSelectionOnClick
        columns={getColumns(processedData)}
        autoHeight
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
    </>
  );
};

export default DataTable;
