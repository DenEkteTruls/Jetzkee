<script>
    import {Engine} from './components/terning';

    import PlayerBar from './components/PlayerBar.svelte';
    import Board from './components/Board.svelte';
    import Overlay from './components/Overlay.svelte';
    import { not } from 'mathjs';
    
    $: engine = new Engine(5);
    var username = sessionStorage.getItem("username");


    // Skulle gjerne funnet en bedre løsning på dette
    setInterval(() => {
        engine = engine;
    }, 50);


    if(username == undefined || username == '') {
        window.location.href = "/";
    }

    $: board = [
        {'title': 'Enere', 'v1': engine.points_detail[0], 'pot': engine.calculate_points(1), 'v2': 0},
        {'title': 'Toere', 'v1': engine.points_detail[1], 'pot': engine.calculate_points(2),'v2': 0},
        {'title': 'Treere', 'v1': engine.points_detail[2], 'pot': engine.calculate_points(3), 'v2': 0},
        {'title': 'Firere', 'v1': engine.points_detail[3], 'pot': engine.calculate_points(4), 'v2': 0},
        {'title': 'Femere', 'v1': engine.points_detail[4], 'pot': engine.calculate_points(5), 'v2': 0},
        {'title': 'Seksere', 'v1': engine.points_detail[5], 'pot': engine.calculate_points(6), 'v2': 0},
        {'title': 'Liten Straight', 'v1': engine.points_detail[6], 'pot': engine.calculate_points('liten'),  'v2': 0},
        {'title': 'Stor Straight', 'v1': engine.points_detail[7], 'pot': engine.calculate_points('stor'),  'v2': 0},
        {'title': 'Hus', 'v1': engine.points_detail[8], 'pot': engine.calculate_points('hus'),  'v2': 0},
        {'title': 'Sjanse', 'v1': engine.points_detail[9], 'pot': engine.calculate_points('sjanse'),  'v2': 0},
        {'title': 'Yatzy', 'v1': engine.points_detail[10], 'pot': engine.calculate_points('yatzy'),  'v2': 0},
        {'title': 'Totalsum', 'v1': engine.points, 'pot': 0, 'v2': 0}
    ];

    function clicked(title, pot) {

        if(pot == 0) {
            for(let i = 0; i < board.length; i++) {
                if(board[i].title == title) {
                    engine.points_detail[i] = '-';
                }
            }
        } else {
            for(let i = 0; i < board.length; i++) {
                if(board[i].title == title) {
                    engine.points_detail[i] += pot;
                    engine.points += pot;
                }
            }
        }
        engine.new_round();
    }

    function ferdig() {
        localStorage.setItem("beste", engine.points);
        engine.done = true;
    }
</script>



{#if engine.done} <Overlay {engine}/> {/if}



<div class="container">
    <div class="left">
        <PlayerBar name='Bot' bot=true {engine}/>
        <Board engine={engine}/>
        <PlayerBar name={username} {engine}/>
    </div>
    <div class="right">
        <div class="board">
            <table>
                <tr>
                    <th></th> 
                    <th>{username}</th>
                    <th>Bot</th>
                </tr>
                {#each board as nice}
                    <tr>
                        <td>{nice.title}</td>
                        {#if nice.v1 == 0}
                            {#if nice.pot}
                                <td class="clickable" id={nice.title} on:click={() => {clicked(nice.title, nice.pot)}}>{nice.v1} + {nice.pot}</td>
                            {:else}
                                <td class="clickable" id={nice.title} on:click={() => {clicked(nice.title, nice.pot)}}>{nice.v1}</td>
                            {/if}
                        {:else}
                            <td class="not-clickable">{nice.v1}</td>
                        {/if}
                        <td>{nice.v2}</td>
                    </tr>
                {/each}
            </table>
        </div>
        <button on:click="{() => {ferdig()}}"id="done-button">FERDIG</button>
    </div>
</div>



<style>
    .container {
        width: 100vw;
        height: 100vh;
        display: grid;
        grid-template-columns: 50% 50%;
        background-color: var(--darkgreen);

    }

    .right {
        background: linear-gradient(90deg, var(--darkgreen), 20%, whitesmoke);
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    }

    .board {
        background-color: white;
        width: 70%;
        max-width: 600px;
        height: 72%;
        max-height: 1200px;
        border-radius: 20px;
        box-shadow: 0px 0px 20px 3px lightgrey;

        display: grid;
        grid-template-columns: 100%;
        padding: 20px;
    }

    th {
        text-align: left;
    }

    td {
        border-bottom: 1px solid black;
    }

    .left {
        margin: auto auto;
        display: grid;
        grid-template-rows: 20% 60% 20%;
        justify-items: center;
        align-items: center;
        width: 90%;
        height: 95%;
    }

    .clickable {
        cursor: pointer;
    }

    .not-clickable {
        cursor: default;
    }

    #done-button {
        width: calc(70% + 40px);
        max-width: 600px;
        height: 50px;
        background-color: var(--yellow);
        border: none;
        border-radius: 15px;
        color: white;
        font-size: 18px;
        font-family: var(--font);
        margin-top: 20px;
        transition: all .1s ease-in-out;
    }

    #done-button:hover {
        background-color: var(--orange);
        cursor: pointer;
    }
</style>