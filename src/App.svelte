<script>
	import router from 'page';

	import Home from './Home.svelte';
	import Login from './Login.svelte';

	let page = Login;

	router("/", () => page = Login);
	router("/game", () => page = Home);

	router.start();
</script>


<svelte:component this={page}/>