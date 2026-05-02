📘 Project Title

A full-stack web application built using React (Vite) for the frontend and Node.js + Express + SQLite for the backend.

🚀 Features

⚡ Fast frontend powered by Vite

🎨 Modern UI using Tailwind CSS & Radix UI components

🔄 REST API with Express

💾 SQLite database integration

📱 Responsive design

🎯 Component-based architecture

🛠️ Tech Stack

Frontend

React

Vite

Tailwind CSS

Radix UI

Backend

Node.js

Express.js

SQLite3

📂 Project Structure
project-root/

│
├── backend/          # Backend server (Express + SQLite)

│   └── index.js

│

├── src/              # Frontend source code

│   ├── components/

│   ├── pages/

│   └── App.jsx

│
├── dist/             # Production build

├── index.html        # Entry HTML file

├── package.json

└── vite.config.ts

⚙️ Installation & Setup
1️⃣ Clone the repository
git clone https://github.com/Arjun007n/Team-Task-Manager.git
cd Team-Task-Manager
2️⃣ Install dependencies
npm install
3️⃣ Run frontend (development)
npm run dev
4️⃣ Run backend server
npm run backend
🧪 Build for Production
npm run build

The production-ready files will be generated in the dist/ folder.

🌐 API (Example)
Method	Endpoint	Description
GET	/api/...	Fetch data
POST	/api/...	Send data

(Update this section based on your actual routes)

📸 Screenshots

Add screenshots of your UI here

🔧 Configuration
Backend runs on: http://localhost:PORT
Frontend runs on: http://localhost:5173 (default Vite port)

You can modify ports in:

backend/index.js
vite.config.ts
