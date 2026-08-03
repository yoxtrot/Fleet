import { useEffect, useMemo, useState } from 'react'
import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import type { VehicleType } from './vehicleTypes'
import {
  CUSTOM_CATALOG_VALUE,
  fetchModelsForMakeYear,
  popularMakesForVehicleType,
  popularModelsForMake,
  VEHICLE_YEAR_OPTIONS,
} from './vehicleCatalog'

type VehicleIdentityFieldsProps = {
  vehicleType: VehicleType
  year: number | null
  make: string
  model: string
  locked?: boolean
  onYearChange: (year: number | null) => void
  onMakeChange: (make: string) => void
  onModelChange: (model: string) => void
}

function selectionFromValue(value: string, options: string[]) {
  if (!value) return ''
  return options.some((option) => option.toLowerCase() === value.toLowerCase())
    ? options.find((option) => option.toLowerCase() === value.toLowerCase()) ?? value
    : CUSTOM_CATALOG_VALUE
}

export function VehicleIdentityFields({
  vehicleType,
  year,
  make,
  model,
  locked = false,
  onYearChange,
  onMakeChange,
  onModelChange,
}: VehicleIdentityFieldsProps) {
  const makeOptions = useMemo(() => popularMakesForVehicleType(vehicleType), [vehicleType])
  const [makeSelection, setMakeSelection] = useState(() => selectionFromValue(make, makeOptions))
  const [customMake, setCustomMake] = useState(() =>
    selectionFromValue(make, makeOptions) === CUSTOM_CATALOG_VALUE ? make : '',
  )
  const [modelOptions, setModelOptions] = useState<string[]>(() =>
    make ? popularModelsForMake(vehicleType, make) : [],
  )
  const [modelSelection, setModelSelection] = useState(() =>
    selectionFromValue(model, make ? popularModelsForMake(vehicleType, make) : []),
  )
  const [customModel, setCustomModel] = useState(() =>
    selectionFromValue(model, make ? popularModelsForMake(vehicleType, make) : []) ===
    CUSTOM_CATALOG_VALUE
      ? model
      : '',
  )
  const [isLoadingModels, setIsLoadingModels] = useState(false)

  // Keep local selection state aligned when the form loads an existing vehicle.
  useEffect(() => {
    const nextMakeSelection = selectionFromValue(make, makeOptions)
    setMakeSelection(nextMakeSelection)
    setCustomMake(nextMakeSelection === CUSTOM_CATALOG_VALUE ? make : '')
  }, [make, makeOptions])

  useEffect(() => {
    const nextModelSelection = selectionFromValue(model, modelOptions)
    setModelSelection(nextModelSelection)
    setCustomModel(nextModelSelection === CUSTOM_CATALOG_VALUE ? model : '')
  }, [model, modelOptions])

  useEffect(() => {
    const selectedMake = makeSelection === CUSTOM_CATALOG_VALUE ? customMake.trim() : makeSelection
    if (!selectedMake) {
      setModelOptions([])
      return
    }

    let isMounted = true
    setIsLoadingModels(true)

    const loadModels = async () => {
      const options =
        year != null
          ? await fetchModelsForMakeYear(vehicleType, selectedMake, year)
          : popularModelsForMake(vehicleType, selectedMake)
      if (!isMounted) return
      setModelOptions(options)
      setIsLoadingModels(false)
    }

    void loadModels()
    return () => {
      isMounted = false
    }
  }, [vehicleType, makeSelection, customMake, year])

  function handleMakeSelection(nextSelection: string) {
    setMakeSelection(nextSelection)
    setModelSelection('')
    setCustomModel('')
    onModelChange('')
    if (nextSelection === CUSTOM_CATALOG_VALUE) {
      onMakeChange(customMake.trim())
      return
    }
    setCustomMake('')
    onMakeChange(nextSelection)
  }

  function handleModelSelection(nextSelection: string) {
    setModelSelection(nextSelection)
    if (nextSelection === CUSTOM_CATALOG_VALUE) {
      onModelChange(customModel.trim())
      return
    }
    setCustomModel('')
    onModelChange(nextSelection)
  }

  return (
    <Stack spacing={2}>
      <FormControl fullWidth size="small" disabled={locked}>
        <InputLabel id="vehicle-make-label">Make</InputLabel>
        <Select
          labelId="vehicle-make-label"
          label="Make"
          value={makeSelection}
          onChange={(event) => handleMakeSelection(event.target.value)}
        >
          <MenuItem value="">
            <em>Select make</em>
          </MenuItem>
          {makeOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
          <MenuItem value={CUSTOM_CATALOG_VALUE}>Custom…</MenuItem>
        </Select>
      </FormControl>

      {makeSelection === CUSTOM_CATALOG_VALUE ? (
        <TextField
          label="Custom make"
          size="small"
          required
          disabled={locked}
          value={customMake}
          onChange={(event) => {
            setCustomMake(event.target.value)
            onMakeChange(event.target.value)
            setModelSelection('')
            setCustomModel('')
            onModelChange('')
          }}
        />
      ) : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControl fullWidth size="small" disabled={locked || !makeSelection}>
            <InputLabel id="vehicle-year-label">Year</InputLabel>
            <Select
              labelId="vehicle-year-label"
              label="Year"
              value={year == null ? '' : year}
              onChange={(event) => {
                const value = event.target.value as number | string
                onYearChange(value === '' ? null : Number(value))
                setModelSelection('')
                setCustomModel('')
                onModelChange('')
              }}
            >
              <MenuItem value="">
                <em>Select year</em>
              </MenuItem>
              {VEHICLE_YEAR_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 8 }}>
          <FormControl fullWidth size="small" disabled={locked || !makeSelection || year == null}>
            <InputLabel id="vehicle-model-label">Model</InputLabel>
            <Select
              labelId="vehicle-model-label"
              label="Model"
              value={modelSelection}
              onChange={(event) => handleModelSelection(event.target.value)}
            >
              <MenuItem value="">
                <em>{isLoadingModels ? 'Loading models…' : 'Select model'}</em>
              </MenuItem>
              {modelOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
              <MenuItem value={CUSTOM_CATALOG_VALUE}>Custom…</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {modelSelection === CUSTOM_CATALOG_VALUE ? (
        <TextField
          label="Custom model"
          size="small"
          required
          disabled={locked}
          value={customModel}
          onChange={(event) => {
            setCustomModel(event.target.value)
            onModelChange(event.target.value)
          }}
        />
      ) : null}
    </Stack>
  )
}
