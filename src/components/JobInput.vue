<script setup lang="ts">
import { reactive } from "vue";
import HighlightSegment from "./HighlightSegment.vue";
import { runJobWithInfo } from "../common/helper";

const emit = defineEmits<{
  (e: 'runningStatus', status: boolean): void
}>();


const jobInfo = reactive({
  resDescUrl: "",
  numCompAgent: 0,
  caMergeStrategy: "union",
  protocol: "shamir",
  compJob: "sum",
  dataSize: 0,
});

const mwemInfo = reactive({
  numBins: 10,
  binSize: 2,
  epsilon: 2,
  T: 30,
})

function mwemToArgs() {
  return {
    playerExtraArgs: [mwemInfo.numBins, mwemInfo.binSize, mwemInfo.epsilon, mwemInfo.T],
    clientExtraArgs: [mwemInfo.numBins, mwemInfo.binSize],
  };
}

function getExtraArgs() {
  if (jobInfo.compJob == "mwem") {
    return mwemToArgs();
  }
  return {};
}

async function onSubmitUserJobInput() {
    emit("runningStatus", true);
  const info = {
    ...jobInfo,
    ...getExtraArgs(),
  };
  await runJobWithInfo(info);
    emit("runningStatus", false);
}
</script>

<template>
  <HighlightSegment>
    <v-container id="job-input" class="panel">
      <div id="mpc-job-info" class="row">
        <v-form id="mpc-job-form">
          <v-text-field label="URL to resource description (data sources)" id="res_desc" type="url"
            v-model="jobInfo.resDescUrl"></v-text-field>
          <v-text-field label="Number of computation agents to use" id="num_comp_agent" type="number"
            v-model.number="jobInfo.numCompAgent"></v-text-field>
          <v-radio-group label="Computation agent merge strategy" inline v-model="jobInfo.caMergeStrategy">
            <v-radio label="Intersection" value="intersection"></v-radio>
            <v-radio label="Union" value="union"></v-radio>
          </v-radio-group>
          <v-radio-group label="Protocol" inline v-model="jobInfo.protocol">
            <v-radio label="Shamir" value="shamir"></v-radio>
            <v-radio label="MASCOT" value="mascot"></v-radio>
            <v-radio label="Cowgear" value="cowgear"></v-radio>
            <v-radio label="Chaigear" value="chaigear"></v-radio>
          </v-radio-group>
          <v-radio-group label="Computation job" inline v-model="jobInfo.compJob">
            <v-radio label="Sum" value="sum"></v-radio>
            <v-radio label="Multiply" value="multiply"></v-radio>
            <v-radio label="Average" value="average"></v-radio>
            <v-radio label="MWEM" value="mwem"></v-radio>
            <v-radio label="MWEM (Histogram input)" value="mwem-histo"></v-radio>
          </v-radio-group>
          <v-text-field label="Number of data in each input" type="number"
            v-model.number="jobInfo.dataSize"></v-text-field>
          <template v-if="jobInfo.compJob == 'mwem'">
            <v-text-field label="Number of bins" type="number"
              v-model.number="mwemInfo.numBins"></v-text-field>
            <v-text-field label="Bin size" type="number"
              v-model.number="mwemInfo.binSize"></v-text-field>
            <v-text-field label="Epsilon" type="number"
              v-model.number="mwemInfo.epsilon"></v-text-field>
            <v-text-field label="T (number of iterations)" type="number"
              v-model.number="mwemInfo.T"></v-text-field>
          </template>
          <v-btn type="submit" block @click.prevent="onSubmitUserJobInput()">Run</v-btn>
        </v-form>
      </div>
    </v-container>
  </HighlightSegment>
</template>
