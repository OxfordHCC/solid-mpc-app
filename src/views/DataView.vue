<script setup lang="ts">
import HighlightSegmentVue from '@/components/HighlightSegment.vue';
import DummyData from '@/components/DummyData.vue';
import { ref } from 'vue';

const running = ref(false);
</script>

<template>
    
    <div>
      <h2>Create dummy resource</h2>
    </div>

  <HighlightSegmentVue>
    <v-container>
      <DummyData @running-status="status => running = status" />
    </v-container>

    <v-progress-linear v-if="running"
      indeterminate height="10" striped></v-progress-linear>

  </HighlightSegmentVue>
</template>
