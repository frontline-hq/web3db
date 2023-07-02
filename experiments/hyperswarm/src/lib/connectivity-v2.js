import DHT from '@hyperswarm/dht-relay';
import Stream from '@hyperswarm/dht-relay/ws';
import Hyperswarm from 'hyperswarm';
import Hyperdrive from 'hyperdrive';
import RAM from 'random-access-memory';
import Corestore from 'corestore';
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
	const store = new Corestore(RAM);
	let drive;
	addToLogs({
		type: 'Client progress report',
		message: 'Holding requests to drive while fetching.'
	});
	swarm.on('connection', (conn, info) => {
		addToLogs({ type: 'Client progress report', message: 'Client established connection.' });
		console.log(info);
		const onerror = (err) => console.error(err);
		conn.setTimeout(15000);
		conn.on('error', onerror);
		conn.once('data', async (data) => {
			console.log(data);
			addToLogs({
				type: 'Client progress report',
				message: `Received drive cores pub key: ${b4a.toString(data)}`
			});
			// Add core to corestore
			/* const core = store.get({ key: data });
			addToLogs({
				type: 'Client progress report',
				message: 'Added received drive core to corestore'
			}); */
			console.log(data);
			drive = new Hyperdrive(store, data);
			addToLogs({ type: 'Client progress report', message: 'Continuing requests to drive.' });
			conn.off('error', onerror);
			// Replicate the drive with the added core.
			drive.replicate(conn);
			addToLogs({
				type: 'Client progress report',
				message: 'Fetching drive from remote peer'
			});
			await drive.update();
			addToLogs({
				type: 'Client progress report',
				message: `Updated drive`
			});
			await drive.download('/');
			addToLogs({
				type: 'Client progress report',
				message: `Downloaded drive root folder`
			});
			const exists = await drive.exists('/blob.txt');
			addToLogs({
				type: 'Client progress report',
				message: `Path "/blob.txt" does ${exists ? '' : 'NOT'} exist in drive.`
			});
		});
	});
	const topicBuffer = Buffer.alloc(32).fill(topic);
	addToLogs({ type: 'Client progress report', message: `Joining topic "${topic}"...` });
	swarm.join(topicBuffer, { server: false, client: true });
	await swarm.flush();
	addToLogs({ type: 'Client progress report', message: `Flushed.` });
	return { swarm, store, drive };
}

export async function joinAsServer(topic) {
	const swarm = createSwarm();
	const store = new Corestore(RAM);
	const drive = new Hyperdrive(store);
	await drive.put('/blob.txt', Buffer.from('example'));
	addToLogs({
		type: 'Server progress report',
		message: 'Added example file "/blob.txt" containing string "example" to drive.'
	});
	const exists = await drive.exists('/blob.txt');
	addToLogs({
		type: 'Server progress report',
		message: `Path "/blob.txt" does ${exists ? '' : 'NOT'} exist in drive.`
	});
	swarm.on('connection', (conn, info) => {
		console.log(info);
		addToLogs({ type: 'Server progress report', message: 'Server established connection.' });
		conn.write(drive.key);
		addToLogs({
			type: 'Server progress report',
			message: `Announced drives pub key: ${b4a.toString(drive.key)}`
		});
		drive.replicate(conn);
		addToLogs({
			type: 'Server progress report',
			message: 'Sharing drive with remote peer'
		});
	});
	const topicBuffer = Buffer.alloc(32).fill(topic);
	addToLogs({ type: 'Server progress report', message: `Joining topic "${topic}"...` });
	const discovery = swarm.join(topicBuffer, { server: true, client: false });
	await discovery.flushed();
	addToLogs({ type: 'Server progress report', message: `Flushed.` });
	return { swarm, store, drive };
}

// Create and add file to drive

// Announce file on topic of recipient public key and replicate
