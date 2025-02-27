# AWS Config Compliance Mapper

A tool to facilitate organizational compliance mapping
using AWS Config.

It accesses the Creative Commons licensed documentation programatically,
extracts the mapping, and exports it to JSON for further programatic use.

## Full text search frontend

https://cazlo.github.io/aws-config-compliance-mapper/

## Running

### Pre-req

```shell
pip install uv
uv sync
uv run playwright install 
```

### Running

```shell
uv run main.py
```

### Frontend

Install node js locally if not installed

```shell
cd frontend
npm run dev
```