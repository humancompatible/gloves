import type React from "react";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import { ArrowDropUp, ArrowDropDown } from "@mui/icons-material";

interface DataTableProps {
  title: string;
  data: any[];
  showArrow: boolean;
  eff_cost_actions: Record<string, { eff: number; cost: number }>;
}

const ActionsTable: React.FC<DataTableProps> = ({ title, data, showArrow, eff_cost_actions }) => {
  const getUniqueKeys = (data: any[]): string[] => {
    const keysSet = new Set<string>();
    data.forEach((item) => {
      Object.keys(item).forEach((key) => keysSet.add(key));
    });
    return Array.from(keysSet);
  };

  const getColumns = (data: any[]): GridColDef[] => {
    const keys = getUniqueKeys(data);

    let reorderedKeys = keys.filter((key) => key !== "Population" && key !== "Action");
    if (keys.includes("Population")) {
      reorderedKeys.push("Population");
    }

    const baseColumns: GridColDef[] = [
      {
        field: "Action",
        headerName: "Action",
        width: 200,
      },
      {
        field: "eff",
        headerName: "Effectiveness %",
        width: 150,
        renderCell: (params) => (params.value ? (params.value * 100).toFixed(2) : "-"),
      },
      {
        field: "cost",
        headerName: "Cost",
        width: 150,
        renderCell: (params) => params.value?.toFixed(2) ?? "-",
      },
      ...reorderedKeys.map((key) => ({
        field: key,
        headerName: key.charAt(0).toUpperCase() + key.slice(1),
        width: 200,
        renderCell: (params) => {
          const value = params.value;
          if (key === "Population") {
            return value || "-";
          }

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

          return value === undefined || value === null ? <span style={{ color: "#aaa" }}>-</span> : value;
        },
      })),
    ];

    return baseColumns;
  };

  const enrichedData = data.map((item, index) => {
    const actionId = item.Action?.toString();
    const effCost = actionId ? eff_cost_actions[actionId] : { eff: null, cost: null };
    return { id: index, ...item, ...effCost };
  });

  return (
      <DataGrid
        rows={enrichedData}
        disableRowSelectionOnClick
        columns={getColumns(data)}
        autoHeight
        sx={{ marginTop: 1 }}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 5,
            },
          },
        }}
        pageSizeOptions={[5, 10]}
      />
  );
};

export default ActionsTable;