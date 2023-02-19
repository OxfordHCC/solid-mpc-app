<script setup lang="ts">
import { ref } from "vue";
import JobInput from "../components/JobInput.vue";
import RunningInfo from "../components/RunningInfo.vue";

const running = ref(false);
</script>

<template>
    <h2>Input job information</h2>

    <JobInput @running-status="status => { running = status }" />

    <v-progress-linear v-if="running"
      indeterminate height="10" striped></v-progress-linear>

    <RunningInfo />
</template>