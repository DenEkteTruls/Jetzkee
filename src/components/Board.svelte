
<script>
    export let engine;
</script>



<div id="container">
    <div class="dizeholder hidden">
        {#each engine.dizes as dice}
            <img class="dice" id={dice} src="media/{dice}.png" alt=""/>
        {/each}    
    </div>
    <div class="dizeholder">
        {#each engine.chosen_list as chosen}
            <img class="dice" on:click={() => {engine.remove_chosen(chosen); engine = engine;}} id={chosen} src="media/{chosen}.png" alt=""/>
        {/each}
    </div>
    <div class="dizeholder">
        {#each engine.dizes as dice}
            <img class="dice" on:click={() => {engine.new_chosen(dice); engine = engine;}} id={dice} src="media/{dice}.png" alt=""/>
        {/each}
    </div>
</div>



<style>
    #container {
        background-color: #AFE3D8;
        height: 77%;
        width: 95%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 2.5% 0;
        border-radius: 20px;
        box-shadow: 0px 0px 20px 3px #afe3d8c4;
    }

    .dizeholder {
        display: flex;
        flex-direction: row;
        height: 80px;
        width: 100%;
        float: left;
        justify-content:space-evenly;
        align-items: center;
    }

    .hidden {
        visibility: hidden;
    }

    .dice {
        width: 80px;
        cursor: pointer;
        transition: all 0.1s ease-in-out;
    }

    .dice:hover {
        transform: scale(1.03);
    }
</style>