<script setup lang="ts">
// import { RouterLink, RouterView } from "vue-router";
import BasicInfo from "./components/BasicInfo.vue";
import LoginFragment from "./components/LoginFragment.vue";

const links = {
  '/': "Home",
  '/benchmark': "Benchmark",
  '/data': "Data",
  '/about': "About",
}
</script>

<template>
  <v-app id="inspire">
    <v-app-bar flat>
      <v-container class="fill-height d-flex align-center">
        <v-avatar
          class="me-10 ms-4"
          color="grey-darken-1"
          size="32"
        ></v-avatar>

        <v-btn
          v-for="(v, k) in links"
          :key="k"
          :to="k"
          variant="text"
        >
          {{ v }}
        </v-btn>

        <v-spacer></v-spacer>

        <v-responsive max-width="260">
          <v-text-field
            density="compact"
            hide-details
            variant="solo"
          ></v-text-field>
        </v-responsive>
      </v-container>
    </v-app-bar>


    <v-main class="bg-grey-lighten-3">
      <v-container>
        <v-row>
          <v-col cols="4">
            <LoginFragment />
          </v-col>

          <v-col cols="8">
            <router-view></router-view>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>