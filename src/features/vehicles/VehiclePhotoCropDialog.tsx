import { useCallback, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  Stack,
  Typography,
} from '@mui/material'
import { cropImageToFile } from './cropImage'

/** Matches list/dashboard thumbnail framing (120×90). */
export const VEHICLE_PHOTO_ASPECT = 4 / 3

type VehiclePhotoCropDialogProps = {
  imageSrc: string | null
  open: boolean
  onCancel: () => void
  onComplete: (file: File) => void
}

export function VehiclePhotoCropDialog({
  imageSrc,
  open,
  onCancel,
  onComplete,
}: VehiclePhotoCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleApply() {
    if (!imageSrc || !croppedAreaPixels) return
    setIsApplying(true)
    setError(null)
    try {
      const file = await cropImageToFile(imageSrc, croppedAreaPixels)
      onComplete(file)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : 'Failed to crop photo')
    } finally {
      setIsApplying(false)
    }
  }

  function handleCancel() {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setError(null)
    onCancel()
  }

  return (
    <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="sm">
      <DialogTitle>Frame vehicle photo</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Drag to pan. Use the slider to zoom. The framed area is what will be saved.
          </Typography>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: { xs: 280, sm: 360 },
              bgcolor: 'background.default',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            {imageSrc ? (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={VEHICLE_PHOTO_ASPECT}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                showGrid
              />
            ) : null}
          </Box>
          <Box>
            <Typography variant="body2" gutterBottom>
              Zoom
            </Typography>
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.05}
              onChange={(_event, value) => setZoom(typeof value === 'number' ? value : value[0])}
              aria-label="Zoom"
            />
          </Box>
          {error ? (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} disabled={isApplying}>
          Cancel
        </Button>
        <Button onClick={() => void handleApply()} disabled={isApplying || !croppedAreaPixels}>
          {isApplying ? 'Applying…' : 'Apply crop'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
