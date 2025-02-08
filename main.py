import datetime
import time
import logging
import json

from playwright.sync_api import sync_playwright

from frameworks import supported_frameworks

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)sZ %(levelname)s %(message)s",
                    datefmt="%Y-%m-%dT%H:%M:%S"
                    )
logging.Formatter.converter = time.gmtime
log = logging.getLogger(__name__)


def extract_table_via_playwright(url):
    """
    Renders a JS-driven page using Playwright, locates a div with class 'table-contents',
    extracts the first table within it, prints out cell text row-by-row,
    and returns the table's outer HTML if found.
    """
    with sync_playwright() as p:
        # Launch a headless browser
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the URL
        page.goto(url)

        # Wait for the div with class 'table-contents' to appear (if you know it's there)
        # Adjust timeout as needed
        page.wait_for_selector("div.table-contents", timeout=10000)

        # Find the first table inside this div
        table_contents_div = page.query_selector("div.table-contents")

        if table_contents_div:
            table = table_contents_div.query_selector("table")

            if table:
                headers = []
                dict_data = []
                # Print row data
                rows = table.query_selector_all("tr")
                for row in rows:
                    header_cells = row.query_selector_all("th")
                    if len(header_cells) > 0:
                        headers = [cell.inner_text() for cell in header_cells]
                    else:
                        cells = row.query_selector_all("td")
                        cell_text = [cell.inner_text() for cell in cells]
                        dict_data.append(dict(zip(headers, cell_text)))

                # Return the table's HTML normalized as a Dict
                return dict_data
            else:
                log.debug("No <table> found within 'table-contents' div.")
                return None
        else:
            log.debug("No div with class 'table-contents' found.")
            return None

        # Browser context is automatically closed by exiting the 'with' block

def cache_config_conformance_packs(tmp_cache_file):
    base_url = "https://docs.aws.amazon.com/config/latest/developerguide/"
    frameworks = [ f.aws_name for f in supported_frameworks ]
    framework_mappings = {}
    for idx, framework in enumerate(frameworks):
        log.info(f"Processing framework '{framework}' ({idx + 1}/{len(frameworks)})")
        url = f"{base_url}{framework}.html"
        control_mappings = extract_table_via_playwright(url)
        if control_mappings:
            framework_mappings[framework] = control_mappings
        else:
            log.error(f"No mapping found for framework '{framework}'.")
    json.dump(framework_mappings, open(tmp_cache_file, "w"), indent=4)


def group_by_config_rule(tmp_cache_file, control_by_config_rule_filename, version_filename):
    framework_mappings = json.load(open(tmp_cache_file, "r"))
    config_rules = {}
    for framework, controls in framework_mappings.items():
        log.info(f"Processing framework '{framework}' ({len(controls)} controls)")
        for control in controls:
            control_id = control.get("Control ID")
            control_description = control.get("Control Description")
            config_rule_name = control.get("AWS Config Rule")
            control_guidance = control.get("Guidance")
            if config_rule_name not in config_rules:
                config_rules[config_rule_name] = {
                    'controls': [],
                }
            config_rules[config_rule_name]['controls'].append({
                'framework': framework,
                'control_id': control_id,
                'control_description': control_description,
                'control_guidance': control_guidance,
            })
    version = {"CREATION_DATE" : datetime.datetime.now(datetime.UTC).isoformat()}
    json.dump(version, open(version_filename, "w"), indent=4)
    json.dump(config_rules, open(control_by_config_rule_filename, "w"), indent=4, sort_keys=True)


def convert_control_mapping_to_markdown_view(control_by_config_rule_filename):

    control_by_config_rule = json.load(open(control_by_config_rule_filename, "r"))

    mappings_file_content = f"# AWS Config Compliance Mappings ({datetime.date.today()})\n"
    mappings_file_content += "This content is generated, sourced from public AWS documentation which is Creative Commons licensed.\n"
    for config_rule_name, control_details in control_by_config_rule.items():
        aws_docs_link = "Manual process check" if "(Process Check)" in config_rule_name else f"See also [AWS docs for rule](https://docs.aws.amazon.com/config/latest/developerguide/{config_rule_name}.html)\n"
        mappings_file_content += f"""
## {config_rule_name}\n
{aws_docs_link}

### Guidance

{control_details['controls'][0]['control_guidance']}

### Applicable Security Controls

"""
        for control in control_details["controls"]:
            security_framework = list(filter(lambda f: f.aws_name == control["framework"], supported_frameworks))[0]
            control_id = control["control_id"]
            mappings_file_content += f"- [{security_framework.display_name} - {control_id}]({security_framework.extract_link_from_control(security_framework.aws_name, control_id)}) ({control['control_description']})\n"

    with open("config_rule_security_controls.md", "w") as mappings_file:
        mappings_file.write(mappings_file_content)

def main():
    tmp_cache_file = "framework_mappings.json"
    cache_config_conformance_packs(tmp_cache_file)
    control_by_config_rule_filename = "frontend/src/controls_by_config_rule.json"
    version_filename = "frontend/src/version.json"
    group_by_config_rule(tmp_cache_file, control_by_config_rule_filename, version_filename)
    convert_control_mapping_to_markdown_view(control_by_config_rule_filename)


if __name__ == "__main__":
    main()