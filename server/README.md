# LendMe Backend Server

This is the Express backend server for the LendMe application, which provides authentication services and data storage using SQLite.

## Getting Started

### Development

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

The server will run on port 5000 by default.

## Database

The application uses SQLite, which stores the database as a file in the `db` directory. This makes it easy to deploy on a Linux server without the need for a separate database service.

## Deployment on Linux with Nginx

### Prerequisites

- A Linux server (e.g., Ubuntu, Debian)
- Node.js and npm installed
- Nginx installed

### Setup Process

1. Transfer the project files to your server using SCP, SFTP, or Git.

2. Install dependencies:
   ```
   cd /path/to/lendme
   npm install
   cd server
   npm install
   ```

3. Build the React frontend:
   ```
   cd /path/to/lendme
   npm run build
   ```

4. Set up a process manager to keep the Node.js application running:

   Install PM2:
   ```
   npm install -g pm2
   ```

   Start the server:
   ```
   cd /path/to/lendme/server
   pm2 start index.js --name lendme-server
   ```

   Configure PM2 to start on system boot:
   ```
   pm2 startup
   pm2 save
   ```

5. Configure Nginx as a reverse proxy:

   Create a new Nginx configuration file:
   ```
   sudo nano /etc/nginx/sites-available/lendme
   ```

   Add the following configuration (for IP address only, no domain name):
   ```
   server {
       listen 80 default_server;
       listen [::]:80 default_server;
       
       # IP Address only setup - no domain name required
       
       root /path/to/lendme/build;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

6. Enable the site and restart Nginx:
   ```
   sudo ln -s /etc/nginx/sites-available/lendme /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. (Optional) If you want to set up SSL with a self-signed certificate for IP address:
   ```
   sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/nginx-selfsigned.key -out /etc/ssl/certs/nginx-selfsigned.crt
   ```

   Then modify your Nginx config to use SSL:
   ```
   server {
       listen 443 ssl default_server;
       listen [::]:443 ssl default_server;
       
       ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
       ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;
       
       # Rest of the configuration as above
       # ...
   }
   
   # Redirect HTTP to HTTPS
   server {
       listen 80 default_server;
       listen [::]:80 default_server;
       return 301 https://$host$request_uri;
   }
   ```

Your LendMe application should now be accessible at your server's IP address (e.g., http://YOUR_SERVER_IP).

## Environment Variables

In production, consider setting these environment variables:

- `PORT`: The port the server will run on (default: 5000)
- `NODE_ENV`: Set to 'production' in production environments
- `JWT_SECRET`: A secure secret for JWT token generation (very important for security)

You can set these in a `.env` file or through your process manager.

## Accessing the Application

You'll be able to access your application by simply entering your server's IP address in a web browser. For example:

```
http://192.168.1.100
```

Or if you're using SSL:

```
https://192.168.1.100
```

To accept the self-signed certificate, you may need to add a security exception in your browser.