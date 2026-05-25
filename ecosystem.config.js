module.exports = {
    apps: [
        {
            name: 'qq-backend',
            script: './backend/server.js',
            exec_mode: 'cluster',
            instances: 'max',
            env_production: {
                NODE_ENV: 'production',
                PORT: 5001,
            },
            watch: false,
            autorestart: true,
        },
    ],
};
