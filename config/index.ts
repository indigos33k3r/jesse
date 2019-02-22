import app from './app';
import logging from './logging';
import exchanges from './exchanges';
import sentry from './sentry';
import dashboard from './dashboard';
import notifications from './notifications';

export default {
    app: { ...app },
    logging: { ...logging },
    exchanges: { ...exchanges },
    sentry: { ...sentry },
    dashboard: { ...dashboard },
    notifications: { ...notifications }
};
