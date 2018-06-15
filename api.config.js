//example pm2 ecosystem configuration file
module.exports = {
    apps : [{
        name        : "API",
        script      : "./src/index.ts",
        interpreter : "ts-node",
        watch       : true,
        env: {
            "NODE_ENV": "production",
            "VAPID_PRIVATE_KEY": "xxxxxxx",
            "VAPID_PUBLIC_KEY": "xxxxxxxx"
        },
        env_production : {
            "NODE_ENV": "production"
        }
    }]
}
