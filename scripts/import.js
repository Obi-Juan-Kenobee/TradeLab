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
            quantity: ['quantity', 'qty', 'shares', 'size', 'position size', 'contracts', 'share quantity', 'fill quantity']
        };

        // Find matching columns
        const columnMap = {
            date: findMatchingColumn(headers, columnMatches.date),
            symbol: findMatchingColumn(headers, columnMatches.symbol),
            entryPrice: findMatchingColumn(headers, columnMatches.entryPrice),
            exitPrice: findMatchingColumn(headers, columnMatches.exitPrice),
            quantity: findMatchingColumn(headers, columnMatches.quantity)
        };

        // Check if we found all required columns
        const missingColumns = Object.entries(columnMap)
            .filter(([_, value]) => !value)
            .map(([key, _]) => key);

        if (missingColumns.length > 0) {
            alert(`Could not find columns for: ${missingColumns.join(', ')}\n\nPlease make sure your file contains these columns.`);
            clearFileSelection();
            return;
        }

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

    // Helper function to parse dates from various formats
    function parseDate(dateValue) {
        if (!dateValue) return null;

        // If it's already a Date object
        if (dateValue instanceof Date) {
            return dateValue;
        }

        // If it's an Excel serial number
        if (typeof dateValue === 'number') {
            // Excel's epoch starts from December 30, 1899
            const excelEpoch = new Date(1899, 11, 30);
            const millisecondsPerDay = 24 * 60 * 60 * 1000;
            return new Date(excelEpoch.getTime() + dateValue * millisecondsPerDay);
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

        throw new Error(`Unable to parse date: ${dateValue}`);
    }

    // Helper function to validate if a row contains trade data
    function isTradeDataRow(row, headers, columnMap) {
        if (!row || row.length === 0) return false;

        // Get the values we need to check
        const symbol = row[headers.indexOf(columnMap.symbol)];
        const entryPrice = row[headers.indexOf(columnMap.entryPrice)];
        const exitPrice = row[headers.indexOf(columnMap.exitPrice)];
        const quantity = row[headers.indexOf(columnMap.quantity)];

        // Debug log
        console.log('Checking row:', {
            symbol,
            entryPrice,
            exitPrice,
            quantity,
            hasSymbol: Boolean(symbol),
            isValidPrice: !isNaN(parseFloat(entryPrice)) || !isNaN(parseFloat(exitPrice)),
            isValidQuantity: !isNaN(parseFloat(quantity))
        });

        // Check if we have a symbol (any non-empty string)
        const hasSymbol = Boolean(symbol && symbol.toString().trim());

        // Check if we have at least one valid numeric value in price or quantity
        const hasValidNumber = [entryPrice, exitPrice, quantity].some(value => {
            const num = parseFloat(value);
            return !isNaN(num) && isFinite(num);
        });

        return hasSymbol && hasValidNumber;
    }

    // Helper function to determine if a row is a buy or sell
    function getTradeAction(row, headers, columnMap) {
        // Check common variations of buy/sell indicators
        const actionIndicators = [
            'action', 'type', 'side', 'buy/sell', 'transaction type', 'trade type'
        ];

        for (let i = 0; i < headers.length; i++) {
            const header = headers[i].toLowerCase();
            if (actionIndicators.some(indicator => header.includes(indicator))) {
                const value = (row[i] || '').toString().toLowerCase();
                if (value.includes('buy') || value.includes('bought')) return 'buy';
                if (value.includes('sell') || value.includes('sold')) return 'sell';
            }
        }

        // If no explicit action column, try to infer from other columns
        const priceStr = row[headers.indexOf(columnMap.entryPrice)] || '';
        if (typeof priceStr === 'string') {
            const priceLower = priceStr.toLowerCase();
            if (priceLower.includes('buy') || priceLower.includes('bought')) return 'buy';
            if (priceLower.includes('sell') || priceLower.includes('sold')) return 'sell';
        }

        return null;
    }

    // Helper function to extract price from a cell that might contain text
    function extractPrice(value) {
        if (typeof value === 'number') return value;
        if (!value) return NaN;

        // Convert to string and extract numbers
        const str = value.toString();
        const matches = str.match(/[-]?\d[\d,]*\.?\d*/g);
        return matches ? parseFloat(matches[0].replace(/,/g, '')) : NaN;
    }

    async function importTrades() {
        if (!workbookData || !workbookData.columnMap) return;

        const firstSheet = workbookData.Sheets[workbookData.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        // Find the header row (reuse logic from displayPreview)
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
        let successCount = 0;
        let skippedCount = 0;
        let errors = [];

        // Store incomplete trades (waiting for matching sell)
        const pendingTrades = new Map(); // symbol -> {buyRow, quantity, price, date}

        console.log('Starting import with:', { headers, columnMap });

        try {
            for (const row of data.slice(headerRowIndex + 1)) {
                // if (!row || row.length === 0) continue; // Skip empty rows
                try {
                    // Skip rows that don't look like trade data
                    if (!row || row.length === 0) {
                        skippedCount++;
                        continue;
                    }

                    const symbol = (row[headers.indexOf(columnMap.symbol)] || '').toString().trim();
                    if (!symbol) {
                        skippedCount++;
                        continue;
                    }

                    // Try to determine if this is a buy or sell row
                    const tradeAction = getTradeAction(row, headers, columnMap);
                    const price = extractPrice(row[headers.indexOf(columnMap.entryPrice)]) ||
                        extractPrice(row[headers.indexOf(columnMap.exitPrice)]);
                    const quantity = parseInt(row[headers.indexOf(columnMap.quantity)]);
                    const dateValue = row[headers.indexOf(columnMap.date)];

                    if (!price || isNaN(quantity)) {
                        console.warn('Invalid price or quantity:', { price, quantity });
                        skippedCount++;
                        continue;
                    }
                    let parsedDate;
                    try {
                        parsedDate = parseDate(dateValue);
                    } catch (dateError) {
                        console.warn(`Invalid date: ${dateValue}`);
                        skippedCount++;
                        continue;
                    }

                    // Handle based on trade action
                    if (tradeAction === 'buy') {
                        pendingTrades.set(symbol, {
                            quantity,
                            price,
                            date: parsedDate
                        });
                        console.log('Stored pending buy:', symbol, pendingTrades.get(symbol));
                    } else if (tradeAction === 'sell') {
                        const buyInfo = pendingTrades.get(symbol);
                        if (buyInfo) {
                            // Create completed trade
                            const newTrade = new Trade(
                                symbol,
                                'Unknown',
                                buyInfo.price,
                                price,
                                buyInfo.quantity,
                                buyInfo.date,
                                '',
                                'long'
                            );

                            await window.tradeManager.addTrade(newTrade);
                            pendingTrades.delete(symbol);
                            successCount++;
                            console.log('Created trade from buy/sell pair:', newTrade);
                        } else {
                            console.warn('Found sell without matching buy:', symbol);
                            skippedCount++;
                        }
                    } else {
                        // Try single-row trade format
                        const entryPrice = extractPrice(row[headers.indexOf(columnMap.entryPrice)]);
                        const exitPrice = extractPrice(row[headers.indexOf(columnMap.exitPrice)]);

                        if (!isNaN(entryPrice) && !isNaN(exitPrice)) {
                            const newTrade = new Trade(
                                symbol,
                                'Unknown', // market
                                entryPrice,
                                exitPrice,
                                quantity,
                                parsedDate,
                                '',
                                exitPrice > entryPrice ? 'long' : 'short'
                            );

                            // Use the global tradeManager instance to add the trade
                            await window.tradeManager.addTrade(newTrade);
                            successCount++;
                            console.log('Created single-row trade:', newTrade);
                        } else {
                            console.warn('Invalid prices for single-row trade:', { entryPrice, exitPrice });
                            skippedCount++;
                        }
                    }
                        } catch (rowError) {
                            console.warn('Error processing row:', rowError);
                            errors.push(rowError.message);
                            skippedCount++;
                        }
                    }

                                // Report any pending trades that didn't find matching sells
            if (pendingTrades.size > 0) {
                console.warn('Unmatched buy orders:', Array.from(pendingTrades.keys()));
            }
            
                    const message = `Import complete:\n` +
                        `- Successfully imported: ${successCount} trades\n` +
                        `- Skipped rows: ${skippedCount}\n` +
                        (errors.length > 0 ? `- Errors encountered: ${errors.length}\n` : '') +
                        (pendingTrades.size > 0 ? `- Unmatched buy orders: ${pendingTrades.size}` : '');

                    console.log(message);
                    alert(message);

                    if (successCount > 0) {
                        window.location.href = 'trade-entry.html';
                    }
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
        });
