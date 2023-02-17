import { getDefaultSession, fetch } from "@inrupt/solid-client-authn-browser"
import { overwriteFile, getSourceUrl } from "@inrupt/solid-client";
import { universalAccess } from "@inrupt/solid-client";

const textResFile = document.getElementById("res_file");
const textDummyDataDir = document.getElementById("dummy_data_dir");
const textDummyData = document.getElementById("dummy_data");
const textDummyDataCount = document.getElementById("count_dummy_data");
const textEncAgentCount = document.getElementById("count_enc_agent");
const textEncAgentWebid = document.getElementById("enc_agent_webid");
const textAppUserWebid = document.getElementById("app_user_webid");
// const buttonWriteToPod = document.getElementById("write-to-pod");

const COMPUTATION_SERVERS = [ "http://192.168.0.2:8000", "http://192.168.0.3:8000", "http://192.168.0.4:8000" ];


async function onRunBenchmarkPressed() {
    const resFileURL = textResFile.value;
    const containerURL = textDummyDataDir.value;
    let f_f_url = (i) => {
        return `${containerURL}/user-${i}-data.txt`;
    }
    let f_p_url = (i) => {
        return `${containerURL}/user-${i}-pref.ttl`;
    }
    const listOfNumberOfDataProviders = textDummyDataCount.value.split(" ").map((e) => parseInt(e));
    const listOfNumberOfEncryptionServers = textEncAgentCount.value.split(" ").map((e) => parseInt(e));
    const encryptionAgentWebIds = textEncAgentWebid.value.split("\n").map(item => item.trim());
    const mpcAppUserWebIds = textAppUserWebid.value.split("\n").map(item => item.trim());
    const fileContent = textDummyData.value;
    const solidFetch = getDefaultSession().fetch;

}

async function runBenchmarks(listOfNumberOfDataProviders) {
    const maxNumberOfDataProviders = Math.max(...listOfNumberOfDataProviders);
    for (const numberOfEncryptionServers of listOfNumberOfEncryptionServers) {
        for (let i = 0; i < maxNumberOfDataProviders; i++) {
            const dataFileURL = f_f_url(i);
            const prefFileURL = f_p_url(i);
            const prefFileContent = genPrefFileContent(i, numberOfEncryptionServers, COMPUTATION_SERVERS);
            await createDummyData(dataFileURL, fileContent, prefFileURL, prefFileContent, solidFetch);
        }
        for (const numberOfDataProviders of listOfNumberOfDataProviders) {
            let resources = [];
            for (let i = 0; i < numberOfDataProviders; i++) {
                const dataFileURL = f_f_url(i);
                const prefFileURL = f_p_url(i);
                resources.push([dataFileURL, prefFileURL]);
            }
            writeDataResourceFile(resFileURL, resources, solidFetch);
            const computation_id = crypto.randomUUID()
            const res_desc_url = resFileURL;
            const num_computation_server = 3;
            const protocol = "shamir";
            const comp_job = "sum";
            await runJob(computation_id, res_desc_url, num_computation_server, protocol, comp_job, solidFetch);
        }
    }
}

export function genPrefFileContent(index, addressOfEncryptionServers, addressOfComputationServers) {
    let content = `
@prefix schema: <http://schema.org/>.
<#myPref>
    <urn:solid:mpc#trustedComputationServer>
`;

    content += addressOfComputationServers.map(e => `[ schema:url "${e}" ]`).join(", ") + ";";

    content += `
    <urn:solid:mpc#trustedEncryptionServer>
    `;

    content += addressOfEncryptionServers.map(e => `[ schema:url "${e}" ]`).join(", ") + ".";

    return content;
}

export async function createDummyData(dataFileURL, dataFileContent, prefFileURL, prefFileContent, fetch) {
    await writeFileToPod(dataFileURL, dataFileContent, fetch, "text/plain");
    await writeFileToPod(prefFileURL, prefFileContent, fetch, "text/turtle");
}

async function writeFileToPod(targetFileURL, fileContent, fetch, type ) {
    try {
        const file = new Blob([fileContent], { type: type });
        const savedFile = await overwriteFile(  
            targetFileURL,                              // URL for the file.
            file,
            { contentType: file.type, fetch: fetch }    // mimetype if known, fetch from the authenticated session
        );
        console.log(`File saved at ${getSourceUrl(savedFile)}`);

    } catch (error) {
        console.error(error);
    }
}

export async function setPermissionForEncryptionAgents(targetURL, encryptionAgentWebIds, mpcAppUserWebIds, fetch) {
    encryptionAgentWebIds.forEach((agent) => {
        allowAgentRead(targetURL, agent, fetch);
    });
    mpcAppUserWebIds.forEach((agent) => {
        allowAgentRead(targetURL, agent, fetch);
    });
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

    writeFileToPod(targetURL, content, fetch, "text/turtle");
}

function allowAgentRead(targetURL, agent, fetch) {
    universalAccess.setAgentAccess(
        targetURL,         // Resource
        agent,     // Agent
        { read: true, },          // Access object
        { fetch: fetch }                         // fetch function from authenticated session
    ).then((newAccess) => {
        logAccessInfo(agent, newAccess, targetURL);
    });
}

function logAccessInfo(agent, agentAccess, resource) {
    console.log(`For resource::: ${resource}`);
    if (agentAccess === null) {
        console.log(`Could not load ${agent}'s access details.`);
    } else {
        console.log(`${agent}'s Access:: ${JSON.stringify(agentAccess)}`);
    }
}

// buttonWriteToPod.onclick = function () {
//     onWriteDummyDataPressed();
// }
