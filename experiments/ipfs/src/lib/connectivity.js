import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { yamux } from '@chainsafe/libp2p-yamux';
import { bootstrap } from '@libp2p/bootstrap';
//import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
//import { tcp } from '@libp2p/tcp';
import { webSockets } from '@libp2p/websockets';
import { webTransport } from '@libp2p/webtransport';
import * as filters from '@libp2p/websockets/filters';
import { webRTC, webRTCDirect } from '@libp2p/webrtc';
import { circuitRelayTransport, circuitRelayServer } from 'libp2p/circuit-relay';
import { MemoryBlockstore } from 'blockstore-core';
import { MemoryDatastore } from 'datastore-core';
import { createHelia } from 'helia';
import { createLibp2p } from 'libp2p';
import { identifyService } from 'libp2p/identify';
import { autoNATService } from 'libp2p/autonat';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { writable } from 'svelte/store';
import { kadDHT } from '@libp2p/kad-dht';
import { ipniContentRouting } from '@libp2p/ipni-content-routing';

export const logs = writable([]);
export const connectedPeers = writable([]);
export const ownPeerId = writable('unknown');

const addToLogs = (entry) => {
	logs.update(($oldLogs) => [...$oldLogs, entry]);
};

const bootstraps = [
	'/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
	'/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
	'/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
	'/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt',
	'/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ'
];

export async function createNode() {
	// the blockstore is where we store the blocks that make up files
	const blockstore = new MemoryBlockstore();

	// application-specific data lives in the datastore
	const datastore = new MemoryDatastore();

	// libp2p is the networking layer that underpins Helia
	const libp2p = await createLibp2p({
		datastore,
		addresses: {
			listen: ['/webrtc']
		},
		transports: [
			webSockets({
				filter: filters.all
			}),
			webRTC({
				rtcConfiguration: {
					iceServers: [
						{
							urls: ['stun:stun.l.google.com:19302', 'stun:global.stun.twilio.com:3478']
						}
					]
				}
			}),
			webRTCDirect(),
			webTransport(),
			circuitRelayTransport({
				discoverRelays: 1
			})
		],
		connectionEncryption: [noise()],
		streamMuxers: [yamux(), mplex()],
		peerDiscovery: [
			bootstrap({
				interval: 100,
				list: bootstraps
			})
			/* pubsubPeerDiscovery({
				interval: 1000
			}) */
		],
		contentRouters: [ipniContentRouting('https://cid.contact')],
		services: {
			identify: identifyService(),
			autoNAT: autoNATService(),
			pubsub: gossipsub({ allowPublishToZeroPeers: true, emitSelf: true }),
			dht: kadDHT(),
			relay: circuitRelayServer({
				advertise: true
			})
		}
	});

	return await createHelia({
		datastore,
		blockstore,
		libp2p
	});
}

export async function joinAsClient(topic) {
	const node = await createNode();
	ownPeerId.set(node.libp2p.peerId.toString());
	node.libp2p.addEventListener('peer:connect', () => {
		connectedPeers.set(node.libp2p.getPeers().map((peerId) => peerId.toString()));
	});
	node.libp2p.services.pubsub.addEventListener('message', (message) => {
		addToLogs({
			type: 'Client progress report',
			message: `${message.detail.topic}: ${new TextDecoder().decode(message.detail.data)}`
		});
	});
	node.libp2p.services.pubsub.subscribe(topic);
	addToLogs({ type: 'Client progress report', message: `subscribed to topic "${topic}"` });
}

export async function joinAsServer(topic, message) {
	const node = await createNode();
	ownPeerId.set(node.libp2p.peerId.toString());
	node.libp2p.addEventListener('peer:connect', () => {
		connectedPeers.set(node.libp2p.getPeers().map((peerId) => peerId.toString()));
	});
	node.libp2p.services.pubsub.addEventListener('message', (message) => {
		addToLogs({
			type: 'Server progress report',
			message: `${message.detail.topic}: ${new TextDecoder().decode(message.detail.data)}`
		});
	});
	node.libp2p.services.pubsub.subscribe(topic);
	addToLogs({ type: 'Server progress report', message: `subscribed to topic "${topic}"` });
	await node.libp2p.services.pubsub.publish(topic, new TextEncoder().encode(message));
	addToLogs({
		type: 'Server progress report',
		message: `published message "${message}" in topic "${topic}"`
	});
}
