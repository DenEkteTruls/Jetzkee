<script>
    import PlayerBar from './components/PlayerBar.svelte';
    import Board from './components/Board.svelte'

    var username = sessionStorage.getItem("username");

    let board = [
        {'title': 'Enere', 'v1': 0, 'v2': 0},
        {'title': 'Toere', 'v1': 0, 'v2': 0},
        {'title': 'Treere', 'v1': 0, 'v2': 0},
        {'title': 'Firere', 'v1': 0, 'v2': 0},
        {'title': 'Femere', 'v1': 0, 'v2': 0},
        {'title': 'Seksere', 'v1': 0, 'v2': 0},
        {'title': 'Sum', 'v1': 0, 'v2': 0},
        {'title': 'Bonus', 'v1': 0, 'v2': 0},
        {'title': 'Liten Straight', 'v1': 0, 'v2': 0},
        {'title': 'Stor Straight', 'v1': 0, 'v2': 0},
        {'title': 'Hus', 'v1': 0, 'v2': 0},
        {'title': 'Sjanse', 'v1': 0, 'v2': 0},
        {'title': 'Yatzy', 'v1': 0, 'v2': 0},
        {'title': 'Totalsum', 'v1': 0, 'v2': 0}
    ];
</script>




<div class="container">
    <div class="left">
        <div class="left-conte"></div>
            <PlayerBar name='Bot'/>
            <Board/>
            <PlayerBar name='{username}'/>
        </div>
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
                        <td>{nice.v1}</td>
                        <td>{nice.v2}</td>
                    </tr>
                {/each}
            </table>
        </div>
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
    }

    .board {
        background-color: white;
        width: 70%;
        max-width: 400px !important;
        height: 80%;
        border-radius: 30px;
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
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .left-conte {
        display: grid;
        grid-template-rows: 20% 60% 20%;   
    }
</style>