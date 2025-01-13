import React from "react";
import { Grid } from "@mui/material";
import UmapScatterGlance from "./PLOTS/UmapScatterGlance";
import LastUmap from "./LastUmap";
import WorkflowCard from "../../../shared/components/workflow-card";

interface UmapGlanceComponentProps {
  applied_aff_data: any;
  aff_data: any;
  actions: any;
  eff_cost_actions: any;
}

const UmapGlanceComponent: React.FC<UmapGlanceComponentProps> = ({ applied_aff_data, aff_data, actions, eff_cost_actions }) => {

  return (
    <>


      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <WorkflowCard title="Action Selection" description="Visualizes affected instances, each labeled with the number corresponding to the global counterfactual action they selected to flip their prediction." >

            <UmapScatterGlance
              data={aff_data["affectedData"].reduced_data}
              color=""
              actions={applied_aff_data.reduced_data.Chosen_Action}
              name="Affected population"
            />
          </WorkflowCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <WorkflowCard title="Post-Action Selection" description="Displays affected instances after the selected actions have been applied, with updated feature values and labeled by the chosen action." >
            <UmapScatterGlance
              data={applied_aff_data.reduced_data}
              color=""
              actions={applied_aff_data.reduced_data.Chosen_Action}
              name="Affected population after Actions Applied"
            />
          </WorkflowCard>
        </Grid>
      </Grid>



      <WorkflowCard title="Action Effectiveness and Cost Summary" description="Displays the effectiveness and cost of each action when applied to all affected instances, providing a detailed overview of how each action impacts performance.">

        <LastUmap
          data={aff_data["affectedData"].reduced_data}
          actions={Object.keys(actions)
            .filter(key => /^Action\d+_Prediction$/.test(key))
            .map(key => {
              const number = parseInt(key.match(/\d+/)?.[0] || '', 10);
              return { key, value: actions[key], number };
            })}
          name={"Affected with Actions Label"}
          eff_cost_actions={eff_cost_actions}
        />
      </WorkflowCard>
    </>
  );
};

export default UmapGlanceComponent;
