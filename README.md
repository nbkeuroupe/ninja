# Black Rock Payment Terminal

A modern payment terminal system with separate backend and frontend components, supporting both web and Android interfaces.

## Project Structure

```
/
├── backend/               # Backend API server
│   ├── app/               # Application code
│   │   ├── api/           # API endpoints
│   │   ├── config/        # Configuration settings
│   │   ├── core/          # Core business logic
│   │   ├── protocols/     # Protocol handlers
│   │   └── utils/         # Utility functions
│   ├── tests/             # Test suite
│   ├── requirements.txt   # Python dependencies
│   ├── Dockerfile         # Docker configuration
│   └── render.yaml        # Render deployment configuration
│
├── frontend/              # Frontend applications
│   ├── web/               # Web interface
│   │   ├── public/        # Static web files
│   │   │   ├── index.html # Main HTML file
│   │   │   ├── styles.css # CSS styles
│   │   │   └── script.js  # JavaScript code
│   │   └── package.json   # Node.js dependencies
│   │
│   └── android/           # Android application
│       ├── app/           # Android app code
│       └── build.gradle   # Android build configuration
│
└── docker-compose.yml     # Docker Compose configuration
```

## Features

- **Protocol Selection**: Support for multiple POS terminal protocols
- **Auth Code Validation**: Protocol-specific auth code validation
- **Payout Settings**: Support for both bank and cryptocurrency payouts
- **Web Interface**: Responsive web interface for desktop and mobile browsers
- **Android App**: Native Android application
- **API Backend**: FastAPI-based backend with SQLite database

## Protocol Support

The system supports the following protocols:

- POS Terminal -101.1 (4-digit approval)
- POS Terminal -101.4 (6-digit approval)
- POS Terminal -101.6 (Pre-authorization)
- POS Terminal -101.7 (4-digit approval)
- POS Terminal -101.8 (PIN-LESS transaction)
- POS Terminal -201.1 (6-digit approval)
- POS Terminal -201.3 (6-digit approval)
- POS Terminal -201.5 (6-digit approval)

Each protocol requires a specific auth code format (4 or 6 digits/characters).

## Setup and Installation

### Backend

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the server:
   ```
   uvicorn app.main:app --reload
   ```

### Web Frontend

1. Navigate to the web frontend directory:
   ```
   cd frontend/web
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

### Android App

1. Open the Android project in Android Studio:
   ```
   cd frontend/android
   ```

2. Build and run the app using Android Studio.

## Deployment

### Render Deployment

The project includes a `render.yaml` file for easy deployment to Render:

1. Push the code to a GitHub repository
2. Connect the repository to Render
3. Render will automatically deploy the backend API and web frontend

### Docker Deployment

You can also deploy using Docker:

```
docker-compose up -d
```

## Development

### API Documentation

Once the backend is running, you can access the API documentation at:

```
http://localhost:8000/docs
```

### Testing

To run the backend tests:

```
cd backend
pytest
```

## License

MIT