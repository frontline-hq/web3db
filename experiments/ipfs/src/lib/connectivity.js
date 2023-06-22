import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { yamux } from '@chainsafe/libp2p-yamux';
import { bootstrap } from '@libp2p/bootstrap';
//import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
import { tcp } from '@libp2p/tcp';
import { MemoryBlockstore } from 'blockstore-core';
import { MemoryDatastore } from 'datastore-core';
import { createHelia } from 'helia';
import { createLibp2p } from 'libp2p';
import { identifyService } from 'libp2p/identify';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { writable } from 'svelte/store';

export const logs = writable([]);

const addToLogs = (entry) => {
	logs.update(($oldLogs) => [...$oldLogs, entry]);
};

export async function createNode() {
	// the blockstore is where we store the blocks that make up files
	const blockstore = new MemoryBlockstore();

	// application-specific data lives in the datastore
	const datastore = new MemoryDatastore();

	// libp2p is the networking layer that underpins Helia
	const libp2p = await createLibp2p({
		datastore,
		addresses: {
			listen: ['/ip4/127.0.0.1/tcp/0']
		},
		transports: [tcp()],
		connectionEncryption: [noise()],
		streamMuxers: [yamux(), mplex()],
		pubsub: gossipsub({ allowPublishToZeroPeers: true }),
		peerDiscovery: [
			bootstrap({
				list: [
					'/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
					'/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
					'/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
					'/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
				]
			})
			/* pubsubPeerDiscovery({
				interval: 1000
			}) */
		],
		services: {
			identify: identifyService()
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
	node.libp2p.services.pubsub.addEventListener('message', (message) => {
		addToLogs({
			type: 'Client received data',
			message: new TextDecoder().decode(message.detail.data)
		});
		console.log(`${message.detail.topic}:`, new TextDecoder().decode(message.detail.data));
	});
	node.libp2p.services.pubsub.subscribe(topic);
}

export async function joinAsServer(topic, message) {
	const node = await createNode();
	node.libp2p.services.pubsub.addEventListener('message', (message) => {
		addToLogs({
			type: 'Server emitted message',
			message: new TextDecoder().decode(message.detail.data)
		});
		console.log(`${message.detail.topic}:`, new TextDecoder().decode(message.detail.data));
	});
	node.libp2p.services.pubsub.publish(topic, new TextEncoder().encode(message));
}
