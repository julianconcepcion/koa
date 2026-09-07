/**
 * @NApiVersion 2.1
 */
define(['N/search', 'N/record', 'N/runtime'],
    
    (search, record, runtime) => {

        //--------------------------------------------------------------- HELPER FUNCTIONS ----------------------------------------------------------------//
        /**
         * Function to get Automated Transaction Config singleton
         * @returns {Object} configuration object i.e. UC1 is active
         */
        const getConfig = () => {

            let boolConfigFound = false;
            let boolNoGLsettingsFound = true;
            let configObj = {};
            let glSettings = {};
            let atcConfigId;

            let atcSearchObj = search.create({
                type: "customrecord_mhi_koa_txn_config",
                filters:
                [
                    ["isinactive","is","F"]
                ],
                columns:
                [
                    search.createColumn({name: "custrecord_mhi_koa_dact_gc_active", label: "Gift Card Redemption — Active"}),
                    search.createColumn({name: "custrecord_mhi_koa_dact_oakcc_active", label: "OAK CC Payment — Active"}),
                    search.createColumn({name: "custrecord_mhi_koa_dact_rewards_active", label: "Rewards Redemption — Active"}),
                    search.createColumn({name: "custrecord_mhi_koa_dact_donation_active", label: "Donation — Active"}),
                    search.createColumn({name: "custrecord_mhi_koa_dact_bev_cogs_active", label: "Beverage COGS Estimate — Active"}),
                    search.createColumn({name: "custrecord_mhi_koa_dact_bev_sales_active", label: "Beverage Sales — Active"}),
                    search.createColumn({name: "custrecord_mhi_koa_dact_concess_active", label: "Concession Fee — Active"}),
                    search.createColumn({name: "custrecord_mhi_koa_ic_ap", label: "Intercompany Accounts Payable"}),
                    search.createColumn({name: "custrecord_mhi_koa_ic_ar", label: "Intercompany Accounts Receivable"})
                ]
            });

            let atcSearchCount = atcSearchObj.runPaged().count;
            let atcSearchCols = atcSearchObj.columns;

            if (atcSearchCount) {
                    
                boolConfigFound = true;
                
                atcSearchObj.run().each(function(result){
                    
                    atcConfigId = result.id;
                    configObj.boolActive_UC1 = result.getValue(atcSearchCols[0]);
                    configObj.boolActive_UC2 = result.getValue(atcSearchCols[1]);
                    configObj.boolActive_UC3 = result.getValue(atcSearchCols[2]);
                    configObj.boolActive_UC4 = result.getValue(atcSearchCols[3]);
                    configObj.boolActive_UC5 = result.getValue(atcSearchCols[4]);
                    configObj.boolActive_UC6 = result.getValue(atcSearchCols[5]);
                    configObj.boolActive_UC7 = result.getValue(atcSearchCols[6]);
                    configObj.icApAccntId = result.getValue(atcSearchCols[7]);
                    configObj.icArAccntId = result.getValue(atcSearchCols[8]);

                    return true;
                });

                //Get GL Settings
                if (atcConfigId) {

                    let glSettingSearchObj = search.create({
                        type: "customrecord_mhi_koa_txn_gl",
                        filters:
                        [
                            ["isinactive","is","F"], 
                            "AND", 
                            ["custrecord_mhi_koa_txn_gl_parent","anyof", atcConfigId], 
                            "AND", 
                            ["custrecord_mhi_koa_txn_gl_origin_sub","noneof","@NONE@"], 
                            "AND", 
                            ["custrecord_mhi_koa_txn_gl_destin_sub1","noneof","@NONE@"]
                        ],
                        columns:
                        [
                            search.createColumn({name: "custrecord_mhi_koa_txn_gl_uc", label: "Use Case"}),
                            search.createColumn({name: "custrecord_mhi_koa_txn_gl_origin_sub", label: "Originating Subsidiary"}),
                            search.createColumn({name: "custrecord_mhi_koa_txn_gl_destin_sub1", label: "Destination Subsidiary 1"}),
                            search.createColumn({name: "custrecord_mhi_koa_txn_gl_destin1_cpg", label: "Destination Subsidiary 1 Campground"}),
                            search.createColumn({name: "custrecord_mhi_koa_txn_gl_destin1_dept", label: "Destination Subsidiary 1 Department"}),
                            search.createColumn({name: "custrecord_mhi_koa_txn_gl_gc_clg", label: "Gift Card Clearing"}),
                            search.createColumn({name: "custrecord_mhi_koa_txn_gl_gc_liability", label: "Gift Card Liability"}),
                            search.createColumn({name: "custrecord_mhi_koa_txn_gl_def_rev", label: "Deferred Revenue"}),
                            search.createColumn({name: "custrecord_mhi_koa_txn_gl_rwd_liability", label: "Rewards Liability"}),
                            search.createColumn({name: "custrecord_mhi_koa_txn_gl_don_clg", label: "Donations Clearing"})
                        ]
                    });

                    let glSettingSearchCount = glSettingSearchObj.runPaged().count;
                    let glSettingSearchCols = glSettingSearchObj.columns;

                    if (glSettingSearchCount) {
                        
                        boolNoGLsettingsFound = false;

                        let glSettingsArr = [];

                        glSettingSearchObj.run().each(function(result){

                            let glSettingId = result.id;
                            let useCaseText = result.getText(glSettingSearchCols[0]);
                            let ucNum = '';

                            //Identify UC # of the GL settings
                            if (useCaseText.includes('TDD1 - UC1')) {
                                ucNum = 'UC1';
                            } else if (useCaseText.includes('TDD1 - UC3')) {
                                ucNum = 'UC3';
                            } else if (useCaseText.includes('TDD1 - UC4')) {
                                ucNum = 'UC4';
                            }

                            log.debug('Get Input - GL Settings UC Mapping', 'GL Settings ID: ' + glSettingId + ' | GL Settings UC Text: ' + useCaseText + ' | UC Num: ' + ucNum);

                            let origSubId = result.getValue(glSettingSearchCols[1]);
                            let destSubId = result.getValue(glSettingSearchCols[2]);
                            let destCpgId = result.getValue(glSettingSearchCols[3]);
                            let destDeptId = result.getValue(glSettingSearchCols[4]);
                            let gcClearingAccntId = result.getValue(glSettingSearchCols[5]);
                            let gcLiabilityAccntId = result.getValue(glSettingSearchCols[6]);
                            let defRevAccntId = result.getValue(glSettingSearchCols[7]);
                            let rLiabilityAccntId = result.getValue(glSettingSearchCols[8]);
                            let donationsClearingAccntId = result.getValue(glSettingSearchCols[9]);

                            if (ucNum) {

                                glSettingsArr.push({
                                    ucNum,
                                    origSubId,
                                    destSubId,
                                    destCpgId,
                                    destDeptId,
                                    gcClearingAccntId,
                                    gcLiabilityAccntId,
                                    defRevAccntId,
                                    rLiabilityAccntId,
                                    donationsClearingAccntId
                                });
                            }

                            return true;
                        });

                        //Group GL settings by UC #
                        glSettings = groupBy(glSettingsArr, 'ucNum');
                        log.debug('Get Input - GL Settings Per UC', glSettings);
                    }
                }
            }

            return {

                boolConfigFound,
                boolNoGLsettingsFound,
                configObj,
                glSettings
            }
        }

        /**
         * Function to map script parameters per UCs, and return mapped search id
         * @returns {Object} mapped script parameter per UCs
         */
        const getSearchParamMapping = () => {

            return {

                UC1: 'custscript_atc_uc1_search_id',
                UC2: 'custscript_atc_uc2_search_id',
                UC3: 'custscript_atc_uc3_search_id',
                UC4: 'custscript_atc_uc4_search_id',
                UC5: 'custscript_atc_uc5_search_id',
                UC6: 'custscript_atc_uc6_search_id',
                UC7: 'custscript_atc_uc7_search_id'
            }
        }

        /**
         * Function to retrieve search result from the UC searches
         * @param {String} searchId - mapped UC search id
         * @param {Array} ucSeachResultArr - main array in get input data to store all UC search results
         * @param {Number} runHistId - Run history ID
         * @param {Number} ucNum - UC number identifier
         */
        const getSearchResult = (searchId, ucSeachResultArr, runHistId, ucNum) => {

            let searchObj = search.load({id: searchId});
            let searchCount = searchObj.runPaged().count;

            log.audit(`Get Input - UC${ucNum} Seach Count`, searchCount);

            if (searchCount) {
                
                let allSearchResult = getAllSearchResults(searchObj);
                let searchResults = allSearchResult.searchResults;
                let searchCols = allSearchResult.searchCols;

                for (let x = 0; x < searchResults.length; x++) {
                    
                    let result = searchResults[x];
                    let type = result.recordType;
                    let id = result.id;

                    let taggedResultObj = {

                        ucNum,
                        id,
                        type,
                        runHistId
                    };

                    for (let y = 0; y < searchCols.length; y++) {

                        let searchCol = searchCols[y];
                        
                        let colVal = result.getValue(searchCol);
                        let colText = result.getText(searchCol);

                        let colResult = {

                            value: colVal,
                            text: colText
                        };

                        taggedResultObj[searchCol.name] = colResult;
                    }

                    ucSeachResultArr.push(taggedResultObj);
                }
            }
        }
        
        /**
         * Function to get all search results 
         * @param {Object} searchObj - search.search object
         * 
         * @returns {Array} - object array of search results
         */
        const getAllSearchResults = (searchObj) => {
        
            let results = searchObj.run();
            let searchResults = [];
            let searchid = 0;
            
            do {

                var resultslice = results.getRange({start: searchid ,end: searchid + 1000});
                resultslice.forEach(function(slice) {
                    searchResults.push(slice);
                    searchid++;
                });

            } while (resultslice.length >= 1000);

            return {
                
                searchResults,
                searchCols: searchObj.columns
            };
        }

        /**
         * Function to create a unique key for the UC search result object
         * @param {Object} mapValues - UC search result object
         * 
         * @returns {String} - unique key string
         */
        const createKey = (mapValues) => {

            let mapValuesParsed = JSON.parse(mapValues);
            let ucNum = mapValuesParsed.ucNum;

            let key = '';

            if (ucNum == 1) {
                
                let fromSubId = getValue(mapValuesParsed, 'subsidiarynohierarchy', false);
                let campGroundId = getValue(mapValuesParsed, 'line.cseg_koa_cpg', false);
                let deptId = getValue(mapValuesParsed, 'departmentnohierarchy', false);
                log.debug('Map - Generate Key', `UC Num: ${ucNum} | From Sub: ${fromSubId} | Camp Ground: ${campGroundId}`);

                if (fromSubId && campGroundId) {
                    
                    key = `${fromSubId}_${campGroundId}`;
                }

            } else if (ucNum == 3) {

                let fromSubId = getValue(mapValuesParsed, 'subsidiarynohierarchy', false);
                let campGroundId = getValue(mapValuesParsed, 'line.cseg_koa_cpg', false);
                let deptId = getValue(mapValuesParsed, 'departmentnohierarchy', false);
                log.debug('Map - Generate Key', `UC Num: ${ucNum} | From Sub: ${fromSubId} | Camp Ground: ${campGroundId}`);

                if (fromSubId && campGroundId) {
                    
                    key = `${fromSubId}_${campGroundId}`;
                }
                
            } else if (ucNum == 4) {

                let fromSubId = getValue(mapValuesParsed, 'subsidiarynohierarchy', false);
                let campGroundId = getValue(mapValuesParsed, 'line.cseg_koa_cpg', false);
                let deptId = getValue(mapValuesParsed, 'departmentnohierarchy', false);
                log.debug('Map - Generate Key', `UC Num: ${ucNum} | From Sub: ${fromSubId} | Camp Ground: ${campGroundId}`);

                if (fromSubId && campGroundId) {
                    
                    key = `${fromSubId}_${campGroundId}`;
                }
                
            }

            return key;
        }

        /**
         * Function to get the value of a specific key from the mapValues object
         * @param {Object} mapValue - The mapValues object
         * @param {String} key - The key for which to retrieve the value
         * @param {Boolean} boolText - Flag to indicate whether to return the text or value
         * 
         * @returns {String|Number} - The value or text for the specified key
         */
        const getValue = (mapValue, key, boolText) => {

            let value;

            let obj = mapValue[key];
            if (obj) {
                
                value = (!boolText) ? obj.value : obj.text;
            }

            return value;
        }
        
        /**
         * Function to retrieve the current Task ID of the running Map/Reduce script.
         * @returns {string|null} The Task ID if found, otherwise null.
         */
        const getCurrentTaskId = () => {

            let scriptObj = runtime.getCurrentScript();
            let scriptId = scriptObj.id;
            let scriptDeploymentId = scriptObj.deploymentId;

            let mapReduceTaskSearch = search.create({
                type: search.Type.SCHEDULED_SCRIPT_INSTANCE,
                filters: [
                    ['status', 'anyof', 'PROCESSING'],
                    'AND',
                    ['script.scriptid', 'is', scriptId],
                    'AND',
                    ['scriptdeployment.scriptid', 'is', scriptDeploymentId]
                ],
                columns: ['taskid']
            });

            let taskId = null;
            
            mapReduceTaskSearch.run().each((result) => {

                taskId = result.getValue('taskid');
                return false; // Stop iterating after getting the first match
            });

            return taskId;
        };

        /**
         * Function to group array using specific property
         * @param {Array} arr - array to be grouped
         * @param {String} property - property to group by
         * 
         * @returns {Object} - object with keys of the property and values of arrays of objects that share the same value for the property
         */
        const groupBy = (arr, property) => {

            return arr.reduce(function (memo, x) {
                if (!memo[x[property]]) { memo[x[property]] = []; }
                memo[x[property]].push(x);
                return memo;
            }, {});

        };
        //--------------------------------------------------------------- HELPER FUNCTIONS ----------------------------------------------------------------//


        
        //--------------------------------------------------------------- MAIN FUNCTIONS ----------------------------------------------------------------//
        /**
         * Function to handle UC1 Gift Card Redemption Intercompany Journal Entry
         * @param {String} reduceKey - reduce key
         * @param {Array} reduceValues - Array of reduced values for UC1 Gift Card Redemption
         * @param {String} mrTaskId - The ID of the current map/reduce task
         * 
         * @returns {Object} - Object containing the status, JE record ID, source transaction array, and run history ID
         */
        const handleUC1_GiftCardRedemptionICJE = (reduceKey, reduceValues, mrTaskId) => {

            const CONFIG = getConfig();
            let configObj = CONFIG.configObj;
            let glSettings = CONFIG.glSettings;
            
            let fromSubId;
            let campGroundId;
            let deptId;
            let runHistId;

            let srcTranArr = [];
            let srcTranLinkeyArr = [];
            let totalAmt = 0.00;
            
            //Loop through grouped transaction lines
            for (let x = 0; x < reduceValues.length; x++) {
                
                let reduceValuesParsed = JSON.parse(reduceValues[x]);
                let tranLine = JSON.parse(reduceValuesParsed.tranLine);

                fromSubId = getValue(tranLine, 'subsidiarynohierarchy', false);
                campGroundId = getValue(tranLine, 'line.cseg_koa_cpg', false);
                deptId = getValue(tranLine, 'departmentnohierarchy', false);

                //Get total amount
                let amt = getValue(tranLine, 'amount', false);
                    amt = (amt) ? parseFloat(amt) : 0.00;

                totalAmt = totalAmt + amt;

                //Get unique source tran IDs
                let srcTranId = tranLine.id;
                if (!srcTranArr.includes(srcTranId)) {
                    srcTranArr.push(srcTranId);
                }

                //Get unique source tran IDs and line unique keys. For error messaging purposes
                let srcTranLineId = tranLine.lineuniquekey.value;
                let tranLineUniqueKey = `${srcTranId}_${srcTranLineId}`;
                if (!srcTranLinkeyArr.includes(tranLineUniqueKey)) {
                    srcTranLinkeyArr.push(tranLineUniqueKey);
                }

                runHistId = tranLine.runHistId;
            }

            try {

                //Get GL settings associated with the use case
                let ucGLsettings = glSettings['UC1'];
                if (ucGLsettings) {

                    //Get GL setting for the specific originating subsidiary
                    let origSubGLsetting = ucGLsettings.find(setting => setting.origSubId == fromSubId);
                    if (origSubGLsetting) {

                        let destSubId = origSubGLsetting.destSubId;
                        let destCpgId = origSubGLsetting.destCpgId;
                        let destDeptId = origSubGLsetting.destDeptId;
                        let gcClearingAccntId = origSubGLsetting.gcClearingAccntId;
                        let gcLiabilityAccntId = origSubGLsetting.gcLiabilityAccntId;

                        let icApAccntId = configObj.icApAccntId;
                        let icArAccntId = configObj.icArAccntId;

                        log.debug('Reduce - GL Settings', 'Destination Sub ID: ' + destSubId + ' | Dest. Campground ID: ' + destCpgId + ' | Clearing Accnt ID: ' + gcClearingAccntId + ' | Liability Accnt ID: ' + gcLiabilityAccntId + ' | IC AP Account ID: ' + icApAccntId + ' | IC AR Account ID: ' + icArAccntId);

                        if (destSubId && destCpgId && gcClearingAccntId && gcLiabilityAccntId && icApAccntId && icArAccntId) {

                            //Find entities to be used on elimination line accounts
                            let entitiesArr = getEntities(fromSubId, destSubId);

                            let fromSubEntityMatch = entitiesArr.find(e => e.repSubId == fromSubId);
                            let fromSubEntityId = fromSubEntityMatch ? fromSubEntityMatch.entityId : null;
                            
                            let destSubEntityMatch = entitiesArr.find(e => e.repSubId == destSubId);
                            let destSubEntityId = destSubEntityMatch ? destSubEntityMatch.entityId : null;
                            log.debug('Reduce - Entities Found', 'Originating Sub: ' + fromSubEntityId + ' | Destination Sub: ' + destSubEntityId);

                            if (fromSubEntityId && destSubEntityId) {

                                //Define JE header data
                                let jeHeader = {};
                                    jeHeader.subsidiary = fromSubId;
                                    jeHeader.custbody_mhi_koa_run_id = mrTaskId;
                                    jeHeader.custbody_mhi_koa_parent_txn = srcTranArr;
                                    jeHeader.custbody_mhi_koa_run_hist = runHistId;
                                    
                                //Define JE line data
                                let jeLinesArr = [

                                    {//Gift Card Clearing Line
                                        linesubsidiary: fromSubId,
                                        account: gcClearingAccntId,
                                        credit: totalAmt,
                                        description: 'Gift Card Redemption',
                                        cseg_koa_cpg: campGroundId,
                                        entity: destSubEntityId
                                    },
                                    {//IC A/R Line
                                        linesubsidiary: fromSubId,
                                        account: icArAccntId,
                                        debit: totalAmt,
                                        description: '',
                                        cseg_koa_cpg: campGroundId,
                                        entity: destSubEntityId
                                    },
                                    {//IC A/P Line
                                        linesubsidiary: destSubId,
                                        account: icApAccntId,
                                        credit: totalAmt,
                                        description: '',
                                        cseg_koa_cpg: destCpgId,
                                        entity: fromSubEntityId
                                    },
                                    {//Gift Card Liability Line
                                        linesubsidiary: destSubId,
                                        account: gcLiabilityAccntId,
                                        debit: totalAmt,
                                        description: 'Gift Card Redemption',
                                        cseg_koa_cpg: destCpgId,
                                        entity: fromSubEntityId
                                    }
                                ];

                                //Create JE
                                let jeResult = createJE(jeHeader, jeLinesArr);
                                if (jeResult.status == 'Success') {

                                    log.audit('Reduce - Created JE ID', jeResult.jeRecId);

                                    if (jeResult.jeRecId) {
                                        
                                        //Update the source transactions with the created JE ID
                                        for (let x = 0; x < srcTranArr.length; x++) {

                                            let srcTranId = srcTranArr[x];

                                            record.submitFields({
                                                type: 'journalentry',
                                                id: srcTranId,
                                                values: {
                                                    custbody_mhi_koa_giftcard_ic_je: jeResult.jeRecId
                                                }
                                            });
                                        }

                                        return {

                                            status: 'Success',
                                            jeRecId: jeResult.jeRecId,
                                            srcTranArr,
                                            runHistId
                                        }
                                    }

                                } else {

                                    //let errorMsg = `Reduce Error: ${jeResult.errorMsg} | Source Tran + Line Keys: ${srcTranLinkeyArr.join(', ')}`;
                                    let errorMsg = `Reduce Error: ${jeResult.errorMsg} | Key: ${reduceKey}`;

                                    log.error('Reduce - JE Creation Error', errorMsg);

                                    return {

                                        status: 'Failed',
                                        errorMsg,
                                        srcTranArr,
                                        runHistId
                                    }
                                }

                            } else {

                                throw new Error("Missing representing entities.");

                            }

                        } else {

                            throw new Error("Missing data required to proceed with JE data preparation.");

                        }

                    } else {

                        throw new Error("No GL Settings found for UC1's originating subsidiary.");
                    }

                } else {

                    throw new Error('No GL Settings found for UC1.');
                }

            } catch (error) {

                //let errorMsg = `Reduce Error: ${error.message} | Source Tran + Line Keys: ${srcTranLinkeyArr.join(', ')}`;
                let errorMsg = `Reduce Error: ${error.message} | Key: ${reduceKey}`;

                log.error('Reduce - JE Data Preparation Error', errorMsg);

                return {

                    status: 'Failed',
                    errorMsg,
                    srcTranArr,
                    runHistId
                }
            }
        }

        /**
         * Function to handle UC1 Gift Card Redemption Intercompany Journal Entry
         * @param {String} reduceKey - reduce key
         * @param {Array} reduceValues - Array of reduced values for UC1 Gift Card Redemption
         * @param {String} mrTaskId - The ID of the current map/reduce task
         * 
         * @returns {Object} - Object containing the status, JE record ID, source transaction array, and run history ID
         */
        const handleUC3_RewardsRedemptionICJE = (reduceKey, reduceValues, mrTaskId) => {

            const CONFIG = getConfig();
            let configObj = CONFIG.configObj;
            let glSettings = CONFIG.glSettings;
            
            let fromSubId;
            let campGroundId;
            let deptId;
            let runHistId;

            let srcTranArr = [];
            let srcTranLinkeyArr = [];
            let totalMembershipSalesAmt = 0.00;
            let totalRewardsRedemptionAmt = 0.00;
            
            //Loop through grouped transaction lines
            for (let x = 0; x < reduceValues.length; x++) {
                
                let reduceValuesParsed = JSON.parse(reduceValues[x]);
                let tranLine = JSON.parse(reduceValuesParsed.tranLine);

                fromSubId = getValue(tranLine, 'subsidiarynohierarchy', false);
                campGroundId = getValue(tranLine, 'line.cseg_koa_cpg', false);
                deptId = getValue(tranLine, 'departmentnohierarchy', false);

                let lineMemo = getValue(tranLine, 'memo', false);
                log.audit('lineMemo', lineMemo);

                //Get total amount
                let amt = getValue(tranLine, 'formulacurrency', false);
                    amt = (amt) ? parseFloat(amt) : 0.00;

                if (lineMemo == 'Rewards Memberships & Renewals') {
                    
                    amt = amt * 0.5;
                    totalMembershipSalesAmt = totalMembershipSalesAmt + amt;

                } else if (lineMemo == 'Rewards Redemptions') {

                    totalRewardsRedemptionAmt = totalRewardsRedemptionAmt + amt;
                }

                //totalAmt = totalAmt + amt;

                //Get unique source tran IDs
                let srcTranId = tranLine.id;
                if (!srcTranArr.includes(srcTranId)) {
                    srcTranArr.push(srcTranId);
                }

                //Get unique source tran IDs and line unique keys. For error messaging purposes
                let srcTranLineId = tranLine.lineuniquekey.value;
                let tranLineUniqueKey = `${srcTranId}_${srcTranLineId}`;
                if (!srcTranLinkeyArr.includes(tranLineUniqueKey)) {
                    srcTranLinkeyArr.push(tranLineUniqueKey);
                }

                runHistId = tranLine.runHistId;
            }

            log.audit('test', 'totalMembershipSalesAmt: ' + totalMembershipSalesAmt + ' | totalRewardsRedemptionAmt: ' + totalRewardsRedemptionAmt);
            return;

            try {

                //Get GL settings associated with the use case
                let ucGLsettings = glSettings['UC3'];
                if (ucGLsettings) {

                    //Get GL setting for the specific originating subsidiary
                    let origSubGLsetting = ucGLsettings.find(setting => setting.origSubId == fromSubId);
                    if (origSubGLsetting) {

                        let destSubId = origSubGLsetting.destSubId;
                        let destCpgId = origSubGLsetting.destCpgId;
                        let destDeptId = origSubGLsetting.destDeptId;
                        let defRevAccntId = origSubGLsetting.defRevAccntId;
                        let rLiabilityAccntId = origSubGLsetting.rLiabilityAccntId;

                        let icApAccntId = configObj.icApAccntId;
                        let icArAccntId = configObj.icArAccntId;

                        log.debug('Reduce - GL Settings', 'Destination Sub ID: ' + destSubId + ' | Dest. Campground ID: ' + destCpgId + ' | Deferred Rev. Accnt ID: ' + defRevAccntId + ' | Rewards Liability Accnt ID: ' + rLiabilityAccntId + ' | IC AP Account ID: ' + icApAccntId + ' | IC AR Account ID: ' + icArAccntId);

                        if (destSubId && destCpgId && defRevAccntId && rLiabilityAccntId && icApAccntId && icArAccntId) {

                            //Find entities to be used on elimination line accounts
                            let entitiesArr = getEntities(fromSubId, destSubId);

                            let fromSubEntityMatch = entitiesArr.find(e => e.repSubId == fromSubId);
                            let fromSubEntityId = fromSubEntityMatch ? fromSubEntityMatch.entityId : null;
                            
                            let destSubEntityMatch = entitiesArr.find(e => e.repSubId == destSubId);
                            let destSubEntityId = destSubEntityMatch ? destSubEntityMatch.entityId : null;
                            log.audit('Reduce - Entities Found', 'Originating Sub: ' + fromSubEntityId + ' | Destination Sub: ' + destSubEntityId);

                            if (fromSubEntityId && destSubEntityId) {

                                //Define JE header data
                                let jeHeader = {};
                                    jeHeader.subsidiary = fromSubId;
                                    jeHeader.custbody_mhi_koa_run_id = mrTaskId;
                                    jeHeader.custbody_mhi_koa_parent_txn = srcTranArr;
                                    jeHeader.custbody_mhi_koa_run_hist = runHistId;
                                    
                                //Define JE line data
                                let jeLinesArr = [

                                    {//Originating Sub Deferred Revenue Line
                                        linesubsidiary: fromSubId,
                                        account: defRevAccntId,
                                        debit: totalAmt,
                                        description: 'Rewards Membership Sales (Percentage %)',
                                        cseg_koa_cpg: campGroundId,
                                        entity: destSubEntityId
                                    },
                                    {//Originating Sub Rewards Liability Line
                                        linesubsidiary: fromSubId,
                                        account: rLiabilityAccntId,
                                        credit: totalAmt,
                                        description: 'Rewards Redemptions',
                                        cseg_koa_cpg: campGroundId,
                                        entity: destSubEntityId
                                    },
                                    {//Originating Sub A/R Line
                                        linesubsidiary: fromSubId,
                                        account: icArAccntId,
                                        debit: totalAmt,
                                        description: 'Rewards Membership Sales (Percentage %) & Redemptions (Netted)',
                                        cseg_koa_cpg: campGroundId,
                                        entity: destSubEntityId
                                    },
                                    {//Destination Sub A/P Line
                                        linesubsidiary: destSubId,
                                        account: icApAccntId,
                                        debit: totalAmt,
                                        description: 'Rewards Membership Sales (Percentage %) & Redemptions (Netted)',
                                        cseg_koa_cpg: destCpgId,
                                        entity: fromSubEntityId
                                    },
                                    {//Destination Sub Rewards Liability Line
                                        linesubsidiary: destSubId,
                                        account: rLiabilityAccntId,
                                        debit: totalAmt,
                                        description: 'Rewards Redemptions',
                                        cseg_koa_cpg: destCpgId,
                                        entity: fromSubEntityId
                                    },
                                    {//Destination Sub Deferred Revenue Line
                                        linesubsidiary: destSubId,
                                        account: defRevAccntId,
                                        credit: totalAmt,
                                        description: 'Rewards Membership Sales (Percentage %)',
                                        cseg_koa_cpg: destCpgId,
                                        entity: fromSubEntityId
                                    },
                                ];

                                log.audit('jeLinesArr', jeLinesArr);

                                //Create JE
                                let jeResult = createJE(jeHeader, jeLinesArr);
                                if (jeResult.status == 'Success') {

                                    log.audit('Reduce - Created JE ID', jeResult.jeRecId);

                                    if (jeResult.jeRecId) {
                                        
                                        //Update the source transactions with the created JE ID
                                        for (let x = 0; x < srcTranArr.length; x++) {

                                            let srcTranId = srcTranArr[x];

                                            record.submitFields({
                                                type: 'journalentry',
                                                id: srcTranId,
                                                values: {
                                                    custbody_mhi_koa_giftcard_ic_je: jeResult.jeRecId
                                                }
                                            });
                                        }

                                        return {

                                            status: 'Success',
                                            jeRecId: jeResult.jeRecId,
                                            srcTranArr,
                                            runHistId
                                        }
                                    }

                                } else {

                                    //let errorMsg = `Reduce Error: ${jeResult.errorMsg} | Source Tran + Line Keys: ${srcTranLinkeyArr.join(', ')}`;
                                    let errorMsg = `Reduce Error: ${jeResult.errorMsg} | Key: ${reduceKey}`;

                                    log.error('Reduce - JE Creation Error', errorMsg);

                                    return {

                                        status: 'Failed',
                                        errorMsg,
                                        srcTranArr,
                                        runHistId
                                    }
                                }

                            } else {

                                throw new Error("Missing representing entities.");

                            }

                        } else {

                            throw new Error("Missing data required to proceed with JE data preparation.");

                        }

                    } else {

                        throw new Error("No GL Settings found for UC3's originating subsidiary.");
                    }

                } else {

                    throw new Error('No GL Settings found for UC3.');
                }

            } catch (error) {

                //let errorMsg = `Reduce Error: ${error.message} | Source Tran + Line Keys: ${srcTranLinkeyArr.join(', ')}`;
                let errorMsg = `Reduce Error: ${error.message} | Key: ${reduceKey}`;

                log.error('Reduce - JE Data Preparation Error', errorMsg);

                return {

                    status: 'Failed',
                    errorMsg,
                    srcTranArr,
                    runHistId
                }
            }
        }

        /**
         * Function to handle UC4 Donation Roundups & Fundraisers Intercompany Journal Entry
         * @param {String} reduceKey - reduce key
         * @param {Array} reduceValues - Array of reduced values for Donation Roundups & Fundraisers
         * @param {String} mrTaskId - The ID of the current map/reduce task
         * 
         * @returns {Object} - Object containing the status, JE record ID, source transaction array, and run history ID
         */
        const handleUC4_handleDonationICJE = (reduceKey, reduceValues, mrTaskId) => {

            const CONFIG = getConfig();
            let configObj = CONFIG.configObj;
            let glSettings = CONFIG.glSettings;
            
            let fromSubId;
            let campGroundId;
            let deptId;
            let runHistId;

            let srcTranArr = [];
            let srcTranLinkeyArr = [];
            let totalAmt = 0.00;
            
            //Loop through grouped transaction lines
            for (let x = 0; x < reduceValues.length; x++) {
                
                let reduceValuesParsed = JSON.parse(reduceValues[x]);
                let tranLine = JSON.parse(reduceValuesParsed.tranLine);

                fromSubId = getValue(tranLine, 'subsidiarynohierarchy', false);
                campGroundId = getValue(tranLine, 'line.cseg_koa_cpg', false);
                deptId = getValue(tranLine, 'departmentnohierarchy', false);

                //Get total amount
                let amt = getValue(tranLine, 'formulacurrency', false);
                    amt = (amt) ? parseFloat(amt) : 0.00;

                totalAmt = totalAmt + amt;

                //Get unique source tran IDs
                let srcTranId = tranLine.id;
                if (!srcTranArr.includes(srcTranId)) {
                    srcTranArr.push(srcTranId);
                }

                //Get unique source tran IDs and line unique keys. For error messaging purposes
                let srcTranLineId = tranLine.lineuniquekey.value;
                let tranLineUniqueKey = `${srcTranId}_${srcTranLineId}`;
                if (!srcTranLinkeyArr.includes(tranLineUniqueKey)) {
                    srcTranLinkeyArr.push(tranLineUniqueKey);
                }

                runHistId = tranLine.runHistId;
            }

            try {

                //Get GL settings associated with the use case
                let ucGLsettings = glSettings['UC4'];
                if (ucGLsettings) {

                    //Get GL setting for the specific originating subsidiary
                    let origSubGLsetting = ucGLsettings.find(setting => setting.origSubId == fromSubId);
                    if (origSubGLsetting) {

                        let destSubId = origSubGLsetting.destSubId;
                        let destCpgId = origSubGLsetting.destCpgId;
                        let destDeptId = origSubGLsetting.destDeptId;
                        let donationsClearingAccntId = origSubGLsetting.donationsClearingAccntId;
                        

                        let icApAccntId = configObj.icApAccntId;
                        let icArAccntId = configObj.icArAccntId;

                        log.debug('Reduce - GL Settings', 'Destination Sub ID: ' + destSubId + ' | Dest. Campground ID: ' + destCpgId + ' | Donations Clearing Accnt ID: ' + donationsClearingAccntId + ' | IC AP Account ID: ' + icApAccntId + ' | IC AR Account ID: ' + icArAccntId);

                        if (destSubId && destCpgId && donationsClearingAccntId && icApAccntId && icArAccntId) {

                            //Find entities to be used on elimination line accounts
                            let entitiesArr = getEntities(fromSubId, destSubId);

                            let fromSubEntityMatch = entitiesArr.find(e => e.repSubId == fromSubId);
                            let fromSubEntityId = fromSubEntityMatch ? fromSubEntityMatch.entityId : null;
                            
                            let destSubEntityMatch = entitiesArr.find(e => e.repSubId == destSubId);
                            let destSubEntityId = destSubEntityMatch ? destSubEntityMatch.entityId : null;
                            log.debug('Reduce - Entities Found', 'Originating Sub: ' + fromSubEntityId + ' | Destination Sub: ' + destSubEntityId);

                            if (fromSubEntityId && destSubEntityId) {

                                //Define JE header data
                                let jeHeader = {};
                                    jeHeader.subsidiary = fromSubId;
                                    jeHeader.custbody_mhi_koa_run_id = mrTaskId;
                                    jeHeader.custbody_mhi_koa_parent_txn = srcTranArr;
                                    jeHeader.custbody_mhi_koa_run_hist = runHistId;
                                    
                                //Define JE line data
                                let jeLinesArr = [

                                    {//Donation Clearing Line
                                        linesubsidiary: fromSubId,
                                        account: donationsClearingAccntId,
                                        debit: totalAmt,
                                        description: 'Round ups and fundraisers',
                                        cseg_koa_cpg: campGroundId,
                                        entity: destSubEntityId
                                    },
                                    {//IC A/R Line
                                        linesubsidiary: fromSubId,
                                        account: icApAccntId,
                                        credit: totalAmt,
                                        description: '',
                                        cseg_koa_cpg: campGroundId,
                                        entity: destSubEntityId
                                    },
                                    {//IC A/P Line
                                        linesubsidiary: destSubId,
                                        account: icArAccntId,
                                        debit: totalAmt,
                                        description: '',
                                        cseg_koa_cpg: destCpgId,
                                        entity: fromSubEntityId
                                    },
                                    {//Donation Clearing Line
                                        linesubsidiary: destSubId,
                                        account: donationsClearingAccntId,
                                        credit: totalAmt,
                                        description: 'Round ups and fundraisers',
                                        cseg_koa_cpg: destCpgId,
                                        entity: fromSubEntityId
                                    }
                                ];

                                //Create JE
                                let jeResult = createJE(jeHeader, jeLinesArr);
                                if (jeResult.status == 'Success') {

                                    log.audit('Reduce - Created JE ID', jeResult.jeRecId);

                                    if (jeResult.jeRecId) {
                                        
                                        //Update the source transactions with the created JE ID
                                        for (let x = 0; x < srcTranArr.length; x++) {

                                            let srcTranId = srcTranArr[x];

                                            record.submitFields({
                                                type: 'journalentry',
                                                id: srcTranId,
                                                values: {
                                                    custbody_mhi_koa_donation_ic_je: jeResult.jeRecId
                                                }
                                            });
                                        }

                                        return {

                                            status: 'Success',
                                            jeRecId: jeResult.jeRecId,
                                            srcTranArr,
                                            runHistId
                                        }
                                    }

                                } else {

                                    //let errorMsg = `Reduce Error: ${jeResult.errorMsg} | Source Tran + Line Keys: ${srcTranLinkeyArr.join(', ')}`;
                                    let errorMsg = `Reduce Error: ${jeResult.errorMsg} | Key: ${reduceKey}`;

                                    log.error('Reduce - JE Creation Error', errorMsg);

                                    return {

                                        status: 'Failed',
                                        errorMsg,
                                        srcTranArr,
                                        runHistId
                                    }
                                }

                            } else {

                                throw new Error("Missing representing entities.");

                            }

                        } else {

                            throw new Error("Missing data required to proceed with JE data preparation.");

                        }

                    } else {

                        throw new Error("No GL Settings found for UC1's originating subsidiary.");
                    }

                } else {

                    throw new Error('No GL Settings found for UC1.');
                }

            } catch (error) {

                //let errorMsg = `Reduce Error: ${error.message} | Source Tran + Line Keys: ${srcTranLinkeyArr.join(', ')}`;
                let errorMsg = `Reduce Error: ${error.message} | Key: ${reduceKey}`;

                log.error('Reduce - JE Data Preparation Error', errorMsg);

                return {

                    status: 'Failed',
                    errorMsg,
                    srcTranArr,
                    runHistId
                }
            }
        }

        /**
         * Function to get IC entities to be used on elim line accounts
         * @param {Number} fromSubId - originating subsidiary internal id
         * @param {Number} destSubId - destination subsidiary internal id
         * 
         * @returns {Array} IC entities
         */
        const getEntities = (fromSubId, destSubId) => {

            let entitiesArr = [];

            let entitySearchObj = search.create({
                type: "entity",
                filters:
                [
                    ["isinactive","is","F"], 
                    "AND", 
                    ["representingsubsidiary","anyof", [fromSubId, destSubId]]
                ],
                columns:
                [
                    search.createColumn({name: "representingsubsidiary", label: "Represents Subsidiary"}),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{type}",
                        label: "Formula (Text)"
                    })
                ]
            });

            let searchResultCount = entitySearchObj.runPaged().count;
            let searchResultCols = entitySearchObj.columns;

            if (searchResultCount) {

                entitySearchObj.run().each(function(result){
                    
                    entitiesArr.push({

                        entityId: result.id,
                        repSubId: result.getValue(searchResultCols[0])
                    });

                    return true;
                });
            }

            return entitiesArr;
        }

        /**
         * Function to create Journal Entry record
         * @param {Object} jeHeader - Object containing the header values for the JE
         * @param {Array} jeLinesArr - Array of objects containing the line values for the JE
         * 
         * @returns {Number} - The internal ID of the created JE record
         */
        const createJE = (jeHeader, jeLinesArr) => {

            try {

                let jeRecObj = record.create({

                    type: 'advintercompanyjournalentry',
                    isDynamic: true
                });

                let jeheaderKeys = Object.keys(jeHeader);
                
                //Set JE Header values
                for (let x = 0; x < jeheaderKeys.length; x++) {

                    let key = jeheaderKeys[x];

                    jeRecObj.setValue({fieldId: key, value: jeHeader[key]});
                }

                //Set JE Line values
                for (let x = 0; x < jeLinesArr.length; x++) {

                    let jeLine = jeLinesArr[x];
                    let jeLineKeys = Object.keys(jeLine);

                    jeRecObj.selectNewLine({sublistId: 'line'});

                    for (let y = 0; y < jeLineKeys.length; y++) {

                        let key = jeLineKeys[y];

                        jeRecObj.setCurrentSublistValue({sublistId: 'line', fieldId: key, value: jeLine[key]});
                        
                    }
                    jeRecObj.commitLine({sublistId: 'line'});
                }

                let jeRecId = jeRecObj.save({ignoreMandatoryFields: true});
                //let jeRecId = 16868;
                
                return {
                    
                    status: 'Success',
                    jeRecId
                };

            } catch (error) {

                return {
                    
                    status: 'Failed',
                    errorMsg: error.message
                };
            }
        }

        /**
         * Function to create or update the Run History record based on the stage and action
         * @param {String} stage - The stage of the Map/Reduce script ('getInput' or 'summary')
         * @param {String} action - The action to perform ('create' or 'update')
         * @param {Object} params - Additional parameters required for the action
         * 
         * @returns {Number} - The internal ID of the created or updated Run History record
         */
        const createOrUpdateRunHistory = (stage, action, params) => {

            let runHistId;

            let currDate = new Date();

            //Logic to create or update the Run History record based on the stage and action
            if (stage == 'getInput') {

                // Logic for creating the Run History record during the getInput stage
                if (action == 'create') {

                    let runHistRecObj = record.create({
                        type: 'customrecord_mhi_koa_txn_runhist',
                        isDynamic: true
                    });

                    let mrTaskId = getCurrentTaskId();

                    runHistRecObj.setValue('name', `Run ${currDate} — Daily Activity Downstream`);
                    runHistRecObj.setValue('custrecord_mhi_koa_runhist_script', 1); //Daily Activity Downstream
                    runHistRecObj.setValue('custrecord_mhi_koa_runhist_run_id', mrTaskId);
                    runHistRecObj.setValue('custrecord_mhi_koa_runhist_biz_date', currDate);
                    runHistRecObj.setValue('custrecord_mhi_koa_runhist_start', currDate);

                    runHistId = runHistRecObj.save({ignoreMandatoryFields: true});
                
                // Logic for updating the Run History record during the getInput stage
                } else if (action == 'update') {

                    if (params.status == 'Failed') {

                        let runHistRecObj = record.load({
                            type: 'customrecord_mhi_koa_txn_runhist',
                            id: params.runHistId,
                            isDynamic: true
                        });

                        runHistRecObj.setValue('custrecord_mhi_koa_runhist_end', currDate);
                        runHistRecObj.setValue('custrecord_mhi_koa_runhist_status', 3); //Failed
                        runHistRecObj.setValue('custrecord_mhi_koa_runhist_fail_detail', params.errorMsg);

                        runHistId = runHistRecObj.save({ignoreMandatoryFields: true});
                    }
                }

            // Logic for updating the Run History record during the summary stage
            } else if (stage == 'summary') {

                if (action == 'update') {

                    let runHistRecObj = record.load({
                        type: 'customrecord_mhi_koa_txn_runhist',
                        id: params.runHistId,
                        isDynamic: true
                    });
                    
                    runHistRecObj.setValue('custrecord_mhi_koa_runhist_end', currDate);
                    runHistRecObj.setValue('custrecord_mhi_koa_runhist_rows_read', (params.countSuccess + params.countFailed));
                    runHistRecObj.setValue('custrecord_mhi_koa_runhist_posted', params.countJEsCreated);
                    runHistRecObj.setValue('custrecord_mhi_koa_runhist_failures', params.countFailed);

                    if (params.countSuccess > 0 && params.countFailed == 0) {

                        runHistRecObj.setValue('custrecord_mhi_koa_runhist_status', 1); //Success
                        
                    } else if (params.countSuccess > 0 && params.countFailed > 0) {

                        runHistRecObj.setValue('custrecord_mhi_koa_runhist_status', 2); //Partial Success
                        
                    } else if (params.countSuccess == 0) {

                        runHistRecObj.setValue('custrecord_mhi_koa_runhist_status', 3); //Failed
                    }

                    if (params.failuresArr && params.failuresArr.length > 0) {

                        runHistRecObj.setValue('custrecord_mhi_koa_runhist_fail_detail', params.failuresArr.join('\n'));
                    }

                    runHistId = runHistRecObj.save({ignoreMandatoryFields: true});
                }
            }

            return runHistId;
        }
        //--------------------------------------------------------------- MAIN FUNCTIONS ----------------------------------------------------------------//

        return {
            
            getConfig,
            getSearchParamMapping,
            getSearchResult,
            getAllSearchResults,
            createKey,
            getValue,
            getCurrentTaskId,
            handleUC1_GiftCardRedemptionICJE,
            handleUC3_RewardsRedemptionICJE,
            handleUC4_handleDonationICJE,
            createOrUpdateRunHistory
        }

    });