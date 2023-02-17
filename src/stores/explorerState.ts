import { defineStore } from "pinia";

export const useExplorerStore = defineStore("explorer", {
  state: () => {
    return {
      applicaionBaseUrl: window.location.href,
    };
  },

  getters: {
    loginRedirectUrl: (state) => {
      return state.applicaionBaseUrl;
    },
  },
});
