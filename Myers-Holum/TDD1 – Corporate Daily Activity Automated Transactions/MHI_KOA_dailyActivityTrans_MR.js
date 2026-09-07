/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/runtime', './MHI_KOA_dailyActivityTrans_LIB.js'],
    
    (runtime, LIB) => {
        
        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */

        const getInputData = (inputContext) => {

            log.debug('Get Input');

            let runHistId;

            try {

                runHistId = LIB.createOrUpdateRunHistory('getInput', 'create');
                //runHistId = 902;
                log.audit('Get Input - Run History ID', runHistId);

                const CONFIG = LIB.getConfig();
                log.debug('Get Input - Config', CONFIG);

                if (CONFIG.boolConfigFound && !CONFIG.boolNoGLsettingsFound) {
                    
                    let configObj = CONFIG.configObj;

                    log.audit('Get Input - Active UCs', 'UC1: ' + configObj.boolActive_UC1 + ' | UC2: ' + configObj.boolActive_UC2 + ' | UC3: ' + configObj.boolActive_UC3 + ' | UC4: ' + configObj.boolActive_UC4 + ' | UC5: ' + configObj.boolActive_UC5 + ' | UC6: ' + configObj.boolActive_UC6 + ' | UC7: ' + configObj.boolActive_UC7);

                    const CURR_SCRIPT_OBJ = runtime.getCurrentScript();
                    const SEARCH_PARAM_MAPPING = LIB.getSearchParamMapping();
                    log.debug('Get Input - Script Param Search Map', SEARCH_PARAM_MAPPING);

                    let ucSeachResultArr = [];

                    if (configObj.boolActive_UC1) {
                        
                        let uc1SearchId = CURR_SCRIPT_OBJ.getParameter(SEARCH_PARAM_MAPPING['UC1']);
                        if (uc1SearchId) {
                            
                            log.audit('Get Input - UC1 Search ID', uc1SearchId);

                            LIB.getSearchResult(uc1SearchId, ucSeachResultArr, runHistId, 1);

                        } else {

                            log.error('No UC1 Search ID Found');
                        }
                    }

                    if (configObj.boolActive_UC2) {
                        
                        let uc2SearchId = CURR_SCRIPT_OBJ.getParameter(SEARCH_PARAM_MAPPING['UC2']);
                        if (uc2SearchId) {
                            
                            log.audit('Get Input - UC2 Search ID', uc2SearchId);

                            LIB.getSearchResult(uc2SearchId, ucSeachResultArr, runHistId, 2);

                        } else {

                            log.error('No UC2 Search ID Found');
                        }
                    }

                    if (configObj.boolActive_UC3) {
                        
                        let uc3SearchId = CURR_SCRIPT_OBJ.getParameter(SEARCH_PARAM_MAPPING['UC3']);
                        if (uc3SearchId) {
                            
                            log.audit('Get Input - UC3 Search ID', uc3SearchId);

                            LIB.getSearchResult(uc3SearchId, ucSeachResultArr, runHistId, 3);

                        } else {

                            log.error('No UC3 Search ID Found');
                        }
                    }

                    if (configObj.boolActive_UC4) {
                        
                        let uc4SearchId = CURR_SCRIPT_OBJ.getParameter(SEARCH_PARAM_MAPPING['UC4']);
                        if (uc4SearchId) {
                            
                            log.audit('Get Input - UC4 Search ID', uc4SearchId);

                            LIB.getSearchResult(uc4SearchId, ucSeachResultArr, runHistId, 4);

                        } else {

                            log.error('No UC4 Search ID Found');
                        }
                    }

                    log.audit('Get Input - All UC Search Result Count', ucSeachResultArr.length);
                    
                    if (ucSeachResultArr.length) {
                        
                        return ucSeachResultArr;

                    } else {

                        throw new Error('No search results found for active UCs.');
                    }

                } else {

                    if (!CONFIG.boolConfigFound) {
                        throw new Error('ATC Configuration not found.');
                    } else if (CONFIG.boolNoGLsettingsFound) {
                        throw new Error('No GL Settings found.');
                    }
                }
                
            } catch (error) {
                
                log.error('Get Input - Error', error.message);

                let runHistParam = {

                    runHistId,
                    status: 'Failed',
                    errorMsg: error.message
                }
                
                runHistId = LIB.createOrUpdateRunHistory('getInput', 'update', runHistParam);
            }
        }

        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */

        const map = (mapContext) => {

            let mapKey = mapContext.key;
            let mapValue = mapContext.value;
            log.debug('Map - Key: ' + mapKey, mapValue);

            try {

                let uniqueKey  = LIB.createKey(mapValue);
                log.debug('Map - Group key', uniqueKey);

                if (uniqueKey) {

                    mapContext.write({
                        key: uniqueKey,
                        value: {
                            
                            tranLine: mapValue
                        }
                    });
                    
                } else {

                    let mapValueParsed = JSON.parse(mapValue);
                    throw new Error(`Map Error: No Unique Key Generated UC#: ${mapValueParsed.ucNum} | JE ID: ${mapValueParsed.id} | Line Unique Key: ${mapValueParsed.lineuniquekey.value}`);
                }

            } catch (error) {
                
                log.error('Map - Error', error.message);
                
                mapContext.write({
                    key: 'Failed',
                    value: {
                        
                        tranLine: mapValue,
                        errorMsg: error.message
                    }
                });
            }
        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {

            let reduceKey = reduceContext.key;
            let reduceValues = reduceContext.values;
            log.debug('Reduce Key: ' + reduceKey, reduceValues);

            try {

                if (reduceKey != 'Failed') {

                    let mrTaskId = LIB.getCurrentTaskId();
                    log.debug('Reduce - Current Task ID', mrTaskId);

                    let firstIndex = JSON.parse(reduceValues[0]); 
                    let firstIndexTranLine = JSON.parse(firstIndex.tranLine);

                    if (firstIndexTranLine.ucNum == 1 || firstIndexTranLine.ucNum == 3 || firstIndexTranLine.ucNum == 4) {
                        
                        let fromSub = LIB.getValue(firstIndexTranLine, 'subsidiarynohierarchy', true);
                        let campGround = LIB.getValue(firstIndexTranLine, 'line.cseg_koa_cpg', true);
                        let dept = LIB.getValue(firstIndexTranLine, 'departmentnohierarchy', true);
                        
                        log.audit('Reduce - Create JE', 'UC: ' + firstIndexTranLine.ucNum + ' | Key: ' + reduceKey + ' | Originating Sub: ' + fromSub + ' | Camp Ground: ' + campGround + ' | Tran Line Count: ' + reduceValues.length);

                        let result;

                        if (firstIndexTranLine.ucNum == 1) {
                            result = LIB.handleUC1_GiftCardRedemptionICJE(reduceKey, reduceValues, mrTaskId);
                        } else if (firstIndexTranLine.ucNum == 3) {
                            result = LIB.handleUC3_RewardsRedemptionICJE(reduceKey, reduceValues, mrTaskId);
                        } else if (firstIndexTranLine.ucNum == 4) {
                            result = LIB.handleUC4_handleDonationICJE(reduceKey, reduceValues, mrTaskId);
                        }

                        if (result.status == 'Success') {

                            reduceContext.write({
                                key: reduceKey,
                                value: {
                                    
                                    status: 'Success',
                                    srcTranArr: result.srcTranArr,
                                    jeRecId: result.jeRecId,
                                    runHistId: result.runHistId
                                }
                            });

                        } else {

                            reduceContext.write({
                                key: 'Failed',
                                value: {
                                    
                                    status: 'Failed',
                                    errorMsg: result.errorMsg,
                                    srcTranArr: result.srcTranArr,
                                    runHistId: result.runHistId
                                }
                            });
                        }
                    }

                } else {

                    //Pass through from map stage to summarize stage for logging and run history update
                    reduceValues.forEach((failedValue) => {
                        
                        let failedValueParsed = JSON.parse(failedValue);
                        let tranLine = JSON.parse(failedValueParsed.tranLine);
                        let errorMsg = failedValueParsed.errorMsg;

                        reduceContext.write({
                            key: reduceKey,
                            value: {
                                
                                status: 'Failed',
                                errorMsg: errorMsg,
                                srcTranArr: [tranLine.id],
                                runHistId: tranLine.runHistId
                            }
                        });
                    });
                }

            } catch (error) {

                log.error('Reduce Error | Key: ' + reduceKey, error.message);
            }
        }


        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {

            try {
                
                log.debug('Summary');

                let runHistId;
                let countSuccess = 0;
                let countFailed = 0;
                let countJEsCreated = 0;
                let failuresArr = [];

                //Get total counts of successes and failures, and log the failures for review
                summaryContext.output.iterator().each(function (key, value){

                    log.debug('Summary - Key: ' + key, value);

                    let valueParsed = JSON.parse(value);
                    let srcTranArr = valueParsed.srcTranArr;
                    runHistId = valueParsed.runHistId;

                    if (key != 'Failed') {

                        countSuccess = countSuccess + srcTranArr.length;
                        countJEsCreated = countJEsCreated + 1;

                    } else {

                        countFailed = countFailed + srcTranArr.length;

                        failuresArr.push(valueParsed.errorMsg);
                    }

                    return true;
                });

                log.audit('Summary - Counts', 'Success: ' + countSuccess + ' | Failed: ' + countFailed + '| Total: ' + (countSuccess + countFailed) + ' | JEs Created: ' + countJEsCreated);
                log.debug('Summary - Failures', failuresArr);

                //Update the Run History record with the summary counts and failures
                if (runHistId) {

                    let runHistParam = {

                        runHistId,
                        countSuccess,
                        countFailed,
                        countJEsCreated,
                        failuresArr
                    }
                    
                    runHistId = LIB.createOrUpdateRunHistory('summary', 'update', runHistParam);
                }

            } catch (error) {
                
                log.error('Summary - Error', error.message);
            }
        }

        return {getInputData, map, reduce, summarize}

    });
