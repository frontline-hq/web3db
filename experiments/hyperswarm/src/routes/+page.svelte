<script>
	import { joinAsClient, joinAsServer } from '../lib/connectivity';
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
	const dataArray = [];
	let mode = 'client';
</script>

<div style="display: flex; padding: 40px;">
	<Form
		on:submit={(event) => {
			event.preventDefault();
			const formData = new FormData(event.target);
			if (formData.mode === 'client') {
				joinAsClient(formData.topic, dataArray);
			} else {
				joinAsServer(formData.topic, formData.message, dataArray);
			}
		}}
		method="post"
		style="width:50%; margin-right:40px;"
	>
		<FormGroup legendText="Swarm topic">
			<TextInput required name="topic" placeholder="Enter topic to swarm for" />
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
				placeholder="Enter a message to send in the DHT"
			/>
		</FormGroup>
		<Button type="submit">Join</Button>
	</Form>
	<StructuredList>
		<StructuredListHead>
			<StructuredListRow head>
				<StructuredListCell head>Column A</StructuredListCell>
				<StructuredListCell head>Column B</StructuredListCell>
				<StructuredListCell head>Column C</StructuredListCell>
			</StructuredListRow>
		</StructuredListHead>
		<StructuredListBody>
			<StructuredListRow>
				<StructuredListCell noWrap>Row 1</StructuredListCell>
				<StructuredListCell>Row 1</StructuredListCell>
				<StructuredListCell>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc dui magna, finibus id tortor
					sed, aliquet bibendum augue. Aenean posuere sem vel euismod dignissim. Nulla ut cursus
					dolor. Pellentesque vulputate nisl a porttitor interdum.
				</StructuredListCell>
			</StructuredListRow>
			<StructuredListRow>
				<StructuredListCell noWrap>Row 2</StructuredListCell>
				<StructuredListCell>Row 2</StructuredListCell>
				<StructuredListCell>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc dui magna, finibus id tortor
					sed, aliquet bibendum augue. Aenean posuere sem vel euismod dignissim. Nulla ut cursus
					dolor. Pellentesque vulputate nisl a porttitor interdum.
				</StructuredListCell>
			</StructuredListRow>
			<StructuredListRow>
				<StructuredListCell noWrap>Row 3</StructuredListCell>
				<StructuredListCell>Row 3</StructuredListCell>
				<StructuredListCell>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc dui magna, finibus id tortor
					sed, aliquet bibendum augue. Aenean posuere sem vel euismod dignissim. Nulla ut cursus
					dolor. Pellentesque vulputate nisl a porttitor interdum.
				</StructuredListCell>
			</StructuredListRow>
		</StructuredListBody>
	</StructuredList>
</div>
