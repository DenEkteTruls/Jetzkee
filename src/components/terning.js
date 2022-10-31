
function sum(array) {
    let a = 0;
    for(let i = 0; i < array.length; i++) {
        a += array[i];
    }
    return a;
}



export class Engine {
    constructor(antall) {
        this.antall = antall;
        this.num = this.antall;
        this.chosen_list = [];
        this.dizes = [];
        this.tries_left = 3;
        this.rounds = 0;

        this.points = 0;
        this.points_detail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        this.bot_points = 0;

        this.done = false;

        this.roll_dize();
    }

    roll_dize() {
        if(this.tries_left > 0) {
            this.dizes = [...Array(this.num)].map(() => {return Math.floor(Math.random()*6)+1});
            this.tries_left -= 1;
        }
    }

    reset() {
        this.tries_left = 3;
        this.num = this.antall;
        this.chosen_list = [];
    }

    new_round() {
        if(this.done) {
            this.dizes = []
            this.chosen_list = [];
            if(this.points > localStorage.getItem("beste")) {
                localStorage.setItem("beste", this.points);
            }
        }

        this.rounds++;

        this.reset();
        this.roll_dize();
    }

    new_chosen(chosen) {
        if(this.chosen_list.length >= 5) return;
        this.chosen_list = [...this.chosen_list, chosen];
        delete this.dizes[this.dizes.indexOf(chosen)];
        this.dizes = this.dizes.filter(function (a) {
            return a != null;
        });
        this.num--;
    }

    remove_chosen(chosen) {
        this.dizes = [...this.dizes, chosen];
        delete this.chosen_list[this.chosen_list.indexOf(chosen)];
        this.chosen_list = this.chosen_list.filter(function (a) {
            return a != null;
        });
        this.num++;
    }

    calculate_points(id) {
        if(typeof id == 'number') {
            let points = 0;
            for(let i = 0; i < this.dizes.length; i++) {
                if(this.dizes[i] == id) {
                    points += id;
                }
            }

            for(let i = 0; i < this.chosen_list.length; i++) {
                if(this.chosen_list[i] == id) {
                    points += id;
                }
            }
            return points;
        }

        if(typeof id == 'string') {
            let a = this.dizes.concat(this.chosen_list);
            switch (id) {
                case 'liten': {
                    let checklist = [1, 2, 3, 4, 5];
                    for(let i = 0; i < a.length; i++) {
                        for(let x = 0; x < checklist.length; x++) {
                            if(a[i] == checklist[x]) {
                                delete checklist[x];
                                checklist = checklist.filter(function (a) {
                                    return a != null;
                                });
                            }
                        }
                    }
                    if(checklist.length != 0) return 0;
                    else return 15;
                }

                case 'stor': {
                    let checklist = [2, 3, 4, 5, 6];
                    for(let i = 0; i < a.length; i++) {
                        for(let x = 0; x < checklist.length; x++) {
                            if(a[i] == checklist[x]) {
                                delete checklist[x];
                                checklist = checklist.filter(function (a) {
                                    return a != null;
                                });
                            }
                        }
                    }
                    if(checklist.length != 0) return 0;
                    else return 20;
                }

                case 'hus': {
                    let counter = [0, 0, 0, 0, 0, 0];
                    for(let x = 0; x < a.length; x++) {
                        counter[a[x]-1]++;
                    }
                    if(counter.includes(2) && counter.includes(3)) {
                        return (counter.indexOf(2)+1) * 2 + (counter.indexOf(3)+1) * 3
                    } else {
                        return 0;
                    }
                }

                case 'sjanse': {
                    return sum(a);
                }

                case 'yatzy': {
                    return (sum(a) == 30) * 50;
                }
            }
        }
    }
}