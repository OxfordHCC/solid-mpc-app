MPC Solid App

----------------------------------



This application is a Solid App for performing MPC over decentralized resources.



To use it, you need a list of resources, and the resource owners should have set up correct permission to allow reading from the encryption servers. See later section for details.



## Run app as development server

```
npm run build && npm run start
```



## User action flow

This app should be straightforward to use with necessary data/resources. The user (of this app) needs to do the following:

1. (Optional) Log in to their WebID, to obtain permission to read constraint material
   
   - The "material" here refers to the resource descriptor

2. Input the URL to the resource descripton
   
   - This describes the available resources to use in MPC
   
   - The resource descripton should be in turtle format following the structure stated below

3. Choose the MPC computation to run for the resources

4. Run the computation



### Resource description

The resource description describes the available / chosen resources to use in the MPC computation. That contains two main parts of the information:

1. `urn:solid:mpc#data`: Data URL

2. `urn:solid:mpc#webid`: Configuration of data owner (e.g. WebID document)



The data URL is intuitive to understand. It does not need to be readable by public (and is not expected to), but should have the appropriate permission for the decentralized MPC architecture (especially, for the encryption server, see below). The configuration of data owner specifies the trusted encryption agents and computation agents, and should be readable by at least the user using the Solid MPC App.



Each entry can be a `urn:solid:mpc#:MPCSource`, but not mandatory. The resource description should have a list of such entries, bundled as `urn:solid:mpc#MPCSourceSpec`, and each entry is linked with `urn:solid:mpc#source`. Example looks like this:



```turtle
@prefix : <urn:solid:mpc#>.

:sources a :MPCSourceSpec;
  :source :src1, :src2.

:src1 a :MPCSource;
  :webid <https://uri/to/webid1>;
  :data <https://uri/to/data1>.


:src2 a :MPCSource;
  :webid <https://uri/to/webid2>;
  :data <https://uri/to/webid2>.
```



## Data owner action flow

The data owner(s) should set up the appropriate configuration before any user can use the Solid MPC App. The data owners do not need to interact with this app.



In general, they need to set up the following:

1. Configuration of trusted encryption agents and computation agents (and the permission of this configuration).

2. Permission for data file, to allow encryption agents to read;



### Configuration

The configuration contains two sets of information:

1. Trusted encryption agents, who can read the raw data and securely send encrypted forms of the data to computation agents;

2. Trusted computation agents, who can receive the encrypted data from encryption agents, perform MPC, and send result data to computation agents.



A configuration looks like this:

```turtle
@prefix : <urn:solid:mpc#>

[]
    :trustedComputationServer
        [ schema:url "http://localhost:8010" ],
        [ schema:url "http://localhost:8011" ],
        [ schema:url "http://localhost:8012" ];
    :trustedEncryptionServer
        [ schema:url "http://localhost:8000" ],
        [ schema:url "http://localhost:8001" ].
```



### Permission for data file

The data files are not expected to be readable by the general public, which is the reason why we want to use MPC.

However, because the Solid Pod server does not possess the capability to perform custom computation tasks, we need an external machine (server) for that. That is the encryption agent.



The data provider needs to give the encryption agent(s) permission to read the data file. Each encryption agent is identified by a WebID, so the data provider should give read permission for the data to that WebID. This is the same as giving permission to a real user identified by a WebID. If you trust multiple encryption agents, each of them should be given the permission.
