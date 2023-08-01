import { runBenchmark } from "./common/benchmark.js";

const DEFAULT_DESC_URL = "https://renyuneyun.solidcommunity.net/mpc/benchmark/mwem-srv-10/mwem-100-10000/resources.ttl";
const DEFAULT_DATA_SIZE = 100;

function generateJobInfos(resDescUrls, Ts) {
  if (!resDescUrls) {
    resDescUrls = [ DEFAULT_DESC_URL ];
  }
  if (!Ts) {
    Ts = [ 30 ];
  }

  const mwemInfoTemplate = {
    numBins: 10,
    binSize: 2,
    epsilon: 2,
    T: 30,
  };
  const jobInfoTemplate = {
    resDescUrl: DEFAULT_DESC_URL,
    numCompAgent: 3,
    caMergeStrategy: "union",
    protocol: "shamir",
    compJob: "mwem",
    dataSize: DEFAULT_DATA_SIZE,
    ...{
      playerExtraArgs: [
        mwemInfoTemplate.numBins,
        mwemInfoTemplate.binSize,
        mwemInfoTemplate.epsilon,
        mwemInfoTemplate.T,
      ],
      clientExtraArgs: [mwemInfoTemplate.numBins],
    },
  };

  const jobInfos = [];

  for (let T of Ts) {
    const mwemInfo = {
      ...mwemInfoTemplate,
      T: T,
    }
    const jobInfoTemplate1 = {
      ...jobInfoTemplate,
      ...{
        playerExtraArgs: [
          mwemInfo.numBins,
          mwemInfo.binSize,
          mwemInfo.epsilon,
          mwemInfo.T,
        ],
        clientExtraArgs: [mwemInfo.numBins],
      },
    };
    for (let resDescUrlA of resDescUrls) {
      let resDescUrl, dataSize;
      if (Array.isArray(resDescUrlA)) {
        resDescUrl = resDescUrlA[0];
        dataSize = resDescUrlA[1];
      } else {
        resDescUrl = resDescUrlA;
        dataSize = DEFAULT_DATA_SIZE;
      }
      const jobInfo = {
        ...jobInfoTemplate1,
        resDescUrl: resDescUrl,
        dataSize: dataSize,
      };

      jobInfos.push(jobInfo);
    }
  }
  return jobInfos;
}

async function runBenchmarkMWEM() {
  const numIter = 10; // Number of repeats

  const resDescUrls = [
    [
      "https://renyuneyun.solidcommunity.net/mpc/benchmark/mwem-srv-10/mwem-10-10000/resources.ttl",
      1000,
    ],
    [
      "https://renyuneyun.solidcommunity.net/mpc/benchmark/mwem-srv-10/mwem-50-10000/resources.ttl",
      200,
    ],
    [
      "https://renyuneyun.solidcommunity.net/mpc/benchmark/mwem-srv-10/mwem-100-10000/resources.ttl",
      100,
    ],
    [
      "https://renyuneyun.solidcommunity.net/mpc/benchmark/mwem-srv-10/mwem-200-10000/resources.ttl",
      50,
    ],
    [
      "https://renyuneyun.solidcommunity.net/mpc/benchmark/mwem-srv-10/mwem-400-10000/resources.ttl",
      25,
    ],
    [
      "https://renyuneyun.solidcommunity.net/mpc/benchmark/mwem-srv-10/mwem-500-10000/resources.ttl",
      20,
    ],
    [
      "https://renyuneyun.solidcommunity.net/mpc/benchmark/mwem-srv-10/mwem-1000-10000/resources.ttl",
      10,
    ],
    //[
    //  "https://renyuneyun.solidcommunity.net/mpc/benchmark/mwem-srv-10/mwem-10-1000/resources.ttl",
    //  100,
    //],
    //[
    //  "https://renyuneyun.solidcommunity.net/mpc/benchmark/mwem-srv-10/mwem-50-5000/resources.ttl",
    //  100,
    //],
    //[
    //  "https://renyuneyun.solidcommunity.net/mpc/benchmark/mwem-srv-10/mwem-100-10000/resources.ttl",
    //  100,
    //],
    //[
    //  "https://renyuneyun.solidcommunity.net/mpc/benchmark/mwem-srv-10/mwem-200-20000/resources.ttl",
    //  100,
    //],
    //[
    //  "https://renyuneyun.solidcommunity.net/mpc/benchmark/mwem-srv-10/mwem-500-50000/resources.ttl",
    //  100,
    //],
    //[
    //  "https://renyuneyun.solidcommunity.net/mpc/benchmark/mwem-srv-10/mwem-1000-100000/resources.ttl",
    //  100,
    //],
    //[
    //  "https://rui.pod.ewada.ox.ac.uk/mpc/benchmark/mwem-srv-10/mwem-10-10000/resources.ttl",
    //  1000,
    //],
    //[
    //  "https://rui.pod.ewada.ox.ac.uk/mpc/benchmark/mwem-srv-10/mwem-50-10000/resources.ttl",
    //  200,
    //],
    //[
    //  "https://rui.pod.ewada.ox.ac.uk/mpc/benchmark/mwem-srv-10/mwem-100-10000/resources.ttl",
    //  100,
    //],
    //[
    //  "https://rui.pod.ewada.ox.ac.uk/mpc/benchmark/mwem-srv-10/mwem-200-10000/resources.ttl",
    //  50,
    //],
    //[
    //  "https://rui.pod.ewada.ox.ac.uk/mpc/benchmark/mwem-srv-10/mwem-400-10000/resources.ttl",
    //  25,
    //],
    //[
    //  "https://rui.pod.ewada.ox.ac.uk/mpc/benchmark/mwem-srv-10/mwem-500-10000/resources.ttl",
    //  20,
    //],
    //[
    //  "https://rui.pod.ewada.ox.ac.uk/mpc/benchmark/mwem-srv-10/mwem-1000-10000/resources.ttl",
    //  10,
    //],

  ];

  const Ts = [
    10,
    20,
    30,
    40,
    50,
  ];

  const jobInfos = generateJobInfos(undefined, Ts);
  await runBenchmark(jobInfos, numIter, "./mpc-cli.js");
}

runBenchmarkMWEM();
