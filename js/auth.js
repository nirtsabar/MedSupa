// Initialize Supabase client
// Replace with your actual Supabase URL and API key after setting up your project
//const SUPABASE_URL = 'MY_SUPABASE_URL'; // Replace with your Supabase URL
//const SUPABASE_KEY = 'MY_SUPABASE_KEY'; // Replace with your Supabase API key
// see (gitignored) config.js for the above variables
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Check if user is already authenticated
async function checkUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            console.error('Error checking user:', error);
            return null;
        }
        
        return user;
    } catch (err) {
        console.error('Unexpected error checking user:', err);
        return null;
    }
}

// Send magic link for passwordless login
async function sendMagicLink(email) {
    try {
        // The redirect URL should be the page you want users to land on after clicking the magic link
        // For local development, you can use http://localhost:port/client-view.html
        // For production, use your actual domain
        const { data, error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin + '/client-view.html',
            }
        });
        
        if (error) {
            console.error('Error sending magic link:', error);
            return { error };
        }
        
        return { data };
    } catch (err) {
        console.error('Unexpected error sending magic link:', err);
        return { error: err };
    }
}

// Sign out the current user
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error('Error signing out:', error);
            return { error };
        }
        
        // Redirect to the home page after sign out
        window.location.href = '/index.html';
        return { success: true };
    } catch (err) {
        console.error('Unexpected error signing out:', err);
        return { error: err };
    }
}

// Handle authentication state change
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event);
    
    // If we're on the index page and the user is already signed in, redirect to client view
    if (event === 'SIGNED_IN' && window.location.pathname.includes('index.html')) {
        window.location.href = '/client-view.html';
    }
    
    // If we're on a protected page and the user signs out, redirect to index
    if (event === 'SIGNED_OUT' && 
        (window.location.pathname.includes('client-view.html') || 
         window.location.pathname.includes('admin-panel.html'))) {
        window.location.href = '/index.html';
    }
});

// Check if on protected page and redirect if not authenticated
async function protectPage() {
    const user = await checkUser();
    if (!user && 
        (window.location.pathname.includes('client-view.html') || 
         window.location.pathname.includes('admin-panel.html'))) {
        window.location.href = '/index.html';
    }
    return user;
}

// Call this on protected pages
document.addEventListener('DOMContentLoaded', protectPage);