<script setup lang="ts">
import { reactive } from "vue";
import HighlightSegment from "./HighlightSegment.vue";
import { runJobWithInfo } from "../common/helper";

const jobInfo = reactive({
  resDescUrl: "",
  numCompAgent: 0,
  caMergeStrategy: "union",
  protocol: "shamir",
  compJob: "sum",
});

async function onSubmitUserJobInput() {
  runJobWithInfo(jobInfo);
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
            v-model="jobInfo.numCompAgent"></v-text-field>
          <v-radio-group label="Computation agent merge strategy" inline v-model="jobInfo.caMergeStrategy">
            <v-radio label="Intersection" value="intersection"></v-radio>
            <v-radio label="Union" value="union"></v-radio>
          </v-radio-group>
          <v-radio-group label="Protocol" inline v-model="jobInfo.protocol">
            <v-radio label="Shamir" value="shamir"></v-radio>
            <v-radio label="MASCOT" value="mascot"></v-radio>
          </v-radio-group>
          <v-radio-group label="Computation job" inline v-model="jobInfo.compJob">
            <v-radio label="Sum" value="sum"></v-radio>
            <v-radio label="Multiply" value="multiply"></v-radio>
            <v-radio label="Average" value="average"></v-radio>
          </v-radio-group>
          <v-btn type="submit" block @click.prevent="onSubmitUserJobInput()">Run</v-btn>
        </v-form>
      </div>
    </v-container>
  </HighlightSegment>
</template>
