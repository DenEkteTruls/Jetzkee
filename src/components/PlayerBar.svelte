<script>
    export let name;
    export let bot;
    export let engine;

    function roll() {
        engine.roll_dize();
    }
</script>


<div class="container">
    <div class="profile-container">
        {#if bot}
            <img src="media/profile2.png" alt=""/>
        {:else}
            <img src="media/profile1.png" alt=""/>
        {/if}
    </div>
    <div class="username-container">
        <p id="username">{name}</p>
    </div>
    <div class="button-container">
        {#if bot} <button/> {:else}
            {#if engine.tries_left > 0}
                <button id="button" on:click={() => {roll()}}>KAST</button>
            {:else}
                <button class="not-cliackable" on:click={() => {roll()}}>KAST</button>
            {/if}
        {/if}
    </div>
</div>


<style>
    .container {
        background-color: white;
        border-radius: 40px;
        width: 90%;
        height: 80px;

        display: grid;
        grid-template-columns: 25% 45% 30%;
    }

    .profile-container {
        height: 80px;
    }

    .profile-container > img {
        position: relative;
        bottom: 43px;
        left: 20px;
        border-radius: 35px;
    }

    .username-container {
        display: flex;
        align-items: center;
        height: 80px;
        padding-left: 25px;
        padding-top: 2px;
        z-index: 1;
    }

    .button-container {
        height: 80px;
        z-index: 2;

        display: flex;
        justify-content: center;
        align-items: center;
    }

    .button-container > button {
        width: 80%;
        height: 60%;
        border-radius: 25px;
        border: none;
        background-color: var(--yellow);
        font-family: var(--font);
        font-size: 16px;
        transition: all .1s ease-in-out;
        color: white;
    }

    #button:hover {
        background-color: var(--orange);
        cursor: pointer;
    }

    .not-cliackable {
        background-color: rgba(163, 163, 163, 0.199) !important;
        cursor: default !important;
    }

    #username {
        font-size: 30px;
    }
</style>
