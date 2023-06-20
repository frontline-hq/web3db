import DHT from '@hyperswarm/dht-relay';
import Stream from '@hyperswarm/dht-relay/ws';
import Hyperswarm from 'hyperswarm';
import { Buffer } from 'buffer';
import { writable } from 'svelte/store';
import b4a from 'b4a';

export const logs = writable([]);

const addToLogs = (entry) => {
	logs.update(($oldLogs) => [...$oldLogs, entry]);
};

function createSwarm() {
	const ws = new WebSocket('wss://dht1-relay.leet.ar:49443');
	const dht = new DHT(new Stream(true, ws));
	const swarm = new Hyperswarm({ dht });
	return swarm;
}

export async function joinAsClient(topic) {
	const swarm = createSwarm();
	swarm.on('connection', (conn, info) => {
		addToLogs({ type: 'Client progress report', message: 'Client established connection.' });
		console.log(info);
		conn.on('data', (data) => {
			console.log(b4a.toString(data));
			addToLogs({ type: 'Client received data', message: b4a.toString(data) });
		});
	});
	const topicBuffer = Buffer.alloc(32).fill(topic);
	addToLogs({ type: 'Client progress report', message: `Joining topic "${topic}"...` });
	swarm.join(topicBuffer, { server: false, client: true });
	await swarm.flush();
	addToLogs({ type: 'Client progress report', message: `Flushed.` });
}

export async function joinAsServer(topic, message) {
	const swarm = createSwarm();
	swarm.on('connection', (conn, info) => {
		console.log(`message "${message}" written.`);
		console.log(info);
		addToLogs({ type: 'Server progress report', message: 'Server established connection.' });
		addToLogs({ type: 'Server emitted message', message });
		conn.write(message);
		conn.end();
	});
	const topicBuffer = Buffer.alloc(32).fill(topic);
	addToLogs({ type: 'Server progress report', message: `Joining topic "${topic}"...` });
	const discovery = swarm.join(topicBuffer, { server: true, client: false });
	await discovery.flushed();
	addToLogs({ type: 'Server progress report', message: `Flushed.` });
}
