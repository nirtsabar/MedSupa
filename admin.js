// This file contains the JavaScript code for the admin panel

// DOM elements - Modals
const addClientModal = document.getElementById('add-client-modal');
const addFileModal = document.getElementById('add-file-modal');
const editFileModal = document.getElementById('edit-file-modal');

// DOM elements - Forms
const addClientForm = document.getElementById('add-client-form');
const addFileForm = document.getElementById('add-file-form');
const editFileForm = document.getElementById('edit-file-form');

// DOM elements - Buttons
const createClientBtn = document.getElementById('create-client');
const deleteFileBtn = document.getElementById('delete-file');

// DOM elements - Client list
const clientListEl = document.getElementById('client-list');

// DOM elements - Current file edit info
const editFileNameEl = document.getElementById('edit-file-name');
const editFileNameInput = document.getElementById('edit-file-name-input');
const editFileContentEl = document.getElementById('edit-file-content');
const editFileIdEl = document.getElementById('edit-file-id');

// DOM elements - Current client info for adding file
const fileClientNameEl = document.getElementById('file-client-name');
const fileClientIdEl = document.getElementById('file-client-id');

// Get client ID for a file
async function getClientIdForFile(fileId) {
    try {
        const { data, error } = await supabase
            .from('files')
            .select('client_id')
            .eq('id', fileId)
            .single();
        
        if (error) {
            console.error('Error getting client ID for file:', error);
            return null;
        }
        
        return data ? data.client_id : null;
    } catch (err) {
        console.error('Unexpected error getting client ID for file:', err);
        return null;
    }
}

// Initialize the admin panel
async function initAdminPanel() {
    try {
        // Check if user is authenticated
        const user = await protectPage();
        if (!user) return;
        
        // Only allow access if user has admin role
        checkAdminAccess(user);
        
        // Load clients
        loadClients();
        
        // Set up event listeners
        setupEventListeners();
    } catch (err) {
        console.error('Error initializing admin panel:', err);
        showErrorMessage('There was a problem loading the admin panel. Please try refreshing the page.');
    }
}

// Check if the user has admin access
async function checkAdminAccess(user) {
    // For simplicity, we're not implementing complex role checks here
    // In a real application, you'd check against a roles table or similar
    console.log('Admin access granted to:', user.email);
}

// Load all clients
async function loadClients() {
    try {
        const { data, error } = await supabase
            .from('clients')
            .select('id, name, email, created_at')
            .order('name');
        
        if (error) {
            console.error('Error loading clients:', error);
            showErrorMessage('Failed to load clients. Please try again.');
            return;
        }
        
        // Clear the client list
        clientListEl.innerHTML = '';
        
        if (data && data.length > 0) {
            // Create a client item for each client
            data.forEach(client => {
                const clientEl = createClientElement(client);
                clientListEl.appendChild(clientEl);
            });
        } else {
            // Show empty state
            clientListEl.innerHTML = '<div class="empty-message">No clients yet. Add your first client to get started.</div>';
        }
    } catch (err) {
        console.error('Unexpected error loading clients:', err);
        showErrorMessage('There was a problem loading clients. Please try again later.');
    }
}

// Create a client element with files list
async function createClientElement(client) {
    const clientEl = document.createElement('div');
    clientEl.className = 'client-item';
    clientEl.dataset.clientId = client.id;
    
    // Format date for display
    const createdDate = new Date(client.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Create client header
    clientEl.innerHTML = `
        <div class="client-header">
            <div class="client-info">
                <h3>${client.name}</h3>
                <p class="client-email">${client.email}</p>
                <p class="client-date">Added on ${createdDate}</p>
            </div>
            <div class="client-actions">
                <button class="btn add-file-btn" data-client-id="${client.id}" data-client-name="${client.name}">
                    Add File
                </button>
            </div>
        </div>
        <div class="client-files">
            <h4>Files</h4>
            <div class="files-loading">Loading files...</div>
            <ul class="files-list" id="files-${client.id}"></ul>
        </div>
    `;
    
    // Add event listener to the Add File button
    clientEl.querySelector('.add-file-btn').addEventListener('click', function() {
        openAddFileModal(client.id, client.name);
    });
    
    // Load files for this client
    loadClientFiles(client.id);
    
    return clientEl;
}

// Load files for a specific client
async function loadClientFiles(clientId) {
    try {
        const filesListEl = document.getElementById(`files-${clientId}`);
        const loadingEl = filesListEl.previousElementSibling; // The loading element
        
        const { data, error } = await supabase
            .from('files')
            .select('id, name, created_at, updated_at')
            .eq('client_id', clientId)
            .order('updated_at', { ascending: false });
        
        if (error) {
            console.error(`Error loading files for client ${clientId}:`, error);
            loadingEl.textContent = 'Failed to load files.';
            return;
        }
        
        // Hide loading indicator
        loadingEl.style.display = 'none';
        
        if (data && data.length > 0) {
            // Clear the files list
            filesListEl.innerHTML = '';
            
            // Add each file to the list
            data.forEach(file => {
                const fileItem = createFileElement(file);
                filesListEl.appendChild(fileItem);
            });
        } else {
            // Show empty state
            filesListEl.innerHTML = '<li class="empty-files">No files yet for this client.</li>';
        }
    } catch (err) {
        console.error(`Unexpected error loading files for client ${clientId}:`, err);
    }
}

// Create a file element for the files list
function createFileElement(file) {
    const li = document.createElement('li');
    li.className = 'file-item';
    
    // Format date
    const updatedDate = new Date(file.updated_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    li.innerHTML = `
        <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-date">Updated: ${updatedDate}</div>
        </div>
        <div class="file-actions">
            <button class="btn btn-small edit-file-btn" data-file-id="${file.id}">
                Edit
            </button>
        </div>
    `;
    
    // Add event listener to edit button
    li.querySelector('.edit-file-btn').addEventListener('click', function() {
        openEditFileModal(file.id);
    });
    
    return li;
}

// Open the Add Client modal
function openAddClientModal() {
    addClientForm.reset();
    addClientModal.classList.remove('hidden');
}

// Open the Add File modal for a specific client
function openAddFileModal(clientId, clientName) {
    addFileForm.reset();
    fileClientNameEl.textContent = clientName;
    fileClientIdEl.value = clientId;
    addFileModal.classList.remove('hidden');
}

// Open the Edit File modal
async function openEditFileModal(fileId) {
    try {
        // Clear previous file data
        editFileForm.reset();
        editFileNameEl.textContent = 'Loading...';
        editFileContentEl.value = '';
        
        // Show the modal while loading
        editFileModal.classList.remove('hidden');
        
        // Fetch the file data
        const { data, error } = await supabase
            .from('files')
            .select('id, name, content')
            .eq('id', fileId)
            .single();
        
        if (error) {
            console.error('Error fetching file:', error);
            alert('Error loading file data. Please try again.');
            editFileModal.classList.add('hidden');
            return;
        }
        
        if (data) {
            // Update the modal with file data
            editFileNameEl.textContent = data.name;
            editFileNameInput.value = data.name;
            editFileIdEl.value = data.id;
            
            // Format the JSON content for the textarea
            try {
                const formattedJson = JSON.stringify(data.content, null, 2);
                editFileContentEl.value = formattedJson;
            } catch (e) {
                console.error('Error formatting JSON:', e);
                editFileContentEl.value = JSON.stringify(data.content);
            }
        }
    } catch (err) {
        console.error('Unexpected error opening edit file modal:', err);
        alert('An error occurred. Please try again.');
        editFileModal.classList.add('hidden');
    }
}

// Close all modals
function closeModals() {
    addClientModal.classList.add('hidden');
    addFileModal.classList.add('hidden');
    editFileModal.classList.add('hidden');
}

// Set up event listeners
function setupEventListeners() {
    // Create Client button
    createClientBtn.addEventListener('click', openAddClientModal);
    
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', event => {
        if (event.target === addClientModal) closeModals();
        if (event.target === addFileModal) closeModals();
        if (event.target === editFileModal) closeModals();
    });
    
    // Add Client form submission
    addClientForm.addEventListener('submit', handleAddClientSubmit);
    
    // Add File form submission
    addFileForm.addEventListener('submit', handleAddFileSubmit);
    
    // Edit File form submission
    editFileForm.addEventListener('submit', handleEditFileSubmit);
    
    // Delete File button
    deleteFileBtn.addEventListener('click', handleDeleteFile);
}

// Handle Add Client form submission
async function handleAddClientSubmit(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('client-name');
    const emailInput = document.getElementById('client-email');
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    
    if (!name || !email) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        // First check if email already exists
        const { data: existingClient, error: checkError } = await supabase
            .from('clients')
            .select('id')
            .eq('email', email)
            .maybeSingle();
        
        if (checkError) {
            console.error('Error checking existing client:', checkError);
            alert('Error checking if client already exists. Please try again.');
            return;
        }
        
        if (existingClient) {
            alert('A client with this email already exists.');
            return;
        }
        
        // Create the client in the database
        const { data, error } = await supabase
            .from('clients')
            .insert([
                { name, email }
            ])
            .select();
        
        if (error) {
            console.error('Error adding client:', error);
            alert('Error adding client. Please try again.');
            return;
        }
        
        if (data) {
            // Close the modal
            closeModals();
            
            // Reload the clients list
            loadClients();
            
            // Clear the form
            addClientForm.reset();
        }
    } catch (err) {
        console.error('Unexpected error adding client:', err);
        alert('An error occurred. Please try again.');
    }
}

// Handle Add File form submission
async function handleAddFileSubmit(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('file-name');
    const contentInput = document.getElementById('file-content');
    const clientIdInput = document.getElementById('file-client-id');
    
    const name = nameInput.value.trim();
    const contentString = contentInput.value.trim();
    const clientId = clientIdInput.value;
    
    if (!name || !contentString || !clientId) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        // Parse the JSON content
        let content;
        try {
            content = JSON.parse(contentString);
        } catch (err) {
            alert('Invalid JSON format. Please check your input.');
            return;
        }
        
        // Add the file to the database
        const { data, error } = await supabase
            .from('files')
            .insert([
                { 
                    name, 
                    content, 
                    client_id: clientId 
                }
            ])
            .select();
        
        if (error) {
            console.error('Error adding file:', error);
            alert('Error adding file. Please try again.');
            return;
        }
        
        if (data) {
            // Close the modal
            closeModals();
            
            // Reload the files list for this client
            loadClientFiles(clientId);
            
            // Clear the form
            addFileForm.reset();
        }
    } catch (err) {
        console.error('Unexpected error adding file:', err);
        alert('An error occurred. Please try again.');
    }
}

// Handle Edit File form submission
async function handleEditFileSubmit(e) {
    e.preventDefault();
    
    const fileId = document.getElementById('edit-file-id').value;
    const name = document.getElementById('edit-file-name-input').value.trim();
    const contentString = document.getElementById('edit-file-content').value.trim();
    
    if (!name || !contentString || !fileId) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        // Parse the JSON content
        let content;
        try {
            content = JSON.parse(contentString);
        } catch (err) {
            alert('Invalid JSON format. Please check your input.');
            return;
        }
        
        // Update the file in the database
        const { data, error } = await supabase
            .from('files')
            .update({ 
                name, 
                content,
                updated_at: new Date()
            })
            .eq('id', fileId)
            .select();
        
        if (error) {
            console.error('Error updating file:', error);
            alert('Error updating file. Please try again.');
            return;
        }
        
        if (data) {
            // Close the modal
            closeModals();
            
            // Reload the files list for this client
            const clientId = await getClientIdForFile(fileId);
            if (clientId) {
                loadClientFiles(clientId);
            }
        }
    } catch (err) {
        console.error('Unexpected error updating file:', err);
        alert('An error occurred. Please try again.');
    }
}

// Handle Delete File button click
async function handleDeleteFile() {
    const fileId = document.getElementById('edit-file-id').value;
    const fileName = document.getElementById('edit-file-name-input').value;
    
    if (!fileId) return;
    
    // Confirm deletion
    if (!confirm(`Are you sure you want to delete the file "${fileName}"? This cannot be undone.`)) {
        return;
    }
    
    try {
        // Get the client ID before deleting the file
        const clientId = await getClientIdForFile(fileId);
        
        // Delete the file
        const { error } = await supabase
            .from('files')
            .delete()
            .eq('id', fileId);
        
        if (error) {
            console.error('Error deleting file:', error);
            alert('Error deleting file. Please try again.');
            return;
        }
        
        // Close the modal
        closeModals();
        
        // Reload the files list for this client
        if (clientId) {
            loadClientFiles(clientId);
        }
    } catch (err) {
        console.error('Unexpected error deleting file:', err);
        alert('An error occurred. Please try again.');
    }
}

// Show error message
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<p>${message}</p>`;
    
    // Remove any existing error messages
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Insert the error message at the top of the main content
    const mainEl = document.querySelector('main');
    mainEl.insertBefore(errorDiv, mainEl.firstChild);
}

// Initialize the admin panel when the page loads
document.addEventListener('DOMContentLoaded', initAdminPanel);