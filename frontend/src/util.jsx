/**
 * Returns a CIS CSC v8 link.
 * @param {string} framework
 * @param {string} control
 * @returns {string} - A URL for the specified control.
 */
export function getCisCscV8Link(framework, control) {
  // example https://csf.tools/reference/critical-security-controls/version-8/csc-12/csc-12-2/
  const controlDefs = control.split('.');
  if (controlDefs.length !== 2) {
    throw new Error('Invalid CIS crit v8 control definition');
  }
  return `https://csf.tools/reference/critical-security-controls/version-8/csc-${controlDefs[0]}/csc-${controlDefs[0]}-${controlDefs[1]}/`;
}

/**
 * Returns a NIST 800-171 link (Rev 2).
 * @param {string} framework
 * @param {string} control
 * @returns {string} - A URL for the specified control.
 */
export function getNist800171Link(framework, control) {
  // note implicit use of 800-171 rev 2 here
  let nist_800_171_control_id = "";

  // Adjust the control string if the framework is CMMC 2.0
  if ([
    "cmmc_2.0_level_1",
    "cmmc_2.0_level_2"
  ].includes(framework)) {
    // Control format is "DD.L#-REQ" in these frameworks, so drop the first 5 chars "DD.L#"
    nist_800_171_control_id = control.substring(5);
  } else {
    nist_800_171_control_id = control;
  }

  const parts = nist_800_171_control_id.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid nist 800-171 control definition');
  }

  // e.g. https://csf.tools/reference/nist-sp-800-171/r2/3-1/3-1-3/
  return `https://csf.tools/reference/nist-sp-800-171/r2/${parts[0]}-${parts[1]}/${parts[0]}-${parts[1]}-${parts[2]}/`;
}

/**
 * Returns a NIST 800-53 r5 link.
 * @param {string} framework
 * @param {string} control
 * @returns {string} - A URL for the specified control.
 */
export function getNist80053R5Link(framework, control) {
  // Remove all whitespace
  const withoutSpaces = control.replace(/\s/g, '');
  // Take only the parent control (strip off anything in parentheses)
  const onlyParentControl = withoutSpaces.split('(')[0];
  const parts = onlyParentControl.split('-');

  if (parts.length !== 2) {
    throw new Error(`Invalid nist 800-53-r5 control definition ${control}`);
  }

  const family = parts[0].toLowerCase();
  const id = parts[1];

  // e.g. https://csf.tools/reference/nist-sp-800-53/r5/ir/ir-4/
  return `https://csf.tools/reference/nist-sp-800-53/r5/${family}/${family}-${id}/`;
}


export function getControlLink(framework, control) {
  switch (framework) {
    case 'wa-Reliability-Pillar':
      return "https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html"
    case 'wa-Security-Pillar':
      return "https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html"
    case 'cis_aws_benchmark_level_2':
    case 'cis_aws_benchmark_level_1':
      return "https://www.cisecurity.org/benchmark/amazon_web_services"
    case 'cis-critical-security-controls-v8':
    case 'cis-critical-security-controls-v8-ig2':
    case 'cis-critical-security-controls-v8-ig3':
      return getCisCscV8Link(framework, control);
    case 'cis_top_20':
      return "https://www.cisecurity.org/controls/cis-controls-list"
    case 'cmmc_2.0_level_1':
    case 'cmmc_2.0_level_2':
    case 'nist_800-171':
      return getNist800171Link(framework, control);
    case 'fedramp-low':
    case 'fedramp-moderate':
    case 'fedramp-high-part-1':
    case 'fedramp-high-part-2':
    case 'nist-800-53_rev_5':
      return getNist80053R5Link(framework, control);
    case 'nist_800-172':
      return "https://csrc.nist.gov/pubs/sp/800/172/final"
    default:
      return "https://google.com"
      
    
  }
}

import { BiSolidLock } from "react-icons/bi";
import { GrCompliance } from "react-icons/gr";
import { FcLineChart } from "react-icons/fc";
import { SiTerraform } from "react-icons/si";
import { FcDataBackup } from "react-icons/fc";
import { SiWebauthn } from "react-icons/si";
import { PiDetectiveDuotone } from "react-icons/pi";
import { FaWrench } from "react-icons/fa";
import { GrThreats } from "react-icons/gr";
import { PiNetworkFill } from "react-icons/pi";
import { FaRegHandshake } from "react-icons/fa";
import { FaAws } from "react-icons/fa6";
import { GiUsaFlag } from "react-icons/gi";

export function getControlIcon(framework, control) {
    //  bail early on framework that dont have varying control
    if (framework.includes("Pillar")) return <FaAws />
    // these are all in 800-53 language
    if (control.control_id.startsWith('AC')) return <BiSolidLock />
    if (control.control_id.startsWith('AU')) return <GrCompliance />
    if (control.control_id.startsWith('CA')) return <FcLineChart />
    if (control.control_id.startsWith('CM')) return <SiTerraform />
    if (control.control_id.startsWith('CP')) return <FcDataBackup />
    if (control.control_id.startsWith('IA')) return <SiWebauthn />
    if (control.control_id.startsWith('IR')) return <PiDetectiveDuotone />
    if (control.control_id.startsWith('MA')) return <FaWrench />
    if (control.control_id.startsWith('RA')) return <GrThreats />
    if (control.control_id.startsWith('SC')) return <PiNetworkFill />
    if (control.control_id.startsWith('SI')) return <FaRegHandshake />

    if (framework.includes("nist")) return <GiUsaFlag />
}