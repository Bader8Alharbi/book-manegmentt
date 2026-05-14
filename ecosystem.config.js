module.exports = {
    apps: [
        {
            name: 'qq-backend',
            script: './backend/server.js',
            env_production: {
                NODE_ENV: 'production',
                PORT: 5001,
            },
            watch: false,
            instances: 1,
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
            instances: 1,
            autorestart: true,
        },
    ],
};
