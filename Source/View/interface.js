
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

    static init() {
        // Set host id copy to clipboard
        const hostID = document.getElementById("host-id");
        const copyHostID = document.getElementById("copy-host-id");
        setCopyButton(copyHostID, hostID);

        // Disable quit game button
        MenuEvents.disableButton("quit-button");
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
        MenuEvents.gameHasEnded();
        ChessBoard.resetBoard(defaultFen);
        Network.close();

        // Disable quit game button
        MenuEvents.disableButton("quit-button");
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

        // Reset settings
        const joinID = document.getElementById("join-id");
        joinID.value = "";
        joinID.classList.remove("error-flag");
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
        const hostID = document.getElementById("host-id");
        const fenInput = document.getElementById("host-fen");
        const sideInput = document.getElementById("host-side");
        hostID.value = "";
        fenInput.value = defaultFen;
        sideInput.value = "white";
        hostID.classList.remove("error-flag");
        MenuEvents.disableButton("host-game-button");
        MenuEvents.disableButton("copy-host-id");

        // Setup network
        Network.close();

        Network.on("open", id => {
            hostID.value = id;
            MenuEvents.enableButton("host-game-button");
            MenuEvents.enableButton("copy-host-id");
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

Array.prototype.back = function() {
    return this[this.length - 1];
}

// (function() {
    // MenuEvents.addNewHost("Example", ()=>console.log("joining example session..."));
// })();
