import {
  useEffect,
  useState,
} from "react"
import {
  Box,
  CircularProgress,
  Typography,
} from "@mui/material"

import { useAppDispatch, useAppSelector } from "../../../store/store"
import {
  fetchAvailableFeatures,
  fetchInitialGlanceData,
  umapReduce,
} from "../../../store/slices/glanceSlice"

import DataModelSetup from "./DataAndModelSelection/DataModelSetup"
import DatasetExplorer from "./ExploreDataset/DatasetExplorer"
import ComparativeGlance from "./AnalyzeCounterFactuals/ComparativeGlance"
import CompareMethods from "./CompareModels/CompareMethods"
import UmapScatter from "./ExploreDataset/UmapScatter"
import ScatterPlotComponentForMainPage from "./ExploreDataset/ScatterComponentForMainPage"
import Loader from "../../../shared/components/loader"
import UmapToggle from "../../../shared/components/umapToggle"

import { setActiveStep, setSelectedTab } from '../../../store/slices/glanceSlice';
import ResponsiveCardTable from "../../../shared/components/responsive-card-table"


const GlanceTabs= () => {
  

  const dispatch = useAppDispatch()
  const glanceState = useAppSelector(state => state.glance)
  const [showUMAPScatter, setShowUMAPScatter] = useState(true)
  const [umapCache, setUmapCache] = useState<{ [key: string]: any }>({})
  

  useEffect(() => {
    if (!glanceState.loadDatasetAndModelResult) {
      dispatch(fetchInitialGlanceData())
      dispatch(fetchAvailableFeatures())
      // dispatch(umapReduce({ dataset_identifier: "affectedData", n_components: 2 }))
      // dispatch(umapReduce({ dataset_identifier: "testData", n_components: 2 }))
    }
  }, [dispatch])

  useEffect(() => {
    if (glanceState.viewOption && showUMAPScatter) {
      const datasetIdentifier =
       glanceState.viewOption === "data"
          ? "rawData"
          : glanceState.viewOption === "affected"
          ? "affectedData"
          : "testData"

      if (!umapCache[datasetIdentifier]) {
        dispatch(umapReduce({ dataset_identifier: datasetIdentifier, n_components: 2 })).then(
          action => {
            if (action.payload) {
              setUmapCache(prev => ({
                ...prev,
                [datasetIdentifier]: action.payload.data,
              }))
            }
          }
        )
      }
    }
  }, [glanceState.viewOption, showUMAPScatter, dispatch, umapCache])

  useEffect(() => {
    if (glanceState.loadDatasetAndModelResult) {
      setUmapCache({})
    dispatch(setSelectedTab(1))
    dispatch(setActiveStep(1))

      // setActiveStep(1)
    }
  }, [glanceState.loadDatasetAndModelResult])

  const renderScatterPlot = () => {
    if (!showUMAPScatter && glanceState.viewOption === "affected") {
      return (
        <ScatterPlotComponentForMainPage
          data={glanceState.loadDatasetAndModelResult.affected}
          name="Affected Data"
          controlPanel={
            <UmapToggle
              showUMAPScatter={showUMAPScatter}
              setShowUMAPScatter={setShowUMAPScatter}
            />
          }
          loader={glanceState.umapLoader}
        />
      )
    }

    if (!showUMAPScatter && glanceState.viewOption === "test") {
      return (
        <ScatterPlotComponentForMainPage
          data={glanceState.loadDatasetAndModelResult.X_test}
          name="Test Data"
            controlPanel={
            <UmapToggle
              showUMAPScatter={showUMAPScatter}
              setShowUMAPScatter={setShowUMAPScatter}
            />
          }
                    loader={glanceState.umapLoader}

        />
        
      )
    }

    const datasetKey =
      glanceState.viewOption === "data"
        ? "rawData"
        : glanceState.viewOption === "affected"
        ? "affectedData"
        : "testData"

    if (umapCache[datasetKey]) {
      return (<UmapScatter controlPanel={<UmapToggle showUMAPScatter={showUMAPScatter} setShowUMAPScatter={setShowUMAPScatter} />} data={umapCache[datasetKey].reduced_data} color={""} loader={glanceState.umapLoader}/>);
    }
   if (glanceState.umapLoader) {
  return (
    <ResponsiveCardTable title={"Umap Plot"} details={"Todo"} >

      <Loader />
          </ResponsiveCardTable>

  )
}

   
  }

  if (glanceState.initialLoading && !glanceState.loadDatasetAndModelResult) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="70vh"
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ marginTop: 2 }}>
          Initializing page...
        </Typography>
      </Box>
    )
  }
  const selectedModel = glanceState.selectedModel;
  const selectedDataset = glanceState.selectedDataset;

// const handleModelChange = (model: string) => {
//     dispatch(setSelectedModel(model));
//   };
//    const handleDatasetChange = (dataset: string) => {
//     dispatch(setSelectedDataset(dataset));
//   };

  return (
    <Box sx={{ padding: 2 }}>
      {glanceState.selectedTab === 0 && (
        <DataModelSetup/>
      )}

      {glanceState.selectedTab === 1 && (
        <DatasetExplorer renderScatterPlot={renderScatterPlot()
        }         
        />
      )}

      {glanceState.selectedTab === 2 && (
        <>
        
            <ComparativeGlance
              availableCfMethods={glanceState.availableCfMethods}
              availableActionStrategies={glanceState.availableActionStrategies}
              availableFeatures={
                ["Heloc Dataset", "German Credit Dataset", "Default Credit Dataset", "COMPAS Dataset"].includes(
                  selectedDataset
                )
                  ? glanceState.availableFeatures.slice(0, -1)
                  : glanceState.targetName?.[0]
                  ? glanceState.availableFeatures.filter(f => f !== glanceState.targetName[0])
                  : glanceState.availableFeatures
              }
            />
          
        
        </>
      )}

      {glanceState.selectedTab === 3 && <CompareMethods />}
    </Box>
  )
}

export default GlanceTabs
