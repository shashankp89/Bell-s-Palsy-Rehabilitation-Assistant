import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { spawn } from 'child_process';
import path from 'path';

// Custom Vite plugin to launch the Python backend from the browser
const runPythonPlugin = () => ({
  name: 'run-python',
  configureServer(server) {
    server.middlewares.use('/api/start-exercise', (req, res) => {
      // Resolve the path to main.py (one directory up from frontend)
      const scriptPath = path.resolve(__dirname, '../main.py');
      
      console.log(`Launching Python script: ${scriptPath}`);
      
      // Spawn the native Python process using 'py' on Windows
      // Explicitly set cwd to the project root so main.py reads/writes files properly
      const pyProcess = spawn('py', [scriptPath], { cwd: path.resolve(__dirname, '..') });
      
      pyProcess.stdout.on('data', (data) => console.log(data.toString()));
      pyProcess.stderr.on('data', (data) => console.error(data.toString()));
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Python script launched!' }));
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), runPythonPlugin()],
});
