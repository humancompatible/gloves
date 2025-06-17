import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import ActionsTable from "./ActionsTable"
import ResponsiveCardTable from "../../../../shared/components/responsive-card-table"
import Card from "@mui/material/Card"
import Stack from "@mui/material/Stack"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import LinearProgress from "@mui/material/LinearProgress"
import SavingsIcon from '@mui/icons-material/Savings';

interface MetricSummaryProps {
  cost: number
  eff: number
  actions: any
  instances: any
  eff_cost_actions: any
}

const MetricSummary: React.FC<MetricSummaryProps> = ({
  cost,
  eff,
  actions,
  instances,
  eff_cost_actions,
}) => {
  const counts: { [key: string]: number } = {}
  for (const key in instances) {
    const value = instances[key]
    counts[value] = (counts[value] || 0) + 1
  }

  const actionsWithAction = actions.map((item: any, index: number) => ({
    Action: index + 1,
    Population: counts[index + 1] || 0, // Add count for the current action
    ...Object.fromEntries(
      Object.entries(item).map(([key, value]) =>
        typeof value === "number"
          ? [key, Math.round(value * 100) / 100]
          : [key, value],
      ),
    ),
  }))

  if (cost == null || eff == null) {
    return <Typography>No data available</Typography>
  }

  return (
    <ResponsiveCardTable
    showFullScreenButton={false}
    showOptions={false}
      title={"Metric Summary"}
      details={
        "Total Effectiveness: is the percentage of individuals that achieve the favorable outcome, if each one of the final actions is applied to the whole affected population. Total Cost: is calculated as the mean recourse cost of the whole set of final actions over the entire population."
      }
    >
      <Box sx={{ minWidth: "300px" }}>
        <Stack direction="row" spacing={1} padding={1}>
          <Card
            sx={{
              flex: 1,
              padding: 1,
              borderRadius: 2,
              background: "linear-gradient(135deg, #f3f4f6, #e0e7ff)",
              boxShadow: 1,
            }}
          >
            <Box display="flex" alignItems="center" gap={0.5}>
              <SavingsIcon fontSize="small" color="primary" />
              <Typography fontWeight={600} variant="body2">
                Total Cost:
              </Typography>
              <Typography variant="body1">{cost}</Typography>
            </Box>
          </Card>

          <Card
            sx={{
              flex: 1,
              padding: 1,
              borderRadius: 2,
              background: "linear-gradient(135deg, #d7f5d1, #a2d57a)",
              boxShadow: 1,
            }}
          >
            <Box display="flex" alignItems="center" gap={0.5}>
              <CheckCircleIcon fontSize="small" color="success" />
              <Typography fontWeight={600} variant="body2">
                Total Effectiveness:
              </Typography>
              <Typography variant="body1">{(eff * 100).toFixed(2)}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={eff * 100}
              sx={{ mt: 0.5, borderRadius: 1, height: 6 }}
            />
          </Card>
        </Stack>
      </Box>

      <ActionsTable
        data={actionsWithAction}
        showArrow={true}
        eff_cost_actions={eff_cost_actions}
        title={""}
      />
    </ResponsiveCardTable>
  )
}

export default MetricSummary
