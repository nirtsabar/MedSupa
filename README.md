# Simple File Sharing System

A simple and accessible file sharing system designed for sharing JSON files between you and your elderly clients. This project uses Supabase for backend services and plain HTML/CSS/JavaScript for the frontend.

## Features

- **Simple, Accessible Interface**: Large text, clear instructions, and minimal steps for elderly users
- **Passwordless Authentication**: Email magic links for easy sign-in without passwords
- **Admin Panel**: Manage clients and files with an easy-to-use admin interface
- **JSON File Management**: Create, edit, and share JSON files with your clients
- **Print-Friendly**: All pages are optimized for printing instructions

## Setup Instructions

### 1. Create a Supabase Project

1. Sign up for a free account at [Supabase](https://supabase.com) (you can use your GitHub account)
2. Create a new project and note your project URL and anon key
3. Follow the database setup instructions in [supabase-setup.md](supabase-setup.md)

### 2. Configure the Application

1. Open `js/auth.js` and replace the placeholder values with your Supabase URL and anon key:
   ```javascript
   const SUPABASE_URL = 'your-project-url';
   const SUPABASE_KEY = 'your-anon-key';
   ```

2. Update any references to "Your Company Name" and contact information:
   - In `index.html`
   - In `client-view.html` 
   - In `admin-panel.html`

### 3. Deploy the Application

#### Option 1: GitHub Pages (Simplest)

1. Create a new GitHub repository
2. Upload all files to the repository
3. Go to Settings > Pages and enable GitHub Pages
4. Set the source to the main branch and root folder
5. Your site will be available at `https://yourusername.github.io/repository-name/`

#### Option 2: Any Static Web Hosting

Upload the files to any static web hosting service like:
- Netlify
- Vercel
- Firebase Hosting
- Amazon S3 + CloudFront

### 4. Accessing the Application

1. **Admin Access**: 
   - Visit `/admin-panel.html`
   - Create your first client
   - Add files for your client

2. **Client Access**:
   - Clients visit the main page
   - They enter their email and receive a magic link
   - They click the link to access their files

## For Your Elderly Clients

Here are some tips for helping your elderly clients use the system:

1. **Create a Simple Guide**: Print out step-by-step instructions with screenshots
2. **Personalized Links**: Consider sending personalized links via email
3. **Phone Support**: Be available for phone calls if they need help
4. **Clear Naming**: Use descriptive file names they'll understand
5. **Test First**: If possible, walk through the process with them in person

## Extending the Project

As you become more comfortable with JavaScript, consider these enhancements:

1. **File Versioning**: Track changes to files over time
2. **Notifications**: Email clients when new files are available
3. **Two-Factor Authentication**: Add extra security for admin access
4. **File Categories**: Organize files into folders or categories
5. **Bulk Operations**: Upload multiple files at once

## Need Help?

If you encounter any issues with the code, here are some resources:

- [Supabase Documentation](https://supabase.com/docs)
- [JavaScript MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- GitHub Copilot or Claude for debugging assistance