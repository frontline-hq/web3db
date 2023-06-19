import DHT from '@hyperswarm/dht-relay';
import Stream from '@hyperswarm/dht-relay/ws';
import Hyperswarm from 'hyperswarm';
import { Buffer } from 'buffer';

function createSwarm() {
	const ws = new WebSocket('wss://dht1-relay.leet.ar:49443');
	const dht = new DHT(new Stream(true, ws));
	const swarm = new Hyperswarm({ dht });
	return swarm;
}

export async function joinAsClient(topic, dataArray) {
	const swarm = createSwarm();
	swarm.on('connection', (conn, info) => {
		console.log(info);
		conn.on('data', (data) => {
			console.log(data);
			dataArray.push(data);
		});
	});
	const topicBuffer = Buffer.alloc(32).fill(topic);
	console.log('Joining topic...');
	swarm.join(topicBuffer, { server: false, client: true });
	await swarm.flush();
	console.log('flush finished');
}

export async function joinAsServer(topic, message, dataArray) {
	const swarm = createSwarm();
	swarm.on('connection', (conn, info) => {
		console.log(`message "${message}" written.`);
		console.log(info);
		dataArray.push(message);
		conn.write(message);
		conn.end();
	});
	const topicBuffer = Buffer.alloc(32).fill(topic);
	console.log('Joining topic...');
	const discovery = swarm.join(topicBuffer, { server: true, client: false });
	await discovery.flushed();
	console.log('flush finished');
}
