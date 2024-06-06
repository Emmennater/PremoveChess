
class Notification {
    static notifications = [];

    static updateNotificationPositions() {
        const existingNotifications = document.querySelectorAll('.notification');
        const notificationGap = 10; // Adjust as needed
        let y = isMobileDevice() ? 40 : 0;

        for (let i = 0; i < existingNotifications.length; i++) {
            const existingNotification = existingNotifications[i];
            existingNotification.style.top = `${y}px`;
            y += existingNotification.getBoundingClientRect().height + notificationGap;
        }
    }

    static show(html, duration = 5, sound = true) {
        if (sound) playSound("Assets/notify.mp3");

        const notification = document.createElement('div');
        notification.classList.add('notification');
        notification.style.setProperty('--notification-duration', `${duration}s`);
        notification.innerHTML = html;
        document.body.appendChild(notification);

        Notification.updateNotificationPositions();

        notification.close = () => {
            notification.remove();
            Notification.updateNotificationPositions();
            Notification.notifications = Notification.notifications.filter(n => n !== notification);
        };

        if (duration !== Infinity) {
            setTimeout(notification.close, duration * 1000);
        }

        Notification.notifications.push(notification);

        return notification;
    }

    static ask(question, callback) {
        const notification = Notification.show("", Infinity, true);
        const message = document.createElement("p");

        const yesButton = document.createElement("button");
        yesButton.classList.add("yes-button");
        yesButton.textContent = "Yes";
        
        const noButton = document.createElement("button");
        noButton.classList.add("no-button");
        noButton.textContent = "No";

        yesButton.addEventListener("click", () => {
            notification.close();
            callback(true);
        });

        noButton.addEventListener("click", () => {
            notification.close();
            callback(false);
        });
        
        message.textContent = question;

        notification.appendChild(message);
        notification.appendChild(yesButton);
        notification.appendChild(noButton);

        return notification;
    }
}
