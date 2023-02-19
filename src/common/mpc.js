import { QueryEngine } from "@comunica/query-sparql-solid";
import { useRunningInfoStore } from "@/stores/runningInfoStore";
import { useSessionStore } from "@/stores/session";
import { computed } from "vue";

const myEngine = new QueryEngine();

const re_hostname = new RegExp("https?://([^:/]+)(:[0-9]+)?");

const runningInfoStore = useRunningInfoStore();
const info = runningInfoStore;

function solidFetch(...args) {
  const sessionStore = useSessionStore();
  return sessionStore.session.fetch(...args);
}

const sessionStore = useSessionStore();
const session = computed(() =>
  sessionStore.isLoggedIn ? sessionStore.session : undefined
);

export async function runJob(
  computation_id,
  jobInfo,
  fetch
) {
  const {
    resDescUrl: res_desc_url,
    caMergeStrategy: method_to_merge_comp_agents,
    protocol,
    numCompAgent: num_computation_server,
    compJob: comp_job,
    dataSize,
    clientExtraArgs,
    playerExtraArgs,
   } = jobInfo;

  console.log("  Preparing");

  let res_desc = await getResourceDescription(res_desc_url);

  // console.log(["res_desc", res_desc]);

  info.numDp = res_desc.length;
  // console.log(`NumDP: ${info.numDp} :: ${res_desc.length}`);

  let listOfTrustedComputationAgents = [];
  let computation_desc = [];

  let f_collect_info = async (index, pref, data) => {
    const encryption_servers = await getTrustedEncryptionServers(pref);
    const server_index = Math.floor(Math.random() * encryption_servers.length);
    const enc_srv = encryption_servers[server_index];
    const computation_servers = await getTrustedComputationServers(pref);
    listOfTrustedComputationAgents.push(computation_servers);
    computation_desc.push([index, enc_srv, data]);
    info.encSrv.push(enc_srv);
  };

  let jobs_collect_info = [];
  res_desc.forEach(([pref, data], index) => {
    jobs_collect_info.push(f_collect_info(index, pref, data));
  });
  await Promise.all(jobs_collect_info);

  if (
    method_to_merge_comp_agents != "intersection" &&
    method_to_merge_comp_agents != "union"
  ) {
    alert("Invalid method to combine computation agents!");
    return;
  }

  const chosen_comptuation_servers = chooseComputationAgents(
    num_computation_server,
    listOfTrustedComputationAgents,
    method_to_merge_comp_agents
  );

  info.compSrv = chosen_comptuation_servers;

  if (chosen_comptuation_servers.length < num_computation_server) {
    alert("No enough computation servers!");
    return;
  }

  const num_client = computation_desc.length;

  let computation_server_hosts = [];
  let map_player_place = {};

  let f_get_host = function (server_url, port) {
    const srv_hostname = re_hostname.exec(server_url)[1];
    return `${srv_hostname}:${port}`;
  };

  for (const [
    player_id,
    computation_server,
  ] of chosen_comptuation_servers.entries()) {
    const response = await requestComputaionPlayer(computation_server);
    if (!response.ok) {
      alert(
        `Error on player ${player_id}: ${response.status} ${response.statusText}`
      );
      return;
    }
    const { player_place_id, port } = await response.json();

    const host = f_get_host(computation_server, port);
    computation_server_hosts.push(host);
    map_player_place[player_id] = player_place_id;

    info.allocate[player_place_id] = port;
  }

  const p_ca_result_list = [];

  const f_run_comptuation_jobs = async () => {
    const promises = [];
    for (const [
      player_id,
      computation_server,
    ] of chosen_comptuation_servers.entries()) {
      const response_p = dispatchComputationJob(
        computation_server,
        computation_id,
        player_id,
        protocol,
        num_client,
        comp_job,
        computation_server_hosts,
        map_player_place[player_id],
        dataSize,
        playerExtraArgs,
      );

      response_p.then(function (v) {
        const p_res = v.text().then(
          function (t) {
            info.resPlayer[player_id] = t;
          },
          function () {
            info.resPlayer[player_id] = `${v.status} ${v.statusText}`;
          }
        );

        p_ca_result_list.push(p_res);
      });

      promises.push(response_p);
    }
    return await Promise.all(promises);
  };

  const f_run_encryption_jobs = async () => {
    const promises = [];
    for (const [client_id, encryption_server, data] of computation_desc) {
      const response = dispatchEncryptionJob(
        computation_id,
        client_id,
        encryption_server,
        comp_job,
        computation_server_hosts,
        data,
        dataSize,
        clientExtraArgs,
      );
      const p = response.then(function (v) {
        return v.text().then(
          async function (t) {
            const client_uuid = JSON.parse(t);
            info.resClient[client_id] = `${client_uuid}`;
            if (client_id == 0)
              await queryAndDisplayClientResult(
                encryption_server,
                client_uuid,
                client_id
              );
          },
          function () {
            info.resClient[client_id] = `${v.status} ${v.statusText}`;
          }
        );
      });
      promises.push(p);
    }
    return await Promise.all(promises);
  };

  console.log("  Deploying and running");

  return await Promise.all([
    f_run_encryption_jobs(),
    f_run_comptuation_jobs(),
    ...p_ca_result_list,
  ]);
}

async function getResourceDescription(res_desc_url) {
  const bindingsStream = await myEngine.queryBindings(
    `
      PREFIX : <urn:solid:mpc#>

      SELECT ?pref ?data WHERE {
        ?spec a :MPCSourceSpec;
          :source ?s.
        ?s :pref ?pref;
          :data ?data.
      }`,
    {
      sources: [res_desc_url],
      "@comunica/actor-http-inrupt-solid-client-authn:session": session.value,
    }
  );

  const bindings = await bindingsStream.toArray();

  let data = [];

  for (const pair of bindings) {
    data.push([pair.get("pref").value, pair.get("data").value]);
  }

  return data;
}

async function getTrustedEncryptionServers(pref_url) {
  const bindingsStream = await myEngine.queryBindings(
    `
      PREFIX : <urn:solid:mpc#>
      PREFIX schema: <http://schema.org/>

      SELECT ?server WHERE {
        ?s :trustedEncryptionServer ?server_spec.
        ?server_spec schema:url ?server.
      } LIMIT 100`,
    {
      sources: [pref_url],
      "@comunica/actor-http-inrupt-solid-client-authn:session": session.value,
    }
  );

  const bindings = await bindingsStream.toArray();

  let data = [];

  for (const item of bindings) {
    data.push(item.get("server").value);
  }

  return data;
}

async function getTrustedComputationServers(pref_url) {
  const bindingsStream = await myEngine.queryBindings(
    `
      PREFIX : <urn:solid:mpc#>
      PREFIX schema: <http://schema.org/>

      SELECT ?server WHERE {
        ?s :trustedComputationServer ?server_spec.
        ?server_spec schema:url ?server.
      } LIMIT 100`,
    {
      sources: [pref_url],
      "@comunica/actor-http-inrupt-solid-client-authn:session": session.value,
    }
  );

  const bindings = await bindingsStream.toArray();

  let data = [];

  for (const item of bindings) {
    data.push(item.get("server").value);
  }

  return data;
}

async function getEncryptionJobCode(job) {
  const code_url = (await import(`@/assets/${job}-client.py`)).default;
  const response = await fetch(code_url);
  return await response.text();
}

async function getComputationJobCode(job) {
  const code_url = (await import(`@/assets/${job}-player.mpc`)).default;
  const response = await fetch(code_url);
  return await response.text();
}

function chooseComputationAgents(
  num_computation_server,
  listOfTrustedComputationAgents,
  method_to_merge_comp_agents
) {
  let available_computation_servers = new Set();

  if (method_to_merge_comp_agents == "intersection") {
    // Intersection of all trusted computation agents
    for (const [
      index,
      computation_servers,
    ] of listOfTrustedComputationAgents.entries()) {
      if (index == 0) {
        computation_servers.forEach(function (e) {
          available_computation_servers.add(e);
        });
      } else {
        available_computation_servers = new Set(
          [...computation_servers].filter((i) =>
            available_computation_servers.has(i)
          )
        );
      }
    }
  } else if (method_to_merge_comp_agents == "union") {
    for (const [
      index,
      computation_servers,
    ] of listOfTrustedComputationAgents.entries()) {
      for (const comp_server of computation_servers) {
        available_computation_servers.add(comp_server);
      }
    }
  }

  let chosen_comptuation_servers = [];

  for (const [index, server] of [...available_computation_servers].entries()) {
    if (index >= num_computation_server) break;
    chosen_comptuation_servers.push(server);
  }

  return chosen_comptuation_servers;
}

async function dispatchEncryptionJob(
  computation_id,
  client_id,
  encryption_server,
  job,
  computation_servers,
  data_url,
  data_size,
  extra_args,
) {
  const job_code = await getEncryptionJobCode(job);
  return await solidFetch(`${encryption_server}/client`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      computation_id: computation_id,
      client_id: client_id,
      data_uri: data_url,
      client_code: job_code,
      player_servers: computation_servers,
      data_size: data_size,
      extra_args: extra_args,
    }),
  });
}

async function requestComputaionPlayer(computation_server) {
  // console.log(["fetch", solidFetch]);
  const response = await solidFetch(`${computation_server}/allocate_player`, {
    method: "PUT",
  });
  return response;
}

async function dispatchComputationJob(
  computation_server,
  computation_id,
  player_id,
  protocol,
  num_client,
  job,
  computation_servers,
  player_place_id,
  data_size,
  extra_args,
) {
  const job_code = await getComputationJobCode(job);
  return await solidFetch(`${computation_server}/player`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      computation_id: computation_id,
      player_id: player_id,
      protocol: protocol,
      num_client: num_client,
      player_code: job_code,
      player_servers: computation_servers,
      player_place_id: player_place_id,
      data_size: data_size,
      extra_args,
    }),
  });
}

async function queryClientResult(encryption_server, client_uuid) {
  return await solidFetch(
    `${encryption_server}/client/${client_uuid}?` +
      new URLSearchParams({
        blocking: true,
      }),
    {
      method: "GET",
    }
  );
}

async function queryAndDisplayClientResult(
  encryption_server,
  client_uuid,
  client_id
) {
  await new Promise((r) => setTimeout(r, 2000));
  const response = await queryClientResult(encryption_server, client_uuid);
  const result_client = await response.text();
  try {
    const { return_code, output } = JSON.parse(result_client);
    info.resultClient += `${client_id}: ${return_code} ${output}\n`;
    if (client_id == 0) {
      info.result = `${output}`
    }
  } catch (error) {
    info.resultClient += `${client_id}: ${result_client}\n`
  }
}