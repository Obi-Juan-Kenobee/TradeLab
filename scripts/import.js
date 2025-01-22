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

        const headers = data[0];

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
            alert(`Could not find columns matching: ${missingColumns.join(', ')}\n\nPossible matches for each:\n` +
                missingColumns.map(col => `${col}: ${columnMatches[col].join(', ')}`).join('\n'));
            clearFileSelection();
            return;
        }

        // Create preview table
        let tableHTML = '<thead><tr>';
        headers.forEach(header => {
            const isRequired = Object.values(columnMap).includes(header);
            tableHTML += `<th${isRequired ? ' class="required-column"' : ''}>${header}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';

        // Add up to 5 rows of data for preview
        const previewRows = data.slice(1, 6);
        previewRows.forEach(row => {
            tableHTML += '<tr>';
            headers.forEach((_, index) => {
                tableHTML += `<td>${row[index] || ''}</td>`;
            });
            tableHTML += '</tr>';
        });
        tableHTML += '</tbody>';

        previewTable.innerHTML = tableHTML;
        previewSection.classList.remove('hidden');

        // Store column map for later use
        workbookData.columnMap = columnMap;
    }

    async function importTrades() {
        if (!workbookData || !workbookData.columnMap) return;

        const firstSheet = workbookData.Sheets[workbookData.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet);
        const columnMap = workbookData.columnMap;

        try {
            for (const row of data) {
                // Use mapped columns to get values
                const entryPrice = parseFloat(row[columnMap.entryPrice]);
                const exitPrice = parseFloat(row[columnMap.exitPrice]);
                const direction = exitPrice > entryPrice ? 'long' : 'short';

                // Create a new Trade instance
                const newTrade = new Trade(
                    row[columnMap.symbol],
                    'Unknown', // market
                    entryPrice,
                    exitPrice,
                    parseInt(row[columnMap.quantity]),
                    new Date(row[columnMap.date]),
                    '', // notes
                    direction
                );

                // Use the global tradeManager instance to add the trade
                await window.tradeManager.addTrade(newTrade);
            }

            alert('Trades imported successfully!');
            window.location.href = 'trade-entry.html';
        } catch (error) {
            console.error('Error importing trades:', error);
            alert('Error importing trades. Please check the console for details.');
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
