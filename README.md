# Project Overview

**Fishek** is a Turkish-language personal finance tracking mobile web app built with React, TypeScript, and Vite. The app features AI-powered receipt scanning using Google Gemini API for automatic transaction entry.

## Run Locally

**Prerequisites:** Node.js

1) Install dependencies  
   `npm install`
2) Set environment variables (in `.env` or `.env.local`):  
   - `AUTH_SECRET`  
   - `DATABASE_URL`  
   - `GEMINI_API_KEY` and `NEXT_PUBLIC_GEMINI_API_KEY`
3) Initialize the database (creates tables, seeds demo user + sample data)  
   `npm run db:init`
4) Run the app (localhost:3000)  
   `npm run dev`
5) Production build  
   `npm run build`


## Project Credits

This project is developed by Eshagh Shahnavazi with FebLabs.
