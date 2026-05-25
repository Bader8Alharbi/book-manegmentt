module.exports = {
    apps: [
        {
            name: 'qq-backend',
            script: './backend/server.js',
            exec_mode: 'cluster',
            instances: 'max',
            env_production: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            watch: false,
            autorestart: true,
        },
    ],
};
