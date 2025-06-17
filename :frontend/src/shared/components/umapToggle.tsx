import { FormControlLabel, Switch } from "@mui/material"

interface UmapToggleProps {
  showUMAPScatter: boolean
  setShowUMAPScatter: (value: boolean) => void
}

const UmapToggle = ({ showUMAPScatter, setShowUMAPScatter }: UmapToggleProps) => (
  <FormControlLabel
    control={
      <Switch
      size="small"
        checked={showUMAPScatter}
        onChange={e => setShowUMAPScatter(e.target.checked)}
        color="primary"
      />
    }
    label="UMAP"
  />
)

export default UmapToggle
