import { defineStore } from "pinia";

export const useRunningInfoStore = defineStore("runningInfo", {
  state: () => {
    return {
      numDp: undefined as number | undefined,
      encSrv: [],
      compSrv: [],
      allocate: {},
      resPlayer: {},
      resClient: {},
      resultClient: "",
      result: "",
    };
  },
});
