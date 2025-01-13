import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ActionsTable from "./PLOTS/ActionsTable";
import WorkflowCard from "../../../shared/components/workflow-card";

interface MetricSummaryProps {
    cost: number;
    eff: number;
    actions: any;
    instances: any;
}

const MetricSummary: React.FC<MetricSummaryProps> = ({ cost, eff, actions, instances }) => {


    const counts: { [key: string]: number } = {};
    for (const key in instances) {
        const value = instances[key];
        counts[value] = (counts[value] || 0) + 1;
    }


    const actionsWithAction = actions.map((item: any, index: number) => ({
        Action: index + 1,
        Population: counts[index + 1] || 0, // Add count for the current action

        //     ...item,
        //     // Adding Action field starting from 1
        //   }));
        ...Object.fromEntries(
            Object.entries(item).map(([key, value]) =>
                typeof value === "number" ? [key, Math.round(value * 100) / 100] : [key, value]
            )
        ),


    }));

    if (cost == null || eff == null) {
        return <Typography>No data available</Typography>;
    }

    return (
        <Paper>
            {/* <Typography variant="h6" fontWeight={"bold"} sx={{ padding: 1 }}>Metric Summary</Typography> */}

            <Box
                sx={{
                    display: "flex", // Aligns items in a row
                    flexDirection: "row", // Horizontal alignment
                    gap: 2, // Space between items
                    padding: 2,
                    borderRadius: 4,
                    minWidth: "300px",
                }}
            >
                <Paper sx={{ padding: 2, flex: 1 }}> {/* flex: 1 to balance width */}
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography fontWeight={600}>Total Cost:</Typography>
                        <Typography>{cost}</Typography>
                    </Box>
                </Paper>

                <Paper sx={{ padding: 2, flex: 1 }}> {/* flex: 1 to balance width */}
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography fontWeight={600}>Total Effectiveness:</Typography>
                        <Typography>{eff * 100}%</Typography>
                    </Box>
                </Paper>
            </Box>
            <Box>
                <WorkflowCard title={"CounterFactual Actions"} description="Set of final global counterfactual actions generated">
                    <ActionsTable data={actionsWithAction} title={""} showArrow={true} />
                </WorkflowCard>
            </Box>

        </Paper>

    );
};

export default MetricSummary;