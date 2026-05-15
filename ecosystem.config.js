module.exports = {
    apps: [
        {
            name: 'qq-backend',
            script: './backend/server.js',
            exec_mode: 'cluster',       // ← THIS IS THE FIX
            instances: 'max',           // ← uses all CPU cores
            env_production: {
                NODE_ENV: 'production',
                PORT: 5001,
            },
            watch: false,
            autorestart: true,
        },
        {
            name: 'qq-frontend',
            script: 'serve',
            args: '-s frontend/build -l 3000',
            env_production: {
                NODE_ENV: 'production',
            },
            watch: false,
            instances: 1,              // frontend only needs 1 instance
            autorestart: true,
        },
    ],
};