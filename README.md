# AWS Config Compliance Mapper

A tool to facilitate organizational compliance mapping
using AWS Config.

It accesses the Creative Commons licensed documentation programatically,
extracts the mapping, and exports it to JSON for further programatic use.

## Running

### Pre-req

```shell
uv sync
uv run playwright install 
```

### Running

```shell
uv run main.py
```