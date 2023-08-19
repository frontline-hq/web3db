<script>
	import { getDrive, sendDrive } from '../lib/connectivity-v2';
	import { logs } from '../lib/connectivity-v1';
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
		StructuredListBody
	} from 'carbon-components-svelte';
	let mode = 'client';
	let topic = '';
	let connectionResult;
</script>

<div style="display: flex; padding: 40px;">
	<div style="width:50%; margin-right:40px;">
		<Form
			on:submit={(event) => {
				event.preventDefault();
				if (mode === 'client') {
					connectionResult = getDrive(topic);
				} else {
					connectionResult = sendDrive(topic);
				}
			}}
			method="post"
		>
			<FormGroup legendText="Swarm topic">
				<TextInput
					required
					name="topic"
					placeholder="Enter recipients address here (pub key or email)"
					bind:value={topic}
				/>
			</FormGroup>
			<FormGroup legendText="Join swarm as ...">
				<RadioButtonGroup bind:selected={mode}>
					<RadioButton name="mode" labelText="Client" value="client" />
					<RadioButton name="mode" labelText="Server" value="server" />
				</RadioButtonGroup>
			</FormGroup>
			<Button type="submit">{mode === 'client' ? 'Fetch drive' : 'Create & share drive'}</Button>
		</Form>
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
