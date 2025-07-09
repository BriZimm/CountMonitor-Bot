const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor(dbPath = process.env.DB_PATH || './database.db') {
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
            } else {
                console.log('Connected to SQLite database');
                this.initializeTables();
            }
        });
    }

    initializeTables() {
        const queries = [
            `CREATE TABLE IF NOT EXISTS servers (
                guild_id TEXT PRIMARY KEY,
                count_channel_id TEXT,
                current_count INTEGER DEFAULT 0,
                last_counter_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS rewards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT,
                goal INTEGER,
                description TEXT,
                provider_id TEXT,
                provider_username TEXT,
                claimed BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (guild_id) REFERENCES servers (guild_id),
                UNIQUE(guild_id, goal)
            )`,
            `CREATE TABLE IF NOT EXISTS achievements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT,
                goal INTEGER,
                achieved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                notified BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (guild_id) REFERENCES servers (guild_id)
            )`
        ];

        queries.forEach(query => {
            this.db.run(query, (err) => {
                if (err) {
                    console.error('Error creating table:', err);
                }
            });
        });
    }

    // Server management
    async getServer(guildId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM servers WHERE guild_id = ?',
                [guildId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async createServer(guildId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT OR IGNORE INTO servers (guild_id) VALUES (?)',
                [guildId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async setCountChannel(guildId, channelId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE servers SET count_channel_id = ? WHERE guild_id = ?',
                [channelId, guildId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    async updateCount(guildId, newCount, userId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE servers SET current_count = ?, last_counter_id = ? WHERE guild_id = ?',
                [newCount, userId, guildId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    // Reward management
    async addReward(guildId, goal, description, providerId, providerUsername) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO rewards (guild_id, goal, description, provider_id, provider_username) VALUES (?, ?, ?, ?, ?)',
                [guildId, goal, description, providerId, providerUsername],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async getRewards(guildId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM rewards WHERE guild_id = ? ORDER BY goal ASC',
                [guildId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    async getRewardByGoal(guildId, goal) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM rewards WHERE guild_id = ? AND goal = ?',
                [guildId, goal],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async getUnclaimedRewards(guildId, currentCount) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM rewards WHERE guild_id = ? AND goal <= ? AND claimed = FALSE',
                [guildId, currentCount],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    async markRewardClaimed(rewardId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE rewards SET claimed = TRUE WHERE id = ?',
                [rewardId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    // Achievement management
    async addAchievement(guildId, goal) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO achievements (guild_id, goal) VALUES (?, ?)',
                [guildId, goal],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async getAchievements(guildId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM achievements WHERE guild_id = ? ORDER BY goal ASC',
                [guildId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    close() {
        this.db.close((err) => {
            if (err) {
                console.error('Error closing database:', err);
            } else {
                console.log('Database connection closed');
            }
        });
    }
}

module.exports = Database;
