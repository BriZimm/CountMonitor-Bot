const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

class Database {
    constructor() {
        this.dbType = process.env.DATABASE_TYPE || 'sqlite';
        
        if (this.dbType === 'postgresql' && process.env.DATABASE_URL) {
            this.initPostgreSQL();
        } else {
            // Default to SQLite if PostgreSQL not properly configured
            this.dbType = 'sqlite';
            this.initSQLite();
        }
    }

    initPostgreSQL() {
        console.log('Initializing PostgreSQL connection...');
        
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        this.pool.on('error', (err) => {
            console.error('PostgreSQL pool error:', err);
        });

        console.log('PostgreSQL pool created');
        this.initializeTables();
    }

    initSQLite() {
        console.log('Initializing SQLite connection...');
        
        const dbPath = process.env.DB_PATH || path.join(__dirname, 'database.db');
        
        // Ensure the database directory exists
        const dbDir = path.dirname(dbPath);
        if (!require('fs').existsSync(dbDir)) {
            require('fs').mkdirSync(dbDir, { recursive: true });
        }
        
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening SQLite database:', err);
            } else {
                console.log('Connected to SQLite database at:', dbPath);
                this.initializeTables();
            }
        });
    }

    initializeTables() {
        if (this.dbType === 'postgresql') {
            this.initializePostgreSQLTables();
        } else {
            this.initializeSQLiteTables();
        }
    }

    async initializePostgreSQLTables() {
        const queries = [
            `CREATE TABLE IF NOT EXISTS servers (
                guild_id TEXT PRIMARY KEY,
                count_channel_id TEXT,
                current_count INTEGER DEFAULT 0,
                last_counter_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS rewards (
                id SERIAL PRIMARY KEY,
                guild_id TEXT,
                goal INTEGER,
                description TEXT,
                provider_id TEXT,
                provider_username TEXT,
                claimed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(guild_id, goal)
            )`,
            `CREATE TABLE IF NOT EXISTS achievements (
                id SERIAL PRIMARY KEY,
                guild_id TEXT,
                goal INTEGER,
                achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                notified BOOLEAN DEFAULT FALSE
            )`
        ];

        try {
            for (const query of queries) {
                await this.pool.query(query);
            }
            console.log('PostgreSQL tables initialized successfully');
        } catch (error) {
            console.error('Error initializing PostgreSQL tables:', error);
        }
    }

    initializeSQLiteTables() {
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
                UNIQUE(guild_id, goal)
            )`,
            `CREATE TABLE IF NOT EXISTS achievements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT,
                goal INTEGER,
                achieved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                notified BOOLEAN DEFAULT FALSE
            )`
        ];

        queries.forEach(query => {
            this.db.run(query, (err) => {
                if (err) {
                    console.error('Error creating SQLite table:', err);
                } else {
                    console.log('SQLite table created/verified');
                }
            });
        });
    }

    // Universal query method
    async query(text, params = []) {
        if (this.dbType === 'postgresql') {
            return await this.pool.query(text, params);
        } else {
            return new Promise((resolve, reject) => {
                if (text.toLowerCase().startsWith('select')) {
                    this.db.all(text, params, (err, rows) => {
                        if (err) reject(err);
                        else resolve({ rows });
                    });
                } else {
                    this.db.run(text, params, function(err) {
                        if (err) reject(err);
                        else resolve({ 
                            rowCount: this.changes,
                            insertId: this.lastID 
                        });
                    });
                }
            });
        }
    }

    // Server management
    async getServer(guildId) {
        try {
            const result = await this.query('SELECT * FROM servers WHERE guild_id = $1', [guildId]);
            return this.dbType === 'postgresql' ? result.rows[0] : result.rows[0];
        } catch (error) {
            console.error('Error getting server:', error);
            throw error;
        }
    }

    async createServer(guildId) {
        try {
            const result = await this.query(
                'INSERT INTO servers (guild_id) VALUES ($1) ON CONFLICT (guild_id) DO NOTHING',
                [guildId]
            );
            return result.insertId || result.rowCount;
        } catch (error) {
            console.error('Error creating server:', error);
            throw error;
        }
    }

    async setCountChannel(guildId, channelId) {
        try {
            const result = await this.query(
                'UPDATE servers SET count_channel_id = $1 WHERE guild_id = $2',
                [channelId, guildId]
            );
            return result.rowCount;
        } catch (error) {
            console.error('Error setting count channel:', error);
            throw error;
        }
    }

    async updateCount(guildId, newCount, userId) {
        try {
            const result = await this.query(
                'UPDATE servers SET current_count = $1, last_counter_id = $2 WHERE guild_id = $3',
                [newCount, userId, guildId]
            );
            return result.rowCount;
        } catch (error) {
            console.error('Error updating count:', error);
            throw error;
        }
    }

    // Reward management
    async addReward(guildId, goal, description, providerId, providerUsername) {
        try {
            const result = await this.query(
                'INSERT INTO rewards (guild_id, goal, description, provider_id, provider_username) VALUES ($1, $2, $3, $4, $5)',
                [guildId, goal, description, providerId, providerUsername]
            );
            return result.insertId || result.rowCount;
        } catch (error) {
            console.error('Error adding reward:', error);
            throw error;
        }
    }

    async getRewards(guildId) {
        try {
            const result = await this.query(
                'SELECT * FROM rewards WHERE guild_id = $1 ORDER BY goal ASC',
                [guildId]
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting rewards:', error);
            throw error;
        }
    }

    async getRewardByGoal(guildId, goal) {
        try {
            const result = await this.query(
                'SELECT * FROM rewards WHERE guild_id = $1 AND goal = $2',
                [guildId, goal]
            );
            return this.dbType === 'postgresql' ? result.rows[0] : result.rows[0];
        } catch (error) {
            console.error('Error getting reward by goal:', error);
            throw error;
        }
    }

    async getUnclaimedRewards(guildId, currentCount) {
        try {
            const result = await this.query(
                'SELECT * FROM rewards WHERE guild_id = $1 AND goal <= $2 AND claimed = FALSE',
                [guildId, currentCount]
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting unclaimed rewards:', error);
            throw error;
        }
    }

    async markRewardClaimed(rewardId) {
        try {
            const result = await this.query(
                'UPDATE rewards SET claimed = TRUE WHERE id = $1',
                [rewardId]
            );
            return result.rowCount;
        } catch (error) {
            console.error('Error marking reward claimed:', error);
            throw error;
        }
    }

    // Achievement management
    async addAchievement(guildId, goal) {
        try {
            const result = await this.query(
                'INSERT INTO achievements (guild_id, goal) VALUES ($1, $2)',
                [guildId, goal]
            );
            return result.insertId || result.rowCount;
        } catch (error) {
            console.error('Error adding achievement:', error);
            throw error;
        }
    }

    async getAchievements(guildId) {
        try {
            const result = await this.query(
                'SELECT * FROM achievements WHERE guild_id = $1 ORDER BY goal ASC',
                [guildId]
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting achievements:', error);
            throw error;
        }
    }

    // User data management
    async removeUserData(userId) {
        try {
            if (this.dbType === 'postgresql') {
                await this.pool.query('BEGIN');
                
                await this.pool.query('DELETE FROM rewards WHERE provider_id = $1', [userId]);
                await this.pool.query('UPDATE servers SET last_counter_id = NULL WHERE last_counter_id = $1', [userId]);
                
                await this.pool.query('COMMIT');
            } else {
                await this.query('BEGIN TRANSACTION');
                
                await this.query('DELETE FROM rewards WHERE provider_id = ?', [userId]);
                await this.query('UPDATE servers SET last_counter_id = NULL WHERE last_counter_id = ?', [userId]);
                
                await this.query('COMMIT');
            }
            
            return { success: true, message: 'User data removed successfully' };
        } catch (error) {
            if (this.dbType === 'postgresql') {
                await this.pool.query('ROLLBACK');
            } else {
                await this.query('ROLLBACK');
            }
            console.error('Error removing user data:', error);
            throw error;
        }
    }

    async getUserData(userId) {
        try {
            const userData = {
                rewards: [],
                lastCounterIn: []
            };

            // Get rewards provided by user
            const rewardsResult = await this.query(
                'SELECT * FROM rewards WHERE provider_id = $1',
                [userId]
            );
            userData.rewards = rewardsResult.rows || [];

            // Get servers where user was last counter
            const serversResult = await this.query(
                'SELECT guild_id, current_count FROM servers WHERE last_counter_id = $1',
                [userId]
            );
            userData.lastCounterIn = serversResult.rows || [];

            return userData;
        } catch (error) {
            console.error('Error fetching user data:', error);
            throw error;
        }
    }

    close() {
        if (this.dbType === 'postgresql') {
            this.pool.end(() => {
                console.log('PostgreSQL pool has ended');
            });
        } else {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing SQLite database:', err);
                } else {
                    console.log('SQLite database connection closed');
                }
            });
        }
    }
}

module.exports = Database;
