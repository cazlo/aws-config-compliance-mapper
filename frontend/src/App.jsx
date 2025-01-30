import React, { useState } from 'react';
import rulesData from './controls_by_config_rule.json';
import Fuse from 'fuse.js';

import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack
} from '@mui/material';

function App() {
  // 1. Flatten your nested JSON data into an array of controls
  const allControls = [];
  for (const ruleName in rulesData) {
    const rule = rulesData[ruleName];
    const controls = rule.controls || [];
    controls.forEach((c) => {
      allControls.push({
        ruleName,
        framework: c.framework,
        control_id: c.control_id,
        control_description: c.control_description,
        control_guidance: c.control_guidance,
      });
    });
  }

  // 2. State for search query and selected framework
  const [query, setQuery] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('');

  // 3. Extract unique frameworks for the dropdown
  const uniqueFrameworks = Array.from(new Set(allControls.map((c) => c.framework)));
  uniqueFrameworks.sort()

  // 4. Configure Fuse.js for full-text search
  const fuse = new Fuse(allControls, {
    keys: [
      'ruleName',
      'framework',
      'control_id',
      'control_description',
      'control_guidance',
    ],
    threshold: 0.3, // lower = stricter matching, higher = fuzzier
  });

  // 5. Perform the search
  const fuseResults = query ? fuse.search(query).map((result) => result.item) : allControls;

  // 6. Filter by framework if one is selected
  const filteredResults = selectedFramework
    ? fuseResults.filter((item) => item.framework === selectedFramework)
    : fuseResults;

  // 7. Group the filtered controls by ruleName
  //    Example: { "dynamodb-throughput-limit-check": [ ...controls... ], "another-rule": [ ... ] }
  const groupedByRule = filteredResults.reduce((acc, control) => {
    if (!acc[control.ruleName]) {
      acc[control.ruleName] = [];
    }
    acc[control.ruleName].push(control);
    return acc;
  }, {});

  // 8. Create an array of [ruleName, controls[]] pairs from the grouped object
  const groupedEntries = Object.entries(groupedByRule);

  return (
    <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto', p: 2 }}>
      <h1>Config Rules Search</h1>

      {/* Search Field */}
      <TextField
        label="Search"
        variant="outlined"
        fullWidth
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* Framework Filter */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="framework-filter-label">Framework</InputLabel>
        <Select
          labelId="framework-filter-label"
          label="Framework"
          value={selectedFramework}
          onChange={(e) => setSelectedFramework(e.target.value)}
        >
          <MenuItem value="">All Frameworks</MenuItem>
          {uniqueFrameworks.map((fw) => (
            <MenuItem key={fw} value={fw}>
              {fw}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <h2>{groupedEntries.length} Results</h2>

      {/* Responsive Table */}
      <TableContainer
        component={Paper}
        sx={{
          width: '100%',
          overflowX: 'auto', // allow horizontal scrolling if needed
        }}
      >
        <Table
          sx={{
            minWidth: 650,
            width: '100%',
          }}
          aria-label="grouped by config rule"
        >
          <TableHead>
            <TableRow>
              <TableCell>Config Rule</TableCell>
              <TableCell>Frameworks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groupedEntries.length > 0 ? (
              groupedEntries.map(([ruleName, controls]) => {
                // Collect unique frameworks from this rule's matched controls
                const frameworksSet = new Set(controls.map((c) => c.framework));
                const frameworks = Array.from(frameworksSet);

                return (
                  <TableRow key={ruleName}>
                    <TableCell>{ruleName}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {frameworks.map((fw) => (
                          <Chip key={fw} label={fw} />
                        ))}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={2}>No results found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default App;
