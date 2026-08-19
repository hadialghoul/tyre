import React from 'react';
import { Box } from '@mui/material';

const PhoneNumber = ({ children, sx = {}, ...props }) => (
  <Box
    component="span"
    dir="ltr"
    className="phone-number"
    sx={{
      display: 'inline-block',
      direction: 'ltr',
      unicodeBidi: 'isolate',
      ...sx,
    }}
    {...props}
  >
    {children}
  </Box>
);

export default PhoneNumber;
