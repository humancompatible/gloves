import { useState } from 'react';
import { Grid, Container } from '@mui/material';
import ResponsiveCardVegaLite from '../../../../shared/components/responsive-card-vegalite';

const StaticCharts = ({ scatterPlotSpec, chart1, chart2, executionMode }) => {
  const [isMosaic, setIsMosaic] = useState(true);

  const charts = [
    {
      title: 'Cost-Effectiveness',
      details: 'Visualizes the performance of the algorithm for different parameter configurations.',
      spec: scatterPlotSpec,
    },
    {
      title: `Cost by ${executionMode}`,
      details: 'Displays the cost of the algorithm across different runs, with the y-axis representing effectiveness and the x-axis showing varying values of the selected parameter.',
      spec: chart1,
    },
    {
      title: `Effectiveness by ${executionMode}`,
      details: 'Displays the effectiveness of the algorithm across different runs, with the y-axis representing effectiveness and the x-axis showing varying values of the selected parameter.',
      spec: chart2,
    },
  ];

  return (
    <Container maxWidth={false} sx={{ padding: 2 }}>
      {/* View Mode Toggle */}
      {/* <Grid
        container
        justifyContent="flex-end"
        alignItems="center"
        sx={{ marginBottom: 2 }}
      >
        <ButtonGroup variant="contained" aria-label="view mode" sx={{ height: '25px' }}>
          <Button
            variant={isMosaic ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => setIsMosaic(true)}
          >
            Mosaic
          </Button>
          <Button
            variant={!isMosaic ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => setIsMosaic(false)}
          >
            Stacked
          </Button>
        </ButtonGroup>
      </Grid> */}

      {/* Charts Layout */}
      <Grid
        container
        spacing={2}
        sx={{ width: '100%', margin: '0 auto', flexWrap: 'wrap' }}
      >
        {charts.map(({ title, details, spec }, index) => (
          <Grid
            item
            xs={isMosaic ? 4 : 12}
            key={index}
            sx={{ textAlign: 'left', width: '100%' }}
          >
            <ResponsiveCardVegaLite
              isStatic={false}
              title={title}
              details={details}
              spec={spec}
              actions={false}
              sx={{ width: '100%', maxWidth: '100%' }}
              minWidth={100}
              minHeight={100}
              maxWidth={500}
              maxHeight={500}
              aspectRatio={1}
              showOptions={false}
            />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default StaticCharts;
