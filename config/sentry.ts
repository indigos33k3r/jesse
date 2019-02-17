export default {
    useSentryForExceptionReporting: !!parseInt(process.env.ENABLE_SENTRY), 

    sentryDSN: process.env.SENTRY_DSN, 
}