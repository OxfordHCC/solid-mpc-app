
export async function runJobWithInfo(jobInfo) {
    const runJob = (await import("../common/mpc")).runJob;
    const { useRunningInfoStore } = await import("@/stores/runningInfoStore");
    const { useSessionStore } = await import("@/stores/session");

    const runningInfoStore = useRunningInfoStore();
    const sessionStore = useSessionStore();

    runningInfoStore.$reset();

    const computation_id = "compute_" + crypto.randomUUID();
    const solidFetch = sessionStore.session.fetch;

    await runJob(computation_id, jobInfo, solidFetch);
}