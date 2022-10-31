<script>
    function start() {
        var username = document.getElementById("username").value;
        sessionStorage.setItem("username", username);
        window.location.href = "/game";
    }

    function pressed(event) {
        if(event.key == 'Enter') start();
    }

</script>



<div class="container">
    <div class="left">
        <div class="form">
            <input type="text" on:keydown={() => {pressed(event)}} maxlength="12" id="username" class="field" placeholder="Username"/>
            <button id="btn" on:click={() => start()}>Start</button>
        </div>
    </div>
    <div class="right">
        <img id="rimg" src="media/login1.png" alt=""/>
    </div>
</div>



<style>
    .container {
        width: 100vw;
        height: 100vh;
        display: grid;
        grid-template-columns: 50% 50%;
        min-width: 1000px;
    }

    .left {
        background: linear-gradient(90deg, var(--darkgreen), 74%, white);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .form {
        width: 400px;
        height: 100px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    .right {
        background-color: white;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    #rimg {
        width: 500px;
        height: auto;
    }

    .field {
        height: 35%;
        width: calc(85% - 20px);
        outline: none;
        border: none;
        border-radius: 15px;
        font-size: 16px;
        padding: 10px 20px;
        font-family: 'Russo One';
    }

    .field:hover, .field:active {
        outline: 2px solid var(--orange);
    }

    #btn {
        height: 40%;
        width: 90%;
        padding: 10px;
        font-size: 16px;
        border: none;
        border-radius: 15px;
        background-color: var(--yellow);
        font-family: 'Russo One';
        cursor: pointer;
        transition: all .2s ease-in-out;
        outline: none;
        color: white;
    }
    
    #btn:hover {
        background-color: var(--orange);
    }
</style>