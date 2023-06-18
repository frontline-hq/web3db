# Web3 database design

We will outline the design for a web3 database in the following document.

## Attack scenarios and countermeasures

Generally, nodes that behave maliciously will be banned from the network

The attack scenarios:

-   **Spam**
    A malicious node might try to insert many fake entries into the database -> Rate limiting for changes, Content verification peer

-   **Bad entries**
    Some nodes might try to insert entries that don't follow the database / collection schema -> Schema protection

The counter measures:

1.  **Rate limiting for changes**
    Rate limiting changes would require each change to include a timestamp and the signature of the issuer. The problem is that peers can lie about when their change was created (set the time to the past) or peers can potentially be offline for a long time and try to binge-sync all their changes once they come online. That is why there is no way for other peers to actually verify the timestamp. We have some options:

    -   Every change has to include a proof of work (or proof of stake)
    -   Register a timestamp and personal signature at a central authority which returns a proof of time

    Also have a look at https://rfc.vac.dev/spec/17/

2.  **Content verification peer**
    There can be a central authority / certain peers that can be asked to verify the contents upon syncronization (if the receiving peer or sending peer is connected to the verifying party). Content verification can be setup up to be mandatory.

3.  **Schema protection**
    The database schema is known to each peer and can therefore be verified by each peer.

## Requirements

### 1. Database schema

All the entries in the database have to follow a certain schema.

The schema contains:

-   Information on the structure and types of the allowed data.
-   Information on the permission that certain actors have (w, u/g, o) on subsets of the schema. This information can also dynamically depend on the specific data contained in the subset of a schema.

The schema guarantees:

-   The datas compliance with the schema is guaranteed by **Countermeasure #3** (peers only sync changes that comply to the schema).
-   That each data change is checked for the actors permissions to issue this type of change (E.g. if an `UPDATE` change is incoming: does the author of the change have `UPDATE` permissions). This check for permissions is carried out by the checking function for the specific permission stored in the schema (see "Access control - permissions")

### 2. Local first / local persistance

The database works local first. That means the data is persisted in the browser by some means (IndexedDB, localstorage, etc...)

### 3. P2P replication

The replication of the database is facilitated in a p2p manner. We differentiate between two types of nodes:

-   "distributor" nodes are nodes that sync every piece of data they can find in the network
-   "receiver" nodes are nodes that only sync the data that they need / that they request

The replication mechanism has to enable this differentiation.

**Replication mechanism requirements:**

-   Automatic peer discovery and (re)connection
-   Customizable logic to decide what data is synced by which node
-   Peer banning & unbanning based on counter measures for attack scenarios. Each peer should keep an internal record of peers that misbehave. A banned peer should be unbanned after a certain time period. It is expected of each peer to exercise due diligence. Peers that forward malicious changes without checking them will be punished regardless.

**NOTES:**

Note that replication in p2p systems can not be guaranteed as there might be subnets in the network that malishiously resist replicating certain changes to other peers.

-   A newly `CREATE`d entry might only reach certain nodes (due to availabilty or malicious non-propagation)
-   A requested `DELETE` of a certain piece of information might either not be propagated or some nodes might lie about `DELETE`ing every backup of the information. E.g. even though the `DELETE` truthfully propagates through the whole network, some node might have copied the information to an offline store. We can discard this scenario as it is not specific to decentralized systems.

### 4. Access control

Access control is realized by encrypting data. (w = world, u/g = user/group, o = owner)

-   Ownership

    We denote ownership by associating each entry with an ownership table similar to unix: `u/g = public_key_1, public_key_2` and `o = public_key_owner`
    ... Changing the list of public keys associated to either `u/g` or `o` (ownership transfer) can only be done by the current owner (`o`).

-   Permissions (CRUD)

    Permissions are actor specific and stored in the database schema. They can be represented in a manner similar to unix permissions, e.g as `R(w) - RUD(u/g) - CRUD(o)`. `READ` permissions rely on encryption whereas `CREATE`, `DELETE` and `UPDATE` permissions rely on the database schema to be enforced. Note, that `DELETE`s contrary to `CREATE`s are n

    -   `READ`: An actor can read data that was encrypted with the actors public key.
    -   `CREATE`, `UPDATE` and `DELETE`: These permissions are controlled by the database schema. Similar to postgres RLS, these permissions are controlled by a function that decides whether a change can be incorporated or not.

### 5. Database metadata

Each piece of data has a set of metadata:

-   ownership information (see "Access control - ownership")

### 6. Conflict resolution

If multiple parties in the distributed system try to write to the same piece of data, we need a mechanism that correctly orders these writes and eventually leads to the same state in

### 7. Sparse downloading / query downloading

Download only the subset of data satisfying a query

## Feasiblity study

### holepunch.to

1.  **Database schema** ❌
    A database schema can easily be introduced by the app logic by checking the values that are retrieved upon retrieval and terminating retrieval as soon as a check fails to match the schema.
2.  **Local first / local persistance** ❌
    Can be implemented by storing the database in indexedDB
3.  **P2P replication** ✅
    -   Automatic peer discovery and (re)connection ✅
        Hyperswarm enables ["finding and connecting to peers who are interested in a "topic.""](https://github.com/holepunchto/hyperswarm#usage)
    -   Customizable logic to decide what data is synced by which node ✅
        Possible but depends more on the database design than the underlying tech
    -   Peer banning & unbanning ✅
        Possible [`peerInfo.ban(banStatus = false)`](https://github.com/holepunchto/hyperswarm#peerinfobanbanstatus--false)
4.  **Access control** ❌
    -   Ownership ❌
        Ownership of entries is associated with each entries metadata and is therefore more a topic for the database design itself than the underlying tech. It could be implemented by adding a table that maps each entry in the database to it's ownership information.
    -   Permissions (CRUD) ❌
        There is no native way to control CRUD rights in holepunch.
        (Encryption)[https://github.com/holepunchto/hypercore#const-core--new-hypercorestorage-key-options] can be enabled for one public key, which provides `READ` rights to the owner of the corresponding private key.
        The rest of these rights are controlled by hardcoded functions in the database schema and tied to ownership.
5.  **Database metadata** TBC
6.  **Conflict resolution** TBC
7.  **Sparse downloading / query downloading** ✅
    Hyperbee supports sparse downloading: ["It works with sparse cores, only a small subset of the full core is downloaded to satisfy your queries."](https://github.com/holepunchto/hyperbee#usage)
