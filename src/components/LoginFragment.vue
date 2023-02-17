<script setup lang="ts">
import { onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { SOLID_IDENTITY_PROVIDERS } from "@/common/consts";
import { useSessionStore } from "@/stores/session";
import HighlightSegment from "./HighlightSegment.vue";

const identityProvider = ref("");

const sessionStore = useSessionStore();

const { isLoggedIn } = storeToRefs(sessionStore);

onMounted(() => {
  sessionStore.handleRedirectAfterLogin();
});
</script>

<template>
  <HighlightSegment>
    <template v-if="isLoggedIn">
      <v-container>
        <p>Welcome {{ sessionStore.session.info.webId }}</p>
        <v-btn @click.prevent="sessionStore.logout()">Logout</v-btn>
      </v-container>
    </template>
    <template v-else>
      <v-container>
        <v-row>
          <v-col lg="8">
            <v-text-field
              v-model="identityProvider"
              label="Solid identity provider"
            ></v-text-field>
          </v-col>
          <v-col lg="4">
            <v-btn @click="sessionStore.login(identityProvider)">Log in</v-btn>
          </v-col>
        </v-row>
        <v-list lines="two">
          <template
            v-for="([idp, label], index) in SOLID_IDENTITY_PROVIDERS"
            :key="index"
          >
            <v-list-item
              :title="label"
              :subtitle="idp"
              @click="
                identityProvider = idp;
                $emit('login', idp);
              "
            ></v-list-item>
          </template>
        </v-list>
      </v-container>
    </template>
  </HighlightSegment>
</template>
