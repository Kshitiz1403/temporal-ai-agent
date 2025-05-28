#!/usr/bin/env node

/**
 * Simple test script to verify the temporal-ai-agent setup
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testSetup() {
 console.log('🧪 Testing Temporal AI Agent Setup...\n');

 try {
  // Test 1: Health check
  console.log('1. Testing health endpoint...');
  const healthResponse = await axios.get(`${BASE_URL}/health`);
  console.log('✅ Health check passed:', healthResponse.data.message);

  // Test 2: AI Agent health
  console.log('\n2. Testing AI agent health...');
  const agentHealthResponse = await axios.get(`${BASE_URL}/api/agent/health`);
  console.log('✅ AI Agent health check passed:', agentHealthResponse.data.message);

  // Test 3: List conversations (should be empty initially)
  console.log('\n3. Testing conversation listing...');
  const conversationsResponse = await axios.get(`${BASE_URL}/api/agent/conversations`);
  console.log('✅ Conversations endpoint working. Active conversations:', conversationsResponse.data.data.activeConversations.length);

  console.log('\n🎉 All basic tests passed! The setup is working correctly.');
  console.log('\n📝 Next steps:');
  console.log('1. Make sure Temporal server is running');
  console.log('2. Start the worker: npm run worker');
  console.log('3. Set up your LLM API keys in .env');
  console.log('4. Try starting a conversation with the API');

 } catch (error) {
  console.error('❌ Test failed:', error.message);
  if (error.code === 'ECONNREFUSED') {
   console.log('\n💡 Make sure the server is running: npm run dev');
  }
  process.exit(1);
 }
}

// Run tests
testSetup(); 