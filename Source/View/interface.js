
class MenuEvents {
    static menuWrapper = document.getElementById("menu-wrapper");        
    static settingsMenu = document.getElementById("settings-menu");
    static helpMenu = document.getElementById("help-menu");
    static mainMenu = document.getElementById("main-menu");
    static soloMenu = document.getElementById("solo-menu");
    static joinMenu = document.getElementById("join-menu");
    static hostMenu = document.getElementById("host-menu");
    static menuOpen = false;
    static menusOpen = [];
    static gameActive = false;
    static rematchNotification = null;

    static init() {
        // Initialize settings menu
        MenuSettings.init();

        // Set host id copy to clipboard
        const hostID = document.getElementById("host-id");
        const copyHostID = document.getElementById("copy-host-id");
        setCopyButton(copyHostID, hostID);

        // Set host link copy to clipboard
        const hostLink = document.getElementById("host-link");
        const copyHostLink = document.getElementById("copy-host-link");
        setCopyButton(copyHostLink, hostLink);

        // Disable quit game button
        MenuEvents.disableButton("quit-button");

        // Apply menu sound effects
        const menuButtons = document.getElementsByClassName("menu-button");
        const toolbarButtons = document.getElementsByClassName("button");
        const buttons = [...menuButtons, ...toolbarButtons];
        buttons.forEach(button => button.addEventListener("click", () => {
            playSound("Assets/button-click.m4a");
        }));

        if (isMobileDevice()) {
            // Add mobile stylesheet
            const link = document.createElement("link");
            link.href = "Style/mobile.css";
            link.rel = "stylesheet";
            document.getElementsByTagName("head")[0].appendChild(link);
        }

        // Window closed
        window.addEventListener("beforeunload", () => {
            if (ChessNetwork.isRunning) ChessNetwork.send(ChessNetwork.recipientID, "leave");
        });

        MenuEvents.openMainMenu();

        // Check search params for host id
        const params = getSearchParameters();
        if (params.id) {
            MenuEvents.openJoinMenu();
        }

        // Set server status to online
        MenuEvents.serverIsOnline();
    }

    // Open and close menus
    static closeCurrentMenu(remove = true) {
        if (this.menusOpen.length == 0) return;
        const menuClosed = this.menusOpen.back();
        if (remove) this.menusOpen.pop();
        switch (menuClosed) {
            case "settings": this.settingsMenu.style.display = "none"; break;
            case "help": this.helpMenu.style.display = "none"; break;
            case "main": this.mainMenu.style.display = "none"; break;
            case "solo": this.soloMenu.style.display = "none"; break;
            case "join": this.joinMenu.style.display = "none"; break;
            case "host": this.hostMenu.style.display = "none"; break;
        }
        if (this.menusOpen.length == 0) {
            this.menuWrapper.classList.remove("showing");
            this.menuOpen = false;
            ChessActions.busy--;
        } else if (remove) {
            this.openCurrentMenu();
        }
    }

    static closeAllMenus() {
        while (this.menusOpen.length > 0) this.closeCurrentMenu();
    }

    static openCurrentMenu() {
        if (this.menusOpen.length == 0) return;
        const menuOpened = this.menusOpen.back();
        switch (menuOpened) {
        case "settings": this.settingsMenu.style.display = "flex"; break;
        case "help": this.helpMenu.style.display = "flex"; break;
        case "main": this.mainMenu.style.display = "flex"; break;
        case "solo": this.soloMenu.style.display = "flex"; break;
        case "join": this.joinMenu.style.display = "flex"; break;
        case "host": this.hostMenu.style.display = "flex"; break;
        }
        if (this.menusOpen.length == 1) {
            this.menuWrapper.classList.add("showing");
            this.menuOpen = true;
            ChessActions.busy++;
        }
    }

    static openMenu(menuName) {
        if (this.menusOpen.back() == menuName) return false;
        this.closeCurrentMenu(false);
        this.menusOpen.push(menuName);
        this.openCurrentMenu();
        return true;
    }

    // Menus
    static quitGame() {
        ChessNetwork.leave();
        MenuEvents.gameHasEnded();
        ChessBoard.resetBoard(defaultFen);
        Network.close();

        setTimeout(() => {
            if (getSearchParameters().id) {
                // Remove host id from search params
                window.location.href = getWindowUrl();
            }
        }, 1000);

        // Disable quit game button
        MenuEvents.disableButton("quit-button");

        // Autodecline rematch
        if (MenuEvents.rematchNotification) {
            MenuEvents.rematchNotification.close(false);
            MenuEvents.rematchNotification = null;
        }
    }

    static openSettingsMenu() {
        this.openMenu("settings");
    }

    static openHelpMenu() {
        this.openMenu("help");
    }

    static openMainMenu() {
        this.openMenu("main");
    }

    static openSoloMenu() {
        this.openMenu("solo");

        // Reset settings
        const fenInput = document.getElementById("solo-fen");
        fenInput.value = defaultFen;
    }

    static openJoinMenu() {
        this.openMenu("join");

        const params = getSearchParameters();

        // Abort any original join request
        ChessNetwork.abortJoin();

        // Reset settings
        const joinID = document.getElementById("join-id");
        const loadingIcon = document.getElementById("join-loading");
        joinID.value = params.id ? params.id : "";
        joinID.classList.remove("error-flag");
        loadingIcon.classList.add("hide");
        MenuEvents.disableButton("join-game-button");

        // Setup network
        Network.close();
        
        Network.on("open", id => {
            MenuEvents.enableButton("join-game-button");
        });

        Network.open();
    }

    static openHostMenu() {
        this.openMenu("host");

        // Reset settings
        // const sideInput = document.getElementById("host-side");
        // sideInput.value = MenuSettings.get("host-side");
        const hostID = document.getElementById("host-id");
        const hostLink = document.getElementById("host-link");
        const fenInput = document.getElementById("host-fen");
        hostID.value = "";
        hostLink.value = "";
        fenInput.value = defaultFen;
        hostID.classList.remove("error-flag");
        MenuEvents.disableButton("host-game-button");
        MenuEvents.disableButton("copy-host-id");
        MenuEvents.disableButton("copy-host-link");

        // Setup network
        Network.close();

        Network.on("open", id => {
            hostID.value = id;
            hostLink.value = getWindowUrl() + "?id=" + hostID.value;
            MenuEvents.enableButton("host-game-button");
            MenuEvents.enableButton("copy-host-id");
            MenuEvents.enableButton("copy-host-link");
        });

        Network.open();
    }

    // Functions
    static startSoloGame() {
        const fenInput = document.getElementById("solo-fen");
        const fenString = fenInput.value;

        // Close menus
        this.closeAllMenus();

        this.gameHasStarted();

        // New game sound effect
        playSound("Assets/game-start.mp3");

        // Initialize new game
        ChessBoard.resetBoard(fenString);
    }

    static submitHosting() {
        // Fetch settings
        const fenInput = document.getElementById("host-fen");
        const sideInput = document.getElementById("host-side");
        const fenString = fenInput.value;
        const side = sideInput.value;

        this.gameHasStarted();

        // Close menus
        this.closeAllMenus();

        // Create session
        ChessNetwork.host(fenString, side);
    }

    static joinGame() {
        const hostID = document.getElementById("join-id");
        const hostIDString = hostID.value;

        MenuEvents.disableButton("join-game-button")
        hostID.classList.remove("error-flag");

        // Validate host ID
        ChessNetwork.join(hostIDString, found => {
            MenuEvents.enableButton("join-game-button")

            if (!found) {
                hostID.classList.add("error-flag");
                return;
            } else {
                hostID.classList.remove("error-flag");
            }

            this.gameHasStarted();

            // Close menus
            this.closeAllMenus();
    
            // Create session
            ChessNetwork.syncComplete();
        });
    }

    static gameHasStarted() {
        MenuEvents.gameActive = true;

        // Disable solo, join, and host buttons
        const soloButton = document.getElementById("solo-button");
        const joinButton = document.getElementById("join-button");
        const hostButton = document.getElementById("host-button");
        soloButton.classList.add("button-disabled");
        joinButton.classList.add("button-disabled");
        hostButton.classList.add("button-disabled");

        // Enable quit game button
        MenuEvents.enableButton("quit-button");
    }

    static gameHasEnded() {
        MenuEvents.gameActive = false;

        // Enable solo, join, and host buttons
        const soloButton = document.getElementById("solo-button");
        const joinButton = document.getElementById("join-button");
        const hostButton = document.getElementById("host-button");
        soloButton.classList.remove("button-disabled");
        joinButton.classList.remove("button-disabled");
        hostButton.classList.remove("button-disabled");
    }

    static disableButton(id) {
        const buttonElem = document.getElementById(id);
        buttonElem.classList.add("button-disabled");
        buttonElem.disabled = true;
    }

    static enableButton(id) {
        const buttonElem = document.getElementById(id);
        buttonElem.classList.remove("button-disabled");
        buttonElem.disabled = false;
    }

    static askForRematch() {
        const rematchNotif = Notification.ask("Rematch?", accepted => {
            ChessNetwork.voteRematch(accepted);
        }, isMobileDevice() ? "bottom" : "top");

        MenuEvents.rematchNotification = rematchNotif;
    }

    // Statuses
    static serverIsOnline() {
        const serverText = document.getElementById("is-online");
        serverText.innerText = "Server Online";
        serverText.classList.add("online");

        MenuEvents.enableButton("join-button");
        MenuEvents.enableButton("host-button");
    }

    static serverIsOffline() {
        const serverText = document.getElementById("is-online");
        serverText.innerText = "Server Offline";
        serverText.classList.remove("online");

        MenuEvents.disableButton("join-button");
        MenuEvents.disableButton("host-button");
    }
}

class MenuSettings {
    static settings = {};

    static init() {
        MenuSettings.addSetting("volume", 100, "volume-slider", value => {
            changeAudioVolume(value / 100);
        });
        MenuSettings.addSetting("show-premoves", true, "solo-show-premoves", value => {
            ChessActions.showSoloPremoves = value;
        });
        MenuSettings.addSetting("host-side", "random", "host-side");
        MenuSettings.addSetting("piece-style", "neo", "piece-style", value => {
            changePieceStyle(value);
            ChessBoard.updatePieces(ChessBoard.activeGame);
        });
        MenuSettings.addSetting("board-style", "https://lichess1.org/assets/images/board/grey.jpg", "board-style", value => {
            ChessElements.setBackgroundImage(value);
        });
        MenuSettings.addSetting("move-confirmation", false, "move-confirmation", value => {
            ChessActions.moveConfirmation = value;
        });
    }

    static addSetting(key, value, elemId = null, callback = () => {}) {
        value = localStorage.getItem("menu-settings-" + key) || value;

        if (value === "true") value = true;
        else if (value === "false") value = false;

        MenuSettings.settings[key] = { value, elemId, callback };
        MenuSettings.set(key, value);

        // UI listener
        if (!elemId) return;
        const elem = document.getElementById(elemId);
        
        switch (elem.type) {
            case "checkbox":
                elem.onclick = () => MenuSettings.set(key, elem.checked);
                break;
            case "select-one":
            case "range":
            default:
                elem.oninput = () => MenuSettings.set(key, elem.value);
                break;
        }
    }

    static set(key, value) {
        MenuSettings.settings[key].value = value;
        MenuSettings.settings[key].callback(value);

        // Save to local storage
        localStorage.setItem("menu-settings-" + key, value);

        // Update UI
        const elemId = MenuSettings.settings[key].elemId;
        if (!elemId) return;
        
        const elem = document.getElementById(elemId);
        switch (elem.type) {
            case "checkbox":
                if (elem.checked != value)
                    elem.click();
                break;
            case "select-one":
            case "range":
            default:
                elem.value = value;
                break;
        }
    }

    static get(key) {
        return MenuSettings.settings[key].value;
    }
}

Array.prototype.back = function() {
    return this[this.length - 1];
}

// (function() {
    // MenuEvents.addNewHost("Example", ()=>console.log("joining example session..."));
// })();
