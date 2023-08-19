import DHT from '@hyperswarm/dht-relay';
import Stream from '@hyperswarm/dht-relay/ws';
import Hyperswarm from 'hyperswarm';
import { Buffer } from 'buffer';
import { writable } from 'svelte/store';
import b4a from 'b4a';

export const logs = writable([]);

export const addToLogs = (entry) => {
	logs.update(($oldLogs) => [...$oldLogs, entry]);
};

export function createSwarm() {
	const ws = new WebSocket('wss://dht1-relay.leet.ar:49443');
	const dht = new DHT(new Stream(true, ws));
	const swarm = new Hyperswarm({ dht });
	return swarm;
}

export async function joinAsClient(topic, onData) {
	const swarm = createSwarm();
	swarm.on('connection', (conn) => {
		addToLogs({
			type: 'Client progress report, swarm ' + topic,
			message: 'Client established connection.'
		});
		conn.on('data', async (data) => {
			addToLogs({ type: 'Client received data, swarm ' + topic, message: b4a.toString(data) });
			if (onData) onData(data);
		});
	});
	const topicBuffer = Buffer.alloc(32).fill(topic);
	addToLogs({
		type: 'Client progress report, swarm ' + topic,
		message: `Joining topic "${topic}"...`
	});
	swarm.join(topicBuffer, { server: false, client: true });
	await swarm.flush();
	addToLogs({ type: 'Client progress report, swarm ' + topic, message: `Flushed.` });
}

export async function joinAsServer(topic, message) {
	const swarm = createSwarm();
	swarm.on('connection', (conn) => {
		addToLogs({
			type: 'Server progress report, swarm ' + topic,
			message: 'Server established connection.'
		});
		addToLogs({ type: 'Server emitted message, swarm ' + topic, message });
		conn.write(message);
		conn.end();
	});
	const topicBuffer = Buffer.alloc(32).fill(topic);
	addToLogs({
		type: 'Server progress report, swarm ' + topic,
		message: `Joining topic "${topic}"...`
	});
	swarm.join(topicBuffer, { server: true, client: false });
	await swarm.flush();
	addToLogs({ type: 'Server progress report, swarm ' + topic, message: `Flushed.` });
}
