document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const clearFile = document.getElementById('clearFile');
    const previewSection = document.getElementById('previewSection');
    const previewTable = document.getElementById('previewTable');
    const importBtn = document.getElementById('importBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const downloadTemplate = document.getElementById('downloadTemplate');

    let currentFile = null;
    let workbookData = null;

    // Drag and drop handlers
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        handleFile(file);
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        handleFile(file);
    });



    // Clear file
    clearFile.addEventListener('click', clearFileSelection);

    // Import button
    importBtn.addEventListener('click', importTrades);

    // Cancel button
    cancelBtn.addEventListener('click', () => {
        clearFileSelection();
        previewSection.classList.add('hidden');
    });

    // Download template
    downloadTemplate.addEventListener('click', downloadExcelTemplate);

    function handleFile(file) {
        if (!file) return;

        const validExtensions = ['.xlsx', '.xls', '.csv'];
        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

        if (!validExtensions.includes(fileExtension)) {
            alert('Please upload an Excel file (.xlsx, .xls) or a CSV file (.csv).');
            return;
        }

        currentFile = file;
        fileName.textContent = file.name;
        fileInfo.classList.remove('hidden');
        dropZone.style.display = 'none';

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                if (fileExtension === '.csv') {
                    // Handle CSV file
                    const csvContent = e.target.result;
                    const workbook = XLSX.read(csvContent, { type: 'string' });
                    workbookData = workbook;
                } else {
                    // Handle Excel file
                    const data = new Uint8Array(e.target.result);
                    workbookData = XLSX.read(data, { type: 'array' });
                }
                displayPreview(workbookData);
            } catch (error) {
                console.error('Error reading file:', error);
                alert('Error reading the file. Please make sure it\'s a valid Excel or CSV file.');
                clearFileSelection();
            }
        };

        // Read file based on type
        if (fileExtension === '.csv') {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    }

    // Helper function to normalize strings for comparison
    function normalizeString(str) {
        return str.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // Remove special characters
            .replace(/\s+/g, ' ')         // Normalize whitespace
            .trim();                      // Remove leading/trailing whitespace
    }

    // Helper function to check if a string contains any of the target words
    function containsAnyWord(str, words) {
        const normalizedStr = normalizeString(str);
        return words.some(word => normalizeString(word).split(' ').some(w => normalizedStr.includes(w)));
    }

    // Helper function to find the best matching column
    function findMatchingColumn(headers, possibleMatches) {
        // Convert headers to normalized form for consistent matching
        const normalizedHeaders = headers.map(h => ({
            original: h,
            normalized: normalizeString(h)
        }));

        // Check for partial matches first (more relaxed approach)
        for (let i = 0; i < normalizedHeaders.length; i++) {
            for (const match of possibleMatches) {
                if (normalizedHeaders[i].normalized.includes(normalizeString(match))) {
                    return headers[i];
                }
            }
        }

        // First try to find exact matches
        for (let i = 0; i < normalizedHeaders.length; i++) {
            if (possibleMatches.some(match =>
                normalizeString(match) === normalizedHeaders[i].normalized)) {
                return headers[i];
            }
        }

        // Then try to find headers containing all words from any possible match
        for (let i = 0; i < normalizedHeaders.length; i++) {
            for (const match of possibleMatches) {
                const matchWords = normalizeString(match).split(' ');
                if (matchWords.every(word =>
                    normalizedHeaders[i].normalized.includes(word))) {
                    return headers[i];
                }
            }
        }

        // Finally, try to find headers containing any word from possible matches
        for (let i = 0; i < normalizedHeaders.length; i++) {
            if (containsAnyWord(normalizedHeaders[i].normalized, possibleMatches)) {
                return headers[i];
            }
        }

        return null;
    }

    function clearFileSelection() {
        currentFile = null;
        workbookData = null;
        fileInput.value = '';
        fileName.textContent = '';
        fileInfo.classList.add('hidden');
        dropZone.style.display = 'block';
        previewSection.classList.add('hidden');
    }

    function displayPreview(workbook) {
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        if (data.length < 2) {
            alert('The file appears to be empty or invalid.');
            clearFileSelection();
            return;
        }

        // Find the first row with data (within first 4 rows)
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(4, data.length); i++) {
            if (data[i] && data[i].some(cell => cell !== null && cell !== undefined && cell !== '')) {
                headerRowIndex = i;
                break;
            }
        }

        if (headerRowIndex === -1) {
            alert('No data found in the first 4 rows of the file.');
            clearFileSelection();
            return;
        }

        const headers = data[headerRowIndex];

        // Define possible column matches for each required field
        const columnMatches = {
            date: ['date', 'trade date', 'execution date', 'transaction date', 'run date', 'settlement date', 'time', 'datetime'],
            symbol: ['symbol', 'ticker', 'security', 'stock', 'instrument', 'security symbol', 'stock symbol'],
            entryPrice: ['entry price', 'entry', 'buy price', 'purchase price', 'cost', 'cost basis', 'fill price', 'execution price'],
            exitPrice: ['exit price', 'exit', 'sell price', 'sale price', 'price', 'closing price', 'settlement price'],
            quantity: ['quantity', 'qty', 'shares', 'size', 'position size', 'contracts', 'share quantity', 'fill quantity'],
            amount: ['amount', 'value', 'cost', 'revenue', 'gain/loss']
        };

        // Find matching columns
        const columnMap = {
            date: findMatchingColumn(headers, columnMatches.date),
            symbol: findMatchingColumn(headers, columnMatches.symbol),
            entryPrice: findMatchingColumn(headers, columnMatches.entryPrice),
            exitPrice: findMatchingColumn(headers, columnMatches.exitPrice),
            quantity: findMatchingColumn(headers, columnMatches.quantity),
            amount: findMatchingColumn(headers, columnMatches.amount)
        };

        // Check if we found all required columns
        const requiredColumns = ['symbol']; // Only symbol is strictly required
        const missingColumns = requiredColumns
            .filter(key => !columnMap[key])
            .map(key => key);

        // if (missingColumns.length > 0) {
        //     alert(`Could not find columns for: ${missingColumns.join(', ')}\n\nPlease make sure your file contains these columns.`);
        //     clearFileSelection();
        //     return;
        // }

        // If both quantity and amount are missing, we need at least one
        // if (!columnMap.quantity && !columnMap.amount) {
        //     alert('Could not find a column for quantity or amount. Please make sure your file contains at least one of these columns.');
        //     clearFileSelection();
        //     return;
        // }

        // If both entry and exit price are missing, we need at least one
        // if (!columnMap.entryPrice && !columnMap.exitPrice) {
        //     alert('Could not find a column for price. Please make sure your file contains at least one price column.');
        //     clearFileSelection();
        //     return;
        // }

        // Preview only the first few rows after the header
        const previewData = data.slice(headerRowIndex + 1, headerRowIndex + 6);
        const tableHTML = generatePreviewTable(headers, previewData, columnMap);

        previewTable.innerHTML = tableHTML;
        previewSection.classList.remove('hidden');

        // Store column map for later use
        workbookData.columnMap = columnMap;
    }

    function generatePreviewTable(headers, data, columnMap) {
        let tableHTML = '<thead><tr>';
        headers.forEach(header => {
            const isRequired = Object.values(columnMap).includes(header);
            tableHTML += `<th${isRequired ? ' class="required-column"' : ''}>${header}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';

        // Add up to 5 rows of data for preview
        data.forEach(row => {
            tableHTML += '<tr>';
            headers.forEach((_, index) => {
                tableHTML += `<td>${row[index] || ''}</td>`;
            });
            tableHTML += '</tr>';
        });
        tableHTML += '</tbody>';
        return tableHTML;
    }

    function parseDate(dateValue) {
        // Default to today's date if no value provided
        if (!dateValue) return new Date();

        // If it's already a Date object
        if (dateValue instanceof Date) {

            const time = dateValue.getTime();
            return isNaN(time) ? new Date() : dateValue;
        }

        // If it's an Excel serial number
        if (typeof dateValue === 'number') {
            try {
                // Excel's epoch starts from January 1, 1900
                const excelEpoch = new Date(1900, 0, 0);
                const millisecondsPerDay = 24 * 60 * 60 * 1000;
                const date = new Date(excelEpoch.getTime() + (dateValue - 1) * millisecondsPerDay);

                // Validate the date is reasonable (between 1900 and 2100)
                if (date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
                    return date;
                }
            } catch (error) {
                console.warn('Failed to parse Excel date:', dateValue);
            }
            return new Date(); // Default to today if parsing fails
        }

        // Try parsing string formats
        const dateStr = dateValue.toString().trim();

        // Try parsing with Date.parse
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
            return parsedDate;
        }

        // Try common date formats
        const formats = [
            /^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/, // DD/MM/YYYY or MM/DD/YYYY
            /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/, // YYYY/MM/DD
            /^(\d{1,2})[-/](\w{3,})[-/](\d{2,4})$/, // DD/MMM/YYYY
        ];

        for (const format of formats) {
            const match = dateStr.match(format);
            if (match) {
                const [_, part1, part2, part3] = match;

                // Try different date combinations
                const attempts = [
                    new Date(part3, part2 - 1, part1), // DD/MM/YYYY
                    new Date(part3, part1 - 1, part2), // MM/DD/YYYY
                    new Date(part1, part2 - 1, part3), // YYYY/MM/DD
                ];

                for (const attempt of attempts) {
                    if (!isNaN(attempt.getTime())) {
                        return attempt;
                    }
                }
            }
        }

        // If all parsing attempts fail, return today's date
        console.warn('Failed to parse date:', dateValue);
        return new Date();
    }

    // // Helper function to validate if a row contains trade data
    // function isTradeDataRow(row, headers, columnMap) {
    //     if (!row || row.length === 0) return false;

    //     // Get the values we need to check
    //     const symbol = row[headers.indexOf(columnMap.symbol)];
    //     const entryPrice = row[headers.indexOf(columnMap.entryPrice)];
    //     const exitPrice = row[headers.indexOf(columnMap.exitPrice)];
    //     const quantity = row[headers.indexOf(columnMap.quantity)];

    //     // Debug log
    //     console.log('Checking row:', {
    //         symbol,
    //         entryPrice,
    //         exitPrice,
    //         quantity,
    //         hasSymbol: Boolean(symbol),
    //         isValidPrice: !isNaN(parseFloat(entryPrice)) || !isNaN(parseFloat(exitPrice)),
    //         isValidQuantity: !isNaN(parseFloat(quantity))
    //     });

    //     // Check if we have a symbol (any non-empty string)
    //     const hasSymbol = Boolean(symbol && symbol.toString().trim());

    //     // Check if we have at least one valid numeric value in price or quantity
    //     const hasValidNumber = [entryPrice, exitPrice, quantity].some(value => {
    //         const num = parseFloat(value);
    //         return !isNaN(num) && isFinite(num);
    //     });

    //     return hasSymbol && hasValidNumber;
    // }

    // // Helper function to determine if a row is a buy or sell
    // function getTradeAction(row, headers, columnMap) {
    //     // Check common variations of buy/sell indicators
    //     const actionIndicators = [
    //         'action', 'type', 'side', 'buy/sell', 'transaction type', 'trade type',
    //         'order type', 'trade action', 'position', 'direction'
    //     ];

    //     // Log the row headers and values for debugging
    //     console.log('Checking trade action for row:', {
    //         headers: headers,
    //         values: row,
    //         columnMap: columnMap
    //     });

    //     // Check each header for action indicators

    //     for (let i = 0; i < headers.length; i++) {
    //         const header = headers[i].toLowerCase();
    //         if (actionIndicators.some(indicator => header.includes(indicator))) {
    //             const value = (row[i] || '').toString().toLowerCase();
    //             console.log('Found action column:', { header, value });

    //             // Check for buy indicators
    //             if (value.includes('buy') || value.includes('bought') || value === 'b' || value === 'long') {
    //                 return 'buy';
    //             }
    //             // Check for sell indicators
    //             if (value.includes('sell') || value.includes('sold') || value === 's' || value === 'short') {
    //                 return 'sell';
    //             }
    //         }
    //     }

    //     // If no explicit action column found, try to infer from price columns
    //     const entryPrice = row[headers.indexOf(columnMap.entryPrice)];
    //     const exitPrice = row[headers.indexOf(columnMap.exitPrice)];

    //     console.log('Checking prices for action:', {
    //         entryPrice,
    //         exitPrice,
    //         entryCol: columnMap.entryPrice,
    //         exitCol: columnMap.exitPrice
    //     });

    //     // If only entry price is present, it's likely a buy
    //     if (entryPrice && !exitPrice) {
    //         return 'buy';
    //     }
    //     // If only exit price is present, it's likely a sell
    //     if (!entryPrice && exitPrice) {
    //         return 'sell';
    //     }

    //     // If both prices are present, check their column names
    //     const entryHeader = headers[headers.indexOf(columnMap.entryPrice)].toLowerCase();
    //     const exitHeader = headers[headers.indexOf(columnMap.exitPrice)].toLowerCase();

    //     if (entryHeader.includes('buy') || entryHeader.includes('entry')) {
    //         return 'buy';
    //     }
    //     if (exitHeader.includes('sell') || exitHeader.includes('exit')) {
    //         return 'sell';
    //     }

    //     // If we can't determine the action, log it and return null
    //     console.warn('Could not determine trade action from row:', {
    //         headers: headers,
    //         values: row,
    //         columnMap: columnMap
    //     });

    //     return null;
    // }

    // Helper function to extract price from a cell that might contain text
    function extractPrice(value) {
        if (typeof value === 'number') return parseFloat(value.toFixed(2));
        if (!value) return NaN;

        // Convert to string and extract numbers
        const str = value.toString();
        // const matches = str.match(/[-]?\d[\d,]*\.?\d*/g);
        // return matches ? parseFloat(matches[0].replace(/,/g, '')) : NaN;
        console.log('Extracting price from:', str);

        // Remove any currency symbols and commas
        const cleaned = str.replace(/[$,]/g, '');

        // Try to find a number pattern
        const matches = cleaned.match(/[-]?\d*\.?\d+/);
        if (matches) {
            const price = parseFloat(matches[0]);
            const formattedPrice = price.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
            console.log('Extracted price:', price);
            return parseFloat(formattedPrice);
        }

        console.warn('Could not extract price from:', str);
        return NaN;
    }

    let allTransactions = [];
    // let selectedTrades = new Set();
    // let pairedTrades = new Map(); // Maps trade IDs to their paired trade IDs
    let batchTrades = new Map(); // symbol -> BatchTrade
    let selectedBatchTrade = null;
    let unpairedTrades = [];

    // Modal elements
    const verificationModal = document.getElementById('tradeVerificationModal');
    const closeModalBtn = document.querySelector('.close-modal');
    // const pairTradesBtn = document.getElementById('pairTradesBtn');
    const closeDetailsBtn = document.querySelector('.close-details');
    const confirmTradesBtn = document.getElementById('confirmTradesBtn');
    const cancelImportBtn = document.getElementById('cancelImportBtn');
    // const tradesVerificationBody = document.getElementById('tradesVerificationBody');
    const batchTradesBody = document.getElementById('batchTradesBody');
    const tradeDetails = document.getElementById('tradeDetails');
    const entriesTableBody = document.getElementById('entriesTableBody');
    const exitsTableBody = document.getElementById('exitsTableBody');
    const unpairSelectedBtn = document.getElementById('unpairSelectedBtn');
    const addTradesBtn = document.getElementById('addTradesBtn');
    const unpairedTradesModal = document.getElementById('unpairedTradesModal');
    const unpairedTradesBody = document.getElementById('unpairedTradesBody');
    const addSelectedTradesBtn = document.getElementById('addSelectedTradesBtn');

    const createFromUnpairedBtn = document.getElementById('createFromUnpairedBtn');
    const allUnpairedTradesModal = document.getElementById('allUnpairedTradesModal');
    const allUnpairedTradesBody = document.getElementById('allUnpairedTradesBody');
    const selectAllUnpaired = document.getElementById('selectAllUnpaired');
    const pairSelectedTradesBtn = document.getElementById('pairSelectedTradesBtn');

    // Modal event listeners
    closeModalBtn.addEventListener('click', () => {
        verificationModal.classList.remove('show');
    });

    
    // Add event listeners for closing the unpaired trades modal
    document.querySelectorAll('[data-modal="unpairedTradesModal"]').forEach(btn => {
        btn.addEventListener('click', () => {
            unpairedTradesModal.classList.remove('show', 'stacked');
        });
    });

    // pairTradesBtn.addEventListener('click', pairSelectedTrades);
    closeDetailsBtn.addEventListener('click', () => {
        tradeDetails.classList.add('hidden');
        selectedBatchTrade = null;
        document.querySelectorAll('.selected-row').forEach(row => {
            row.classList.remove('selected-row');
        });
    });

    confirmTradesBtn.addEventListener('click', processVerifiedTrades);
    cancelImportBtn.addEventListener('click', () => {
        verificationModal.classList.remove('show');
        clearFileSelection();
    });

    unpairSelectedBtn.addEventListener('click', unpairSelectedTrades);
    addTradesBtn.addEventListener('click', showUnpairedTradesModal);
    addSelectedTradesBtn.addEventListener('click', addSelectedTradesToBatch);

    createFromUnpairedBtn.addEventListener('click', showAllUnpairedTradesModal);
    selectAllUnpaired.addEventListener('change', handleSelectAllUnpaired);
    pairSelectedTradesBtn.addEventListener('click', createTradeFromSelected);

    // Close buttons for the new modal
    allUnpairedTradesModal.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            allUnpairedTradesModal.classList.remove('show');
        });
    });

    function showVerificationModal(transactions) {
        allTransactions = transactions;
        // selectedTrades.clear();
        // pairedTrades.clear();
        batchTrades.clear();
        unpairedTrades = [];
        selectedBatchTrade = null;

        // // Populate the verification table
        // tradesVerificationBody.innerHTML = '';
        // transactions.forEach((trade, index) => {
        //     const row = document.createElement('tr');
        //     row.dataset.tradeId = index;

        //     row.innerHTML = `
        //         <td><input type="checkbox" class="trade-selector" data-trade-id="${index}"></td>
        //         <td>${trade.date.toLocaleDateString()}</td>
        //         <td>${trade.symbol}</td>
        //         <td>${trade.action}</td>
        //         <td>${trade.price.toFixed(2)}</td>
        //         <td>${trade.quantity}</td>
        //     `;

        //     if (pairedTrades.has(index)) {
        //         row.classList.add('paired-trade');
        //     }

        //     tradesVerificationBody.appendChild(row);
        // });

        // // Add click handlers for trade selection
        // document.querySelectorAll('.trade-selector').forEach(checkbox => {
        //     checkbox.addEventListener('change', (e) => {
        //         const tradeId = parseInt(e.target.dataset.tradeId);
        //         if (e.target.checked) {
        //             selectedTrades.add(tradeId);
        // First pass: group transactions by symbol and create batch trades
        const symbolGroups = new Map();
        transactions.forEach((transaction, index) => {
            if (!symbolGroups.has(transaction.symbol)) {
                symbolGroups.set(transaction.symbol, []);
            }
            symbolGroups.get(transaction.symbol).push({ ...transaction, index });
        });

        // Create batch trades
        for (const [symbol, trades] of symbolGroups) {
            const batchTrade = new BatchTrade(symbol);
            trades.sort((a, b) => a.date - b.date);

            // Try to match trades
            const entries = trades.filter(t => t.action === 'buy');
            const exits = trades.filter(t => t.action === 'sell');

            // Add matched trades to batch
            let entryIndex = 0;
            let exitIndex = 0;
            while (entryIndex < entries.length && exitIndex < exits.length) {
                const entry = entries[entryIndex];
                const exit = exits[exitIndex];

                if (entry.quantity === exit.quantity) {
                    batchTrade.addEntry(entry.price, entry.quantity, entry.date);
                    batchTrade.addExit(exit.price, exit.quantity, exit.date);
                    entryIndex++;
                    exitIndex++;
                } else if (entry.quantity < exit.quantity) {
                    // Split the exit trade
                    batchTrade.addEntry(entry.price, entry.quantity, entry.date);
                    batchTrade.addExit(exit.price, entry.quantity, exit.date);
                    exit.quantity -= entry.quantity;
                    entryIndex++;
                } else {
                    // selectedTrades.delete(tradeId);
                    // Split the entry trade
                    batchTrade.addEntry(entry.price, exit.quantity, entry.date);
                    batchTrade.addExit(exit.price, exit.quantity, exit.date);
                    entry.quantity -= exit.quantity;
                    exitIndex++;
                }
                //             updatePairTradesButton();
                //         });
                //     });

                //     verificationModal.classList.add('show');
                // }

                // function updatePairTradesButton() {
                //     pairTradesBtn.disabled = selectedTrades.size !== 2;
                // }
            }

            // Store remaining trades as unpaired
            while (entryIndex < entries.length) {
                unpairedTrades.push(entries[entryIndex]);
                entryIndex++;
            }
            while (exitIndex < exits.length) {
                unpairedTrades.push(exits[exitIndex]);
                exitIndex++;
            }

            if (batchTrade.entries.length > 0 || batchTrade.exits.length > 0) {
                batchTrades.set(symbol, batchTrade);
            }
        }

        // Display batch trades
        displayBatchTrades();
        verificationModal.classList.add('show');
    }
    // function pairSelectedTrades() {
    //     if (selectedTrades.size !== 2) return;

    //     const [trade1Id, trade2Id] = Array.from(selectedTrades);
    //     const trade1 = allTransactions[trade1Id];
    //     const trade2 = allTransactions[trade2Id];

    //     // Only pair trades of the same symbol
    //     if (trade1.symbol !== trade2.symbol) {
    //         alert('Can only pair trades of the same symbol');
    //         return;
    //     }

    //     // Store the pairing
    //     pairedTrades.set(trade1Id, trade2Id);
    //     pairedTrades.set(trade2Id, trade1Id);

    //     // Update UI
    //     document.querySelectorAll(`[data-trade-id="${trade1Id}"], [data-trade-id="${trade2Id}"]`)
    //         .forEach(row => row.classList.add('paired-trade'));

    //     // Clear selections
    //     selectedTrades.clear();
    //     document.querySelectorAll('.trade-selector').forEach(checkbox => checkbox.checked = false);
    //     updatePairTradesButton();
    // }

    // function processVerifiedTrades() {
    //     const processedSymbols = new Set();
    //     const symbolGroups = new Map();

    function displayBatchTrades() {
        batchTradesBody.innerHTML = '';

        for (const [symbol, batchTrade] of batchTrades) {
            const row = document.createElement('tr');
            const isComplete = batchTrade.isComplete();
            const totalQty = batchTrade.getTotalEntryQuantity();
            const avgEntry = batchTrade.getAverageEntryPrice();
            const avgExit = batchTrade.getAverageExitPrice();
            const pnl = isComplete ? ((avgExit - avgEntry) * totalQty).toFixed(2) : 'N/A';

            row.innerHTML = `
                <td>${symbol}</td>
                <td>${batchTrade.entries[0]?.date.toLocaleDateString() || 'N/A'}</td>
                <td>${batchTrade.exits[batchTrade.exits.length - 1]?.date.toLocaleDateString() || 'N/A'}</td>
                <td>${totalQty}</td>
                <td>${avgEntry.toFixed(2)}</td>
                <td>${avgExit ? avgExit.toFixed(2) : 'N/A'}</td>
                <td>${pnl}</td>
                <td class="${isComplete ? 'complete-trade' : 'incomplete-trade'}">${isComplete ? 'Complete' : 'Incomplete'}</td>
            `;

            row.addEventListener('click', () => showTradeDetails(symbol));
            batchTradesBody.appendChild(row);
        }
    }

    function showTradeDetails(symbol) {
        const batchTrade = batchTrades.get(symbol);
        if (!batchTrade) return;

        selectedBatchTrade = symbol;

        // Highlight selected row
        document.querySelectorAll('tr').forEach(row => row.classList.remove('selected-row'));
        const rows = batchTradesBody.querySelectorAll('tr');
        for (const row of rows) {
            if (row.cells[0].textContent === symbol) {
                row.classList.add('selected-row');
                break;
            }
        }
        // // First, group all transactions by symbol
        // allTransactions.forEach((transaction, index) => {
        //     if (!symbolGroups.has(transaction.symbol)) {
        //         symbolGroups.set(transaction.symbol, []);
        //     }
        //     symbolGroups.get(transaction.symbol).push({ ...transaction, index });

        // Display entries
        entriesTableBody.innerHTML = '';
        batchTrade.entries.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                            <td><input type="checkbox" class="trade-checkbox" data-trade-type="entry" data-trade-index="${index}"></td>
                        <td>${entry.date.toLocaleDateString()}</td>
                        <td>${entry.price.toFixed(2)}</td>
                        <td>${entry.quantity}</td>
                        <td><button class="unpair-btn" data-type="entry" data-index="${index}">Unpair</button></td>
                    `;
            entriesTableBody.appendChild(row);
        });

        // // Process each symbol's transactions
        // for (const [symbol, transactions] of symbolGroups) {
        //     let batchTrade = new BatchTrade(symbol);

        //     // Sort transactions by date (oldest first)
        //     transactions.sort((a, b) => a.date - b.date);

        // Display exits
        exitsTableBody.innerHTML = '';
        batchTrade.exits.forEach((exit, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                            <td><input type="checkbox" class="trade-checkbox" data-trade-type="exit" data-trade-index="${index}"></td>
                        <td>${exit.date.toLocaleDateString()}</td>
                        <td>${exit.price.toFixed(2)}</td>
                        <td>${exit.quantity}</td>
                        <td><button class="unpair-btn" data-type="exit" data-index="${index}">Unpair</button></td>
                    `;
            exitsTableBody.appendChild(row);
        });

        // Add event listeners for checkboxes to enable/disable unpair button
        document.querySelectorAll('.trade-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const hasCheckedBoxes = document.querySelectorAll('.trade-checkbox:checked').length > 0;
                unpairSelectedBtn.disabled = !hasCheckedBoxes;
            });
        });

        // // Process paired trades first
        // const pairedTransactions = transactions.filter(t => pairedTrades.has(t.index));
        // const unpairedTransactions = transactions.filter(t => !pairedTrades.has(t.index));

        // // Add paired transactions
        // for (let i = 0; i < pairedTransactions.length; i += 2) {
        //     const trade1 = pairedTransactions[i];
        //     const trade2 = pairedTransactions[i + 1];

        //     if (trade1 && trade2) {
        //         if (trade1.action === 'buy') {
        //             batchTrade.addEntry(trade1.price, trade1.quantity, trade1.date);
        //             batchTrade.addExit(trade2.price, trade2.quantity, trade2.date);
        //         } else {
        //             batchTrade.addEntry(trade2.price, trade2.quantity, trade2.date);
        //             batchTrade.addExit(trade1.price, trade1.quantity, trade1.date);
        //         }
        //     }

        // Add event listeners for unpair buttons
        document.querySelectorAll('.unpair-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                const index = parseInt(e.target.dataset.index);
                unpairTrade(symbol, type, index);
            });
        });

        tradeDetails.classList.remove('hidden');
    }

    function unpairTrade(symbol, type, index) {
        const batchTrade = batchTrades.get(symbol);
        if (!batchTrade) return;

        const trade = type === 'entry' ?
            batchTrade.entries.splice(index, 1)[0] :
            batchTrade.exits.splice(index, 1)[0];

        if (trade) {
            unpairedTrades.push({
                symbol,
                action: type === 'entry' ? 'buy' : 'sell',
                price: trade.price,
                quantity: trade.quantity,
                date: trade.date
            });
        }

        // Remove batch trade if empty
        if (batchTrade.entries.length === 0 && batchTrade.exits.length === 0) {
            batchTrades.delete(symbol);
        }

        //     // Add unpaired transactions
        //     for (const transaction of unpairedTransactions) {
        //         if (transaction.action === 'buy') {
        //             batchTrade.addEntry(transaction.price, transaction.quantity, transaction.date);
        //         } else {
        //             batchTrade.addExit(transaction.price, transaction.quantity, transaction.date);
        //         }
        //     }

        //     // Store the batch trade if it's complete
        //     if (batchTrade.isComplete()) {
        //         processedSymbols.add(symbol);
        //     }
        // }

        // // Hide modal and proceed with import
        // verificationModal.classList.remove('show');
        // finalizeImport(symbolGroups, processedSymbols);

        // Update display
        displayBatchTrades();
        showTradeDetails(symbol);
    }

    function unpairSelectedTrades() {
        const selectedTrades = document.querySelectorAll('.trade-checkbox:checked');
        selectedTrades.forEach(checkbox => {
            const type = checkbox.dataset.tradeType;
            const index = parseInt(checkbox.dataset.tradeIndex);
            unpairTrade(selectedBatchTrade, type, index);
        });
    }

    function showUnpairedTradesModal() {
        if (!selectedBatchTrade) return;
        const currentBatch = batchTrades.get(selectedBatchTrade);
        if (!currentBatch) return;

        unpairedTradesBody.innerHTML = '';
        unpairedTrades.forEach((trade, index) => {
            const row = document.createElement('tr');
            const isMatchingSymbol = trade.symbol === selectedBatchTrade;
            if (!isMatchingSymbol) row.classList.add('disabled');

            row.innerHTML = `
                <td><input type="checkbox" class="trade-checkbox" data-trade-index="${index}" ${!isMatchingSymbol ? 'disabled' : ''}></td>
                <td>${trade.date.toLocaleDateString()}</td>
                <td>${trade.symbol}</td>
                <td>${trade.action}</td>
                <td>${trade.price.toFixed(2)}</td>
                <td>${trade.quantity}</td>
            `;
            unpairedTradesBody.appendChild(row);
        });

        unpairedTradesModal.classList.add('show', 'stacked');
    }

    function addSelectedTradesToBatch() {
        if (!selectedBatchTrade) return;
        const currentBatch = batchTrades.get(selectedBatchTrade);
        if (!currentBatch) return;

        const selectedCheckboxes = document.querySelectorAll('#unpairedTradesBody .trade-checkbox:checked');
        const selectedIndices = Array.from(selectedCheckboxes).map(cb => parseInt(cb.dataset.tradeIndex));

        selectedIndices.sort((a, b) => b - a).forEach(index => {
            const trade = unpairedTrades[index];
            if (trade.action === 'buy') {
                currentBatch.addEntry(trade.price, trade.quantity, trade.date);
            } else {
                currentBatch.addExit(trade.price, trade.quantity, trade.date);
            }
            unpairedTrades.splice(index, 1);
        });

        displayBatchTrades();
        showTradeDetails(selectedBatchTrade);
        unpairedTradesModal.classList.remove('show', 'stacked');
    }

    // async function finalizeImport(symbolGroups, processedSymbols) {
    async function processVerifiedTrades() {
        let successCount = 0;
        let skippedCount = 0;
        let errors = [];

        try {
            // for (const [symbol, transactions] of symbolGroups) {
            //     if (processedSymbols.has(symbol)) {
            //         let batchTrade = new BatchTrade(symbol);

            //         // Process paired trades first
            //         const pairedTransactions = transactions.filter(t => pairedTrades.has(t.index));
            //         const unpairedTransactions = transactions.filter(t => !pairedTrades.has(t.index));

            //         // Add paired transactions
            //         for (let i = 0; i < pairedTransactions.length; i += 2) {
            //             const trade1 = pairedTransactions[i];
            //             const trade2 = pairedTransactions[i + 1];

            //             if (trade1 && trade2) {
            //                 if (trade1.action === 'buy') {
            //                     batchTrade.addEntry(trade1.price, trade1.quantity, trade1.date);
            //                     batchTrade.addExit(trade2.price, trade2.quantity, trade2.date);
            //                 } else {
            //                     batchTrade.addEntry(trade2.price, trade2.quantity, trade2.date);
            //                     batchTrade.addExit(trade1.price, trade1.quantity, trade1.date);
            //                 }
            //             }
            //         }

            //         // Add unpaired transactions
            //         for (const transaction of unpairedTransactions) {
            //             if (transaction.action === 'buy') {
            //                 batchTrade.addEntry(transaction.price, transaction.quantity, transaction.date);
            //             } else {
            //                 batchTrade.addExit(transaction.price, transaction.quantity, transaction.date);
            //             }
            //         }

            //         // Create and save the trade

            // Process complete batch trades
            for (const [symbol, batchTrade] of batchTrades) {
                if (batchTrade.isComplete()) {
                    const newTrade = batchTrade.toTrade();
                    if (newTrade) {
                        await window.tradeManager.addTrade(newTrade);
                        successCount++;
                    } else {
                        console.warn(`Failed to create trade for ${symbol} - invalid batch trade`);
                        skippedCount++;
                    }
                } else {
                    skippedCount++;
                }
            }

            const message = `Import complete:\n` +
                `- Successfully imported: ${successCount} trades\n` +
                `- Skipped: ${skippedCount}\n` +
                (errors.length > 0 ? `- Errors: ${errors.length}\n` : '') +
                // (Array.from(processedSymbols).length > 0 ? `- Unmatched positions: ${Array.from(processedSymbols).join(', ')}` : '');

                (unpairedTrades.length > 0 ? `- Unpaired trades: ${unpairedTrades.length}` : '');

            alert(message);
            verificationModal.classList.remove('show');

            if (successCount > 0) {
                window.location.href = 'trade-entry.html';
            }
        } catch (error) {
            console.error('Error importing trades:', error);
            alert('Error importing trades: ' + error.message);
        }
    }

    // Helper function to parse dates from various formats

    async function importTrades() {
        if (!workbookData || !workbookData.columnMap) return;

        const firstSheet = workbookData.Sheets[workbookData.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        // Find the header row
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(4, data.length); i++) {
            if (data[i] && data[i].some(cell => cell !== null && cell !== undefined && cell !== '')) {
                headerRowIndex = i;
                break;
            }
        }

        if (headerRowIndex === -1) {
            alert('No data found in the first 4 rows of the file.');
            return;
        }

        const headers = data[headerRowIndex];
        const columnMap = workbookData.columnMap;
        // let successCount = 0;
        // let skippedCount = 0;
        // let errors = [];

        // Keep track of open positions
        // const openPositions = new Map(); // symbol -> BatchTrade

        // // Debug logging
        // console.log('Starting import with:', {
        //     headers,
        //     columnMap,
        //     totalRows: data.length - (headerRowIndex + 1)
        // });

        try {
            // First pass: collect all validated trades
            // const allTransactions = [];
            const transactions = [];
            // if (!row || row.length === 0) continue; // Skip empty rows
            for (const row of data.slice(headerRowIndex + 1)) {
                try {
                    // Skip rows that don't look like trade data
                    // if (!row || row.length === 0) {
                    //     skippedCount++;
                    //     continue;
                    // }
                    if (!row || row.length === 0) continue;

                    const symbol = (row[headers.indexOf(columnMap.symbol)] || '').toString().trim();
                    // if (!symbol) {
                    //     skippedCount++;
                    //     continue;
                    // }
                    if (!symbol) continue;

                    // Get trade details

                    let quantity;
                    if (columnMap.quantity) {
                        quantity = parseInt(row[headers.indexOf(columnMap.quantity)]);
                    } else if (columnMap.amount) {
                        // If no quantity column but we have amount, try to derive quantity from amount
                        const amount = extractPrice(row[headers.indexOf(columnMap.amount)]);
                        // quantity = Math.abs(amount); // Assuming 1:1 ratio if no explicit quantity
                        quantity = Math.abs(amount);
                    }

                    let amount;
                    if (columnMap.amount) {
                        amount = extractPrice(row[headers.indexOf(columnMap.amount)]);
                    } else if (columnMap.quantity) {
                        // If no amount column but we have quantity, use quantity as amount
                        amount = quantity;
                    }

                    // Calculate price from amount if available
                    let price;
                    if (amount && quantity) {
                        price = Math.abs(amount / quantity);
                    } else {
                        price = extractPrice(row[headers.indexOf(columnMap.entryPrice)]) ||
                            extractPrice(row[headers.indexOf(columnMap.exitPrice)]);
                    }

                    // Use import date if no date is provided
                    let parsedDate = new Date();
                    if (columnMap.date) {
                        const dateValue = row[headers.indexOf(columnMap.date)];
                        if (dateValue) {
                            try {
                                parsedDate = parseDate(dateValue);
                            } catch (dateError) {
                                console.warn(`Invalid date for ${symbol}, using import date:`, dateValue);
                            }
                        }
                    }

                    if (!price || isNaN(quantity)) {
                        console.warn('Invalid price or quantity:', { symbol, price, quantity, amount });
                        // skippedCount++;
                        continue;
                    }

                    const tradeAction = amount ? (amount < 0 ? 'buy' : 'sell') : getTradeAction(row, headers, columnMap);
                    // Store the transaction
                    // allTransactions.push({
                    transactions.push({
                        symbol,
                        action: tradeAction,
                        price,
                        quantity,
                        date: parsedDate
                    });

                } catch (rowError) {
                    console.warn('Error processing row:', rowError);
                    // errors.push(rowError.message);
                    // skippedCount++;
                }
            }

            // Second pass: process transactions by symbol
            // const symbolGroups = new Map();

            // // Group transactions by symbol
            // for (const transaction of allTransactions) {
            //     if (!symbolGroups.has(transaction.symbol)) {
            //         symbolGroups.set(transaction.symbol, []);
            //     }
            //     symbolGroups.get(transaction.symbol).push(transaction);
            // }

            // // Process each symbol's transactions
            // for (const [symbol, transactions] of symbolGroups) {
            //     let batchTrade = new BatchTrade(symbol);

            //     // Sort transactions by date (oldest first)
            //     transactions.sort((a, b) => a.date - b.date);

            //     console.log(`Processing transactions for ${symbol}:`, transactions);

            //     // Add all transactions
            //     for (const transaction of transactions) {
            //         if (transaction.action === 'buy') {
            //             batchTrade.addEntry(transaction.price, transaction.quantity, transaction.date);
            //         } else {
            //             batchTrade.addExit(transaction.price, transaction.quantity, transaction.date);
            //         }
            //     }

            //     // Check if we have a complete trade
            //     if (batchTrade.isComplete()) {
            //         const newTrade = batchTrade.toTrade();
            //         if (newTrade) {
            //             await window.tradeManager.addTrade(newTrade);
            //             successCount++;
            //             console.log('Created complete trade:', newTrade);
            //         } else {
            //             console.warn(`Failed to create trade for ${symbol} - invalid batch trade`);
            //             skippedCount++;
            //         }
            //     } else {
            //         openPositions.set(symbol, batchTrade);
            //     }
            // }

            // // Handle any remaining open positions
            // const unmatchedSymbols = Array.from(openPositions.keys());
            // if (unmatchedSymbols.length > 0) {
            //     console.warn('Found unmatched positions:', unmatchedSymbols);
            //     for (const [symbol, batchTrade] of openPositions.entries()) {
            //         console.log(`Unmatched position details for ${symbol}:`, {
            //             entries: batchTrade.entries,
            //             totalEntryQty: batchTrade.getTotalEntryQuantity(),
            //             totalExitQty: batchTrade.getTotalExitQuantity(),
            //             averageEntryPrice: batchTrade.getAverageEntryPrice()
            //         });
            //     }
            // }

            // const message = `Import complete:\n` +
            //     `- Successfully imported: ${successCount} trades\n` +
            //     `- Skipped rows: ${skippedCount}\n` +
            //     (errors.length > 0 ? `- Errors encountered: ${errors.length}\n` : '') +
            //     (unmatchedSymbols.length > 0 ? `- Unmatched positions: ${unmatchedSymbols.join(', ')}` : '');

            // console.log(message);
            // alert(message);

            // if (successCount > 0) {
            //     window.location.href = 'trade-entry.html';
            // }
            showVerificationModal(transactions);
        } catch (error) {
            console.error('Error importing trades:', error);
            alert('Error importing trades: ' + error.message);
        }
    }

    function downloadExcelTemplate() {
        const template = [
            ['Date', 'Symbol', 'Entry Price', 'Exit Price', 'Quantity'],
            ['1/20/2025', 'AAPL', '190.50', '195.75', '100'],
            ['1/20/2025', 'MSFT', '390.25', '385.50', '50']
        ];

        // Create both Excel and CSV templates
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(template);

        // Auto-size columns for Excel
        const colWidths = template[0].map((_, i) =>
            Math.max(...template.map(row => row[i].toString().length))
        );
        ws['!cols'] = colWidths.map(w => ({ wch: w + 2 }));

        // Save as Excel
        XLSX.utils.book_append_sheet(wb, ws, 'Trades');
        XLSX.writeFile(wb, 'trade_import_template.xlsx');

        // Save as CSV
        const csvContent = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'trade_import_template.csv';
        link.click();
        URL.revokeObjectURL(link.href);
    }

    function showAllUnpairedTradesModal() {
        allUnpairedTradesBody.innerHTML = '';
        unpairedTrades.forEach((trade, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="trade-checkbox" data-trade-index="${index}"></td>
                <td>${trade.date.toLocaleDateString()}</td>
                <td>${trade.symbol}</td>
                <td>${trade.action}</td>
                <td>${trade.price.toFixed(2)}</td>
                <td>${trade.quantity}</td>
            `;
            allUnpairedTradesBody.appendChild(row);
        });

        allUnpairedTradesModal.classList.add('show');
    }

    function handleSelectAllUnpaired(e) {
        const checkboxes = allUnpairedTradesBody.querySelectorAll('.trade-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
    }

    function createTradeFromSelected() {
        const selectedCheckboxes = allUnpairedTradesBody.querySelectorAll('.trade-checkbox:checked');
        const selectedIndices = Array.from(selectedCheckboxes).map(checkbox => 
            parseInt(checkbox.getAttribute('data-trade-index'))
        );

        if (selectedIndices.length < 2) {
            alert('Please select at least 2 trades to pair together.');
            return;
        }

        const selectedTrades = selectedIndices.map(index => unpairedTrades[index]);
        const symbols = new Set(selectedTrades.map(trade => trade.symbol));

        if (symbols.size > 1) {
            alert('Please select trades with the same symbol to pair together.');
            return;
        }

        // Create a new batch trade
        const symbol = selectedTrades[0].symbol;
        let totalQuantity = 0;
        let totalBuyValue = 0;
        let totalSellValue = 0;
        let buyQuantity = 0;
        let sellQuantity = 0;
        let earliestDate = new Date(8640000000000000);
        let latestDate = new Date(-8640000000000000);

        selectedTrades.forEach(trade => {
            const quantity = trade.quantity;
            if (trade.action.toLowerCase() === 'buy') {
                totalBuyValue += trade.price * quantity;
                buyQuantity += quantity;
            } else {
                totalSellValue += trade.price * quantity;
                sellQuantity += quantity;
            }
            totalQuantity = Math.max(buyQuantity, sellQuantity);

            if (trade.date < earliestDate) earliestDate = trade.date;
            if (trade.date > latestDate) latestDate = trade.date;
        });

        const avgEntryPrice = totalBuyValue / buyQuantity;
        const avgExitPrice = totalSellValue / sellQuantity;
        const pnl = (avgExitPrice - avgEntryPrice) * totalQuantity;

        const batchTrade = {
            symbol,
            entryDate: earliestDate,
            exitDate: latestDate,
            totalQuantity,
            avgEntryPrice,
            avgExitPrice,
            pnl,
            trades: selectedTrades
        };

        // Add the batch trade and update the display
        batchTrades.set(symbol, batchTrade);
        
        // Remove the selected trades from unpairedTrades
        const newUnpairedTrades = unpairedTrades.filter((_, index) => !selectedIndices.includes(index));
        unpairedTrades = newUnpairedTrades;

        // Update displays
        displayBatchTrades();
        allUnpairedTradesModal.classList.remove('show');
    }
});
