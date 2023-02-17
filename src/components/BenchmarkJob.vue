<script setup lang="ts">
import { getCurrentInstance, reactive } from "vue";
import HighlightSegment from "./HighlightSegment.vue";
import { runJobWithInfo } from "../common/helper";

const emit = defineEmits<{
  (e: 'iterChanged', curr: number, total: number): void
  (e: 'runningStatus', status: boolean): void
}>();

const info = reactive({
  resDescUrl: "",
  numCompAgent: 3,
  caMergeStrategy: "union",
  protocol: "shamir",
  compJob: "sum",
  numIter: 3,
});

async function onSubmitBenchmarkJobInput() {
    emit("runningStatus", true);
    for (let i = 0; i < info.numIter; i++) {
        emit("iterChanged", i, info.numIter);
        await runJobWithInfo(info);
    }
    emit("runningStatus", false);
}
</script>

<template>
  <HighlightSegment>
    <v-container id="job-input" class="panel">
      <div id="mpc-job-info" class="row">
        <v-form id="mpc-job-form">
          <v-text-field label="URL to resource description (data sources)" id="res_desc" type="url"
            v-model="info.resDescUrl"></v-text-field>
          <v-text-field label="Number of computation agents to use" id="num_comp_agent" type="number"
            v-model.number="info.numCompAgent"></v-text-field>
          <v-radio-group label="Computation agent merge strategy" inline v-model="info.caMergeStrategy">
            <v-radio label="Intersection" value="intersection"></v-radio>
            <v-radio label="Union" value="union"></v-radio>
          </v-radio-group>
          <v-radio-group label="Protocol" inline v-model="info.protocol">
            <v-radio label="Shamir" value="shamir"></v-radio>
            <v-radio label="MASCOT" value="mascot"></v-radio>
          </v-radio-group>
          <v-radio-group label="Computation job" inline v-model="info.compJob">
            <v-radio label="Sum" value="sum"></v-radio>
            <v-radio label="Multiply" value="multiply"></v-radio>
            <v-radio label="Average" value="average"></v-radio>
          </v-radio-group>
          <v-text-field label="Number of iterations" type="number"
            v-model.number="info.numIter"></v-text-field>
          <v-btn type="submit" block @click.prevent="onSubmitBenchmarkJobInput()">Run Benchmark</v-btn>
        </v-form>
      </div>
    </v-container>
  </HighlightSegment>
</template>
