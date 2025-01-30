import React, {useState} from 'react';
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
    Stack,
    Typography
} from '@mui/material';
import {ThemeProvider, createTheme} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
    palette: {
        mode: 'dark',
    },
});

function App() {
    const allControls = [];
    for (const ruleName in rulesData) {
        const rule = rulesData[ruleName];
        const controls = rule.controls || [];
        controls.forEach((c) => {
            allControls.push({
                ruleName,
                framework: c.framework.replace("operational-best-practices-for-", ""),
                control_id: c.control_id,
                control_description: c.control_description,
                control_guidance: c.control_guidance,
            });
        });
    }

    const [query, setQuery] = useState('');
    const [selectedFramework, setSelectedFramework] = useState('');

    const uniqueFrameworks = Array.from(new Set(allControls.map((c) => c.framework)));
    uniqueFrameworks.sort()

    // init fuzzy search
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

    const fuseResults = query ? fuse.search(query).map((result) => result.item) : allControls;

    const filteredResults = selectedFramework
        ? fuseResults.filter((item) => item.framework === selectedFramework)
        : fuseResults;

    const groupedByRule = filteredResults.reduce((acc, control) => {
        if (!acc[control.ruleName]) {
            acc[control.ruleName] = [];
        }
        acc[control.ruleName].push(control);
        return acc;
    }, {});

    const groupedEntries = Object.entries(groupedByRule);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline/>
            <Box sx={{width: '100%', maxWidth: '1200px', mx: 'auto', p: 2}}>
                <h1>Config Rules Search</h1>

                {/* Search Field */}
                <TextField
                    label="Search"
                    variant="outlined"
                    fullWidth
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    sx={{mb: 2}}
                />

                {/* Framework Filter */}
                <FormControl fullWidth sx={{mb: 2}}>
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
                        maxHeight: 800,
                        overflowX: 'auto', // allow horizontal scrolling if needed
                    }}
                >
                    <Table
                        stickyHeader
                        sx={{
                            minWidth: 650,
                            width: '100%',
                        }}
                        aria-label="grouped by config rule"
                    >
                        <TableHead>
                            <TableRow>
                                <TableCell>Config Rule</TableCell>
                                <TableCell>Guidance</TableCell>
                                <TableCell>Frameworks</TableCell>
                                <TableCell>Control Details</TableCell>
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
                                          <TableCell>{controls[0]?.control_guidance}</TableCell>
                                          <TableCell>
                                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                                  {frameworks.map((fw) => (
                                                        <Chip key={fw} label={fw}/>
                                                    ))}
                                                </Stack>
                                          </TableCell>
                                          <TableCell>
                                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                                  {controls.map((c) => (
                                                        <Typography variant="body2" key={`${c.framework}-${c.control_id}`}>
                                                            <a>{c.control_id}</a>
                                                            {c.framework.includes('800-171') ||
                                                             c.framework.includes('800-53')  ||
                                                             c.framework.includes('cmmc')  ||
                                                             c.framework.includes('fedramp-low') ? `:${c.control_description}` : ''}
                                                        </Typography>
                                                        // todo <a> to upstream link
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
                <br/>
                This data is a generated view of Creative Commons licensed public AWS documentation. All credit to AWS for the data and consider this a static snapshot for research purposes only.
            </Box>
        </ThemeProvider>
    );
}

export default App;
