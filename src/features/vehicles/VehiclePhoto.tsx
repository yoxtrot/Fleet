import { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import { resolveVehiclePhotoUrl } from './vehiclesApi'

type VehiclePhotoProps = {
  photoPath: string | null | undefined
  nickname: string
  height?: number | string
  width?: number | string
}

export function VehiclePhoto({
  photoPath,
  nickname,
  height = 180,
  width = '100%',
}: VehiclePhotoProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    setPhotoUrl(null)

    resolveVehiclePhotoUrl(photoPath)
      .then((url) => {
        if (isMounted) setPhotoUrl(url)
      })
      .catch(() => {
        if (isMounted) setPhotoUrl(null)
      })

    return () => {
      isMounted = false
    }
  }, [photoPath])

  if (!photoUrl) return null

  return (
    <Box
      component="img"
      src={photoUrl}
      alt={nickname}
      sx={{
        display: 'block',
        width,
        height,
        objectFit: 'cover',
        borderRadius: 1,
        bgcolor: 'action.hover',
      }}
    />
  )
}
