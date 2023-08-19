import Hyperdrive from 'hyperdrive';
import RAM from 'random-access-memory';
import Corestore from 'corestore';
import { Buffer } from 'buffer';
import { joinAsClient, createSwarm, joinAsServer, addToLogs } from './connectivity-v1';
import b4a from 'b4a';

export async function getDrive(recipientAddress) {
	const store = new Corestore(RAM);
	const swarm = createSwarm();
	let drive;
	// 1. Create 1st swarm for inbox.
	joinAsClient(recipientAddress, async (data) => {
		console.log(data);
		addToLogs({
			type: 'Drive progress report',
			message: `Received drive cores pub key: ${b4a.toString(data)}`
		});
		// Instantiate drive with the received pub key
		drive = new Hyperdrive(store);
		// Replicate the drive with the added core.
		const done = drive.findingPeers();
		swarm.on('connection', async (socket) => {
			addToLogs({
				type: 'Drive progress report',
				message: 'Starting replication.'
			});
			drive.replicate(socket);
			addToLogs({
				type: 'Drive progress report',
				message: 'Fetching drive from remote peer'
			});
			await drive.update({ wait: true });
			addToLogs({
				type: 'Drive progress report',
				message: `Updated drive`
			});
			await drive.download('/');
			addToLogs({
				type: 'Drive progress report',
				message: `Downloaded drive root folder`
			});
			const content = await drive.get('/blob.txt', {
				wait: true
			});
			addToLogs({
				type: 'Drive progress report',
				message: `Content of file "/blob.txt" is ${content}`
			});
			const exists = await drive.exists('/blob.txt');
			addToLogs({
				type: 'Drive progress report',
				message: `Path "/blob.txt" does ${exists ? '' : 'NOT'} exist in drive.`
			});
		});
		addToLogs({
			type: 'Drive progress report',
			message: `Joining topic "${b4a.toString(data)}"...`
		});
		swarm.join(data, { server: false, client: true });
		await swarm.flush();
		addToLogs({ type: 'Drive progress report', message: `Flushed.` });
		done();
	});
	return { swarm, store, drive };
}

export async function sendDrive(recipientAddress) {
	const swarm = createSwarm();
	const store = new Corestore(RAM);
	const drive = new Hyperdrive(store);
	await drive.put('/blob.txt', Buffer.from('example'));
	addToLogs({
		type: 'Drive progress report',
		message: 'Added example file "/blob.txt" containing string "example" to drive.'
	});
	const exists = await drive.exists('/blob.txt');
	addToLogs({
		type: 'Drive progress report',
		message: `Path "/blob.txt" does ${exists ? '' : 'NOT'} exist in drive.`
	});
	swarm.on('connection', (socket) => drive.replicate(socket));
	addToLogs({
		type: 'Drive progress report',
		message: `Joining topic "${b4a.toString(drive.key)}"...`
	});
	swarm.join(drive.key);
	await swarm.flush();
	addToLogs({ type: 'Drive progress report', message: `Flushed.` });
	await joinAsServer(recipientAddress, drive.key);
	return { swarm, store, drive };
}

// Create and add file to drive

// Announce file on topic of recipient public key and replicate
