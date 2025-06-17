import type React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import WorkflowCard from '../../../../shared/components/workflow-card';

interface Props {
  errorResults: [string, any][];
  executionMode: string;
  getSuffix: (key: string) => string;
}

const AnalysisErrorsTable: React.FC<Props> = ({
  errorResults,
  executionMode,
  getSuffix,
}) => {
  return (
    <WorkflowCard
      title="Analysis Errors"
      description="Some configurations encountered errors:"
    >
      <TableContainer component={Paper} sx={{ marginBottom: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{executionMode}</TableCell>
              <TableCell>Error Message</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {errorResults.map(([key, result]) => (
              <TableRow key={key}>
                <TableCell>{getSuffix(key)}</TableCell>
                <TableCell>{result.error}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </WorkflowCard>
  );
};

export default AnalysisErrorsTable;
