export default {
    // here you can filter items that you wish yo see in reports after the trading is done. 
    reportItems: {
        averageR: true, 
    }, 

    // here you can filter items that you intend to see when debugMode is enabled. (work in progress)
    debugItems: {
        orderSubmission: true, 
        shorterPeriodCandles: true, 
        executedOrderDetection: true, 
        executedOrderStep: true, 
        activePosition: true, 
        progressBar: true,
        others: true 
    }, 

    // Accepted values are null and 'file'. ('database' will be added.)
    logDriver: process.env.LOG_DRIVER.toLowerCase(),
}