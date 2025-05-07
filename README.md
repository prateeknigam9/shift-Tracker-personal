# Shift Tracker Application

A comprehensive shift tracking mobile web application built with Node.js backend and React frontend. This application helps users track work shifts, calculate pay, and provide insights based on work patterns.

## Features

- User authentication (register, login, profile management)
- Shift management (create, view, edit, delete)
- Payment tracking with editable pay calendars
- Sales KPI tracking for tech insurance, instant insurance, and Sky products
- Analytics dashboard with visual insights
- Responsive design optimized for mobile use
- Dark/light mode support

## Technologies Used

- **Frontend**: React, TailwindCSS, shadcn/ui components
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based authentication
- **Styling**: Modern UI with glass effects, gradients, and responsive design

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or cloud-based like Neon)
- GROQ API key (optional, for enhanced note insights)

## Local Development Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables by creating a `.env` file:
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   GROQ_API_KEY=your_groq_api_key (optional)
   ```
4. Set up the database by running Drizzle migrations:
   ```
   npm run db:push
   ```
5. Start the development server:
   ```
   npm run dev
   ```
6. Open http://localhost:5000 in your browser

## Deployment to Render

### Step 1: Prepare Your GitHub Repository

1. Make sure your project is in a GitHub repository.
2. Ensure all your dependencies are properly listed in package.json.

### Step 2: Create a PostgreSQL Database on Render

1. Log in to your Render account at https://render.com
2. Navigate to the Dashboard and click on "New +" and select "PostgreSQL"
3. Configure your PostgreSQL instance:
   - Name: `shift-tracker-db` (or your preferred name)
   - Database: `shift_tracker` (or your preferred name)
   - User: Keep the default or create a custom user
   - Region: Choose the region closest to your target audience
   - Plan: Select an appropriate plan (Free tier is available for testing)
4. Click "Create Database"
5. Once created, Render will provide you with connection details including:
   - Database URL (contains all connection information)
   - Make note of this URL as you'll need it for the next steps

### Step 3: Create a Web Service on Render

1. From the Render dashboard, click "New +" and select "Web Service"
2. Connect your GitHub repository
3. Configure your web service:
   - Name: `shift-tracker` (or your preferred name)
   - Runtime: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Plan: Select an appropriate plan (Free tier is available for testing)

### Step 4: Set Up Environment Variables

1. In your web service settings, go to the "Environment" tab
2. Add the following environment variables:
   - `DATABASE_URL`: Paste the PostgreSQL connection URL from Step 2
   - `GROQ_API_KEY`: Your GROQ API key (if applicable)
   - `NODE_ENV`: Set to `production`

### Step 5: Configure Database Migrations in Build Command

To automatically run database migrations during deployment (without using Shell Scripts):

1. In your web service settings, go back to the "Settings" tab
2. Modify your Build Command to include database migrations:
   ```bash
   npm install && npm run build && npm run db:push
   ```
3. Click "Save Changes"

This approach runs the database migrations automatically as part of the build process.

### Step 6: Deploy Your Application

1. Return to your web service dashboard and click "Manual Deploy" to trigger a deployment
2. Render will now:
   - Install dependencies
   - Build your application
   - Run database migrations to create required tables
   - Start your application
3. Your application should now be accessible at the provided Render URL

### Step 7: Access Your Application

1. Your application will be available at `https://your-service-name.onrender.com`
2. Register a new account and start using the application

## Updating Environment Variables

If you need to update environment variables after deployment:

1. Go to your web service in the Render dashboard
2. Click on the "Environment" tab
3. Add, edit, or remove environment variables as needed
4. Click "Save Changes"
5. Render will automatically redeploy your application with the new environment variables

## Troubleshooting

- **Database Connection Issues**: Verify that your DATABASE_URL is correct and that your IP is allowed in the database firewall settings
- **Migration Errors**: Check build logs for migration errors or manually run migrations by adding `npm run db:push` to your build command if it wasn't included initially
- **Application Errors**: Check the Render logs from your web service dashboard for detailed error messages
- **Table Not Found Errors**: These usually indicate the migrations didn't run successfully. Verify your build logs and ensure the DATABASE_URL is correctly set

## Custom Domain Setup (Optional)

1. From your web service, click on the "Settings" tab
2. Scroll down to the "Custom Domain" section
3. Click "Add Custom Domain"
4. Enter your domain name and follow the instructions to configure DNS settings

## Maintenance and Updates

1. Push changes to your GitHub repository
2. Render will automatically detect changes and deploy updates
3. For database schema changes, they will be automatically applied during each build as your build command includes `npm run db:push`

For any issues or questions, please open an issue in the GitHub repository.