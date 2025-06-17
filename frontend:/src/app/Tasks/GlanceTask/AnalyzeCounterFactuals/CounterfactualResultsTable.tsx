import type React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button,
} from '@mui/material';
import ResponsiveCardTable from '../../../../shared/components/responsive-card-table';

interface Props {
  validResults: [string, any][];
  executionMode: string;
  selectedRowKey: string | null;
  handleViewDetails: (key: string, data: any) => void;
  getSuffix: (key: string) => string;
}

const CounterfactualResultsTable: React.FC<Props> = ({
  validResults,
  executionMode,
  selectedRowKey,
  handleViewDetails,
  getSuffix,
}) => {
  return (
    <ResponsiveCardTable  title={"Counterfactual Analysis Results"} showOptions={false} showFullScreenButton={false}>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{executionMode}</TableCell>
              <TableCell>Total Cost</TableCell>
              <TableCell>Total Effectiveness %</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {validResults.map(([key, data]) => (
              <TableRow
                key={key}
                style={{
                  backgroundColor: selectedRowKey === key ? '#e0f7fa' : 'inherit',
                }}
              >
                <TableCell>{getSuffix(key)}</TableCell>
                <TableCell>{data.TotalCost}</TableCell>
                <TableCell>{data.TotalEffectiveness * 100}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleViewDetails(key, data)}
                    size="small"
                    style={{
                      backgroundColor: selectedRowKey === key ? '#00796b' : undefined,
                    }}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </ResponsiveCardTable>
  );
};

export default CounterfactualResultsTable;
