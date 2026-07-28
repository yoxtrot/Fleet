import { Paper, type PaperProps } from '@mui/material'

export function PagePanel({ children, sx, ...props }: PaperProps) {
  return (
    <Paper
      {...props}
      sx={{
        p: { xs: 2, sm: 3 },
        width: '100%',
        maxWidth: 820,
        mx: 'auto',
        bgcolor: 'background.paper',
        ...sx,
      }}
    >
      {children}
    </Paper>
  )
}
