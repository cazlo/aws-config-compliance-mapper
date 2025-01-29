from dataclasses import dataclass
from typing import Callable


@dataclass
class SecurityFramework:
    aws_name: str
    display_name: str
    extract_link_from_control: Callable[[str, str], str] # args should be control, framework


def get_cis_csc_v8_link(framework: str, control: str) -> str:
    # example https://csf.tools/reference/critical-security-controls/version-8/csc-12/csc-12-2/
    control_defs = control.split('.')
    if len(control_defs) != 2:
        raise ValueError('Invalid CIS crit v8 control definition')
    return f"https://csf.tools/reference/critical-security-controls/version-8/csc-{control_defs[0]}/csc-{control_defs[0]}-{control_defs[1]}/"


def get_nist_800_171_link(framework: str, control: str) -> str:
    # note implicit use of 800-171 rev 2 here, as none of the conformance packs map to rev3, nor does cmmc (yet)
    nist_800_171_control_id = ""
    if framework in ["operational-best-practices-for-cmmc_2.0_level_1", "operational-best-practices-for-cmmc_2.0_level_2"]:
        # following text copied from  https://dodcio.defense.gov/Portals/0/Documents/CMMC/ModelOverview_V2.0_FINAL2_20211202_508.pdf:
        # This subsection itemizes the practices for each domain and at each level. Each practice has a
        # practice identification number in the format – DD.L#-REQ – where:
        # • DD is the two-letter domain abbreviation;
        # • L# is the level number; and
        # • REQ is the NIST SP 800-171 Rev 2 or NIST SP 800-172 security requirement number
        nist_800_171_control_id = control[5:]
    else:
        nist_800_171_control_id = control
    parts = nist_800_171_control_id.split('.')
    if len(parts) != 3:
        raise ValueError('Invalid nist 800-171 control definition')
    # target like https://csf.tools/reference/nist-sp-800-171/r2/3-1/3-1-3/
    return f"https://csf.tools/reference/nist-sp-800-171/r2/{parts[0]}-{parts[1]}/{parts[0]}-{parts[1]}-{parts[2]}/"


def get_nist_800_53_r5_link(framework: str, control: str) -> str:
    without_spaces = control.replace(' ', '')
    # control id past initial identifier is inconsistent, e.g.
    #   IR-4(1) indicates control enhancement 1 of IR-4, https://csf.tools/reference/nist-sp-800-53/r5/ir/ir-4/ir-4-1/
    #   CA-7(a)(b) indicates sections of CA-7, https://csf.tools/reference/nist-sp-800-53/r5/ca/ca-7/
    # so closest we can reliably extract is parent control, not any enhancements
    only_parent_control = without_spaces.split('(')[0]
    parts = only_parent_control.split('-')
    if len(parts) != 2:
        raise ValueError(f'Invalid nist 800-53-r5 control definition {control}')
    family = parts[0].lower()
    id = parts[1]
    return f"https://csf.tools/reference/nist-sp-800-53/r5/{family}/{family}-{id}/"


supported_frameworks = [
    SecurityFramework(
        aws_name="operational-best-practices-for-wa-Reliability-Pillar",
        display_name="AWS Well Architected Reliability Pillar",
        extract_link_from_control=lambda _, __: "https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html"
    ),
    SecurityFramework(
        aws_name="operational-best-practices-for-wa-Security-Pillar",
        display_name="AWS Well Architected Security Pillar",
        extract_link_from_control=lambda _, __: "https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html"
    ),
    SecurityFramework(
        aws_name='operational-best-practices-for-cis_aws_benchmark_level_1',
        display_name='CIS AWS Benchmark Level 1',
        extract_link_from_control=lambda _, __: "https://www.cisecurity.org/benchmark/amazon_web_services"
    ),
    SecurityFramework(
        aws_name='operational-best-practices-for-cis_aws_benchmark_level_2',
        display_name='CIS AWS Benchmark Level 2',
        extract_link_from_control=lambda _, __: "https://www.cisecurity.org/benchmark/amazon_web_services"
    ),
    SecurityFramework(
        aws_name='operational-best-practices-for-cis-critical-security-controls-v8',
        display_name='CIS Critical Controls v8',
        extract_link_from_control=get_cis_csc_v8_link
    ),
    SecurityFramework(
        aws_name='operational-best-practices-for-cis-critical-security-controls-v8-ig2',
        display_name='CIS Critical Controls v8 ig2',
        extract_link_from_control=get_cis_csc_v8_link
    ),
    SecurityFramework(
        aws_name='operational-best-practices-for-cis-critical-security-controls-v8-ig3',
        display_name='CIS Critical Controls v8 ig3',
        extract_link_from_control=get_cis_csc_v8_link
    ),
    SecurityFramework(
        aws_name='operational-best-practices-for-cis_top_20',
        display_name='CIS Top 20',
        extract_link_from_control=lambda _, __: "https://www.cisecurity.org/controls/cis-controls-list"
    ),
    SecurityFramework(
        aws_name='operational-best-practices-for-cmmc_2.0_level_1',
        display_name='CMMC 2.0 Level 1',
        extract_link_from_control=get_nist_800_171_link
    ),
    SecurityFramework(
        aws_name='operational-best-practices-for-cmmc_2.0_level_2',
        display_name='CMMC 2.0 Level 2',
        extract_link_from_control=get_nist_800_171_link
    ),
    SecurityFramework(
        aws_name='operational-best-practices-for-nist_800-171',
        display_name='NIST 800-171 (rev2)',
        extract_link_from_control=get_nist_800_171_link
    ),
    SecurityFramework(
        aws_name='operational-best-practices-for-fedramp-low',
        display_name='FedRAMP Low',
        extract_link_from_control=get_nist_800_53_r5_link
    ),
    SecurityFramework(
        aws_name='operational-best-practices-for-fedramp-moderate',
        display_name='FedRAMP Moderate',
        extract_link_from_control=get_nist_800_53_r5_link
    ),
    SecurityFramework(
        aws_name='operational-best-practices-for-fedramp-high-part-1',
        display_name='FedRAMP High',
        extract_link_from_control=get_nist_800_53_r5_link
    ),
    SecurityFramework(
        aws_name='operational-best-practices-for-fedramp-high-part-2',
        display_name='FedRAMP High',
        extract_link_from_control=get_nist_800_53_r5_link
    ),
    SecurityFramework(
        aws_name='operational-best-practices-for-nist-800-53_rev_5',
        display_name='NIST 800-53 rev 5',
        extract_link_from_control=get_nist_800_53_r5_link
    ),
    SecurityFramework(
        aws_name='operational-best-practices-for-nist_800-172',
        display_name='NIST 800-172',
        extract_link_from_control=lambda _, __: "https://csrc.nist.gov/pubs/sp/800/172/final"
    ),
]