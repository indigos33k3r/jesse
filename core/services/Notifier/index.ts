import config from '../../../config';
import _ from 'lodash';

const Notifier = {
    send(message: string): Promise<void> {
        return new Promise(resolve => {
            if (! config.notifications.enable) {
                resolve(); 
                return; 
            }

            config.notifications.driver.send(message);

            resolve();
        });
    }
}

export default Notifier;