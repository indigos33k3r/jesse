export default {
    enable: !!parseInt(process.env.ENABLE_SENTRY), 

    DSN: process.env.SENTRY_DSN, 
}