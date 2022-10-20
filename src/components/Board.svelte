
<script>
    let view = 's';
    let dizes = [...Array(6)].map(() => {return Math.floor(Math.random()*6)+1});


    function roll_dize() {
        dizes = [...Array(6)].map(() => {return Math.floor(Math.random()*6)+1});
    }


    function linspace(a, b, n) {
        if (typeof n === 'undefined') n = Math.max(Math.round(b - a) + 1, 1)
        if (n < 2) {
            return n === 1 ? [a] : []
        }
        var i,ret = Array(n)
        n--
        for (i = n;i >= 0;i--) {
            ret[i] = (i * b + (n - i) * a) / n
        }
        return ret
    }


    function sort_by_id(list, key) {
        let items = Array.prototype.slice.call(list);
        items.sort(function(a, b) {
            var d = a.getAttribute(key);
            var c = b.getAttribute(key);
            return (d < c) ? -1 : (d > c) ? 1 : 0;
        });
        return items;
    }

    
    function getWidth() {
        var x = document.getElementById("container");
        return x.clientWidth;
    }

    function getHeight() {
        var x = document.getElementById("container");
        return x.clientHeight;
    }


    function standard_pos() {
        let w = getWidth();
        let items = Array.prototype.slice.call(document.getElementsByClassName("dice"));
        items = sort_by_id(items, 'id');
        let positionsX = linspace(w/10, w - (w/10)*2, items.length);
        let Y = getHeight() - getHeight()*0.17;
        for(let i = 0; i < items.length; i++) {
            items[i].style = "translate: "+positionsX[i]+"px "+Y+"px;";
        }
    }


    function random_pos() {
        let items = Array.prototype.slice.call(document.getElementsByClassName("dice"));
        let w = items[0].clientWidth;
        let positions = [];

        while(positions.length < 4) {
            let x = Math.floor(Math.random()*getWidth());
            let y = Math.floor(Math.random()*getHeight());
            console.log("1");
            if(positions.length > 0) {
                for(let i = 0; i < positions.length; i++) {
                    let px = positions[i].x;
                    let py = positions[i].y;
                    positions.push([x, y]);
                }
            } else {
                positions.push([x, y]);
            }
        }
        console.log(positions);
    }



    window.onload = () => {
        standard_pos();
        view = 'r';
    };

    window.onresize = () => {
        console.log(view);
        if(view == 's') {
            standard_pos();
        } else if(view == 'r') {
            random_pos();
        }
    }
</script>



<div id="container">
    {#each dizes as dice}
        <img class="dice" id={dice} src="media/{dice}.png" alt=""/>
    {/each}
</div>



<style>
    #container {
        background-color: black;
        height: 95%;
        width: 95%
    }

    .dice {
        position: absolute;
        width: 5%;
        padding-bottom: 5%;
        cursor: pointer;
    }
</style>