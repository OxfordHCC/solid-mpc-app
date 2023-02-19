<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import BenchmarkJob from "../components/BenchmarkJob.vue";
import RunningInfo from "../components/RunningInfo.vue";

const iter = reactive({
    curr: 0,
    total: 0,
})
const running = ref(false);

const progress = computed(() => iter.curr * 100 / iter.total);
</script>

<template>
    <h2>Input benchmark job information</h2>

    <BenchmarkJob
        @iter-changed="(curr, total) => { iter.curr = curr + 1; iter.total = total }"
        @running-status="(status) => { running = status }"
        />

    <v-progress-linear v-if="running" v-model="progress" height="10" striped></v-progress-linear>

    <RunningInfo />
</template>