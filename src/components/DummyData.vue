<script setup lang="ts">
import { reactive, computed, ref } from 'vue';
import { useSessionStore } from '@/stores/session';
import {
    genPrefFileContent,
    createDummyData,
    setPermissionForEncryptionAgents,
    writeDataResourceFile,
} from '../common/benchmark';

const emit = defineEmits<{
  (e: 'runningStatus', status: boolean): void
}>();

const sessionStore = useSessionStore();

// const DEFAULT_COMPUTATION_SERVERS = [ "http://192.168.0.2:8000", "http://192.168.0.3:8000", "http://192.168.0.4:8000" ];
// const DEFAULT_ENCRYPTION_SERVERS = [ "http://192.168.0.1:8000", "http://192.168.0.1:8001" ];
const DEFAULT_COMPUTATION_SERVERS = [ "http://127.0.0.1:8010", "http://127.0.0.1:8011", "http://127.0.0.1:8012" ];
const DEFAULT_ENCRYPTION_SERVERS = [ "http://127.0.0.1:8000", "http://127.0.0.1:8001" ];

const METHODS = {
    TEXT: 'text',
    RANDOM: 'random',
};

const form = reactive({
    resDescUrl: "https://renyuneyun.solidcommunity.net/mpc/benchmark/test/resources.ttl",
    dummyDataDir: "https://renyuneyun.solidcommunity.net/mpc/benchmark/test/dummy-data",
    dummyDataMethod: "text",
    numUser: 2,
    encAgents: "https://renyuneyun.solidweb.org/profile/card#me",
    encSrvs: DEFAULT_ENCRYPTION_SERVERS.join('\n'),
    compSrvs: DEFAULT_COMPUTATION_SERVERS.join('\n'),
    appUser: "https://renyuneyun.solidcommunity.net/profile/card#me",
});

const dummyDataText = ref("");
const dummyDataRandom = reactive({
    min: 2,
    max: 2,
    count: 1,
})

function sToArr(stringInput: string) {
    return stringInput.split('\n').map(s => s.trim());
}

function randomIntFromInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function getDataF() {
    if (form.dummyDataMethod == METHODS.TEXT) {
        return (i: number) => {
            return dummyDataText.value;
        }
    } else if (form.dummyDataMethod == METHODS.RANDOM) {
        return (i: number) => {
            const data = [];
            for (let i = 0; i < dummyDataRandom.count; i++) {
                data.push(randomIntFromInterval(dummyDataRandom.min, dummyDataRandom.max));
            }
            return data.join('\n');
        }
    }
    throw new Error("No dummy data method seleted???");
}

async function onSubmitForm() {
    emit("runningStatus", true);

    const p_list = [];

    const info = {
        resFileUrl: form.resDescUrl,
        containerURL: form.dummyDataDir,
        data: getDataF(),
        numDataProvider: form.numUser,
        encAgents: sToArr(form.encAgents),
        encSrvs: sToArr(form.encSrvs),
        compSrvs: sToArr(form.compSrvs),
        appUsers: sToArr(form.appUser),
    }
    console.log(info);

    let f_f_url = (i: number) => {
        return `${info.containerURL}/user-${i}-data.txt`;
    }
    let f_p_url = (i: number) => {
        return `${info.containerURL}/user-${i}-pref.ttl`;
    }
    const solidFetch = sessionStore.session.fetch;

    let resources = [];
    for (let i = 0; i < info.numDataProvider; i++) {
        const dataFileURL = f_f_url(i);
        const prefFileURL = f_p_url(i);
        const prefFileContent = genPrefFileContent(i, info.encSrvs, info.compSrvs);
        const data = info.data(i);
        const p = createDummyData(dataFileURL, data, prefFileURL, prefFileContent, solidFetch);
        p_list.push(p);
        resources.push([dataFileURL, prefFileURL]);
    }
    p_list.push(setPermissionForEncryptionAgents(info.containerURL, info.encAgents, info.appUsers, solidFetch)); // Set permission to container instead of each file, due to solid-client won't create ACL file if it does not exist.
    p_list.push(writeDataResourceFile(info.resFileUrl, resources, solidFetch));

    console.log("Waiting for dummy data created")
    await Promise.allSettled(p_list);
    console.log("Finished creating dummy data")
    emit("runningStatus", false);
}
</script>

<template>
    <v-form>
        <v-text-field label="URL to store resource description file" type="url"
            v-model="form.resDescUrl"></v-text-field>

        <v-text-field label="Directory for dummy data" type="url"
            v-model="form.dummyDataDir"></v-text-field>

        <v-label>Dummy data</v-label>
        <v-tabs
          v-model="form.dummyDataMethod"
        >
          <v-tab :value="METHODS.TEXT">Text</v-tab>
          <v-tab :value="METHODS.RANDOM">Random</v-tab>
        </v-tabs>

        <v-card variant="outlined">
        <v-card-text>
        <v-window v-model="form.dummyDataMethod">
            <v-window-item :value="METHODS.TEXT">
                <v-textarea label="Content"
                    v-model="dummyDataText"></v-textarea>
            </v-window-item>

            <v-window-item :value="METHODS.RANDOM">
                <v-text-field label="Min" hint="Inclusive" type="number"
                    v-model.number="dummyDataRandom.min"></v-text-field>
                <v-text-field label="Max" hint="Inclusive" type="number"
                    v-model.number="dummyDataRandom.max"></v-text-field>
                <v-text-field label="Number of integers" type="number"
                    v-model.number="dummyDataRandom.count"></v-text-field>
            </v-window-item>
        </v-window>
        </v-card-text>
        </v-card>

        <v-text-field label="Number of dummy users" type="number"
            v-model.number="form.numUser"></v-text-field>

        <v-textarea label="Encryption Agent WebIDs" type="url"
            v-model="form.encAgents"></v-textarea>

        <v-textarea label="MPC App User WebIDs" type="url"
            v-model="form.appUser"></v-textarea>

        <v-textarea label="Server URLs for Encryption Agents" type="url"
            v-model="form.encSrvs"></v-textarea>

        <v-textarea label="Server URLs for Computation Agents" type="url"
            v-model="form.compSrvs"></v-textarea>

        <v-btn @click.prevent="onSubmitForm" >
            Write To Pod
        </v-btn>
    </v-form>
</template>