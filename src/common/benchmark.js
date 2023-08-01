import { getDefaultSession, fetch } from "@inrupt/solid-client-authn-browser";
import { overwriteFile, getSourceUrl } from "@inrupt/solid-client";
import { universalAccess } from "@inrupt/solid-client";

export async function runBenchmark(jobInfos, numIter, mpcJs) {
  for (let i = 0; i < jobInfos.length; i++) {
    const jobInfo = jobInfos[i];
    console.log(`Running benchmark #${i}: ${jobInfo.resDescUrl}`);

    await runBenchmark_iter(jobInfo, numIter, fetch, mpcJs);
  }
}

async function runBenchmark_iter(jobInfo, numIter, solidFetch, mpcJs) {
  if (!mpcJs) {
    mpcJs = "./mpc.js";
  }
  const runJob = (await import(mpcJs /* @vite-ignore */)).runJob;
  for (let i = 0; i < numIter; i++) {
    console.log(` Iter #${i}`);
    const computation_id = "compute_" + crypto.randomUUID();

    await runJob(computation_id, jobInfo, solidFetch);
  }
}

export function genPrefFileContent(
  index,
  addressOfEncryptionServers,
  addressOfComputationServers
) {
  let content = `
@prefix schema: <http://schema.org/>.
<#myPref>
    <urn:solid:mpc#trustedComputationServer>
`;

  content +=
    addressOfComputationServers.map((e) => `[ schema:url "${e}" ]`).join(", ") +
    ";";

  content += `
    <urn:solid:mpc#trustedEncryptionServer>
    `;

  content +=
    addressOfEncryptionServers.map((e) => `[ schema:url "${e}" ]`).join(", ") +
    ".";

  return content;
}

export async function createDummyData(
  dataFileURL,
  dataFileContent,
  prefFileURL,
  prefFileContent,
  fetch
) {
  await writeFileToPod(dataFileURL, dataFileContent, fetch, "text/plain");
  await writeFileToPod(prefFileURL, prefFileContent, fetch, "text/turtle");
}

async function writeFileToPod(targetFileURL, fileContent, fetch, type) {
  try {
    const file = new Blob([fileContent], { type: type });
    const savedFile = await overwriteFile(
      targetFileURL, // URL for the file.
      file,
      { contentType: file.type, fetch: fetch } // mimetype if known, fetch from the authenticated session
    );
    console.log(`File saved at ${getSourceUrl(savedFile)}`);
  } catch (error) {
    console.error(error);
  }
}

export async function setPermissionForEncryptionAgents(
  targetURL,
  encryptionAgentWebIds,
  mpcAppUserWebIds,
  fetch
) {
  return await Promise.allSettled(
    [...encryptionAgentWebIds, ...mpcAppUserWebIds].map((agent) =>
      allowAgentRead(targetURL, agent, fetch)
    )
  );
}

export async function writeDataResourceFile(targetURL, resources, fetch) {
  let content = `
@prefix : <urn:solid:mpc#>.
`;

  let rList = [];
  for (const [i, [dataFileURL, prefFileURL]] of resources.entries()) {
    const r_id = `:src${i}`;
    rList.push(r_id);
    content += `
${r_id} a :MPCSource;
  :pref <${prefFileURL}>;
  :data <${dataFileURL}>.
        `;
  }

  content += `
:sources a :MPCSourceSpec;
  :source `;
  content += rList.join(", ");
  content += ".";

  await writeFileToPod(targetURL, content, fetch, "text/turtle");
}

async function allowAgentRead(targetURL, agent, fetch) {
  const newAccess = await universalAccess.setAgentAccess(
    targetURL,
    agent,
    { read: true },
    { fetch: fetch } // fetch function from authenticated session
  );
  logAccessInfo(agent, newAccess, targetURL);
}

function logAccessInfo(agent, agentAccess, resource) {
  console.log(`For resource::: ${resource}`);
  if (agentAccess === null) {
    console.log(`Could not load ${agent}'s access details.`);
  } else {
    console.log(`${agent}'s Access:: ${JSON.stringify(agentAccess)}`);
  }
}