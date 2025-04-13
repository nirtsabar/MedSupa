// This file contains the JavaScript code for the client view page

// DOM elements
const fileListEl = document.getElementById('file-list');
const loadingEl = document.getElementById('loading');
const emptyFilesEl = document.getElementById('empty-files');
const clientNameEl = document.getElementById('client-name');
const fileViewerEl = document.getElementById('file-viewer');
const currentFileNameEl = document.getElementById('current-file-name');
const fileContentEl = document.getElementById('file-content');
const closeViewerBtn = document.getElementById('close-viewer');

// Initialize the client view
async function initClientView() {
    try {
        // Check if user is authenticated
        const user = await protectPage();
        if (!user) return;
        
        // Get client info to display name
        await fetchClientInfo(user);
        
        // Get files for this client
        await fetchClientFiles(user);
    // Show error message
function showErrorMessage(message) {
    loadingEl.classList.add('hidden');
    fileListEl.classList.add('hidden');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<p>${message}</p>`;
    
    // Remove any existing error messages
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Insert the error message before the file list
    fileListEl.parentNode.insertBefore(errorDiv, fileListEl);
}

// Event listener for close button in file viewer
closeViewerBtn.addEventListener('click', () => {
    fileViewerEl.classList.add('hidden');
});

// Initialize the page
document.addEventListener('DOMContentLoaded', initClientView);
} catch (err) {
        console.error('Error initializing client view:', err);
        showErrorMessage('There was a problem loading your files. Please try refreshing the page or contact support.');
    }
}

// Fetch client information
async function fetchClientInfo(user) {
    try {
        const { data, error } = await supabase
            .from('clients')
            .select('name, email')
            .eq('id', user.id)
            .single();
        
        if (error) {
            console.error('Error fetching client info:', error);
            return;
        }
        
        if (data) {
            // Update the welcome message with client name
            clientNameEl.textContent = data.name;
        }
    } catch (err) {
        console.error('Unexpected error fetching client info:', err);
    }
}

// Fetch files for the current client
async function fetchClientFiles(user) {
    try {
        // Show loading indicator
        loadingEl.classList.remove('hidden');
        fileListEl.classList.add('hidden');
        emptyFilesEl.classList.add('hidden');
        
        const { data, error } = await supabase
            .from('files')
            .select('id, name, created_at, updated_at')
            .eq('client_id', user.id)
            .order('updated_at', { ascending: false });
        
        if (error) {
            console.error('Error fetching files:', error);
            showErrorMessage('There was a problem loading your files. Please try again later.');
            return;
        }
        
        // Hide loading indicator
        loadingEl.classList.add('hidden');
        
        // Check if we have files
        if (data && data.length > 0) {
            // Show file list
            fileListEl.classList.remove('hidden');
            
            // Clear existing file list
            fileListEl.innerHTML = '';
            
            // Add each file to the list
            data.forEach(file => {
                const fileItem = createFileItem(file);
                fileListEl.appendChild(fileItem);
            });
        } else {
            // Show empty state
            emptyFilesEl.classList.remove('hidden');
        }
    } catch (err) {
        console.error('Unexpected error fetching files:', err);
        showErrorMessage('There was a problem loading your files. Please try again later.');
    }
}

// Create a file list item element
function createFileItem(file) {
    const li = document.createElement('li');
    li.className = 'file-item';
    
    // Format date nicely for elderly users
    const dateOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    const formattedDate = new Date(file.updated_at).toLocaleDateString('en-US', dateOptions);
    
    li.innerHTML = `
        <div>
            <div class="file-name">${file.name}</div>
            <div class="file-date">Last updated: ${formattedDate}</div>
        </div>
        <button class="btn view-file" data-file-id="${file.id}">View File</button>
    `;
    
    // Add event listener to the view button
    li.querySelector('.view-file').addEventListener('click', () => {
        viewFile(file.id, file.name);
    });
    
    return li;
}

// Display file content in a readable format
function displayFileContent(content) {
    // Clear the content area
    fileContentEl.innerHTML = '';
    
    try {
        // If content is already an object (JSON), use it directly
        // Otherwise, if it's a string, try to parse it
        const jsonData = typeof content === 'object' ? content : JSON.parse(content);
        
        // Create a friendly display for elderly users
        const contentDiv = document.createElement('div');
        contentDiv.className = 'json-content';
        
        // Create a simple key-value display
        Object.entries(jsonData).forEach(([key, value]) => {
            const row = document.createElement('div');
            row.className = 'json-row';
            
            // Format the key to be more readable
            const formattedKey = key
                .replace(/([A-Z])/g, ' $1') // Add space before capital letters
                .replace(/_/g, ' ') // Replace underscores with spaces
                .trim();
            
            // Capitalize first letter
            const displayKey = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);
            
            // Format the value based on its type
            let displayValue = value;
            
            // Format date strings
            if (typeof value === 'string' && 
                (value.match(/^\d{4}-\d{2}-\d{2}/) || value.match(/^\d{4}\/\d{2}\/\d{2}/))) {
                try {
                    const date = new Date(value);
                    if (!isNaN(date)) {
                        displayValue = date.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        });
                    }
                } catch (e) {
                    // If date parsing fails, use the original value
                    console.log('Date parsing failed', e);
                }
            }
            
            // For nested objects, display "[Click to view details]" button
            if (typeof value === 'object' && value !== null) {
                row.innerHTML = `
                    <div class="json-key">${displayKey}:</div>
                    <div class="json-value">
                        <button class="btn btn-small toggle-details">View Details</button>
                        <div class="json-details hidden"></div>
                    </div>
                `;
                
                const detailsEl = row.querySelector('.json-details');
                const toggleBtn = row.querySelector('.toggle-details');
                
                // Create nested content
                if (Array.isArray(value)) {
                    // Handle arrays
                    value.forEach((item, index) => {
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'json-array-item';
                        
                        if (typeof item === 'object' && item !== null) {
                            // Nested object in array
                            itemDiv.innerHTML = `<div class="json-array-index">Item ${index + 1}</div>`;
                            const nestedDiv = document.createElement('div');
                            nestedDiv.className = 'json-nested';
                            
                            Object.entries(item).forEach(([nestedKey, nestedValue]) => {
                                const formattedNestedKey = nestedKey
                                    .replace(/([A-Z])/g, ' $1')
                                    .replace(/_/g, ' ')
                                    .trim();
                                
                                const displayNestedKey = formattedNestedKey.charAt(0).toUpperCase() + formattedNestedKey.slice(1);
                                
                                nestedDiv.innerHTML += `
                                    <div class="json-nested-row">
                                        <div class="json-nested-key">${displayNestedKey}:</div>
                                        <div class="json-nested-value">${nestedValue}</div>
                                    </div>
                                `;
                            });
                            
                            itemDiv.appendChild(nestedDiv);
                        } else {
                            // Simple value in array
                            itemDiv.innerHTML = `
                                <div class="json-array-index">Item ${index + 1}:</div>
                                <div class="json-array-value">${item}</div>
                            `;
                        }
                        
                        detailsEl.appendChild(itemDiv);
                    });
                } else {
                    // Handle objects
                    Object.entries(value).forEach(([nestedKey, nestedValue]) => {
                        const formattedNestedKey = nestedKey
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/_/g, ' ')
                            .trim();
                        
                        const displayNestedKey = formattedNestedKey.charAt(0).toUpperCase() + formattedNestedKey.slice(1);
                        
                        const nestedRow = document.createElement('div');
                        nestedRow.className = 'json-nested-row';
                        nestedRow.innerHTML = `
                            <div class="json-nested-key">${displayNestedKey}:</div>
                            <div class="json-nested-value">${nestedValue}</div>
                        `;
                        
                        detailsEl.appendChild(nestedRow);
                    });
                }
                
                // Toggle details visibility when clicked
                toggleBtn.addEventListener('click', function() {
                    const isHidden = detailsEl.classList.contains('hidden');
                    detailsEl.classList.toggle('hidden');
                    this.textContent = isHidden ? 'Hide Details' : 'View Details';
                });
            } else {
                // For simple values
                row.innerHTML = `
                    <div class="json-key">${displayKey}:</div>
                    <div class="json-value">${displayValue}</div>
                `;
            }
            
            contentDiv.appendChild(row);
        });
        
        fileContentEl.appendChild(contentDiv);
        
        // Add a print button specific to this content
        const printButton = document.createElement('button');
        printButton.className = 'btn';
        printButton.textContent = 'Print This File';
        printButton.addEventListener('click', function() {
            // Open a new window with just this content for printing
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                <head>
                    <title>Print - ${currentFileNameEl.textContent}</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
                        h1 { margin-bottom: 20px; }
                        .json-row { margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
                        .json-key { font-weight: bold; margin-bottom: 5px; }
                        .json-value { margin-left: 20px; }
                        @media print {
                            button { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <h1>${currentFileNameEl.textContent}</h1>
                    ${contentDiv.outerHTML}
                    <button onclick="window.print()">Print</button>
                </body>
                </html>
            `);
            printWindow.document.close();
        });
        
        fileContentEl.appendChild(printButton);
        
    } catch (err) {
        console.error('Error displaying JSON content:', err);
        fileContentEl.innerHTML = '<p class="error-message">Sorry, there was a problem displaying this file. The format may be incorrect.</p>';
    }
}

// View a file when clicked
async function viewFile(fileId, fileName) {
    try {
        // Update the viewer header
        currentFileNameEl.textContent = fileName;
        
        // Show file viewer with loading message
        fileViewerEl.classList.remove('hidden');
        fileContentEl.innerHTML = '<p>Loading file content...</p>';
        
        // Fetch the file content
        const { data, error } = await supabase
            .from('files')
            .select('content')
            .eq('id', fileId)
            .single();
        
        if (error) {
            console.error('Error fetching file content:', error);
            fileContentEl.innerHTML = '<p class="error-message">Sorry, we could not load this file. Please try again later.</p>';
            return;
        }
        
        if (data && data.content) {
            // Display the JSON data in a readable format
            displayFileContent(data.content);
        } else {
            fileContentEl.innerHTML = '<p>This file appears to be empty.</p>';
        }
    } catch (err) {
        console.error('Unexpected error viewing file:', err);
        fileContentEl.innerHTML = '<p class="error-message">Sorry, we could not load this file. Please try again later.</p>';
    }
}