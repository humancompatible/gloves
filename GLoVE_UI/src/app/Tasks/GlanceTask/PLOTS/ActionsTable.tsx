import React from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Box, Typography } from "@mui/material";
import { ArrowDropUp, ArrowDropDown } from "@mui/icons-material";

interface DataTableProps {
  title: string;
  data: any[];
  showArrow: boolean; // Parameter to toggle arrows
}

const ActionsTable: React.FC<DataTableProps> = ({ title, data, showArrow }) => {
  // Function to extract unique keys from the data array
  const getUniqueKeys = (data: any[]): string[] => {
    const keysSet = new Set<string>();
    data.forEach((item) => {
      Object.keys(item).forEach((key) => keysSet.add(key));
    });
    return Array.from(keysSet);
  };

  // Function to generate columns dynamically
  const getColumns = (data: any[]): GridColDef[] => {
    const keys = getUniqueKeys(data);

    // Move "Population" key to the end
    const reorderedKeys = keys.filter((key) => key !== "Population");
    if (keys.includes("Population")) {
      reorderedKeys.push("Population");
    }

    return reorderedKeys.map((key) => ({
      field: key,
      headerName: key.charAt(0).toUpperCase() + key.slice(1),
      width: 200,
      renderCell: (params) => {
        const value = params.value;
        if (key === "Action" || key === "Population") {
          return value || "-";
        }

        // Handle numeric values with arrows
        if (showArrow && typeof value === "number") {
          return (
            <div style={{ display: "flex", alignItems: "center" }}>
              {value}
              {value > 0 ? (
                <ArrowDropUp style={{ color: "green" }} />
              ) : value < 0 ? (
                <ArrowDropDown style={{ color: "red" }} />
              ) : null}
            </div>
          );
        }

        // Handle undefined or null values gracefully
        if (value === undefined || value === null) {
          return <span style={{ color: "#aaa" }}>-</span>;
        }

        // Default rendering for all other types
        return value;
      },
    }));
  };

  return (
    <Box>
      <Box display="flex" alignItems="center">
        <Typography
          variant="h6"
          style={{ fontWeight: "bold" }}
          sx={{ padding: 1 }}
        >
          {title}
        </Typography>
      </Box>
      <DataGrid
        rows={data.map((item, index) => ({ id: index, ...item }))}
        columns={getColumns(data)}
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
        hideFooter
      />
    </Box>
  );
};

export default ActionsTable;
