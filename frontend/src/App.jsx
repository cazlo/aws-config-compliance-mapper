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
    Typography,
    Tooltip,
} from '@mui/material';
import {ThemeProvider, createTheme} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import {getControlIcon, getControlLink} from './util.jsx';
import PropTypes from "prop-types";

const theme = createTheme({
    palette: {
        mode: 'dark',
    },
});


function FrameworkCard({framework, controls})  {
    return <Paper sx={{ maxWidth: 345 }} variant={'outlined'}>
        <Typography gutterBottom variant="body2" component="div">
            {framework.replaceAll("-", " ").replaceAll("_", " ")}
        </Typography>
          {controls.map((control, index) => (
              <Tooltip key={`${index}${control.control_id}${framework}`} title={control.control_description} disableFocusListener disableTouchListener>
                  <Chip  label={control.control_id} variant={"outlined"}  clickable component={"a"} href={control.url} size="sm" icon={getControlIcon(framework, control)} />
              </Tooltip>
          ))}
    </Paper>
}

const allControls = [];
for (const ruleName in rulesData) {
    const rule = rulesData[ruleName];
    const controls = rule.controls || [];
    controls.forEach((c) => {
        const framework = c.framework.replace("operational-best-practices-for-", "")
        allControls.push({
            ruleName,
            framework: framework,
            control_id: c.control_id,
            control_description: c.control_description,
            control_guidance: c.control_guidance,
            url: getControlLink(framework, c.control_id)
        });
    });
}

function DebounceInput(props) {
  const { handleDebounce, debounceTimeout, ...other } = props;

  const timerRef = React.useRef(undefined);

  const handleChange = (event) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleDebounce(event.target.value);
    }, debounceTimeout);
  };

  return <TextField {...other} onChange={handleChange} />;
}

DebounceInput.propTypes = {
  debounceTimeout: PropTypes.number.isRequired,
  handleDebounce: PropTypes.func.isRequired,
};


function App() {


    const [query, setQuery] = useState('');
    const [selectedFramework, setSelectedFramework] = useState('');

    const uniqueFrameworks = Array.from(new Set(allControls.map((c) => c.framework)));
    uniqueFrameworks.sort()

    // init fuzzy search
    const fuse = new Fuse(allControls, {
        keys: [
            'ruleName',
            // 'framework',
            'control_id',
            'control_description',
            'control_guidance',
        ],
        threshold: 0.3, // lower = stricter matching, higher = fuzzier
    });

    const fuseResults = query ? new Set(fuse.search(query).map((result) => result.item.ruleName)) : null;

    const matchingRules = Object.keys(rulesData).reduce((acc, configRule) => {

        const controls = rulesData[configRule].controls
        let hidden = false
        if (query && !fuseResults.has(configRule)) {
            hidden = true;
        }

        if (selectedFramework) {
            let hasSelectedFramework = false;
            for (const control of controls) {
                if (control.framework?.includes(selectedFramework)) {
                    hasSelectedFramework = true;
                    break;
                }
            }
            if (!hasSelectedFramework) {
                hidden = true;
            }
        }
        acc.push({
            ruleName: configRule,
            controls: controls,
            hidden: hidden
        });
        return acc;
    }, []);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline/>
            <Box sx={{width: '100%', maxWidth: '95%', mx: 'auto', p: 2}}>
                <h1>Config Rules Search</h1>

                {/* Search Field */}
                <DebounceInput
                    label="Search"
                    variant="outlined"
                    fullWidth
                    sx={{mb: 2}}
                    debounceTimeout={1000}
                    handleDebounce={(value) => setQuery(value)}
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

                <h2>{matchingRules.filter(r => !r.hidden).length} Config Rules</h2>

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
                                <TableCell>CIS</TableCell>
                                <TableCell>AWS Well Architected Framework</TableCell>
                                <TableCell>CUI</TableCell>
                                <TableCell>FedRAMP</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {matchingRules.length > 0 ? (
                                matchingRules.map(({ruleName, controls, hidden}) => {
                                    // Collect unique frameworks from this rule's matched controls
                                    const frameworksSet = new Set(controls.map((c) => c.framework));
                                    const frameworks = Array.from(frameworksSet);
                                    frameworks.sort()

                                    return (
                                        <TableRow key={ruleName} sx={hidden ? {display: "none"}: {}}>
                                          <TableCell>
                                                {ruleName.includes("(Process Check)")
                                                    ? ruleName
                                                    : <a href={`https://docs.aws.amazon.com/config/latest/developerguide/${ruleName}.html`}>{ruleName}</a>
                                                }
                                            </TableCell>
                                          <TableCell>{controls[0]?.control_guidance}</TableCell>
                                          <TableCell>
                                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                                  {frameworks.filter(f => f.includes('cis')).map((fw) => (
                                                      <FrameworkCard key={fw} framework={fw} controls={controls.filter(c => c.framework === fw)} />
                                                        // <Chip key={fw} label={fw}/>
                                                    ))}
                                                </Stack>
                                          </TableCell>
                                          <TableCell>
                                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                                  {frameworks.filter(f => f.includes('Pillar')).map((fw) => (
                                                      <FrameworkCard key={fw} framework={fw} controls={controls.filter(c => c.framework === fw)} />
                                                        // <Chip key={fw} label={fw}/>
                                                    ))}
                                                </Stack>
                                          </TableCell>
                                          <TableCell>
                                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                                  {frameworks.filter(f => (f.includes('171')||f.includes('cmmc')||f.includes('172'))).map((fw) => (
                                                      <FrameworkCard key={fw} framework={fw} controls={controls.filter(c => c.framework === fw)} />
                                                        // <Chip key={fw} label={fw}/>
                                                    ))}
                                                </Stack>
                                          </TableCell>
                                          <TableCell>
                                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                                  {frameworks.filter(f => (f.includes('53')||f.includes('fedramp'))).map((fw) => (
                                                      <FrameworkCard key={fw} framework={fw} controls={controls.filter(c => c.framework === fw)} />
                                                        // <Chip key={fw} label={fw}/>
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
