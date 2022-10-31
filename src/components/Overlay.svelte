<script>
    export let engine;

    function vinner() {
        if(engine.points > engine.bot_points) return true;
        else return false;
    }
</script>



<div class="container">
    <div class="card">
        {#if vinner()}
            <h1 id="title">Du vant {sessionStorage.getItem("username")}!</h1>
        {:else}
            <h1 id="title">Prøv igjen!</h1>
        {/if}
        <img src="media/image2.png" alt="" id="logo"/>
        <div class="bottom">
            <p id="points">Poeng: {engine.points}</p>
            <p>Beste: {localStorage.getItem("beste")}</p>
        </div>
        <button id="restart" on:click="{() => {window.location.href = "/game"}}">RESTART</button>
    </div>
</div>



<style>
    .container {
        position: absolute;
        width: 100vw;
        height: 100vh;
        background-color: rgb(0, 0, 0, 0.7);
        z-index: 3;
        backdrop-filter: blur(5px);
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .card {
        width: 400px;
        height: 350px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: white;
        border-radius: 20px;
        padding: 50px;
    }

    #title {
        font-size: 45px;
        text-align: center;
        margin-top: 0;
    }

    #beste {
        font-size: 20px;
    }

    .bottom {
        display: flex;
        justify-content: space-around;
        align-items: center;
        font-size: 20px;
        width: 300px;
        border-radius: 20px;
        box-shadow: 4px 5px 20px;
    }

    #logo {
        width: 70%;
        padding-bottom: 25px;
    }

    #restart {
        width: 300px;
        height: 40px;
        background-color: var(--yellow);
        border: none;
        border-radius: 15px;
        color: white;
        font-size: 16px;
        font-family: var(--font);
        margin-top: 20px;
        transition: all .1s ease-in-out;
    }

    #restart:hover {
        background-color: var(--orange);
        cursor: pointer;
    }
</style>
