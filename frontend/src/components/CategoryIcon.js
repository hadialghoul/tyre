import React from 'react';
import { Box } from '@mui/material';
import { resolveMediaUrl } from '../utils/api';
import { categoryIcon } from '../utils/visuals';

const CategoryIcon = ({ category, size = 44, sx = {} }) => {
  const src = resolveMediaUrl(category?.iconImage) || categoryIcon(category?.name);
  const emoji = category?.icon && !String(category.icon).startsWith('/') ? category.icon : '';

  return (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 1.2,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#0b1c22',
        color: '#c8a36a',
        fontSize: Math.round(size * 0.46),
        lineHeight: 1,
        ...sx,
      }}
    >
      {src ? (
        <Box
          component="img"
          src={src}
          alt=""
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        emoji || '📍'
      )}
    </Box>
  );
};

export default CategoryIcon;
