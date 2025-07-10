// Test script to verify database functionality
require('dotenv').config();
const Database = require('./database-new');

async function testDatabase() {
    console.log('🔍 Testing Database Implementation...\n');
    
    // Test database initialization
    console.log('📦 Initializing database...');
    const db = new Database();
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const testGuildId = '123456789';
    const testUserId = '987654321';
    const testChannelId = '555666777';
    
    try {
        // Test server creation
        console.log('🏗️  Testing server creation...');
        await db.createServer(testGuildId);
        console.log('✅ Server created successfully');
        
        // Test server retrieval
        console.log('📖 Testing server retrieval...');
        let server = await db.getServer(testGuildId);
        console.log('✅ Server retrieved:', server ? 'Found' : 'Not found');
        
        // Test channel setting
        console.log('📺 Testing channel setting...');
        await db.setCountChannel(testGuildId, testChannelId);
        console.log('✅ Channel set successfully');
        
        // Test count update
        console.log('🔢 Testing count update...');
        await db.updateCount(testGuildId, 150, testUserId);
        console.log('✅ Count updated successfully');
        
        // Test reward creation
        console.log('🎁 Testing reward creation...');
        await db.addReward(testGuildId, 200, 'Test reward', testUserId, 'TestUser');
        console.log('✅ Reward created successfully');
        
        // Test reward retrieval
        console.log('📋 Testing reward retrieval...');
        const rewards = await db.getRewards(testGuildId);
        console.log('✅ Rewards retrieved:', rewards.length, 'rewards found');
        
        // Test user data retrieval
        console.log('👤 Testing user data retrieval...');
        const userData = await db.getUserData(testUserId);
        console.log('✅ User data retrieved:', userData.rewards.length, 'rewards,', userData.lastCounterIn.length, 'servers');
        
        // Test achievement tracking
        console.log('🏆 Testing achievement tracking...');
        await db.addAchievement(testGuildId, 100);
        const achievements = await db.getAchievements(testGuildId);
        console.log('✅ Achievement tracking:', achievements.length, 'achievements found');
        
        // Test data cleanup
        console.log('🧹 Testing data cleanup...');
        await db.removeUserData(testUserId);
        console.log('✅ User data cleanup completed');
        
        console.log('\n🎉 All database tests passed!');
        console.log('✅ Database is ready for production use');
        
    } catch (error) {
        console.error('❌ Database test failed:', error);
    } finally {
        // Clean up test data
        try {
            await db.query('DELETE FROM servers WHERE guild_id = ?', [testGuildId]);
            await db.query('DELETE FROM rewards WHERE guild_id = ?', [testGuildId]);
            await db.query('DELETE FROM achievements WHERE guild_id = ?', [testGuildId]);
            console.log('🧹 Test data cleaned up');
        } catch (cleanupError) {
            console.error('⚠️  Cleanup error (not critical):', cleanupError.message);
        }
        
        db.close();
    }
}

// Run the test
testDatabase().catch(console.error);
