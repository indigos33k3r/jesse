import app from './app';
import logging from './logging';
import exchanges from './exchanges';
import sentry from './sentry';
import dashboard from './dashboard';
import notifications from './notifications';

export default {
    ...app,
    ...logging,
    ...exchanges,
    ...sentry,
    ...dashboard,
    notifications: { ...notifications }
};
