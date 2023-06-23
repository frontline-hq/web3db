<script>
	import { joinAsClient, joinAsServer, logs, connectedPeers, ownPeerId } from '../lib/connectivity';
	import {
		Form,
		FormGroup,
		TextInput,
		RadioButtonGroup,
		RadioButton,
		Button,
		StructuredList,
		StructuredListHead,
		StructuredListRow,
		StructuredListCell,
		StructuredListBody,
		Tag
	} from 'carbon-components-svelte';
	let mode = 'client';
	let topic = '';
	let dhtMessage = '';
</script>

<div style="display: flex; padding: 40px;">
	<div style="width:50%; margin-right:40px;">
		<Form
			on:submit={(event) => {
				event.preventDefault();
				if (mode === 'client') {
					joinAsClient(topic);
				} else {
					joinAsServer(topic, dhtMessage);
				}
			}}
			method="post"
		>
			<FormGroup legendText="Swarm topic">
				<TextInput
					required
					name="topic"
					placeholder="Enter topic to swarm for"
					bind:value={topic}
				/>
			</FormGroup>
			<FormGroup legendText="Join swarm as ...">
				<RadioButtonGroup bind:selected={mode}>
					<RadioButton name="mode" labelText="Client" value="client" />
					<RadioButton name="mode" labelText="Server" value="server" />
				</RadioButtonGroup>
			</FormGroup>
			<FormGroup legendText="DHT message">
				<TextInput
					required={mode === 'server'}
					disabled={mode === 'client'}
					name="message"
					bind:value={dhtMessage}
					placeholder="Enter a message to send in the DHT"
				/>
			</FormGroup>
			<Button type="submit">Join</Button>
		</Form>
		<div style="margin-top:40px;">
			<h6>Your peer id</h6>
			<Tag style="margin-top:10px;">{$ownPeerId}</Tag>
		</div>
		<div style="margin-top:40px;">
			<h6>List of connected peer ids</h6>
			{#each $connectedPeers as connectedPeer}
				<Tag style="margin-top:10px;">{connectedPeer}</Tag>
			{/each}
		</div>
	</div>
	<StructuredList>
		<StructuredListHead>
			<StructuredListRow head>
				<StructuredListCell head>Type</StructuredListCell>
				<StructuredListCell head>Log</StructuredListCell>
			</StructuredListRow>
		</StructuredListHead>
		{#each $logs as { type, message }}
			<StructuredListBody>
				<StructuredListRow>
					<StructuredListCell>{type}</StructuredListCell>
					<StructuredListCell>{message}</StructuredListCell>
				</StructuredListRow>
			</StructuredListBody>
		{/each}
	</StructuredList>
</div>
