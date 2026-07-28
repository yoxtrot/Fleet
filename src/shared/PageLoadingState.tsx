import { Box, CircularProgress, Typography } from '@mui/material'

export function PageLoadingState({ label }: { label: string }) {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', gap: 2, py: 8 }}>
      <CircularProgress size={28} />
      <Typography color="text.secondary">{label}</Typography>
    </Box>
  )
}
