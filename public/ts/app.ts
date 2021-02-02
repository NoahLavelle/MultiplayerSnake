const pages = ["#home", "#creategame", "#options, #game"];
const titles = ["Snake", "Snake | Create Gane", "Snake | Options, Snake | Game"]
const errorCodes = ["?a", "?b"]

let game : Game;

class LinkHandling {
    errorHandling : ErrorHandling;

    constructor () {
        this.eventListner();
        this.errorHandling = new ErrorHandling();
    }

    eventListner() {
        this.handle();

        window.onpopstate = () => {
            this.handle();
            this.errorHandling.handle();
        }
    }

    handle () {
        this.hideAll();
        if (pages.includes(location.hash)) document.title = titles[pages.indexOf(location.hash)];
        if (location.hash == "") {
            $('#home').show();
        } else {
            $(location.hash).show();
        }
    
        if (game != undefined && location.hash != "#game") {
            game.running = false;
            setTimeout(() => {
                socket.emit("send-data", ["", "", []]);
            }, 100)
            
        }
    }

    hideAll () {
        pages.forEach((page) => {
            $(page).hide();
        });
    }
}

class ErrorHandling {
    constructor() {
        this.handle();
    }

    handle () {
        if (location.search) {
            let error = location.search;
            history.replaceState(null, null, '/');
            if (error == '?a') {
                // @ts-ignore
                Swal.fire({
                    icon: 'error',
                    title: '404 Error',
                    text: 'The requested file cannot be found',
                  })
            }
            else if (error == '?b') {
                // @ts-ignore
                Swal.fire({
                    icon: 'error',
                    title: 'Game not found',
                  })
            }
            else if (error == '?c') {
                // @ts-ignore
                Swal.fire({
                    icon: 'error',
                    title: 'The Game has timed out'
                });
            };
        };
    }
}

class ColorHandling {
    playerColor : any;
    canvasColor : any;
    foodColor : any;

    constructor () {
        this.playerColor = localStorage.getItem("player-color");
        this.canvasColor = localStorage.getItem("canvas-color");
        this.foodColor = localStorage.getItem("food-color");

        this.createPickers();
    }
    
    createPickers () {
        $("#color-pickers").children().toArray().forEach((child : any) => {
            let currentColor : any = null;
            switch (child.getAttribute("value")) {
                case "player-color":
                    if (this.playerColor == null) {
                        this.playerColor = child.getAttribute("default");
                    }
                    currentColor = this.playerColor;
                break;
                case "canvas-color":
                    if (this.canvasColor == null) {
                        this.canvasColor = child.getAttribute("default");
                    }
                    currentColor = this.canvasColor;
                break;
                case "food-color":
                    if (this.foodColor == null) {
                        this.foodColor = child.getAttribute("default");
                    }
                    currentColor = this.foodColor;
                break;
            }
    
            const newElement = document.createElement("span");
            child.append(newElement);
    
            // @ts-ignore
            const pickr = Pickr.create({
                el: newElement,
                theme: 'classic', // or 'monolith', or 'nano'
                default: currentColor,
            
                swatches: [
                    'rgba(244, 67, 54, 1)',
                    'rgba(233, 30, 99, 1)',
                    'rgba(156, 39, 176, 1)',
                    'rgba(103, 58, 183, 1)',
                    'rgba(63, 81, 181, 1)',
                    'rgba(33, 150, 243, 1)',
                    'rgba(3, 169, 244, 1)',
                    'rgba(0, 188, 212, 1)',
                    'rgba(0, 150, 136, 1)',
                    'rgba(76, 175, 80, 1)',
                    'rgba(139, 195, 74, 1)',
                    'rgba(205, 220, 57, 1)',
                    'rgba(255, 235, 59, 1)',
                    'rgba(255, 193, 7, 1)'
                ],
            
                components: {
            
                    // Main components
                    preview: true,
                    opacity: false,
                    hue: true,
            
                    // Input / output Options
                    interaction: {
                        hex: true,
                        rgba: true,
                        hsla: true,
                        hsva: true,
                        cmyk: true,
                        input: true,
                        clear: true,
                        save: true
                    }
                }
            });
    
            pickr.on('save', (color : any) => {
                try {
                    localStorage.setItem(child.getAttribute("value"), color.toHEXA().toString())
                } catch {};
            });
        });
    }
}

class SpecialButtons {
    constructor () {
        this.eventHandlers()
    }

    eventHandlers() {
        $("#joingame").on("click", () => {
            this.joinGame();
        });
        
        $("#play").on("click", () => {
            this.play();
        });

        $("#fullscreen").on("click", () => {
            this.fullscreen();
        });
    }

    joinGame() {
        // @ts-ignore
        Swal.fire({
            title: 'Enter Game ID',
            input: 'text',
            inputAttributes: {
                autocapitalize: 'off'
            },
            showCancelButton: true,
            confirmButtonText: 'Look up',
            showLoaderOnConfirm: true,
            preConfirm: () => {
                // @ts-ignore
                let id : any = $(Swal.getInput()).val();
                return new Promise( (resolve, reject) => {
                    socket.emit("gameslist")
                    socket.on("gameslist", (gameslist) => {
                        if (!gameslist.includes(id)) {
                            reject();
                        } else {
                            resolve(id);
                        }
                    })
                }).catch(() => {
                    // @ts-ignore
                    Swal.showValidationMessage(
                        `Request failed: Game not found`
                    )
                })
            },
            allowOutsideClick: true
        }).then((result) => {
            if (result.isConfirmed) {
                if (result != undefined) {
                    socket.emit("joingame", result.value);
                    location.hash = "#game"
                    game = new Game;
                }
            }
        });
    }

    play() {
        // @ts-ignore
        socket.emit("creategame", 100 / ((Number.parseInt($("#gamespeed").val())) / 100), Number.parseInt($("#gametime").val()), Boolean($("#getlength").val()));
        game = new Game;
    }

    fullscreen() {
        // @ts-ignore
        if (document.webkitIsFullScreen || document.mozFullScreen || document.fullscreen || false) {
            document.exitFullscreen();
        }
        else {
            document.documentElement.requestFullscreen();
        };
    }
}


class Slider {
    slider : any;
    input : any;
    value : any;

    constructor (slider : any) {
        this.slider = slider;
        this.input = $(this.slider).find("input");
        this.value = $(this.slider).find("#value");

        this.monitor();
        this.updateSlider();
    }

    updateSlider() {
        var rangePercent : any = $(this.input).val();
        $(this.input).css('filter', 'hue-rotate(-' + (rangePercent - Math.max(-50, Math.min(Number.parseInt($(this.input).attr("min")) * 2), 100)) + 'deg)');
        $(this.value).html(`${rangePercent}${$(this.value).attr("symbol")}`);
        if ($(this.value).attr("maxspecial") != undefined && rangePercent == $(this.input).attr("max")) {
            $(this.value).html($(this.value).attr("maxspecial")!);
        }
    }

    monitor() {
        $(this.input).on('change input', () => {
            this.updateSlider();
        });
    }
}


jQuery(() => {
    const linkHandling = new LinkHandling ();
    const colorHandling = new ColorHandling ();
    const specialButtons = new SpecialButtons();
});

$("#creategame > div > .options").children().toArray().forEach((child) => {
    if ($(child).find("input[type=range]") != null && !$(child).hasClass("buttons")) {
        const slider : Slider = new Slider(child);
    }
});

$("body").on("mousemove", (event) => {
    $(".background").css("background-position", `${event.clientX * 0.033}% ${event.clientY * 0.033}%`);
});