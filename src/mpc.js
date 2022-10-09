import { getDefaultSession, fetch } from "@inrupt/solid-client-authn-browser"
import { QueryEngine } from "@comunica/query-sparql-solid"

const jobInfoForm = document.getElementById("mpc-job-form");

// For information
const textEncSrvs = document.getElementById("enc-srvs");
const textCompSrvs = document.getElementById("comp-srvs");
const textAllocate = document.getElementById("allocate");
const textResPlayer = document.getElementById("res-player");
const textResClient = document.getElementById("res-client");
const textResultClient = document.getElementById("result-client");
const textResult = document.getElementById("result");
// For information

const myEngine = new QueryEngine();

const re_hostname = new RegExp('https?://([^:/]+)(:[0-9]+)?');

async function onSubmitUserJobInput(form) {
    textEncSrvs.value = "";
    textCompSrvs.value = "";
    textAllocate.value = "";
    textResPlayer.value = "";
    textResClient.value = "";
    textResultClient.value = "";
    textResult.value = "";

    const computation_id = "compute_1";
    let res_desc_url = form.res_desc.value;
    const num_computation_server = parseInt(form.num_comp_agent.value);
    const protocol = form.comp_protocol.value;
    const comp_job = form.comp_job.value;
    let res_desc = await getResourceDescription(res_desc_url);

    let listOfTrustedComputationAgents = []
    let computation_desc = [];

    for (const [index, [webid, data]] of res_desc.entries()) {
        const encryption_servers = await getTrustedEncryptionServers(webid);
        const server_index = Math.floor(Math.random() * encryption_servers.length);
        const enc_srv = encryption_servers[server_index];
        const computation_servers = await getTrustedComputationServers(webid);
        listOfTrustedComputationAgents.push(computation_servers);
        computation_desc.push([index, enc_srv, data]);
        textEncSrvs.value += enc_srv + "\n";
    }

    const method_to_merge_comp_agents = form.merge_comp_agent.value;
    if (method_to_merge_comp_agents != 'intersection' && method_to_merge_comp_agents != 'union') {
        alert("Invalid method to combine computation agents!");
        return ;
    }
    const chosen_comptuation_servers = chooseComputationAgents(num_computation_server, listOfTrustedComputationAgents, method_to_merge_comp_agents);

    textCompSrvs.value = chosen_comptuation_servers.join("\n");

    if (chosen_comptuation_servers.length < num_computation_server) {
        alert("No enough computation servers!");
        return ;
    }

    const num_client = computation_desc.length;

    let computation_server_hosts = [];
    let map_player_place = {};

    let f_get_host = function (server_url, port) {
        const srv_hostname = re_hostname.exec(server_url)[1];
        return `${srv_hostname}:${port}`;
    }

    for (const [player_id, computation_server] of chosen_comptuation_servers.entries()) {
        const response = await requestComputaionPlayer(computation_server);
        if (!response.ok) {
            alert(`Error on player ${player_id}: ${response.status} ${response.statusText}`);
            return;
        }
        const { player_place_id, port } = await response.json();

        const host = f_get_host(computation_server, port);
        computation_server_hosts.push(host);
        map_player_place[player_id] = player_place_id;

        textAllocate.value += `${player_place_id}: ${port}\n`;
    }

    for (const [player_id, computation_server] of chosen_comptuation_servers.entries()) {
        const response = dispatchComputationJob(computation_server, computation_id, player_id, protocol, num_client, comp_job, computation_server_hosts, map_player_place[player_id]);

        response.then(function (v) {
            v.text().then(function (t) {
                textResPlayer.value += `${player_id}: ${t}\n`;
            }, function () {
                textResPlayer.value += `${player_id}: ${v.status} ${v.statusText}\n`
            })
        })

    }

    for (const [client_id, encryption_server, data] of computation_desc) {
        const response = dispatchEncryptionJob(computation_id, client_id, encryption_server, comp_job, computation_server_hosts, data);
        response.then(function (v) {
            v.text().then(function (t) {
                const client_uuid = JSON.parse(t);
                textResClient.value += `${client_id}: ${client_uuid}\n`;
                queryAndDisplayClientResult(encryption_server, client_uuid, client_id);
            }, function () {
                textResClient.value += `${client_id}: ${v.status} ${v.statusText}\n`;
            })
        })
    }
}

async function getResourceDescription(res_desc_url) {
    const session = getDefaultSession();
    const bindingsStream = await myEngine.queryBindings(`
      PREFIX : <urn:solid:mpc#>

      SELECT ?webid ?data WHERE {
        ?spec a :MPCSourceSpec;
          :source ?s.
        ?s :webid ?webid;
          :data ?data.
      } LIMIT 100`, {
          sources: [res_desc_url],
          '@comunica/actor-http-inrupt-solid-client-authn:session': session,
      });

    const bindings = await bindingsStream.toArray();

    let data = [];

    for (const pair of bindings) {
        data.push([pair.get("webid").value, pair.get("data").value]);
    }

    return data;
}

async function getTrustedEncryptionServers(webid_url) {
    const session = getDefaultSession();
    const bindingsStream = await myEngine.queryBindings(`
      PREFIX : <urn:solid:mpc#>
      PREFIX schema: <http://schema.org/>

      SELECT ?server WHERE {
        ?s :trustedEncryptionServer ?server_spec.
        ?server_spec schema:url ?server.
      } LIMIT 100`, {
          sources: [webid_url],
          '@comunica/actor-http-inrupt-solid-client-authn:session': session,
      });

    const bindings = await bindingsStream.toArray();

    let data = [];

    for (const item of bindings) {
        data.push(item.get("server").value);
    }

    return data;
}

async function getTrustedComputationServers(webid_url) {
    const session = getDefaultSession();
    const bindingsStream = await myEngine.queryBindings(`
      PREFIX : <urn:solid:mpc#>
      PREFIX schema: <http://schema.org/>

      SELECT ?server WHERE {
        ?s :trustedComputationServer ?server_spec.
        ?server_spec schema:url ?server.
      } LIMIT 100`, {
          sources: [webid_url],
          '@comunica/actor-http-inrupt-solid-client-authn:session': session,
      });

    const bindings = await bindingsStream.toArray();

    let data = [];

    for (const item of bindings) {
        data.push(item.get("server").value);
    }

    return data;
}

async function getEncryptionJobCode(job) {
    const code_url = (await import(`./assets/${job}-client.py`)).default;
    const response = await fetch(code_url);
    return await response.text();
}

async function getComputationJobCode(job) {
    const code_url = (await import(`./assets/${job}-player.mpc`)).default;
    const response = await fetch(code_url);
    return await response.text();
}

function chooseComputationAgents(num_computation_server, listOfTrustedComputationAgents, method_to_merge_comp_agents) {
    let available_computation_servers = new Set();

    if (method_to_merge_comp_agents == 'intersection') {
        // Intersection of all trusted computation agents
        for (const [index, computation_servers] of listOfTrustedComputationAgents.entries()) {
            if (index == 0) {
                computation_servers.forEach(function (e) {
                    available_computation_servers.add(e);
                })
            } else {
                available_computation_servers = new Set([...computation_servers].filter(i => available_computation_servers.has(i)));
            }
        }
    } else if (method_to_merge_comp_agents == 'union') {
        for (const [index, computation_servers] of listOfTrustedComputationAgents.entries()) {
            for (const comp_server of computation_servers) {
                available_computation_servers.add(comp_server);
            }
        }
    }

    let chosen_comptuation_servers = [];

    for (const [index, server] of [...available_computation_servers].entries()) {
        if (index >= num_computation_server)
            break;
        chosen_comptuation_servers.push(server);
    }

    return chosen_comptuation_servers;
}

async function dispatchEncryptionJob(computation_id, client_id, encryption_server, job, computation_servers, data_url) {
    const job_code = await getEncryptionJobCode(job);
    return await fetch(`${encryption_server}/client`,{
        method: 'PUT',
        headers:{
            'Content-Type':'application/json'
        },
        body: JSON.stringify({
            computation_id: computation_id,
            client_id: client_id,
            data_uri: data_url,
            client_code: job_code,
            player_servers: computation_servers,
        })
    });
}

async function requestComputaionPlayer(computation_server) {
    const response = await fetch(`${computation_server}/allocate_player`, {
        method: 'PUT',
    })
    return response;
}

async function dispatchComputationJob(computation_server, computation_id, player_id, protocol, num_client, job, computation_servers, player_place_id) {
    const job_code = await getComputationJobCode(job);
    return await fetch(`${computation_server}/player`,{
        method: 'PUT',
        headers:{
            'Content-Type':'application/json'
        },
        body: JSON.stringify({
            computation_id: computation_id,
            player_id: player_id,
            protocol: protocol,
            num_client: num_client,
            player_code: job_code,
            player_servers: computation_servers,
            player_place_id: player_place_id,
        })
    });
}

async function queryClientResult(encryption_server, client_uuid) {
    return await fetch(`${encryption_server}/client/${client_uuid}?` + new URLSearchParams({
        blocking: true
    }), {
        method: 'GET'
    });
}

async function queryAndDisplayClientResult(encryption_server, client_uuid, client_id) {
    await new Promise(r => setTimeout(r, 2000));
    const response = await queryClientResult(encryption_server, client_uuid);
    const result_client = await response.text();
    try {
        const { return_code, output } = JSON.parse(result_client);
        textResultClient.value += `${client_id}: ${return_code} ${output}\n`;
        if (client_id == 0) {
            textResult.value = `${output}`;
        }
    } catch (error) {
        textResultClient.value += `${client_id}: ${result_client}\n`;
    }
}

jobInfoForm.onsubmit = function () {
    onSubmitUserJobInput(this);
    return false;
};
