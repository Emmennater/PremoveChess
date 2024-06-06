
class Notification {
    static updateNotificationPositions() {
        const existingNotifications = document.querySelectorAll('.notification');
        const notificationHeight = 45; // Adjust as needed
        const yStart = isMobileDevice() ? 40 : 0;
        existingNotifications.forEach((existingNotification, index) => {
            let y = index * notificationHeight + yStart;
            existingNotification.style.top = `${y}px`;
        });
    }

    static show(html, duration = 5, sound = true) {
        if (sound) playSound("Assets/notify.mp3");

        const notification = document.createElement('div');
        notification.classList.add('notification');
        notification.style.setProperty('--notification-duration', `${duration}s`);
        notification.innerHTML = html;
        document.body.appendChild(notification);

        Notification.updateNotificationPositions();

        setTimeout(() => {
            notification.remove();
            Notification.updateNotificationPositions();
        }, duration * 1000);

        return notification;
    }
}