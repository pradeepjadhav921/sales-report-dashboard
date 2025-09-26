// src/components/SalesChart.js

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const SalesChart = ({ data, timeFilter }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const formatLabel = (value) => {
    if (value >= 1000000) return `₹${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
    return `₹${value}`;
  };

  const getTitle = () => {
    if (timeFilter === 'Day') return 'Last 7 Days Sales';
    if (timeFilter === 'Month') return "This Month's Sales";
    if (timeFilter === 'Year') return "This Year's Sales";
    return 'Sales';
  };

  const formatTooltip = (value, name, props) => {
    return [`₹${value.toLocaleString()}`, 'Sales'];
  };

  // Custom tick formatter for XAxis based on timeFilter
  const formatXAxisTick = (tickItem) => {
    return tickItem;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {getTitle()}
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={isMobile ? 
            { top: 20, right: 10, left: 5, bottom: 50 } : 
            { top: 20, right: 30, left: 20, bottom: 50 }
          }
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="name" 
            angle={isMobile ? -45 : 0}
            textAnchor={isMobile ? 'end' : 'middle'}
            tick={{ fontSize: isMobile ? 10 : 12 }}
            height={isMobile ? 70 : 50}
            interval={0}
            tickFormatter={formatXAxisTick}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            width={isMobile ? 40 : 60}
            tickFormatter={formatLabel}
          />
          <Tooltip 
            formatter={formatTooltip}
            labelFormatter={(label, payload) => {
              if (payload && payload[0] && payload[0].payload.fullDate) {
                return `Date: ${payload[0].payload.fullDate}`;
              }
              return label;
            }}
          />
          <Legend />
          <Bar 
            dataKey="Sales" 
            fill={theme.palette.primary.main}
            name="Sales Amount"
          >
            {!isMobile && (
              <LabelList 
                dataKey="Sales" 
                position="top" 
                fontSize={10} 
                fill={theme.palette.text.primary}
                formatter={formatLabel}
              />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default SalesChart;