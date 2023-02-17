<script setup lang="ts">
import HighlightSegment from "./HighlightSegment.vue";
import { useRunningInfoStore } from "../stores/runningInfoStore";
import { computed } from "vue";

const info = useRunningInfoStore();

const textEncSrvs = computed(() => info.encSrv?.join("\n"));
const textCompSrvs = computed(() => info.compSrv?.join("\n"));
const textAllocate = computed(() => JSON.stringify(info.allocate));
const textResPlayer = computed(() => JSON.stringify(info.resPlayer));
const textResClient = computed(() => JSON.stringify(info.resClient));
const textResultClient = computed(() => JSON.stringify(info.resultClient));
</script>

<template>
  <HighlightSegment>
    <v-container id="request-response" class="panel">
      <v-textarea
        id="num-dp"
        label="Number of data providers"
        v-model="info.numDp"
      ></v-textarea>
      <!-- <label for="num-dp">Number of data providers</label>
      <textarea id="num-dp" cols="10"></textarea>
      <br /> -->
      <v-textarea
        id="enc-srvs"
        label="Encryption Servers"
        v-model="textEncSrvs"
      ></v-textarea>
      <!-- <label for="enc-srvs">Encryption Servers</label>
      <textarea id="enc-srvs" rows="4" cols="50"></textarea>
      <br /> -->
      <v-textarea
        id="comp-srvs"
        label="Computation Servers"
        v-model="textCompSrvs"
      ></v-textarea>
      <!-- <label for="comp-srvs">Computation Servers</label>
      <textarea id="comp-srvs" rows="3" cols="50"></textarea>
      <br /> -->
      <v-textarea
        id="allocate"
        label="Player allocation status"
        v-model="textAllocate"
      ></v-textarea>
      <!-- <label for="allocate">Player allocation status</label>
      <textarea id="allocate" rows="3" cols="50"></textarea>
      <br /> -->
      <v-textarea
        id="res-player"
        label="Player dispatch status"
        v-model="textResPlayer"
      ></v-textarea>
      <!-- <label for="res-player">Player dispatch status</label>
      <textarea id="res-player" rows="3" cols="50"></textarea>
      <br /> -->
      <v-textarea
        id="res-client"
        label="Client dispatch status"
        v-model="textResClient"
      ></v-textarea>
      <!-- <label for="res-client">Client dispatch status</label>
      <textarea id="res-client" rows="3" cols="50"></textarea>
      <br /> -->
      <v-textarea
        id="result-client"
        label="Client computation status"
        v-model="textResultClient"
      ></v-textarea>
      <!-- <label for="result-client">Client computation status</label>
      <textarea id="result-client" rows="3" cols="50"></textarea>
      <br /> -->
      <v-textarea
        id="result"
        label="Computation result"
        v-model="info.result"
      ></v-textarea>
      <!-- <label for="result">Computation result</label>
      <textarea id="result" rows="3" cols="50"></textarea> -->
    </v-container>
  </HighlightSegment>
</template>
